export interface Specimen {
  id: string;
  patient_id: string;
  sample_type: string;
  test_type: string;
  priority: string;
  location: string;
  event_count: number;
  current_stage: string;
}

export interface Event {
  specimen_id: string;
  activity: string;
  location: string;
  operator: string;
  timestamp: string;
  scan_type: string;
}

export interface Journey {
  specimen_id: string;
  events: Event[];
  actual_path: string[];
  expected_path: string[];
  conforms: boolean;
  missing_stages: string[];
}

export interface Anomaly {
  specimen_id: string;
  anomaly_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  stage: string;
  expected_value?: number;
  actual_value?: number;
  deviation_pct?: number;
  message: string;
  detected_at: string;
  status: string;
}

export interface Bottleneck {
  transition: string;
  actual_median: number;
  actual_p95: number;
  expected_median: number;
  expected_p95: number;
  ratio: number;
  severity: string;
  sample_count: number;
}

export interface Overview {
  total_specimens: number;
  total_anomalies: number;
  critical_anomalies: number;
  flagged_specimens: number;
  avg_tat_minutes: number;
}