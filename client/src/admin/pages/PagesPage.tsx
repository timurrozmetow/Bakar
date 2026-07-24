import { useEffect, useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { useSetting } from '../queries';
import {
  emptyI18n,
  toI18n,
  type AboutBlock as AboutBlockData,
  type AboutStep,
  type AboutValue,
  type I18nText,
  type StatItem,
} from '../../lib/types';
import { Button, Card, Field, Input, PageHeader } from '../ui';
import { ImageUpload, TranslatableField } from '../components';

/** Small header used by the repeatable sections of the About editor. */
function SubSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-[14px] border border-line p-4">
      <div>
        <div className="text-sm font-bold text-ink">{title}</div>
        {hint && <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const emptyAbout = (): AboutBlockData => ({
  heading: emptyI18n(),
  lead: emptyI18n(),
  body: emptyI18n(),
  image: '',
  story: { heading: emptyI18n(), body: emptyI18n() },
  steps: [],
  values: [],
  gallery: [],
});

/**
 * "О нас" editor.
 *
 * Everything past the intro is optional, so the block is merged field by field
 * onto a complete blank rather than spread over it — a record saved before these
 * fields existed would otherwise arrive with `steps` undefined and crash the map.
 */
function AboutBlock() {
  const { value, loading, save, saving } = useSetting<Partial<AboutBlockData>>('about');
  const [d, setD] = useState<AboutBlockData>(emptyAbout());

  useEffect(() => {
    if (!value) return;
    const base = emptyAbout();
    setD({
      heading: toI18n(value.heading ?? base.heading),
      lead: toI18n(value.lead ?? base.lead),
      body: toI18n(value.body ?? base.body),
      image: value.image ?? '',
      story: {
        heading: toI18n(value.story?.heading ?? base.story.heading),
        body: toI18n(value.story?.body ?? base.story.body),
      },
      steps: Array.isArray(value.steps) ? value.steps : [],
      values: Array.isArray(value.values) ? value.values : [],
      gallery: Array.isArray(value.gallery) ? value.gallery.filter(Boolean) : [],
    });
  }, [value]);

  const setStep = (i: number, patch: Partial<AboutStep>) => {
    const steps = [...d.steps];
    steps[i] = { ...steps[i], ...patch };
    setD({ ...d, steps });
  };
  const setValueRow = (i: number, patch: Partial<AboutValue>) => {
    const values = [...d.values];
    values[i] = { ...values[i], ...patch };
    setD({ ...d, values });
  };

  return (
    <Card className="space-y-4 xl:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">Страница «О нас»</h2>
        <Button size="sm" loading={saving} onClick={() => save(d)}>
          <Save className="h-4 w-4" /> Сохранить
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Загрузка…</div>
      ) : (
        <div className="space-y-4">
          <SubSection title="Первый экран" hint="Надзаголовок, крупный заголовок, вводный абзац и фото рядом с ним.">
            <TranslatableField label="Надзаголовок" value={d.heading} onChange={(heading) => setD({ ...d, heading })} />
            <TranslatableField label="Заголовок" value={d.lead} onChange={(lead) => setD({ ...d, lead })} />
            <TranslatableField label="Вводный текст" multiline value={d.body} onChange={(body) => setD({ ...d, body })} />
            <ImageUpload
              label="Главное фото"
              hint="Горизонтальный кадр, примерно 1600 × 1200. Можно оставить пустым — блок просто станет на всю ширину."
              value={d.image}
              onChange={(image) => setD({ ...d, image })}
            />
          </SubSection>

          <SubSection
            title="История"
            hint="Развёрнутый рассказ о компании. Пустая строка между абзацами разделит текст на абзацы на сайте."
          >
            <TranslatableField
              label="Заголовок раздела"
              value={d.story.heading}
              onChange={(heading) => setD({ ...d, story: { ...d.story, heading } })}
            />
            <TranslatableField
              label="Текст"
              multiline
              value={d.story.body}
              onChange={(body) => setD({ ...d, story: { ...d.story, body } })}
            />
          </SubSection>

          <SubSection
            title="Этапы производства"
            hint="Например: приёмка сырья, очистка, калибровка, обжарка, фасовка, контроль качества. Фото необязательно — без него останется номер этапа."
          >
            {d.steps.map((s, i) => (
              <div key={i} className="space-y-3 rounded-[12px] border border-line p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Этап {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setD({ ...d, steps: d.steps.filter((_, j) => j !== i) })}
                    aria-label="Удалить этап"
                    className="rounded-lg p-2 text-muted hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <TranslatableField label="Название" value={s.title} onChange={(title) => setStep(i, { title })} />
                <TranslatableField label="Описание" multiline value={s.text} onChange={(text) => setStep(i, { text })} />
                <ImageUpload label="Фото этапа" hint="Необязательно" value={s.image} onChange={(image) => setStep(i, { image })} />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setD({ ...d, steps: [...d.steps, { image: '', title: emptyI18n(), text: emptyI18n() }] })}
            >
              <Plus className="h-4 w-4" /> Добавить этап
            </Button>
          </SubSection>

          <SubSection title="Принципы работы" hint="Короткие тезисы: чем вы отличаетесь и почему вам доверяют.">
            {d.values.map((v, i) => (
              <div key={i} className="space-y-3 rounded-[12px] border border-line p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Принцип {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setD({ ...d, values: d.values.filter((_, j) => j !== i) })}
                    aria-label="Удалить принцип"
                    className="rounded-lg p-2 text-muted hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <TranslatableField label="Название" value={v.title} onChange={(title) => setValueRow(i, { title })} />
                <TranslatableField label="Описание" multiline value={v.text} onChange={(text) => setValueRow(i, { text })} />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setD({ ...d, values: [...d.values, { title: emptyI18n(), text: emptyI18n() }] })}
            >
              <Plus className="h-4 w-4" /> Добавить принцип
            </Button>
          </SubSection>

          <SubSection
            title="Галерея производства"
            hint="Фотографии завода. Первая показывается крупно, остальные — плиткой. Горизонтальные кадры от 1600 px по ширине."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {d.gallery.map((src, i) => (
                <div key={i} className="rounded-[12px] border border-line p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      Фото {i + 1}
                      {i === 0 ? ' — крупное' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setD({ ...d, gallery: d.gallery.filter((_, j) => j !== i) })}
                      aria-label="Удалить фото"
                      className="rounded-lg p-2 text-muted hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ImageUpload
                    label=""
                    value={src}
                    onChange={(url) => {
                      const gallery = [...d.gallery];
                      gallery[i] = url;
                      setD({ ...d, gallery });
                    }}
                  />
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setD({ ...d, gallery: [...d.gallery, ''] })}>
              <Plus className="h-4 w-4" /> Добавить фото
            </Button>
          </SubSection>
        </div>
      )}
    </Card>
  );
}

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

        <AboutBlock />

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
