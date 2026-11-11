import { apiRequest } from '../../api/client';
import type { Service } from '../../types/domain';

export interface ServicePayload {
  name: string;
  duration: number;
  price: number;
}

const BASE = '/servicios';

export function listServices(): Promise<Service[]> {
  return apiRequest<Service[]>(BASE);
}

export function createService(payload: ServicePayload): Promise<Service> {
  return apiRequest<Service>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateService(id: string, payload: ServicePayload): Promise<Service> {
  return apiRequest<Service>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteService(id: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' });
}