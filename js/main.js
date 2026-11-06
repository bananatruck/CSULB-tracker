/* Entry point: runs after every view has registered. */
(function () {
  const CT = window.CT;
  CT.renderAll();
  if (!CT.storageOk()) CT.say('Your browser blocked local storage, so progress will not be saved. Use Export to keep it.');
})();
