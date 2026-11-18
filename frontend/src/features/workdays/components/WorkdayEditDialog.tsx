import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  InputAdornment, Stack, TextField,
} from '@mui/material';
import type { Appointment, Service, Workday } from '../../../types/domain';
import { updateWorkday } from '../api';
import { validateWorkdayChange } from '../utils/validateWorkdayChange';

interface WorkdayEditDialogProps {
  open: boolean;
  jornada: Workday;
  appointments: Appointment[];
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
}

export function WorkdayEditDialog({
  open, jornada, appointments, services, onClose, onSaved,
}: WorkdayEditDialogProps) {
  const [startTime, setStartTime] = useState(jornada.start_time);
  const [hours, setHours] = useState(String(jornada.duration / 60));
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStartTime(jornada.start_time);
    setHours(String(jornada.duration / 60));
    setTouched(false);
    setServerError(null);
  }, [open, jornada]);

  const durationMinutes = Math.round(Number(hours) * 60);

  const validationError = useMemo(() => {
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return 'Ingresá una duración mayor a 0.';
    }
    return validateWorkdayChange({
      newStartTime: startTime,
      newDuration: durationMinutes,
      appointments,
      services,
    });
  }, [startTime, durationMinutes, appointments, services]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (validationError) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await updateWorkday(Number(jornada.id), {
        datestamp: jornada.datestamp,
        start_time: startTime,
        duration: durationMinutes,
      });
      onSaved();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo actualizar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>Editar jornada</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <TextField
              label="Hora de inicio"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              slotProps={{inputLabel: { shrink: true }}}
              required
              fullWidth
            />

            <TextField
              label="Duración"
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              slotProps={{
                    input: { 
                        endAdornment: <InputAdornment position="end">hs</InputAdornment> 
                    },
                    htmlInput: {
                         step: 0.5, min: 0.5
                    }
                }}
              required
              fullWidth
            />

            {touched && validationError && (
              <Alert severity="warning">{validationError}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={submitting || !!validationError}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}