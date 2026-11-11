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
    end_time: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  service_id: string;
  barber_id: string;
  workday_id: string;
  start_time: string;
  status: AppointmentStatus;
  notes: string;
}