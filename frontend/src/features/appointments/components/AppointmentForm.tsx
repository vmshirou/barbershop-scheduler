import { useEffect, useMemo, useState, type SubmitEvent } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material';
import type {
  Appointment, Client, Service, User, Workday,
} from '../../../types/domain';
import { createAppointment, updateAppointment } from '../api';
import { findConflict } from '../utils/overlap';

interface AppointmentFormProps {
  open: boolean;
  jornada: Workday;
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  barbers: User[];
  initial?: Appointment | null;
  defaultBarberId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AppointmentForm({
  open, jornada, appointments, clients, services, barbers,
  initial, defaultBarberId, onClose, onSaved,
}: AppointmentFormProps) {
  const [clientId, setClientId] = useState<number | ''>('');
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [barberId, setBarberId] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setClientId(initial ? Number(initial.client_id) : '');
    setServiceId(initial ? Number(initial.service_id) : '');
    const defaultBarber = defaultBarberId ? Number(defaultBarberId) : (barbers[0] ? Number(barbers[0].id) : '');
    setBarberId(initial ? Number(initial.barber_id) : defaultBarber);
    setStartTime(initial?.start_time ?? jornada.start_time);
    setNotes(initial?.notes ?? '');
    setServerError(null);
  }, [open, initial, defaultBarberId, barbers, jornada.start_time]);

  const serviceDuration = useMemo(
    () => services.find((s) => s.id === serviceId)?.duration ?? 0,
    [services, serviceId],
  );

  const conflict = useMemo(() => findConflict({
    startTime,
    serviceDuration,
    jornada,
    barberId: barberId as string,
    appointments,
    services,
    excludeAppointmentId: initial?.id,
  }), [startTime, serviceDuration, jornada, barberId, appointments, services, initial?.id]);

  const canSubmit =
    clientId !== '' && serviceId !== '' && barberId !== '' && !!startTime && !conflict;

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        id_client: Number(clientId),
        id_service: Number(serviceId),
        id_barber: Number(barberId),
        id_workday: Number(jornada.id),
        start_time: startTime,
        notes: notes.trim(),
      };

      if (initial) {
        await updateAppointment(Number(initial.id), payload);
      } else {
        await createAppointment(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{initial ? 'Editar turno' : 'Nuevo turno'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <FormControl fullWidth required>
              <InputLabel id="appt-client">Cliente</InputLabel>
              <Select
                labelId="appt-client"
                label="Cliente"
                value={clientId}
                onChange={(e) => setClientId(Number(e.target.value))}
              >
                {clients.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} — {c.phone_number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="appt-service">Servicio</InputLabel>
              <Select
                labelId="appt-service"
                label="Servicio"
                value={serviceId}
                onChange={(e) => setServiceId(Number(e.target.value))}
              >
                {services.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} — {s.duration} min — ${s.price}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="appt-barber">Peluquero</InputLabel>
              <Select
                labelId="appt-barber"
                label="Peluquero"
                value={barberId}
                onChange={(e) => setBarberId(Number(e.target.value))}
              >
                {barbers.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Hora de inicio"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              slotProps={{inputLabel:{ shrink: true }}}
              required
              fullWidth
            />

            {serviceDuration > 0 && startTime && (
              <Typography variant="body2" color="text.secondary">
                Duración del servicio: {serviceDuration} min
              </Typography>
            )}

            {conflict && <Alert severity="warning">{conflict.message}</Alert>}

            <TextField
              label="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={submitting || !canSubmit}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}