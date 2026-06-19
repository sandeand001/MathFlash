<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { data, activeProfile } from '$lib/stores/appState.js';
  import { setSoundEnabled } from '$lib/audio.js';
  import { setHapticsEnabled } from '$lib/haptics.js';

  let { children } = $props();

  // Keep audio/haptics in sync with active profile preference.
  $effect(() => {
    const enabled = $activeProfile?.soundEnabled ?? true;
    setSoundEnabled(enabled);
    setHapticsEnabled(enabled);
  });

  // Cold-launch routing logic: if no profile, go to profiles screen.
  // If multiple profiles AND > 12h since last active, show picker.
  onMount(() => {
    if (!browser) return;
    const d = $data;
    const path = $page.url.pathname;
    const isOnProfiles = path.includes('/profiles');

    const profileIds = Object.keys(d.profiles);
    if (profileIds.length === 0) {
      if (!isOnProfiles) goto(`${base}/profiles`);
      return;
    }

    const active = d.activeProfileId ? d.profiles[d.activeProfileId] : null;
    if (!active) {
      if (!isOnProfiles) goto(`${base}/profiles`);
      return;
    }

    const TWELVE_H = 12 * 60 * 60 * 1000;
    const idle = Date.now() - (active.lastActiveAt || 0);
    if (profileIds.length > 1 && idle > TWELVE_H && !isOnProfiles) {
      goto(`${base}/profiles`);
    }
  });
</script>

<div class="app-shell">
  {@render children()}
</div>
