import { useState } from 'react';
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useApiResource } from '../../../hooks/useApiResource';
import { deleteService, listServices } from '../api';
import { ServiceForm } from '../components/ServiceForm';
import { ServiceList } from '../components/ServiceList';
import type { Service } from '../../../types/domain';

export function ServicesPage() {
  const { data, loading, error, reload } = useApiResource(listServices);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const handleDelete = async (service: Service) => {
    if (!window.confirm(`¿Eliminar el servicio "${service.name}"?`)) return;
    try {
      await deleteService(service.id);
      void reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent:"space-between", alignItems:"center"}}>
        <Typography variant="h5">Servicios</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nuevo servicio
        </Button>
      </Stack>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {data && (
        <ServiceList
          services={data}
          onEdit={(service) => {
            setEditing(service);
            setFormOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      <ServiceForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void reload()}
      />
    </Stack>
  );
}