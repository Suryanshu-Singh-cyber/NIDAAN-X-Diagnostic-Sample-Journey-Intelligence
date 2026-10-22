"""
NIDAAN-X Synthetic Dataset Generator
Generates realistic specimen journeys based on NHM India guidelines.
"""
import random
import json
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

SAMPLE_TYPES = ["Blood", "Urine", "Tissue", "Serum", "Plasma"]
TEST_TYPES = ["CBC", "LFT", "KFT", "Lipid Profile", "Thyroid", "Biopsy", "Culture"]
LOCATIONS = ["OPD-A", "OPD-B", "ICU", "Emergency", "Ward-3", "Ward-7"]
OPERATORS = [f"NURSE-{i:02d}" for i in range(1, 10)] + [f"TECH-{i:02d}" for i in range(1, 8)]

# Baseline transitions (minutes) from NHM India guidelines
TRANSITIONS = {
    "collection_to_labeling": (2, 5),
    "labeling_to_dispatch": (45, 120),
    "dispatch_to_reception": (90, 420),
    "reception_to_processing": (40, 120),
    "processing_to_testing": (30, 60),
    "testing_to_report": (90, 240),
}

STAGES = ["collection", "labeling", "dispatch", "lab_reception", 
          "processing", "testing", "report_generated"]


def generate_normal_journey(specimen_id: str, start_time: datetime) -> dict:
    """Generate a specimen that follows the expected path within baselines."""
    events = []
    current_time = start_time
    
    for i, stage in enumerate(STAGES):
        events.append({
            "specimen_id": specimen_id,
            "activity": stage,
            "location": random.choice(LOCATIONS),
            "operator": random.choice(OPERATORS),
            "timestamp": current_time.isoformat(),
            "scan_type": "qr",
        })
        
        # Add transition time to next stage
        if i < len(STAGES) - 1:
            trans_key = f"{stage}_to_{STAGES[i+1]}"
            if trans_key in TRANSITIONS:
                median, p95 = TRANSITIONS[trans_key]
                # Normal = between median and p95
                delay = random.gauss(median, (p95 - median) / 2)
                delay = max(median * 0.5, min(delay, p95 * 0.9))
            else:
                delay = random.randint(2, 10)
            current_time += timedelta(minutes=delay)
    
    return {
        "specimen_id": specimen_id,
        "patient_id": f"P-{random.randint(10000, 99999)}",
        "sample_type": random.choice(SAMPLE_TYPES),
        "test_type": random.choice(TEST_TYPES),
        "collection_location": random.choice(LOCATIONS),
        "priority": random.choice(["routine", "routine", "routine", "urgent"]),
        "events": events,
    }


def generate_anomalous_journey(specimen_id: str, start_time: datetime, anomaly_type: str) -> dict:
    """Generate a specimen with a specific anomaly injected."""
    journey = generate_normal_journey(specimen_id, start_time)
    events = journey["events"]
    
    if anomaly_type == "missing_handoff":
        # Remove processing event (S-1047 scenario)
        events = [e for e in events if e["activity"] != "processing"]
    
    elif anomaly_type == "stuck":
        # Push testing event 6 hours later
        for e in events:
            if e["activity"] == "testing":
                dt = datetime.fromisoformat(e["timestamp"]) + timedelta(hours=6)
                e["timestamp"] = dt.isoformat()
    
    elif anomaly_type == "duplicate_scan":
        # Duplicate the labeling event 30 seconds later
        for e in events:
            if e["activity"] == "labeling":
                dup = e.copy()
                dt = datetime.fromisoformat(e["timestamp"]) + timedelta(seconds=30)
                dup["timestamp"] = dt.isoformat()
                events.insert(events.index(e) + 1, dup)
                break
    
    elif anomaly_type == "delayed":
        # Add 5-hour delay between dispatch and reception
        for e in events:
            if e["activity"] == "lab_reception":
                dt = datetime.fromisoformat(e["timestamp"]) + timedelta(hours=5)
                e["timestamp"] = dt.isoformat()
                # Push all subsequent events too
                idx = events.index(e)
                for later in events[idx + 1:]:
                    ldt = datetime.fromisoformat(later["timestamp"]) + timedelta(hours=5)
                    later["timestamp"] = ldt.isoformat()
                break
    
    journey["events"] = events
    journey["injected_anomaly"] = anomaly_type
    return journey

def generate_dataset(num_specimens: int = 50, num_anomalies: int = 5) -> dict:
    """Generate full dataset with normal + anomalous specimens."""
    base_time = datetime(2026, 9, 28, 8, 0, 0)
    specimens = []
    
    # We want specific anomalies for specific IDs for the demo
    anomaly_types = ["missing_handoff", "stuck", "duplicate_scan", "delayed", "stuck"]
    
    # Normal specimens (some finished, some in-progress)
    for i in range(num_specimens - num_anomalies):
        sid = f"S-2026-{1000 + i}"
        start = base_time + timedelta(minutes=random.randint(0, 240))
        journey = generate_normal_journey(sid, start)
        
        # Make some journeys stop halfway through so they look "live"
        if i % 3 == 0:
            journey["events"] = journey["events"][:random.randint(2, 4)]
        elif i % 3 == 1:
            journey["events"] = journey["events"][:random.randint(4, 6)]
            
        specimens.append(journey)
    
    # Anomalous specimens
    for i, atype in enumerate(anomaly_types[:num_anomalies]):
        sid = f"S-2026-{1000 + num_specimens - num_anomalies + i}"
        start = base_time + timedelta(minutes=random.randint(0, 120))
        journey = generate_anomalous_journey(sid, start, atype)
        
        # Force S-1047 to be the exact "missing handoff" demo (remove processing)
        if sid == "S-2026-1047":
            journey["events"] = [e for e in journey["events"] if e["activity"] != "processing"]
            journey["injected_anomaly"] = "missing_handoff"
            
        specimens.append(journey)
    
    return {
        "generated_at": datetime.now().isoformat(),
        "total_specimens": len(specimens),
        "specimens": specimens,
    }
def generate_single_specimen() -> dict:
    """Generates one random specimen for live simulation."""
    sid = f"S-2026-{random.randint(2000, 9999)}"
    # Start time is a few hours ago
    start = datetime.now() - timedelta(minutes=random.randint(30, 180))
    
    # 25% chance it's an anomalous sample to make the demo exciting
    if random.random() < 0.25:
        atype = random.choice(["missing_handoff", "stuck", "delayed"])
        journey = generate_anomalous_journey(sid, start, atype)
    else:
        journey = generate_normal_journey(sid, start)
        # Randomly cut off the journey so it looks "in progress"
        if random.random() < 0.5:
            journey["events"] = journey["events"][:random.randint(2, 5)]
            
    return journey


if __name__ == "__main__":
    dataset = generate_dataset(50, 5)
    output = Path(__file__).parent / "synthetic_dataset.json"
    output.write_text(json.dumps(dataset, indent=2))
    print(f"✅ Generated {dataset['total_specimens']} specimens → {output}")
    print(f"   Normal: {50 - 5}")
    print(f"   Anomalous: 5 (missing_handoff, stuck, duplicate_scan, delayed, stuck)")