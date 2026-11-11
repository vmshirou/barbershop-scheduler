import { useCallback, useEffect, useState } from 'react';

interface ApiResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Carga un recurso una vez al montar y expone `reload` para recargar tras mutaciones.
 * IMPORTANTE: `fetcher` debe ser una referencia estable (función importada de api.ts),
 * no una arrow inline, para no entrar en loop.
 */
export function useApiResource<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<ApiResourceState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Error al cargar datos',
      });
    }
  }, [fetcher]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}