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
      <div style={{ fontWeight: 800, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10, color: '#6b7280' }}>
        Display
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>RELATIONS</div>
        <div style={ROW}><span style={LINE('#2f9461', 3)} />Support</div>
        <div style={ROW}><span style={LINE('#dc2626', 3)} />Dispute</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>LOCAL CR</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={LINE('#9ca3af', 2)} />
          <span style={{ color: '#6b7280', fontSize: 11 }}>low</span>
          <span style={{ flex: 1 }} />
          <span style={LINE('#374151', 7)} />
          <span style={{ color: '#6b7280', fontSize: 11 }}>high</span>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>GLOBAL CR</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ border: '1px solid #9ca3af', borderRadius: 4, padding: '3px 8px', background: '#fff', fontSize: 11 }}>0.32</span>
          <span style={{ color: '#6b7280' }}>to</span>
          <span style={{ border: '4px solid #111827', borderRadius: 4, padding: '3px 8px', background: '#fff', fontSize: 11, fontWeight: 800 }}>0.86</span>
        </div>
      </div>

      <div>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>AI SEMANTIC CR</div>
        <div style={ROW}>
          <span style={{ color: '#5b21b6', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 999, padding: '2px 7px', marginRight: 8, fontSize: 11, fontWeight: 800 }}>
            AI
          </span>
          Semantic score / mismatch
        </div>
      </div>
    </div>
  );
}
