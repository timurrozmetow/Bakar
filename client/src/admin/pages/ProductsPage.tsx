import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useList, useCrud, useReorder } from '../../lib/queries';
import { emptyI18n, type Category, type Product } from '../../lib/types';
import { Button, PageHeader, Spinner, Switch, Badge, Field, Input, cn } from '../ui';
import { Modal, ConfirmDialog, TranslatableField, ImageUpload, EntityRow, RowThumb, SortableList } from '../components';

interface Draft {
  categoryId: number;
  slug: string;
  name: Product['name'];
  description: Product['description'];
  image: string;
  sortOrder: number;
  isActive: boolean;
  variants: { weight: string; sortOrder: number }[];
}

const blank = (categoryId: number): Draft => ({
  categoryId,
  slug: '',
  name: emptyI18n(),
  description: emptyI18n(),
  image: '',
  sortOrder: 0,
  isActive: true,
  variants: [],
});

export function ProductsPage() {
  const { data: products, isLoading } = useList<Product>('products');
  const { data: categories } = useList<Category>('categories');
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(blank(0));

  const crud = useCrud<Product>('products', {
    onSuccess: () => {
      setCreating(false);
      setEditing(null);
    },
  });

  // Local copy so drag-and-drop feels instant; persisted via /products/reorder.
  const reorder = useReorder('products');
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    if (products) setItems(products);
  }, [products]);

  const firstCat = categories?.[0]?.id ?? 0;
  const catName = (id: number) => categories?.find((c) => c.id === id)?.name.ru ?? '—';

  const shown = useMemo(
    () => (filter === 'all' ? items : items.filter((p) => p.categoryId === filter)),
    [items, filter],
  );

  function handleReorder(ordered: Product[]) {
    // `ordered` is the (possibly filtered) visible slice — splice it back into the full list.
    const movedIds = new Set(ordered.map((o) => o.id));
    let k = 0;
    const merged = items.map((it) => (movedIds.has(it.id) ? ordered[k++] : it));
    setItems(merged);
    reorder.mutate(merged.map((it, i) => ({ id: it.id, sortOrder: i })));
  }

  function openCreate() {
    setDraft(blank(firstCat));
    setCreating(true);
  }
  function openEdit(p: Product) {
    setDraft({
      categoryId: p.categoryId,
      slug: p.slug,
      name: p.name,
      description: p.description,
      image: p.image,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      variants: p.variants.map((v) => ({ weight: v.weight, sortOrder: v.sortOrder })),
    });
    setEditing(p);
  }
  function save() {
    // variants are sent as { weight, sortOrder } (server creates the rows); cast to the CRUD input type.
    const payload = { ...draft, variants: draft.variants.filter((v) => v.weight.trim()) } as unknown as Partial<Product>;
    if (editing) crud.update({ id: editing.id, data: payload });
    else crud.create(payload);
  }

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Продукция"
        subtitle="Товары по категориям с вариантами фасовки"
        action={
          <Button onClick={openCreate} disabled={!categories?.length}>
            <Plus className="h-4 w-4" /> Добавить товар
          </Button>
        }
      />

      {!categories?.length && (
        <div className="mb-4 rounded-[12px] border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-ink">
          Сначала создайте хотя бы одну категорию.
        </div>
      )}

      {/* category filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn('rounded-pill px-3.5 py-1.5 text-sm font-semibold', filter === 'all' ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted')}
        >
          Все
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={cn('rounded-pill px-3.5 py-1.5 text-sm font-semibold', filter === c.id ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted')}
          >
            {c.name.ru}
          </button>
        ))}
      </div>

      <SortableList
        items={shown}
        onReorder={handleReorder}
        renderItem={(p, dragHandle) => (
          <EntityRow
            dragHandle={dragHandle}
            thumb={<RowThumb src={p.image} alt={p.name.ru} />}
            title={
              <span className="flex flex-wrap items-baseline gap-x-2">
                {p.name.ru || p.name.tm}
                <span className="text-sm font-normal text-muted">{p.name.tm}</span>
              </span>
            }
            meta={
              <>
                <Badge tone="accent">{catName(p.categoryId)}</Badge>
                {p.variants.map((v) => (
                  <Badge key={v.id ?? v.weight} tone="muted">{v.weight}</Badge>
                ))}
              </>
            }
            trailing={!p.isActive ? <Badge tone="muted">скрыт</Badge> : undefined}
            active={p.isActive}
            onToggle={(v) => crud.patch({ id: p.id, data: { isActive: v } })}
            onEdit={() => openEdit(p)}
            onDelete={() => setToDelete(p)}
          />
        )}
      />
      {shown.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-line py-16 text-center text-muted">
          Товаров нет.
        </div>
      )}

      <Modal
        open={creating || editing !== null}
        wide
        title={editing ? 'Редактировать товар' : 'Новый товар'}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setCreating(false); setEditing(null); }}>Отмена</Button>
            <Button loading={crud.saving} onClick={save}>Сохранить</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Категория">
            <select
              value={draft.categoryId}
              onChange={(e) => setDraft({ ...draft, categoryId: Number(e.target.value) })}
              className="w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name.ru}</option>
              ))}
            </select>
          </Field>
          <Field label="Slug" hint="латиница, напр. grechka">
            <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
          </Field>
        </div>

        <TranslatableField label="Название" required value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <TranslatableField label="Описание" multiline value={draft.description} onChange={(description) => setDraft({ ...draft, description })} />
        <ImageUpload label="Фото товара" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />

        {/* variants */}
        <div className="space-y-2">
          <span className="text-sm font-semibold text-ink">Варианты фасовки</span>
          <div className="space-y-2">
            {draft.variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={v.weight}
                  placeholder="напр. 1 кг"
                  onChange={(e) => {
                    const variants = [...draft.variants];
                    variants[i] = { ...variants[i], weight: e.target.value };
                    setDraft({ ...draft, variants });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, j) => j !== i) })}
                  className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDraft({ ...draft, variants: [...draft.variants, { weight: '', sortOrder: draft.variants.length }] })}
          >
            <Plus className="h-4 w-4" /> Добавить фасовку
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <Field label="Порядок">
            <Input type="number" className="w-24" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
          </Field>
          <div className="pt-6">
            <Switch checked={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} label="Показывать на сайте" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить товар?"
        message="Это действие необратимо."
        onConfirm={() => {
          if (toDelete) crud.remove(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
