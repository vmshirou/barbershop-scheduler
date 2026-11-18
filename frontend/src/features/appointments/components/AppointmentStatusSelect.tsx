import { MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { useState } from 'react';
import type { AppointmentStatus } from '../../../types/domain';
import { updateAppointmentStatus } from '../api';

interface AppointmentStatusSelectProps {
  appointmentId: number;
  status: AppointmentStatus;
  onChange: () => void;
}

const LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Pendiente',
  SERVED: 'Atendido',
  NO_SHOW: 'No vino',
};

export function AppointmentStatusSelect({
  appointmentId, status, onChange,
}: AppointmentStatusSelectProps) {
  const [updating, setUpdating] = useState(false);

  const handleChange = async (event: SelectChangeEvent<AppointmentStatus>) => {
    const next = event.target.value as AppointmentStatus;
    if (next === status) return;
    setUpdating(true);
    try {
      // Backend expects "state" field, not "status"
      await updateAppointmentStatus(appointmentId, next);
      onChange();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Select
      size="small"
      value={status}
      onChange={handleChange}
      disabled={updating}
    >
      {(Object.keys(LABELS) as AppointmentStatus[]).map((key) => (
        <MenuItem key={key} value={key}>{LABELS[key]}</MenuItem>
      ))}
    </Select>
  );
}