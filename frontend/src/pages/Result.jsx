import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  FileQuestion,
  LayoutList,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { PlatformBadge } from '../components/Brand.jsx';
import ContentFields, { copyText, toDraft } from '../components/result/ContentFields.jsx';
import AnalysisPanel from '../components/result/AnalysisPanel.jsx';
import PostPreview from '../components/result/PostPreview.jsx';
import Button from '../components/ui/Button.jsx';
import Menu, { MenuItem, MenuLabel, MenuSeparator } from '../components/ui/Menu.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { Badge, Card, EmptyState, Kbd, Skeleton } from '../components/ui/primitives.jsx';
import { PLATFORM_LABEL, TONES } from '../lib/constants.js';
import { fieldText, formatDate, timeAgo } from '../lib/format.js';
import { isVideo } from '../lib/media.js';

// Full post text in the order it would be pasted into the platform
function composePost(c) {
  const tags = fieldText(c.hashtags, 'hashtags');
  if (c.platform === 'youtube') return [c.title, c.description, tags].filter(Boolean).join('\n\n');
  const caption = c.caption || '';
  const parts = [
    c.title,
    c.hook && !caption.includes(c.hook) ? c.hook : '',
    caption,
    c.cta && !caption.includes(c.cta) ? c.cta : '',
    tags
  ];
  return parts.filter(Boolean).join('\n\n');
}

function ResultSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-24" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
        <Skeleton className="aspect-[4/5] rounded-2xl" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [content, setContent] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState('content');
  const [busy, setBusy] = useState(''); // '' | 'save-edit' | 'regen' | 'bookmark' | 'delete'
  const [loadError, setLoadError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [revealKey, setRevealKey] = useState(0);

  useDocumentTitle(content ? `${PLATFORM_LABEL[content.platform]} ${content.contentType}` : 'Result');

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { data } = await api.get(`/content/${id}`);
      setContent(data.content);
      setAnalysis(data.analysis);
      setSavedId(data.savedId);
      setRevealKey((k) => k + 1);
    } catch (err) {
      setLoadError({ status: err?.response?.status, message: getErrorMessage(err, 'Could not load this content.') });
    }
  }, [id]);

  useEffect(() => {
    setContent(null);
    setEditing(false);
    load();
  }, [load]);

  const dirty = editing && content && draft && JSON.stringify(draft) !== JSON.stringify(toDraft(content));

  // Protect unsaved edits from an accidental tab close
  useEffect(() => {
    if (!dirty) return undefined;
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  const startEdit = () => {
    setDraft(toDraft(content));
    setEditing(true);
    setView('content');
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
  };

  const saveEdit = useCallback(async () => {
    if (!dirty) {
      cancelEdit();
      return;
    }
    setBusy('save-edit');
    try {
      const { data } = await api.put(`/content/${id}`, draft);
      setContent(data.content);
      setEditing(false);
      setDraft(null);
      toast.success('Changes saved');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your changes.'));
    } finally {
      setBusy('');
    }
  }, [dirty, draft, id]);

  // Cmd/Ctrl+Enter saves, Escape cancels while editing
  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape' && !dirty) {
        cancelEdit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, dirty, saveEdit]);

  const regenerate = async (tone) => {
    setBusy('regen');
    const toastId = toast.loading(tone ? `Rewriting in a ${tone.toLowerCase()} tone…` : 'Generating a fresh version…');
    try {
      const { data } = await api.post(`/content/${id}/regenerate`, tone ? { tone } : {}, { timeout: 4 * 60_000 });
      setContent(data.content);
      if (data.analysis) setAnalysis(data.analysis);
      setEditing(false);
      setDraft(null);
      setRevealKey((k) => k + 1);
      toast.success('New version ready', { id: toastId });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Regeneration failed. Please try again.'), { id: toastId });
    } finally {
      setBusy('');
    }
  };

  const toggleSave = async () => {
    setBusy('bookmark');
    const prev = savedId;
    try {
      if (prev) {
        setSavedId(null);
        await api.delete(`/saved/${prev}`);
        toast('Removed from library');
      } else {
        setSavedId('pending');
        const { data } = await api.post('/saved', { contentId: id });
        setSavedId(data.saved._id);
        toast.success('Saved to library', { action: { label: 'View', onClick: () => navigate('/saved') } });
      }
    } catch (err) {
      setSavedId(prev);
      toast.error(getErrorMessage(err, 'Could not update your library.'));
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await api.delete(`/content/${id}`);
      toast.success('Content deleted');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this content.'));
      setBusy('');
      setConfirmDelete(false);
    }
  };

  const copyAll = async () => {
    if (await copyText(composePost(content))) toast.success('Full post copied to clipboard');
    else toast.error('Could not copy to clipboard');
  };

  if (loadError) {
    return (
      <Card>
        <EmptyState
          icon={FileQuestion}
          title={loadError.status === 404 || loadError.status === 400 ? 'Content not found' : 'Could not load content'}
          description={
            loadError.status === 404 || loadError.status === 400
              ? 'It may have been deleted, or the link is incorrect.'
              : loadError.message
          }
          action={
            <div className="flex gap-2">
              {loadError.status !== 404 && loadError.status !== 400 && (
                <Button variant="secondary" onClick={load}>
                  Try again
                </Button>
              )}
              <Button as={Link} to="/dashboard">
                Back to dashboard
              </Button>
            </div>
          }
        />
      </Card>
    );
  }

  if (!content) return <ResultSkeleton />;

  const media = content.mediaId;
  const edited = content.updatedAt && new Date(content.updatedAt) - new Date(content.createdAt) > 2000;
  const isSaved = !!savedId;

  return (
    <>
      <button
        type="button"
        onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/dashboard'))}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3.5">
          <PlatformBadge platform={content.platform} size="lg" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">
              {PLATFORM_LABEL[content.platform]} {content.contentType}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
              {content.tone && <Badge tone="brand">{content.tone}</Badge>}
              {content.audience && <Badge>For {content.audience}</Badge>}
              <span className="ml-1" title={formatDate(content.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}>
                Created {timeAgo(content.createdAt)}
                {edited && ` · Updated ${timeAgo(content.updatedAt)}`}
              </span>
            </div>
          </div>
        </div>

        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={copyAll} disabled={!!busy}>
              <Copy className="size-4" />
              Copy all
            </Button>
            <Button
              variant="secondary"
              onClick={toggleSave}
              disabled={!!busy}
              aria-pressed={isSaved}
              className={isSaved ? 'text-brand-ink' : ''}
            >
              <motion.span key={isSaved ? 'on' : 'off'} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
                {isSaved ? <BookmarkCheck className="size-4 text-brand" fill="currentColor" fillOpacity={0.15} /> : <Bookmark className="size-4" />}
              </motion.span>
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            <div className="flex">
              <Button onClick={() => regenerate()} loading={busy === 'regen'} disabled={!!busy} className="rounded-r-none">
                {busy !== 'regen' && <RefreshCw className="size-4" />}
                Regenerate
              </Button>
              <Menu
                trigger={({ toggle, props }) => (
                  <Button
                    onClick={toggle}
                    disabled={!!busy}
                    className="rounded-l-none border-l border-bg/20 px-2.5"
                    aria-label="Regenerate in a different tone"
                    {...props}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                )}
              >
                <MenuLabel>Regenerate with tone</MenuLabel>
                {TONES.map((t) => (
                  <MenuItem key={t} onClick={() => regenerate(t)} active={content.tone === t}>
                    {t}
                  </MenuItem>
                ))}
              </Menu>
            </div>
            <Menu
              trigger={({ toggle, props }) => (
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl" onClick={toggle} disabled={!!busy} aria-label="More actions" {...props}>
                  <MoreHorizontal className="size-4" />
                </Button>
              )}
            >
              <MenuItem icon={Pencil} onClick={startEdit}>
                Edit content
              </MenuItem>
              {media?.fileUrl && (
                <MenuItem icon={ExternalLink} onClick={() => window.open(media.fileUrl, '_blank', 'noopener,noreferrer')}>
                  Open original media
                </MenuItem>
              )}
              <MenuSeparator />
              <MenuItem icon={Trash2} tone="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </MenuItem>
            </Menu>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Left: media + analysis */}
        <div className="space-y-4 lg:sticky lg:top-10">
          {media?.fileUrl && (
            <Card className="overflow-hidden">
              {isVideo(media) ? (
                <video src={media.fileUrl} controls playsInline preload="metadata" className="max-h-[28rem] w-full bg-black object-contain" />
              ) : (
                <img src={media.fileUrl} alt="Uploaded media" className="max-h-[28rem] w-full bg-surface-2 object-contain" />
              )}
            </Card>
          )}
          <AnalysisPanel analysis={analysis} />
        </div>

        {/* Right: output */}
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            {editing ? (
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-brand" />
                </span>
                Editing
              </div>
            ) : (
              <Segmented
                label="View"
                value={view}
                onChange={setView}
                options={[
                  { value: 'content', label: 'Content', icon: LayoutList },
                  { value: 'preview', label: 'Preview', icon: Eye }
                ]}
              />
            )}
            {!editing && view === 'content' && (
              <Button variant="ghost" size="sm" onClick={startEdit} disabled={!!busy}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {view === 'preview' && !editing ? (
              <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <PostPreview content={content} userName={user?.name} />
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <ContentFields
                  content={content}
                  editing={editing}
                  draft={draft}
                  onDraftChange={setDraft}
                  busy={busy === 'regen'}
                  revealKey={revealKey}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky edit bar */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 lg:left-64"
          >
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-line bg-surface/90 p-2.5 pl-4 shadow-lg backdrop-blur-xl">
              <p className="hidden text-[13px] text-muted sm:block">
                {dirty ? 'You have unsaved changes' : 'No changes yet'} · <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd> to save
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button variant="ghost" onClick={cancelEdit} disabled={busy === 'save-edit'} className="flex-1 sm:flex-none">
                  Cancel
                </Button>
                <Button onClick={saveEdit} loading={busy === 'save-edit'} disabled={!dirty} className="flex-1 sm:flex-none">
                  Save changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {editing && <div className="h-24" aria-hidden />}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        loading={busy === 'delete'}
        title="Delete this content?"
        description="This permanently removes the generated content, its history and its uploaded media. This can’t be undone."
        confirmLabel="Delete"
      />
    </>
  );
}
