import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Bookmark, CalendarDays, Layers, Plus, RotateCcw, Sparkles, TrendingUp } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import PageHeader, { CountUp } from '../components/PageHeader.jsx';
import ContentCard, { ContentCardSkeleton } from '../components/ContentCard.jsx';
import { PlatformBadge } from '../components/Brand.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, EmptyState, Skeleton } from '../components/ui/primitives.jsx';
import { PLATFORMS, PLATFORM_LABEL } from '../lib/constants.js';
import { greeting } from '../lib/format.js';

const PLATFORM_BAR = { instagram: 'bg-[#d62976]', youtube: 'bg-[#ff0033]', facebook: 'bg-[#1877f2]' };

function StatCard({ icon: Icon, label, value, sub, loading, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="h-full p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted">{label}</span>
          <span className="flex size-8 items-center justify-center rounded-lg bg-surface-2">
            <Icon className="size-4 text-fg-2" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-4 h-8 w-16" />
        ) : (
          <div className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {typeof value === 'number' ? <CountUp value={value} /> : value}
          </div>
        )}
        {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [list, s] = await Promise.all([api.get('/content', { params: { limit: 6 } }), api.get('/content/stats')]);
      setRecent(list.data.content || []);
      setStats(s.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const firstName = (user?.name || '').split(' ')[0];
  const topPlatform =
    stats && stats.total ? Object.entries(stats.byPlatform).sort((a, b) => b[1] - a[1])[0][0] : null;

  return (
    <>
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        description="Here is what is happening with your content."
        actions={
          <Button as={Link} to="/generate" variant="gradient">
            <Plus className="size-4" strokeWidth={2.5} />
            New content
          </Button>
        }
      />

      {error ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-danger">{error}</p>
          <Button variant="secondary" size="sm" onClick={load}>
            <RotateCcw className="size-3.5" />
            Try again
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard index={0} icon={Layers} label="Total generated" value={stats?.total ?? 0} loading={loading} />
            <StatCard index={1} icon={CalendarDays} label="This week" value={stats?.lastWeek ?? 0} sub="Last 7 days" loading={loading} />
            <StatCard index={2} icon={Bookmark} label="In library" value={stats?.saved ?? 0} sub="Saved items" loading={loading} />
            <StatCard
              index={3}
              icon={TrendingUp}
              label="Top platform"
              loading={loading}
              value={
                topPlatform ? (
                  <span className="flex min-w-0 items-center gap-2 text-lg sm:text-2xl">
                    <PlatformBadge platform={topPlatform} size="sm" />
                    <span className="truncate">{PLATFORM_LABEL[topPlatform]}</span>
                  </span>
                ) : (
                  <span className="text-2xl text-subtle">—</span>
                )
              }
            />
          </div>

          <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_300px]">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold tracking-tight">Recent content</h2>
                {recent.length > 0 && (
                  <Link to="/history" className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-fg">
                    View history <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </div>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <ContentCardSkeleton key={i} />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={Sparkles}
                    title="Create your first post"
                    description="Upload a photo or video and get platform-ready captions, hashtags and hooks in seconds."
                    action={
                      <Button as={Link} to="/generate" variant="gradient">
                        <Plus className="size-4" />
                        New content
                      </Button>
                    }
                  />
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recent.map((item, i) => (
                    <ContentCard key={item._id} item={item} index={i} />
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <Card className="p-5">
                <h2 className="text-sm font-semibold">Platform mix</h2>
                <div className="mt-4 space-y-3.5">
                  {PLATFORMS.map((p) => {
                    const count = stats?.byPlatform?.[p.id] || 0;
                    const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={p.id}>
                        <div className="mb-1.5 flex items-center justify-between text-[13px]">
                          <span className="text-fg-2">{p.label}</span>
                          <span className="tabular-nums text-muted">{loading ? '–' : count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <motion.div
                            className={`h-full rounded-full ${PLATFORM_BAR[p.id]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-sm font-semibold">Quick start</h2>
                <p className="mt-1 text-xs text-muted">Jump straight into a platform.</p>
                <div className="mt-4 space-y-1">
                  {PLATFORMS.map((p) => (
                    <Link
                      key={p.id}
                      to={`/generate?platform=${p.id}`}
                      className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2"
                    >
                      <PlatformBadge platform={p.id} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{p.label}</span>
                        <span className="block truncate text-xs text-muted">{p.blurb}</span>
                      </span>
                      <ArrowUpRight className="size-4 text-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                    </Link>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
