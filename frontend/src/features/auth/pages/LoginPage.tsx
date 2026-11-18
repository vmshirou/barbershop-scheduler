import { useState, type SubmitEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { type UserSend } from '../api';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signIn, status, error } = useAuth();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('')

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/';

  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  const isSubmitting = status === 'loading';

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    let user = {
        phone_number: phoneNumber.trim(),
        password: password.trim()
    };
    await signIn(user as UserSend);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'grey.100',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420 }} elevation={3}>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          <Typography variant="h5">Agenda El Corte</Typography>
          <Typography variant="body2" color="text.secondary">
            Ingrese con sus datos de personal.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Teléfono"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Contraseña"
            value={password}
            type='password'
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !phoneNumber.trim()}
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}