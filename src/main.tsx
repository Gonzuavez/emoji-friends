import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { brunoThinkingOfYou, loadGift, type Gift } from './config/gifts/brunoThinkingOfYou';
import { BrunoThinkingOfYou } from './experiences/BrunoThinkingOfYou/BrunoThinkingOfYou';
import './styles.css';

function App() {
  const [gift, setGift] = useState<Gift | null | undefined>();
  useEffect(() => {
    let current = true;
    const match = window.location.pathname.match(/^\/g\/([^/]+)\/?$/);
    const id = window.location.pathname === '/' ? brunoThinkingOfYou.id : match?.[1];
    if (!id) { setGift(null); return; }
    void loadGift(id).then(value => { if (current) setGift(value); }).catch(() => { if (current) setGift(null); });
    return () => { current = false; };
  }, []);
  if (gift === undefined) return <main className="fallback"><p role="status">A little magic is on its way…</p></main>;
  if (gift === null) return <main className="fallback"><h1>This gift isn’t here.</h1><a href="/g/bruno-thinking-of-you">Meet Bruno instead</a></main>;
  return <BrunoThinkingOfYou gift={gift} />;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
