export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { input, inputType, prompt } = req.body;
  if (!input?.trim()) return res.status(400).json({ error: 'Input is required' });

  const SYSTEM = `You are the MyLÚA Health content engine. MyLÚA Health is an enterprise agentic AI platform for perinatal and maternal care, built on IBM watsonx Orchestrate and watsonx.ai. Co-founders: J'Vanay Santos-Fabian (CEO, doula and maternal wellness strategist) and Michael Conward, Ph.D. (CTO, AI engineer).

KEY PROOF POINTS (university research pilot — NOT IBM):
- 90%+ first-trimester PPD risk identification accuracy
- 64% health risk assessment completion rate
- 79% of users comfortable sharing sensitive data
- IBM Silver Ecosystem Partner. Patent-pending multimodal AI. ibm.com/case-studies/mylua-health. IBM CAB 2026. HIPAA-compliant.

RULES: Never attribute pilot stats to IBM. Never say "certified" for J'Vanay's doula work. Never reveal patent mechanics.
BRAND VOICE: Warm, credible, specific. No "revolutionizing" or "transforming."
suggestedPlatform must be one of: Instagram Feed, LinkedIn Feed, X / Twitter, Instagram Story
graphicType must be one of: announce, quote, stats, insight, event
RESPOND ONLY WITH VALID JSON. No markdown, no backticks.`;

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
