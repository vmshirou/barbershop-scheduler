import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';

export function AdminLayout() {
  const location = useLocation();
  const current = location.pathname.split('/')[2] ?? 'clientes';

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Administración</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={current}>
          <Tab
            label="Clientes"
            value="clientes"
            component={RouterLink}
            to="/admin/clientes"
          />
          <Tab
            label="Servicios"
            value="servicios"
            component={RouterLink}
            to="/admin/servicios"
          />
          <Tab
            label="Usuarios"
            value="usuarios"
            component={RouterLink}
            to="/admin/usuarios"
          />
        </Tabs>
      </Box>

      <Outlet />
    </Stack>
  );
}