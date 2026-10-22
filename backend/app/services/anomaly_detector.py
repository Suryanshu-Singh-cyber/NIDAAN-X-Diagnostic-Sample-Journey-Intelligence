from datetime import datetime
from typing import Optional
from app.services.baseline import load_baselines, compute_actual_baselines

def detect_anomalies(specimens: list[dict]) -> list[dict]:
    """Run all anomaly detectors across the dataset."""
    baselines = load_baselines()
    actual = compute_actual_baselines(specimens)
    anomalies = []
    
    for spec in specimens:
        events = sorted(spec["events"], key=lambda e: e["timestamp"])
        detected = _check_specimen(spec, events, baselines, actual)
        anomalies.extend(detected)
    
    return anomalies


def _check_specimen(spec, events, baselines, actual) -> list[dict]:
    results = []
    sid = spec["specimen_id"]
    expected_path = baselines["expected_path"]
    actual_path = [e["activity"] for e in events]
    
    # 1. Missing handoff detection
       # 1. Missing handoff detection
    for i, expected_stage in enumerate(expected_path):
        if expected_stage not in actual_path:
            # Find what stage was completed right before this missing one
            prev_stage = expected_path[i-1] if i > 0 else "collection"
            
            results.append(_make_anomaly(
                sid, "missing_handoff", "critical", prev_stage,
                message=f"Missing '{expected_stage}' handoff after '{prev_stage}'. "
                        f"Sample may be stuck at {prev_stage}. Expected stage not recorded.",
            ))
    
    # 2. Delay detection
    for i in range(len(events) - 1):
        from_stage = events[i]["activity"]
        to_stage = events[i + 1]["activity"]
        key = f"{from_stage}_to_{to_stage}"
        
        t1 = datetime.fromisoformat(events[i]["timestamp"])
        t2 = datetime.fromisoformat(events[i + 1]["timestamp"])
        actual_min = (t2 - t1).total_seconds() / 60
        
        baseline = actual.get(key, baselines.get(key, {}))
        p95 = baseline.get("p95", 120)
        med = baseline.get("median", 40)
        
        if actual_min > p95 * 1.2:
            deviation = ((actual_min - med) / med) * 100
            severity = "critical" if actual_min > p95 * 2 else "high"
            results.append(_make_anomaly(
                sid, "delay", severity, from_stage,
                expected=med, actual=actual_min, deviation=deviation,
                message=f"'{from_stage}' → '{to_stage}' took {actual_min:.0f} min. "
                        f"Expected median: {med:.0f} min, p95: {p95:.0f} min."
            ))
    
    # 3. Duplicate scan detection
    seen = {}
    for e in events:
        key = (e["activity"], e["location"])
        t = datetime.fromisoformat(e["timestamp"])
        if key in seen:
            delta = (t - seen[key]).total_seconds()
            if delta < 120:  # within 2 minutes
                results.append(_make_anomaly(
                    sid, "duplicate_scan", "low", e["activity"],
                    message=f"Duplicate '{e['activity']}' scan at {e['location']} "
                            f"within {delta:.0f}s. Possible scanner glitch."
                ))
        seen[key] = t
    
    return results


def _make_anomaly(sid, atype, severity, stage, expected=None, actual=None,
                  deviation=None, message="") -> dict:
    return {
        "specimen_id": sid,
        "anomaly_type": atype,
        "severity": severity,
        "stage": stage,
        "expected_value": expected,
        "actual_value": actual,
        "deviation_pct": deviation,
        "message": message,
        "detected_at": datetime.now().isoformat(),
        "status": "open",
    }