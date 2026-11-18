import {
  Box, Card, CardContent, Chip, Stack, Typography,
} from '@mui/material';
import type {
  Appointment, Client, Service, User, Workday,
} from '../../../types/domain';
import { minutesToTime, timeToMinutes } from '../../../utils/time';
import { AppointmentStatusSelect } from './AppointmentStatusSelect';

interface JornadaTimelineProps {
  jornada: Workday;
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  users: User[];
  currentUserId: string;
  isAdmin: boolean;
  onChangeStatus: () => void;
}

type TimelineItem =
  | { kind: 'gap'; start: number; end: number }
  | { kind: 'appt'; appointment: Appointment; start: number; end: number };

const STATUS_COLORS = {
  PENDING: 'warning',
  SERVED: 'success',
  NO_SHOW: 'error',
} as const;

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  SERVED: 'Atendido',
  NO_SHOW: 'No vino',
} as const;

function buildTimeline(
  jornada: Workday,
  appointments: Appointment[],
  services: Service[],
): TimelineItem[] {
  const sorted = [...appointments].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
  );

  const jornadaStart = timeToMinutes(jornada.start_time);
  const jornadaEnd = jornadaStart + jornada.duration;

  const items: TimelineItem[] = [];
  let cursor = jornadaStart;

  for (const appt of sorted) {
    const start = timeToMinutes(appt.start_time);
    const duration = services.find((s) => s.id === appt.id_service)?.duration ?? 0;
    const end = start + duration;

    if (start > cursor) {
      items.push({ kind: 'gap', start: cursor, end: start });
    }
    items.push({ kind: 'appt', appointment: appt, start, end });
    cursor = Math.max(cursor, end);
  }

  if (cursor < jornadaEnd) {
    items.push({ kind: 'gap', start: cursor, end: jornadaEnd });
  }

  return items;
}

export function JornadaTimeline({
  jornada, appointments, clients, services, users, currentUserId, isAdmin, onChangeStatus,
}: JornadaTimelineProps) {
  console.log(appointments)
  if (appointments.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        No hay turnos cargados para esta jornada.
      </Box>
    );
  }

  const items = buildTimeline(jornada, appointments, services);

  return (
    <Stack spacing={1.5}>
      {items.map((item, index) => {
        if (item.kind === 'gap') {
          return (
            <Box
              key={`gap-${index}`}
              sx={{
                pl: 2,
                py: 1,
                borderLeft: 3,
                borderColor: 'grey.300',
                color: 'text.secondary',
                fontStyle: 'italic',
                fontSize: 14,
              }}
            >
              Libre {minutesToTime(item.start)} – {minutesToTime(item.end)} ({item.end - item.start} min)
            </Box>
          );
        }

        const appt = item.appointment;
        const client = clients.find((c) => c.id === appt.id_client);
        const service = services.find((s) => s.id === appt.id_service);
        const barber = users.find((u) => u.id === appt.id_barber);
        const canChangeStatus = isAdmin || appt.id_barber === currentUserId;

        return (
          <Card key={appt.id} variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{alignItems:{ xs: 'flex-start', sm: 'center' },
                justifyContent: "space-between"}}
                
              >
                <Box>
                  <Stack direction="row" spacing={1} sx={{alignItems:"center", flexWrap:"wrap"}}>
                    <Typography variant="subtitle1" sx={{fontWeight: 600}}>
                      {minutesToTime(item.start)} – {minutesToTime(item.end)}
                    </Typography>
                    <Chip
                      size="small"
                      color={STATUS_COLORS[appt.state]}
                      label={STATUS_LABELS[appt.state]}
                    />
                  </Stack>
                  <Typography variant="body2">
                    {client?.name ?? 'Cliente desconocido'} · {service?.name ?? 'Servicio'} ({service?.duration ?? 0} min)
                  </Typography>
                  {isAdmin && barber && (
                    <Typography variant="caption" color="text.secondary">
                      Peluquero: {barber.name}
                    </Typography>
                  )}
                  {appt.notes && (
                    <Typography variant="caption" color="text.secondary" sx={{display: "block"}}>
                      {appt.notes}
                    </Typography>
                  )}
                </Box>

                {canChangeStatus && (
                  <AppointmentStatusSelect
                    appointmentId={Number(appt.id)}
                    status={appt.state}
                    onChange={onChangeStatus}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}