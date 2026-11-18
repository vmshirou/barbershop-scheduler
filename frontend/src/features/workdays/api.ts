import { apiRequest } from '../../api/client';
import type { Workday } from '../../types/domain';

export interface WorkdayPayload {
  datestamp: string;
  start_time: string;
  duration: number; // minutos  
}

const BASE = '/jornadas';

export function listWorkdays(): Promise<Workday[]> {
  return apiRequest<Workday[]>(BASE);
}

// New endpoint: get workday by date
export function getWorkdayByDate(date: string): Promise<Workday> {
  return apiRequest<Workday>(`${BASE}/por-fecha/${date}`);
}

export function createWorkday(payload: WorkdayPayload): Promise<Workday> {
  return apiRequest<Workday>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkday(id: number, payload: WorkdayPayload): Promise<Workday> {
  return apiRequest<Workday>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}