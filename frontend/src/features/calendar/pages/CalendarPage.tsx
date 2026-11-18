import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, IconButton, Paper, Stack, Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useApiResource } from '../../../hooks/useApiResource';
import { useAuth } from '../../auth/hooks/useAuth';
import { listWorkdays } from '../../workdays/api';
import { WorkdayCreateDialog } from '../../workdays/components/WorkdayCreateDialog';
import { buildMonthGrid, todayISO } from '../../../utils/date';
import type { Workday } from '../../../types/domain';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = todayISO();

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: workdays, loading, error, reload } = useApiResource(listWorkdays);

  const workdaysByDate = useMemo(() => {
    const map = new Map<string, Workday>();
    (workdays ?? []).forEach((w) => map.set(w.datestamp, w));
    return map;
  }, [workdays]);

  const cells = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month),
    [cursor],
  );

  const handlePrev = () => {
    setCursor((c) => (c.month === 0
      ? { year: c.year - 1, month: 11 }
      : { ...c, month: c.month - 1 }));
  };
  const handleNext = () => {
    setCursor((c) => (c.month === 11
      ? { year: c.year + 1, month: 0 }
      : { ...c, month: c.month + 1 }));
  };

  const handleDayClick = (iso: string) => {
    const hasJornada = workdaysByDate.has(iso);
    if (hasJornada) {
      navigate(`/jornada/${iso}`);
      return;
    }
    if (user?.rol === 'ADMIN') {
      setSelectedDate(iso);
      setCreateOpen(true);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{justifyContent:"space-between", alignItems: "center"}}>
        <Stack direction="row" spacing={1} sx={{alignItems:"center"}}>
          <IconButton onClick={handlePrev}><ChevronLeftIcon /></IconButton>
          <Typography variant="h5" sx={{ minWidth: 200, textAlign: 'center' }}>
            {MONTH_NAMES[cursor.month]} {cursor.year}
          </Typography>
          <IconButton onClick={handleNext}><ChevronRightIcon /></IconButton>
        </Stack>
        <Button onClick={() => navigate(`/jornada/${today}`)}>Ir a hoy</Button>
      </Stack>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1,
            }}
          >
            {WEEKDAYS.map((d) => (
              <Typography key={d} variant="caption" sx={{textAlign:"center"}} color="text.secondary">
                {d}
              </Typography>
            ))}

            {cells.map((iso, idx) => {
              if (!iso) return <Box key={`empty-${idx}`} />;

              const hasJornada = workdaysByDate.has(iso);
              const isToday = iso === today;
              const isPast = iso < today;
              const isClickable = hasJornada || user?.rol === 'ADMIN';

              return (
                <Box
                  key={iso}
                  onClick={() => isClickable && handleDayClick(iso)}
                  sx={{
                    p: 1,
                    minHeight: 60,
                    borderRadius: 2,
                    cursor: isClickable ? 'pointer' : 'default',
                    border: 1,
                    borderColor: isToday ? 'primary.main' : 'divider',
                    bgcolor: hasJornada ? 'success.light' : 'background.paper',
                    opacity: isPast ? 0.6 : 1,
                    transition: 'background-color 120ms',
                    '&:hover': isClickable
                      ? { bgcolor: hasJornada ? 'success.200' : 'action.hover' }
                      : undefined,
                  }}
                >
                  <Typography variant="body2" sx={{fontWeight: isToday ? 700 : 400}}>
                    {Number(iso.slice(8))}
                  </Typography>
                  {hasJornada && (
                    <Typography variant="caption" color="text.secondary">
                      Jornada
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {selectedDate && (
        <WorkdayCreateDialog
          open={createOpen}
          datestamp={selectedDate}
          onClose={() => setCreateOpen(false)}
          onSaved={() => void reload()}
        />
      )}
    </Stack>
  );
}