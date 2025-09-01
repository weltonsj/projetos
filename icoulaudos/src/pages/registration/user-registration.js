import { auth, db, createUserWithEmailAndPassword, doc, setDoc } from "../../config/firebase/firebase-config.js";
import { createFooter } from "../../../src/components/footer/footer.js";

createFooter();

const form = document.getElementById("registration-form");
const nome = document.getElementById("nome");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const termos = document.getElementById("termos");
const registerButton = document.getElementById("register-button");

// Mensagens de erro
const nomeError = document.getElementById("nome-error");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const confirmPasswordError = document.getElementById("confirm-password-error");
const termosError = document.getElementById("termos-error");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset de mensagens de erro
    nomeError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
    termosError.textContent = "";

    const nomeValue = nome.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();
    const confirmPasswordValue = confirmPassword.value.trim();
    const aceitouTermos = termos.checked;

    // Validações
    if (!nomeValue) {
        nomeError.textContent = "Informe seu nome.";
        return;
    }

    if (!emailValue.includes("@")) {
        emailError.textContent = "E-mail inválido.";
        return;
    }

    if (passwordValue.length < 6) {
        passwordError.textContent = "Senha deve ter pelo menos 6 caracteres.";
        return;
    }

    if (passwordValue !== confirmPasswordValue) {
        confirmPasswordError.textContent = "As senhas não coincidem.";
        return;
    }

    if (!aceitouTermos) {
        termosError.textContent = "Você precisa aceitar os termos.";
        return;
    }
 
    const currentYear = new Date().getFullYear();
    const twoEndDigits = String(currentYear).slice(2).replace("0", "1") + "000";
    
    // Cadastro
    try {
        registerButton.disabled = true;
        registerButton.textContent = "Cadastrando...";

        const cred = await createUserWithEmailAndPassword(auth, emailValue, passwordValue);
        const user = cred.user;

        const hoje = new Date();
        const validade = new Date();
        validade.setDate(hoje.getDate() + 15);

        await setDoc(doc(db, "users", user.uid), {
            idPatientNumberControl: Number(twoEndDigits),
            email: emailValue,
            nome: nomeValue,
            plano: "teste",
            status: "ativo",
            createdAt: hoje.toISOString(),
            expiresAt: validade.toISOString(),
        });

        alert("Cadastro realizado com sucesso!");
        window.location.href = "../../../index.html";
    } catch (error) {
        alert("Erro no cadastro: " + error.message);
    } finally {
        registerButton.disabled = false;
        registerButton.textContent = "Cadastrar";
    }
});