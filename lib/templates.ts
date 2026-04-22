export interface RoutineTemplate {
  name: string;
  description: string;
  prompt: string;
  modelProvider: string;
  modelName: string;
  integrations: string[];
  cronSchedule: string | null;
  maxSteps: number;
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
];
