import pandas as pd
import random
from datetime import datetime, timedelta

rows = []
base_time = datetime(2026, 10, 21, 8, 0, 0)
# Added "processing" to match your backend expected path
stages = ["collection", "labeling", "dispatch", "lab_reception", "processing", "testing", "report_generated"]
locations = ["OPD-1", "ICU-A", "Ward-3", "Emergency", "OT-2"]

# Generate 25 specimens (will result in ~150 rows)
for i in range(25):
    sid = f"S-REAL-{100+i}"
    start = base_time + timedelta(minutes=random.randint(0, 120))
    loc = random.choice(locations)
    
    curr_time = start
    for stage in stages:
        # For every 4th sample, skip the 'processing' stage to trigger a Critical Missing Handoff anomaly
        if stage == "processing" and i % 4 == 0:
            continue
            
        rows.append({
            "specimen_id": sid,
            "activity": stage,
            "timestamp": curr_time.strftime('%Y-%m-%dT%H:%M:%S'),
            "location": loc,
            "operator": f"NURSE-{random.randint(1,9)}"
        })
        # Add random delay between stages (15 to 90 minutes)
        curr_time += timedelta(minutes=random.randint(15, 90))

# Save to CSV
df = pd.DataFrame(rows)
df.to_csv("hospital_export.csv", index=False)
print(f"SUCCESS: Generated hospital_export.csv with {len(df)} rows!")