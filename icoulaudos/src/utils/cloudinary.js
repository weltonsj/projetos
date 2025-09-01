// Utilitário simples para upload de arquivos ao Cloudinary via unsigned upload
// Requer no .env (Vite):
//   VITE_CLOUDINARY_CLOUD_NAME
//   VITE_CLOUDINARY_UPLOAD_PRESET
// Uso:
//   const url = await uploadToCloudinary(file, `icoulaudos/users/${userId}/logo`);

/**
 * Faz upload de um arquivo (File/Blob) para o Cloudinary usando upload unsigned.
 * Retorna a URL segura do arquivo (secure_url).
 * @param {File|Blob} file Arquivo a enviar
 * @param {string} [folder="icoulaudos"] Pasta destino em Cloudinary
 * @returns {Promise<string>} URL segura do recurso enviado
 */
export async function uploadToCloudinary(file, folder = "icoulaudos", options = {}) {
  if (!file) throw new Error("Arquivo inválido para upload ao Cloudinary.");

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  // Permite passar explicitamente o preset via options.preset;
  // caso não seja informado, prioriza o preset de USERS e, em seguida, tenta outros disponíveis no .env.
  const PRESET = options.preset
    || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_USERS
    || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PACIENTES
    || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_LAUDOS;

  if (!CLOUD_NAME || !PRESET) {
    throw new Error(
      "Cloudinary não configurado. Defina VITE_CLOUDINARY_CLOUD_NAME e um dos presets (VITE_CLOUDINARY_UPLOAD_PRESET_USERS/PACIENTES/LAUDOS) no .env."
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", PRESET);
  if (folder) formData.append("folder", folder);

  const resp = await fetch(url, { method: "POST", body: formData });
  if (!resp.ok) {
    let msg = "";
    try { msg = await resp.text(); } catch {}
    throw new Error(`Falha no upload Cloudinary: ${resp.status} ${msg}`);
  }

  const data = await resp.json();
  if (!data || !data.secure_url) {
    throw new Error("Resposta inesperada do Cloudinary: secure_url ausente.");
  }
  return data.secure_url;
}