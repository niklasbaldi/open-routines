export interface RoutineTemplate {
  name: string;
  description: string;
  prompt: string;
  modelProvider: string;
  modelName: string;
  integrations: string[];
  cronSchedule: string | null;
  maxSteps: number;
  enableVault?: boolean;
  enableQuestTasks?: boolean;
}

export const TEMPLATES: RoutineTemplate[] = [
  {
    name: "Morning Briefing",
    description: "Daily calendar + email summary to start your day",
    prompt: `Check my Google Calendar for today's events and my Gmail inbox for unread emails from the last 12 hours.

Write a concise morning briefing:
1. Today's schedule — meetings with time, attendees, and prep notes
2. Important emails that need a response today
3. Any conflicts or double-bookings
4. A suggested priority order for the day

Keep it under 500 words. Be direct and actionable.
IMPORTANT: Only READ data. Do not send emails, create events, or modify anything.`,
    modelProvider: "anthropic",
    modelName: "claude-sonnet-4-6",
    integrations: ["gmail", "googlecalendar"],
    cronSchedule: "0 7 * * 1-5",
    maxSteps: 15,
  },
  {
    name: "Weekly Calendar Review",
    description: "Upcoming week overview every Sunday evening",
    prompt: `Check my Google Calendar for all events in the next 7 days.

Write a weekly overview:
1. Day-by-day breakdown of meetings and events
2. Total meeting hours per day
3. Busiest day and lightest day
4. Any scheduling conflicts
5. Blocks of free time that could be used for deep work

IMPORTANT: Only READ data. Do not modify anything.`,
    modelProvider: "anthropic",
    modelName: "claude-sonnet-4-6",
    integrations: ["googlecalendar"],
    cronSchedule: "0 18 * * 0",
    maxSteps: 10,
  },
  {
    name: "Email Inbox Zero",
    description: "Categorize and summarize unread emails",
    prompt: `Check my Gmail inbox for all unread emails.

For each email:
1. Categorize it: Action Required, FYI, Newsletter, Promotional, Spam
2. Write a one-line summary
3. If action required, suggest the next step

Group emails by category. Start with Action Required.
End with a count: X action required, Y FYI, Z to archive.

IMPORTANT: Only READ emails. Do not send, reply, forward, or delete anything.`,
    modelProvider: "anthropic",
    modelName: "claude-sonnet-4-6",
    integrations: ["gmail"],
    cronSchedule: "0 9 * * 1-5",
    maxSteps: 15,
  },
  {
    name: "Meeting Prep",
    description: "On-demand briefing before your next meeting",
    prompt: `Check my Google Calendar for the next upcoming meeting (the soonest one that hasn't started yet).

For that meeting, provide:
1. Meeting title, time, and attendees
2. Check my Gmail for any recent emails from or about the attendees (last 7 days)
3. Summarize any relevant email threads
4. Suggest 3 talking points or questions based on the context

IMPORTANT: Only READ data. Do not modify anything.`,
    modelProvider: "anthropic",
    modelName: "claude-sonnet-4-6",
    integrations: ["gmail", "googlecalendar"],
    cronSchedule: null,
    maxSteps: 20,
  },
  {
    name: "End of Day Recap",
    description: "Daily summary of what happened today",
    prompt: `Check my Google Calendar for today's completed events and my Gmail for emails sent and received today.

Write an end-of-day recap:
1. Meetings attended today (with a one-line note on each)
2. Important emails sent/received
3. Any follow-ups needed tomorrow
4. Calendar preview for tomorrow

Keep it concise. Focus on what matters.
IMPORTANT: Only READ data. Do not modify anything.`,
    modelProvider: "anthropic",
    modelName: "claude-sonnet-4-6",
    integrations: ["gmail", "googlecalendar"],
    cronSchedule: "0 17 * * 1-5",
    maxSteps: 15,
  },
  {
    name: "Weekend Planner",
    description: "Saturday morning overview of weekend plans",
    prompt: `Check my Google Calendar for Saturday and Sunday events.

Write a weekend overview:
1. Scheduled events and commitments
2. Free time blocks
3. Any prep needed (reservations, travel, etc.)

Keep it brief and friendly.
IMPORTANT: Only READ data. Do not modify anything.`,
    modelProvider: "anthropic",
    modelName: "claude-sonnet-4-6",
    integrations: ["googlecalendar"],
    cronSchedule: "0 8 * * 6",
    maxSteps: 10,
  },
  {
    name: "Daily Migration Prep",
    description: "Bullet journal-style morning scan — tasks, calendar, email, habits",
    prompt: `You prepare context for a morning migration review — the bullet journal practice of processing open items before starting the day.

**Step 1 — Read vault context.** These files tell you who you're writing for:
- "Context/About Me.md"
- "Context/Preferences.md"
- "Context/Projects.md"
- "Learnings/Reflections.md" — if last night's reflection connects to today, reference it.

**Step 2 — Scan the day.** READ ONLY — do not create, modify, or send anything:
- quest_list_tasks: overdue and today's tasks
- quest_list_habits: today's habit status
- quest_get_gamification: streak, XP, level
- Google Calendar: today's events
- Gmail: unread emails from the last 12 hours (only flag those needing action)

**Step 3 — Write the brief.** Output this exact structure, nothing else:

## Context
3 bullets max. Calendar, email, streak — only what's actionable or time-sensitive.

## Focus
3 items max. For each: what to do and why it matters today. For overdue tasks: migrate, schedule, or cancel — be decisive.

## Habits
Which are due. Streak status if active. One line each.

Rules — these are strict, not guidelines:
- MAXIMUM 100 words total. Every word must earn its place.
- No title, no date header, no preamble — the UI provides framing.
- No emoji. None. Zero.
- No encouragement, no metaphors, no motivational filler.
- No "you've got this", "just show up", "one stone two birds".
- Tone: terse, factual, direct. Like a well-written sticky note.
- Bullet points only. No prose paragraphs.
- IMPORTANT: Only READ data. Do not create tasks, send emails, or modify anything.`,
    modelProvider: "anthropic",
    modelName: "claude-sonnet-4-6",
    integrations: ["gmail", "googlecalendar"],
    cronSchedule: "0 7 * * 1-5",
    maxSteps: 15,
    enableVault: true,
    enableQuestTasks: true,
  },
  {
    name: "Evening Review",
    description: "Close-of-day reflection — what got done, what carried, coaching signal",
    prompt: `You are reviewing the day for someone you know well and genuinely care about. This is an evening check-in — not a performance review.

**Step 1 — Know them.** Read vault context:
- "Context/About Me.md", "Context/Preferences.md", "Context/Projects.md"
- "Learnings/Reflections.md" — their most recent reflection. If they just wrote one tonight, read it and respond to what they said.

**Step 2 — Check the day.** READ ONLY:
- quest_get_day_summary: today's stats
- quest_list_tasks with status "completed" + today's dueDate
- quest_list_tasks with status "planned" or "in-progress"
- Google Calendar: what happened today
- Gmail: anything notable

**Step 3 — Write.** Respond to their reflection if they wrote one. Otherwise, summarize the day.

## Done
- What actually happened today — be specific, mention tasks/events by name
- Keep it factual and brief, not celebratory

## Carried
- What's still open. How many days has it been sitting there?
- If something has been carried 3+ days, gently call it out

## Signal
- One honest observation. Not a lecture — a thought from a friend.
- If they reflected on something, connect to it. If not, notice a pattern.

Rules:
- Under 120 words. No preamble, no sign-offs.
- Write like you're texting a close friend who asked "how'd my day go?" — casual, direct, warm
- No productivity jargon. No "your bullet journal philosophy demands" type language.
- No motivational quotes. No life advice unless they asked.
- IMPORTANT: Only READ data. Do not create tasks, send emails, or modify anything.`,
    modelProvider: "anthropic",
    modelName: "claude-sonnet-4-6",
    integrations: ["gmail", "googlecalendar"],
    cronSchedule: null,
    maxSteps: 15,
    enableVault: true,
    enableQuestTasks: true,
  },
];
