import dynamic from 'next/dynamic';

const NatureGenerator = dynamic(() => import('../components/NatureGenerator'), { ssr: false });

export default function Page() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'linear-gradient(180deg, #e9f7ff 0%, #ffffff 100%)' }}>
      <div style={{ width: '100%', maxWidth: 1200 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Nature Image Generator</h1>
        <p style={{ color: '#555', marginBottom: 16 }}>Generate serene, high-resolution nature scenes directly in your browser. No sign-in, no uploads.</p>
        <NatureGenerator />
        <footer style={{ marginTop: 24, color: '#777', fontSize: 12 }}>Built for fast, offline-friendly generation using procedural graphics.</footer>
      </div>
    </main>
  );
}
