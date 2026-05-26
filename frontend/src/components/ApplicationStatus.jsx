import { useState } from "react";
import { api } from "../api";

const STATUS_COLORS = {
  Submitted:         { bg: "#E8F0FF", color: "#2D5BE3" },
  DocumentsRequired: { bg: "#FEF5EC", color: "#E67E22" },
  UnderReview:       { bg: "#F0EEFF", color: "#5B3CC4" },
  Approved:          { bg: "#E6F5EF", color: "#0A7A55" },
  Declined:          { bg: "#FDEDEC", color: "#C0392B" },
  Cancelled:         { bg: "#F0F0F0", color: "#666" },
};

export default function ApplicationStatus() {
  const [ref, setRef]         = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const search = async () => {
    if (!ref.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try { setResult(await api.getByReference(ref.trim())); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    flex: 1, border: "1.5px solid #DCE3F0", borderRadius: "10px",
    padding: "0.7rem 1rem", fontSize: "0.88rem", fontFamily: "Raleway, sans-serif",
    color: "#1A1A2E", background: "white", outline: "none", fontWeight: "500",
  };

  return (
    <div style={{ maxWidth: "540px", margin: "0 auto" }}>
      <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #DCE3F0", padding: "2.5rem", boxShadow: "0 2px 16px rgba(30,30,75,0.06)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1E1E4B", marginBottom: "0.3rem" }}>Track Your Application</h2>
        <p style={{ fontSize: "0.8rem", color: "#8892A4", marginBottom: "1.75rem" }}>Enter your reference number to check your application status.</p>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <input value={ref} onChange={(e) => setRef(e.target.value)}
            placeholder="IF-COM-YYYYMMDD-XXXX" style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && search()}
            onFocus={e => { e.target.style.borderColor="#29ABE2"; e.target.style.boxShadow="0 0 0 3px rgba(41,171,226,0.15)"; }}
            onBlur={e => { e.target.style.borderColor="#DCE3F0"; e.target.style.boxShadow="none"; }}
          />
          <button onClick={search} disabled={loading} style={{
            background: "linear-gradient(135deg, #1E1E4B, #2D2D6B)", color: "white",
            border: "none", borderRadius: "10px", padding: "0 1.5rem",
            fontSize: "0.78rem", fontWeight: "700", cursor: "pointer",
            fontFamily: "Raleway, sans-serif", letterSpacing: "0.04em",
            textTransform: "uppercase", whiteSpace: "nowrap",
          }}>
            {loading ? "..." : "Search"}
          </button>
        </div>

        {error && <p style={{ color: "#C0392B", fontSize: "0.82rem", padding: "0.8rem", background: "#FDEDEC", borderRadius: "10px", borderLeft: "3px solid #C0392B", fontWeight: "600" }}>{error}</p>}

        {result && (
          <div style={{ borderTop: "1.5px solid #DCE3F0", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
            {[
              ["Reference",  result.referenceNumber],
              ["Applicant",  result.applicantName],
              ["Policy",     `${result.policyType} — R${result.coverAmount?.toLocaleString()}`],
              ["Vehicle",    result.vehicleDescription],
              ["Submitted",  new Date(result.createdAt).toLocaleDateString("en-ZA")],
              ["Documents",  `${result.documentCount} uploaded`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0", borderBottom: "1px solid #DCE3F0" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#8892A4", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
                <span style={{ fontWeight: "700", color: "#1A1A2E", fontSize: "0.85rem" }}>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.65rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#8892A4", textTransform: "uppercase", letterSpacing: "0.04em" }}>Status</span>
              {(() => { const sc = STATUS_COLORS[result.status] ?? { bg: "#F0F0F0", color: "#666" }; return (
                <span style={{ background: sc.bg, color: sc.color, padding: "0.2rem 0.7rem", borderRadius: "50px", fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {result.status}
                </span>
              ); })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
