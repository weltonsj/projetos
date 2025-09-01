// Carrega e popula o select de estados (UF)
async function popularEstados(select) {
    if (!select) return;
    select.innerHTML = '<option value="">Selecione o estado</option>';
    try {
        const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
        const estados = await res.json();
        estados.forEach(uf => {
            const opt = document.createElement("option");
            opt.value = uf.sigla;
            opt.textContent = uf.nome;
            select.appendChild(opt);
        });
    } catch (error) {
        select.innerHTML = '<option value="">Erro ao carregar estados</option>';
    };
};

// Carrega e popula o select de cidades de acordo com o UF selecionado
async function popularCidades(uf, select) {
    if (!select) return;
    select.innerHTML = '<option value="">Selecione a cidade</option>';
    if (!uf) return;
    try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        const cidades = await res.json();
        cidades.forEach(cidade => {
            const opt = document.createElement("option");
            opt.value = cidade.nome;
            opt.textContent = cidade.nome;
            select.appendChild(opt);
        });
    } catch (error) {
        select.innerHTML = '<option value="">Erro ao carregar cidades</option>';
    };
};

// Inicializa todos os pares de selects de estado/cidade do formulário
function inicializarEstadosECidades(form = document) {
    const estados = form.querySelectorAll(".estadoSelect");
    const cidades = form.querySelectorAll(".cidadeSelect");
    const ufs = form.querySelectorAll(".ufSelect"); // Pega todos os campos UF

    estados.forEach((estadoSelect, idx) => {
        popularEstados(estadoSelect);
        estadoSelect.addEventListener("change", function () {
            popularCidades(this.value, cidades[idx]);
            // Preenche o campo UF correspondente, se existir
            if (ufs[idx]) ufs[idx].value = this.value || "";
        });
        // Opcional: limpa cidades ao trocar o estado
        if (cidades[idx]) cidades[idx].innerHTML = '<option value="">Selecione a cidade</option>';
        // Preenche o campo UF ao carregar, se já houver valor selecionado
        if (ufs[idx]) ufs[idx].value = estadoSelect.value || "";
    });
};

export { popularEstados, popularCidades, inicializarEstadosECidades };