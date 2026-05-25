import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/Dashboard";
import { WebsiteConsistency } from "./components/WebsiteConsistency";
import { InstagramAudit } from "./components/InstagramAudit";
import { TopNav } from "./components/TopNav";

const queryClient = new QueryClient();

export type AppTab = "intelligence" | "website" | "instagram";

function App() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState<AppTab>("intelligence");
  const [niche, setNiche] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <TopNav
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
          niche={niche}
          activeTab={tab}
          onTabChange={setTab}
        />
        {tab === "intelligence" && <Dashboard dark={dark} onNicheChange={setNiche} />}
        {tab === "website" && <WebsiteConsistency dark={dark} />}
        {tab === "instagram" && <InstagramAudit dark={dark} />}
      </div>
    </QueryClientProvider>
  );
}

export default App;
