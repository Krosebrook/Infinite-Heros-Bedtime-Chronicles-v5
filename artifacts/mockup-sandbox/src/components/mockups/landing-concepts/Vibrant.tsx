import './_group.css';

export function Vibrant() {
  return (
    <div style={{ fontFamily: "var(--font-display)", background: '#020215', color: '#fff', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Animated gradient mesh background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 60%, rgba(168,85,247,0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 90%, rgba(236,72,153,0.08) 0%, transparent 50%)
        `
      }} />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
        position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>✨</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: -0.3 }}>Infinity Heroes</div>
            <div style={{ fontSize: 10, color: '#818cf8', fontWeight: 500, letterSpacing: 1 }}>BEDTIME CHRONICLES</div>
          </div>
        </div>
        <button style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none',
          color: '#fff', padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700,
          fontFamily: 'var(--font-display)', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
        }}>
          Download Free
        </button>
      </nav>

      {/* Hero Section */}
      <div style={{ padding: '48px 20px 32px', position: 'relative', zIndex: 5 }}>
        {/* Floating badges */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <span style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20,
            padding: '5px 14px', fontSize: 11, fontWeight: 600, color: '#c4b5fd'
          }}>🎯 Ages 3–9</span>
          <span style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 600, color: '#86efac'
          }}>✅ Child Safe</span>
        </div>

        <h1 style={{
          fontWeight: 800, fontSize: 38, lineHeight: 1.08, letterSpacing: -1.5,
          margin: '0 0 16px'
        }}>
          Where every child{' '}
          <span style={{
            background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>becomes the hero</span>
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.7,
          color: 'rgba(203,213,225,0.8)', marginBottom: 28, maxWidth: 380
        }}>
          AI-crafted bedtime stories featuring your child's chosen superhero. New adventures every night, narrated with warm voices and ambient soundscapes.
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
            color: '#fff', padding: '15px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700,
            fontFamily: 'var(--font-display)', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(99,102,241,0.4)', flex: 1, maxWidth: 220
          }}>
            Start Free Trial
          </button>
          <button style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#cbd5e1', padding: '15px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-display)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>
            ▶ Watch Demo
          </button>
        </div>
      </div>

      {/* Hero Cards Grid */}
      <div style={{ padding: '0 20px 32px', overflowX: 'auto', display: 'flex', gap: 14, paddingBottom: 20 }}>
        {[
          { name: 'Luna Starweaver', power: 'Cosmic Light', bg: 'linear-gradient(135deg, #312e81, #1e1b4b)', emoji: '🌟' },
          { name: 'Blaze Phoenix', power: 'Fire Wings', bg: 'linear-gradient(135deg, #7f1d1d, #450a0a)', emoji: '🔥' },
          { name: 'Aqua Tide', power: 'Ocean Heart', bg: 'linear-gradient(135deg, #0c4a6e, #082f49)', emoji: '🌊' },
        ].map((hero, i) => (
          <div key={i} style={{
            minWidth: 160, borderRadius: 20, padding: 20,
            background: hero.bg, border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ fontSize: 40 }}>{hero.emoji}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{hero.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{hero.power}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Social Proof */}
      <div style={{
        margin: '0 20px', padding: '24px 20px', borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))',
        border: '1px solid rgba(99,102,241,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex' }}>
            {['👩‍👧', '👨‍👦', '👩‍👧‍👦'].map((e, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: 16, background: '#1e1b4b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, marginLeft: i > 0 ? -8 : 0, border: '2px solid #020215'
              }}>{e}</div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Loved by 3,000+ families</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>★★★★★ 4.9 on App Store</div>
          </div>
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 14, color: '#cbd5e1', lineHeight: 1.6,
          fontStyle: 'italic', margin: 0
        }}>
          "My daughter asks for a new story every single night. The AI creates adventures she absolutely loves." — Sarah M.
        </p>
      </div>

      {/* Features with animated borders */}
      <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontWeight: 700, fontSize: 11, color: '#818cf8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>WHY INFINITY HEROES</h3>
        {[
          { icon: '✨', title: 'Unique Every Time', desc: 'AI generates a brand new story each night — never the same tale twice.', accent: '#6366f1' },
          { icon: '🎙️', title: 'Natural Narration', desc: 'Premium ElevenLabs voices read with warmth and emotion.', accent: '#a855f7' },
          { icon: '🌙', title: 'Sleep Science Built-In', desc: 'Gentle pacing, ambient sounds, and auto-dim for perfect sleep.', accent: '#ec4899' },
          { icon: '🛡️', title: 'Parent-Approved Safety', desc: 'Every story filtered for age-appropriate, positive content.', accent: '#22c55e' },
        ].map((f, i) => (
          <div key={i} style={{
            padding: 20, borderRadius: 16,
            background: `linear-gradient(135deg, ${f.accent}08, transparent)`,
            border: `1px solid ${f.accent}20`,
            display: 'flex', gap: 14, alignItems: 'flex-start'
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${f.accent}15`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22, flexShrink: 0
            }}>{f.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div style={{
        padding: '32px 20px 40px',
        borderTop: '1px solid rgba(255,255,255,0.04)'
      }}>
        <h3 style={{ fontWeight: 800, fontSize: 24, marginBottom: 24, letterSpacing: -0.5 }}>
          Three taps to dreamland
        </h3>
        {[
          { step: '01', title: 'Pick a Hero', desc: 'Choose from cosmic guardians, fire phoenixes, ocean warriors, and more.' },
          { step: '02', title: 'Set the Mood', desc: 'Classic adventure, sleep mode, or silly Mad Libs — you decide.' },
          { step: '03', title: 'Dream Away', desc: 'AI crafts a unique tale, narrated with music and ambient sounds.' },
        ].map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start'
          }}>
            <div style={{
              fontWeight: 800, fontSize: 28, color: 'rgba(99,102,241,0.3)',
              fontFamily: 'var(--font-display)', lineHeight: 1, minWidth: 44
            }}>{s.step}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <div style={{
        margin: '0 20px 40px', padding: '32px 24px', borderRadius: 24, textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))',
        border: '1px solid rgba(99,102,241,0.2)'
      }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8, letterSpacing: -0.5 }}>
          Tonight's adventure awaits
        </h2>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, fontFamily: 'var(--font-body)' }}>
          Free to start. Cancel anytime. No bedtime tantrums.
        </p>
        <button style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none',
          color: '#fff', padding: '16px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700,
          fontFamily: 'var(--font-display)', cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(99,102,241,0.35)', width: '100%'
        }}>
          Download Infinity Heroes
        </button>
      </div>
    </div>
  );
}
