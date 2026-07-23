import { useEffect, useState } from 'react';
import { Plus, BadgeCheck } from 'lucide-react';
import { useList, useCrud, useReorder } from '../../lib/queries';
import { emptyI18n, type Certificate } from '../../lib/types';
import { Button, PageHeader, Spinner, Switch, Badge } from '../ui';
import { Modal, ConfirmDialog, TranslatableField, ImageUpload, EntityRow, SortableList } from '../components';
import { Field, Input } from '../ui';
import { mediaUrl } from '../../lib/api';

type Draft = Omit<Certificate, 'id'>;

const blank = (): Draft => ({
  title: emptyI18n(),
  description: emptyI18n(),
  image: '',
  fileUrl: '',
  sortOrder: 0,
  isActive: true,
});

export function CertificatesPage() {
  const { data: certificates, isLoading } = useList<Certificate>('certificates');
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Certificate | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());

  const crud = useCrud<Certificate>('certificates', {
    onSuccess: () => {
      setCreating(false);
      setEditing(null);
    },
  });

  // Local copy so drag-and-drop feels instant; persisted via /certificates/reorder.
  const reorder = useReorder('certificates');
  const [items, setItems] = useState<Certificate[]>([]);
  useEffect(() => {
    if (certificates) setItems(certificates);
  }, [certificates]);

  function handleReorder(ordered: Certificate[]) {
    setItems(ordered);
    reorder.mutate(ordered.map((it, i) => ({ id: it.id, sortOrder: i })));
  }

  function openCreate() {
    setDraft(blank());
    setCreating(true);
  }
  function openEdit(c: Certificate) {
    setDraft({ ...c });
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
        title="Сертификаты"
        subtitle="Сертификаты качества и файлы"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Добавить сертификат
          </Button>
        }
      />

      <SortableList
        items={items}
        onReorder={handleReorder}
        renderItem={(c, dragHandle) => (
          <EntityRow
            dragHandle={dragHandle}
            thumb={
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-accent-soft">
                {c.image ? (
                  <img src={mediaUrl(c.image)} alt={c.title.ru} className="h-full w-full object-cover" />
                ) : (
                  <BadgeCheck className="h-6 w-6 text-accent" />
                )}
              </div>
            }
            title={c.title.ru || c.title.tm || c.title.en || '—'}
            subtitle={c.description.ru}
            trailing={!c.isActive ? <Badge tone="muted">скрыт</Badge> : undefined}
            active={c.isActive}
            onToggle={(v) => crud.patch({ id: c.id, data: { isActive: v } })}
            onEdit={() => openEdit(c)}
            onDelete={() => setToDelete(c)}
          />
        )}
      />
      {items.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-line py-16 text-center text-muted">
          Сертификатов пока нет. Добавьте первый.
        </div>
      )}

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Редактировать сертификат' : 'Новый сертификат'}
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
        <TranslatableField label="Название" required value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <TranslatableField label="Описание" multiline value={draft.description} onChange={(description) => setDraft({ ...draft, description })} />
        <ImageUpload label="Изображение" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
        <ImageUpload
          label="Файл (PDF)"
          kind="file"
          accept="application/pdf,.pdf"
          value={draft.fileUrl}
          onChange={(fileUrl) => setDraft({ ...draft, fileUrl })}
        />
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
        title="Удалить сертификат?"
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
