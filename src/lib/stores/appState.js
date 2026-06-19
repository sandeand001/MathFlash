import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { loadAll, saveAll, getActiveProfile } from '$lib/storage.js';

function createDataStore() {
  const initial = browser ? loadAll() : { activeProfileId: null, profiles: {} };
  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set: (v) => { set(v); if (browser) saveAll(v); },
    update: (fn) => update((v) => {
      const next = fn(v);
      if (browser) saveAll(next);
      return next;
    }),
    /** Mutate-in-place then persist + notify subscribers. */
    mutate: (fn) => update((v) => {
      fn(v);
      if (browser) saveAll(v);
      return v;
    }),
    reload: () => { if (browser) set(loadAll()); }
  };
}

export const data = createDataStore();

export const activeProfile = derived(data, ($d) => {
  const p = getActiveProfile($d);
  // Return a shallow clone so Svelte 5 $derived consumers re-run even though
  // we mutate the underlying object in place.
  return p ? { ...p } : null;
});

/** Holds the result of the just-completed drill, for the Results screen. */
export const lastDrillResult = writable(null);

export function getData() { return get(data); }
