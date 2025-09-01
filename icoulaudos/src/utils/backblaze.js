/**
 * Upload para Backblaze B2 via URL pré-assinada (gerada no backend).
 * Requer no .env do Vite:
 *  - VITE_B2_SIGN_ENDPOINT (seu endpoint serverless para assinar upload)
 *  - VITE_B2_PUBLIC_BASE_URL (se o bucket for público; se privado, publicUrl pode ser null)
 */
export async function uploadToBackblaze(fileOrBlob, objectKey, { contentType = "application/octet-stream", metadata = {} } = {}) {
  if (!fileOrBlob) throw new Error("Arquivo/Blob inválido para upload ao Backblaze B2.");
  const SIGN_ENDPOINT = import.meta.env.VITE_B2_SIGN_ENDPOINT;
  const PUBLIC_BASE = (import.meta.env.VITE_B2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (!SIGN_ENDPOINT) throw new Error("VITE_B2_SIGN_ENDPOINT não configurado.");

  // 1) Solicita assinatura ao backend
  const signResp = await fetch(SIGN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: objectKey, contentType, metadata })
  });
  if (!signResp.ok) {
    const txt = await signResp.text().catch(() => "");
    throw new Error(`Falha ao obter URL assinada do B2: ${signResp.status} ${txt}`);
  }
  const info = await signResp.json();

  // 2) PUT pré-assinado
  if (info?.type === "put" && info.url) {
    const headers = info.headers || {};
    if (contentType && !headers["Content-Type"]) headers["Content-Type"] = contentType;
    const putResp = await fetch(info.url, { method: "PUT", headers, body: fileOrBlob });
    if (!putResp.ok) {
      const txt = await putResp.text().catch(() => "");
      throw new Error(`Falha no upload (PUT) B2: ${putResp.status} ${txt}`);
    }
    const publicUrl = info.publicUrl || (PUBLIC_BASE ? `${PUBLIC_BASE}/${objectKey}` : null);
    return { objectKey, publicUrl };
  }

  // 3) POST assinado (se seu backend optar por multipart/form-data)
  if (info?.type === "post" && info.url && info.fields) {
    const fd = new FormData();
    Object.entries(info.fields).forEach(([k, v]) => fd.append(k, v));
    fd.append("file", fileOrBlob);
    const postResp = await fetch(info.url, { method: "POST", body: fd });
    if (!postResp.ok) {
      const txt = await postResp.text().catch(() => "");
      throw new Error(`Falha no upload (POST) B2: ${postResp.status} ${txt}`);
    }
    const publicUrl = info.publicUrl || (PUBLIC_BASE ? `${PUBLIC_BASE}/${objectKey}` : null);
    return { objectKey, publicUrl };
  }

  throw new Error("Resposta inválida do endpoint de assinatura do B2.");
}