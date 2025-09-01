import { auth, onAuthStateChanged } from "./firebase-config.js";
import { verifySignature } from "../../services/auth/check-subscription.js"

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Redireciona se não estiver logado
        window.location.href = "../../../index.html";
        
    } else {
        console.log("Usuário autenticado:", user.email);

        try {
            const estaValido = await verifySignature(user.uid);

            if (!estaValido) {
                alert("Seu período de teste ou assinatura expirou.");
                window.location.href = "../../../index.html";
            } else {
                console.log("Assinatura válida.");
            }
        } catch (e) {
            console.error("Erro ao verificar assinatura:", e.message);
            window.location.href = "../../../index.html";
        }
    }
});