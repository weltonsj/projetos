import { db, getDoc, doc } from "../../config/firebase/firebase-config.js";

export async function verifySignature(uid) {
    console.log("Verificando assinatura para:", uid);
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        throw new Error("Usuário não encontrado.");
    }

    const dados = snap.data();
    const hoje = new Date();
    const expiraEm = new Date(dados.expiresAt);

    return hoje <= expiraEm;
}