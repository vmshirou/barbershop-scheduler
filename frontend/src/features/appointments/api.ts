import { apiRequest } from '../../api/client';
import type { Appointment, AppointmentStatus, Client, Service, User, Workday } from '../../types/domain';

// Backend expects these field names (snake_case with id_ prefix)
export interface AppointmentPayload {
  id_client: number;
  id_service: number;
  id_barber: number;
  id_workday: number;
  start_time: string; // HH:MM format
  notes: string;
}

// Response types for the workday detail endpoint
export interface WorkdayDetailAppointment extends Appointment {
  client: Client;
  service: Service;
  barber: User;
}

export interface WorkdayDetailResponse {
  workday: Workday;
  appointments: WorkdayDetailAppointment[];
  clients: Client[];
  services: Service[];
  barbers: User[];
}

const BASE = '/turnos';

export function listAppointmentsByWorkday(workdayId: number): Promise<Appointment[]> {
  return apiRequest<Appointment[]>(`${BASE}/jornada/${workdayId}`);
}

// New endpoint: get appointments for a specific barber in a workday
export function listAppointmentsByWorkdayAndBarber(workdayId: number, barberId: number): Promise<Appointment[]> {
  return apiRequest<Appointment[]>(`${BASE}/jornada/${workdayId}/barbero/${barberId}`);
}

export function createAppointment(payload: AppointmentPayload): Promise<Appointment> {
  return apiRequest<Appointment>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAppointment(id: number, payload: Partial<AppointmentPayload>): Promise<Appointment> {
  return apiRequest<Appointment>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// Backend expects "state" not "status"
export function updateAppointmentStatus(
  id: number,
  state: AppointmentStatus,
): Promise<Appointment> {
  return apiRequest<Appointment>(`${BASE}/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ state }),
  });
}

export function deleteAppointment(id: number): Promise<void> {
  return apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' });
}

// New endpoint: get complete workday detail (appointments, clients, services, barbers)
// Returns different data based on user role (admin vs barber)
export function getWorkdayDetail(workdayId: number): Promise<WorkdayDetailResponse> {
  return apiRequest<WorkdayDetailResponse>(`${BASE}/jornada/${workdayId}/detalle`);
}