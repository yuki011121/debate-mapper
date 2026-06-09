import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import DebateGraph from './components/DebateGraph';
import CRLegend from './components/CRLegend';
import ArgumentDetails from './components/ArgumentDetails';

const LYING_EXAMPLE = `/*
 * Lying is sometimes permissible
 * Canonical demo converted from Ava's debate map.
 *
 * Main map: argument nodes only. Numbered PCS blocks are internal structure.
 */

/* @question Thesis: Is lying always wrong? */
/* @question carg4_1: Are you culpable for negative consequences when you lie, as opposed to telling the truth? */
/* @question arg3: Does lying sometimes maximize utility? */

<Thesis>: Lying is sometimes permissible.

(1) Some kinds of cases make lying morally permissible.
----
(2) Lying is sometimes permissible.

<carg4_1>: When you lie, you are culpable for any bad results, so you should never lie.

(1) A person who lies takes responsibility for bad consequences caused by the lie.
----
(2) Lying is never permissible because liars are culpable for bad results.

<resp4_1_1>: You are only culpable if the results of your lie are reasonably foreseeable.

(1) Moral culpability requires reasonably foreseeable consequences.
----
(2) A liar is not culpable for every bad result of a lie.

<cr1_1>: Maybe you assume responsibility for all consequences of a wrong like a lie.

(1) Lying is already a wrong act.
----
(2) A liar may assume responsibility for all consequences of that wrong.

<resp4_1_2>: The culpability objection seems like a selfish point of view.

(1) The objection focuses on the liar's culpability rather than the needs of others.
----
(2) The culpability objection gives a selfish reason against lying.

<arg1>: White lies such as "yes, you look great in that" are obviously ok.

(1) Some white lies protect feelings without serious harm.
----
(2) Some white lies are permissible.

<carg1>: White lies are not obviously permissible because they deceive, frustrate knowledge, and may erode trust.

(1) White lies deceive people and can damage trust.
----
(2) White lies are not obviously permissible.

<arg2>: One can be virtuous while occasionally telling lies; for example, lying may be virtuous for a lawyer.

(1) Virtuous people can sometimes have role-based reasons to withhold or distort information.
----
(2) Occasional lying can be compatible with virtue.

<carg2>: A virtuous character could never include dishonesty, so being a lawyer who lies is incompatible with virtue.

(1) Dishonesty is a vice.
----
(2) A virtuous character cannot include lying.

<resp2>: There are virtuous people who lie, for example Gandhi.

(1) Gandhi is a virtuous person who sometimes used deception strategically.
----
(2) Virtuous people can sometimes lie.

<arg3>: Lying may sometimes be necessary to maximize utility, for example lying about Santa Claus makes children happy.

(1) Some lies produce better consequences than telling the truth.
----
(2) Lying sometimes maximizes utility.

<carg3_1>: For any given lie, it is not possible to reliably predict whether it will maximize utility.

(1) Consequences of individual lies are uncertain.
----
(2) We cannot reliably know that a particular lie maximizes utility.

<resp3_1>: "Do not lie" is a good heuristic rule for achieving the best consequences, while still allowing rare exceptions.

(1) Reliable moral rules can include carefully limited exceptions.
----
(2) A utility-based rule against lying can still allow rare lies.

<cr3_1>: It is difficult to identify exception cases.

(1) People often misjudge whether their own case is exceptional.
----
(2) Exception cases for lying are difficult to identify.

<carg3_2>: Lying promotes false information, which always decreases utility because truth is useful.

(1) False information makes practical reasoning worse.
----
(2) Lying decreases utility by promoting false information.

<Thesis>
  - <carg4_1>
    - <resp4_1_1>
      - <cr1_1>
    - <resp4_1_2>
  + <arg1>
    - <carg1>
  + <arg2>
    - <carg2>
      - <resp2>
  + <arg3>
    - <carg3_1>
      - <resp3_1>
        - <cr3_1>
    - <carg3_2>`;

