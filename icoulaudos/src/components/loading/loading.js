/**
 * Exibe uma sobreposição de carregamento (loading) na tela, bloqueando a interação do usuário
 * enquanto algum processo está em andamento. Caso a folha de estilos `loading.css` ainda não esteja
 * carregada, ela será adicionada automaticamente ao `<head>`. Se o overlay já estiver presente, a função não faz nada.
 *
 * @example
 * // Exibe o loading enquanto uma requisição é feita
 * showLoading();
 * fetch('/api/dados')
 *   .then(response => response.json())
 *   .finally(() => hideLoading());
 *
 * @example
 * // Exibe o loading durante o processamento de dados
 * showLoading();
 * processarDadosPesados().then(() => {
 *   hideLoading();
 * });
 *
 * @function
 */
function showLoading() {
    // Carrega automaticamente o loading.css se ainda não estiver carregado
    if (!document.getElementById("loading-css")) {
        const link = document.createElement("link");
        link.id = "loading-css";
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = "/src/components/loading/loading.css";
        document.head.appendChild(link);
    }

    if (document.getElementById("loading-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.id = "loading-overlay";
    overlay.innerHTML = `<div class="loading-spinner"></div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
}

function hideLoading() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.remove();
    document.body.style.overflow = "";
}

export { showLoading, hideLoading };