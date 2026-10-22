from fastapi import APIRouter
from app.routers.specimens import _load
from app.services.anomaly_detector import detect_anomalies

router = APIRouter(prefix="/anomalies", tags=["anomalies"])

@router.get("/")
def list_anomalies():
    data = _load()
    anomalies = detect_anomalies(data["specimens"])
    
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    anomalies.sort(key=lambda a: severity_order.get(a["severity"], 4))
    
    return {
        "total": len(anomalies),
        "by_severity": {
            "critical": sum(1 for a in anomalies if a["severity"] == "critical"),
            "high": sum(1 for a in anomalies if a["severity"] == "high"),
            "medium": sum(1 for a in anomalies if a["severity"] == "medium"),
            "low": sum(1 for a in anomalies if a["severity"] == "low"),
        },
        "anomalies": anomalies,
    }

@router.get("/specimen/{specimen_id}")
def get_specimen_anomalies(specimen_id: str):
    data = _load()
    anomalies = detect_anomalies(data["specimens"])
    filtered = [a for a in anomalies if a["specimen_id"] == specimen_id]
    return {"specimen_id": specimen_id, "anomalies": filtered}