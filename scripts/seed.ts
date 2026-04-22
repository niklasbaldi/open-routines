import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { routines } from "../lib/db/schema";

const prompt = `You are a personal assistant creating a morning briefing.

Do the following:
1. Check my Google Calendar for today's events
2. Check my Gmail inbox for unread emails from the last 12 hours
3. Write a concise morning briefing with:
   - Today's schedule (meetings with time and attendees)
   - Important emails that need attention
   - Any conflicts or double-bookings
   - A suggested priority order for the day

Keep the briefing under 500 words. Be direct and actionable.

IMPORTANT: Only READ data. Do not send emails, create events, or modify anything.`;

async function seed() {
  const pool = new Pool({
    connectionString: "postgres://localhost:5432/open_routines",
  });
  const db = drizzle(pool);

  await db.insert(routines).values({
    name: "Morning Briefing",
    prompt,
    modelProvider: "anthropic",
    modelName: "claude-sonnet-4-6",
    integrations: ["gmail", "googlecalendar"],
    cronSchedule: "0 7 * * 1-5",
    maxSteps: 15,
  });

  console.log("Seeded: Morning Briefing routine");
  await pool.end();
}

seed().catch(console.error);
