import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, PenLine, Plus, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import PageHeader from '../components/PageHeader.jsx';
import { MediaThumb } from '../components/ContentCard.jsx';
import { PlatformBadge } from '../components/Brand.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, EmptyState, Skeleton } from '../components/ui/primitives.jsx';
import { PLATFORM_LABEL } from '../lib/constants.js';
import { cn, dayLabel, formatDate } from '../lib/format.js';

const ACTIONS = {
  created: { label: 'Created', icon: Sparkles, className: 'bg-success-soft text-success' },
  regenerated: { label: 'Regenerated', icon: RefreshCw, className: 'bg-info-soft text-info' },
  edited: { label: 'Edited', icon: PenLine, className: 'bg-warning-soft text-warning' }
};

const PAGE_SIZE = 30;

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <Skeleton className="size-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export default function History() {
  useDocumentTitle('History');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = async (p) => {
    const { data } = await api.get('/history', { params: { page: p, limit: PAGE_SIZE } });
    setHasMore(data.hasMore);
    setTotal(data.total);
    setPage(p);
    return data.history || [];
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchPage(1));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your history.'));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await fetchPage(page + 1);
      setItems((prev) => [...prev, ...next.filter((n) => !prev.some((p) => p._id === n._id))]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  // Load the first page once on mount
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((h) => {
      const key = dayLabel(h.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(h);
    });
    return [...map.entries()];
  }, [items]);

  return (
    <>
      <PageHeader
        title="History"
        description={total ? `${total.toLocaleString()} ${total === 1 ? 'activity' : 'activities'} across all your content.` : 'Every generation, edit and regeneration.'}
      />

      {loading ? (
        <Card className="divide-y divide-line">
          {Array.from({ length: 6 }, (_, i) => (
            <RowSkeleton key={i} />
          ))}
        </Card>
      ) : error && items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-danger">{error}</p>
          <Button variant="secondary" size="sm" onClick={load}>
            <RotateCcw className="size-3.5" />
            Try again
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="No activity yet"
            description="Everything you generate, edit or regenerate will appear here."
            action={
              <Button as={Link} to="/generate" variant="gradient">
                <Plus className="size-4" />
                New content
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {groups.map(([day, rows]) => (
            <section key={day}>
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-subtle">{day}</h2>
              <Card className="divide-y divide-line overflow-hidden">
                {rows.map((h, i) => {
                  const c = h.contentId;
                  const action = ACTIONS[h.action] || ACTIONS.created;
                  const ActionIcon = action.icon;
                  return (
                    <motion.div
                      key={h._id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.3 }}
                    >
                      <Link to={`/result/${c._id}`} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2/60">
                        <div className="relative shrink-0">
                          <MediaThumb media={c.mediaId} width={160} className="size-12 rounded-xl" />
                          <PlatformBadge platform={c.platform} size="sm" className="absolute -bottom-1.5 -right-1.5 size-5 rounded-md ring-2 ring-surface [&_svg]:size-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm font-medium">
                              {PLATFORM_LABEL[c.platform]} {c.contentType}
                            </span>
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', action.className)}>
                              <ActionIcon className="size-3" />
                              {action.label}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[13px] text-muted">{c.hook || c.title || c.caption || 'Untitled'}</p>
                        </div>
                        <time dateTime={h.createdAt} className="hidden shrink-0 text-xs text-subtle sm:block">
                          {formatDate(h.createdAt, { timeStyle: 'short' })}
                        </time>
                        <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                      </Link>
                    </motion.div>
                  );
                })}
              </Card>
            </section>
          ))}
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
