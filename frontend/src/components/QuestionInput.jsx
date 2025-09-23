import React, { useState } from 'react';

export default function QuestionInput({ apiBase }){
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(){
    if(!text.trim()) return;
    setLoading(true);
    try {
      await fetch(`${apiBase}/api/questions`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: 'u1', question: text })
      });
      setText('');
    } catch (e) {
      alert('Failed to send: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{marginBottom:12}}>
      <textarea rows={3} value={text} onChange={e=>setText(e.target.value)} placeholder="Ask a scientific question..."/>
      <div style={{marginTop:8, display:'flex', gap:8}}>
        <button onClick={send} disabled={loading}>{loading ? 'Sending...' : 'Ask'}</button>
      </div>
    </div>
  );
}
