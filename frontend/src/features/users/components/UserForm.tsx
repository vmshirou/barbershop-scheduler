import { useEffect, useState, type SubmitEvent } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { ApiError } from '../../../api/client';
import { createUser, updateUser } from '../api';
import type { User, UserRole } from '../../../types/domain';

interface UserFormProps {
  open: boolean;
  initial?: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export function UserForm({ open, initial, onClose, onSaved }: UserFormProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('BARBER');
  const [password, setPassword] =  useState('')
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setPhoneNumber(initial?.phone_number ?? '');
    setRole(initial?.rol ?? 'BARBER');
    setPassword(initial?.password ?? '')
    setTouched(false);
    setServerError(null);
  }, [open, initial]);

  const errors = {
    name: name.trim() ? null : 'El nombre es obligatorio',
    phoneNumber: phoneNumber.trim() ? null : 'El teléfono es obligatorio',
    password: password.trim() ? null : 'La contraseña es obligatoria',
    minPassword: password.trim().length > 8 ? null : 'La contraseña debe tener minimo 8 caracteres'
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
        phone_number: phoneNumber.trim(),
        password: password.trim(),
        rol: role,
      };

      if (initial) {
        await updateUser(initial.id, payload);
      } else {
        await createUser(payload);
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
        <DialogTitle>{initial ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>

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
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              error={touched && !!errors.phoneNumber}
              helperText={
                touched ? errors.phoneNumber : 'Con este número inicia sesión'
              }
              required
              fullWidth
            />
            <TextField
                label="Password"
                value={password}
                type='password'
                onChange={(event) => setPassword(event.target.value)}
                helperText={
                    touched ? errors.password : 'Contraseña para la seguridad de la cuenta'
                }
                required
                fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="user-role-label">Rol</InputLabel>
              <Select
                labelId="user-role-label"
                label="Rol"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
              >
                <MenuItem value="BARBER">Peluquero</MenuItem>
                <MenuItem value="ADMIN">Administrador</MenuItem>
              </Select>
              <FormHelperText>
                Los peluqueros solo verán su propia agenda.
              </FormHelperText>
            </FormControl>
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