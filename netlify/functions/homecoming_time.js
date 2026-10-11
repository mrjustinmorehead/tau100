// Refreshes on page requests; no scheduled rebuild or credentials required.
const SOURCE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=20261031&groups=80&limit=1000';
function resolveTime(data) {
  const event = (data.events || []).find(e => {
    const teams = e.competitions?.[0]?.competitors || [];
    return teams.some(t => t.team?.id === '97') && teams.some(t => t.team?.id === '24');
  });
  const game = event?.competitions?.[0];
  if (game?.timeValid !== true) return { kickoff: null, tailgate: null };
  const kickoff = new Date(game.date || event.date);
  if (!Number.isFinite(kickoff.getTime()) || kickoff.toLocaleDateString('en-CA', {timeZone:'America/New_York'}) !== '2026-10-31') return { kickoff: null, tailgate: null };
  return { kickoff: kickoff.toISOString(), tailgate: new Date(kickoff.getTime() - 3*60*60*1000).toISOString() };
}
exports.resolveTime = resolveTime;
exports.handler = async () => {
  let times = {kickoff:null, tailgate:null};
  try {
    const response = await fetch(SOURCE, {signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error('Schedule unavailable');
    times = resolveTime(await response.json());
  } catch (_) { /* Keep TBD rather than show a guessed time. */ }
  return {statusCode:200, headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=300'}, body:JSON.stringify(times)};
};
