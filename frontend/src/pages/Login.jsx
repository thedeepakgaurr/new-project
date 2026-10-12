import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/axios.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Button from '../components/ui/Button.jsx';
import { TextField } from '../components/ui/Field.jsx';

// Only same-app paths, never protocol-relative or absolute URLs
function safeRedirect(from) {
  const path = from?.pathname;
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return '/dashboard';
  return path + (from.search || '');
}

export function FormError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div role="alert" className="mb-5 flex gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-3 text-sm text-danger">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Login() {
  useDocumentTitle('Sign in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(safeRedirect(location.state?.from), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Sign in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in to keep creating.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <FormError message={error} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={update('password')}
          placeholder="Your password"
        />
        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        New to SocialBoost?{' '}
        <Link to="/register" className="font-medium text-fg underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
