const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');

// Public file proxy: GET /files/<key...>
// Use `use` to avoid path-to-regexp parsing issues and capture all methods/paths under /files
router.use(async (req, res) => {
  try {
    // req.path inside this router is the path under /files, e.g. '/creators/1/song.mp3'
    const key = req.path.replace(/^\//, '');
    const obj = await storageService.getObject(key);
    const stream = obj.Body;

    if (obj.ContentType) res.setHeader('Content-Type', obj.ContentType);
    if (obj.ContentLength) res.setHeader('Content-Length', obj.ContentLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    // Pipe the S3/B2 stream to client
    stream.pipe(res);
  } catch (err) {
    console.error('Error streaming file', err);
    const key = req.path.replace(/^\//, '');
    const isImage = key.startsWith('covers/') || key.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    const isAudio = key.startsWith('songs/') || key.match(/\.mp3$/i);

    if (err && err.$metadata && err.$metadata.httpStatusCode === 404) {
      return res.status(404).send('Not found');
    }

    if (isImage) {
      console.log(`B2 limit exceeded: Redirecting image key '${key}' to public fallback cover.`);
      return res.redirect('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80');
    }

    if (isAudio) {
      console.log(`B2 limit exceeded: Redirecting song key '${key}' to public fallback audio stream.`);
      return res.redirect('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    }

    res.status(500).send('Error fetching file');
  }
});

module.exports = router;
