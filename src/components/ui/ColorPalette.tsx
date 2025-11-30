'use client';

/**
 * Color Palette Reference Component
 * Use this as a reference for the available colors in the theme
 */
export default function ColorPalette() {
  const colors = [
    {
      name: 'Primary (Purple)',
      hex: '#8b86be',
      usage: 'Main brand color, primary buttons, links',
      variable: '--color-primary',
    },
    {
      name: 'Secondary (Pink)',
      hex: '#deb0bd',
      usage: 'Secondary actions, accents, highlights',
      variable: '--color-secondary',
    },
    {
      name: 'Gold',
      hex: '#ecb761',
      usage: 'Jewelry accent, premium features, warnings',
      variable: '--color-gold',
    },
    {
      name: 'Success (Green)',
      hex: '#cbd690',
      usage: 'Success messages, positive states, confirmations',
      variable: '--color-success',
    },
    {
      name: 'Info (Blue)',
      hex: '#86abba',
      usage: 'Information, neutral states, secondary text',
      variable: '--color-info',
    },
  ];

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 className="page-title">🎨 BoolaGold Color Palette</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '16px auto 0' }}>
          Global standard UI colors for the jewelry store management system
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {colors.map((color) => (
          <div key={color.hex} className="card">
            <div
              style={{
                background: color.hex,
                height: '120px',
                borderRadius: '12px',
                marginBottom: '16px',
                boxShadow: `0 4px 20px ${color.hex}40`,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>{color.name}</h3>
              <code style={{ fontSize: '0.85rem', background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: '6px' }}>
                {color.hex}
              </code>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '12px' }}>
              {color.usage}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>CSS Variable:</span>
              <code style={{ fontSize: '0.85rem', background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                var({color.variable})
              </code>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Examples */}
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>💡 Usage Examples</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <button className="button">Primary Button</button>
          <button className="button button-secondary">Secondary Button</button>
          <button className="button button-gold">Gold Button</button>
          <button className="button button-outline">Outline Button</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div className="alert alert-info">
            <strong>ℹ️ Info Alert:</strong> This is an informational message.
          </div>
          <div className="alert alert-success">
            <strong>✅ Success Alert:</strong> Operation completed successfully!
          </div>
          <div className="alert alert-warning">
            <strong>⚠️ Warning Alert:</strong> Please review this information.
          </div>
          <div className="alert alert-error">
            <strong>❌ Error Alert:</strong> Something went wrong.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-info">Info</span>
          <span className="badge badge-error">Error</span>
        </div>
      </div>
    </div>
  );
}
