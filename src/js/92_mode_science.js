// ---- MODE: SCIENCE (the physics view) ----
// Registering a mode = one file, one call. Show/hide its permanent panel container on enter/exit.
let sciSpectrumBuilt = false, sciSpectrumBandId = null;
// re-renders the whole surface rather than patching just the caption text in place — this app's
// surfaces are stateless and cheap to redraw, and it avoids attaching a second click listener on
// top of the one wired once below (re-passing opts.onSelect into every render call would do that).
function renderSciSpectrum(){
  const b = SPECTRUM_BANDS.find(x => x.id === sciSpectrumBandId);
  const caption = b ? (b.label + ' — ' + b.unit + (b.tier === 'sense' ? ' — one of the three you can directly sense.' : '.')) : undefined;
  Surfaces.get('spectrum').render(document.getElementById('sciSpectrumChart'), { initialCaption: caption });
}
function selectSpectrumBand(bandId){
  sciSpectrumBandId = bandId;
  renderSciSpectrum();
  if(bandId === 'hear') playFreqs([m2f(69)]); // A4, a familiar reference pitch — the only band here you can actually hear
}
Modes.register('science', {
  label: 'The Science of Sound',
  panelId: 'scienceControls',
  onEnter(){
    showMode('science');
    document.getElementById('topbarLabel').textContent = 'The Science of Sound — physics from overtone overlap';
    applyColors(colorMode);
    setRender(renderMode);
    positionLabels();
    if(!sciSpectrumBuilt){
      renderSciSpectrum();
      document.getElementById('sciSpectrumChart').addEventListener('click', e => {
        const g = e.target.closest && e.target.closest('.specBand');
        if(g) selectSpectrumBand(g.dataset.band);
      });
      sciSpectrumBuilt = true;
    }
  },
  onExit(){}
});
