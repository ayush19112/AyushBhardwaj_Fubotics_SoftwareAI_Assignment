import React, { useEffect, useState, useRef } from 'react';
import { fetchHistory, sendMessage } from './api';
import HistoryPanel from './HistoryPanel';
import './Chat.css';

export default function App(){
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const messagesRef = useRef();

  useEffect(()=> {
    loadHistory();
  }, []);

  async function loadHistory(){
    try {
      const data = await fetchHistory();
      setMessages(data || []);
      scrollToBottom();
    } catch (err) {
      console.error('loadHistory error', err);
    }
  }

  function scrollToBottom(){
    setTimeout(()=> {
      const el = messagesRef.current;
      if(el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  async function handleSend(e){
    e?.preventDefault();
    if (!text.trim()) return;
    const userText = text.trim();
    setText('');
    setMessages(prev => [...prev, { id: `temp-${Date.now()}`, role: 'user', text: userText, createdAt: new Date().toISOString() }]);
    scrollToBottom();

    setLoading(true);
    try {
      const res = await sendMessage(userText);
      // Use backend history to stay authoritative
      setMessages(res.history || []);
      // trigger HistoryPanel to reload
      setRefreshTrigger(t => t + 1);
      scrollToBottom();
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'ai', text: 'Failed to get AI reply. See console.', createdAt: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="header">
        <div>AI Chat — {`YourName`}</div>
        <div className="small">Saved history on backend</div>
      </div>

      <div className="messages" ref={messagesRef}>
        {messages.map(m => (
          <div key={m.id} className={`message ${m.role === 'user' ? 'user' : 'ai'}`}>
            <div>{m.text}</div>
            <div className="meta">{m.role} • {new Date(m.createdAt || Date.now()).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <form className="inputRow" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>{loading ? '...' : 'Send'}</button>
      </form>

      {/* HISTORY PANEL */}
      <HistoryPanel refreshTrigger={refreshTrigger} />
    </div>
  );
}
