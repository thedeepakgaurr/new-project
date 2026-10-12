import { useEffect } from 'react';

const BASE = 'SocialBoost AI';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : `${BASE} — Platform-ready social content from any photo or video`;
  }, [title]);
}
