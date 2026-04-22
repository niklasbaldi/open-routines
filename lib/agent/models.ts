import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

const providers: Record<string, (model: string) => ReturnType<typeof anthropic>> = {
  anthropic: (model: string) => anthropic(model),
  openai: (model: string) => openai(model) as ReturnType<typeof anthropic>,
};

const pricing: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 0.8, output: 4 },
  "claude-opus-4-6": { input: 15, output: 75 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export function getModel(provider: string, modelName: string) {
  const factory = providers[provider];
  if (!factory) throw new Error(`Unknown provider: ${provider}`);
  return factory(modelName);
}

export function estimateCost(
  modelName: string,
  usage: { inputTokens?: number; outputTokens?: number }
): number {
  const price = pricing[modelName] ?? { input: 3, output: 15 };
  const input = usage.inputTokens ?? 0;
  const output = usage.outputTokens ?? 0;
  return (input * price.input + output * price.output) / 1_000_000;
}

export const AVAILABLE_MODELS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-6"],
  openai: ["gpt-4o", "gpt-4o-mini"],
};
