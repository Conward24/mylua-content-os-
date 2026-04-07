import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { renderGraphic } from '../lib/renderGraphic';

const B = {
  primary: '#2C4D45', secondary: '#A86D53', tertiary: '#DFAC7A',
  cream: '#FAF7F2', dark: '#1a1a1a', mid: '#555', light: '#999', border: '#e8e0d8',
};

const PLAT_COLORS = {
  'LinkedIn Co.': '#0077b5', 'LinkedIn Mike': '#004d77',
  'Instagram': '#c13584', 'X / Twitter': '#1da1f2',
};

const CAL_KEY = 'mylua_content_os_v1';

function fmtDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function getDay(iso) { return new Date(iso + 'T12:00:00').getDate(); }
function getMon(iso) { return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }); }
function today() { return new Date().toISOString().split('T')[0]; }

function PlatformPill({ platform, small }) {
  return (
    <span style={{
      background: PLAT_COLORS[platform] || B.primary,
      color: 'white', fontSize: small ? 9 : 10,
      fontWeight: 600, padding: small ? '1px 6px' : '2px 8px',
      borderRadius: 10, whiteSpace: 'nowrap',
    }}>{platform}</span>
  );
}

function PriorityDot({ priority }) {
  const c = { high: '#e74c3c', medium: B.secondary, low: B.light }[priority] || B.light;
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />;
}

