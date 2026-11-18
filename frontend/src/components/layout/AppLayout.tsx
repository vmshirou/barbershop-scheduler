import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Agenda El Corte
          </Typography>

          <Stack direction="row" spacing={1} sx={{alignItems: "center"}}>
            <Button color="inherit" component={RouterLink} to="/">Inicio</Button>
            <Button color="inherit" component={RouterLink} to="/calendario">Calendario</Button>
            {user?.rol === 'ADMIN' && (
              <Button color="inherit" component={RouterLink} to="/admin/clientes">Administración</Button>
            )}
            <Typography variant="body2">{user?.name} ({user?.rol})</Typography>
            <Button color="inherit" onClick={handleSignOut}>Salir</Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}