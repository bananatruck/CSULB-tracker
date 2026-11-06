/* Setup controls: other units, export, import, reset. */
(function () {
  const CT = window.CT;
  const { L, S, $, save, say, sanitize, setState } = CT;

  const units = $('#otherUnits');
  units.value = S.otherUnits;
  units.addEventListener('input', (e) => {
    S.otherUnits = Math.min(120, Math.max(0, Math.round(Number(e.target.value) || 0)));
    save();
    CT.renderAll();
  });
  document.addEventListener('ct:reset', () => { units.value = S.otherUnits; });

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'CSULB-tracker', version: 1, catalog: '2023-2024', state: S }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'csulb-tracker-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say('Progress exported.');
  });

  $('#importFile').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(rd.result);
        setState(sanitize(j && j.state ? j.state : j));
        CT.renderAll();
        say('Imported ' + (Object.keys(S.done).length + S.ip.length) + ' courses.');
      } catch (err) { say('That file is not a CSULB-tracker export.'); }
      e.target.value = '';
    };
    rd.readAsText(f);
  });

  // Reset needs a second click, because the viewer cannot rely on confirm() dialogs.
  let armed = false;
  $('#resetBtn').addEventListener('click', (e) => {
    const btn = e.target;
    if (!armed) {
      armed = true;
      btn.textContent = 'Click again to erase';
      say('This clears every course, your track and your units.');
      setTimeout(() => { armed = false; btn.textContent = 'Reset'; }, 4000);
      return;
    }
    armed = false;
    btn.textContent = 'Reset';
    setState(L.emptyState());
    CT.renderAll();
    say('Progress cleared.');
  });
})();
