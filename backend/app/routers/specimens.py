from fastapi import APIRouter, HTTPException
from app.services.baseline import load_baselines
import json
import random
from pathlib import Path
from app.data.generate_dataset import generate_single_specimen
import pandas as pd
import io
from fastapi import UploadFile, File
from datetime import datetime

router = APIRouter(prefix="/specimens", tags=["specimens"])

DATASET_FILE = Path(__file__).parent.parent / "data" / "synthetic_dataset.json"

def _load():
    if not DATASET_FILE.exists():
        raise HTTPException(500, "Dataset not generated. Run generate_dataset.py")
    return json.loads(DATASET_FILE.read_text())

@router.get("/")
def list_specimens():
    data = _load()
    
    # Sort specimens by ID in reverse so the newest ones (S-REAL, S-2026-9xxx) appear at the top
    sorted_specimens = sorted(data["specimens"], key=lambda x: x["specimen_id"], reverse=True)
    
    return {
        "total": data["total_specimens"],
        "specimens": [
            {
                "id": s["specimen_id"],
                "patient_id": s["patient_id"],
                "sample_type": s["sample_type"],
                "test_type": s["test_type"],
                "priority": s["priority"],
                "location": s["collection_location"],
                "event_count": len(s["events"]),
                "current_stage": s["events"][-1]["activity"],
            }
            for s in sorted_specimens
        ],
    }

@router.get("/{specimen_id}")
def get_specimen(specimen_id: str):
    data = _load()
    for s in data["specimens"]:
        if s["specimen_id"] == specimen_id:
            return s
    raise HTTPException(404, f"Specimen {specimen_id} not found")

@router.get("/{specimen_id}/journey")
def get_journey(specimen_id: str):
    spec = get_specimen(specimen_id)
    baselines = load_baselines()
    events = sorted(spec["events"], key=lambda e: e["timestamp"])
    path = [e["activity"] for e in events]
    expected = baselines["expected_path"]
    
    return {
        "specimen_id": specimen_id,
        "events": events,
        "actual_path": path,
        "expected_path": expected,
        "conforms": path == expected,
        "missing_stages": [s for s in expected if s not in path],
    }

@router.post("/simulate")
def simulate_specimen():
    """Generates a new live specimen and appends it to the dataset."""
    data = _load()
    
    # Generate new data
    new_spec = generate_single_specimen()
    
    # Append to our in-memory/JSON dataset
    data["specimens"].append(new_spec)
    data["total_specimens"] = len(data["specimens"])
    
    # Save back to the JSON file so it persists
    DATASET_FILE.write_text(json.dumps(data, indent=2))
    
    return {"status": "success", "specimen_id": new_spec["specimen_id"]}
@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Ingests real hospital data from a CSV export."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Group by specimen_id to reconstruct journeys
        new_specimens = []
        for sid, group in df.groupby("specimen_id"):
            # Sort by timestamp
            group = group.sort_values("timestamp")
            
            events = []
            for _, row in group.iterrows():
                events.append({
                    "specimen_id": str(sid),
                    "activity": str(row["activity"]),
                    "location": str(row["location"]),
                    "operator": str(row["operator"]),
                    "timestamp": str(row["timestamp"]),
                    "scan_type": "csv_import",
                })
            
            # Create the specimen record
            new_specimens.append({
                "specimen_id": str(sid),
                "patient_id": f"P-{random.randint(10000, 99999)}",
                "sample_type": "Blood", # Default for CSV
                "test_type": "Imported",
                "collection_location": events[0]["location"] if events else "Unknown",
                "priority": "routine",
                "events": events,
                "injected_anomaly": None
            })
        # Load existing data
        data = _load()
        
        # Create a dictionary of existing specimens for quick lookup
        existing_specimens = {s["specimen_id"]: s for s in data["specimens"]}
        
        # Update existing or add new
        for spec in new_specimens:
            existing_specimens[spec["specimen_id"]] = spec
            
        # Convert back to list
        data["specimens"] = list(existing_specimens.values())
        data["total_specimens"] = len(data["specimens"])
        
        # Save to JSON
        DATASET_FILE.write_text(json.dumps(data, indent=2))
        
        return {"status": "success", "imported_specimens": len(new_specimens)}
        
    except Exception as e:
        raise HTTPException(400, f"Failed to process CSV: {str(e)}")