const NIXON_EXAMPLE = `<Extremist>: Nixon is an extremist.
  + <Hawk>: Nixon is a hawk.
    + <Republican>: Nixon is a Republican.
    - <Quaker>: Nixon is a Quaker.
  + <Pacifist>: Nixon is a pacifist.
    + <Quaker>
    - <Republican>`;

const LACKEY_EXAMPLE = `/*
 * Lackey: Overview of Testimony
 * Hand-edited from the MindMup-style source file.
 *
 * Background definitions from the source:
 * - Testimony: a speaker's communicative act intended or taken to convey that p.
 * - Psychological defeater: a doubt or belief the subject has.
 * - Normative defeater: a doubt or belief the subject should have.
 */

/* @question StatementView: Is justified reliance on testimony fundamentally basic, reducible to perception/memory/inference, or something in between? */
/* @question Reductionism: For reductionists, must positive evidence be global evidence about testimony in general or local evidence about each speaker/report? */

<StatementView>: Lackey's Statement View says testimonial justification requires some nontestimonial positive evidence, but not enough to reduce testimony entirely to perception, memory, and inference; what matters is whether the speaker's statement is reliable.

(1) Hearers need some positive reason connected to the reliability of the speaker's statement.
(2) But hearers need not possess enough nontestimonial evidence to reduce testimony entirely to perception, memory, and inductive inference.
----
(3) Testimonial justification is best understood by Lackey's Statement View.

<Reductionism>: Reductionism says justified acceptance of testimony requires nontestimonially based positive reasons in addition to the absence of undefeated defeaters.

(1) Testimonial belief should not rest merely on the fact that someone said something.
(2) Hearers must possess nontestimonially based positive reasons for accepting testimony.
----
(3) Reductionism gives the right account of testimonial justification.

<GlobalReductionism>: Global reductionism says testimony in general is justified only if hearers have nontestimonial reasons for believing that testimony is generally reliable.

(1) Testimony is a source of belief only if it can be supported by perception, memory, and inductive inference.
(2) That support must show that testimony is generally reliable.
----
(3) Testimonial justification should be reduced globally to other epistemic sources.

<GlobalSampleObjection>: We are not exposed to a wide enough or representative enough sample of reports to inductively infer that testimony is generally reliable.

(1) Many reports involve complex scientific, economic, or mathematical claims that ordinary hearers cannot check.
(2) A hearer cannot survey testimony broadly enough to establish its general reliability.
----
(3) Global reductionism demands evidence that hearers cannot realistically possess.

<HeterogeneityObjection>: There may be no epistemically significant fact of the matter about the reliability of testimony in general.

(1) Testimony may not be a unified kind.
(2) Searching for generalizations about testimony as a homogeneous whole may be misleading.
----
(3) Global reductionism rests on an unstable target.

<LocalReductionism>: Local reductionism says each instance of testimonial justification requires nontestimonial positive reasons for accepting the particular report or speaker.

(1) The relevant question is whether this speaker and this report are trustworthy.
(2) Local evidence about the speaker or report can support a particular testimonial belief.
----
(3) Testimonial justification should be reduced locally to positive reasons about particular reports.

<OrdinaryKnowledgeObjection>: Ordinary cognitive agents often gain knowledge from speakers about whom they know very little, such as when asking for directions or the time.

(1) People often accept mundane testimony from strangers with little background evidence.
(2) These ordinary cases still seem to produce knowledge.
----
(3) Local reductionism overstates how much positive evidence ordinary hearers need.

<MatureNonmundaneReply>: A hybrid reductionist reply says positive reasons may only be needed for mature hearers encountering nonmundane testimony.

(1) Mundane testimony may not require the same evidential burden as unusual or high-stakes testimony.
(2) Mature hearers can be expected to monitor nonmundane testimony more carefully.
----
(3) Local reductionism can be softened to avoid the ordinary-knowledge objection.

<ChildKnowledgeObjection>: Young children acquire knowledge from parents and teachers even though they lack nontestimonial positive reasons for accepting much of what they are told.

(1) A child can know that the stove is hot because a parent says so.
(2) The child may lack positive inductive reasons for the parent's reliability.
----
(3) Reductionism excludes too much child knowledge.

<Nonreductionism>: Nonreductionism says hearers can be justified in accepting testimony merely on the basis of testimony, so long as there are no relevant undefeated defeaters.

(1) In the absence of undefeated defeaters, testimony itself can justify belief.
(2) Hearers need not supply independent positive evidence for testimonial belief.
----
(3) Nonreductionism gives the right account of testimonial justification.

<GullibilityObjection>: Nonreductionism seems to sanction gullibility, epistemic irrationality, and intellectual irresponsibility.

(1) Random speakers, arbitrary internet postings, and unidentified telemarketers would be trusted whenever there is no negative evidence against them.
(2) Responsible hearers should need more than the mere absence of defeaters.
----
(3) Nonreductionism is too permissive.

<EntitlementMonitoringReply>: A hybrid nonreductionist reply says the needed positive reasons might be modest epistemic entitlement or an ability to monitor reports.

(1) Hearers may have a default entitlement to accept testimony.
(2) Hearers can also monitor reports for signs of unreliability without fully reducing testimony to other sources.
----
(3) Nonreductionism can avoid simple gullibility without becoming full reductionism.

<StatementView>
  - <Reductionism>
    + <GlobalReductionism>
      - <GlobalSampleObjection>
      - <HeterogeneityObjection>
    + <LocalReductionism>
      - <OrdinaryKnowledgeObjection>
        - <MatureNonmundaneReply>
    - <ChildKnowledgeObjection>
  - <Nonreductionism>
    - <GullibilityObjection>
      - <EntitlementMonitoringReply>`;

