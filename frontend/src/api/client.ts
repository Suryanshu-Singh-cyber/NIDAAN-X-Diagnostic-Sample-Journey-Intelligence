import axios from 'axios';
import type { Specimen, Journey, Anomaly, Bottleneck, Overview } from '@/types';

const api = axios.create({ baseURL: '/api' });

export const apiClient = {
  getOverview: () => api.get<Overview>('/analytics/overview').then(r => r.data),
  getSpecimens: () => api.get<{ total: number; specimens: Specimen[] }>('/specimens/').then(r => r.data),
  getSpecimen: (id: string) => api.get(`/specimens/${id}`).then(r => r.data),
  getJourney: (id: string) => api.get<Journey>(`/specimens/${id}/journey`).then(r => r.data),
  getAnomalies: () => api.get<{ total: number; by_severity: any; anomalies: Anomaly[] }>('/anomalies/').then(r => r.data),
  getSpecimenAnomalies: (id: string) => api.get<{ anomalies: Anomaly[] }>(`/anomalies/specimen/${id}`).then(r => r.data),
  getBottlenecks: () => api.get<{ bottlenecks: Bottleneck[] }>('/analytics/bottlenecks').then(r => r.data),
    simulateSpecimen: () => api.post('/specimens/simulate').then(r => r.data),
      uploadCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post('/specimens/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  },
};