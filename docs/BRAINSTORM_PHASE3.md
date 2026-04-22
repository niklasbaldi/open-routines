# Open Routines — Phase 3 Brainstorm

**Date**: 2026-04-22
**Objective**: More powerful routines with advanced tools + Quest-Vault integration
**Desired outcome**: Save 2+ hours/week, handle multiple unattended productivity routines

---

## Discovery Context

- **Product**: Open Routines (Phase 1+2 complete)
- **User**: Dominic — support/SE team lead at Voize, uses Obsidian-based Quest-Vault for personal knowledge management
- **Quest-Vault**: Markdown-based knowledge vault at ~/Quest-Vault/ with Context/, Decisions/, Learnings/, Patterns/, personal/, work/ folders. File-based (no API). Uses Obsidian formatting (YAML frontmatter, [[wikilinks]], #tags).
- **Current integrations**: Gmail, Google Calendar via Composio
- **Current limitations**: Routines can only use Composio tools. No file system access. No memory between runs. No multi-step workflows.

---

## Ideation: Three Perspectives

### Product Manager (5 ideas)

**PM-1: Quest-Vault Read/Write Tools**
Give routines direct read/write access to ~/Quest-Vault/. A routine could read your current projects, learnings, and context — then use that knowledge to produce better outputs. E.g., a "Weekly Review" routine reads your work/ folder, summarizes progress, and writes a new entry to Learnings/.

**PM-2: Routine Memory (Cross-Run Context)**
Each routine gets a persistent memory file that carries context between runs. The morning briefing remembers what it told you yesterday and highlights what changed. A weekly review accumulates insights over time. Stored as a JSON/markdown file per routine.

**PM-3: Routine Chains (Output → Input Pipelines)**
Connect routines so one's output feeds the next. E.g., "Inbox Zero" categorizes emails → "Task Creator" creates Quest-Vault entries for action items → "Daily Planner" uses both to produce a priority list. DAG-based, triggered sequentially.

**PM-4: Skills System (Reusable Agent Capabilities)**
Define reusable "skills" — small prompt modules that routines can compose. E.g., a "summarize" skill, a "classify" skill, a "write-to-vault" skill. Routines reference skills by name instead of duplicating prompt logic. Stored as markdown files.

**PM-5: Natural Language Scheduling**
Replace cron expressions entirely. Let users type "every weekday morning" or "after each team meeting" and the system converts to a schedule or event trigger. Reduces the last piece of technical syntax in the UI.

### Product Designer (5 ideas)

**DE-1: Run Output as Daily Dashboard**
Instead of drilling into individual runs, show today's routine outputs on a single dashboard page — morning briefing at top, inbox summary below, calendar review, etc. A personal command center that replaces checking multiple apps.

**DE-2: Conversation-Style Routine Builder**
Replace the form with a chat: "I want to summarize my unread emails every morning and write the highlights to my Quest-Vault." The system generates the prompt, picks integrations, suggests a schedule. One conversation → working routine.

**DE-3: Quick Actions on Run Output**
After viewing a morning briefing, offer inline actions: "Add to Quest-Vault", "Reply to this email", "Block time for this". Turn passive reading into active task management without leaving Open Routines.

**DE-4: Routine Health Dashboard**
Show a simple status grid: which routines ran today, which are upcoming, any failures. Green/amber/red at a glance. A "control room" view for when you have 10+ routines running.

**DE-5: Mobile-Friendly Run Viewer**
The run output (morning briefing) should be readable on a phone. A simplified mobile layout that shows just the final output with expand-for-details. Read your briefing on the commute.

### Software Engineer (5 ideas)

**EN-1: File System Tools (Read/Write/Search Local Files)**
Add built-in tools that let the agent read, write, and search files on the host machine. Scoped to specific directories (e.g., ~/Quest-Vault/) with explicit allowlisting. This enables Quest-Vault integration without any API.

**EN-2: Custom Tool Definitions (User-Defined Functions)**
Let users define custom tools as JavaScript/TypeScript functions that the agent can call. E.g., a tool that queries a local SQLite database, or one that calls an internal API. Stored in a `tools/` directory, auto-loaded at runtime.

**EN-3: Multi-Model Routing Per Step**
Use a cheap model (Haiku/GPT-4o-mini) for tool-calling steps and a capable model (Sonnet/GPT-4o) for the final synthesis. Cuts cost 60-80% on tool-heavy routines without sacrificing output quality.

**EN-4: Run Diff (What Changed Since Last Run)**
For recurring routines, compute a diff between this run's output and the previous one. Highlight what's new, what changed, what was resolved. Turns a static briefing into an incremental update.

**EN-5: Agent Loop with Planning Step**
Before executing tools, the agent writes a plan ("I will: 1. Check calendar, 2. Check email, 3. Synthesize"). The plan is shown in the UI immediately, giving the user instant feedback while tools execute. Reduces the "what is it doing?" anxiety.

---

## Top 5 Prioritized Ideas

### 1. Quest-Vault File Tools (EN-1 + PM-1)

**Name**: Quest-Vault Integration via File System Tools
**Description**: Give routines read/write/search access to ~/Quest-Vault/, enabling AI agents to use your personal knowledge base as context and write back insights.

**Why selected**: This is the direct path to the stated objective — "integrate with Quest-Vault." File system tools are generic (useful beyond Quest-Vault) and technically straightforward (Node.js fs module). Unlocks an entire category of routines: weekly reviews that write learnings, daily planners that read your projects, meeting prep that pulls context from your vault.

**Key assumptions to validate**:
- Dominic trusts the agent to write to his vault (guardrails needed: write-scoped to Quest-Vault only)
- Vault structure is stable enough for the agent to navigate
- Reading vault context meaningfully improves routine output quality

---

### 2. Routine Memory (PM-2)

**Name**: Persistent Run Memory
**Description**: Each routine gets a memory store that persists across runs — so the morning briefing knows what it told you yesterday and highlights what's new.

**Why selected**: Without memory, every run starts from zero. A morning briefing that says "3 new emails since yesterday's briefing" is dramatically more useful than one that lists everything again. This is the difference between a report and an assistant. Low engineering effort (JSON file or DB column per routine).

**Key assumptions to validate**:
- Memory stays useful and doesn't accumulate noise over time
- Memory size stays manageable (need a TTL or rolling window)
- The LLM can effectively use prior-run context to produce better output

---

### 3. Daily Dashboard (DE-1)

**Name**: Today's Outputs Dashboard
**Description**: A single page showing all of today's routine outputs — morning briefing, inbox summary, calendar review — as a personal command center.

**Why selected**: Right now, viewing outputs requires: Dashboard → Routine → Run → scroll. For a daily-use tool, the most recent outputs should be one click away. This becomes the actual "home page" once you have 3+ routines. Saves 30+ seconds per visit, compounds to hours/week.

**Key assumptions to validate**:
- Dominic runs 3+ routines daily (otherwise the dashboard is sparse)
- A unified view is more useful than per-routine views
- Output formatting works well in a stacked card layout

---

### 4. Run Diff (EN-4)

**Name**: Incremental Run Diffs
**Description**: For recurring routines, highlight what changed since the last run instead of repeating everything.

**Why selected**: A weekly calendar review that says "2 new meetings added since last week" is 10x more scannable than a full repeat. This directly saves time — you read only what's new. Works especially well with Quest-Vault (new entries, modified files).

**Key assumptions to validate**:
- LLM can produce consistent enough output to compute meaningful diffs
- Text diffing at the semantic level (not character level) is achievable
- Users prefer diffs over full reports (some may want both)

---

### 5. Agent Planning Step (EN-5)

**Name**: Visible Agent Plan
**Description**: Before executing tools, the agent writes a brief plan shown instantly in the UI while tools run in the background.

**Why selected**: Addresses the "what is it doing?" anxiety identified in the critique. When you click "Run Now" and wait 30-40 seconds, seeing "Plan: 1. Check calendar 2. Check email 3. Summarize" within 2 seconds provides instant confidence. Low effort — just a system prompt addition and UI display.

**Key assumptions to validate**:
- Adding a planning step doesn't significantly increase token cost or latency
- Plans are accurate enough to be trustworthy (not hallucinated steps)
- The UI can display the plan before the full run completes

---

## Recommended Build Order

1. **Quest-Vault File Tools** — unlocks the integration objective
2. **Routine Memory** — makes recurring routines dramatically better
3. **Daily Dashboard** — changes the daily UX from "drill-down" to "glance"
4. **Agent Planning Step** — quick win for perceived performance
5. **Run Diff** — polish for power users with many recurring routines
