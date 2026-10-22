from fastapi import APIRouter
from app.routers.specimens import _load
from app.services.baseline import compute_actual_baselines, load_baselines

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/bottlenecks")
def get_bottlenecks():
    data = _load()
    actual = compute_actual_baselines(data["specimens"])
    expected = load_baselines()
    
    bottlenecks = []
    for key, vals in actual.items():
        exp = expected.get(key, {})
        if exp.get("median"):
            ratio = vals["median"] / exp["median"]
            bottlenecks.append({
                "transition": key.replace("_to_", " → "),
                "actual_median": vals["median"],
                "actual_p95": vals["p95"],
                "expected_median": exp["median"],
                "expected_p95": exp["p95"],
                "ratio": round(ratio, 2),
                "severity": "critical" if ratio > 1.5 else "high" if ratio > 1.2 else "normal",
                "sample_count": vals["count"],
            })
    
    bottlenecks.sort(key=lambda b: b["ratio"], reverse=True)
    return {"bottlenecks": bottlenecks}

@router.get("/overview")
def get_overview():
    data = _load()
    actual = compute_actual_baselines(data["specimens"])
    from app.services.anomaly_detector import detect_anomalies
    anomalies = detect_anomalies(data["specimens"])
    
    return {
        "total_specimens": data["total_specimens"],
        "total_anomalies": len(anomalies),
        "critical_anomalies": sum(1 for a in anomalies if a["severity"] == "critical"),
        "flagged_specimens": len(set(a["specimen_id"] for a in anomalies)),
        "avg_tat_minutes": round(
            sum(v["median"] for v in actual.values()) / max(len(actual), 1), 1
        ),
    }