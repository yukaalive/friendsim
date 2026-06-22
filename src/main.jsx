import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>FriendSim</h1>
      <p>Development environment is ready.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
