// Runs before first paint: enables JS-only styles and restores the motion preference.
document.documentElement.classList.add('js');
try { if (localStorage.getItem('motion') === 'paused') document.documentElement.classList.add('motion-paused'); } catch (e) { /* private mode */ }
