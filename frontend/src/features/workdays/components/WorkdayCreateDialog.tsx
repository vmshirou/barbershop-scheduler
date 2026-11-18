import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import { ApiError } from '../../../api/client';
import { formatDateLabel } from '../../../utils/date';
import { createWorkday } from '../api';

interface WorkdayCreateDialogProps {
  open: boolean;
  datestamp: string;
  onClose: () => void;
  onSaved: () => void;
}

export function WorkdayCreateDialog({ open, datestamp, onClose, onSaved }: WorkdayCreateDialogProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [hours, setHours] = useState('8');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStartTime('09:00');
    setHours('8');
    setTouched(false);
    setServerError(null);
  }, [open]);

  const durationMinutes = Math.round(Number(hours) * 60);
  const durationError =
    Number.isFinite(durationMinutes) && durationMinutes > 0
      ? null
      : 'Ingresá una duración mayor a 0.';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (durationError) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await createWorkday({
        datestamp,
        start_time: startTime,
        duration: durationMinutes,
      });
      onSaved();
      onClose();
    } catch (err) {
      setServerError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'No se pudo crear la jornada',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>Nueva jornada</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {formatDateLabel(datestamp)}
            </Typography>

            {serverError && <Alert severity="error">{serverError}</Alert>}

            <TextField
              label="Hora de inicio"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              required
              fullWidth
            />

            <TextField
              label="Duración"
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              error={touched && !!durationError}
              helperText={touched ? durationError : 'Se guarda en minutos internamente'}
              slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">hs</InputAdornment>,
                  },
                  htmlInput: {
                    step: 0.5,
                    min: 0.5,
                  },
                }}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear jornada'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}