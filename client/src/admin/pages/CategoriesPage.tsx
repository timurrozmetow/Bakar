import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useList, useCrud, useReorder } from '../queries';
import { emptyI18n, type Category } from '../../lib/types';
import { Button, PageHeader, Spinner, Switch, Badge } from '../ui';
import { Modal, ConfirmDialog, TranslatableField, ImageUpload, EntityRow, RowThumb, SortableList } from '../components';
import { Field, Input } from '../ui';

type Draft = Omit<Category, 'id' | 'products' | '_count'>;

const blank = (): Draft => ({
  slug: '',
  name: emptyI18n(),
  tagline: emptyI18n(),
  description: emptyI18n(),
  image: '',
  sortOrder: 0,
  isActive: true,
});

export function CategoriesPage() {
  const { data: categories, isLoading } = useList<Category>('categories');
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());

  const crud = useCrud<Category>('categories', {
    onSuccess: () => {
      setCreating(false);
      setEditing(null);
    },
  });

  // Local copy so drag-and-drop feels instant; persisted via /categories/reorder.
  const reorder = useReorder('categories');
  const [items, setItems] = useState<Category[]>([]);
  useEffect(() => {
    if (categories) setItems(categories);
  }, [categories]);

  function handleReorder(ordered: Category[]) {
    setItems(ordered);
    reorder.mutate(ordered.map((it, i) => ({ id: it.id, sortOrder: i })));
  }

  function openCreate() {
    setDraft(blank());
    setCreating(true);
  }
  function openEdit(c: Category) {
    setDraft({
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      description: c.description,
      image: c.image,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    setEditing(c);
  }
  function save() {
    if (editing) crud.update({ id: editing.id, data: draft });
    else crud.create(draft);
  }

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Категории"
        subtitle="Категории продукции"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Добавить категорию
          </Button>
        }
      />

      <SortableList
        items={items}
        onReorder={handleReorder}
        renderItem={(c, dragHandle) => (
          <EntityRow
            dragHandle={dragHandle}
            thumb={<RowThumb src={c.image} wide alt={c.name.ru} />}
            title={c.name.ru || c.name.tm || c.name.en || '—'}
            subtitle={c.tagline.ru}
            meta={<Badge tone="accent">{`${c._count?.products ?? 0} товаров`}</Badge>}
            active={c.isActive}
            onToggle={(v) => crud.patch({ id: c.id, data: { isActive: v } })}
            onEdit={() => openEdit(c)}
            onDelete={() => setToDelete(c)}
          />
        )}
      />
      {items.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-line py-16 text-center text-muted">
          Категорий пока нет. Добавьте первую.
        </div>
      )}

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Редактировать категорию' : 'Новая категория'}
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
        <Field label="Slug" hint="латиница, напр. krupy">
          <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
        </Field>
        <TranslatableField label="Название" required value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <TranslatableField label="Подзаголовок" multiline value={draft.tagline} onChange={(tagline) => setDraft({ ...draft, tagline })} />
        <TranslatableField label="Описание" multiline value={draft.description} onChange={(description) => setDraft({ ...draft, description })} />
        <ImageUpload label="Изображение" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
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
        title="Удалить категорию?"
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
