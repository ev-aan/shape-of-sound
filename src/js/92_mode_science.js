// ---- MODE: SCIENCE (the physics view) ----
// Registering a mode = one file, one call. Show/hide its permanent panel container on enter/exit.
Modes.register('science', {
  label: 'Science',
  panelId: 'scienceControls',
  onEnter(){
    showMode('science');
    document.getElementById('topbarLabel').textContent = 'Science — physics from overtone overlap';
    applyColors(colorMode);
    setRender(renderMode);
    positionLabels();
  },
  onExit(){}
});
