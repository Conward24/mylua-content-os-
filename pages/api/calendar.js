import { kv } from '@vercel/kv';

const CAL_KEY = 'mylua_calendar_v1';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const calendar = await kv.get(CAL_KEY) || [];
      return res.status(200).json(calendar);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { calendar } = req.body;
      await kv.set(CAL_KEY, calendar);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
