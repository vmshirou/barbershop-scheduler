import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, CircularProgress, FormControl, InputLabel,
  MenuItem, Select, Stack, Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiResource } from '../../../hooks/useApiResource';
import { useAuth } from '../../auth/hooks/useAuth';
import { listClients } from '../../clients/api';
import { listServices } from '../../services/api';
import { listUsers } from '../../users/api';
import { listWorkdays } from '../api';
import { listAppointmentsByWorkday, deleteAppointment } from '../../appointments/api';
import { AppointmentForm } from '../../appointments/components/AppointmentForm';
import { JornadaTimeline } from '../../appointments/components/WorkdayTimeline';
import { WorkdayCreateDialog } from '../components/WorkdayCreateDialog';
import { WorkdayEditDialog } from '../components/WorkdayEditDialog';
import { formatDateLabel } from '../../../utils/date';
import { minutesToTime, timeToMinutes } from '../../../utils/time';
import type { Appointment } from '../../../types/domain';

export function JornadaPage() {
  const { date } = useParams<{ date: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!date) throw new Error('Fecha no especificada');

    // Fetch all workdays and find the one matching the date
    const workdays = await listWorkdays();
    const jornada = workdays.find((w) => w.datestamp === date) ?? null;
    if (!jornada) {
      return { jornada: null, appointments: [], clients: [], services: [], users: [] };
    }

    // Fetch all appointments for the workday
    // Filtering by barber will be done in visibleAppointments memo
    let appointments: Appointment[];
    appointments = await listAppointmentsByWorkday(Number(jornada.id));
    const [clients, services, users] = await Promise.all([
      listClients(),
      listServices(),
      listUsers(),
    ]);

    return { jornada, appointments, clients, services, users };
  }, [date, user?.id, user?.rol]);

  const { data, loading, error, reload } = useApiResource(fetchData);

  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [createJornadaOpen, setCreateJornadaOpen] = useState(false);
  const [editJornadaOpen, setEditJornadaOpen] = useState(false);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const isAdmin = user?.rol === 'ADMIN';

  useEffect(() => {
    if (!data || !user) return;
    if (user.rol === 'BARBER') {
      setSelectedBarberId(user.id);
    } else if (data.users.length > 0 && !selectedBarberId) {
      const firstBarber = data.users.find((u) => u.rol === 'BARBER');
      setSelectedBarberId(firstBarber?.id ?? '');
    }
  }, [data, user, selectedBarberId]);

  const barbers = useMemo(
    () => (data?.users ?? []).filter((u) => u.rol === 'BARBER'),
    [data],
  );

  const visibleAppointments = useMemo(() => {
    if (!data) return [];
    if (user?.rol === 'BARBER') {
      return data.appointments.filter((a) => String(a.id_barber) === user.id);
    }
    return data.appointments.filter((a) => a.id_barber === selectedBarberId);
  }, [data, user, selectedBarberId]);

  if (!date) return <Alert severity="error">Fecha inválida</Alert>;
  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  if (!data.jornada) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4">{formatDateLabel(date)}</Typography>
        <Alert severity="info">No hay jornada creada para este día.</Alert>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate('/calendario')}>Volver al calendario</Button>
          {isAdmin && (
            <Button variant="contained" onClick={() => setCreateJornadaOpen(true)}>
              Crear jornada
            </Button>
          )}
        </Stack>
        <WorkdayCreateDialog
          open={createJornadaOpen}
          datestamp={date}
          onClose={() => setCreateJornadaOpen(false)}
          onSaved={() => void reload()}
        />
      </Stack>
    );
  }

  const jornada = data.jornada;
  const jornadaEnd = timeToMinutes(jornada.start_time) + jornada.duration;

  const handleCreateAppointment = () => {
    setEditingAppointment(null);
    setAppointmentFormOpen(true);
  };

  const handleEditAppointment = (appt: Appointment) => {
    setEditingAppointment(appt);
    setAppointmentFormOpen(true);
  };

  const handleDeleteAppointment = async (appt: Appointment) => {
    if (!window.confirm('¿Eliminar este turno?')) return;
    try {
      await deleteAppointment(Number(appt.id));
      void reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{justifyContent: "space-between", alignItems: { xs: 'flex-start', md: 'center' }}}
        spacing={2}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4">{formatDateLabel(date)}</Typography>
          <Typography color="text.secondary">
            Jornada {jornada.start_time} – {minutesToTime(jornadaEnd)} ({jornada.duration} min)
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{flexWrap: "wrap"}}>
          <Button onClick={() => navigate('/calendario')}>Volver</Button>
          {isAdmin && (
            <>
              <Button onClick={() => setEditJornadaOpen(true)}>Editar jornada</Button>
              <Button variant="contained" onClick={handleCreateAppointment}>
                Nuevo turno
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {isAdmin && barbers.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="jornada-barber">Peluquero</InputLabel>
          <Select
            labelId="jornada-barber"
            label="Peluquero"
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
          >
            {barbers.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <JornadaTimeline
        jornada={jornada}
        appointments={visibleAppointments}
        clients={data.clients}
        services={data.services}
        users={data.users}
        currentUserId={user?.id ?? ''}
        isAdmin={isAdmin}
        onChangeStatus={() => void reload()}
      />

      <WorkdayEditDialog
        open={editJornadaOpen}
        jornada={jornada}
        appointments={data.appointments}
        services={data.services}
        onClose={() => setEditJornadaOpen(false)}
        onSaved={() => void reload()}
      />

      <AppointmentForm
        open={appointmentFormOpen}
        jornada={jornada}
        appointments={data.appointments}
        clients={data.clients}
        services={data.services}
        barbers={barbers}
        initial={editingAppointment}
        defaultBarberId={selectedBarberId}
        onClose={() => setAppointmentFormOpen(false)}
        onSaved={() => void reload()}
      />
    </Stack>
  );
}