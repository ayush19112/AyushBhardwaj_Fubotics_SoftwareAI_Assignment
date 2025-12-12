// frontend/src/api.js
// Robust base URL for dev and production:
// - If REACT_APP_API_URL is set -> use it (good for explicit deploy setups)
// - Else if running on localhost (dev) -> use local backend at http://localhost:4000
// - Else (deployed) -> use relative paths so calls go to same origin ('' -> '/history', '/message')
const envUrl = process.env.REACT_APP_API_URL;
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const BASE_URL = envUrl || (isLocalhost ? 'http://localhost:4000' : ''); // '' means same origin

async function handleResponse(res) {
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const err = await res.json().catch(()=>({error:'unknown'}));
      throw new Error(err?.error || JSON.stringify(err));
    } else {
      const txt = await res.text().catch(()=>res.statusText);
      throw new Error(txt || `HTTP ${res.status}`);
    }
  }
  return res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${BASE_URL}/history`);
  return handleResponse(res);
}

export async function sendMessage(text) {
  const res = await fetch(`${BASE_URL}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return handleResponse(res);
}
