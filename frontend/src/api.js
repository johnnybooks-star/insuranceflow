const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "Request failed");
  return json.data;
}

export const api = {
  // Applications
  createApplication: (body) =>
    request("/api/v1/applications", { method: "POST", body: JSON.stringify(body) }),

  listApplications: (limit = 50) =>
    request(`/api/v1/applications?limit=${limit}`),

  getApplication: (id) =>
    request(`/api/v1/applications/${id}`),

  getByReference: (ref) =>
    request(`/api/v1/applications/reference/${ref}`),

  updateStatus: (id, body) =>
    request(`/api/v1/applications/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),

  // Documents
  uploadDocument: async (applicationId, file, documentType) => {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", documentType);
    const res = await fetch(`${BASE_URL}/api/v1/applications/${applicationId}/documents`, {
      method: "POST", body: form,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? "Upload failed");
    return json.data;
  },

  getDocuments: (applicationId) =>
    request(`/api/v1/applications/${applicationId}/documents`),
};
