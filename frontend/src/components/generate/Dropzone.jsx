import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Film, ImageIcon, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES } from '../../lib/constants.js';
import { cn, formatBytes } from '../../lib/format.js';

const ACCEPT = Object.keys(ACCEPTED_TYPES).join(',');

export function validateFile(file) {
  if (!ACCEPTED_TYPES[file.type]) {
    return `“${file.name}” isn’t a supported format. Use ${Object.values(ACCEPTED_TYPES).join(', ')}.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `“${file.name}” is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_UPLOAD_BYTES)}.`;
  }
  return null;
}

function formatDuration(s) {
  if (!Number.isFinite(s)) return '';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.round(s % 60)).padStart(2, '0')}`;
}

export default function Dropzone({ file, onFile, onError, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [meta, setMeta] = useState('');
  const depth = useRef(0);

  // Object URLs hold the whole file in memory until revoked
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setMeta('');
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = (f) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) onError(err);
    else onFile(f);
  };

  // Paste an image straight from the clipboard
  useEffect(() => {
    if (disabled) return undefined;
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.files || [])][0];
      if (item && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) accept(item);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const onDrop = (e) => {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (!disabled) accept(e.dataTransfer.files?.[0]);
  };

  const dragProps = {
    onDragEnter: (e) => {
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragLeave: (e) => {
      e.preventDefault();
      depth.current -= 1;
      if (depth.current <= 0) setDragging(false);
    },
    onDragOver: (e) => e.preventDefault(),
    onDrop
  };

  const browse = () => inputRef.current?.click();
  const isVideo = file?.type?.startsWith('video');

  return (
    <div {...dragProps}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <AnimatePresence mode="wait" initial={false}>
        {!file ? (
          <motion.button
            key="empty"
            type="button"
            onClick={browse}
            disabled={disabled}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-dashed px-6 py-14 text-center transition-colors duration-200',
              dragging ? 'border-brand bg-brand-soft/60' : 'border-line-strong bg-surface-2/50 hover:border-brand/60 hover:bg-brand-soft/30'
            )}
          >
            <motion.div
              animate={dragging ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="flex size-14 items-center justify-center rounded-2xl border border-line bg-surface shadow-sm"
            >
              <UploadCloud className={cn('size-6 transition-colors', dragging ? 'text-brand' : 'text-fg-2 group-hover:text-brand')} strokeWidth={1.8} />
            </motion.div>
            <p className="mt-5 text-[15px] font-medium">
              {dragging ? 'Drop to upload' : (
                <>
                  Drag & drop, <span className="text-brand">browse</span>, or paste
                </>
              )}
            </p>
            <p className="mt-1.5 text-[13px] text-muted">
              Images or video · {Object.values(ACCEPTED_TYPES).join(', ')} · up to {formatBytes(MAX_UPLOAD_BYTES)}
            </p>
          </motion.button>
        ) : (
          <motion.div
            key="filled"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'overflow-hidden rounded-2xl border bg-surface transition-colors',
              dragging ? 'border-brand ring-4 ring-brand/15' : 'border-line'
            )}
          >
            <div className="relative flex max-h-[26rem] min-h-56 items-center justify-center bg-[repeating-conic-gradient(var(--surface-2)_0%_25%,var(--surface)_0%_50%)] bg-[length:20px_20px]">
              {preview &&
                (isVideo ? (
                  <video
                    src={preview}
                    controls
                    playsInline
                    className="max-h-[26rem] w-full bg-black object-contain"
                    onLoadedMetadata={(e) => setMeta(`${e.currentTarget.videoWidth}×${e.currentTarget.videoHeight} · ${formatDuration(e.currentTarget.duration)}`)}
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Selected media preview"
                    className="max-h-[26rem] w-full object-contain"
                    onLoad={(e) => setMeta(`${e.currentTarget.naturalWidth}×${e.currentTarget.naturalHeight}`)}
                  />
                ))}
            </div>
            <div className="flex items-center gap-3 border-t border-line px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                {isVideo ? <Film className="size-4 text-fg-2" /> : <ImageIcon className="size-4 text-fg-2" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted">
                  {ACCEPTED_TYPES[file.type]} · {formatBytes(file.size)}
                  {meta && ` · ${meta}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={browse} disabled={disabled}>
                <RefreshCw className="size-3.5" />
                <span className="hidden sm:inline">Replace</span>
              </Button>
              <Button variant="danger-ghost" size="icon-sm" onClick={() => onFile(null)} disabled={disabled} aria-label="Remove file">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
