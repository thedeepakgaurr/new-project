import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/axios.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Button from '../components/ui/Button.jsx';
import { TextField } from '../components/ui/Field.jsx';
import { FormError } from './Login.jsx';
import { cn } from '../lib/format.js';

// Mirrors the server-side password policy in backend/routes/auth.js
export const PASSWORD_RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'A letter', test: (p) => /[A-Za-z]/.test(p) },
  { label: 'A number', test: (p) => /\d/.test(p) }
];

export function PasswordChecklist({ password }) {
  return (
    <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password requirements">
      {PASSWORD_RULES.map(({ label, test }) => {
        const ok = test(password);
        return (
          <li key={label} className={cn('flex items-center gap-1.5 text-xs transition-colors', ok ? 'text-success' : 'text-subtle')}>
            <span
              className={cn(
                'flex size-3.5 items-center justify-center rounded-full transition-colors',
                ok ? 'bg-success text-white' : 'border border-line-strong'
              )}
            >
              {ok && <Check className="size-2.5" strokeWidth={3.5} />}
            </span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}

export default function Register() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const passwordOk = PASSWORD_RULES.every((r) => r.test(form.password));

  const submit = async (e) => {
    e.preventDefault();
    if (!passwordOk) {
      setError('Please choose a password that meets all the requirements.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/generate', { replace: true, state: { welcome: true } });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted">Start turning your media into ready-to-post content.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <FormError message={error} />
        <TextField
          label="Name"
          autoComplete="name"
          required
          maxLength={80}
          autoFocus
          value={form.name}
          onChange={update('name')}
          placeholder="Your name"
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
        />
        <div>
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={form.password}
            onChange={update('password')}
            placeholder="Create a password"
          />
          <PasswordChecklist password={form.password} />
        </div>
        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          {loading ? 'Creating account…' : 'Create account'}
          {!loading && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-fg underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
