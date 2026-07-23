import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../auth';
import { Button, Card, Field, Input, PageHeader } from '../ui';

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Произошла ошибка';
}

export function ProfilePage() {
  const { user } = useAuth();

  // --- Профиль ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', { name, email });
      toast.success('Профиль обновлён');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  // --- Смена пароля ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const lengthError = newPassword.length > 0 && newPassword.length < 8 ? 'Минимум 8 символов' : undefined;
  const matchError = repeatPassword.length > 0 && repeatPassword !== newPassword ? 'Пароли не совпадают' : undefined;

  const submitLengthError = touched && newPassword.length < 8 ? 'Минимум 8 символов' : lengthError;
  const submitMatchError = touched && repeatPassword !== newPassword ? 'Пароли не совпадают' : matchError;

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (newPassword.length < 8 || newPassword !== repeatPassword) return;
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Пароль изменён');
      setCurrentPassword('');
      setNewPassword('');
      setRepeatPassword('');
      setTouched(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <PageHeader title="Профиль" subtitle="Данные администратора и пароль" />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold text-ink">Профиль</h2>
          <form className="space-y-4" onSubmit={saveProfile}>
            <Field label="Имя">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Button type="submit" loading={savingProfile}>
              Сохранить
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold text-ink">Смена пароля</h2>
          <form className="space-y-4" onSubmit={changePassword}>
            <Field label="Текущий пароль">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field label="Новый пароль" error={submitLengthError}>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Повторите новый пароль" error={submitMatchError}>
              <Input
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" loading={savingPassword}>
              Изменить пароль
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
