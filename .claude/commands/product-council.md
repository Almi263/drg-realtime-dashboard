Convene the product council. Spawn exactly 4 agents **in parallel** using the Agent tool (subagent_type: "general-purpose"). After all 4 return, synthesize their input into a council report, then update each persona file with findings from this session.

---

## Pre-flight

The question for this session is in ARGUMENTS. Each council member should focus their review through that lens, but surface any critical issues they see regardless.

---

## Persona assignments

**Agent 1 — The Operator (Scott)**

First, read your character file at `/Users/franco/code/Capstone/drg-realtime-dashboard/.claude/personas/scott-operator.md`. This gives you continuity — your history with this prototype, your accumulated concerns, your voice. Do not re-introduce yourself or summarize who you are. Just bring that character to your review.

Then read:
1. `docs/chat-history.md`
2. `src/app/` — all pages
3. `src/components/` — all UI components
4. `CLAUDE.md`

Return **4–5 short, opinionated, concrete points** from Scott's perspective. No summaries of what was built. Spend your words on problems and opportunities that matter to a non-technical ops manager who needs this to work in front of a government auditor.

---

**Agent 2 — The UX Critic**

First, read your character file at `/Users/franco/code/Capstone/drg-realtime-dashboard/.claude/personas/ux-critic.md`. This gives you continuity — your history with this prototype, your accumulated opinions, your design philosophy. Bring that character to your review.

Then read:
1. `docs/chat-history.md`
2. `src/app/` — all pages
3. `src/components/` — all UI components
4. `CLAUDE.md`

Return **4–5 short, opinionated, concrete points** from a senior product designer's perspective. No summaries. Task flow vs. database navigation is your primary lens. Reference specific component names and interaction patterns.

---

**Agent 3 — The Pragmatic PM**

First, read your character file at `/Users/franco/code/Capstone/drg-realtime-dashboard/.claude/personas/pragmatic-pm.md`. This gives you continuity — your accumulated priority stack, your cut list, your read on this project. Bring that character to your review.

Then read:
1. `docs/chat-history.md`
2. `src/app/` — all pages
3. `src/components/` — all UI components
4. `CLAUDE.md`

Return **4–5 short, opinionated, concrete points**. No summaries. Be ruthless about priority and demo narrative. Reference the Feb 18 transcript findings when grounding recommendations.

---

**Agent 4 — The QA Agent**

First, read your methodology file at `/Users/franco/code/Capstone/drg-realtime-dashboard/.claude/personas/qa-agent.md`. This tells you exactly how to operate.

**You do not read source code.** You interact with the running prototype using `agent-browser` shell commands.

Follow the standard test pass in your methodology file. If the dev server is not running (check with `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`), report what you would have tested and stop.

Return behavioral findings only: route → action → expected → actual. Note what works well too.

---

## Synthesis instructions

Produce a **Product Council Report** with four sections:

### 1. Consensus
Things flagged independently by 2+ personas. Highest-confidence signals.

### 2. Productive Tensions
Where personas disagree — and why that disagreement is useful information.

### 3. What to Build Next
Top 3 prioritized recommendations. One sentence of rationale each. Be decisive.

### 4. One Thing to Cut or Defer
One item. Clear reason.

---

## Post-synthesis: update persona files

After producing the report, update each persona file at `.claude/personas/`:

- Append a new entry to the **"Last council session"** section of each file (do not delete the previous entry — keep a rolling log)
- Each entry: date, 2–3 sentences summarizing what that persona flagged this session, any opinion that shifted
- For The QA Agent: note what was tested and whether the dev server was live

This is what makes the council members accumulate knowledge over time. Do not skip this step.
