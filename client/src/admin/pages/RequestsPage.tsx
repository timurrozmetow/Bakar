import { useState } from 'react';
import { Phone, Mail, Trash2, Inbox } from 'lucide-react';
import { useList, useCrud } from '../queries';
import type { PartnerRequest } from '../../lib/types';
import { PageHeader, Spinner, Badge, cn } from '../ui';
import { ConfirmDialog } from '../components';

type Status = PartnerRequest['status'];

const STATUS_LABEL: Record<Status, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Обработана',
};

const STATUS_TONE: Record<Status, 'amber' | 'accent' | 'muted'> = {
  new: 'amber',
  in_progress: 'accent',
  done: 'muted',
};

type Filter = 'all' | Status;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'done', label: 'Обработанные' },
];

export function RequestsPage() {
  const { data: requests, isLoading } = useList<PartnerRequest>('partner-requests');
  const [filter, setFilter] = useState<Filter>('all');
  const [toDelete, setToDelete] = useState<PartnerRequest | null>(null);

  const crud = useCrud<PartnerRequest>('partner-requests');

  if (isLoading) return <Spinner />;

  const visible = requests?.filter((r) => filter === 'all' || r.status === filter) ?? [];

  return (
    <div>
      <PageHeader title="Заявки партнёров" subtitle="Входящие заявки с сайта" />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition',
              filter === f.key ? 'bg-accent text-on-accent' : 'border border-line bg-surface text-muted hover:bg-surface-2',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((r) => (
          <div key={r.id} className="rounded-[16px] border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{r.name || '—'}</span>
                  {r.company && <span className="text-sm text-muted">{r.company}</span>}
                  <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 transition hover:text-ink">
                      <Phone className="h-4 w-4" /> {r.phone}
                    </a>
                  )}
                  {r.email && (
                    <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 transition hover:text-ink">
                      <Mail className="h-4 w-4" /> {r.email}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={r.status}
                  onChange={(e) => crud.patch({ id: r.id, data: { status: e.target.value as Status } })}
                  className="rounded-[12px] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="new">{STATUS_LABEL.new}</option>
                  <option value="in_progress">{STATUS_LABEL.in_progress}</option>
                  <option value="done">{STATUS_LABEL.done}</option>
                </select>
                <button
                  onClick={() => setToDelete(r)}
                  className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-red-600"
                >
                  <Trash2 className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>

            {r.message && <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{r.message}</p>}

            <div className="mt-3 text-xs text-muted">{new Date(r.createdAt).toLocaleString('ru-RU')}</div>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-line py-16 text-center text-muted">
            <Inbox className="h-8 w-8" />
            Заявок пока нет.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить заявку?"
        message="Это действие необратимо."
        loading={false}
        onConfirm={() => {
          if (toDelete) crud.remove(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
