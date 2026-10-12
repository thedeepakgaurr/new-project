const { createPartFromBase64, createPartFromUri, FileState } = require('@google/genai');
const { getGenAI } = require('../config/gemini');
const config = require('../config/env');
const HttpError = require('../utils/httpError');
const { buildPrompt, RESPONSE_SCHEMA } = require('../utils/prompts');

// Gemini caps inline requests at 20MB including base64 overhead (~33%), so
// anything larger goes through the File API instead.
const INLINE_MAX_BYTES = 14 * 1024 * 1024;
const FILE_PROCESSING_TIMEOUT_MS = 120_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch a remote file (Cloudinary URL) into a Buffer
async function fetchToBuffer(fileUrl) {
  let res;
  try {
    res = await fetch(fileUrl, { signal: AbortSignal.timeout(60_000) });
  } catch {
    throw new HttpError(502, 'Could not read the uploaded media. Please try again.');
  }
  if (!res.ok) throw new HttpError(502, 'Could not read the uploaded media. Please re-upload the file.');
  return Buffer.from(await res.arrayBuffer());
}

function dedupe(list, { stripHash = false } = {}) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    let v = String(raw).trim();
    if (stripHash) v = v.replace(/^#+/, '').replace(/\s+/g, '');
    const k = v.toLowerCase();
    if (v && !seen.has(k)) {
      seen.add(k);
      out.push(v);
    }
  }
  return out;
}

function normaliseResult(parsed) {
  const analysis = parsed.analysis && typeof parsed.analysis === 'object' ? parsed.analysis : {};
  const arr = (v) => (Array.isArray(v) ? v.map(String) : []);
  const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
  return {
    analysis: {
      objects: dedupe(arr(analysis.objects)),
      scene: str(analysis.scene),
      mood: str(analysis.mood),
      category: str(analysis.category),
      keywords: dedupe(arr(analysis.keywords)),
      detectedText: str(analysis.detectedText),
    },
    caption: str(parsed.caption),
    title: str(parsed.title),
    description: str(parsed.description || parsed.caption),
    hashtags: dedupe(arr(parsed.hashtags), { stripHash: true }),
    keywords: dedupe(arr(parsed.keywords)),
    hook: str(parsed.hook),
    cta: str(parsed.cta),
    thumbnailText: str(parsed.thumbnailText),
  };
}

// Structured output should already be valid JSON; tolerate stray fences anyway
function parseJson(text) {
  const cleaned = String(text || '').replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch { /* fall through */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch { /* fall through */ }
  }
  throw new HttpError(502, 'The AI returned an unexpected response. Please try again.');
}

// Translate SDK/network failures into messages a user can act on
function toHttpError(err) {
  if (err instanceof HttpError) return err;
  const status = err?.status;
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError' || /timed? ?out/i.test(err?.message || '')) {
    return new HttpError(504, 'The AI took too long to respond. Please try again.');
  }
  if (status === 429) return new HttpError(503, 'The AI service is busy right now. Please try again in a minute.');
  if (status === 400) return new HttpError(422, 'The AI could not process this file. Try a different image or a shorter video.');
  if (status === 401 || status === 403) {
    console.error('Gemini auth error:', err.message);
    return new HttpError(503, 'AI generation is temporarily unavailable.');
  }
  console.error('Gemini error:', err);
  return new HttpError(502, 'The AI service failed to respond. Please try again.');
}

// Upload large media to the Gemini File API and wait until it is ready
async function uploadToFileApi(ai, buffer, mimeType) {
  let file = await ai.files.upload({
    file: new Blob([buffer], { type: mimeType }),
    config: { mimeType },
  });
  const deadline = Date.now() + FILE_PROCESSING_TIMEOUT_MS;
  while (file.state === FileState.PROCESSING) {
    if (Date.now() > deadline) throw new HttpError(504, 'The video took too long to process. Try a shorter clip.');
    await sleep(2000);
    file = await ai.files.get({ name: file.name });
  }
  if (file.state === FileState.FAILED) {
    throw new HttpError(422, 'The AI could not process this video. Try a different file.');
  }
  return file;
}

/**
 * Analyse media + generate content via Gemini multimodal.
 * @param {Buffer|string} mediaInput - Buffer or remote URL string
 * @param {string} mimeType - e.g. image/png, video/quicktime
 * @param {object} promptConfig - { platform, contentType, audience, tone, goal, previous }
 */
async function analyzeAndGenerate(mediaInput, mimeType, promptConfig) {
  const ai = getGenAI();

  let buffer;
  if (Buffer.isBuffer(mediaInput)) buffer = mediaInput;
  else if (typeof mediaInput === 'string' && mediaInput.startsWith('http')) buffer = await fetchToBuffer(mediaInput);
  else throw new Error('mediaInput must be a Buffer or a remote file URL');

  let uploaded = null;
  try {
    let mediaPart;
    if (buffer.length <= INLINE_MAX_BYTES) {
      mediaPart = createPartFromBase64(buffer.toString('base64'), mimeType);
    } else {
      uploaded = await uploadToFileApi(ai, buffer, mimeType);
      mediaPart = createPartFromUri(uploaded.uri, uploaded.mimeType);
    }

    const response = await ai.models.generateContent({
      model: config.gemini.model,
      contents: [{ role: 'user', parts: [mediaPart, { text: buildPrompt(promptConfig) }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: promptConfig.previous ? 1.1 : 0.8,
        httpOptions: { timeout: config.gemini.timeoutMs },
      },
    });

    const text = response.text;
    if (!text) {
      const blocked = response.promptFeedback?.blockReason || response.candidates?.[0]?.finishReason === 'SAFETY';
      throw new HttpError(
        422,
        blocked
          ? 'This media was flagged by the AI safety filters. Try a different file.'
          : 'The AI returned an empty response. Please try again.'
      );
    }
    return normaliseResult(parseJson(text));
  } catch (err) {
    throw toHttpError(err);
  } finally {
    if (uploaded?.name) ai.files.delete({ name: uploaded.name }).catch(() => {});
  }
}

module.exports = { analyzeAndGenerate };
