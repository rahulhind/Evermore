/**
 * Business signals for Spectra session replay.
 *
 * Pushed onto window.spectraQ rather than called on window.Spectra directly:
 * the recorder is loaded with `async`, so it may not be there yet when a
 * signal happens, and the queue drains in order whenever it does arrive. If
 * the bundle never loads at all — a content blocker, a visitor who went
 * offline — the pushes land in a plain array and nothing throws.
 *
 * Names are the contract: the trigger rules in the Spectra dashboard match on
 * them, so renaming one here silently stops its rule from firing.
 */
export const track = (name, props) => {
  window.spectraQ = window.spectraQ || [];
  window.spectraQ.push(["track", name, props]);
};
