function ScoreRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 700, color: '#111827' }}>{value ?? '-'}</span>
    </div>
  );
}

function formatSigned(value) {
  if (value == null) return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return '-';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
}

function StructureList({ title, items }) {
  if (!items?.length) return null;

  return (
    <section style={{ display: 'grid', gap: 6 }}>
      <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>{title}</h3>
      <ol style={{ display: 'grid', gap: 6, paddingLeft: 18 }}>
        {items.map((item) => (
          <li key={`${item.role}-${item.number}`} style={{ fontSize: 13, lineHeight: 1.45, color: '#374151' }}>
            {item.text}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ArgumentDetails({ node }) {
  if (!node) {
    return (
      <aside style={{
        width: 320,
        borderLeft: '1px solid #d1d5db',
        background: '#f9fafb',
        padding: 18,
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
      }}>
        Select an argument.
      </aside>
    );
  }

  const data = node;
  const structure = data.innerStructure || {};
  const rootContext = data.contexts?.find(context => context.contextRoot === data.contextRoot) || data.contexts?.[0];
  const aiMismatch = data.ai?.formalDelta != null && Math.abs(data.ai.formalDelta) >= 0.25;

  return (
    <aside style={{
      width: 340,
      flexShrink: 0,
      borderLeft: '1px solid #d1d5db',
      background: '#f9fafb',
      color: '#111827',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 6 }}>
          Argument
        </div>
        <h2 style={{ fontSize: 18, lineHeight: 1.25, marginBottom: 8 }}>{data.title}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.45, color: '#374151' }}>{data.claimText}</p>
      </div>

      <div style={{ padding: 18, overflow: 'auto', display: 'grid', gap: 18 }}>
        {data.contextQuestion && (
          <section style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6, padding: 10 }}>
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#92400e', marginBottom: 5 }}>
              Context Question
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.45, color: '#78350f' }}>{data.contextQuestion}</p>
          </section>
        )}

        <section style={{ display: 'grid', gap: 8 }}>
          <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>
            Relevance
          </h3>
          <div style={{ display: 'grid', gap: 5, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 10 }}>
            <ScoreRow label="Global CR" value={data.globalScore?.toFixed?.(2) ?? data.globalScore} />
            <ScoreRow label="Root CR" value={data.crScore?.toFixed?.(2) ?? data.crScore} />
            {data.ai?.semanticScore != null && <ScoreRow label="AI Semantic CR" value={data.ai.semanticScore.toFixed(2)} />}
            {data.ai?.formalDelta != null && <ScoreRow label="AI/Formal Delta" value={formatSigned(data.ai.formalDelta)} />}
            {data.ai?.role && <ScoreRow label="AI Role" value={data.ai.role} />}
            <ScoreRow label="Depth" value={data.depth} />
            <ScoreRow label="Height" value={data.height} />
            <ScoreRow label="Branching" value={data.branching ?? data.inDegree} />
            <ScoreRow label="Outdegree" value={data.outDegree} />
            <ScoreRow label="Siblings" value={data.siblings} />
            <ScoreRow label="Leaf" value={data.isLeaf ? 'yes' : 'no'} />
            {rootContext && <ScoreRow label="Context" value={rootContext.contextRoot} />}
          </div>
        </section>

        {data.ai?.rationale && (
          <section style={{
            display: 'grid',
            gap: 6,
            background: aiMismatch ? '#f5f3ff' : '#fff',
            border: aiMismatch ? '2px solid #8b5cf6' : '1px solid #ddd6fe',
            borderRadius: 6,
            padding: 10,
          }}>
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5b21b6' }}>
              AI Rationale{aiMismatch ? ' / Formal Mismatch' : ''}
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.45, color: '#3b0764' }}>{data.ai.rationale}</p>
          </section>
        )}

        {data.semanticRelations?.length > 0 && (
          <section style={{ display: 'grid', gap: 8 }}>
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>
              Semantic Relations
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {data.semanticRelations.map((edge) => (
                <div key={edge.key} style={{ background: '#fff', border: '1px solid #e9d5ff', borderRadius: 6, padding: 10, display: 'grid', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, fontWeight: 800, color: '#581c87' }}>
                    <span>{edge.from} {edge.type === 'support' ? 'supports' : 'disputes'} {edge.to}</span>
                    <span>{edge.ai.semanticLocalScore.toFixed(2)}</span>
                  </div>
                  {edge.ai.rationale && (
                    <p style={{ fontSize: 12, lineHeight: 1.45, color: '#4b5563' }}>{edge.ai.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <StructureList title="Premises" items={structure.premises} />
        <StructureList title="Conclusion" items={structure.conclusions} />

        {structure.description && (
          <section style={{ display: 'grid', gap: 6 }}>
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>
              Description
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.45, color: '#374151' }}>{structure.description}</p>
          </section>
        )}
      </div>
    </aside>
  );
}
