import React, { useEffect, useState } from 'react';
import QuestionInput from './components/QuestionInput';
import ChatPanel from './components/ChatPanel';
import VisualizationCanvas from './components/VisualizationCanvas';
import Controls from './components/Controls';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function App(){
  const [history, setHistory] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    async function fetchHistory(){
      const r = await fetch(`${API_BASE}/api/questions`);
      const data = await r.json();
      setHistory(data.reverse ? data.reverse() : data);
      // select first answer that exists
      const firstWithAnswer = (data.find(d => d.answer) || {}).answer;
      if(firstWithAnswer) setSelectedAnswer(firstWithAnswer);
    }
    fetchHistory();

    const es = new EventSource(`${API_BASE}/api/stream`);
    es.addEventListener('question_created', e => {
      const q = JSON.parse(e.data);
      setHistory(h => [q, ...h]);
    });
    es.addEventListener('answer_created', e => {
      const a = JSON.parse(e.data);
      setHistory(h => {
        // attach answer to question
        const idx = h.findIndex(x => x.id === a.questionId);
        if(idx === -1) return h;
        const copy = [...h];
        copy[idx] = { ...copy[idx], answer: a };
        return copy;
      });
      setSelectedAnswer(a);
    });

    return () => es.close();
  }, []);

  return (
    <div className="layout">
      <div className="left">
        <VisualizationCanvas spec={selectedAnswer?.visualization} />
        <Controls />
      </div>
      <div className="right">
        <h2>AIPrep — Chat + Visualization</h2>
        <QuestionInput apiBase={API_BASE}/>
        <ChatPanel history={history} onSelect={ans => setSelectedAnswer(ans)} />
      </div>
    </div>
  );
}
