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

const NODE_GRADIENT = {
  height: 12,
  flex: 1,
  borderRadius: 999,
  border: '1px solid #bfdbfe',
  background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 35%, #93c5fd 62%, #1d4ed8 100%)',
};

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
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>SIBLING IMPORTANCE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={LINE('#9ca3af', 2)} />
          <span style={{ color: '#6b7280', fontSize: 11 }}>low</span>
          <span style={{ flex: 1 }} />
          <span style={LINE('#374151', 5)} />
          <span style={{ color: '#6b7280', fontSize: 11 }}>high</span>
        </div>
        <div style={{ color: '#6b7280', fontSize: 11, lineHeight: 1.35, marginTop: 6 }}>
          Edge thickness is min-max normalized among children of the same parent.
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 5, fontWeight: 800 }}>NODE WEIGHT</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: '#6b7280', fontSize: 11 }}>low</span>
          <span style={NODE_GRADIENT} />
          <span style={{ color: '#6b7280', fontSize: 11 }}>high</span>
        </div>
        <div style={{ color: '#6b7280', fontSize: 11, lineHeight: 1.35, marginTop: 6 }}>
          Node color is continuous, so nearby CR scores still differ visually.
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
