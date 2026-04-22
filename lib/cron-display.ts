export function cronToHuman(cron: string): string {
  const presets: Record<string, string> = {
    "0 * * * *": "Every hour",
    "0 7 * * *": "Daily at 7:00 AM",
    "0 8 * * *": "Daily at 8:00 AM",
    "0 9 * * *": "Daily at 9:00 AM",
    "0 17 * * *": "Daily at 5:00 PM",
    "0 18 * * *": "Daily at 6:00 PM",
    "0 7 * * 1-5": "Weekdays at 7:00 AM",
    "0 8 * * 1-5": "Weekdays at 8:00 AM",
    "0 9 * * 1-5": "Weekdays at 9:00 AM",
    "0 17 * * 1-5": "Weekdays at 5:00 PM",
    "0 9 * * 1": "Mondays at 9:00 AM",
    "0 8 * * 6": "Saturdays at 8:00 AM",
    "0 18 * * 0": "Sundays at 6:00 PM",
  };
  return presets[cron] ?? cron;
}
