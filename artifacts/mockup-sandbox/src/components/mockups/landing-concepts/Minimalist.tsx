import './_group.css';

export function Minimalist() {
  return (
    <div style={{ fontFamily: "var(--font-display)", background: '#02021a', color: '#fff', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Star field */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.25, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(1px 1px at 20px 30px, #fff, transparent),
          radial-gradient(1px 1px at 80px 120px, #fff, transparent),
          radial-gradient(2px 2px at 150px 50px, #fff, transparent),
          radial-gradient(1px 1px at 200px 160px, #fff, transparent),
          radial-gradient(1px 1px at 300px 80px, #fff, transparent),
          radial-gradient(2px 2px at 350px 200px, #fff, transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 250px',
      }} />

      {/* Subtle glow orbs */}
      <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 20 }}>✨</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>Infinity Heroes</span>
        </div>
        <button style={{
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          color: '#818cf8', padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--font-display)', cursor: 'pointer'
        }}>
          Get the App
        </button>
      </nav>

      {/* Hero */}
      <main style={{ padding: '60px 24px 40px', textAlign: 'center', position: 'relative', zIndex: 5 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 28
        }}>
          <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>AI-Powered Bedtime Stories</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.1,
          letterSpacing: -1.5, margin: '0 0 18px', maxWidth: 560, marginInline: 'auto'
        }}>
          Bedtime stories as{' '}
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            infinite
          </span>
          {' '}as imagination
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.7, color: 'rgba(148,163,184,0.9)',
          maxWidth: 420, margin: '0 auto 36px', fontWeight: 400
        }}>
          Every night, a new adventure. AI generates unique bedtime tales personalized to your child's favorite heroes, read aloud in soothing voices.
        </p>

        {/* CTA Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
          <button style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none',
            color: '#fff', padding: '16px 32px', borderRadius: 14, fontSize: 16, fontWeight: 700,
            fontFamily: 'var(--font-display)', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(99,102,241,0.35)'
          }}>
            Start Free — No Card Needed
          </button>
          <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)', fontFamily: 'var(--font-body)' }}>
            3,000+ families already dreaming
          </span>
        </div>

        {/* Phone Mockup */}
        <div style={{
          marginTop: 50, position: 'relative', maxWidth: 280, marginInline: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.04) 100%)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 28, padding: 12, position: 'relative'
          }}>
            <div style={{
              background: '#0a0a2e', borderRadius: 20, overflow: 'hidden',
              aspectRatio: '9/16', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 16, padding: 24
            }}>
              <div style={{ fontSize: 48, opacity: 0.7 }}>🌙</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>The Starry Whales</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>12 min read · Cosmic</div>
              </div>
              <div style={{
                width: '100%', height: 4, background: 'rgba(99,102,241,0.2)', borderRadius: 2,
                overflow: 'hidden', marginTop: 8
              }}>
                <div style={{ width: '65%', height: '100%', background: '#6366f1', borderRadius: 2 }} />
              </div>
            </div>
          </div>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '140%', height: '140%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)',
            borderRadius: '50%', pointerEvents: 'none', zIndex: -1
          }} />
        </div>
      </main>

      {/* Trust Strip */}
      <div style={{ padding: '32px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 16 }}>
          {[
            { num: '50K+', label: 'Stories Created' },
            { num: '4.9★', label: 'App Rating' },
            { num: '3K+', label: 'Happy Families' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: '#818cf8', letterSpacing: -0.5 }}>{s.num}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{ padding: '20px 24px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { icon: '🤖', title: 'AI-Generated Tales', desc: 'Every story is unique, tailored to your child\'s chosen hero and preferences.' },
          { icon: '🔊', title: 'Natural Narration', desc: 'ElevenLabs voices bring stories to life with warm, soothing tones.' },
          { icon: '🛡️', title: 'Safe for Kids', desc: 'Child-safe content filtering ensures every tale is age-appropriate.' },
          { icon: '🌙', title: 'Sleep Mode', desc: 'Ambient soundscapes and sleep timers for peaceful bedtime routines.' },
        ].map((f, i) => (
          <div key={i} style={{
            display: 'flex', gap: 16, padding: '20px', borderRadius: 16,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>{f.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '32px 24px 60px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 12, letterSpacing: -0.5 }}>Ready for bedtime magic?</h2>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, fontFamily: 'var(--font-body)' }}>Download free. First 5 stories on us.</p>
        <button style={{
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none',
          color: '#fff', padding: '16px 48px', borderRadius: 14, fontSize: 16, fontWeight: 700,
          fontFamily: 'var(--font-display)', cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(99,102,241,0.3)'
        }}>
          Get Started Free
        </button>
      </div>
    </div>
  );
}
