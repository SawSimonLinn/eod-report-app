import AppShell from '../../components/AppShell';

export const metadata = {
  title: 'About · End of Day Report',
  description: 'About the creator of the End of Day Report tool.',
};

export default function AboutPage() {
  return (
    <AppShell>
      <div className="hero">
        <div className="eyebrow">
          <span className="pulse"></span>About
        </div>
        <h1>Behind This Tool</h1>
        <p className="sub">Why this exists, and who built it.</p>
      </div>

      <div className="card">
        <p className="section-title">What This Is</p>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink)', margin: '0 0 10px' }}>
          End of Day Report turns a few rough notes into a clean, consistent report that&apos;s ready to paste into
          the store group chat — built for teams running 10+ locations who were typing the same update by hand
          every night.
        </p>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>
          Pick a store, jot down what happened, and let it write the message — in a short or long style, in a
          slightly different voice each time so every store&apos;s update doesn&apos;t read like a copy-pasted
          template.
        </p>
      </div>

      <div className="card">
        <div className="about-hero">
          <div className="about-avatar">SL</div>
          <div>
            <h2 className="about-name">Saw Simon Linn</h2>
            <div className="about-role">Software Engineer · AI Software Engineer</div>
          </div>
        </div>

        <div className="about-card" style={{ marginTop: 16 }}>
          <p>
            AI-focused software engineer with 3+ years of experience building intelligent systems using LLMs, RAG
            pipelines, AI agent workflows, and data pipelines. This report tool is one of many small, practical AI
            products built to solve a real operational problem end-to-end — backend, prompt design, and UI
            included.
          </p>
        </div>

        <div className="link-row">
          <a href="mailto:sawsimonlinn@gmail.com">✉ Email</a>
          <a href="https://linkedin.com/in/sawsimonlinn" target="_blank" rel="noopener">
            in LinkedIn
          </a>
          <a href="https://github.com/SawSimonLinn" target="_blank" rel="noopener">
            ◈ GitHub
          </a>
          <a href="https://simonlinn.dev" target="_blank" rel="noopener">
            ↗ simonlinn.dev
          </a>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Currently</p>
        <div className="project-item">
          <div className="p-title">Software Engineer · Koios Marketplace</div>
          <div className="p-desc">
            Architecting scalable Node.js microservices and Next.js features, documenting API contracts, and
            integrating type-safe APIs with resilient UI error handling to improve system reliability and team
            velocity.
          </div>
        </div>
        <div className="project-item">
          <div className="p-title">AI Applied Engineer Intern · Nailbox AI</div>
          <div className="p-desc">
            Built an LLM-powered pipeline to process email threads, extract key information, and map content to
            the correct document versions — cutting manual review effort and improving processing efficiency by
            50%+.
          </div>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Other Projects</p>
        <div className="project-item">
          <div className="p-title">Linna — AI SaaS with Persistent Memory</div>
          <div className="p-desc">
            An AI assistant that retains project goals, decisions, and chat history across sessions instead of
            starting from zero each time.
          </div>
        </div>
        <div className="project-item">
          <div className="p-title">RAG System (AI Archive)</div>
          <div className="p-desc">
            A retrieval-augmented pipeline using embeddings and vector search to ground answers in real data
            instead of hallucination.
          </div>
        </div>
        <div className="project-item">
          <div className="p-title">AI Content Engine</div>
          <div className="p-desc">
            A multi-step AI agent system with prompt chaining that generates scripts, captions, hashtags, and
            content plans automatically.
          </div>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Toolbox</p>
        <div className="tag-row">
          <span className="tag">LLM APIs</span>
          <span className="tag">RAG Systems</span>
          <span className="tag">Prompt Engineering</span>
          <span className="tag">AI Agents</span>
          <span className="tag">Node.js</span>
          <span className="tag">Express</span>
          <span className="tag">Next.js</span>
          <span className="tag">React</span>
          <span className="tag">TypeScript</span>
          <span className="tag">Supabase</span>
        </div>
      </div>
    </AppShell>
  );
}
