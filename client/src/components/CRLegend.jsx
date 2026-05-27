const ROW = { display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: 12, color: '#374151' };
const LINE = (color, width) => ({
  display: 'inline-block',
  width: 34,
  height: Math.max(width, 2),
  background: color,
  borderRadius: 999,
  marginRight: 8,
  flexShrink: 0,
});

const NODE_SAMPLE = (background, border, color = '#111827') => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 22,
  background,
  border: `2px solid ${border}`,
  borderRadius: 4,
  color,
  fontSize: 10,
  fontWeight: 800,
  flexShrink: 0,
});

export default function CRLegend() {
  return (
    <div style={{
      background: '#f9fafb',
      color: '#111827',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      padding: '12px 14px',
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 800, marginBottom: 10, letterSpacing: 0, textTransform: 'uppercase', fontSize: 10, color: '#6b7280' }}>
        Display
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>RELATIONS</div>
        <div style={ROW}><span style={LINE('#2f9461', 3)} />Support</div>
        <div style={ROW}><span style={LINE('#dc2626', 3)} />Dispute</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>RELATION WEIGHT</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={LINE('#9ca3af', 2)} />
          <span style={{ color: '#6b7280', fontSize: 11 }}>low</span>
          <span style={{ flex: 1 }} />
          <span style={LINE('#374151', 5)} />
          <span style={{ color: '#6b7280', fontSize: 11 }}>high</span>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>NODE WEIGHT</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={NODE_SAMPLE('#ffffff', '#cbd5e1')}>low</span>
          <span style={{ color: '#6b7280' }}>to</span>
          <span style={NODE_SAMPLE('#0f766e', '#134e4a', '#ffffff')}>high</span>
        </div>
      </div>

      <div>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>SCORE SOURCE</div>
        <div style={{ ...ROW, alignItems: 'flex-start', lineHeight: 1.35, marginBottom: 0 }}>
          <span style={{ color: '#5b21b6', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 999, padding: '2px 7px', marginRight: 8, fontSize: 11, fontWeight: 800 }}>
            AI
          </span>
          AI semantic CR after analysis; formal CR before analysis.
        </div>
      </div>
    </div>
  );
}
