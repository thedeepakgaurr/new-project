// Cloudinary serves resized variants on the fly; grids should never download
// the full-resolution upload. Non-Cloudinary URLs are returned unchanged.
export function thumbUrl(media, width = 640) {
  const url = media?.fileUrl;
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const t = `c_limit,w_${width},q_auto,f_auto`;
  if (media.mediaType === 'video') {
    // so_1 = frame at 1s; swapping the extension returns a still image
    return url.replace('/upload/', `/upload/so_1,${t}/`).replace(/\.[a-z0-9]+$/i, '.jpg');
  }
  return url.replace('/upload/', `/upload/${t}/`);
}

export function isVideo(media) {
  return media?.mediaType === 'video';
}
