// ── ApplicationList.jsx ──────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { api } from "../api";

const STATUS_COLORS = {
  Submitted:         "bg-blue-100 text-blue-700",
  DocumentsRequired: "bg-yellow-100 text-yellow-700",
  UnderReview:       "bg-purple-100 text-purple-700",
  Approved:          "bg-green-100 text-green-700",
  Declined:          "bg-red-100 text-red-700",
  Cancelled:         "bg-gray-100 text-gray-500",
};

export function ApplicationList({ onSelect }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.listApplications()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500 text-sm">Loading applications...</p>;
  if (error)   return <p className="text-red-600 text-sm">{error}</p>;

  const apps = data?.applications ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#1A2D5A]">Applications</h2>
        <span className="text-sm text-gray-500">{data?.totalCount ?? 0} total</span>
      </div>

      {apps.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">No applications yet.</p>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <div
              key={app.applicationId}
              onClick={() => onSelect(app.applicationId)}
              className="bg-white rounded-lg border border-gray-200 px-5 py-4 flex items-center justify-between cursor-pointer hover:border-[#1A2D5A] hover:shadow-sm transition-all"
            >
              <div>
                <p className="font-semibold text-sm text-gray-900">{app.applicantName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {app.referenceNumber} - {app.policyType} - R{app.coverAmount.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{app.documentCount} doc(s)</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApplicationList;


// ── ApplicationStatus.jsx ────────────────────────────────────────────────────
export function ApplicationStatus() {
  const [ref, setRef]       = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const search = async () => {
    if (!ref.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.getByReference(ref.trim());
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-lg font-bold text-[#1A2D5A] mb-1">Track Your Application</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your reference number (e.g. IF-COM-20250101-1234)</p>
        <div className="flex gap-2">
          <input
            value={ref} onChange={(e) => setRef(e.target.value)}
            placeholder="IF-COM-YYYYMMDD-XXXX"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2D5A]"
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button
            onClick={search} disabled={loading}
            className="bg-[#1A2D5A] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#152447] disabled:opacity-60"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-5 border-t pt-5 space-y-2 text-sm">
            <Row label="Reference" value={result.referenceNumber} />
            <Row label="Applicant" value={result.applicantName} />
            <Row label="Policy" value={`${result.policyType} - R${result.coverAmount?.toLocaleString()}`} />
            <Row label="Vehicle" value={result.vehicleDescription} />
            <Row label="Status" value={<StatusBadge status={result.status} />} />
            <Row label="Submitted" value={new Date(result.createdAt).toLocaleDateString("en-ZA")} />
            <Row label="Documents" value={`${result.documentCount} uploaded`} />
            {result.notes && <Row label="Notes" value={result.notes} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default ApplicationStatus;


// ── DocumentUpload.jsx ───────────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  "IdDocument", "DriversLicence", "ProofOfAddress",
  "VehicleLicenseDisk", "VehicleRegistrationPaper", "Other",
];

export function DocumentUpload({ applicationId, onBack }) {
  const [file, setFile]           = useState(null);
  const [docType, setDocType]     = useState("IdDocument");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded]   = useState([]);
  const [error, setError]         = useState(null);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadDocument(applicationId, file, docType);
      setUploaded((prev) => [result, ...prev]);
      setFile(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={onBack} className="text-sm text-[#1A2D5A] hover:underline">
        Back to applications
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-lg font-bold text-[#1A2D5A] mb-1">Upload Documents</h2>
        <p className="text-xs text-gray-400 mb-5">Application ID: {applicationId}</p>
        <p className="text-sm text-gray-500 mb-5">PDF, JPEG, PNG or TIFF. Maximum 10MB per file.</p>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2D5A]"
            >
              {DOCUMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-[#1A2D5A] transition-colors"
            onClick={() => document.getElementById("fileInput").click()}
          >
            <input
              id="fileInput" type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file
              ? <p className="text-sm font-medium text-[#1A2D5A]">{file.name}</p>
              : <p className="text-sm text-gray-400">Click to select a file</p>
            }
          </div>

          <button
            onClick={upload} disabled={!file || uploading}
            className="w-full bg-[#1A2D5A] text-white py-2.5 rounded-md text-sm font-semibold hover:bg-[#152447] transition-colors disabled:opacity-60"
          >
            {uploading ? "Uploading to S3..." : "Upload Document"}
          </button>
        </div>

        {uploaded.length > 0 && (
          <div className="mt-5 border-t pt-5">
            <p className="text-sm font-semibold text-gray-600 mb-3">Uploaded this session</p>
            <div className="space-y-2">
              {uploaded.map((doc) => (
                <div key={doc.documentId} className="flex items-center justify-between text-sm bg-green-50 rounded p-2">
                  <span className="text-gray-700">{doc.fileName} ({doc.documentType})</span>
                  <a href={doc.presignedDownloadUrl} target="_blank" rel="noreferrer"
                     className="text-[#1A2D5A] underline text-xs">
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

export default DocumentUpload;
