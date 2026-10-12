// Centralised prompt builders for Gemini calls.
const { Type } = require('@google/genai');

const PLATFORM_GUIDANCE = {
  instagram:
    'Instagram: front-load a scroll-stopping first line (the caption is truncated after ~125 characters), keep the full caption under 2,200 characters, use line breaks for readability, 8-15 relevant hashtags mixing broad and niche tags, CTA optimised for saves/shares/comments, and a short on-image text overlay for the Reel/post cover. Leave "title" empty.',
  youtube:
    'YouTube: click-worthy title under 70 characters with the main keyword early, an SEO description whose first two lines work as a summary followed by supporting detail, 5-8 tags/keywords, a hook for the first 5 seconds, CTA to subscribe or watch next, and thumbnail text of 3-5 high-contrast words. Keep hashtags to 3-5.',
  facebook:
    'Facebook: conversational, story-driven caption suited to feed and groups, 2-5 hashtags at most, a headline-style title, and a community-driven CTA that invites comments or shares.',
};

// Build the main multimodal instruction for analyse + generate in one call
function buildPrompt({ platform, contentType, audience, tone, goal, previous }) {
  const p = (platform || '').toLowerCase();
  const platformRule = PLATFORM_GUIDANCE[p] || 'General social media post.';
  const lines = [
    'You are SocialBoost AI, an expert social-media strategist and copywriter.',
    'Step 1: Carefully analyse the attached media (image or video). Identify visible objects, setting/scene, mood, category/niche, and any visible text.',
    `Step 2: Write ${contentType || 'post'} content for ${p || 'social media'} grounded in what is actually visible — never invent people, brands or places that are not there.`,
    `Target audience: ${audience || 'general audience'}.`,
    `Tone: ${tone || 'engaging'}.`,
    `Goal: ${goal || 'maximise engagement'}.`,
    `Platform rules: ${platformRule}`,
    'Keep the analysis concise: category and mood 1-3 words each, scene one sentence, at most 8 objects and 10 keywords.',
    'Hashtags and keywords are plain strings without the "#" prefix. Use "" for any field that does not apply to this platform.',
  ];
  if (previous && (previous.caption || previous.hook)) {
    lines.push(
      'This is a regeneration. Produce a clearly different angle from the previous version below — new hook, new phrasing, different hashtags where sensible.',
      `Previous hook: ${previous.hook || '(none)'}`,
      `Previous caption: ${(previous.caption || '').slice(0, 600)}`
    );
  }
  return lines.join('\n');
}

const stringArray = { type: Type.ARRAY, items: { type: Type.STRING } };

// Structured-output schema: Gemini returns JSON that matches this exactly
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        objects: stringArray,
        scene: { type: Type.STRING },
        mood: { type: Type.STRING },
        category: { type: Type.STRING },
        keywords: stringArray,
        detectedText: { type: Type.STRING },
      },
      required: ['objects', 'scene', 'mood', 'category', 'keywords', 'detectedText'],
    },
    caption: { type: Type.STRING },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    hashtags: stringArray,
    keywords: stringArray,
    hook: { type: Type.STRING },
    cta: { type: Type.STRING },
    thumbnailText: { type: Type.STRING },
  },
  required: ['analysis', 'caption', 'title', 'description', 'hashtags', 'keywords', 'hook', 'cta', 'thumbnailText'],
  propertyOrdering: ['analysis', 'hook', 'caption', 'title', 'description', 'hashtags', 'keywords', 'cta', 'thumbnailText'],
};

module.exports = { buildPrompt, RESPONSE_SCHEMA };
