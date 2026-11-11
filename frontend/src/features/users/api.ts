import { apiRequest } from '../../api/client';
import type { User, UserRole } from '../../types/domain';

export interface UserPayload {
  name: string;
  phone_number: string;
  rol: UserRole;
  password: string;
}

const BASE = '/usuarios';

export function listUsers(): Promise<User[]> {
  return apiRequest<User[]>(BASE);
}

export function createUser(payload: UserPayload): Promise<User> {
  return apiRequest<User>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: string, payload: UserPayload): Promise<User> {
  return apiRequest<User>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' });
}