// ── HEADER ───────────────────────────────────────────
function Header({ view, calCount, onNav }) {
  return (
    <header style={{
      background: B.primary, padding: '0 28px',
      display: 'flex', alignItems: 'center', gap: 16,
      height: 60, flexShrink: 0,
      boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <svg width="32" height="32" viewBox="0 0 100 100">
        {[0,1,2,3,4,5,6].map(i => (
          <ellipse key={i} cx="50" cy="50" rx="10" ry="38"
            fill={i%2===0 ? '#DFAC7A' : 'rgba(223,172,122,0.5)'}
            transform={`rotate(${i*180/7} 50 50)`} />
        ))}
      </svg>
      <div>
        <div style={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>MyLÚA Content OS</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 }}>AI-powered content pipeline</div>
      </div>
      <nav style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        {[
          { v: 'input', label: '＋ New Content' },
          { v: 'calendar', label: `📅 Calendar (${calCount})` },
        ].map(({ v, label }) => (
          <button key={v} onClick={() => onNav(v)} style={{
            background: (view === v || (v === 'input' && view === 'results') || (v === 'calendar' && view === 'post'))
              ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: (view === v || (v === 'input' && view === 'results') || (v === 'calendar' && view === 'post'))
              ? 'white' : 'rgba(255,255,255,0.45)',
            border: 'none', padding: '6px 14px', borderRadius: 8,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </nav>
    </header>
  );
}

// ── INPUT VIEW ───────────────────────────────────────
function InputView({ onGenerated }) {
  const [inputType, setInputType] = useState('update');
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState(null);

  const inputTypes = [
    { id: 'update', label: '🗓 My Update', desc: 'Milestone, news, meeting outcome' },
    { id: 'news', label: '📰 Industry News', desc: 'Article or event to riff on' },
    { id: 'idea', label: '💬 Raw Idea', desc: 'Hook, angle, or content thought' },
  ];

  const placeholders = {
    update: "e.g. 'We just got accepted to IBM Agent Connect marketplace' or 'Had a great call with a Medicaid plan in Georgia'",
    news: "Paste a headline, URL, or describe the article you just read...",
    idea: "What angle do you want to take? Any hook, thought, or content idea...",
  };

  async function generate() {
    if (!input.trim() || generating) return;
    setGenerating(true); setError(null); setProgress(15);
    setProgressMsg('Reading your input...');
    try {
      setProgress(30); setProgressMsg('Writing posts with AI...');
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, inputType }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'API error');
      }
      const result = await res.json();
      setProgress(72); setProgressMsg('Rendering graphics...');
      const posts = (result.posts || []).map(p => ({
        ...p, graphicDataUrl: renderGraphic(p)
      }));
      setProgress(100); setProgressMsg('Done!');
      await new Promise(r => setTimeout(r, 300));
      onGenerated(posts);
    } catch (e) {
      setError(e.message);
      setGenerating(false);
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: B.primary, letterSpacing: -0.5 }}>What's happening?</div>
          <div style={{ fontSize: 14, color: B.light, marginTop: 8 }}>Drop in your update, a news link, or a raw idea. The engine handles the rest.</div>
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {inputTypes.map(({ id, label, desc }) => (
            <button key={id} onClick={() => setInputType(id)} style={{
              flex: 1, padding: '11px 12px', borderRadius: 14,
              border: `2px solid ${inputType === id ? B.secondary : B.border}`,
              background: inputType === id ? 'white' : 'rgba(255,255,255,0.5)',
              boxShadow: inputType === id ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: B.primary }}>{label}</div>
              <div style={{ fontSize: 10, color: B.light, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
            </button>
          ))}
        </div>

        {/* Input box */}
        <div style={{ background: 'white', borderRadius: 20, border: `1px solid ${B.border}`, overflow: 'hidden', boxShadow: '0 4px 28px rgba(0,0,0,0.09)' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={placeholders[inputType]}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(); }}
            style={{
              width: '100%', minHeight: 140, padding: '20px 20px 12px',
              border: 'none', outline: 'none', resize: 'none',
              fontSize: 14, lineHeight: 1.65, color: B.dark, background: 'transparent',
            }}
          />
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${B.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, color: B.light }}>⌘ + Enter to generate</div>
            <button onClick={generate} disabled={!input.trim() || generating} style={{
              background: input.trim() && !generating ? B.secondary : B.border,
              color: input.trim() && !generating ? 'white' : B.light,
              border: 'none', padding: '10px 24px', borderRadius: 12,
              fontSize: 13, fontWeight: 700, cursor: input.trim() && !generating ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}>
              {generating ? 'Generating...' : 'Generate →'}
            </button>
          </div>
        </div>

        {/* Progress */}
        {generating && (
          <div style={{ marginTop: 20, background: 'white', borderRadius: 16, padding: 20, border: `1px solid ${B.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: B.mid, fontWeight: 500 }}>{progressMsg}</span>
            </div>
            <div style={{ height: 5, background: B.border, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${B.primary}, ${B.secondary})`, borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 14, padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#c0392b', fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RESULTS VIEW ─────────────────────────────────────
function ResultsView({ posts, onSelectPost, onNewInput }) {
  const thumbRefs = useRef({});

  useEffect(() => {
    posts.forEach(post => {
      const canvas = thumbRefs.current[post.id];
      if (canvas && post.graphicDataUrl) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 96, 96);
        };
        img.src = post.graphicDataUrl;
      }
    });
  }, [posts]);

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 28px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: B.primary }}>{posts.length} posts generated</div>
          <button onClick={onNewInput} style={{ background: B.secondary, color: 'white', border: 'none', padding: '9px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ＋ New Input
          </button>
        </div>

        {posts.map(post => (
          <div key={post.id} onClick={() => onSelectPost(post)} style={{
            background: 'white', borderRadius: 16, border: `1px solid ${B.border}`,
            overflow: 'hidden', cursor: 'pointer', display: 'flex', marginBottom: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ width: 96, height: 96, flexShrink: 0, background: B.primary, overflow: 'hidden' }}>
              <canvas ref={el => thumbRefs.current[post.id] = el} width={96} height={96} style={{ display: 'block' }} />
            </div>
            <div style={{ flex: 1, padding: '14px 20px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: B.primary, lineHeight: 1.3 }}>{post.headline}</div>
                <PriorityDot priority={post.priority} />
              </div>
              <div style={{ fontSize: 11, color: B.secondary, fontWeight: 600, marginBottom: 6 }}>{post.contentType}</div>
              <div style={{ fontSize: 12, color: B.mid, marginBottom: 10, lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(post.copy?.linkedin || '').substring(0, 120)}...
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(post.platforms || []).map(p => <PlatformPill key={p} platform={p} />)}
                </div>
                <div style={{ fontSize: 11, color: B.light }}>📅 {fmtDate(post.suggestedDate)}</div>
              </div>
            </div>
          </div>
        ))}

        <button onClick={() => window.dispatchEvent(new CustomEvent('navTo', { detail: 'calendar' }))} style={{
          width: '100%', padding: 14, background: B.primary, color: 'white',
          border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8,
        }}>
          View Full Calendar →
        </button>
      </div>
    </div>
  );
}

// ── CALENDAR VIEW ────────────────────────────────────
function CalendarView({ calendar, onSelectPost, onDelete, onReschedule }) {
  const todayStr = today();

  if (calendar.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: B.light }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Nothing scheduled yet</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Add your first update to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 28px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: B.primary, marginBottom: 24 }}>Content Calendar</div>
        {calendar.map(post => {
          const isPast = post.suggestedDate < todayStr;
          return (
            <div key={post.id} style={{
              background: isPast ? '#f7f7f7' : 'white',
              borderRadius: 14, border: `1px solid ${B.border}`,
              display: 'flex', overflow: 'hidden', marginBottom: 10,
              opacity: isPast ? 0.65 : 1, boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
            }}>
              {/* Date */}
              <div style={{
                width: 76, background: isPast ? '#ddd' : B.primary,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, padding: '12px 0',
              }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: isPast ? '#aaa' : 'white', lineHeight: 1 }}>
                  {getDay(post.suggestedDate)}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: isPast ? '#bbb' : 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {getMon(post.suggestedDate)}
                </div>
              </div>

              {/* Graphic thumb */}
              {post.graphicDataUrl && (
                <div style={{ width: 76, flexShrink: 0, overflow: 'hidden' }}>
                  <img src={post.graphicDataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: B.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.headline}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(post.platforms || []).map(p => <PlatformPill key={p} platform={p} small />)}
                    <span style={{ fontSize: 10, color: B.light }}>· {post.contentType}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => onSelectPost(post)} style={{
                    background: B.primary, color: 'white', border: 'none',
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>View</button>
                  <input type="date" value={post.suggestedDate}
                    onChange={e => onReschedule(post.id, e.target.value)}
                    style={{ border: `1px solid ${B.border}`, borderRadius: 8, padding: '5px 8px', fontSize: 11, color: B.mid, cursor: 'pointer' }}
                  />
                  <button onClick={() => onDelete(post.id)} style={{
                    background: 'none', border: `1px solid ${B.border}`, color: B.light,
                    width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 14,
                  }}>×</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── POST DETAIL VIEW ─────────────────────────────────
function PostDetailView({ post, onBack, onReschedule }) {
  const [activePlatform, setActivePlatform] = useState('linkedin');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && post?.graphicDataUrl) {
      canvas.width = 1080; canvas.height = 1080;
      const img = new Image();
      img.onload = () => { canvas.getContext('2d').drawImage(img, 0, 0, 1080, 1080); };
      img.src = post.graphicDataUrl;
    }
  }, [post]);

  function doCopy() {
    const txt = post.copy?.[activePlatform] || '';
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function downloadGraphic() {
    if (!post.graphicDataUrl) return;
    const a = document.createElement('a');
    a.href = post.graphicDataUrl;
    a.download = `mylua-${post.id}.png`;
    a.click();
  }

  const platforms = [
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'twitter', label: 'X / Twitter' },
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Back + headline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} style={{
            background: 'none', border: `1px solid ${B.border}`, color: B.mid,
            padding: '6px 14px', borderRadius: 9, fontSize: 12, cursor: 'pointer',
          }}>← Back</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: B.primary, flex: 1 }}>{post.headline}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(post.platforms || []).map(p => <PlatformPill key={p} platform={p} />)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 28, alignItems: 'start' }}>
          {/* LEFT: Copy */}
          <div>
            {/* Platform tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {platforms.map(({ id, label }) => (
                <button key={id} onClick={() => setActivePlatform(id)} style={{
                  padding: '8px 18px', borderRadius: 10,
                  border: `1px solid ${activePlatform === id ? B.primary : B.border}`,
                  background: activePlatform === id ? B.primary : 'white',
                  color: activePlatform === id ? 'white' : B.mid,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>

            {/* Copy box */}
            <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${B.border}`, overflow: 'hidden', marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '10px 18px', borderBottom: `1px solid ${B.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: B.mid }}>
                  {platforms.find(p => p.id === activePlatform)?.label} copy
                </div>
                <button onClick={doCopy} style={{
                  background: copied ? B.primary : B.secondary, color: 'white',
                  border: 'none', padding: '6px 16px', borderRadius: 8,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s',
                }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ padding: 20, fontSize: 13, lineHeight: 1.8, color: B.dark, whiteSpace: 'pre-wrap', maxHeight: 340, overflow: 'auto' }}>
                {post.copy?.[activePlatform] || 'No copy for this platform.'}
              </div>
            </div>

            {/* Tip */}
            {post.notes && (
              <div style={{ background: '#fdf6f0', border: `1px solid ${B.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, color: B.mid, lineHeight: 1.6, marginBottom: 16 }}>
                <span style={{ color: B.secondary, fontWeight: 700 }}>💡 Tip: </span>{post.notes}
              </div>
            )}

            {/* Schedule */}
            <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${B.border}`, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, marginBottom: 12 }}>Schedule</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="date" defaultValue={post.suggestedDate}
                  onChange={e => onReschedule(post.id, e.target.value)}
                  style={{ flex: 1, border: `1px solid ${B.border}`, borderRadius: 9, padding: '8px 12px', fontSize: 13, color: B.dark }}
                />
                <div style={{ fontSize: 12, color: B.light }}>{fmtDate(post.suggestedDate)}</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Graphic */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ background: 'white', borderRadius: 20, border: `1px solid ${B.border}`, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${B.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: B.primary }}>Graphic</div>
                <button onClick={downloadGraphic} style={{
                  background: B.primary, color: 'white', border: 'none',
                  padding: '6px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>⬇ Download PNG</button>
              </div>
              <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ fontSize: 11, color: B.light, textAlign: 'center', marginTop: 8 }}>
              1080×1080px · LinkedIn + Instagram ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────
export default function ContentOS() {
  const [view, setView] = useState('input');
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  // Load calendar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CAL_KEY);
      if (saved) setCalendar(JSON.parse(saved));
    } catch {}
  }, []);

  function saveCalendar(cal) {
    setCalendar(cal);
    try { localStorage.setItem(CAL_KEY, JSON.stringify(cal)); } catch {}
  }

  function handleGenerated(posts) {
    // Merge into calendar
    const merged = [...calendar];
    posts.forEach(p => {
      const i = merged.findIndex(c => c.id === p.id);
      if (i >= 0) merged[i] = p; else merged.push(p);
    });
    merged.sort((a, b) => a.suggestedDate.localeCompare(b.suggestedDate));
    saveCalendar(merged);
    setGeneratedPosts(posts);
    setView('results');
  }

  function handleSelectPost(post) {
    setSelectedPost(post);
    setView('post');
  }

  function handleDelete(id) {
    saveCalendar(calendar.filter(p => p.id !== id));
  }

  function handleReschedule(id, date) {
    const updated = calendar.map(p => p.id === id ? { ...p, suggestedDate: date } : p);
    updated.sort((a, b) => a.suggestedDate.localeCompare(b.suggestedDate));
    saveCalendar(updated);
    if (selectedPost?.id === id) setSelectedPost(prev => ({ ...prev, suggestedDate: date }));
  }

  // Listen for nav events from child components
  useEffect(() => {
    const handler = (e) => setView(e.detail);
    window.addEventListener('navTo', handler);
    return () => window.removeEventListener('navTo', handler);
  }, []);

  return (
    <>
      <Head>
        <title>MyLÚA Content OS</title>
        <meta name="description" content="AI-powered content pipeline for MyLÚA Health" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🪷</text></svg>" />
      </Head>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          view={view}
          calCount={calendar.length}
          onNav={v => { if (v === 'input' && view !== 'results') setView('input'); else setView(v); }}
        />

        {view === 'input' && <InputView onGenerated={handleGenerated} />}
        {view === 'results' && (
          <ResultsView
            posts={generatedPosts}
            onSelectPost={handleSelectPost}
            onNewInput={() => setView('input')}
          />
        )}
        {view === 'calendar' && (
          <CalendarView
            calendar={calendar}
            onSelectPost={handleSelectPost}
            onDelete={handleDelete}
            onReschedule={handleReschedule}
          />
        )}
        {view === 'post' && selectedPost && (
          <PostDetailView
            post={selectedPost}
            onBack={() => setView('calendar')}
            onReschedule={handleReschedule}
          />
        )}
      </div>
    </>
  );
}
