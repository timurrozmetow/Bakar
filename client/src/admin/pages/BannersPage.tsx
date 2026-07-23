import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useList, useCrud, useReorder } from '../../lib/queries';
import { emptyI18n, type Banner } from '../../lib/types';
import { Button, PageHeader, Spinner, Switch, Badge } from '../ui';
import { Modal, ConfirmDialog, TranslatableField, ImageUpload, EntityRow, RowThumb, SortableList } from '../components';
import { Field, Input } from '../ui';

type Draft = Omit<Banner, 'id'>;

const blank = (): Draft => ({
  title: emptyI18n(),
  subtitle: emptyI18n(),
  ctaLabel: emptyI18n(),
  ctaHref: '#products',
  image: '',
  sortOrder: 0,
  isActive: true,
});

export function BannersPage() {
  const { data: banners, isLoading } = useList<Banner>('banners');
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Banner | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());

  const crud = useCrud<Banner>('banners', {
    onSuccess: () => {
      setCreating(false);
      setEditing(null);
    },
  });

  // Local copy so drag-and-drop feels instant; persisted via /banners/reorder.
  const reorder = useReorder('banners');
  const [items, setItems] = useState<Banner[]>([]);
  useEffect(() => {
    if (banners) setItems(banners);
  }, [banners]);

  function handleReorder(ordered: Banner[]) {
    setItems(ordered);
    reorder.mutate(ordered.map((it, i) => ({ id: it.id, sortOrder: i })));
  }

  function openCreate() {
    setDraft(blank());
    setCreating(true);
  }
  function openEdit(b: Banner) {
    setDraft({ ...b });
    setEditing(b);
  }
  function save() {
    if (editing) crud.update({ id: editing.id, data: draft });
    else crud.create(draft);
  }

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Баннеры"
        subtitle="Слайды hero-карусели на главной странице"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Добавить баннер
          </Button>
        }
      />

      <SortableList
        items={items}
        onReorder={handleReorder}
        renderItem={(b, dragHandle) => (
          <EntityRow
            dragHandle={dragHandle}
            thumb={<RowThumb src={b.image} wide alt={b.title.ru} />}
            title={b.title.ru || b.title.tm || b.title.en || '—'}
            subtitle={b.subtitle.ru}
            trailing={!b.isActive ? <Badge tone="muted">скрыт</Badge> : undefined}
            active={b.isActive}
            onToggle={(v) => crud.patch({ id: b.id, data: { isActive: v } })}
            onEdit={() => openEdit(b)}
            onDelete={() => setToDelete(b)}
          />
        )}
      />
      {items.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-line py-16 text-center text-muted">
          Баннеров пока нет. Добавьте первый.
        </div>
      )}

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Редактировать баннер' : 'Новый баннер'}
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
        <TranslatableField label="Заголовок" required value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <TranslatableField label="Подзаголовок" multiline value={draft.subtitle} onChange={(subtitle) => setDraft({ ...draft, subtitle })} />
        <TranslatableField label="Текст кнопки" value={draft.ctaLabel} onChange={(ctaLabel) => setDraft({ ...draft, ctaLabel })} />
        <Field label="Ссылка кнопки" hint="Например: /products или #products">
          <Input value={draft.ctaHref} onChange={(e) => setDraft({ ...draft, ctaHref: e.target.value })} />
        </Field>
        <ImageUpload label="Фоновое изображение" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
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
        title="Удалить баннер?"
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
