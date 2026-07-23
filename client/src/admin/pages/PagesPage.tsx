import { useEffect, useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { useSetting } from '../queries';
import { emptyI18n, toI18n, type I18nText, type StatItem } from '../../lib/types';
import { Button, Card, Field, Input, PageHeader } from '../ui';
import { TranslatableField } from '../components';

/** Stats block — stored shape is a plain array (matches the public site). */
function StatsBlock() {
  const { value, loading, save, saving } = useSetting<StatItem[]>('home_stats');
  const [items, setItems] = useState<StatItem[]>([]);
  useEffect(() => {
    if (Array.isArray(value)) setItems(value);
  }, [value]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">Статистика (главная)</h2>
        <Button size="sm" loading={saving} onClick={() => save(items)}>
          <Save className="h-4 w-4" /> Сохранить
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted">Загрузка…</div>
      ) : (
        <div className="space-y-3">
          {items.map((s, i) => (
            <div key={i} className="rounded-[12px] border border-line p-3">
              <div className="flex items-center gap-2">
                <Input
                  className="w-28"
                  placeholder="6"
                  value={s.value}
                  onChange={(e) => { const next = [...items]; next[i] = { ...next[i], value: e.target.value }; setItems(next); }}
                />
                <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="ml-auto rounded-lg p-2 text-muted hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2">
                <TranslatableField
                  label="Подпись"
                  value={s.label}
                  onChange={(label: I18nText) => { const next = [...items]; next[i] = { ...next[i], label }; setItems(next); }}
                />
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setItems([...items, { value: '', label: emptyI18n() }])}>
            <Plus className="h-4 w-4" /> Добавить показатель
          </Button>
        </div>
      )}
    </Card>
  );
}

/** Generic wrapper: loads a settings key, gives children a draft + save button. */
function Block<T>({ title, sectionKey, initial, render }: {
  title: string;
  sectionKey: string;
  initial: T;
  render: (draft: T, set: (v: T) => void) => React.ReactNode;
}) {
  const { value, loading, save, saving } = useSetting<T>(sectionKey);
  const [draft, setDraft] = useState<T>(initial);

  useEffect(() => {
    if (value) setDraft({ ...initial, ...(value as object) } as T);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">{title}</h2>
        <Button size="sm" loading={saving} onClick={() => save(draft)}>
          <Save className="h-4 w-4" /> Сохранить
        </Button>
      </div>
      {loading ? <div className="text-sm text-muted">Загрузка…</div> : render(draft, setDraft)}
    </Card>
  );
}

export function PagesPage() {
  return (
    <div>
      <PageHeader title="Тексты страниц" subtitle="Контент-блоки главной, «О нас», контактов и футера" />

      <div className="grid gap-5 xl:grid-cols-2">
        <Block
          title="Главный экран"
          sectionKey="home_hero"
          initial={{ headline: emptyI18n() }}
          render={(d, set) => (
            <TranslatableField label="Заголовок" value={d.headline} onChange={(headline) => set({ ...d, headline })} />
          )}
        />

        <Block
          title="Блок «О нас»"
          sectionKey="about"
          initial={{ heading: emptyI18n(), lead: emptyI18n(), body: emptyI18n() }}
          render={(d, set) => (
            <>
              <TranslatableField label="Заголовок" value={d.heading} onChange={(heading) => set({ ...d, heading })} />
              <TranslatableField label="Лид" value={d.lead} onChange={(lead) => set({ ...d, lead })} />
              <TranslatableField label="Текст" multiline value={d.body} onChange={(body) => set({ ...d, body })} />
            </>
          )}
        />

        <Block
          title="Контакты"
          sectionKey="contacts"
          initial={{ address: emptyI18n(), phone: '', email: '', hours: emptyI18n(), instagram: '', telegram: '' }}
          render={(d, set) => (
            <>
              <TranslatableField label="Адрес" value={d.address} onChange={(address) => set({ ...d, address })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Телефон"><Input value={d.phone} onChange={(e) => set({ ...d, phone: e.target.value })} /></Field>
                <Field label="E-mail"><Input value={d.email} onChange={(e) => set({ ...d, email: e.target.value })} /></Field>
              </div>
              <TranslatableField label="Часы работы" value={d.hours} onChange={(hours) => set({ ...d, hours })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Instagram"><Input value={d.instagram} onChange={(e) => set({ ...d, instagram: e.target.value })} /></Field>
                <Field label="Telegram"><Input value={d.telegram} onChange={(e) => set({ ...d, telegram: e.target.value })} /></Field>
              </div>
            </>
          )}
        />

        <Block
          title="Призыв к партнёрству"
          sectionKey="partner_cta"
          initial={{ heading: emptyI18n(), body: emptyI18n() }}
          render={(d, set) => (
            <>
              <TranslatableField label="Заголовок" value={d.heading} onChange={(heading) => set({ ...d, heading })} />
              <TranslatableField label="Текст" multiline value={d.body} onChange={(body) => set({ ...d, body })} />
            </>
          )}
        />

        <Block
          title="Футер"
          sectionKey="footer"
          initial={{ lead: emptyI18n() }}
          render={(d, set) => (
            <TranslatableField label="Описание" multiline value={d.lead} onChange={(lead) => set({ ...d, lead })} />
          )}
        />

        {/* Words are trilingual. Anything saved before that change comes back as
            a bare string, so each word is widened with toI18n() on load. */}
        <Block
          title="Бегущая строка"
          sectionKey="marquee"
          initial={{ words: [] as (I18nText | string)[] }}
          render={(d, set) => (
            <div className="space-y-3">
              {d.words.map((w, i) => (
                <div key={i} className="rounded-[12px] border border-line p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <TranslatableField
                        label={`Слово ${i + 1}`}
                        value={toI18n(w)}
                        onChange={(next: I18nText) => {
                          const words = [...d.words];
                          words[i] = next;
                          set({ ...d, words });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => set({ ...d, words: d.words.filter((_, j) => j !== i) })}
                      className="rounded-lg p-2 text-muted hover:text-red-600"
                      aria-label="Удалить слово"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => set({ ...d, words: [...d.words, emptyI18n()] })}>
                <Plus className="h-4 w-4" /> Добавить слово
              </Button>
            </div>
          )}
        />

        <StatsBlock />
      </div>
    </div>
  );
}
