import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useSiteData } from '../lib/queries';
import { useLocale } from '../lib/i18n';
import { api } from '../lib/api';
import { Seo } from '../lib/seo';
import { Reveal } from '../lib/motion';

export function Contacts() {
  const { data } = useSiteData();
  const { ui, tt } = useLocale();
  const contacts = data?.settings.contacts;

  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      await api.post('/public/partner-requests', form);
      setState('sent');
      setForm({ name: '', company: '', phone: '', email: '', message: '' });
    } catch {
      setState('error');
    }
  }

  const items = [
    { icon: MapPin, label: ui('contacts.address'), value: tt(contacts?.address) },
    { icon: Phone, label: ui('contacts.phone'), value: contacts?.phone, href: `tel:${contacts?.phone}` },
    { icon: Mail, label: ui('contacts.email'), value: contacts?.email, href: `mailto:${contacts?.email}` },
    { icon: Clock, label: ui('contacts.hours'), value: tt(contacts?.hours) },
  ].filter((i) => i.value);

  return (
    <div className="pt-28 sm:pt-32">
      <Seo page="contacts" />
      <section className="bk-wrap pb-20">
        <Reveal>
          <span className="bk-kick">{ui('contacts.title')}</span>
          <h1 className="bk-h2 max-w-2xl">{ui('cta.partner')}</h1>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          {/* info */}
          <div className="space-y-4">
            {items.map((it, i) => (
              <div key={i} className="flex items-start gap-4 rounded-[16px] border border-line bg-surface p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
                  <it.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted">{it.label}</div>
                  {it.href ? (
                    <a href={it.href} className="mt-0.5 block font-semibold text-ink hover:text-accent">{it.value}</a>
                  ) : (
                    <div className="mt-0.5 font-semibold text-ink">{it.value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* form */}
          <div className="rounded-[24px] border border-line bg-surface p-7 shadow-sm">
            {state === 'sent' ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-14 w-14 text-accent" />
                <p className="mt-4 max-w-xs text-lg font-semibold text-ink">{ui('form.success')}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    placeholder={ui('form.name')}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-[12px] border border-line bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                  />
                  <input
                    placeholder={ui('form.company')}
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full rounded-[12px] border border-line bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                  />
                  <input
                    placeholder={ui('form.phone')}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-[12px] border border-line bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                  />
                  <input
                    type="email"
                    placeholder={ui('form.email')}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-[12px] border border-line bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                  />
                </div>
                <textarea
                  rows={4}
                  placeholder={ui('form.message')}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                />
                {state === 'error' && <p className="text-sm text-red-600">{ui('form.error')}</p>}
                <button type="submit" disabled={state === 'sending'} className="bk-btn bk-btn-primary w-full justify-center disabled:opacity-60">
                  {state === 'sending' ? ui('form.sending') : ui('form.submit')} <Send />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
