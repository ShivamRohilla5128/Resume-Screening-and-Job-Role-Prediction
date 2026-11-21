export const fmtSize = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-");
export const pct = (p, d = 0) => `${(p * 100).toFixed(d)}%`;
export const orND = (v) => (v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length) ? "Not detected" : v);
export const scoreColor = (v) => (v >= 70 ? "#16A34A" : v >= 40 ? "#2563EB" : "#F59E0B");
export const errMsg = (e) => {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") {
    if (d.includes("Trained model artifacts not found")) return "The ML model is not ready. Train the model artifacts and restart the backend.";
    return d;
  }
  if (Array.isArray(d)) return d.map((x) => x.msg).join("; ");
  if (e?.code === "ERR_NETWORK") return "Cannot reach the server. Is the backend running on port 8000?";
  return e?.message || "Something went wrong";
};
export const downloadBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const toCSV = (rows) =>
  rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
