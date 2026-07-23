import { Link } from 'react-router-dom';
import { Images, FolderTree, Package, BadgeCheck, MessageSquareQuote, Inbox } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useList } from '../queries';
import type { PartnerRequest } from '../../lib/types';
import { Badge, Card, PageHeader } from '../ui';

function StatCard({
  to,
  icon: Icon,
  count,
  label,
  extra,
}: {
  to: string;
  icon: ComponentType<{ className?: string }>;
  count: number;
  label: string;
  extra?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="rounded-[18px] border border-line bg-surface p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-accent-soft text-accent">
          <Icon className="h-5 w-5" />
        </span>
        {extra}
      </div>
      <div className="mt-4 text-3xl font-extrabold tracking-tight text-ink">{count}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </Link>
  );
}

export function Dashboard() {
  const banners = useList('banners');
  const categories = useList('categories');
  const products = useList('products');
  const certificates = useList('certificates');
  const reviews = useList('reviews');
  const requests = useList<PartnerRequest>('partner-requests');

  const newCount = requests.data?.filter((r) => r.status === 'new').length ?? 0;
  const latest = [...(requests.data ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <PageHeader title="Обзор" subtitle="Сводка по контенту сайта" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard to="/admin/banners" icon={Images} count={banners.data?.length ?? 0} label="Баннеры" />
        <StatCard to="/admin/categories" icon={FolderTree} count={categories.data?.length ?? 0} label="Категории" />
        <StatCard to="/admin/products" icon={Package} count={products.data?.length ?? 0} label="Продукция" />
        <StatCard to="/admin/certificates" icon={BadgeCheck} count={certificates.data?.length ?? 0} label="Сертификаты" />
        <StatCard to="/admin/reviews" icon={MessageSquareQuote} count={reviews.data?.length ?? 0} label="Отзывы" />
        <StatCard
          to="/admin/requests"
          icon={Inbox}
          count={requests.data?.length ?? 0}
          label="Заявки"
          extra={newCount > 0 ? <Badge tone="amber">{newCount} новых</Badge> : undefined}
        />
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-ink">Последние заявки</h2>
        {latest.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Заявок пока нет.</p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {latest.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{r.name}</div>
                  <div className="truncate text-sm text-muted">{r.company || '—'}</div>
                </div>
                <div className="shrink-0 text-sm text-muted">
                  {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
