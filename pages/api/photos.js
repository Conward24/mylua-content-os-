import { kv } from '@vercel/kv';

const PHOTOS_KEY = 'mylua_photos_v1';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const photos = await kv.get(PHOTOS_KEY) || [];
      return res.status(200).json(photos);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { photo } = req.body;
      const photos = await kv.get(PHOTOS_KEY) || [];
      photos.unshift(photo); // newest first
      if (photos.length > 50) photos.splice(50); // cap at 50
      await kv.set(PHOTOS_KEY, photos);
      return res.status(200).json({ ok: true, photos });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { url } = req.body;
      const photos = await kv.get(PHOTOS_KEY) || [];
      const updated = photos.filter(p => p.url !== url);
      await kv.set(PHOTOS_KEY, updated);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