const EXAMPLES = {
  lying: { label: 'Lying demo', text: LYING_EXAMPLE },
  nixon: { label: 'Nixon diamond', text: NIXON_EXAMPLE },
  lackey: { label: 'Lackey testimony', text: LACKEY_EXAMPLE },
};

function getAnalysisCacheKey(input) {
  const normalized = input.replace(/\r\n?/g, '\n').trim();
  let hash = 2166136261;

  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return `semantic-cr-v1:${normalized.length}:${(hash >>> 0).toString(36)}`;
}

export default function App() {
  const [text, setText] = useState(LYING_EXAMPLE);
  const [exampleKey, setExampleKey] = useState('lying');
  const [graphData, setGraphData] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const aiAnalysisCacheRef = useRef(new Map());
  const hasCachedAiAnalysis = aiAnalysisCacheRef.current.has(getAnalysisCacheKey(text));
  const hasActiveAiAnalysis = aiAnalysis != null;

  const selectedNode = useMemo(
    () => {
      const node = graphData?.nodes.find((item) => item.id === selectedNodeId);
      if (!node) return null;
      const semanticRelations = (graphData?.edges || [])
        .filter((edge) => edge.from === node.id || edge.to === node.id)
        .map((edge) => {
          const key = `${edge.from}=>${edge.to}:${edge.type}`;
          return {
            ...edge,
            key,
            direction: edge.from === node.id ? 'outgoing' : 'incoming',
            ai: aiAnalysis?.edges?.[key] ?? null,
          };
        })
        .filter((edge) => edge.ai);

      return {
        ...node,
        ai: aiAnalysis?.nodes?.[node.title] ?? null,
        semanticRelations,
      };
    },
    [aiAnalysis, graphData, selectedNodeId]
  );

  const parseText = useCallback(async (input) => {
    setLoading(true);
    setError(null);
    setLlmError(null);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parse failed');
      setGraphData(data);
      setSelectedNodeId(data.root);
      setAiAnalysis(null);
    } catch (err) {
      setGraphData(null);
      setSelectedNodeId(null);
      setAiAnalysis(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    parseText(LYING_EXAMPLE);
  }, [parseText]);

  function handleExampleChange(event) {
    const nextKey = event.target.value;
    const nextText = EXAMPLES[nextKey].text;
    setExampleKey(nextKey);
    setText(nextText);
    parseText(nextText);
  }

  async function handleLlmScore() {
    const cacheKey = getAnalysisCacheKey(text);
    const cachedAnalysis = aiAnalysisCacheRef.current.get(cacheKey);
    if (cachedAnalysis) {
      setAiAnalysis(cachedAnalysis);
      setLlmError(null);
      return;
    }

    setLlmLoading(true);
    setLlmError(null);
    try {
      const res = await fetch('/api/llm-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'LLM scoring failed');
      aiAnalysisCacheRef.current.set(cacheKey, data);
      setAiAnalysis(data);
    } catch (err) {
      setLlmError(err.message);
    } finally {
      setLlmLoading(false);
    }
  }

  function handleShowFormalScores() {
    setAiAnalysis(null);
    setLlmError(null);
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f3f4f6',
      color: '#111827',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <header style={{
        height: 56,
        padding: '0 18px',
        borderBottom: '1px solid #d1d5db',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 19, fontWeight: 800 }}>Debate Mapper</span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Argdown + Context Relevance</span>
        </div>
        {graphData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#4b5563' }}>
            <strong>{graphData.nodes.length}</strong> arguments
            <strong>{graphData.edges.length}</strong> relations
          </div>
        )}
      </header>

      <main style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <section style={{
          width: 390,
          flexShrink: 0,
          borderRight: '1px solid #d1d5db',
          background: '#ffffff',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="example-select" style={{ fontSize: 11, color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Example
            </label>
            <select
              id="example-select"
              value={exampleKey}
              onChange={handleExampleChange}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: 6,
                padding: '8px 10px',
                background: '#fff',
                color: '#111827',
                fontSize: 13,
              }}
            >
              {Object.entries(EXAMPLES).map(([key, example]) => (
                <option key={key} value={key}>{example.label}</option>
              ))}
            </select>
          </div>

          <label htmlFor="argdown-input" style={{ fontSize: 11, color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Argdown
          </label>
          <textarea
            id="argdown-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              resize: 'none',
              background: '#111827',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: 6,
              padding: 12,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 12,
              lineHeight: 1.55,
              outline: 'none',
            }}
          />

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#991b1b' }}>
              {error}
            </div>
          )}

          <button
            onClick={() => parseText(text)}
            disabled={loading || !text.trim()}
            style={{
              background: loading ? '#9ca3af' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 0',
              fontSize: 14,
              fontWeight: 800,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Parsing...' : 'Parse'}
          </button>

          {graphData && (
            <>
              <button
                onClick={handleLlmScore}
                disabled={llmLoading || hasActiveAiAnalysis}
                style={{
                  background: llmLoading || hasActiveAiAnalysis ? '#9ca3af' : '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 0',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: llmLoading || hasActiveAiAnalysis ? 'default' : 'pointer',
                }}
              >
                {llmLoading ? 'Analyzing...' : hasActiveAiAnalysis ? 'AI analysis active' : hasCachedAiAnalysis ? 'Use cached AI analysis' : 'Analyze with AI'}
              </button>
              {hasActiveAiAnalysis && (
                <button
                  onClick={handleShowFormalScores}
                  style={{
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '10px 0',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Show formal CR
                </button>
              )}
              {llmError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#991b1b' }}>
                  {llmError}
                </div>
              )}
            </>
          )}

          <CRLegend />
        </section>

        <section style={{ flex: 1, minWidth: 0, position: 'relative', background: '#f8fafc' }}>
          <DebateGraph
            graphData={graphData}
            aiAnalysis={aiAnalysis}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
          />
        </section>

        <ArgumentDetails node={selectedNode} />
      </main>
    </div>
  );
}
