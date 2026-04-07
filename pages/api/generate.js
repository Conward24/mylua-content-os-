export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, inputType } = req.body;

  if (!input?.trim()) {
    return res.status(400).json({ error: 'Input is required' });
  }

  const SYSTEM = `You are the MyLÚA Health content engine. MyLÚA Health is an enterprise agentic AI platform for perinatal and maternal care, built on IBM watsonx Orchestrate and watsonx.ai. Co-founders: J'Vanay Santos-Fabian (CEO, doula and maternal wellness strategist) and Michael Conward, Ph.D. (CTO, AI engineer).

KEY PROOF POINTS — from university research pilot, NOT from IBM:
- 90%+ first-trimester PPD risk identification accuracy
- 64% health risk assessment completion rate
- 79% of users comfortable sharing sensitive data
- 48% engaged with wellness activities
- 20% proactively logged symptoms
- IBM Silver Ecosystem Partner
- Patent-pending multimodal AI framework
- IBM case study live: ibm.com/case-studies/mylua-health
- IBM Data & AI Customer Advisory Board member (2026)
- HIPAA-compliant

CRITICAL RULES:
- Never attribute pilot stats to IBM. Never imply IBM ran or validated the study.
- Never use "certified" when describing J'Vanay's doula work.
- Never reveal patent mechanics, model architecture, or training pipeline.
- Never use "revolutionizing," "transforming," or "disrupting."

BRAND VOICE: Warm but credible. Technically sophisticated without jargon. Confident without overpromising. Lead with human impact, follow with technology. Every claim backed by a specific proof point.

RESPOND ONLY WITH VALID JSON. No markdown fences, no preamble, no explanation.`;

  const today = new Date().toISOString().split('T')[0];

  const prompt = `Input type: ${inputType}
Input: "${input}"

Generate a content plan for MyLÚA Health. Return ONLY this exact JSON structure:
{
  "summary": "1-sentence interpretation of this input",
  "posts": [
    {
      "id": "unique-id-here",
      "headline": "Bold punchy headline, 8 words max",
      "contentType": "Announcement",
      "platforms": ["LinkedIn Co."],
      "suggestedDate": "${today}",
      "copy": {
        "linkedin": "Full LinkedIn post. Strong hook on line 1. 150-280 words. 3-5 relevant hashtags at end.",
        "instagram": "Warmer, more personal IG caption. 80-120 words. 8-12 hashtags at end.",
        "twitter": "Punchy X/Twitter thread starter. Under 280 characters."
      },
      "graphicType": "announce",
      "graphicHeadline": "Short graphic headline, 6 words max",
      "graphicBody": "One punchy sentence for the graphic",
      "stats": [
        {"num": "64%", "label": "HRA completion rate"},
        {"num": "79%", "label": "share sensitive data"},
        {"num": "90%+", "label": "first-trimester PPD detection"}
      ],
      "quote": "",
      "priority": "high",
      "notes": "Brief specific posting tip for this post"
    }
  ]
}

Generate exactly 3 posts with:
- Different contentType per post (Announcement, Thought Leadership, Proof Point, Human Story, Doula Focus, or Enterprise)
- Different primary platform per post
- graphicType one of: announce, quote, stats, insight
- Dates spaced 2-5 days apart starting from ${today}
- MyLÚA brand voice throughout — specific, not generic`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'API error: ' + err });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
