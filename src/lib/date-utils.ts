/**
 * Check if an episode is recent (within specified months threshold)
 * @param airDate - The episode air date
 * @param monthsThreshold - Number of months to consider recent (default: 6)
 * @returns true if the episode aired within the threshold
 */
export function isRecentEpisode(airDate: string | null, monthsThreshold: number = 6): boolean {
  if (!airDate) return false;

  const now = new Date();
  const airDateTime = new Date(airDate);
  const monthsDiff = (now.getFullYear() - airDateTime.getFullYear()) * 12
    + (now.getMonth() - airDateTime.getMonth());

  return monthsDiff <= monthsThreshold;
}
