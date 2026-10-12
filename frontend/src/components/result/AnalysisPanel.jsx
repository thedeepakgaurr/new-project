import { ScanEye } from 'lucide-react';
import { Card } from '../ui/primitives.jsx';

function Row({ label, children }) {
  return (
    <div>
      <dt className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">{label}</dt>
      <dd className="text-sm text-fg-2">{children}</dd>
    </div>
  );
}

export default function AnalysisPanel({ analysis }) {
  if (!analysis) return null;
  const { category, mood, scene, objects = [], keywords = [], detectedText } = analysis;
  if (!category && !mood && !scene && !objects.length && !keywords.length && !detectedText) return null;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft">
          <ScanEye className="size-4 text-brand-ink" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">What the AI saw</h2>
          <p className="text-xs text-muted">Visual analysis used to write your copy</p>
        </div>
      </div>
      <dl className="space-y-4">
        {(category || mood) && (
          <div className="grid grid-cols-2 gap-4">
            {category && <Row label="Category">{category}</Row>}
            {mood && (
              <Row label="Mood">
                <div className="flex flex-wrap gap-1">
                  {mood
                    .replace(/\.$/, '')
                    .split(/\s*,\s*/)
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((m) => (
                      <span key={m} className="rounded-md bg-warning-soft px-2 py-0.5 text-[12.5px] font-medium capitalize text-warning">
                        {m}
                      </span>
                    ))}
                </div>
              </Row>
            )}
          </div>
        )}
        {scene && <Row label="Scene">{scene}</Row>}
        {objects.length > 0 && (
          <Row label="Detected">
            <div className="flex flex-wrap gap-1.5">
              {objects.map((o) => (
                <span key={o} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[12.5px]">
                  {o}
                </span>
              ))}
            </div>
          </Row>
        )}
        {keywords.length > 0 && (
          <Row label="Visual keywords">
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((k) => (
                <span key={k} className="rounded-md bg-info-soft px-2 py-0.5 text-[12.5px] text-info">
                  {k}
                </span>
              ))}
            </div>
          </Row>
        )}
        {detectedText && (
          <Row label="Text in media">
            <span className="block border-l-2 border-line-strong pl-3 italic text-muted">“{detectedText}”</span>
          </Row>
        )}
      </dl>
    </Card>
  );
}
