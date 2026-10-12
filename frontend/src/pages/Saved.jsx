import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Bookmark, BookmarkX, RotateCcw, Search, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import api, { getErrorMessage } from '../api/axios.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import PageHeader from '../components/PageHeader.jsx';
import ContentCard, { ContentCardSkeleton } from '../components/ContentCard.jsx';
import Button from '../components/ui/Button.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import { Card, EmptyState } from '../components/ui/primitives.jsx';
import { inputClass } from '../components/ui/Field.jsx';
import { PLATFORMS } from '../lib/constants.js';
import { cn } from '../lib/format.js';

const FILTERS = [{ value: 'all', label: 'All' }, ...PLATFORMS.map((p) => ({ value: p.id, label: p.label }))];

export default function Saved() {
  useDocumentTitle('Library');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/saved');
      setItems(data.saved || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your library.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(({ contentId: c }) => {
      if (platform !== 'all' && c.platform !== platform) return false;
      if (!q) return true;
      return [c.hook, c.title, c.caption, c.contentType, ...(c.hashtags || [])].some((v) => v?.toLowerCase().includes(q));
    });
  }, [items, query, platform]);

  // Optimistic remove with an undo window
  const unsave = async (saved) => {
    setItems((prev) => prev.filter((s) => s._id !== saved._id));
    try {
      await api.delete(`/saved/${saved._id}`);
      toast('Removed from library', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const { data } = await api.post('/saved', { contentId: saved.contentId._id });
              setItems((prev) => [{ ...saved, _id: data.saved._id }, ...prev]);
            } catch (err) {
              toast.error(getErrorMessage(err));
            }
          }
        }
      });
    } catch (err) {
      setItems((prev) => [saved, ...prev]);
      toast.error(getErrorMessage(err, 'Could not remove this item.'));
    }
  };

  return (
    <>
      <PageHeader title="Library" description="Your saved content, ready to reuse." />

      {!loading && !error && items.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search captions, hashtags…"
              aria-label="Search library"
              className={cn(inputClass, 'h-10 pl-10')}
            />
          </div>
          <Segmented label="Filter by platform" value={platform} onChange={setPlatform} options={FILTERS} size="sm" className="self-start overflow-x-auto" />
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
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
            icon={Bookmark}
            title="Your library is empty"
            description="Save the posts you love from any result page and they will show up here."
            action={
              <Button as={Link} to="/dashboard" variant="secondary">
                Browse your content
              </Button>
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="No matches"
            description="Try a different search or platform filter."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setPlatform('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((s, i) => (
              <ContentCard
                key={s._id}
                item={s.contentId}
                index={i}
                footer={
                  <Button variant="ghost" size="sm" onClick={() => unsave(s)} className="-ml-2 text-muted">
                    <BookmarkX className="size-3.5" />
                    Remove
                  </Button>
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
