import { useEffect, useState } from "react";
import { api } from "../api";

const STATUS_COLORS = {
  Submitted:         { bg: "#E8F0FF", color: "#2D5BE3" },
  DocumentsRequired: { bg: "#FEF5EC", color: "#E67E22" },
  UnderReview:       { bg: "#F0EEFF", color: "#5B3CC4" },
  Approved:          { bg: "#E6F5EF", color: "#0A7A55" },
  Declined:          { bg: "#FDEDEC", color: "#C0392B" },
  Cancelled:         { bg: "#F0F0F0", color: "#666" },
};

const KPICard = ({ value, label }) => (
  <div style={{
    background: "white", border: "1.5px solid #DCE3F0", borderRadius: "10px",
    padding: "1.25rem 1rem", textAlign: "center", position: "relative", overflow: "hidden",
    boxShadow: "0 2px 8px rgba(30,30,75,0.05)",
  }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #1E1E4B, #29ABE2)" }} />
    <div style={{ fontSize: "2rem", fontWeight: "800", color: "#1E1E4B", lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: "0.68rem", color: "#8892A4", marginTop: "0.4rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
  </div>
);

export default function ApplicationList({ onSelect }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.listApplications()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const apps = data?.applications ?? [];

  return (
    <div>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "2rem" }}>
        <KPICard value={data?.totalCount ?? 0} label="Total Applications" />
        <KPICard value={apps.filter(a => a.status === "UnderReview").length} label="Under Review" />
        <KPICard value={apps.filter(a => a.status === "Approved").length} label="Approved" />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1E1E4B", letterSpacing: "-0.01em" }}>Applications</span>
        <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#29ABE2", background: "#E8F7FD", padding: "0.25rem 0.75rem", borderRadius: "50px", letterSpacing: "0.04em" }}>
          {data?.totalCount ?? 0} total
        </span>
      </div>

      {loading && <p style={{ color: "#8892A4", fontSize: "0.85rem", textAlign: "center", padding: "3rem" }}>Loading applications...</p>}
      {error   && <p style={{ color: "#C0392B", fontSize: "0.82rem", padding: "0.8rem 1rem", background: "#FDEDEC", borderRadius: "10px", borderLeft: "3px solid #C0392B" }}>{error} — is the API running?</p>}

      {!loading && !error && apps.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", color: "#8892A4" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>📋</div>
          <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>No applications yet. Submit one to get started.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {apps.map((app) => {
          const sc = STATUS_COLORS[app.status] ?? { bg: "#F0F0F0", color: "#666" };
          return (
            <div key={app.applicationId} onClick={() => onSelect(app.applicationId)}
              style={{
                background: "white", border: "1.5px solid #DCE3F0", borderRadius: "10px",
                padding: "1.1rem 1.5rem", display: "flex", alignItems: "center",
                justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#29ABE2"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(41,171,226,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#DCE3F0"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <p style={{ fontWeight: "700", fontSize: "0.92rem", color: "#1A1A2E" }}>{app.applicantName}</p>
                <p style={{ fontSize: "0.72rem", color: "#8892A4", marginTop: "0.2rem", fontWeight: "500" }}>
                  {app.referenceNumber} &nbsp;·&nbsp; {app.policyType} &nbsp;·&nbsp; R{app.coverAmount?.toLocaleString()}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.72rem", color: "#8892A4", fontWeight: "600" }}>{app.documentCount} doc(s)</span>
                <span style={{
                  background: sc.bg, color: sc.color,
                  padding: "0.2rem 0.7rem", borderRadius: "50px",
                  fontSize: "0.68rem", fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: "0.05em"
                }}>{app.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
