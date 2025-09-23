import React from 'react';
export default function Controls(){
  return (
    <div style={{display:'flex', gap:8}}>
      <button onClick={()=> alert('Feature: export coming soon')}>Export MP4</button>
      <button onClick={()=> alert('Feature: share coming soon')}>Share</button>
    </div>
  );
}
