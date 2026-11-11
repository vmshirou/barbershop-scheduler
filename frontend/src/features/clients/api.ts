import { apiRequest } from '../../api/client';
import type { Client } from '../../types/domain';

export interface ClientPayload {
  name: string;
  phone_number: string;
  notes: string;
}

const BASE = '/clientes';

export function listClients(): Promise<Client[]> {
  return apiRequest<Client[]>(BASE);
}

export function createClient(payload: ClientPayload): Promise<Client> {
  return apiRequest<Client>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateClient(id: string, payload: ClientPayload): Promise<Client> {
  return apiRequest<Client>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteClient(id: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' });
}