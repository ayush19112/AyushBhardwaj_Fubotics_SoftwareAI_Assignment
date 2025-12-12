export const BASE_URL = 'http://localhost:4000';


export async function fetchHistory() {
  const res = await fetch(`${BASE_URL}/history`);
  if (!res.ok) throw new Error('Could not fetch history');
  return res.json();
}

export async function sendMessage(text) {
  const res = await fetch(`${BASE_URL}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'unknown'}));
    throw new Error(err?.error || 'Send message failed');
  }
  return res.json();
}
