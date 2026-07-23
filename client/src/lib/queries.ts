import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from './api';
import type { SiteData } from './types';

/** Public aggregated site content (no auth). */
export function useSiteData() {
  return useQuery({
    queryKey: ['site'],
    queryFn: () => api.get<SiteData>('/public/site'),
    staleTime: 60_000,
  });
}

/** Generic authenticated list query for an admin resource. */
export function useList<T>(resource: string, query = '') {
  return useQuery({
    queryKey: [resource, query],
    queryFn: () => api.get<T[]>(`/${resource}${query}`),
  });
}

interface CrudHandlers<T> {
  create: (data: Partial<T>) => void;
  update: (args: { id: number; data: Partial<T> }) => void;
  patch: (args: { id: number; data: Partial<T> }) => void;
  remove: (id: number) => void;
  saving: boolean;
}

function errMsg(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.issues?.length) return e.issues.map((i) => i.message).join('; ');
    return e.message;
  }
  return 'Ошибка';
}

/** Generic authenticated CRUD mutations for an admin resource. */
export function useCrud<T>(resource: string, opts?: { onSuccess?: () => void }): CrudHandlers<T> {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [resource] });
    qc.invalidateQueries({ queryKey: ['site'] });
  };

  const create = useMutation({
    mutationFn: (data: Partial<T>) => api.post(`/${resource}`, data),
    onSuccess: () => {
      invalidate();
      toast.success('Создано');
      opts?.onSuccess?.();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<T> }) => api.put(`/${resource}/${id}`, data),
    onSuccess: () => {
      invalidate();
      toast.success('Сохранено');
      opts?.onSuccess?.();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const patch = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<T> }) => api.patch(`/${resource}/${id}`, data),
    // Optimistic: reflect the change (e.g. isActive toggle) immediately, roll back on failure.
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: [resource] });
      const snapshots = qc.getQueriesData<T[]>({ queryKey: [resource] });
      for (const [key, list] of snapshots) {
        if (Array.isArray(list)) {
          qc.setQueryData(
            key,
            list.map((row) => ((row as { id: number }).id === id ? { ...row, ...data } : row)),
          );
        }
      }
      return { snapshots };
    },
    onError: (e, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, list]) => qc.setQueryData(key, list));
      toast.error(errMsg(e));
    },
    onSettled: () => invalidate(),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/${resource}/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Удалено');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return {
    create: create.mutate,
    update: update.mutate,
    patch: patch.mutate,
    remove: remove.mutate,
    saving: create.isPending || update.isPending,
  };
}

/** Persists a new order after drag-and-drop: POST /<resource>/reorder */
export function useReorder(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => api.post(`/${resource}/reorder`, { items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [resource] });
      qc.invalidateQueries({ queryKey: ['site'] });
      toast.success('Порядок сохранён');
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: [resource] });
      toast.error(errMsg(e));
    },
  });
}

/** Settings block (singleton content) read + save. */
export function useSetting<T>(key: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['settings', key],
    queryFn: () => api.get<{ key: string; value: T | null }>(`/settings/${key}`),
  });
  const save = useMutation({
    mutationFn: (value: T) => api.put(`/settings/${key}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', key] });
      qc.invalidateQueries({ queryKey: ['site'] });
      toast.success('Сохранено');
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  return { value: query.data?.value ?? null, loading: query.isLoading, save: save.mutate, saving: save.isPending };
}
