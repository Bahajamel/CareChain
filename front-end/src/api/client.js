/**
 * En dev, laisser VITE_API_URL vide : Vite proxy redirige /api → backend (vite.config.js).
 * En prod, définir VITE_API_URL=https://votre-api.com (sans slash final).
 */
function baseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw && String(raw).trim()) {
    return String(raw).replace(/\/$/, "");
  }
  return "";
}

function authHeaders() {
  const key = import.meta.env.VITE_API_KEY;
  if (key && String(key).trim()) {
    return { "X-API-Key": String(key).trim() };
  }
  return {};
}

export function apiPath(path) {
  const b = baseUrl();
  if (!b) return path.startsWith("/") ? path : `/${path}`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function getHealth() {
  const res = await fetch(apiPath("/api/health"));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

export async function uploadFile(file) {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(apiPath("/api/files/upload"), {
    method: "POST",
    headers: authHeaders(),
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

export async function uploadMedicalRecord(fields, file) {
  const body = new FormData();
  body.append("file", file);
  body.append("patientAddress", fields.patientAddress.trim());
  body.append("providerAddress", fields.providerAddress.trim());
  body.append("actType", fields.actType.trim());
  body.append("amount", String(fields.amount));

  const res = await fetch(apiPath("/api/medical-records/upload"), {
    method: "POST",
    headers: authHeaders(),
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

/**
 * Récupère un JSON depuis IPFS via une gateway publique.
 * Note: pour les anciens enregistrements, le CID peut pointer vers un fichier (PDF/image),
 * pas un JSON — dans ce cas, l'appel échouera et l'appelant doit gérer.
 */
export async function fetchIpfsJson(cid, options = {}) {
  const gatewayBase = options.gatewayBase ?? "https://ipfs.io/ipfs";
  const clean = String(cid || "").trim();
  if (!clean) throw new Error("CID manquant");
  let base = String(gatewayBase).trim();
  if (base.endsWith("/")) base = base.slice(0, -1);
  const url = `${base}/${clean}`;
  const res = await fetch(url, { method: "GET" });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(`IPFS fetch failed (${res.status})`);
  }
  return data;
}
