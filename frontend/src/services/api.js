const BASE = "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && data.error) ||
      res.statusText ||
      "Request failed";
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request("/api/health"),
  config: () => request("/api/config"),
  listTasks: () => request("/api/tasks"),
  getTask: (id) => request(`/api/tasks/${id}`),
  createTask: (form, user) =>
    request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        category: form.category,
        reward: Number(form.reward),
        deadline: form.deadline,
        business: user?.name || "Your Business",
        createdBy: user?.email || user?.name || "demo@bountea.app",
      }),
    }),
  claimTask: (id, worker) =>
    request(`/api/tasks/${id}/claim`, {
      method: "POST",
      body: JSON.stringify({ worker }),
    }),
  submitPreview: (id, payload) =>
    request(`/api/tasks/${id}/preview`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  requestRevision: (id, feedback) =>
    request(`/api/tasks/${id}/revision`, {
      method: "POST",
      body: JSON.stringify({ feedback }),
    }),
  approveAndPay: (id) =>
    request(`/api/tasks/${id}/approve`, { method: "POST", body: JSON.stringify({}) }),
  listReceipts: () => request("/api/receipts"),
};