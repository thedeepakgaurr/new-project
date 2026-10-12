import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import PageHeader from '../components/PageHeader.jsx';
import { Avatar } from '../components/layout/AppLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Card } from '../components/ui/primitives.jsx';
import { TextField } from '../components/ui/Field.jsx';
import { PASSWORD_RULES, PasswordChecklist } from './Register.jsx';
import { cn, formatDate } from '../lib/format.js';

function Section({ title, description, children, tone }) {
  return (
    <Card className={cn('grid gap-6 p-6 md:grid-cols-[240px_1fr] md:gap-10', tone === 'danger' && 'border-danger/30')}>
      <div>
        <h2 className={cn('text-[15px] font-semibold', tone === 'danger' && 'text-danger')}>{title}</h2>
        <p className="mt-1 text-[13px] text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </Card>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const changed = name.trim() && name.trim() !== user?.name;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', { name: name.trim() });
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <div className="flex items-center gap-3">
        <Avatar name={name || user?.name} className="size-12 text-base" />
        <div className="text-[13px] text-muted">
          Member since {user?.createdAt ? formatDate(user.createdAt, { month: 'long', year: 'numeric' }) : '—'}
        </div>
      </div>
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoComplete="name" />
      <TextField label="Email" value={user?.email || ''} disabled hint="Email can’t be changed." />
      <Button type="submit" loading={saving} disabled={!changed}>
        Save profile
      </Button>
    </form>
  );
}

function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];
  return (
    <div className="grid max-w-md grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all',
            theme === value ? 'border-brand bg-brand-soft/40 text-fg ring-4 ring-brand/10' : 'border-line text-muted hover:border-line-strong hover:text-fg'
          )}
        >
          <Icon className="size-5" />
          {label}
        </button>
      ))}
    </div>
  );
}

function PasswordForm() {
  const { saveAuth, user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const valid = form.currentPassword && PASSWORD_RULES.every((r) => r.test(form.newPassword));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/password', form);
      // Old tokens are revoked server-side; keep this session alive with the new one
      saveAuth(data.token, user);
      setForm({ currentPassword: '', newPassword: '' });
      toast.success('Password updated. Other sessions have been signed out.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={form.currentPassword}
        onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
        error={error}
      />
      <div>
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
        />
        <PasswordChecklist password={form.newPassword} />
      </div>
      <Button type="submit" loading={saving} disabled={!valid}>
        Update password
      </Button>
    </form>
  );
}

function DeleteAccount() {
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setDeleting(true);
    try {
      await api.delete('/auth/me', { data: { password } });
      saveAuth(null, null);
      toast.success('Your account has been deleted');
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <>
      <p className="max-w-md text-sm text-fg-2">
        Permanently delete your account, all generated content, your library, history and every uploaded file. This can’t be undone.
      </p>
      <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <Modal
        open={open}
        onClose={() => !deleting && setOpen(false)}
        dismissible={!deleting}
        size="sm"
        title="Delete your account?"
        description="Enter your password to confirm. Everything will be permanently removed."
      >
        <form onSubmit={submit} className="space-y-4 pb-6">
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            data-autofocus
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={deleting} disabled={!password}>
              Delete forever
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function Settings() {
  useDocumentTitle('Settings');
  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, appearance and security." />
      <div className="space-y-5">
        <Section title="Profile" description="How you appear across SocialBoost.">
          <ProfileForm />
        </Section>
        <Section title="Appearance" description="Choose a theme or follow your system setting.">
          <AppearanceForm />
        </Section>
        <Section title="Password" description="Changing it signs you out on other devices.">
          <PasswordForm />
        </Section>
        <Section title="Danger zone" description="Irreversible account actions." tone="danger">
          <DeleteAccount />
        </Section>
      </div>
    </>
  );
}
