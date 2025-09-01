import { db, doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "../../../config/firebase/firebase-config.js";
import { fieldFilterWithMessageCustom, showCustomizableMessage } from "../../../components/modal/modal.js";
import { alternarMostrarElemento } from "../../../utils/toggleElementsShow.js";
import { inicializarEstadosECidades } from "../../../utils/loadingCitiesInStates.js";
import { capitalizeWords, maskCPF, maskRG, maskOrgaoEmissor, maskTelefone, maskCEP } from "../../../utils/masks.js";
import { showLoading, hideLoading } from "../../../components/loading/loading.js";
import html2pdf from "html2pdf.js";

function editingSettingsFunctions() {
    alternarMostrarElemento({ trigger: "#tipoLaudo", target: ".fieldsHideShow", condition: value => value && value !== "" });
    alternarMostrarElemento({ trigger: "#nomeProfissional", target: ".showDataPersonal", condition: value => value !== "" });
    alternarMostrarElemento({ trigger: "#nomeClinica", target: ".showClinicalData", condition: value => value !== "" });
    alternarMostrarElemento({ trigger: "#resultadoAvaliacao", target: ".campoRestricoes", condition: value => value === "Apto com restrições" });

    inicializarEstadosECidades();

    const formBusca = document.getElementById("form-busca-paciente");
    const formEditar = document.getElementById("form-editar-paciente");
    const campoBusca = document.getElementById("campoBusca");
    const listaPacientes = document.getElementById("listaPacientes");
    const h2Title = document.getElementById("titleH2");
    const pTitle = document.querySelector(".section-main > p");
    const h2Principal = document.getElementById("h2-principal");
    const pPrincipal = document.getElementById("p-principal");
    const h2Editar = document.getElementById("h2-editar");
    const pEditar = document.getElementById("p-editar");
    const formEditarPacienteBtns = document.getElementById("form-editar-paciente-btns");

    // mantém a última lista carregada para impressão
    let ultimaListaPacientes = [];

    // Função para mostrar/ocultar cabeçalho
    function setHeaderVisible(visible) {
        if (h2Title) h2Title.style.display = visible ? "" : "none";
        if (pTitle) pTitle.style.display = visible ? "" : "none";
    }

    // foco no campo de busca quando disponível
    if (campoBusca) campoBusca.focus();

    // Máscaras e capitalização nos campos do formulário de edição
    function aplicarMascarasEditar() {
        const cpfInput = formEditar.querySelector('input[name="cpf"]');
        const rgInput = formEditar.querySelector('input[name="rg"]');
        const orgaoEmissorInput = formEditar.querySelector('input[name="orgaoEmissor"]');
        const telefoneInput = formEditar.querySelector('input[name="telefone"]');
        const telefoneAdicionalInput = formEditar.querySelector('input[name="telefoneAdicional"]');
        const cepInput = formEditar.querySelector('input[name="cep"]');

        if (cpfInput) cpfInput.addEventListener("input", e => e.target.value = maskCPF(e.target.value));
        if (rgInput) rgInput.addEventListener("input", e => e.target.value = maskRG(e.target.value));
        if (orgaoEmissorInput) orgaoEmissorInput.addEventListener("input", e => e.target.value = maskOrgaoEmissor(e.target.value));
        if (telefoneInput) telefoneInput.addEventListener("input", e => e.target.value = maskTelefone(e.target.value));
        if (telefoneAdicionalInput) telefoneAdicionalInput.addEventListener("input", e => e.target.value = maskTelefone(e.target.value));
        if (cepInput) cepInput.addEventListener("input", e => e.target.value = maskCEP(e.target.value));

        // Capitalização automática para campos de Dados Pessoais e Endereço
        const camposCapitalizar = [
            'nomeCompleto', 'nomeMae', 'nomePai', 'bairroEndereco', 'rua', 'cidadeEndereco', 'cidadeNaturalidade', 'nacionalidade'
        ];

        camposCapitalizar.forEach(name => {
            const input = formEditar.querySelector(`[name="${name}"]`);
            if (input) {
                input.addEventListener("input", e => {
                    const cursor = e.target.selectionStart;
                    e.target.value = capitalizeWords(e.target.value);
                    e.target.setSelectionRange(cursor, cursor);
                });
            }
        });
    }

    function alternarCabecalhos(editarAtivo) {
        if (h2Principal) h2Principal.style.display = editarAtivo ? "none" : "";
        if (pPrincipal) pPrincipal.style.display = editarAtivo ? "none" : "";
        if (h2Editar) h2Editar.style.display = editarAtivo ? "" : "none";
        if (pEditar) pEditar.style.display = editarAtivo ? "" : "none";
        // Exibe ou oculta os botões de ação da edição
        if (formEditarPacienteBtns) formEditarPacienteBtns.style.display = editarAtivo ? "flex" : "none";
    }

    // Chame ao abrir o formulário de edição
    function abrirEdicao(paciente, pacienteId) {
        // oculta a lista e o cabeçalho de pesquisa
        if (formBusca) formBusca.classList.add("hidden-search");
        listaPacientes.innerHTML = "";
        listaPacientes.style.display = "none";
        setHeaderVisible(false); // Oculta h2 e p

        preencherFormularioEdicao(paciente);
        formEditar.dataset.pacienteId = pacienteId;
        formEditar.style.display = "";
        // scrollear até o formulário de edição
        setTimeout(() => {
            formEditar.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        aplicarMascarasEditar();
        alternarCabecalhos(true);

        // Oculta o botão imprimir lista
        const btnImprimirLista = document.getElementById("btnImprimirLista");
        if (btnImprimirLista) btnImprimirLista.style.display = "none";
    }

    formEditar.style.display = "none";
    listaPacientes.innerHTML = "";

    // Busca paciente
    formBusca.addEventListener("submit", async (e) => {
        e.preventDefault();
        listaPacientes.innerHTML = "";
        // garante que o formulário de edição esteja oculto ao pesquisar
        formEditar.style.display = "none";
        if (formBusca) formBusca.classList.remove("hidden-search");
        showLoading();

        const valorBusca = campoBusca.value.trim();
        if (!valorBusca) {
            hideLoading();
            // Exibe mensagem na área da lista indicando que o campo está vazio
            if (listaPacientes) {
                listaPacientes.innerHTML = "<p style='padding:1rem; font-size: 0.75rem;'>Nenhum resultado encontrado. Por favor, informe um ID, Nome ou CPF válido para realizar a busca corretamente.</p>";
                listaPacientes.style.display = "";
            }
            showCustomizableMessage({ title: "Busca vazia", message: "Digite um valor para buscar.", type: "warning" })
                .then(() => {
                    if (campoBusca) campoBusca.focus();
                });
            return;
        }

        // Obtenha o usuário logado
        const user = (await import("../../../config/firebase/firebase-config.js")).auth.currentUser;
        if (!user) {
            hideLoading();
            showCustomizableMessage({ title: "Erro", message: "Usuário não autenticado.", type: "error" });
            return;
        }

        // Detecta tipo de busca
        const isId = /^\d+$/.test(valorBusca);
        const cpfLimpo = valorBusca.replace(/\D/g, "");
        const isCpf = cpfLimpo.length === 11;

        try {
            // 1. Busca por ID
            if (isId) {
                const qId = query(
                    collection(db, "pacientes"),
                    where("profissionalId", "==", user.uid),
                    where("pacienteId", "==", Number(valorBusca))
                );
                const snapId = await getDocs(qId);
                if (!snapId.empty) {
                    const docRef = snapId.docs[0];
                    abrirEdicao(docRef.data(), docRef.id);
                    hideLoading();
                    return;
                }
            }
            // 2. Busca por CPF
            if (isCpf) {
                const qCpf = query(
                    collection(db, "pacientes"),
                    where("profissionalId", "==", user.uid),
                    where("cpf", "==", cpfLimpo)
                );
                const snapCpf = await getDocs(qCpf);
                if (!snapCpf.empty) {
                    const docRef = snapCpf.docs[0];
                    abrirEdicao(docRef.data(), docRef.id);
                    hideLoading();
                    return;
                }
            }
            // 3. Busca por nome (parcial, case-insensitive)
            if (valorBusca.length < 2) {
                hideLoading();
                showCustomizableMessage({ title: "Busca por nome", message: "Digite pelo menos 2 letras do nome para buscar.", type: "info" })
                    .then(() => {
                        if (campoBusca) campoBusca.focus();
                    });
                return;
            }
            const q = query(
                collection(db, "pacientes"),
                where("profissionalId", "==", user.uid)
            );
            const snap = await getDocs(q);
            const termo = valorBusca.toLowerCase();
            const encontrados = [];
            snap.forEach(docSnap => {
                const p = docSnap.data();
                if (p.nomeCompleto && p.nomeCompleto.toLowerCase().includes(termo)) {
                    encontrados.push({ ...p, _id: docSnap.id });
                }
            });
            if (encontrados.length === 0) return notFound();
            if (encontrados.length === 1) {
                abrirEdicao(encontrados[0], encontrados[0]._id);
            } else {
                renderTabelaPacientes(encontrados);
            }
        } catch (error) {
            showCustomizableMessage({ title: "Erro", message: "Erro ao buscar paciente.", type: "error" });
        } finally {
            hideLoading();
        }
    });

    function notFound() {
        // Mostra mensagem amigável no espaço da tabela
        if (listaPacientes) {
            listaPacientes.innerHTML = "<p style='padding:1rem; font-size: 0.75rem;'>Nenhum paciente encontrado para o termo informado.</p>";
            listaPacientes.style.display = "";
        }
        showCustomizableMessage({ title: "Não encontrado", message: "Nenhum paciente encontrado.", type: "info" })
            .then(() => {
                if (campoBusca) campoBusca.focus();
            });
        formEditar.style.display = "none";
        if (formBusca) formBusca.classList.remove("hidden-search");
    }

    // Função para formatar datas no padrão nacional (dd/mm/aaaa)
    function formatarDataNacional(data) {
        if (!data) return "-";
        // Aceita formatos ISO ou yyyy-mm-dd
        let partes;
        if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
            partes = data.split("-");
            return `${partes[2].substring(0,2)}/${partes[1]}/${partes[0]}`;
        }
        // Se já estiver no formato nacional, retorna como está
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
        return data;
    }

    // 1. Listar todos os pacientes ao abrir a seção
    async function listarTodosPacientes() {
        showLoading();
        try {
            const user = (await import("../../../config/firebase/firebase-config.js")).auth.currentUser;
            if (!user) {
                hideLoading();
                return;
            }
            const q = query(collection(db, "pacientes"), where("profissionalId", "==", user.uid));
            const snap = await getDocs(q);
            const pacientes = [];
            snap.forEach(docSnap => {
                pacientes.push({ ...docSnap.data(), _id: docSnap.id });
            });
            // armazena para impressão posterior
            ultimaListaPacientes = pacientes.slice();
            if (pacientes.length === 0) {
                listaPacientes.innerHTML = "<p style='padding:1rem;'>Nenhum paciente cadastrado.</p>";
                listaPacientes.style.display = "";
            } else {
                renderTabelaPacientes(pacientes);
            }
        } catch (error) {
            listaPacientes.innerHTML = "<p style='padding:1rem;color:red;'>Erro ao carregar pacientes.</p>";
        } finally {
            hideLoading();
        }
    }

    // Chame ao abrir a seção
    listarTodosPacientes();

    // 3. Botão para imprimir dados de um paciente (na tabela) - A4 retrato, apenas campos relevantes
    function renderTabelaPacientes(pacientes) {
        // mantém referência para impressão de lista
        ultimaListaPacientes = pacientes.slice();
         let html = `<table class="table-pacientes">
         <colgroup>
             <col class="col-id">
             <col class="col-nome">
             <col class="col-cpf">
             <col class="col-mae">
             <col class="col-data-nasc">
             <col class="col-telefone">
             <col class="col-cidade">
             <col class="col-profissao">
             <col class="col-status">
             <col class="col-acoes">
         </colgroup>
         <thead>
             <tr>
                 <th>ID</th>
                 <th>Nome</th>
                 <th>CPF</th>
                 <th>Mãe</th>
                 <th>Data Nasc.</th>
                 <th>Telefone</th>
                 <th>Cidade</th>
                 <th>Profissão</th>
                 <th>Status</th>
                 <th>Ações</th>
             </tr>
         </thead>
         <tbody>`;
        pacientes.forEach(p => {
            html += `<tr>
            <td data-label="ID">${p.pacienteId || "-"}</td>
            <td data-label="Nome">${p.nomeCompleto || "-"}</td>
            <td data-label="CPF">${p.cpf ? maskCPF(p.cpf) : "-"}</td>
            <td data-label="Mãe">${p.nomeMae || "-"}</td>
            <td data-label="Data Nasc.">${formatarDataNacional(p.dataNascimento) || "-"}</td>
            <td data-label="Telefone">${p.telefone || "-"}</td>
            <td data-label="Cidade">${p.cidadeEndereco || "-"}</td>
            <td data-label="Profissão">${p.profissao || "-"}</td>
            <td data-label="Status">${p.status || "-"}</td>
            <td data-label="Ações">
                <button class="btn-edit" data-id="${p._id}" title="Editar">✏️</button>
                <button class="btn-print" data-id="${p._id}" title="Imprimir">🖨️</button>
                <button class="btn-delete" data-id="${p._id}" title="Excluir">🗑️</button>
            </td>
            </tr>`;
        });
        html += "</tbody></table>";
        listaPacientes.innerHTML = html;
        listaPacientes.style.display = "";
        formEditar.style.display = "none";
        if (formBusca) formBusca.classList.remove("hidden-search");

        // Eventos dos botões (editar/excluir/imprimir)
        listaPacientes.querySelectorAll(".btn-edit").forEach(btn => {
            btn.addEventListener("click", async () => {
                showLoading();
                const docRef = await getDoc(doc(db, "pacientes", btn.dataset.id));
                if (docRef.exists()) {
                    abrirEdicao(docRef.data(), docRef.id);
                }
                hideLoading();
            });
        });

        // No renderTabelaPacientes, ajuste o evento do botão imprimir individual:
        listaPacientes.querySelectorAll(".btn-print").forEach(btn => {
            btn.removeEventListener("click", btn._imprimirPacienteHandler);
            btn._imprimirPacienteHandler = async function () {
                showLoading();
                try {
                    const docRef = await getDoc(doc(db, "pacientes", btn.dataset.id));
                    if (docRef.exists()) {
                        await gerarPdfPacienteIndividual(docRef.data());
                    }
                } catch (err) {
                    alert("Erro ao imprimir paciente.");
                } finally {
                    hideLoading();
                }
            };
            btn.addEventListener("click", btn._imprimirPacienteHandler);
        });

        listaPacientes.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", async () => {
                const confirm = await showCustomizableMessage({
                    title: "Confirmação",
                    message: "Tem certeza que deseja excluir este paciente? Esta ação não poderá ser desfeita.",
                    type: "warning",
                    buttons: [
                        { label: "Cancelar", value: "cancel", style: "secondary" },
                        { label: "Excluir", value: "delete", style: "danger" }
                    ]
                });
                if (confirm !== "delete") return;
                showLoading();
                await deleteDoc(doc(db, "pacientes", btn.dataset.id));
                btn.closest("tr").remove();
                hideLoading();
            });
        });
        formEditar.style.display = "none";
    }

    // Função para imprimir dados de um paciente (A4 portrait) - campos relevantes e formatação "Campo: Valor"
    function imprimirPaciente(paciente) {
        // Definir campos relevantes e rótulos amigáveis (ordem desejada)
        const campos = [
            { key: 'pacienteId', label: 'ID' },
            { key: 'nomeCompleto', label: 'Nome Completo' },
            { key: 'nomeMae', label: 'Mãe' },
            { key: 'nomePai', label: 'Pai' },
            { key: 'dataNascimento', label: 'Data de Nascimento', format: v => formatarDataNacional(v) },
            { key: 'cpf', label: 'CPF', format: v => v ? maskCPF(v) : '-' },
            { key: 'rg', label: 'RG' },
            { key: 'sexo', label: 'Sexo' },
            { key: 'estadoCivil', label: 'Estado Civil' },
            { key: 'telefone', label: 'Telefone' },
            { key: 'telefoneAdicional', label: 'Telefone Adicional' },
            { key: 'email', label: 'E-mail' },
            { key: 'rua', label: 'Rua' },
            { key: 'numero', label: 'Número' },
            { key: 'bairroEndereco', label: 'Bairro' },
            { key: 'cidadeEndereco', label: 'Cidade' },
            { key: 'cep', label: 'CEP' },
            { key: 'profissao', label: 'Profissão' },
            { key: 'tipoLaudo', label: 'Tipo de Laudo' },
            { key: 'motivoAvaliacao', label: 'Motivo da Avaliação' },
            { key: 'dataAvaliacao', label: 'Data da Avaliação', format: v => formatarDataNacional(v) },
            { key: 'resultadoAvaliacao', label: 'Resultado da Avaliação' },
            { key: 'observacoesAdicionais', label: 'Observações' },
            { key: 'nomeProfissional', label: 'Profissional' },
            { key: 'crpProfissional', label: 'CRP' },
            { key: 'nomeClinica', label: 'Clínica' }
        ];

        const styles = `
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: Arial, Helvetica, sans-serif; color:#111; font-size:13px; line-height:1.4; }
            h2 { text-align: center; margin-bottom: 6px; }
            .field { margin: 6px 0; }
            .field strong { display:inline-block; width: 190px; font-weight:700; }
            /* sem bordas conforme requisito */
            table, th, td { border: none; }
            /* garante que cada campo esteja em linha separada como no formulário */
        `;

        let html = `<html><head><meta charset="utf-8"><title>Dados do Paciente</title><style>${styles}</style></head><body>`;
        html += `<h2>Dados do Paciente</h2>`;
        html += `<div>`;
        campos.forEach(c => {
            // ignora campos inexistentes ou irrelevantes
            const valor = paciente[c.key];
            if (typeof valor === 'undefined' || valor === null || valor === '') return;
            const display = c.format ? c.format(valor) : valor;
            html += `<p class="field"><strong>${c.label}:</strong> ${display}</p>`;
        });
        html += `</div></body></html>`;

        const printWindow = window.open('', '_blank', 'noopener');
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        // printWindow.close();
    }

    // Salvar edição
    formEditar.addEventListener("submit", async (e) => {
        e.preventDefault();
        showLoading();

        const pacienteId = formEditar.dataset.pacienteId;
        if (!pacienteId) {
            showCustomizableMessage({ title: "Erro", message: "Paciente não identificado.", type: "error" });
            hideLoading();
            return;
        }

        // Validação dos campos obrigatórios
        const valid = await fieldFilterWithMessageCustom({
            idForm: "form-editar-paciente",
            fieldsRequired: [
                { name: "nomeCompleto", label: "Nome completo" },
                { name: "nomeMae", label: "Mãe" },
                { name: "sexo", label: "Sexo" },
                { name: "estadoCivil", label: "Estado civil" },
                { name: "dataNascimento", label: "Data de nascimento" },
                { name: "rg", label: "RG (Identidade)" },
                { name: "orgaoEmissor", label: "Órgão emissor" },
                { name: "cpf", label: "CPF" },
                { name: "escolaridade", label: "Escolaridade" },
                { name: "raca", label: "Raça/Cor" },
                { name: "nacionalidade", label: "Nacionalidade" },
                { name: "estadoNaturalidade", label: "Estado de Naturalidade" },
                { name: "cidadeNaturalidade", label: "Cidade de Naturalidade" },
                { name: "rua", label: "Rua / Logradouro" },
                { name: "numero", label: "Número" },
                { name: "bairroEndereco", label: "Bairro" },
                { name: "estadoEndereco", label: "Estado" },
                { name: "cidadeEndereco", label: "Cidade" },
                { name: "cep", label: "CEP" },
                { name: "telefone", label: "Telefone" }
            ]
        });
        
        if (!valid) {
            hideLoading();
            return; // <-- Não prossegue se não for válido
        }

        const formData = new FormData(formEditar);
        const dadosAtualizados = {};
        formData.forEach((value, key) => {
            dadosAtualizados[key] = value;
        });

        try {
            await updateDoc(doc(db, "pacientes", pacienteId), dadosAtualizados);
            showCustomizableMessage({ title: "Sucesso", message: "Paciente atualizado com sucesso!", type: "success" });
            listarTodosPacientes();
            // reset estado: ocultar formulário de edição, limpar lista e mostrar busca novamente
            formEditar.style.display = "none";
            formEditar.reset();
            if (formBusca) {
                formBusca.classList.remove("hidden-search");
                formBusca.reset();
            }
            listaPacientes.innerHTML = "";
            listaPacientes.style.display = "none";
            setHeaderVisible(true); // Mostra h2 e p novamente
        } catch (error) {
            showCustomizableMessage({ title: "Erro", message: "Erro ao salvar edição.", type: "error" });
        } finally {
            hideLoading();
            alternarCabecalhos(false);
            // Mostra o botão imprimir lista
            const btnImprimirLista = document.getElementById("btnImprimirLista");
            if (btnImprimirLista) btnImprimirLista.style.display = "";
            
        }
    });

    // Cancelar edição
    document.getElementById("btnCancelarEdicao").addEventListener("click", async (e) => {
        e.preventDefault();
        formEditar.style.display = "none";
        formEditar.reset();
        if (formEditarPacienteBtns) formEditarPacienteBtns.style.display = "none";
        if (formBusca) {
            formBusca.classList.remove("hidden-search");
            formBusca.reset();
        }
        listaPacientes.innerHTML = "";
        listaPacientes.style.display = "none";
        setHeaderVisible(true);
        alternarCabecalhos(false);

        // Mostra o botão imprimir lista
        const btnImprimirLista = document.getElementById("btnImprimirLista");
        if (btnImprimirLista) btnImprimirLista.style.display = "";

        // Recarrega a tabela de pacientes
        await listarTodosPacientes();
    });

    // Excluir paciente no formulário de edição
    document.getElementById("btnExcluirPaciente").addEventListener("click", async (e) => {
        e.preventDefault();
        const pacienteId = formEditar.dataset.pacienteId;
        if (!pacienteId) return;

        const confirm = await showCustomizableMessage({
            title: "Confirmação",
            message: "Tem certeza que deseja excluir este paciente? Esta ação não poderá ser desfeita.",
            type: "warning",
            buttons: [
                { label: "Cancelar", value: "cancel", style: "secondary" },
                { label: "Excluir", value: "delete", style: "danger" }
            ]
        });

        if (confirm !== "delete") return;

        showLoading();
        try {
            await deleteDoc(doc(db, "pacientes", pacienteId));
            showCustomizableMessage({ title: "Excluído", message: "Paciente excluído com sucesso.", type: "success" });
            formEditar.style.display = "none";
            formEditar.reset();
            if (formBusca) {
                formBusca.classList.remove("hidden-search");
                formBusca.reset();
            }
            listaPacientes.innerHTML = "";
            listaPacientes.style.display = "none";
            setHeaderVisible(true); // Mostra h2 e p novamente
        } catch (error) {
            showCustomizableMessage({ title: "Erro", message: "Erro ao excluir paciente.", type: "error" });
        } finally {
            hideLoading();
            alternarCabecalhos(false);
            // Mostra o botão imprimir lista
            const btnImprimirLista = document.getElementById("btnImprimirLista");
            if (btnImprimirLista) btnImprimirLista.style.display = "";
        }
    });

    // Função de impressão da lista (declarada fora para referência)
    async function handleImprimirLista() {
        if (!ultimaListaPacientes || ultimaListaPacientes.length === 0) return;
        await gerarPdfListaPacientes(ultimaListaPacientes);
    }

    // Remova e adicione o evento de forma segura
    const btnImprimirLista = document.getElementById("btnImprimirLista");
    if (btnImprimirLista) {
        btnImprimirLista.removeEventListener("click", handleImprimirLista);
        btnImprimirLista.addEventListener("click", handleImprimirLista);
    }

    // Função para gerar PDF da lista de pacientes e imprimir direto
    async function gerarPdfListaPacientes(pacientes) {
        const columns = ['ID','Nome','CPF','Mãe','Data Nasc.','Telefone','Cidade','Profissão','Status'];
        let html = `<h2 style="text-align:center;margin-bottom:8px;">Lista de Pacientes</h2>`;
        html += `<table style="width:100%;font-size:12px;border:none;border-collapse:collapse;">
            <thead>
                <tr>${columns.map(c => `<th style="padding:6px 8px;text-align:left;background:#f5f5f5;font-weight:700;border:none;">${c}</th>`).join('')}</tr>
            </thead>
            <tbody>`;
        pacientes.forEach(p => {
            html += `<tr>
                <td style="padding:6px 8px;border:none;">${p.pacienteId ?? '-'}</td>
                <td style="padding:6px 8px;border:none;">${p.nomeCompleto ?? '-'}</td>
                <td style="padding:6px 8px;border:none;">${p.cpf ? maskCPF(p.cpf) : '-'}</td>
                <td style="padding:6px 8px;border:none;">${p.nomeMae ?? '-'}</td>
                <td style="padding:6px 8px;border:none;">${formatarDataNacional(p.dataNascimento) ?? '-'}</td>
                <td style="padding:6px 8px;border:none;">${p.telefone ?? '-'}</td>
                <td style="padding:6px 8px;border:none;">${p.cidadeEndereco ?? '-'}</td>
                <td style="padding:6px 8px;border:none;">${p.profissao ?? '-'}</td>
                <td style="padding:6px 8px;border:none;">${p.status ?? '-'}</td>
            </tr>`;
        });
        html += `</tbody></table>`;

        const container = document.getElementById("print-lista-pacientes");
        container.innerHTML = html;
        container.style.display = "block";

        const opt = {
            margin: 0.5,
            filename: 'lista-pacientes.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'landscape' }
        };

        // Gera o PDF como blob e abre para impressão
        try {
            const worker = html2pdf().set(opt).from(container);
            const pdfBlob = await worker.outputPdf('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);

            // Abre em nova aba e imprime automaticamente
            const printWindow = window.open(blobUrl, '_blank');
            if (printWindow) {
                printWindow.onload = function () {
                    printWindow.focus();
                    printWindow.print();
                };
            }
        } catch (err) {
            alert("Erro ao gerar PDF para impressão.");
        } finally {
            container.style.display = "none";
        }
    }

    // Função para gerar PDF individual e imprimir direto
    async function gerarPdfPacienteIndividual(paciente) {
        // Campos relevantes (ordem amigável)
        const campos = [
            { key: 'pacienteId', label: 'ID' },
            { key: 'nomeCompleto', label: 'Nome Completo' },
            { key: 'nomeMae', label: 'Mãe' },
            { key: 'nomePai', label: 'Pai' },
            { key: 'dataNascimento', label: 'Data de Nascimento', format: v => formatarDataNacional(v) },
            { key: 'cpf', label: 'CPF', format: v => v ? maskCPF(v) : '-' },
            { key: 'rg', label: 'RG' },
            { key: 'sexo', label: 'Sexo' },
            { key: 'estadoCivil', label: 'Estado Civil' },
            { key: 'telefone', label: 'Telefone' },
            { key: 'email', label: 'E-mail' },
            { key: 'rua', label: 'Rua' },
            { key: 'numero', label: 'Número' },
            { key: 'bairroEndereco', label: 'Bairro' },
            { key: 'cidadeEndereco', label: 'Cidade' },
            { key: 'cep', label: 'CEP' },
            { key: 'profissao', label: 'Profissão' },
            { key: 'tipoLaudo', label: 'Tipo de Laudo' },
            { key: 'motivoAvaliacao', label: 'Motivo da Avaliação' },
            { key: 'dataAvaliacao', label: 'Data da Avaliação', format: v => formatarDataNacional(v) },
            { key: 'resultadoAvaliacao', label: 'Resultado da Avaliação' },
            { key: 'observacoesAdicionais', label: 'Observações' },
            { key: 'nomeProfissional', label: 'Profissional' },
            { key: 'crpProfissional', label: 'CRP' },
            { key: 'nomeClinica', label: 'Clínica' }
        ];

        // Monta HTML sem bordas, formato "Campo: Valor" (uma linha por campo)
        const styles = `
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: Arial, Helvetica, sans-serif; color:#111; font-size:13px; line-height:1.4; }
            h2 { text-align: center; margin-bottom: 6px; }
            .field { margin: 6px 0; }
            .field strong { display:inline-block; width:180px; font-weight:700; }
            /* sem bordas */
        `;

        let html = `<html><head><meta charset="utf-8"><title>Ficha Paciente</title><style>${styles}</style></head><body>`;
        html += `<h2>Dados do Paciente</h2><div>`;
        campos.forEach(c => {
            const valor = paciente[c.key];
            if (typeof valor === 'undefined' || valor === null || valor === '') return;
            const display = c.format ? c.format(valor) : valor;
            html += `<p class="field"><strong>${c.label}:</strong> ${display}</p>`;
        });
        html += `</div></body></html>`;

        const container = document.getElementById("print-paciente-individual");
        container.innerHTML = html;
        container.style.display = "block";

        const opt = {
            margin: 0.5,
            filename: `paciente-${paciente.pacienteId || 'ficha'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // Gera PDF como Blob
            const worker = html2pdf().set(opt).from(container);
            const pdfBlob = await worker.outputPdf('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);

            // Abre UMA aba e injeta iframe que carrega o blob -> imprime no onload do iframe
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                // fallback: navegue para o blob (pode forçar download dependendo do navegador)
                window.location.href = blobUrl;
                return;
            }

            printWindow.document.open();
            printWindow.document.write(`
                <!doctype html>
                <html>
                  <head><meta charset="utf-8"><title>Imprimir - Paciente</title></head>
                  <body style="margin:0">
                    <iframe id="pdfFrame" src="${blobUrl}" style="border:none;width:100%;height:100vh;"></iframe>
                    <script>
                      const f = document.getElementById('pdfFrame');
                      f.onload = function() {
                        setTimeout(()=> {
                          try { f.contentWindow.focus(); f.contentWindow.print(); } catch(e){ window.print(); }
                        }, 250);
                      };
                      // opcional: fecha a aba após algum tempo (comentado)
                      // setTimeout(()=> window.close(), 60000);
                    <\/script>
                  </body>
                </html>`);
            printWindow.document.close();

            // libera o URL depois de um tempo
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
        } catch (err) {
            alert("Erro ao gerar PDF para impressão: " + (err && err.message ? err.message : err));
        } finally {
            container.style.display = "none";
        }
    }

    // Corrija o evento do botão cancelar edição para recarregar a tabela
    document.getElementById("btnCancelarEdicao").addEventListener("click", async (e) => {
        e.preventDefault();
        formEditar.style.display = "none";
        formEditar.reset();
        if (formBusca) {
            formBusca.classList.remove("hidden-search");
            formBusca.reset();
        }
        listaPacientes.innerHTML = "";
        listaPacientes.style.display = "none";
        setHeaderVisible(true);
        alternarCabecalhos(false);

        // Mostra o botão imprimir lista
        const btnImprimirLista = document.getElementById("btnImprimirLista");
        if (btnImprimirLista) btnImprimirLista.style.display = "";

        // Recarrega a tabela de pacientes
        await listarTodosPacientes();
    });

    // Preenche o formulário de edição com os dados do paciente
    function preencherFormularioEdicao(paciente) {
        // Preenche campos simples (input, select, textarea)
        for (const key in paciente) {
            const input = formEditar.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === "checkbox") {
                    input.checked = paciente[key];
                } else {
                    input.value = paciente[key];
                }
            }
        }

        // --- Campos dependentes: Estado/Cidade de Naturalidade e Endereço ---
        // Estado/Cidade de Naturalidade
        if (paciente.estadoNaturalidade) {
            const estadoNatSelect = formEditar.querySelector('select[name="estadoNaturalidade"]');
            const cidadeNatSelect = formEditar.querySelector('select[name="cidadeNaturalidade"]');
            const ufNatInput = formEditar.querySelector('input[name="ufNaturalidade"]');

            if (estadoNatSelect && cidadeNatSelect && ufNatInput) {
                // Define o estado e dispara o evento para carregar cidades
                estadoNatSelect.value = paciente.estadoNaturalidade;
                estadoNatSelect.dispatchEvent(new Event('change'));

                // Aguarda o carregamento das cidades antes de setar o valor
                setTimeout(() => {
                    cidadeNatSelect.value = paciente.cidadeNaturalidade || "";
                    ufNatInput.value = paciente.ufNaturalidade || paciente.estadoNaturalidade || "";
                }, 300);
            }
        }

        // Estado/Cidade de Endereço
        if (paciente.estadoEndereco) {
            const estadoEndSelect = formEditar.querySelector('select[name="estadoEndereco"]');
            const cidadeEndSelect = formEditar.querySelector('select[name="cidadeEndereco"]');
            const ufEndInput = formEditar.querySelector('input[name="ufEndereço"]');

            if (estadoEndSelect && cidadeEndSelect && ufEndInput) {
                estadoEndSelect.value = paciente.estadoEndereco;
                estadoEndSelect.dispatchEvent(new Event('change'));

                setTimeout(() => {
                    cidadeEndSelect.value = paciente.cidadeEndereco || "";
                    ufEndInput.value = paciente.ufEndereço || paciente.estadoEndereco || "";
                }, 300);
            }
        }
    }
}

export { editingSettingsFunctions };