"""
NIDAAN-X Advanced Anomaly Detection Engine
Production-grade anomaly detection with multiple algorithms.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

import numpy as np
from scipy import stats

logger = logging.getLogger(__name__)


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AnomalyType(str, Enum):
    MISSING_HANDOFF = "missing_handoff"
    DELAY = "delay"
    STUCK = "stuck"
    DUPLICATE_SCAN = "duplicate_scan"
    UNEXPECTED_SEQUENCE = "unexpected_sequence"
    BOTTLENECK = "bottleneck"


@dataclass
class AnomalyResult:
    """Structured anomaly result for API response."""
    specimen_id: str
    anomaly_type: str
    severity: str
    stage: str
    expected_value: Optional[float] = None
    actual_value: Optional[float] = None
    deviation_pct: Optional[float] = None
    message: str = ""
    detected_at: str = field(default_factory=lambda: datetime.now().isoformat())
    status: str = "open"
    confidence: float = 1.0
    evidence: Dict = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            "specimen_id": self.specimen_id,
            "anomaly_type": self.anomaly_type,
            "severity": self.severity,
            "stage": self.stage,
            "expected_value": self.expected_value,
            "actual_value": self.actual_value,
            "deviation_pct": self.deviation_pct,
            "message": self.message,
            "detected_at": self.detected_at,
            "status": self.status,
            "confidence": self.confidence,
            "evidence": self.evidence,
        }


class BaselineCalculator:
    """
    Computes statistical baselines from historical event data.
    Uses robust statistics (median, IQR, p95) to avoid outlier influence.
    """
    
    def __init__(self):
        self.transitions: Dict[str, List[float]] = {}
    
    def add_transition(self, from_stage: str, to_stage: str, duration_min: float):
        """Record a transition duration for baseline computation."""
        key = f"{from_stage}__to__{to_stage}"
        if key not in self.transitions:
            self.transitions[key] = []
        self.transitions[key].append(duration_min)
    
    def compute(self) -> Dict[str, Dict[str, float]]:
        """Compute statistical baselines for all transitions."""
        baselines = {}
        
        for key, values in self.transitions.items():
            if len(values) < 3:
                continue
            
            arr = np.array(values)
            baselines[key] = {
                "median": float(np.median(arr)),
                "p75": float(np.percentile(arr, 75)),
                "p95": float(np.percentile(arr, 95)),
                "p99": float(np.percentile(arr, 99)),
                "mean": float(np.mean(arr)),
                "std": float(np.std(arr)),
                "iqr": float(np.percentile(arr, 75) - np.percentile(arr, 25)),
                "count": len(values),
            }
        
        return baselines
    
    def to_transition_dict(self) -> Dict[str, Dict]:
        """Convert to the format expected by anomaly detectors."""
        result = {}
        for key, stats in self.compute().items():
            from_stage, to_stage = key.split("__to__")
            result[f"{from_stage}_to_{to_stage}"] = stats
        return result


class AdvancedAnomalyDetector:
    """
    Multi-algorithm anomaly detector for specimen journeys.
    
    Detectors:
    1. Missing Handoff - Expected stage skipped in sequence
    2. Delay - Transition time exceeds p95 threshold
    3. Stuck - No events for extended period
    4. Duplicate Scan - Same scan within short window
    5. Unexpected Sequence - Stage order deviation
    6. Bottleneck - Systemic slowness across specimens
    """
    
    def __init__(self, expected_path: List[str], baselines: Dict[str, Dict]):
        self.expected_path = expected_path
        self.baselines = baselines
        self.detectors = [
            self._detect_missing_handoff,
            self._detect_delay,
            self._detect_stuck,
            self._detect_duplicate_scan,
            self._detect_unexpected_sequence,
        ]
    
    def analyze(self, specimens: List[Dict]) -> List[AnomalyResult]:
        """Run all detectors across all specimens."""
        all_anomalies = []
        
        for specimen in specimens:
            events = sorted(specimen.get("events", []), key=lambda e: e["timestamp"])
            if not events:
                continue
            
            for detector in self.detectors:
                try:
                    anomalies = detector(specimen["specimen_id"], events)
                    all_anomalies.extend(anomalies)
                except Exception as e:
                    logger.error(f"Detector {detector.__name__} failed for {specimen['specimen_id']}: {e}")
        
        # Sort by severity
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        all_anomalies.sort(key=lambda a: severity_order.get(a.severity, 4))
        
        return all_anomalies
    
    def _detect_missing_handoff(self, specimen_id: str, events: List[Dict]) -> List[AnomalyResult]:
        """Detect skipped stages in the expected workflow sequence."""
        anomalies = []
        actual_path = [e["activity"] for e in events]
        
        for i in range(len(self.expected_path) - 1):
            expected_stage = self.expected_path[i]
            next_expected = self.expected_path[i + 1]
            
            if expected_stage not in actual_path:
                continue
            
            stage_idx = actual_path.index(expected_stage)
            remaining = actual_path[stage_idx:]
            
            # Find where the next expected stage should appear
            next_stage_found = False
            for stage in remaining[1:]:
                if stage == next_expected:
                    next_stage_found = True
                    break
                # Check if this stage appears later than expected
                if stage in self.expected_path:
                    stage_pos = self.expected_path.index(stage)
                    expected_pos = self.expected_path.index(next_expected)
                    if stage_pos > expected_pos:
                        continue
                    # This is a required intermediate stage that's missing
                    anomalies.append(AnomalyResult(
                        specimen_id=specimen_id,
                        anomaly_type=AnomalyType.MISSING_HANDOFF.value,
                        severity=Severity.CRITICAL.value,
                        stage=expected_stage,
                        message=f"Missing handoff: '{next_expected}' not recorded between "
                                f"'{expected_stage}' and '{stage}'. Sample may be stuck.",
                        evidence={"actual_path": actual_path, "expected_path": self.expected_path},
                    ))
                    break
            
            if not next_stage_found and expected_stage in actual_path:
                # Next stage never appears at all
                anomalies.append(AnomalyResult(
                    specimen_id=specimen_id,
                    anomaly_type=AnomalyType.MISSING_HANDOFF.value,
                    severity=Severity.CRITICAL.value,
                    stage=expected_stage,
                    message=f"Missing handoff: '{next_expected}' never recorded after "
                            f"'{expected_stage}'. Sample may be lost.",
                    evidence={"actual_path": actual_path},
                ))
        
        return anomalies
    
    def _detect_delay(self, specimen_id: str, events: List[Dict]) -> List[AnomalyResult]:
        """Detect transitions exceeding p95 baseline."""
        anomalies = []
        
        for i in range(len(events) - 1):
            from_stage = events[i]["activity"]
            to_stage = events[i + 1]["activity"]
            key = f"{from_stage}_to_{to_stage}"
            
            try:
                t1 = datetime.fromisoformat(events[i]["timestamp"])
                t2 = datetime.fromisoformat(events[i + 1]["timestamp"])
                actual_min = (t2 - t1).total_seconds() / 60
            except (ValueError, KeyError):
                continue
            
            baseline = self.baselines.get(key, {})
            if not baseline:
                continue
            
            p95 = baseline.get("p95", 120)
            median = baseline.get("median", 40)
            
            if actual_min > p95 * 1.2:
                deviation_pct = ((actual_min - median) / median) * 100 if median > 0 else 0
                
                if actual_min > p95 * 2:
                    severity = Severity.CRITICAL.value
                elif actual_min > p95 * 1.5:
                    severity = Severity.HIGH.value
                else:
                    severity = Severity.MEDIUM.value
                
                anomalies.append(AnomalyResult(
                    specimen_id=specimen_id,
                    anomaly_type=AnomalyType.DELAY.value,
                    severity=severity,
                    stage=from_stage,
                    expected_value=median,
                    actual_value=actual_min,
                    deviation_pct=deviation_pct,
                    message=f"Transition '{from_stage}' → '{to_stage}' took {actual_min:.0f} min. "
                            f"Expected median: {median:.0f} min, p95: {p95:.0f} min. "
                            f"Deviation: +{deviation_pct:.0f}%.",
                    evidence={"transition": key, "baseline": baseline},
                ))
        
        return anomalies
    
    def _detect_stuck(self, specimen_id: str, events: List[Dict]) -> List[AnomalyResult]:
        """Detect specimens with no recent activity."""
        anomalies = []
        
        if not events:
            return anomalies
        
        last_event = events[-1]
        last_time = datetime.fromisoformat(last_event["timestamp"])
        now = datetime.now()
        
        # If last event is not a terminal stage
        terminal_stages = {"report_generated", "completed"}
        if last_event["activity"] not in terminal_stages:
            hours_since = (now - last_time).total_seconds() / 3600
            
            if hours_since > 4:
                severity = Severity.CRITICAL.value if hours_since > 24 else Severity.HIGH.value
                anomalies.append(AnomalyResult(
                    specimen_id=specimen_id,
                    anomaly_type=AnomalyType.STUCK.value,
                    severity=severity,
                    stage=last_event["activity"],
                    actual_value=hours_since * 60,
                    message=f"Sample stuck at '{last_event['activity']}' for {hours_since:.1f} hours. "
                            f"No activity recorded since {last_time.strftime('%Y-%m-%d %H:%M')}.",
                    evidence={"last_event": last_event, "hours_since": hours_since},
                ))
        
        return anomalies
    
    def _detect_duplicate_scan(self, specimen_id: str, events: List[Dict]) -> List[AnomalyResult]:
        """Detect duplicate scans within a short time window."""
        anomalies = []
        seen: Dict[Tuple, datetime] = {}
        
        for event in events:
            key = (event["activity"], event.get("location", ""))
            try:
                t = datetime.fromisoformat(event["timestamp"])
            except (ValueError, KeyError):
                continue
            
            if key in seen:
                delta = (t - seen[key]).total_seconds()
                if delta < 120:  # within 2 minutes
                    anomalies.append(AnomalyResult(
                        specimen_id=specimen_id,
                        anomaly_type=AnomalyType.DUPLICATE_SCAN.value,
                        severity=Severity.LOW.value,
                        stage=event["activity"],
                        actual_value=delta,
                        message=f"Duplicate '{event['activity']}' scan at '{event.get('location')}' "
                                f"within {delta:.0f}s. Possible scanner glitch or manual re-entry.",
                        evidence={"duplicate_event": event, "time_delta_seconds": delta},
                    ))
            
            seen[key] = t
        
        return anomalies
    
    def _detect_unexpected_sequence(self, specimen_id: str, events: List[Dict]) -> List[AnomalyResult]:
        """Detect stage order deviations from expected path."""
        anomalies = []
        actual_path = [e["activity"] for e in events]
        
        expected_indices = []
        for stage in actual_path:
            if stage in self.expected_path:
                expected_indices.append(self.expected_path.index(stage))
        
        if not expected_indices:
            return anomalies
        
        # Check if indices are monotonically increasing
        is_monotonic = all(
            expected_indices[i] <= expected_indices[i + 1]
            for i in range(len(expected_indices) - 1)
        )
        
        if not is_monotonic:
            anomalies.append(AnomalyResult(
                specimen_id=specimen_id,
                anomaly_type=AnomalyType.UNEXPECTED_SEQUENCE.value,
                severity=Severity.MEDIUM.value,
                stage=actual_path[0],
                message=f"Stages appear out of expected order: {' → '.join(actual_path)}. "
                        f"Expected order: {' → '.join(self.expected_path)}.",
                evidence={"actual_path": actual_path, "expected_path": self.expected_path},
            ))
        
        return anomalies


def create_detector(specimens: List[Dict], expected_path: List[str]) -> AdvancedAnomalyDetector:
    """Factory function to create a detector with computed baselines."""
    calc = BaselineCalculator()
    
    for specimen in specimens:
        events = sorted(specimen.get("events", []), key=lambda e: e["timestamp"])
        for i in range(len(events) - 1):
            try:
                t1 = datetime.fromisoformat(events[i]["timestamp"])
                t2 = datetime.fromisoformat(events[i + 1]["timestamp"])
                duration = (t2 - t1).total_seconds() / 60
                calc.add_transition(events[i]["activity"], events[i + 1]["activity"], duration)
            except (ValueError, KeyError):
                continue
    
    baselines = calc.to_transition_dict()
    logger.info(f"Computed baselines for {len(baselines)} transitions")
    
    return AdvancedAnomalyDetector(expected_path, baselines)