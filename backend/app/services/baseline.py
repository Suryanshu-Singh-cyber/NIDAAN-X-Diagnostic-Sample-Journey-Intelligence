import json
from pathlib import Path
from statistics import median

BASELINE_FILE = Path(__file__).parent.parent / "data" / "baselines.json"

def load_baselines() -> dict:
    return json.loads(BASELINE_FILE.read_text())

def compute_actual_baselines(specimens: list[dict]) -> dict:
    """Compute median + p95 from actual event data for each transition."""
    transitions = {}
    
    for spec in specimens:
        events = sorted(spec["events"], key=lambda e: e["timestamp"])
        for i in range(len(events) - 1):
            from_stage = events[i]["activity"]
            to_stage = events[i + 1]["activity"]
            key = f"{from_stage}_to_{to_stage}"
            
            from datetime import datetime
            t1 = datetime.fromisoformat(events[i]["timestamp"])
            t2 = datetime.fromisoformat(events[i + 1]["timestamp"])
            delta = (t2 - t1).total_seconds() / 60  # minutes
            
            transitions.setdefault(key, []).append(delta)
    
    result = {}
    for key, values in transitions.items():
        values_sorted = sorted(values)
        n = len(values_sorted)
        p95_idx = int(n * 0.95)
        result[key] = {
            "median": round(median(values), 1),
            "p95": round(values_sorted[min(p95_idx, n - 1)], 1),
            "count": n,
        }
    return result