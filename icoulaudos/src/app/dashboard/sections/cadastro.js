import { auth, db, addDoc, doc, getDoc, setDoc, updateDoc, collection, serverTimestamp, increment } from "../../../config/firebase/firebase-config.js";
import { showCustomizableMessage } from "../../../components/modal/modal.js";
import { alternarMostrarElemento } from "../../../utils/toggleElementsShow.js";
import { inicializarEstadosECidades } from "../../../utils/loadingCitiesInStates.js";
import { showLoading, hideLoading } from "../../../components/loading/loading.js";
import { maskCPF, maskRG, maskOrgaoEmissor, maskTelefone, maskCEP } from "../../../utils/masks.js";


function registrationSettingsFunctions() {
    alternarMostrarElemento({
        trigger: "#tipoLaudo",
        target: ".fieldsHideShow",
        condition: value => value && value !== ""
    });

    alternarMostrarElemento({
        trigger: "#nomeProfissional",
        target: ".showDataPersonal",
        condition: value => value !== ""
    })

    alternarMostrarElemento({
        trigger: "#nomeClinica",
        target: ".showClinicalData",
        condition: value => value !== ""
    })

    alternarMostrarElemento({
        trigger: "#resultadoAvaliacao",
        target: ".campoRestricoes",
        condition: value => value === "Apto com restrições"
    })

    // Gera cidades a partir dos Estados.
    inicializarEstadosECidades();

    // Captura o formulário
    const form = document.getElementById("section-main-container");
    const showSectionButton = document.getElementById("show-section-button");
    const hideHeader = document.querySelectorAll(".ocultar-cabecalho");
    const sectionActionsBtn = document.querySelector(".section-actions-btn");

    showSectionButton.addEventListener("click", () => {
        form.style.display = "block";
        showSectionButton.style.display = "none";
        if (sectionActionsBtn) sectionActionsBtn.style.display = "flex";
        if (hideHeader && hideHeader.length > 0) {
            hideHeader.forEach(elementItem => {
                elementItem.style.display = "none";
            });
        }
        // setTimeout(() => {
        //     const nomeInput = form.querySelector('input[name="nomeCompleto"]');
        //     if (nomeInput) nomeInput.focus();
        // }, 100);
    });

    form.addEventListener("reset", () => {
        form.style.display = "none";
        showSectionButton.style.display = "flex";
        if (sectionActionsBtn) sectionActionsBtn.style.display = "none";
        if (hideHeader && hideHeader.length > 0) {
            hideHeader.forEach(elementItem => {
                elementItem.style.display = "block";
            });
        }
    });

    // Campos com mascaras para identificação visual
    const cpfInput = form.querySelector('input[name="cpf"]');
    const rgInput = form.querySelector('input[name="rg"]');
    const orgaoEmissorInput = form.querySelector('input[name="orgaoEmissor"]')
    const telefoneInput = form.querySelector('input[name="telefone"]');
    const telefoneAdicionalInput = form.querySelector('input[name="telefoneAdicional"]');
    const cepInput = form.querySelector('input[name="cep"]');

    if (cpfInput) {
        cpfInput.addEventListener("input", (e) => {
            e.target.value = maskCPF(e.target.value);
        });
    }

    if (rgInput) {
        rgInput.addEventListener("input", (e) => {
            e.target.value = maskRG(e.target.value);
        });
    }

    if (orgaoEmissorInput) {
        orgaoEmissorInput.addEventListener("input", (e) => {
            e.target.value = maskOrgaoEmissor(e.target.value);
        });
    }

    if (telefoneInput) {
        telefoneInput.addEventListener("input", (e) => {
            e.target.value = maskTelefone(e.target.value);
        });
    }

    if (telefoneAdicionalInput) {
        telefoneAdicionalInput.addEventListener("input", (e) => {
            e.target.value = maskTelefone(e.target.value);
        });
    }

    if (cepInput) {
        cepInput.addEventListener("input", (e) => {
            e.target.value = maskCEP(e.target.value);
        });
    }

    // Botões com ações diferentes
    const btnFinalizar = document.querySelector("#btnSalvarFinalizado");
    const btnRascunho = document.querySelector("#btnSalvarRascunho");
    const btnLimpar = document.querySelector("#btnLimparFormulario");

    // Lógica para salvar o formulário
    async function salvarPaciente(status) {
        const user = auth.currentUser;

        if (!user) {
            showCustomizableMessage({
                title: "⚠️ Aviso",
                message: "Você precisa estar logado para cadastrar um paciente.",
            })
            return;
        };

        // Obtém o valor atual de idPatientNumberControl do usuário logado
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let pacienteId = null;
        if (userDocSnap.exists()) {
            pacienteId = userDocSnap.data().idPatientNumberControl;
            // Incrementa +1 no campo idPatientNumberControl
            await updateDoc(userDocRef, { idPatientNumberControl: increment(1) });
        } else {
            showCustomizableMessage({
                title: "❌ Erro",
                message: "Não foi possível obter o número de controle do paciente.",
                type: "error",
                buttons: [{
                    label: "OK", value: "OK", style: "danger"
                }]
            });
            return;
        }

        const formData = new FormData(form);
        const paciente = {
            // Usuário Logado 
            profissionalId: user.uid,
            status: status,
            criadoEm: serverTimestamp(),

            // Dados do Pessoais
            pacienteId: pacienteId + 1,
            dataLaudo: formData.get("dataLaudo"),
            nomeCompleto: formData.get("nomeCompleto"),
            nomeMae: formData.get("nomeMae"),
            nomePai: formData.get("nomePai"),
            sexo: formData.get("sexo"),
            estadoCivil: formData.get("estadoCivil"),
            dataNascimento: formData.get("dataNascimento"),
            rg: formData.get("rg"),
            orgaoEmissor: formData.get("orgaoEmissor"),
            cpf: formData.get("cpf").replace(/\D/g, ""),
            profissao: formData.get("profissao"),
            escolaridade: formData.get("escolaridade"),
            raca: formData.get("raca"),
            nacionalidade: formData.get("nacionalidade"),
            estadoNaturalidade: formData.get("estadoNaturalidade"),
            ufNaturalidade: formData.get("ufNaturalidade"),
            cidadeNaturalidade: formData.get("cidadeNaturalidade"),

            // Endereço
            rua: formData.get("rua"),
            numero: formData.get("numero"),
            complemento: formData.get("complemento"),
            bairroEndereco: formData.get("bairroEndereco"),
            estadoEndereco: formData.get("estadoEndereco"),
            ufEndereço: formData.get("ufEndereço"),
            cidadeEndereco: formData.get("cidadeEndereco"),
            cep: formData.get("cep"),

            // Contato
            telefone: formData.get("telefone"),
            tipoDeContato: formData.get("tipoDeContato"),
            telefoneAdicional: formData.get("telefoneAdicional"),
            email: formData.get("email"),
            siteOuRedesSociais: formData.get("siteOuRedesSociais"),

            // Avaliação Psicológica
            tipoLaudo: formData.get("tipoLaudo"),
            motivoAvaliacao: formData.get("motivoAvaliacao"),
            dataAvaliacao: formData.get("dataAvaliacao"),
            testesAplicados: formData.get("testesAplicados"),
            observacoesComportamentais: formData.get("observacoesComportamentais"),
            historicoClinico: formData.get("historicoClinico"),
            cid: formData.get("cid"),
            observacoesAdicionais: formData.get("observacoesAdicionais"),
            resultadoAvaliacao: formData.get("resultadoAvaliacao"),
            restricoes: formData.get("restricoes"),

            // Consentimento
            consentimento: formData.get("consentimento") === "on",

            // Dados do Profissional
            nomeProfissional: formData.get("nomeProfissional"),
            especialidadeProfissional: formData.get("especialidadeProfissional"),
            crpProfissional: formData.get("crp"),
            estadoCrp: formData.get("estadoCrp"),
            ufCrp: formData.get("ufCrp"),

            // Dados da Clínica
            nomeClinica: formData.get("nomeClinica"),
            cnpjClinica: formData.get("cnpjClinica"),
            estadoClinica: formData.get("estadoClinica"),
            ufclinica: formData.get("ufclinica"),
            cidadeClinica: formData.get("cidadeClinica"),
        };

        try {
            // Mapeamento dos campos obrigatórios para nomes amigáveis
            const camposObrigatorios = [
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
                { name: "telefone", label: "Telefone" },
                { name: "consentimento", label: "Termo de Consentimento" }
            ];

            for (const campo of camposObrigatorios) {
                if (!formData.get(campo.name)) {
                    showCustomizableMessage({
                        title: "⚠️ Aviso Campo obrigatório",
                        message: `O campo <b>${campo.label}</b> deve ser preenchido.`,
                        type: "warning",
                        buttons: [
                            { label: "OK", value: "OK", style: "warning" }
                        ]
                    }).then(result => {
                        if (result === "OK" || result === "close") {
                            const input = form.querySelector(`[name="${campo.name}"]`);
                            input.focus();
                        }
                    })
                    return;
                }

                if (status === "Rascunho") {
                    // Animação antes de enviar formulário
                    showLoading();
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    showCustomizableMessage({
                        title: "Salvo como rascunho",
                        message: "Os dados foram salvos como rascunho. Você pode completá-los e finalizar o cadastro depois.",
                        type: "info",
                        buttons: [
                            { label: "OK", value: "OK", style: "info" }
                        ]
                    })
                    // Envio do formulário para o BD
                    await addDoc(collection(db, "pacientes"), paciente);

                    form.reset();
                    return;
                };
            };

            // Animação antes de enviar formulário
            showLoading();
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Envio do formulário para o BD
            await addDoc(collection(db, "pacientes"), paciente);

            showCustomizableMessage({
                title: "Cadastro realizado",
                message: "Paciente cadastrado com sucesso!",
                type: "success",
                buttons: [
                    { label: "OK", value: "OK", style: "success" }
                ]
            })
            form.reset();

        } catch (error) {
            console.error("Erro ao salvar paciente:", error);
            showCustomizableMessage({
                title: "Erro ao salvar",
                message: "Verifique os dados e tente novamente.",
                type: "error",
                buttons: [
                    { label: "OK", value: "OK", style: "danger" }
                ]
            });

        } finally {
            hideLoading();
        };
    };

    // 5. Eventos dos botões
    btnFinalizar.addEventListener("click", (e) => {
        e.preventDefault();
        salvarPaciente("Concluído");
    });

    btnRascunho.addEventListener("click", (e) => {
        e.preventDefault();
        salvarPaciente("Rascunho");
    });

    btnLimpar.addEventListener("click", (e) => {
        e.preventDefault();
        form.reset();
    });
};

export { registrationSettingsFunctions };