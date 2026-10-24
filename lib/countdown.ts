/** Jours restants avant le 25 décembre, à l'heure de Paris. 0 le jour même. */
export function daysUntilChristmas(now: Date = new Date()): number {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);

  const today = Date.UTC(year, month - 1, day);
  let christmas = Date.UTC(year, 11, 25);
  if (today > christmas) christmas = Date.UTC(year + 1, 11, 25);
  return Math.round((christmas - today) / 86_400_000);
}
