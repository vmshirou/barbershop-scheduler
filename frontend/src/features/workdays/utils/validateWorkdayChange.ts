import type { Appointment, Service } from '../../../types/domain';
import { minutesToTime, timeToMinutes } from '../../../utils/time';

export function validateWorkdayChange(params: {
  newStartTime: string;
  newDuration: number;      // minutos
  appointments: Appointment[];
  services: Service[];
}): string | null {
  const { newStartTime, newDuration, appointments, services } = params;

  if (appointments.length === 0) return null;

  const newStart = timeToMinutes(newStartTime);
  const newEnd = newStart + newDuration;

  const ranges = appointments.map((a) => {
    const start = timeToMinutes(a.start_time);
    const duration = services.find((s) => s.id === a.service_id)?.duration ?? 0;
    return { start, end: start + duration };
  });

  const firstStart = Math.min(...ranges.map((r) => r.start));
  const lastEnd = Math.max(...ranges.map((r) => r.end));

  if (newStart > firstStart) {
    return `La jornada no puede empezar después de las ${minutesToTime(firstStart)} (primer turno).`;
  }
  if (newEnd < lastEnd) {
    return `La jornada no puede cerrar antes de las ${minutesToTime(lastEnd)} (último turno).`;
  }
  return null;
}