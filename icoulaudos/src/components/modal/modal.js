/**
 * Exibe um modal de alerta customizável na tela.
 *
 * O modal pode ser utilizado para mostrar mensagens de aviso, erro ou sucesso ao usuário,
 * permitindo a configuração de título, mensagem, tipo e botões personalizados.
 * O HTML e CSS necessários são carregados automaticamente na primeira chamada.
 *
 * @param {Object} [options={}] - Opções para customizar o modal.
 * @param {string} [options.title="Aviso"] - Título exibido no cabeçalho do modal.
 * @param {string} [options.message=""] - Mensagem ou conteúdo HTML exibido no corpo do modal.
 * @param {("info"|"error"|"success")} [options.type="info"] - Tipo do modal, que altera a cor do cabeçalho.
 * @param {Array<{label: string, value: string, style: ("info"|"danger"|"success")}>} [options.buttons=[{ label: "OK", value: "ok", style: "info" }]] - Lista de botões exibidos no rodapé do modal.
 * @returns {Promise<string>} Uma Promise que resolve com o valor do botão clicado ou "close" se o modal for fechado.
 *
 * @example
 * // Exemplo 1: Modal de sucesso simples
 * showCustomizableMessage({
 *   title: "Sucesso",
 *   message: "Operação realizada com êxito!",
 *   type: "success"
 * }).then(result => {
 *   console.log(result); // "ok"
 * });
 *
 * @example
 * // Exemplo 2: Modal de confirmação com botões personalizados
 * showCustomizableMessage({
 *   title: "Confirmação",
 *   message: "Deseja realmente excluir este item?",
 *   type: "error",
 *   buttons: [
 *     { label: "Cancelar", value: "cancel", style: "info" },
 *     { label: "Excluir", value: "delete", style: "danger" }
 *   ]
 * }).then(result => {
 *   if (result === "delete") {
 *     // Executa ação de exclusão
 *   }
 * });
 *
 * @example
 * // Exemplo 3: Modal padrão (tipo info)
 * showCustomizableMessage({
 *   message: "Você tem certeza que deseja sair?"
 * });
 */
function showCustomizableMessage({
    title = "Aviso",
    message = "",
    type = "info",
    buttons = [{ label: "OK", value: "ok", style: "info" }]
} = {}) {
    return new Promise((resolve) => {
        // Adiciona HTML do modal se não existir
        if (!document.getElementById("modal-alerta")) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "/src/components/modal/modal.css";
            document.head.appendChild(link);

            fetch("/src/components/modal/modal.html")
                .then(res => res.text())
                .then(html => {
                    document.body.insertAdjacentHTML("beforeend", html);
                    _show();
                });
        } else {
            _show();
        }

        function _show() {
            const overlay = document.getElementById("modal-alerta");
            const titleEl = document.getElementById("modal-alerta-title");
            const bodyEl = document.getElementById("modal-alerta-body");
            const footer = overlay.querySelector(".modal-alerta-footer");
            const closeBtn = document.getElementById("modal-alerta-close");

            titleEl.textContent = title;
            bodyEl.innerHTML = message;

            // Limpa e adiciona botões dinâmicos
            footer.innerHTML = "";
            buttons.forEach((btn, idx) => {
                const button = document.createElement("button");
                button.textContent = btn.label;
                button.className = btn.style === "danger" ? "modal-btn-danger" : btn.style === "success" ? "modal-btn-success" : "modal-btn-info";
                button.tabIndex = 0;
                button.onclick = () => {
                    overlay.style.display = "none";
                    resolve(btn.value);
                };
                footer.appendChild(button);
                if (idx === 0) setTimeout(() => button.focus(), 10);
            });

            overlay.style.display = "flex";

            // Cor do header por tipo
            const header = overlay.querySelector('.modal-alerta-header');
            if (type === "error") header.style.background = "var(--danger-color), #c0392b";
            else if (type === "success") header.style.background = "var(--success-color), #44d99d";
            else header.style.background = "var(--info-color, #1E4D6B)";

            function closeModal() {
                overlay.style.display = "none";
                resolve("close");
            }

            closeBtn.onclick = closeModal;
            overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
            document.onkeydown = (e) => {
                if (overlay.style.display === "flex" && e.key === "Escape") {
                    closeModal();
                }
            };
        };
    });
};

/**
 * Valida campos obrigatórios de um formulário e exibe uma mensagem personalizada caso algum campo não esteja preenchido.
 *
 * @async
 * @function fieldFilterWithMessageCustom
 * @param {Object} params - Parâmetros da função.
 * @param {string} params.idForm - ID do elemento <form> no DOM que será validado.
 * @param {Array<{name: string, label: string}>} params.fieldsRequired - Lista de campos obrigatórios, cada um com o nome do input e o rótulo a ser exibido na mensagem.
 * @returns {Promise<void>} Retorna uma Promise que é resolvida após a validação e exibição da mensagem (caso necessário).
 *
 * @description
 * Esta função percorre os campos obrigatórios especificados e verifica se estão preenchidos no formulário identificado por `idForm`.
 * Se algum campo estiver vazio, exibe uma mensagem de aviso personalizada utilizando a função `showCustomizableMessage`.
 * Após o usuário fechar a mensagem, o foco é direcionado para o campo que precisa ser preenchido.
 * A validação é interrompida ao encontrar o primeiro campo vazio.
 *
 * @example
 * // Exemplo de uso:
 * fieldFilterWithMessageCustom({
 *   idForm: "meuFormulario",
 *   fieldsRequired: [
 *     { name: "nome", label: "Nome Completo" },
 *     { name: "email", label: "E-mail" }
 *   ]
 * });
 *
 * @example
 * // Em um evento de submit:
 * document.getElementById("meuFormulario").addEventListener("submit", async (e) => {
 *   e.preventDefault();
 *   await fieldFilterWithMessageCustom({
 *     idForm: "meuFormulario",
 *     fieldsRequired: [
 *       { name: "usuario", label: "Usuário" },
 *       { name: "senha", label: "Senha" }
 *     ]
 *   });
 *   // Continue com o envio se todos os campos estiverem preenchidos
 * });
 */
async function fieldFilterWithMessageCustom({
    idForm = "",
    fieldsRequired = [{ name: "", label: "" }],
}) {
    const form = document.getElementById(idForm);
    if (!form) return false;

    const formDataEdit = new FormData(form);

    for (const campo of fieldsRequired) {
        const valorCampo = formDataEdit.get(campo.name);
        if (!valorCampo || valorCampo.trim() === "") {
            await showCustomizableMessage({
                title: "⚠️ Aviso Campo obrigatório",
                message: `O campo <b>${campo.label}</b> deve ser preenchido.`,
                type: "warning",
                buttons: [
                    { label: "OK", value: "OK", style: "warning" }
                ]
            });
            const input = form.querySelector(`[name="${campo.name}"]`);
            if (input) input.focus();
            return false; // <-- Pare a validação e retorne false
        }
    }
    return true; // <-- Todos os campos obrigatórios preenchidos
};

export { fieldFilterWithMessageCustom, showCustomizableMessage };