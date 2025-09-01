import { showCustomizableMessage } from "../../components/modal/modal.js";

const mainContent = document.querySelector(".dashboard-content");
const userProfile = document.getElementById("user-profile");
const userImg = userProfile?.querySelector("img");
const crown = userProfile?.querySelector(".crown");
const accountInfo = document.getElementById("account-info");

// Renderiza avatar e status da conta no header
function renderHeaderProfile(userData = {}) {
    if (userImg) {
        const foto = userData?.fotoURL || "";
        userImg.src = foto;
        userImg.style.objectFit = "cover";
    }
    if (accountInfo) {
        const plano = (userData?.plano || "").toLowerCase();
        const expiresAt = userData?.expiresAt ? new Date(userData.expiresAt) : null;
        let texto = "Conta";
        if (plano === "teste") {
            let dias = "";
            if (expiresAt) {
                const diff = Math.ceil((+expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
                dias = diff > 0 ? ` • expira em ${diff} dia${diff > 1 ? "s" : ""}` : " • expirada";
            }
            texto = `Conta Teste${dias}`;
        } else if (plano) {
            const label = plano.charAt(0).toUpperCase() + plano.slice(1);
            texto = `Conta ${label}`;
        } else {
            texto = "Conta Ativa";
        }
        accountInfo.innerHTML = `<span>${texto}</span>`;
    }
    
    if (userProfile && crown) {
        const plano = (userData?.plano || "").toLowerCase();
        if (plano && plano !== "teste") userProfile.classList.add("premium");
        else userProfile.classList.remove("premium");
    }
}

async function carregarSecao(nome) {
    try {
        const resposta = await fetch(`./sections/${nome}.html`);
        const html = await resposta.text();
        mainContent.innerHTML = html;

        if (nome === "cadastro") {
            import("./sections/cadastro.js").then(mod => {
                mod.registrationSettingsFunctions();
            });
        };

        if (nome === "pacientes") {
            import("./sections/pacientes.js").then(mod => {
                mod.editingSettingsFunctions();
            });
        }

        if (nome === "perfil") {
            import("./sections/perfil.js").then(mod => {
                mod.perfilSettingsFunctions();
            });
        }

    } catch (erro) {
        mainContent.innerHTML = `<p>Erro ao carregar a seção: ${nome}</p>`;
        console.error(erro);
    };
};

// Inicializa header com dados do usuário assim que houver autenticação
(async function initHeader() {
    try {
        const { auth, onAuthStateChanged, db, doc, getDoc } = await import("../../config/firebase/firebase-config.js");
        onAuthStateChanged(auth, async (user) => {
            if (!user) return;
            try {
                const ref = doc(db, "users", user.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) renderHeaderProfile(snap.data());
            } catch {}
        });
        // Reage a atualizações do perfil vindas da seção Perfil
        window.addEventListener("profile:updated", (e) => {
            renderHeaderProfile(e.detail?.userData || {});
        });
    } catch (e) {
        console.warn("Falha ao inicializar header:", e);
    }
})();

const botoes = document.querySelectorAll(".dashboard-menu button");
const hamburgerBtn = document.getElementById('hamburger-btn');
const dashboardMenu = document.getElementById('dashboard-menu');

hamburgerBtn.addEventListener('click', () => {
    dashboardMenu.classList.toggle('open');
});

botoes.forEach((botao) => {
    const acao = botao.dataset.action;
    botao.addEventListener("click", () => {
        switch (acao) {
            case "evaluate-patient":
                carregarSecao("avaliar");
                break;
            case "register-patient":
                carregarSecao("cadastro");
                break;
            case "patients":
                carregarSecao("pacientes");
                break;
            case "generate-laudo":
                carregarSecao("laudo");
                break;
            case "delete-laudo":
                carregarSecao("excluir");
                break;
            case "generate-report":
                carregarSecao("relatorio");
                break;
            case "configuration":
                carregarSecao("configuracoes");
                break;
            case "profile":
                carregarSecao("perfil");
                break;
            case "logout":
                logout();
                break;
            default:
                alert("Função não implementada ainda.");
        };

        // Esconde o menu em telas pequenas após o clique
        if (window.innerWidth <= 768) {
            dashboardMenu.classList.remove('open');
        };
    });
});

// Fechar sistema
async function logout() {
    showCustomizableMessage({
        title: "Confirmação",
        message: "Deseja realmente fechar o sistema?",
        type: "info",
        buttons: [
            { label: "Sim", value: "sim", style: "success" },
            { label: "Não", value: "nao", style: "danger" }
        ]
    }).then(async result => {
        if (result === "sim") {
            // ação de confirmação
            try {
                const { auth, signOut } = await import("../../config/firebase/firebase-config.js");
                const { showLoading } = await import ("../../components/loading/loading.js");
                showLoading();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await signOut(auth);
                window.location.href = "../../../index.html";

            } catch (error) {
                console.error("Erro ao fazer logout:", error);
            };
        };
    });
};