import { useEffect, useState, type SubmitEvent } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { ApiError } from '../../../api/client';
import { createClient, updateClient } from '../api';
import type { Client } from '../../../types/domain';

interface ClientFormProps {
  open: boolean;
  initial?: Client | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ClientForm({ open, initial, onClose, onSaved }: ClientFormProps) {
  const [name, setName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setPhoneNumber(initial?.phone_number ?? '');
    setNotes(initial?.notes ?? '');
    setTouched(false);
    setServerError(null);
  }, [open, initial]);

  const errors = {
    name: name.trim() ? null : 'El nombre es obligatorio',
    telefono: phone_number.trim() ? null : 'El teléfono es obligatorio',
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
        phone_number: phone_number.trim(),
        notes: notes.trim(),
      };

      if (initial) {
        await updateClient(initial.id, payload);
      } else {
        await createClient(payload);
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
        <DialogTitle>{initial ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>

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

            <TextField
              label="Teléfono"
              value={phone_number}
              onChange={(event) => setPhoneNumber(event.target.value)}
              error={touched && !!errors.telefono}
              helperText={touched ? errors.telefono : ' '}
              required
              fullWidth
            />

            <TextField
              label="Notas"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
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