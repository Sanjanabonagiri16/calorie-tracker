export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 40 }}>
      <h1>Calorie Tracker API</h1>
      <p>This is the separate backend. Frontend should call <code>/api/*</code> routes.</p>
      <ul>
        <li>GET /api/health</li>
        <li>POST /api/auth/register</li>
        <li>POST /api/auth/login</li>
        <li>GET/PUT /api/goals</li>
        <li>GET/POST /api/meals</li>
        <li>GET /api/reports</li>
        <li>POST /api/ai/extract</li>
        <li>GET/POST /api/chat</li>
        <li>POST /api/import/pdf</li>
      </ul>
    </main>
  );
}
