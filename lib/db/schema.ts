import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  real,
} from "drizzle-orm/pg-core";

export const routines = pgTable("routines", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  modelProvider: text("model_provider").notNull().default("anthropic"),
  modelName: text("model_name").notNull().default("claude-sonnet-4-6"),
  integrations: jsonb("integrations").notNull().default([]),
  cronSchedule: text("cron_schedule"),
  isPaused: boolean("is_paused").notNull().default(false),
  maxSteps: integer("max_steps").notNull().default(25),
  timeoutSeconds: integer("timeout_seconds").notNull().default(300),
  enableVault: boolean("enable_vault").notNull().default(false),
  memoryJson: jsonb("memory_json"),
  notifyOnComplete: text("notify_on_complete"),
  webhookId: text("webhook_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: [
        "queued",
        "running",
        "completed",
        "failed",
        "awaiting_confirmation",
        "cancelled",
      ],
    })
      .notNull()
      .default("queued"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    stepsJson: jsonb("steps_json"),
    outputText: text("output_text"),
    tokenUsage: jsonb("token_usage"),
    costEstimate: real("cost_estimate"),
    error: text("error"),
    previousOutputText: text("previous_output_text"),
    triggeredBy: text("triggered_by", {
      enum: ["manual", "cron", "api", "webhook"],
    })
      .notNull()
      .default("manual"),
  },
  (t) => [
    index("idx_runs_routine").on(t.routineId),
    index("idx_runs_status").on(t.status),
  ]
);

export const pendingConfirmations = pgTable("pending_confirmations", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .notNull()
    .references(() => runs.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  toolArgs: jsonb("tool_args"),
  riskLevel: text("risk_level").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  approved: boolean("approved"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const secrets = pgTable("secrets", {
  id: uuid("id").defaultRandom().primaryKey(),
  keyName: text("key_name").unique().notNull(),
  encryptedValue: text("encrypted_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
