import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { Logo } from '../components/Brand.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  useDocumentTitle('Page not found');
  const { token } = useAuth();
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" aria-hidden />
      <div className="relative">
        <Logo className="mb-12" />
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-gradient font-display text-8xl font-bold tracking-tighter sm:text-9xl"
        >
          404
        </motion.p>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">This page doesn’t exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">The link may be broken, or the page may have been moved.</p>
        <Button as={Link} to={token ? '/dashboard' : '/'} className="mt-8">
          <ArrowLeft className="size-4" />
          {token ? 'Back to dashboard' : 'Back home'}
        </Button>
      </div>
    </div>
  );
}
