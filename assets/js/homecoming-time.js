(async function () {
  try {
    const response = await fetch('/.netlify/functions/homecoming_time');
    if (!response.ok) return;
    const data = await response.json();
    if (!data.kickoff || !data.tailgate) return;
    const format = value => new Date(value).toLocaleTimeString('en-US', {timeZone:'America/New_York', hour:'numeric', minute:'2-digit'});
    document.getElementById('kickoffTime').textContent = `Kickoff: ${format(data.kickoff)} Eastern`;
    document.getElementById('tailgateTime').textContent = `Tailgate starts: ${format(data.tailgate)} Eastern • Three hours before kickoff`;
  } catch (_) { /* Existing TBD copy stays visible. */ }
})();
