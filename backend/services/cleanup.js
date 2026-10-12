const cloudinary = require('../config/cloudinary');
const Media = require('../models/Media');
const MediaAnalysis = require('../models/MediaAnalysis');
const Content = require('../models/Content');
const ContentHistory = require('../models/ContentHistory');
const SavedContent = require('../models/SavedContent');

// Best-effort: a Cloudinary failure must not block deleting the DB records
async function destroyAsset(media) {
  try {
    await cloudinary.uploader.destroy(media.cloudinaryId, {
      resource_type: media.mediaType === 'video' ? 'video' : 'image',
    });
  } catch (err) {
    console.warn(`Cloudinary destroy failed for ${media.cloudinaryId}:`, err.message);
  }
}

async function deleteMedia(media) {
  await destroyAsset(media);
  await MediaAnalysis.deleteMany({ mediaId: media._id });
  await media.deleteOne();
}

// Delete content plus its saved/history rows, and its media once nothing else uses it
async function deleteContent(content) {
  await Promise.all([
    SavedContent.deleteMany({ contentId: content._id }),
    ContentHistory.deleteMany({ contentId: content._id }),
  ]);
  await content.deleteOne();
  const stillUsed = await Content.exists({ mediaId: content.mediaId });
  if (!stillUsed) {
    const media = await Media.findById(content.mediaId);
    if (media) await deleteMedia(media);
  }
}

async function deleteUserData(userId) {
  const media = await Media.find({ userId });
  await Promise.all(media.map(destroyAsset));
  const mediaIds = media.map((m) => m._id);
  await Promise.all([
    MediaAnalysis.deleteMany({ mediaId: { $in: mediaIds } }),
    Media.deleteMany({ userId }),
    Content.deleteMany({ userId }),
    ContentHistory.deleteMany({ userId }),
    SavedContent.deleteMany({ userId }),
  ]);
}

module.exports = { deleteMedia, deleteContent, deleteUserData };
