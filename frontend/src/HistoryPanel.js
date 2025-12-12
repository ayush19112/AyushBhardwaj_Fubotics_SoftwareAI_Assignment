// frontend/src/HistoryPanel.js
import React, { useEffect, useState } from 'react';
import { fetchHistory } from './api';

export default function HistoryPanel({ refreshTrigger }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (err) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    
  }, [refreshTrigger]); // parent can change refreshTrigger to reload

  if (loading) return <div className="historyPanel">Loading saved history...</div>;
  if (error) return <div className="historyPanel error">Error loading history: {error}</div>;
  if (!history || history.length === 0) return <div className="historyPanel">No saved messages yet.</div>;

  return (
    <div className="historyPanel">
      <h3>Saved Chat History</h3>
      <div className="historyList">
        {history.map(msg => (
          <div key={msg.id} className={`historyItem ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div className="historyText">{msg.text}</div>
            <div className="historyMeta">{msg.role} • {new Date(msg.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
