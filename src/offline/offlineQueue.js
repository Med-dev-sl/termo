// Simple offline request queue using localStorage
const QUEUE_KEY = 'offline_request_queue';

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writeQueue(q) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch (e) {
    console.warn('Failed to write offline queue', e);
  }
}

export function enqueueRequest(item) {
  const q = readQueue();
  q.push({ id: Date.now() + '-' + Math.random().toString(16).slice(2), ts: Date.now(), item });
  writeQueue(q);
  return q[q.length - 1];
}

export function peekQueue() {
  return readQueue();
}

export function removeFromQueue(id) {
  const q = readQueue().filter(e => e.id !== id);
  writeQueue(q);
}

export async function processQueue() {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;
  const q = readQueue();
  if (!q.length) return;
  const originalFetch = window.__originalFetch || window.fetch;
  for (const entry of q.slice()) {
    const { id, item } = entry;
    try {
      const { url, init } = item;
      // Recreate headers
      const res = await originalFetch(url, init);
      if (res && (res.status >= 200 && res.status < 300)) {
        removeFromQueue(id);
      } else {
        // keep in queue; maybe server error
        console.warn('Queued request failed on replay, will retry later', res && res.status);
      }
    } catch (e) {
      console.warn('Replay failed, will retry later', e);
      // network error; stop processing
      return;
    }
  }
}

// Expose for debugging
export default {
  enqueueRequest,
  peekQueue,
  removeFromQueue,
  processQueue,
};
