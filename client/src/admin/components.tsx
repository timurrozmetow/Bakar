import { useState, type ReactNode } from 'react';
import { X, Upload, Image as ImageIcon, FileText, Loader2, Pencil, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LOCALES, LOCALE_LABEL, type I18nText, type Locale } from '../lib/types';
import { uploadFile, mediaUrl } from '../lib/api';
import { Button, Input, Switch, Textarea, cn } from './ui';

/**
 * Vertical drag-and-drop list.
 * `renderItem` receives a ready-made drag handle to place inside the row.
 * `onReorder` is called with the items in their new order.
 */
export function SortableList<T extends { id: number }>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (ordered: T[]) => void;
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: number; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const handle = (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Перетащить"
      className="hidden shrink-0 cursor-grab touch-none rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink active:cursor-grabbing sm:block"
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        position: isDragging ? 'relative' : undefined,
      }}
      className={cn(isDragging && 'opacity-90 shadow-lg')}
    >
      {children(handle)}
    </div>
  );
}

/**
 * Responsive list row for admin entities.
 * Desktop: thumb · text · controls in one line.
 * Mobile: thumb+text on top, controls drop to a second row so the title keeps full width.
 */
export function EntityRow({
  thumb,
  title,
  subtitle,
  meta,
  active,
  onToggle,
  onEdit,
  onDelete,
  trailing,
  dragHandle,
}: {
  thumb?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  active?: boolean;
  onToggle?: (v: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  trailing?: ReactNode;
  dragHandle?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-line bg-surface p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {dragHandle}
        {thumb}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink [overflow-wrap:anywhere]">{title}</div>
          {subtitle && <div className="text-sm text-muted [overflow-wrap:anywhere]">{subtitle}</div>}
          {meta && <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{meta}</div>}
        </div>
      </div>
      <div className="flex items-center gap-1 self-end border-t border-line pt-2 sm:self-auto sm:border-t-0 sm:pt-0">
        {trailing}
        {onToggle && active !== undefined && <Switch checked={active} onChange={onToggle} />}
        {onEdit && (
          <button onClick={onEdit} className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-ink">
            <Pencil className="h-[18px] w-[18px]" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-red-600">
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Square/rect thumbnail for EntityRow. */
export function RowThumb({ src, alt = '', wide }: { src?: string; alt?: string; wide?: boolean }) {
  return (
    <div className={cn('shrink-0 overflow-hidden rounded-[10px] bg-surface-2', wide ? 'h-14 w-20' : 'h-14 w-14')}>
      {src && <img src={mediaUrl(src)} alt={alt} className="h-full w-full object-cover" />}
    </div>
  );
}

/** Trilingual text editor with TM / RU / EN tabs. */
export function TranslatableField({
  label,
  value,
  onChange,
  multiline,
  required,
  placeholder,
}: {
  label: string;
  value: I18nText;
  onChange: (v: I18nText) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  const [tab, setTab] = useState<Locale>('ru');
  const Comp = multiline ? Textarea : Input;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">
          {label} {required && <span className="text-red-600">*</span>}
        </span>
        <div className="flex gap-1 rounded-full bg-surface-2 p-0.5">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setTab(l)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-bold transition',
                tab === l ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink',
                value[l] ? '' : 'opacity-60',
              )}
            >
              {LOCALE_LABEL[l]}
            </button>
          ))}
        </div>
      </div>
      <Comp
        value={value[tab] ?? ''}
        placeholder={placeholder ?? `${label} (${LOCALE_LABEL[tab]})`}
        rows={multiline ? 3 : undefined}
        onChange={(e) => onChange({ ...value, [tab]: e.target.value })}
      />
    </div>
  );
}

/** Image / file upload with preview. */
export function ImageUpload({
  label,
  hint,
  value,
  onChange,
  accept = 'image/*',
  kind = 'image',
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  kind?: 'image' | 'file';
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handle(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-line bg-surface-2 text-muted">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : value ? (
            kind === 'image' ? (
              <img src={mediaUrl(value)} alt="" className="h-full w-full object-cover" />
            ) : (
              <FileText className="h-7 w-7 text-accent" />
            )
          ) : kind === 'image' ? (
            <ImageIcon className="h-6 w-6" />
          ) : (
            <FileText className="h-6 w-6" />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2">
            <Upload className="h-4 w-4" />
            {value ? 'Заменить' : 'Загрузить'}
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handle(f);
                e.target.value = '';
              }}
            />
          </label>
          {value && (
            <button type="button" onClick={() => onChange('')} className="ml-2 text-xs text-red-600 hover:underline">
              Удалить
            </button>
          )}
          {err && <div className="text-xs text-red-600">{err}</div>}
        </div>
      </div>
    </div>
  );
}

/** Centered modal used for create/edit forms. */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'my-8 w-full rounded-[20px] border border-line bg-surface shadow-lg',
          wide ? 'max-w-3xl' : 'max-w-xl',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-extrabold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** Small inline confirm for destructive actions. */
export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            Удалить
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}
