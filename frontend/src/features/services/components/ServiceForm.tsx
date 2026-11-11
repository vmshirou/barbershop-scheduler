import { useEffect, useState, type SubmitEvent } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import { ApiError } from '../../../api/client';
import { createService, updateService } from '../api';
import type { Service } from '../../../types/domain';

interface ServiceFormProps {
  open: boolean;
  initial?: Service | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ServiceForm({ open, initial, onClose, onSaved }: ServiceFormProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('0');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setDuration(String(initial?.duration ?? 30));
    setPrice(String(initial?.price ?? 0));
    setTouched(false);
    setServerError(null);
  }, [open, initial]);

  const durationNumber = Number(duration);
  const priceNumber = Number(price);

  const errors = {
    name: name.trim() ? null : 'El nombre es obligatorio',
    duration:
      Number.isFinite(durationNumber) && durationNumber > 0
        ? null
        : 'La duración debe ser mayor a 0',
    price:
      Number.isFinite(priceNumber) && priceNumber >= 0
        ? null
        : 'El precio no puede ser negativo',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (hasErrors) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        name: name.trim(),
        duration: durationNumber,
        price: priceNumber,
      };

      if (initial) {
        await updateService(initial.id, payload);
      } else {
        await createService(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setServerError(err.message);
      } else {
        setServerError(err instanceof Error ? err.message : 'No se pudo guardar');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{initial ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <TextField
              label="Nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={touched && !!errors.name}
              helperText={touched ? errors.name : ' '}
              required
              autoFocus
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Duración"
                type="number"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                error={touched && !!errors.duration}
                helperText={touched ? errors.duration : ' '}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">min</InputAdornment>,
                  },
                }}
                required
                fullWidth
              />
              <TextField
                label="Precio"
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                error={touched && !!errors.price}
                helperText={touched ? errors.price : ' '}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  },
                }}
                required
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}