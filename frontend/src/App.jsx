import { useState } from "react";
import LOGO from "./logo.js";
import ApplicationForm from "./components/ApplicationForm";
import ApplicationStatus from "./components/ApplicationStatus";
import ApplicationList from "./components/ApplicationList";
import DocumentUpload from "./components/DocumentUpload";

export default function App() {
  const [view, setView] = useState("list");
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

  const handleApplicationCreated = (applicationId) => {
    setSelectedApplicationId(applicationId);
    setView("upload");
  };

  const nav = (label, target) => (
    <button
      onClick={() => setView(target)}
      style={{
        padding: "0.45rem 1.1rem",
        borderRadius: "50px",
        fontSize: "0.78rem",
        fontWeight: view === target ? "700" : "600",
        cursor: "pointer",
        transition: "all 0.2s",
        border: "1.5px solid",
        borderColor: view === target ? "#29ABE2" : "rgba(255,255,255,0.25)",
        background: view === target ? "#29ABE2" : "transparent",
        color: view === target ? "#1E1E4B" : "rgba(255,255,255,0.85)",
        fontFamily: "Raleway, sans-serif",
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB" }}>

      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1E1E4B 0%, #2D2D6B 100%)",
        padding: "0 2.5rem",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 24px rgba(30,30,75,0.35)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img src={LOGO} alt="InsuranceFlow" style={{ height: "40px", width: "auto" }} />
          <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.2)" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "1rem", fontWeight: "800", color: "white", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              InsuranceFlow
            </span>
            <span style={{ fontSize: "0.62rem", color: "#5BC8E8", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "1px" }}>
              Short-Term Insurance Portal
            </span>
          </div>
        </div>
        <nav style={{ display: "flex", gap: "6px" }}>
          {nav("All Applications", "list")}
          {nav("New Application", "new")}
          {nav("Track Application", "track")}
        </nav>
      </header>

      {/* Main */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {view === "list" && (
          <ApplicationList onSelect={(id) => { setSelectedApplicationId(id); setView("upload"); }} />
        )}
        {view === "new" && <ApplicationForm onSuccess={handleApplicationCreated} />}
        {view === "track" && <ApplicationStatus />}
        {view === "upload" && (
          <DocumentUpload applicationId={selectedApplicationId} onBack={() => setView("list")} />
        )}
      </main>

      <footer style={{ textAlign: "center", fontSize: "0.7rem", color: "#8892A4", padding: "2rem", fontWeight: "600", letterSpacing: "0.04em", borderTop: "1px solid #DCE3F0", marginTop: "2rem", textTransform: "uppercase" }}>
        InsuranceFlow &nbsp;·&nbsp; Built on .NET 8 / React 18 / AWS DynamoDB / AWS S3
      </footer>
    </div>
  );
}
