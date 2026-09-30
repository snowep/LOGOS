import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System | LOGOS",
  description: "System health, configuration, and diagnostics",
};

async function getSystemData() {
  try {
    const response = await fetch("http://localhost:3001/api/system", {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch system data:", error);
    return null;
  }
}

export default async function SystemPage() {
  const systemData = await getSystemData();

  if (!systemData) {
    return (
      <div style={{ minHeight: "100vh", padding: "4rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h2 style={{ color: "#fff", marginBottom: "1rem" }}>Error loading system information</h2>
        <p style={{ color: "#a1a1aa" }}>Unable to connect to API server</p>
      </div>
    );
  }

  const {
    health,
    storage,
    retrieval,
    events,
    runtime,
    logs,
    configuration,
    developer,
  } = systemData;

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", backgroundColor: "#0a0a0a", color: "#fafafa" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 0" }}>
        <h1 style={{ marginBottom: "2rem" }}>System</h1>

        {/* Health Section */}
        <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #27272a", borderRadius: "8px", backgroundColor: "#111111" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Health</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Card title="Status" value={health.status.toUpperCase()} color={health.status === "ok" ? "#22c55e" : "#ef4444"} />
            <Card title="Service" value={health.service} />
            <Card title="Version" value={health.version} />
            <Card title="Timestamp" value={new Date(health.timestamp).toLocaleString()} small />
          </div>
        </section>

        {/* Storage Section */}
        <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #27272a", borderRadius: "8px", backgroundColor: "#111111" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Storage</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Card title="Database Size" value={`${(storage.databaseSize / 1024 / 1024).toFixed(2)} MB`} />
            <Card title="Page Count" value={storage.pageCount.toString()} />
            <Card title="Cache Size" value={storage.cacheSize.toString()} />
            <Card title="Document Count" value={storage.documentCount.toString()} />
          </div>
        </section>

        {/* Retrieval Section */}
        <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #27272a", borderRadius: "8px", backgroundColor: "#111111" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Retrieval</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Card title="Vector Available" value={retrieval.vecAvailable ? "Yes" : "No"} color={retrieval.vecAvailable ? "#22c55e" : "#ef4444"} />
            <Card title="Embedding Model" value={retrieval.embeddingModel || "Not configured"} />
          </div>
        </section>

        {/* Events Section */}
        <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #27272a", borderRadius: "8px", backgroundColor: "#111111" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Events</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Card title="SSE Clients" value={events.sseClients.toString()} />
            <Card title="Recent Events" value={events.recentEventsCount.toString()} />
          </div>
        </section>

        {/* Runtime Section */}
        <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #27272a", borderRadius: "8px", backgroundColor: "#111111" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Runtime</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Card title="Uptime" value={`${Math.floor(runtime.uptime / 3600)}h ${Math.floor((runtime.uptime % 3600) / 60)}m ${Math.floor(runtime.uptime % 60)}s`} />
            <Card title="Memory (RSS)" value={`${(runtime.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`} />
            <Card title="Memory (Heap Total)" value={`${(runtime.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`} />
            <Card title="Memory (Heap Used)" value={`${(runtime.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`} />
          </div>
        </section>

        {/* Logs Section */}
        <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #27272a", borderRadius: "8px", backgroundColor: "#111111" }}>
          <h2 style={{ marginBottom: "1rem" }}>Recent Logs (last 50 entries)</h2>
          <pre style={{ 
            backgroundColor: "#0a0a0a", 
            padding: "1rem", 
            borderRadius: "8px", 
            overflow: "auto",
            fontSize: "0.75rem",
            lineHeight: 1.5,
            color: "#e4e4e7",
            border: "1px solid #27272a",
            maxHeight: "300px"
          }}>
            {logs.recent
              .map(
                (log) =>
                  `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
              )
              .join("\n")}
          </pre>
        </section>

        {/* Configuration Section */}
        <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #27272a", borderRadius: "8px", backgroundColor: "#111111" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Configuration</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Card title="Port" value={configuration.port.toString()} />
            <Card title="Vault Path" value={configuration.vaultPath} small mono />
            <Card title="DB Path" value={configuration.dbPath} small mono />
            <Card title="Version" value={configuration.version} />
          </div>
        </section>

        {/* Developer Section */}
        <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #27272a", borderRadius: "8px", backgroundColor: "#111111" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Developer</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Card title="Active Phase" value={developer.activePhase} />
            <Card title="Git Branch" value={developer.gitBranch || "Not available"} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ title, value, color, small, mono }: { title: string; value: string; color?: string; small?: boolean; mono?: boolean }) {
  return (
    <div style={{ padding: "1rem", border: "1px solid #27272a", borderRadius: "8px", backgroundColor: "#111111", textAlign: "center" }}>
      <div style={{ color: "#a1a1aa", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
        {title}
      </div>
      <div style={{ 
        fontSize: small ? "0.875rem" : "1.5rem", 
        fontWeight: 600,
        color: color || "#fff",
        fontFamily: mono ? "monospace" : "inherit",
        wordBreak: "break-all"
      }}>
        {value}
      </div>
    </div>
  );
}