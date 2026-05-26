import { useState } from "react";
import { api } from "../api";

const DOCUMENT_TYPES = [
  "IdDocument", "DriversLicence", "ProofOfAddress",
  "VehicleLicenseDisk", "VehicleRegistrationPaper", "Other",
];

export default function DocumentUpload({ applicationId, onBack }) {
  const [file, setFile]           = useState(null);
  const [docType, setDocType]     = useState("IdDocument");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded]   = useState([]);
  const [error, setError]         = useState(null);

  const upload = async () => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const result = await api.uploadDocument(applicationId, file, docType);
      setUploaded((prev) => [result, ...prev]);
      setFile(null);
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
  };

  const inputStyle = {
    border: "1.5px solid #DCE3F0", borderRadius: "10px",
    padding: "0.7rem 1rem", fontSize: "0.88rem",
    fontFamily: "Raleway, sans-serif", color: "#1A1A2E",
    background: "white", outline: "none", width: "100%", fontWeight: "500",
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <button onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        color: "#29ABE2", fontSize: "0.78rem", fontWeight: "700", background: "none",
        border: "none", cursor: "pointer", marginBottom: "1rem",
        textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "Raleway, sans-serif",
      }}>
        ← Back to Applications
      </button>

      <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #DCE3F0", padding: "2.5rem", boxShadow: "0 2px 16px rgba(30,30,75,0.06)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1E1E4B", marginBottom: "0.3rem" }}>Upload Documents</h2>
        <p style={{ fontSize: "0.7rem", color: "#8892A4", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
          Application: {applicationId}
        </p>
        <p style={{ fontSize: "0.82rem", color: "#8892A4", marginBottom: "1.25rem", fontWeight: "600" }}>Accepted: PDF, JPEG, PNG, TIFF &nbsp;·&nbsp; Maximum 10MB per file</p>

        {error && <p style={{ color: "#C0392B", fontSize: "0.82rem", marginBottom: "1rem", padding: "0.8rem", background: "#FDEDEC", borderRadius: "10px", borderLeft: "3px solid #C0392B", fontWeight: "600" }}>{error}</p>}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "#1E1E4B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>Document Type</label>
          <select value={docType} onChange={(e) => setDocType(e.target.value)} style={inputStyle}
            onFocus={e => { e.target.style.borderColor="#29ABE2"; e.target.style.boxShadow="0 0 0 3px rgba(41,171,226,0.15)"; }}
            onBlur={e => { e.target.style.borderColor="#DCE3F0"; e.target.style.boxShadow="none"; }}>
            {DOCUMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div
          onClick={() => document.getElementById("fileInput").click()}
          style={{
            border: "2px dashed #DCE3F0", borderRadius: "10px", padding: "2.5rem",
            textAlign: "center", cursor: "pointer", transition: "all 0.2s",
            background: "#F4F6FB", marginBottom: "1rem",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#29ABE2"; e.currentTarget.style.background="#E8F7FD"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="#DCE3F0"; e.currentTarget.style.background="#F4F6FB"; }}
        >
          <input id="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff"
            style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>☁️</div>
          <p style={{ fontSize: "0.85rem", color: file ? "#1E1E4B" : "#8892A4", fontWeight: file ? "700" : "600" }}>
            {file ? file.name : "Click to select a file to upload to S3"}
          </p>
        </div>

        <button onClick={upload} disabled={!file || uploading} style={{
          background: "linear-gradient(135deg, #1E1E4B, #2D2D6B)", color: "white",
          border: "none", borderRadius: "10px", padding: "0.85rem 1.5rem",
          fontSize: "0.85rem", fontWeight: "700", cursor: !file || uploading ? "not-allowed" : "pointer",
          width: "100%", fontFamily: "Raleway, sans-serif", letterSpacing: "0.04em",
          textTransform: "uppercase", opacity: !file || uploading ? 0.6 : 1, transition: "all 0.2s",
        }}>
          {uploading ? "Uploading to S3..." : "Upload Document"}
        </button>

        {uploaded.length > 0 && (
          <div style={{ marginTop: "1.5rem", borderTop: "1.5px solid #DCE3F0", paddingTop: "1.25rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: "800", color: "#8892A4", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Uploaded this session</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {uploaded.map((doc) => (
                <div key={doc.documentId} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#E6F5EF", borderRadius: "10px", padding: "0.6rem 1rem", fontSize: "0.82rem",
                }}>
                  <span style={{ color: "#1A1A2E", fontWeight: "600" }}>{doc.fileName} ({doc.documentType})</span>
                  <a href={doc.presignedDownloadUrl} target="_blank" rel="noreferrer"
                    style={{ color: "#29ABE2", fontSize: "0.75rem", fontWeight: "700" }}>
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
