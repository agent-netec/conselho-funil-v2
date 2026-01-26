export default function DebugPage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>🚀 Deploy Sincronizado!</h1>
      <p>Se você está vendo esta página, o novo código da Sprint 29 chegou na Vercel.</p>
      <p>Data: {new Date().toLocaleString()}</p>
      <a href="/intelligence/personalization" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
        Ir para Personalização →
      </a>
    </div>
  )
}
