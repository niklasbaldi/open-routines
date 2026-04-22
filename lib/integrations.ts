export const INTEGRATION_DISPLAY: Record<string, string> = {
  gmail: "Gmail",
  googlecalendar: "Google Calendar",
  slack: "Slack",
  github: "GitHub",
  notion: "Notion",
};

export function integrationLabel(slug: string): string {
  return INTEGRATION_DISPLAY[slug] ?? slug;
}
