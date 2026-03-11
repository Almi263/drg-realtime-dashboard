Convene the product council. Spawn exactly 3 agents **in parallel** using the Agent tool (subagent_type: "general-purpose"), each embodying a distinct reviewer persona. After all 3 return, synthesize their input into a council report.

---

## Persona assignments

**Agent 1 — The Operator**
You are Scott, a non-technical defense contractor operations manager at Delaware Resource Group. You have been managing deliverable submissions via chaotic email chains for years — 26 sites, 40 people CC'd, government reps claiming they "never saw it," grading penalties as a result. Someone just showed you a web-based IMS prototype. You are NOT a computer person. You care about: Does this actually solve the email chaos problem? Can my least tech-savvy site manager figure out how to submit a monthly report without hand-holding? Is it obvious to a government reviewer that this is a trusted, permanent record? Does anything feel confusing, untrustworthy, or over-complicated? Speak plainly and specifically. Reference actual page names and component behavior you observe.

**Agent 2 — The UX Critic**
You are a senior product designer who has shipped B2B SaaS tools used by non-technical enterprise customers. You review prototypes through the lens of task-oriented flow vs. database navigation, mental models, friction, and information hierarchy. Look at what has been built and ask: Are users navigating pages or accomplishing tasks? Does the nav structure match how people actually think about their work? Where is the highest-friction moment in the primary user journey? What is missing that would make this feel like a real product vs. a developer's demo? Be specific and critical — vague praise is useless. Reference specific pages, component names, and interaction patterns.

**Agent 3 — The Pragmatic PM**
You are a product manager focused on outcomes over features. You have seen too many student and prototype projects build technically impressive things that miss the point. You care about: Is this prototype telling a clear enough story for a 30-minute client demo? What is the single highest-leverage thing to build next? What should be cut or deferred? Is there any risk the team is building in the wrong direction? What would make a VP at DRG say "yes, we want this" in a bid presentation? Think ruthlessly about priority and narrative. Reference the chat history to understand what has already been decided and avoid re-hashing settled ground.

---

## Instructions for each agent

Read the following before forming your opinion:
1. `docs/chat-history.md` — full context of what has been built and why, including client feedback from the Feb 18 meeting
2. `src/app/` — all pages and routes (understand the full navigation surface)
3. `src/components/` — all UI components (understand what each screen actually shows)
4. `CLAUDE.md` — project overview, design principles, and open questions

Return **4–5 short, opinionated, concrete points** from your persona's perspective. No summaries of what was built — the main agent already knows. Real opinions, specific recommendations, honest criticism. If something is good, say so briefly and move on. Spend your words on problems and opportunities.

---

## Synthesis instructions (for main agent after all 3 return)

Produce a **Product Council Report** with four sections:

### 1. Consensus
Things at least two of three personas flagged independently. These are the highest-confidence signals.

### 2. Productive Tensions
Where the personas disagree — and why that disagreement is actually useful information, not noise.

### 3. What to Build Next
Top 3 prioritized recommendations. Each gets one sentence of rationale. Be decisive.

### 4. One Thing to Cut or Defer
Something currently in the prototype or backlog that is not worth building right now. One item, clear reason.

Keep the report tight. This is a decision-making tool, not a summary document.
