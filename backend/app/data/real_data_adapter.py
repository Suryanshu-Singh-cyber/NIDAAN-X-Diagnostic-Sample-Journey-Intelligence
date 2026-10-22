"""
NIDAAN-X Real Data Adapter
Connects to FHIR servers or HL7 feeds to ingest real specimen journey data.
Supports both synthetic (for demo) and production modes.
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

# FHIR resource mappings for specimen journey
FHIR_STAGE_MAP = {
    "specimen-collection": "collection",
    "specimen-labeling": "labeling",
    "specimen-dispatch": "dispatch",
    "specimen-reception": "lab_reception",
    "specimen-processing": "processing",
    "specimen-testing": "testing",
    "diagnostic-report": "report_generated",
}

class RealDataAdapter:
    """
    Adapter for integrating with real hospital data sources.
    
    Supports:
    - FHIR R4 (HL7 FHIR standard used by modern LIS systems)
    - HL7 v2 (legacy but still widely deployed)
    - CSV/JSON exports from existing LIMS
    
    For production deployment, configure FHIR_BASE_URL in .env
    """
    
    def __init__(self, base_url: Optional[str] = None, auth_token: Optional[str] = None):
        self.base_url = base_url or "http://localhost:8080/fhir"
        self.auth_token = auth_token
        self.client = httpx.Client(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {auth_token}"} if auth_token else {},
            timeout=30.0,
        )
    
    def fetch_specimens(self, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Fetch specimens from FHIR server.
        
        Maps FHIR Specimen + ServiceRequest + DiagnosticReport resources
        into the NIDAAN-X journey format.
        """
        params = {}
        if since:
            params["_lastUpdated"] = f"ge{since.isoformat()}"
        
        try:
            response = self.client.get("/Specimen", params=params)
            response.raise_for_status()
            bundle = response.json()
            
            specimens = []
            for entry in bundle.get("entry", []):
                resource = entry.get("resource", {})
                if resource.get("resourceType") == "Specimen":
                    specimens.append(self._map_fhir_specimen(resource))
            
            logger.info(f"Fetched {len(specimens)} specimens from FHIR server")
            return specimens
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch specimens: {e}")
            return []
    
    def _map_fhir_specimen(self, specimen: Dict) -> Dict:
        """
        Map a FHIR Specimen resource to NIDAAN-X journey format.
        
        FHIR Specimen fields used:
        - id: specimen identifier
        - subject: patient reference
        - type: sample type
        - collection.collectedDateTime: collection time
        - collection.collector: who collected
        - receivedTime: when lab received it
        - status: available, unavailable, etc.
        """
        return {
            "specimen_id": specimen.get("id", "unknown"),
            "patient_id": specimen.get("subject", {}).get("reference", "").split("/")[-1],
            "sample_type": specimen.get("type", {}).get("coding", [{}])[0].get("display", "Unknown"),
            "collection_time": specimen.get("collection", {}).get("collectedDateTime"),
            "collector": specimen.get("collection", {}).get("collector", {}).get("display", "Unknown"),
            "received_time": specimen.get("receivedTime"),
            "status": specimen.get("status", "unknown"),
            "events": self._extract_events_from_fhir(specimen),
        }
    
    def _extract_events_from_fhir(self, specimen: Dict) -> List[Dict]:
        """Extract journey events from FHIR Specimen and related resources."""
        events = []
        
        # Collection event
        if specimen.get("collection", {}).get("collectedDateTime"):
            events.append({
                "activity": "collection",
                "timestamp": specimen["collection"]["collectedDateTime"],
                "location": specimen.get("collection", {}).get("bodySite", {}).get("text", "Unknown"),
                "operator": specimen.get("collection", {}).get("collector", {}).get("display", "Unknown"),
            })
        
        # Reception event
        if specimen.get("receivedTime"):
            events.append({
                "activity": "lab_reception",
                "timestamp": specimen["receivedTime"],
                "location": specimen.get("processing", [{}])[0].get("description", "Lab"),
                "operator": "SYSTEM",
            })
        
        return events
    
    def fetch_diagnostic_reports(self, specimen_id: str) -> Optional[Dict]:
        """Fetch the DiagnosticReport for a specimen (final report)."""
        try:
            response = self.client.get("/DiagnosticReport", params={"specimen": f"Specimen/{specimen_id}"})
            response.raise_for_status()
            bundle = response.json()
            
            if bundle.get("entry"):
                report = bundle["entry"][0]["resource"]
                return {
                    "report_id": report.get("id"),
                    "issued": report.get("issued"),
                    "status": report.get("status"),
                    "conclusion": report.get("conclusion"),
                }
        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch report for {specimen_id}: {e}")
        
        return None


class SyntheticDataLoader:
    """
    Fallback loader using synthetic data for demos and development.
    This is what you use for the hackathon demo.
    """
    
    DATASET_PATH = Path(__file__).parent / "synthetic_dataset.json"
    
    @classmethod
    def load(cls) -> List[Dict]:
        """Load the generated synthetic dataset."""
        if not cls.DATASET_PATH.exists():
            raise FileNotFoundError(
                "Synthetic dataset not found. Run: python -m app.data.generate_dataset"
            )
        
        data = json.loads(cls.DATASET_PATH.read_text())
        return data.get("specimens", [])
    
    @classmethod
    def get_statistics(cls) -> Dict:
        """Compute statistics about the synthetic dataset."""
        specimens = cls.load()
        total_events = sum(len(s["events"]) for s in specimens)
        
        return {
            "total_specimens": len(specimens),
            "total_events": total_events,
            "avg_events_per_specimen": round(total_events / max(len(specimens), 1), 1),
            "specimen_types": list(set(s["sample_type"] for s in specimens)),
            "test_types": list(set(s["test_type"] for s in specimens)),
            "locations": list(set(s["collection_location"] for s in specimens)),
        }


class DataService:
    """
    Unified data service that abstracts between real and synthetic data.
    
    Usage:
        service = DataService()
        specimens = service.get_specimens()  # auto-selects source
    """
    
    def __init__(self):
        self.adapter = None
        self.mode = "synthetic"
        
        if settings.USE_REAL_DATA and settings.FHIR_BASE_URL:
            self.adapter = RealDataAdapter(
                base_url=settings.FHIR_BASE_URL,
                auth_token=settings.FHIR_AUTH_TOKEN,
            )
            self.mode = "fhir"
            logger.info(f"DataService initialized in FHIR mode: {settings.FHIR_BASE_URL}")
        else:
            logger.info("DataService initialized in synthetic mode")
    
    def get_specimens(self) -> List[Dict]:
        """Get specimens from the configured data source."""
        if self.mode == "fhir" and self.adapter:
            return self.adapter.fetch_specimens()
        return SyntheticDataLoader.load()
    
    def get_statistics(self) -> Dict:
        """Get dataset statistics."""
        if self.mode == "synthetic":
            return SyntheticDataLoader.get_statistics()
        
        specimens = self.get_specimens()
        return {
            "total_specimens": len(specimens),
            "total_events": sum(len(s.get("events", [])) for s in specimens),
            "mode": self.mode,
        }


# Singleton instance
data_service = DataService()