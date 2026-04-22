import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { ollama } from "ollama-ai-provider";

type ModelFactory = (model: string) => ReturnType<typeof anthropic>;

const providers: Record<string, ModelFactory> = {
  anthropic: (model: string) => anthropic(model),
  openai: (model: string) => openai(model) as ReturnType<typeof anthropic>,
  ollama: (model: string) => ollama(model) as unknown as ReturnType<typeof anthropic>,
};

// Per-million-token pricing (USD)
const pricing: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 0.8, output: 4 },
  "claude-opus-4-6": { input: 15, output: 75 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  // Ollama models are free (local)
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
  const price = pricing[modelName];
  if (!price) return 0; // Ollama / unknown models = free
  const input = usage.inputTokens ?? 0;
  const output = usage.outputTokens ?? 0;
  return (input * price.input + output * price.output) / 1_000_000;
}

export const AVAILABLE_MODELS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-6"],
  openai: ["gpt-4o", "gpt-4o-mini"],
  ollama: ["llama3.1", "llama3.2", "mistral", "qwen2.5", "gemma2"],
};
