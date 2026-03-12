import './_group.css';

export function Editorial() {
  return (
    <div style={{ fontFamily: "var(--font-display)", background: '#0a0a14', color: '#f1f5f9', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Subtle texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Single accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #6366f1, #a855f7, transparent)'
      }} />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>Infinity</span>
          <div style={{
            width: 1, height: 16, background: 'rgba(255,255,255,0.15)'
          }} />
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase' }}>Heroes</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>About</span>
          <button style={{
            background: '#fff', border: 'none', color: '#0a0a14',
            padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            fontFamily: 'var(--font-display)', cursor: 'pointer'
          }}>
            Try Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '56px 24px 40px', position: 'relative', zIndex: 5 }}>
        <div style={{
          fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: 3,
          textTransform: 'uppercase', marginBottom: 20
        }}>
          THE FUTURE OF BEDTIME
        </div>

        <h1 style={{
          fontWeight: 800, fontSize: 44, lineHeight: 1.05, letterSpacing: -2,
          margin: '0 0 20px'
        }}>
          Stories that<br />
          grow with<br />
          <span style={{ color: '#818cf8' }}>your child</span>
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.75,
          color: '#94a3b8', marginBottom: 32, maxWidth: 380
        }}>
          Infinity Heroes uses advanced AI to generate unique bedtime stories personalized to your child — their hero, their adventure, their pace. Every night is different. Every tale is safe.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{
            background: '#f1f5f9', border: 'none', color: '#0a0a14',
            padding: '15px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700,
            fontFamily: 'var(--font-display)', cursor: 'pointer',
          }}>
            Get Started →
          </button>
          <button style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            color: '#cbd5e1', padding: '15px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-display)', cursor: 'pointer',
          }}>
            Learn More
          </button>
        </div>
      </div>

      {/* Editorial Photo Block */}
      <div style={{ padding: '0 24px 40px' }}>
        <div style={{
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0f0f2e 100%)',
          aspectRatio: '4/3', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.15,
            backgroundImage: `
              radial-gradient(1px 1px at 20px 30px, #fff, transparent),
              radial-gradient(2px 2px at 80px 80px, #fff, transparent),
              radial-gradient(1px 1px at 140px 50px, #fff, transparent),
              radial-gradient(1px 1px at 200px 120px, #fff, transparent)
            `,
            backgroundRepeat: 'repeat',
            backgroundSize: '240px 160px',
          }} />
          <div style={{ fontSize: 64, zIndex: 1 }}>🌌</div>
          <div style={{ textAlign: 'center', zIndex: 1, padding: '0 24px' }}>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>The Whisper of the Azure Grove</div>
            <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-body)' }}>AI-generated story preview · 8 min read</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '8px 20px',
            fontSize: 12, fontWeight: 600, color: '#c4b5fd', zIndex: 1
          }}>
            Read a Sample Story →
          </div>
        </div>
      </div>

      {/* Manifesto Section */}
      <div style={{
        padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: 3,
          textTransform: 'uppercase', marginBottom: 20
        }}>
          OUR PHILOSOPHY
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { title: 'Never the same story twice', body: 'AI generates a unique narrative every single time, based on the hero and mood your child chooses. The possibilities are literally infinite.' },
            { title: 'Designed for calm', body: 'Sleep mode dims the interface, slows the narration, adds ambient soundscapes, and includes built-in timers — because bedtime should be peaceful.' },
            { title: 'Trusted by parents', body: 'Every story passes through child safety filters. No scary content, no inappropriate themes, no ads. Just pure imagination.' },
          ].map((item, i) => (
            <div key={i}>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, letterSpacing: -0.3 }}>{item.title}</h3>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.8,
                color: '#94a3b8', margin: 0
              }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{
        padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        {[
          { value: '50K', label: 'Stories told' },
          { value: '4.9', label: 'Star rating' },
          { value: '7', label: 'AI models' },
        ].map((m, i) => (
          <div key={i}>
            <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: -1, color: '#e2e8f0' }}>{m.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div style={{ padding: '40px 24px' }}>
        <div style={{
          fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: 3,
          textTransform: 'uppercase', marginBottom: 20
        }}>
          WHAT PARENTS SAY
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { quote: "My kids fight over who picks the hero. It's become our favorite nightly ritual.", name: "Jessica R.", role: "Mom of 2" },
            { quote: "The sleep mode is a game-changer. My son falls asleep within 10 minutes every single time.", name: "David K.", role: "Dad of 1" },
          ].map((t, i) => (
            <div key={i} style={{
              padding: 24, borderRadius: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
                color: '#cbd5e1', margin: '0 0 16px', fontStyle: 'italic'
              }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#818cf8'
                }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ padding: '40px 24px 60px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontWeight: 800, fontSize: 28, letterSpacing: -1, marginBottom: 8 }}>Start tonight.</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#94a3b8', marginBottom: 28, lineHeight: 1.6 }}>
          Free for your first 5 stories.<br />No credit card required.
        </p>
        <button style={{
          background: '#f1f5f9', border: 'none', color: '#0a0a14',
          padding: '16px 40px', borderRadius: 10, fontSize: 16, fontWeight: 700,
          fontFamily: 'var(--font-display)', cursor: 'pointer', width: '100%', maxWidth: 320
        }}>
          Download Infinity Heroes
        </button>
        <div style={{
          marginTop: 16, display: 'flex', justifyContent: 'center', gap: 20
        }}>
          <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'var(--font-body)' }}>iOS</span>
          <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'var(--font-body)' }}>Android</span>
          <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'var(--font-body)' }}>Web</span>
        </div>
      </div>
    </div>
  );
}
