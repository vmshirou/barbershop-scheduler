import type { Appointment, Service, Workday } from '../../../types/domain';
import { minutesToTime, rangesOverlap, timeToMinutes } from '../../../utils/time';

export type ConflictType = 'overlap' | 'before-jornada' | 'after-jornada';

export interface Conflict {
  type: ConflictType;
  message: string;
}

export function findConflict(params: {
  startTime: string;
  serviceDuration: number;
  jornada: Workday;
  barberId: string;
  appointments: Appointment[];
  services: Service[];
  excludeAppointmentId?: string;
}): Conflict | null {
  const {
    startTime, serviceDuration, jornada, barberId,
    appointments, services, excludeAppointmentId,
  } = params;

  if (!startTime || !serviceDuration || !barberId) return null;

  const start = timeToMinutes(startTime);
  const end = start + serviceDuration;
  const jornadaStart = timeToMinutes(jornada.start_time);
  const jornadaEnd = jornadaStart + jornada.duration;

  if (start < jornadaStart) {
    return {
      type: 'before-jornada',
      message: `El turno empieza antes del inicio de la jornada (${jornada.start_time}).`,
    };
  }
  if (end > jornadaEnd) {
    return {
      type: 'after-jornada',
      message: `El turno termina después del cierre de la jornada (${minutesToTime(jornadaEnd)}).`,
    };
  }

  const conflict = appointments
    .filter((a) => a.id !== excludeAppointmentId && a.barber_id === barberId)
    .find((a) => {
      const aStart = timeToMinutes(a.start_time);
      const aDuration = services.find((s) => s.id === a.service_id)?.duration ?? 0;
      return rangesOverlap(start, end, aStart, aStart + aDuration);
    });

  if (conflict) {
    const aDuration = services.find((s) => s.id === conflict.service_id)?.duration ?? 0;
    const aEnd = timeToMinutes(conflict.start_time) + aDuration;
    return {
      type: 'overlap',
      message: `Se solapa con un turno existente de ${conflict.start_time} a ${minutesToTime(aEnd)}.`,
    };
  }

  return null;
}