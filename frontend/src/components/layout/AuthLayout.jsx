import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../Brand.jsx';
import ProductDemo from '../home/ProductDemo.jsx';
import { ThemeMenu } from './PublicLayout.jsx';

export default function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeMenu />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <Outlet />
          </motion.div>
        </div>
        <p className="text-center text-xs text-subtle">© {new Date().getFullYear()} SocialBoost AI</p>
      </div>

      <div className="relative hidden overflow-hidden border-l border-line bg-[#0c0a1d] lg:block">
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-[#7b5cff] opacity-40 blur-[110px]" aria-hidden />
        <div className="absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-[#ff7a3d] opacity-30 blur-[110px]" aria-hidden />
        <div className="absolute right-1/3 top-1/3 h-72 w-72 rounded-full bg-[#d946a8] opacity-30 blur-[100px]" aria-hidden />
        <div className="bg-grid absolute inset-0 opacity-[0.06]" aria-hidden />
        <div className="relative flex h-full flex-col justify-center px-12 py-16 xl:px-20">
          <div className="dark">
            <ProductDemo className="mx-auto w-full max-w-xl" />
          </div>
          <div className="mx-auto mt-14 max-w-md text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
              Your media, understood. Your copy, written.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Hooks, captions, titles, hashtags and CTAs crafted for Instagram, YouTube and Facebook from a single upload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
