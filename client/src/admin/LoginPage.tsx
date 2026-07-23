import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { Button, Field, Input } from './ui';
import { BrandMark } from '../components/BrandMark';
import { ApiError } from '../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@bakar.tm');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-[20px] border border-line bg-surface p-7 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <BrandMark className="h-12 w-12 text-accent" />
          <div>
            <div className="text-xl font-extrabold tracking-tight text-ink">BAKAR</div>
            <div className="text-sm text-muted">Панель управления</div>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </Field>
          <Field label="Пароль" error={error ?? undefined}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Войти
          </Button>
        </div>
      </form>
    </div>
  );
}
