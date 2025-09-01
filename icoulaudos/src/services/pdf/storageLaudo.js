import { auth, db, addDoc, collection, serverTimestamp } from "../../config/firebase/firebase-config.js";
import { uploadToBackblaze } from "../../utils/backblaze.js";

/**
 * Sobe o PDF no B2 e registra metadados no Firestore (guarda só link/ID).
 */
export async function saveLaudoPdfToB2(pdfBlob, { pacienteId, nomeArquivo, metadados = {} } = {}) {
  if (!pdfBlob) throw new Error("PDF inválido.");
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  const ts = new Date().toISOString().replaceAll(":", "-").split(".")[0];
  const fileName = nomeArquivo || `laudo-${pacienteId || "paciente"}-${ts}.pdf`;
  const objectKey = `users/${user.uid}/laudos/${fileName}`;

  const { publicUrl } = await uploadToBackblaze(pdfBlob, objectKey, { contentType: "application/pdf" });

  const docRef = await addDoc(collection(db, "laudos"), {
    userId: user.uid,
    pacienteId: pacienteId ?? null,
    fileName,
    b2Key: objectKey,
    url: publicUrl || null,
    createdAt: serverTimestamp(),
    ...metadados
  });

  return { b2Key: objectKey, url: publicUrl || null, docId: docRef.id };
}
