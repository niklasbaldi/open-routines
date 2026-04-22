import { tool } from "ai";
import { z } from "zod";

const QUEST_TASKS_URL =
  process.env.QUEST_TASKS_URL ?? "http://localhost:3001";
const QUEST_TASKS_API_KEY = process.env.QUEST_TASKS_API_KEY ?? "";

async function questFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${QUEST_TASKS_URL}/api/integration${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${QUEST_TASKS_API_KEY}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `Quest-Tasks API error (${res.status}): ${body}` };
  }

  return res.json();
}

export const questTools = {
  quest_list_tasks: tool({
    description:
      "List tasks from Quest-Tasks. Can filter by status (planned, in-progress, completed, scheduled, migrated, cancelled), mode (work, personal), and dueDate (YYYY-MM-DD).",
    inputSchema: z.object({
      status: z
        .enum([
          "planned",
          "in-progress",
          "completed",
          "scheduled",
          "migrated",
          "cancelled",
        ])
        .optional()
        .describe("Filter by task status"),
      mode: z
        .enum(["work", "personal"])
        .optional()
        .describe("Filter by work/personal mode"),
      dueDate: z
        .string()
        .optional()
        .describe("Filter by due date (YYYY-MM-DD)"),
    }),
    execute: async ({
      status,
      mode,
      dueDate,
    }: {
      status?: string;
      mode?: string;
      dueDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (mode) params.set("mode", mode);
      if (dueDate) params.set("dueDate", dueDate);
      const qs = params.toString();
      return questFetch(`/tasks${qs ? `?${qs}` : ""}`);
    },
  }),

  quest_get_task: tool({
    description:
      "Get a single task by ID from Quest-Tasks, including its subtasks and linked goal.",
    inputSchema: z.object({
      taskId: z.string().describe("The task ID"),
    }),
    execute: async ({ taskId }: { taskId: string }) => {
      return questFetch(`/tasks/${taskId}`);
    },
  }),

  quest_create_task: tool({
    description:
      "Create a new task in Quest-Tasks. The task will appear in the user's task list with status 'planned'.",
    inputSchema: z.object({
      title: z.string().describe("Task title"),
      description: z
        .string()
        .optional()
        .describe("Task description or notes"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("Task priority"),
      label: z
        .enum(["health", "career", "relationships", "personal", "finance"])
        .optional()
        .describe("Task category label"),
      dueDate: z
        .string()
        .optional()
        .describe("Due date (YYYY-MM-DD)"),
      mode: z
        .enum(["work", "personal"])
        .optional()
        .describe("Work or personal mode"),
    }),
    execute: async (args: {
      title: string;
      description?: string;
      priority?: string;
      label?: string;
      dueDate?: string;
      mode?: string;
    }) => {
      return questFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ ...args, source: "open-routines" }),
      });
    },
  }),

  quest_update_task: tool({
    description:
      "Update an existing task in Quest-Tasks. Can change title, description, status, priority, label, or dueDate.",
    inputSchema: z.object({
      taskId: z.string().describe("The task ID to update"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      status: z
        .enum(["planned", "in-progress", "completed", "cancelled"])
        .optional()
        .describe("New status"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("New priority"),
      dueDate: z.string().optional().describe("New due date (YYYY-MM-DD)"),
    }),
    execute: async ({
      taskId,
      ...updates
    }: {
      taskId: string;
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string;
    }) => {
      return questFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
  }),

  quest_list_goals: tool({
    description:
      "List goals from Quest-Tasks, including their linked tasks and progress percentage. Can filter by type (monthly, weekly).",
    inputSchema: z.object({
      type: z
        .enum(["monthly", "weekly"])
        .optional()
        .describe("Filter by goal type"),
    }),
    execute: async ({ type }: { type?: string }) => {
      const qs = type ? `?type=${type}` : "";
      return questFetch(`/goals${qs}`);
    },
  }),

  quest_list_habits: tool({
    description:
      "List habits from Quest-Tasks with today's completion status. Each habit includes a 'completedToday' boolean.",
    inputSchema: z.object({
      mode: z
        .enum(["work", "personal"])
        .optional()
        .describe("Filter by work/personal mode"),
    }),
    execute: async ({ mode }: { mode?: string }) => {
      const qs = mode ? `?mode=${mode}` : "";
      return questFetch(`/habits${qs}`);
    },
  }),

  quest_get_gamification: tool({
    description:
      "Get the user's gamification stats from Quest-Tasks: XP, level, streak, daily target, and XP progress to next level.",
    inputSchema: z.object({}),
    execute: async () => {
      return questFetch("/gamification");
    },
  }),

  quest_get_day_summary: tool({
    description:
      "Get aggregated day summary — tasks completed/total, habits completed/total, XP earned, streak",
    inputSchema: z.object({
      date: z.string().describe("Date in YYYY-MM-DD format"),
    }),
    execute: async ({ date }: { date: string }) => {
      return questFetch(`/day-summary?date=${date}`);
    },
  }),
};
