import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useList, useCrud, useReorder } from '../queries';
import { emptyI18n, type Review } from '../../lib/types';
import { Button, PageHeader, Spinner, Switch, Badge } from '../ui';
import { Modal, ConfirmDialog, TranslatableField, EntityRow, SortableList } from '../components';
import { Field, Input } from '../ui';

type Draft = Omit<Review, 'id'>;

const blank = (): Draft => ({
  text: emptyI18n(),
  author: '',
  role: emptyI18n(),
  city: '',
  sortOrder: 0,
  isActive: true,
});

export function ReviewsPage() {
  const { data: reviews, isLoading } = useList<Review>('reviews');
  const [editing, setEditing] = useState<Review | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Review | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());

  const crud = useCrud<Review>('reviews', {
    onSuccess: () => {
      setCreating(false);
      setEditing(null);
    },
  });

  // Local copy so drag-and-drop feels instant; persisted via /reviews/reorder.
  const reorder = useReorder('reviews');
  const [items, setItems] = useState<Review[]>([]);
  useEffect(() => {
    if (reviews) setItems(reviews);
  }, [reviews]);

  function handleReorder(ordered: Review[]) {
    setItems(ordered);
    reorder.mutate(ordered.map((it, i) => ({ id: it.id, sortOrder: i })));
  }

  function openCreate() {
    setDraft(blank());
    setCreating(true);
  }
  function openEdit(r: Review) {
    setDraft({ ...r });
    setEditing(r);
  }
  function save() {
    if (editing) crud.update({ id: editing.id, data: draft });
    else crud.create(draft);
  }

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Отзывы"
        subtitle="Отзывы покупателей и партнёров"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Добавить отзыв
          </Button>
        }
      />

      <SortableList
        items={items}
        onReorder={handleReorder}
        renderItem={(r, dragHandle) => (
          <EntityRow
            dragHandle={dragHandle}
            title={
              <span className="flex flex-wrap items-baseline gap-x-2">
                {r.author || '—'}
                {r.city && <span className="text-sm font-normal text-muted">{r.city}</span>}
              </span>
            }
            subtitle={r.text.ru}
            trailing={!r.isActive ? <Badge tone="muted">скрыт</Badge> : undefined}
            active={r.isActive}
            onToggle={(v) => crud.patch({ id: r.id, data: { isActive: v } })}
            onEdit={() => openEdit(r)}
            onDelete={() => setToDelete(r)}
          />
        )}
      />
      {items.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-line py-16 text-center text-muted">
          Отзывов пока нет. Добавьте первый.
        </div>
      )}

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Редактировать отзыв' : 'Новый отзыв'}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setCreating(false); setEditing(null); }}>
              Отмена
            </Button>
            <Button loading={crud.saving} onClick={save}>
              Сохранить
            </Button>
          </>
        }
      >
        <TranslatableField label="Текст отзыва" multiline required value={draft.text} onChange={(text) => setDraft({ ...draft, text })} />
        <Field label="Автор">
          <Input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
        </Field>
        <TranslatableField label="Роль" value={draft.role} onChange={(role) => setDraft({ ...draft, role })} />
        <Field label="Город">
          <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
        </Field>
        <div className="flex items-center gap-6">
          <Field label="Порядок">
            <Input
              type="number"
              className="w-24"
              value={draft.sortOrder}
              onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
            />
          </Field>
          <div className="pt-6">
            <Switch checked={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} label="Показывать на сайте" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить отзыв?"
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
