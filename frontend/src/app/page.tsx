import Navbar from "@/components/Navbar";
import ChatContainer from "@/components/ChatContainer";
import RouteVisualizer from "@/components/RouteVisualizer";

export default function Home() {
  return (
    <div className="app-shell">
      {/* Level 0 — ambient gradient canvas */}
      <div className="ambient-canvas" aria-hidden="true">
        <div className="ambient-blob blob-a" />
        <div className="ambient-blob blob-b" />
        <div className="ambient-blob blob-c" />
      </div>

      <Navbar />

      <main className="app-main">
        {/* AI interaction rail (5 columns) */}
        <ChatContainer />
        {/* Live corridor map & vehicle telemetry (7 columns) */}
        <RouteVisualizer />
      </main>
    </div>
  );
}
