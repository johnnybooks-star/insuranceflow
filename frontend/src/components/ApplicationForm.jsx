import { useState } from "react";
import { api } from "../api";

const POLICY_TYPES = [
  { value: "Comprehensive",  label: "Comprehensive" },
  { value: "ThirdParty",     label: "Third Party Only" },
  { value: "ThirdPartyFire", label: "Third Party, Fire and Theft" },
];

const inputStyle = {
  border: "1.5px solid #DCE3F0", borderRadius: "10px",
  padding: "0.7rem 1rem", fontSize: "0.88rem",
  fontFamily: "Raleway, sans-serif", color: "#1A1A2E",
  background: "white", outline: "none", width: "100%",
  transition: "all 0.2s", fontWeight: "500",
};

const labelStyle = {
  fontSize: "0.7rem", fontWeight: "700", color: "#1E1E4B",
  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem",
};

const sectionLabel = (text) => (
  <div style={{
    fontSize: "0.68rem", fontWeight: "800", color: "#8892A4",
    textTransform: "uppercase", letterSpacing: "0.08em",
    margin: "1.75rem 0 1rem", paddingBottom: "0.5rem",
    borderBottom: "1.5px solid #DCE3F0",
    display: "flex", alignItems: "center", gap: "0.5rem",
  }}>
    <span style={{ display: "inline-block", width: "3px", height: "14px", background: "linear-gradient(180deg, #1E1E4B, #29ABE2)", borderRadius: "2px" }} />
    {text}
  </div>
);

export default function ApplicationForm({ onSuccess }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phoneNumber: "", idNumber: "",
    policyType: "Comprehensive", coverAmount: "",
    vehicleRegistration: "", vehicleMake: "", vehicleModel: "", vehicleYear: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const focusStyle = (e) => { e.target.style.borderColor = "#29ABE2"; e.target.style.boxShadow = "0 0 0 3px rgba(41,171,226,0.15)"; };
  const blurStyle  = (e) => { e.target.style.borderColor = "#DCE3F0"; e.target.style.boxShadow = "none"; };

  const field = (label, id, type = "text", extra = {}) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={form[id]} onChange={set(id)}
        style={inputStyle} required onFocus={focusStyle} onBlur={blurStyle}
        {...extra} />
    </div>
  );

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const result = await api.createApplication({
        ...form,
        coverAmount: parseFloat(form.coverAmount),
        vehicleYear: parseInt(form.vehicleYear),
      });
      onSuccess(result.applicationId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #DCE3F0", padding: "2.5rem", boxShadow: "0 2px 16px rgba(30,30,75,0.06)", maxWidth: "680px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1E1E4B", marginBottom: "0.3rem", letterSpacing: "-0.01em" }}>New Insurance Application</h2>
      <p style={{ fontSize: "0.8rem", color: "#8892A4", marginBottom: "1.5rem" }}>Complete all fields. Documents can be uploaded after submission.</p>

      {error && (
        <div style={{ padding: "0.8rem 1rem", background: "#FDEDEC", borderRadius: "10px", borderLeft: "3px solid #C0392B", fontSize: "0.82rem", color: "#C0392B", marginBottom: "1rem", fontWeight: "600" }}>
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {field("First Name", "firstName")}
          {field("Last Name", "lastName")}
        </div>
        <div style={{ marginTop: "1.25rem" }}>{field("Email Address", "email", "email")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "1.25rem" }}>
          {field("Phone Number", "phoneNumber", "tel")}
          {field("SA ID Number", "idNumber")}
        </div>

        {sectionLabel("Policy Details")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Policy Type</label>
            <select value={form.policyType} onChange={set("policyType")}
              style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
              {POLICY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {field("Cover Amount (ZAR)", "coverAmount", "number", { min: 10000, step: 1000 })}
        </div>

        {sectionLabel("Vehicle Details")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {field("Registration Number", "vehicleRegistration")}
          {field("Year", "vehicleYear", "number", { min: 1990, max: 2026 })}
          {field("Make", "vehicleMake")}
          {field("Model", "vehicleModel")}
        </div>

        <button type="submit" disabled={loading} style={{
          background: "linear-gradient(135deg, #1E1E4B 0%, #2D2D6B 100%)",
          color: "white", border: "none", borderRadius: "10px",
          padding: "0.85rem 1.5rem", fontSize: "0.85rem", fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer", width: "100%", marginTop: "1.75rem",
          fontFamily: "Raleway, sans-serif", letterSpacing: "0.04em",
          textTransform: "uppercase", opacity: loading ? 0.6 : 1, transition: "all 0.2s",
        }}>
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
