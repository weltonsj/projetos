/**
 * Configura a exibição condicional de campos em um formulário, mostrando ou escondendo um elemento alvo
 * com base no valor de um elemento disparador (trigger). Injeta o CSS necessário automaticamente.
 *
 * @param {Object} options - Opções de configuração.
 * @param {HTMLElement|string} options.trigger - Elemento ou seletor CSS do campo que dispara a condição.
 * @param {HTMLElement|string} options.target - Elemento ou seletor CSS do campo que será mostrado/ocultado.
 * @param {Function} [options.condition] - Função que recebe o valor do trigger e retorna `true` para mostrar o target. Padrão: valor "truthy".
 * @param {string} [options.visibleClass="visible"] - Classe CSS opcional para indicar visibilidade (não utilizada diretamente, mas pode ser usada para customização).
 *
 * @example
 * // Exemplo 1: Mostrar um campo extra quando um checkbox estiver marcado
 * alternarMostrarElemento({
 *   trigger: "#meu-checkbox",
 *   target: "#campo-extra",
 *   condition: value => value === "on"
 * });
 *
 * @example
 * // Exemplo 2: Mostrar um campo quando um select tiver valor específico
 * alternarMostrarElemento({
 *   trigger: document.getElementById("meu-select"),
 *   target: document.querySelector(".campo-detalhe"),
 *   condition: value => value === "detalhe"
 * });
 *
 * @example
 * // Exemplo 3: Usando o padrão (mostra quando o trigger tem valor "truthy")
 * alternarMostrarElemento({
 *   trigger: "#input-nome",
 *   target: "#campo-sobrenome"
 * });
 */
export function alternarMostrarElemento({
    trigger,
    target,
    condition = value => !!value,
}) {
    // Injeta o CSS se ainda não estiver presente
    if (!document.getElementById("conditional-fields-css")) {
        const style = document.createElement("style");
        style.id = "conditional-fields-css";
        style.textContent = `
            .conditional-hide { display: none !important; }
            .conditional-show { display: block !important; grid-column: 1 / -1 !important; }
        `;
        document.head.appendChild(style);
    }

    // Resolve elementos
    const triggerEl = typeof trigger === "string" ? document.querySelector(trigger) : trigger;
    const targetEl = typeof target === "string" ? document.querySelector(target) : target;

    if (!triggerEl || !targetEl) return;

    // Inicialmente esconde
    targetEl.classList.remove("conditional-show");
    targetEl.classList.add("conditional-hide");

    // Handler para mostrar/ocultar
    function updateVisibility() {
        if (condition(triggerEl.value)) {
            targetEl.classList.add("conditional-show");
            targetEl.classList.remove("conditional-hide");
        } else {
            targetEl.classList.remove("conditional-show");
            targetEl.classList.add("conditional-hide");
        };
    };

    // Evento
    triggerEl.addEventListener("change", updateVisibility);

    // Inicializa
    updateVisibility();
};