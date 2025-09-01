import { auth, fetchSignInMethodsForEmail, sendPasswordResetEmail } from "../../config/firebase/firebase-config.js";
import { showLoading, hideLoading } from "../../components/loading/loading.js";

const form = document.getElementById("recovery-form");
const emailInput = document.getElementById("email");
const emailError = document.getElementById("email-error");
const button = document.getElementById("recovery-button");

// Verifica se o campo esta vazio, em seguida limpa a mensagem de erro.
emailInput.addEventListener("input", () => {
    if (!emailInput.value.checkVisibility()) {
        emailError.textContent = "";
        emailError.style.display = "none";
    } else {
        emailError.textContent = "E-mail inválido! Inclua o @.";
        emailError.style.display = "block";
    };
});

emailInput.addEventListener("input", () => {
    if (emailInput.value === "") {
        emailError.textContent = "";
        emailError.style.display = "none";
    };
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    showLoading();

    emailError.textContent = "";
    const email = emailInput.value.trim();

    if (!email.includes("@")) {
        emailError.textContent = "E-mail inválido.";
        return;
    };

    button.disabled = true;
    button.textContent = "Enviando...";

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Link enviado! Verifique sua caixa de entrada.");
        window.location.href = "../../../index.html";

    } catch (error) {
        console.error(error.message);
        if (error.code === "auth/user-not-found") {
            emailError.textContent = "Este e-mail não está cadastrado.";
        } else {
            alert("Erro ao enviar e-mail: " + error.message);
        }
    } finally {
        button.disabled = false;
        button.textContent = "Enviar link";
        hideLoading();
    }
});