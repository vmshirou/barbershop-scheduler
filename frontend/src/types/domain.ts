export type UserRole = 'ADMIN' | 'BARBER';

export type AppointmentStatus = 'PENDING' | 'SERVED' | 'NO_SHOW';

export interface User {
  id: string;
  name: string;
  phone_number: string;
  password: string;
  rol: UserRole;
}

export interface Client {
  id: string;
  name: string;
  phone_number: string;
  notes: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface Workday {
    id: string;
    datestamp: string;
    start_time: string;
    duration: number;
}

export interface Appointment {
  id: string;
  id_client: string;
  id_service: string;
  id_barber: string;
  id_workday: string;
  start_time: string;
  state: AppointmentStatus;
  notes: string;
}