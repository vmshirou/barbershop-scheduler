import { useState } from 'react';
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useApiResource } from '../../../hooks/useApiResource';
import { useAuth } from '../../auth/hooks/useAuth';
import { deleteUser, listUsers } from '../api';
import { UserForm } from '../components/UserForm';
import { UserList } from '../components/UserList';
import type { User } from '../../../types/domain';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data, loading, error, reload } = useApiResource(listUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const handleDelete = async (user: User) => {
    if (!window.confirm(`¿Eliminar a ${user.name}?`)) return;
    try {
      await deleteUser(user.id);
      void reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{justifyContent: "space-between", alignItems: "center"}}>
        <Typography variant="h5">Usuarios</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nuevo usuario
        </Button>
      </Stack>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {data && currentUser && (
        <UserList
          users={data}
          currentUserId={currentUser.id}
          onEdit={(user) => {
            setEditing(user);
            setFormOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      <UserForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void reload()}
      />
    </Stack>
  );
}