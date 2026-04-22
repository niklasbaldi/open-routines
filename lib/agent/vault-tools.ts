import { tool } from "ai";
import { z } from "zod";
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
} from "fs";
import { join, relative } from "path";

const VAULT_ROOT =
  process.env.QUEST_VAULT_PATH ??
  join(process.env.HOME ?? "", "Quest-Vault");

function resolveSafe(filePath: string): string {
  const resolved = join(VAULT_ROOT, filePath);
  if (!resolved.startsWith(VAULT_ROOT)) {
    throw new Error("Path traversal blocked — must stay within Quest-Vault");
  }
  return resolved;
}

export const vaultTools = {
  vault_read: tool({
    description:
      "Read a file from the Quest-Vault knowledge base. Returns the file content as text. Use relative paths like 'Context/About Me.md'.",
    inputSchema: z.object({
      path: z.string().describe("Relative path within Quest-Vault"),
    }),
    execute: async ({ path }: { path: string }) => {
      const fullPath = resolveSafe(path);
      if (!existsSync(fullPath)) {
        return { error: `File not found: ${path}` };
      }
      return { content: readFileSync(fullPath, "utf-8") };
    },
  }),

  vault_write: tool({
    description:
      "Write or append to a file in the Quest-Vault. Use for saving learnings, decisions, logs, or summaries. Creates parent directories if needed.",
    inputSchema: z.object({
      path: z.string().describe("Relative path within Quest-Vault"),
      content: z.string().describe("Markdown content to write"),
      mode: z
        .enum(["overwrite", "append"])
        .default("append")
        .describe("Whether to overwrite the file or append to it"),
    }),
    execute: async ({
      path,
      content,
      mode,
    }: {
      path: string;
      content: string;
      mode: string;
    }) => {
      const fullPath = resolveSafe(path);
      const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      if (mode === "append" && existsSync(fullPath)) {
        const existing = readFileSync(fullPath, "utf-8");
        writeFileSync(fullPath, existing + "\n" + content, "utf-8");
      } else {
        writeFileSync(fullPath, content, "utf-8");
      }
      return { success: true, path };
    },
  }),

  vault_list: tool({
    description:
      "List files and folders in a Quest-Vault directory. Use to discover vault structure before reading specific files.",
    inputSchema: z.object({
      path: z
        .string()
        .default("")
        .describe("Relative directory path (empty for vault root)"),
    }),
    execute: async ({ path }: { path: string }) => {
      const fullPath = resolveSafe(path || "");
      if (!existsSync(fullPath)) {
        return { error: `Directory not found: ${path}` };
      }
      const entries = readdirSync(fullPath).map((name) => {
        const stat = statSync(join(fullPath, name));
        return { name, type: stat.isDirectory() ? "directory" : "file" };
      });
      return { entries };
    },
  }),

  vault_search: tool({
    description:
      "Search Quest-Vault files for a text pattern. Returns matching file paths and line snippets.",
    inputSchema: z.object({
      query: z.string().describe("Text to search for (case-insensitive)"),
      directory: z
        .string()
        .default("")
        .describe("Subdirectory to search within (empty for entire vault)"),
    }),
    execute: async ({
      query,
      directory,
    }: {
      query: string;
      directory: string;
    }) => {
      const searchRoot = resolveSafe(directory || "");
      if (!existsSync(searchRoot)) {
        return { error: `Directory not found: ${directory}` };
      }

      const results: Array<{ file: string; matches: string[] }> = [];
      const pattern = query.toLowerCase();

      function searchDir(dir: string) {
        for (const entry of readdirSync(dir)) {
          if (entry.startsWith(".")) continue;
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            searchDir(fullPath);
          } else if (entry.endsWith(".md")) {
            const content = readFileSync(fullPath, "utf-8");
            const lines = content.split("\n");
            const matchingLines = lines
              .filter((l) => l.toLowerCase().includes(pattern))
              .slice(0, 3)
              .map((l) => l.trim().slice(0, 120));
            if (matchingLines.length > 0) {
              results.push({
                file: relative(VAULT_ROOT, fullPath),
                matches: matchingLines,
              });
            }
          }
        }
      }

      searchDir(searchRoot);
      return { results: results.slice(0, 20) };
    },
  }),
};
