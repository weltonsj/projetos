import { auth, signInWithEmailAndPassword } from "./config/firebase/firebase-config.js";
import { showLoading, hideLoading } from "../src/components/loading/loading.js";
import { createFooter } from "./components/footer/footer.js";

// Criação do Footer / Rodapé da página
createFooter();

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const loginButton = document.getElementById("login-button");
const togglePassword = document.getElementById("togglePassword");

// Mostrar/Ocultar senha
togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "🔐" : "🔒";
});

// Validação e login
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showLoading();
    emailError.style.display = "none";
    passwordError.style.display = "none";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email) {
        emailError.textContent = "Informe seu e-mail";
        emailError.style.display = "block";
        return;
    }

    if (!password) {
        passwordError.textContent = "Informe sua senha";
        passwordError.style.display = "block";
        return;
    }

    loginButton.disabled = true;
    loginButton.classList.add("loading");
    loginButton.textContent = "Entrando...";

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login realizado", userCredential.user);
        window.location.href = "./src/app/dashboard/dashboard.html";

    } catch (error) {
        const errorCode = error.code;
        let errorMessage = "Erro ao fazer login";

        if (errorCode === "auth/user-not-found" || errorCode === "auth/wrong-password") {
            errorMessage = "E-mail ou senha inválidos";
            
        } else if (errorCode === "auth/too-many-requests") {
            errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
        }

        alert(errorMessage);

    } finally {
        loginButton.disabled = false;
        loginButton.classList.remove("loading");
        loginButton.textContent = "Entrar";
        hideLoading();
    }
});