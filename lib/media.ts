// Small helpers for media URLs. A video's "thumbnail" can end up being the video file itself
// (when no still was chosen), which an <img> tag cannot show. These let pages tell the two apart.

export function isImageUrl(u?: string | null): boolean {
  if (!u) return false;
  return /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(u);
}

export function isVideoUrl(u?: string | null): boolean {
  if (!u) return false;
  return /\.(mp4|m4v|mov|webm)(\?|#|$)/i.test(u);
}

export function videoMime(u?: string | null): string {
  if (!u) return 'video/mp4';
  if (/\.webm(\?|#|$)/i.test(u)) return 'video/webm';
  if (/\.mov(\?|#|$)/i.test(u)) return 'video/quicktime';
  return 'video/mp4';
}
