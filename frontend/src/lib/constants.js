export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', blurb: 'Captions, hashtags & cover text' },
  { id: 'youtube', label: 'YouTube', blurb: 'Titles, SEO descriptions & tags' },
  { id: 'facebook', label: 'Facebook', blurb: 'Story-driven posts & headlines' }
];

export const PLATFORM_LABEL = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.label]));

export const CONTENT_TYPES = {
  instagram: ['Post', 'Reel', 'Carousel', 'Story'],
  youtube: ['Video', 'Short', 'Thumbnail Idea'],
  facebook: ['Post', 'Reel', 'Story']
};

export const TONES = ['Engaging', 'Professional', 'Funny', 'Inspirational', 'Educational', 'Promotional', 'Emotional'];

export const AUDIENCE_SUGGESTIONS = ['Gen Z', 'Small business owners', 'Fitness enthusiasts', 'Travelers', 'Tech founders'];
export const GOAL_SUGGESTIONS = ['Get more comments', 'Drive website visits', 'Grow followers', 'Maximise shares', 'Sell a product'];

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_TYPES = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'image/gif': 'GIF',
  'video/mp4': 'MP4',
  'video/quicktime': 'MOV',
  'video/x-msvideo': 'AVI',
  'video/webm': 'WEBM'
};

// Display order, labels and per-platform character guidance for generated fields
export const FIELDS = [
  { key: 'hook', label: 'Hook', hint: 'Opening line that stops the scroll' },
  { key: 'title', label: 'Title', limits: { youtube: 100, facebook: 100 }, recommended: { youtube: 70 } },
  { key: 'caption', label: 'Caption', limits: { instagram: 2200, facebook: 5000, youtube: 5000 }, rows: 6 },
  { key: 'description', label: 'Description', limits: { youtube: 5000, facebook: 5000, instagram: 2200 }, rows: 6 },
  { key: 'hashtags', label: 'Hashtags', list: true, max: { instagram: 30, youtube: 15, facebook: 10 } },
  { key: 'keywords', label: 'Keywords', list: true },
  { key: 'cta', label: 'Call to action' },
  { key: 'thumbnailText', label: 'Thumbnail text', hint: 'Short, high-contrast overlay text' }
];
