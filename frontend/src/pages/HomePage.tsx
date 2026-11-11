import { Stack, Typography } from '@mui/material';
import { useAuth } from '../features/auth/hooks/useAuth';

export function HomePage() {
  const { user } = useAuth();

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Hola, {user?.name}</Typography>
      <Typography color="text.secondary">
        Panel interno de Agenda El Corte.
      </Typography>
    </Stack>
  );
}