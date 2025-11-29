// Installs a simple fetch proxy that enqueues non-GET requests while offline
import { enqueueRequest } from './offlineQueue';

export function installFetchProxy({ queueOnlyFor = [] } = {}) {
  if (typeof window === 'undefined') return;
  if (window.__fetchProxyInstalled) return;
  const originalFetch = window.fetch.bind(window);
  window.__originalFetch = originalFetch;

  window.fetch = async (input, init = {}) => {
    try {
      const req = new Request(input, init);
      const method = (req.method || 'GET').toUpperCase();
      const url = typeof input === 'string' ? input : req.url;

      // If online, perform normal fetch
      if (navigator.onLine) {
        return originalFetch(input, init);
      }

      // If offline and it's a GET, let service worker cache handle it or fail
      if (method === 'GET' || method === 'HEAD') {
        return Promise.reject(new TypeError('NetworkError when attempting to fetch resource. Offline.'));
      }

      // If queueOnlyFor provided, only queue requests matching those substrings; otherwise queue all non-GETs
      if (Array.isArray(queueOnlyFor) && queueOnlyFor.length) {
        const shouldQueue = queueOnlyFor.some(s => url.includes(s));
        if (!shouldQueue) {
          return Promise.reject(new TypeError('NetworkError: offline and request not queued'));
        }
      }

      // Read body if possible
      let bodyText = null;
      try {
        if (init && init.body) {
          if (typeof init.body === 'string') bodyText = init.body;
          else if (init.body instanceof URLSearchParams) bodyText = init.body.toString();
          else if (init.body instanceof FormData) {
            const obj = {};
            init.body.forEach((v, k) => { obj[k] = v; });
            bodyText = JSON.stringify(obj);
          } else if (init.body instanceof Blob || init.body instanceof ArrayBuffer) {
            bodyText = '<binary>'; // don't attempt to store binary
          } else {
            try { bodyText = JSON.stringify(init.body); } catch(e) { bodyText = String(init.body); }
          }
        }
      } catch (e) {
        bodyText = '<unreadable>';
      }

      // enqueue the request
      const queued = enqueueRequest({ url, init: { method, headers: init.headers || {}, body: bodyText } });
      // Respond with a synthetic Response that indicates queued
      const body = JSON.stringify({ queued: true, id: queued.id });
      const resp = new Response(body, { status: 202, headers: { 'Content-Type': 'application/json' } });
      return resp;
    } catch (e) {
      return Promise.reject(e);
    }
  };

  window.__fetchProxyInstalled = true;
}

export default installFetchProxy;
