import { savePreference } from '../preferences.js';

export function initAtmosphereSettings() {
  const root = document.documentElement;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const controls = {
    rain: document.getElementById('rain-density'),
    meteors: document.getElementById('meteor-rate'),
    fog: document.getElementById('fog-enabled'),
    rainEnabled: document.getElementById('rain-enabled'),
    meteorsEnabled: document.getElementById('meteors-enabled'),
    pointer: document.getElementById('pointer-enabled'),
    sceneMotion: document.getElementById('scene-motion-enabled'),
    narrative: document.getElementById('narrative-enabled')
  };
  const settings = {
    rain: 50,
    meteors: 50,
    fog: root.dataset.fog !== 'off',
    rainEnabled: root.dataset.rain !== 'off',
    meteorsEnabled: root.dataset.meteors !== 'off',
    pointer: root.dataset.pointer !== 'off',
    sceneMotion: root.dataset.sceneMotion !== 'off',
    narrative: root.dataset.narrative !== 'off'
  };
  const toggleKeys = {
    fog: 'fog',
    rainEnabled: 'rain-enabled',
    meteorsEnabled: 'meteors-enabled',
    pointer: 'pointer',
    sceneMotion: 'scene-motion',
    narrative: 'narrative'
  };
  function setToggle(key, enabled, persist) {
    settings[key] = enabled;
    if (controls[key]) controls[key].checked = enabled;
    root.dataset[
      key === 'sceneMotion' ? key : toggleKeys[key].replace('-enabled', '')
    ] = enabled ? 'on' : 'off';
    if (persist) {
      savePreference(`mathrix-${toggleKeys[key]}`, enabled ? 'on' : 'off');
    }
  }
  function setRange(key, value, persist) {
    settings[key] = value;
    if (controls[key]) controls[key].value = String(value);
    const output = document.getElementById(
      key === 'rain' ? 'rain-value' : 'meteor-value'
    );
    if (output) output.value = `${value}%`;
    if (persist) {
      savePreference(`mathrix-${key}`, String(value));
    }
  }

  for (const [key, input] of Object.entries(controls)) {
    if (!input) continue;
    if (key in toggleKeys) {
      let enabled = settings[key];
      try {
        enabled = localStorage.getItem(`mathrix-${toggleKeys[key]}`) !== 'off';
      } catch (_) {
        /* Storage is optional. */
      }
      setToggle(key, enabled, false);
      input.addEventListener('change', () => {
        setToggle(key, input.checked, true);
        window.dispatchEvent(new Event('mathrix-motionchange'));
      });
      continue;
    }
    try {
      const saved = localStorage.getItem(`mathrix-${key}`);
      if (saved !== null && Number.isFinite(Number(saved)))
        settings[key] = clamp(Number(saved), 0, 100);
    } catch (_) {
      /* Preferences remain available in this session. */
    }
    setRange(key, settings[key], false);
    input.addEventListener('input', () => {
      setRange(key, Number(input.value), true);
    });
  }

  document.getElementById('reset-atmosphere')?.addEventListener('click', () => {
    for (const key of Object.keys(toggleKeys)) setToggle(key, true, true);
    setRange('rain', 50, true);
    setRange('meteors', 50, true);
    window.dispatchEvent(new Event('mathrix-motionchange'));
  });

  return settings;
}
