import { useState } from 'react';
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useApiResource } from '../../../hooks/useApiResource';
import { deleteClient, listClients } from '../api';
import { ClientForm } from '../components/ClientForm';
import { ClientList } from '../components/ClientList';
import type { Client } from '../../../types/domain';

export function ClientsPage() {
  const { data, loading, error, reload } = useApiResource(listClients);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditing(client);
    setFormOpen(true);
  };

  const handleDelete = async (client: Client) => {
    // Confirmación simple por ahora; en Fase 2 la reemplazamos por ConfirmDialog MUI.
    if (!window.confirm(`¿Eliminar a ${client.name}?`)) return;
    try {
      await deleteClient(client.id);
      void reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{justifyContent: "space-between", alignItems: "center"}}>
        <Typography variant="h5">Clientes</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={handleCreate}>
          Nuevo cliente
        </Button>
      </Stack>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {data && (
        <ClientList clients={data} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <ClientForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void reload()}
      />
    </Stack>
  );
}