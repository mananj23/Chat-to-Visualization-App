import React from 'react';

export default function ChatPanel({ history = [], onSelect }){
  return (
    <div>
      <h3>History</h3>
      <div style={{maxHeight:'70vh', overflow:'auto'}}>
        {history.map(item => (
          <div key={item.id} className="history-item">
            <div><strong>Q:</strong> {item.question}</div>
            {item.answer ? (
              <>
                <div style={{marginTop:6}}><strong>A:</strong> {item.answer.text}</div>
                <div style={{marginTop:6}}>
                  <button onClick={()=> onSelect(item.answer)}>Show visualization</button>
                </div>
              </>
            ) : <div className="small-muted">Processing…</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
