import { auth, db, doc, getDoc, updateDoc, onAuthStateChanged } from "../../../config/firebase/firebase-config.js";
import { showCustomizableMessage } from "../../../components/modal/modal.js";
import { showLoading, hideLoading } from "../../../components/loading/loading.js";
import { uploadToCloudinary } from "../../../utils/cloudinary.js";

// Evita múltiplas inicializações ao reentrar na seção
if (!window.__perfil_inited) {
  window.__perfil_inited = true;
}

// Utilitário para validar e otimizar imagem de perfil/logo/assinatura
async function processImage(file, { maxSide = 600, maxBytes = 1_000_000 } = {}) {
  const allowed = ["image/png", "image/jpeg"]; // formatos aceitos
  if (!allowed.includes(file.type)) throw new Error("Formato inválido. Envie PNG ou JPEG.");

  // Lê a imagem
  const img = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = fr.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  // Calcula escala mantendo proporção
  const { width, height } = img;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW; canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Exporta como JPEG com compressão adaptativa até 1 MB
  const outType = "image/jpeg";
  let quality = 0.9;
  let blob = await new Promise(res => canvas.toBlob(res, outType, quality));
  while (blob && blob.size > maxBytes && quality > 0.5) {
    quality -= 0.1;
    // eslint-disable-next-line no-await-in-loop
    blob = await new Promise(res => canvas.toBlob(res, outType, quality));
  }
  if (!blob || blob.size > maxBytes) throw new Error("Imagem muito grande. Reduza para até 1 MB.");

  const ext = "jpg";
  const base = (file.name?.split(".")[0] || "imagem").replace(/[^a-z0-9_-]+/gi, "-");
  return new File([blob], `${base}.${ext}`, { type: outType });
}

async function perfilSettingsFunctions() {
  if (window.__perfil_initialized) return;
  window.__perfil_initialized = true;

  // Elementos principais
  const nomeEl = document.getElementById("perfil-nome");
  const previewFoto = document.getElementById("preview-fotoProfissional");
  const inputFoto = document.getElementById("input-fotoProfissional");
  const btnEditarPerfil = document.getElementById("btn-editar-perfil");
  const formView = document.getElementById("perfil-form");

  // Aguarda autenticação para carregar dados (evita precisar recarregar a página)
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    showLoading();
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    let userData = userDocSnap.exists() ? userDocSnap.data() : {};
    hideLoading();

  // Exibe nome do usuário
  if (nomeEl) nomeEl.textContent = userData.nome || user.displayName || "Usuário";

  // Exibe foto (se houver)
  const photoPlaceholder = document.querySelector(".perfil-photo-placeholder");
  if (previewFoto) {
    if (userData.fotoURL) {
      previewFoto.src = userData.fotoURL;
      previewFoto.style.display = "block";
      if (photoPlaceholder) photoPlaceholder.style.display = "none";
    } else {
      previewFoto.style.display = "none";
      if (photoPlaceholder) photoPlaceholder.style.display = "inline-block";
    }
  }

  // Preenche painel de visualização (inputs desabilitados)
  if (formView) {
    const map = {
      nome: "nome",
      crp: "crp",
      cpf: "cpf",
      telefone: "telefone",
      email: "email",
      especialidade: "especialidade",
      nomeClinica: "nomeClinica",
      cnpjClinica: "cnpjClinica",
      telefoneClinica: "telefoneClinica",
      emailClinica: "emailClinica",
      enderecoClinica: "enderecoClinica",
      bairroClinica: "bairroClinica",
      cidadeClinica: "cidadeClinica",
      ufClinica: "ufClinica",
      cepClinica: "cepClinica",
      modeloAssinatura: "modeloAssinatura",
      modeloRodape: "modeloRodape",
      corPrimaria: "corPrimaria",
      site: "site",
      redesSociais: "redesSociais"
    };
    Object.keys(map).forEach((name) => {
      const el = formView.querySelector(`[name="${name}"]`);
      if (el) {
        el.value = userData[map[name]] || "";
        el.disabled = true;
      }
    });
  }

    // Upload de foto (Cloudinary) com validação/otimização
    if (inputFoto) {
      const uploadBtn = document.querySelector(".perfil-foto-upload-btn");
      if (uploadBtn && !uploadBtn._bound) { uploadBtn._bound = true; uploadBtn.onclick = () => inputFoto.click(); }

      if (!inputFoto._bound) {
        inputFoto._bound = true;
        inputFoto.addEventListener("change", async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            showLoading();

            const optimized = await processImage(file, { maxSide: 600, maxBytes: 1_000_000 });
            let fotoUrl = await uploadToCloudinary(
              optimized,
              `icoulaudos/users/${user.uid}/foto`,
              { preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_USERS }
            );

            // Fallback: aplica transformação de tamanho do Cloudinary (se quiser forçar 600x600)
            if (fotoUrl && fotoUrl.includes("res.cloudinary.com")) {
              try {
                const parts = fotoUrl.split("/upload/");
                if (parts.length === 2) fotoUrl = `${parts[0]}/upload/c_fill,w_600,h_600/${parts[1]}`;
              } catch {}
            }

            await updateDoc(userDocRef, { fotoURL: fotoUrl });

            if (previewFoto) { previewFoto.src = fotoUrl; previewFoto.style.display = "block"; }
            const photoPlaceholder = document.querySelector(".perfil-photo-placeholder");
            if (photoPlaceholder) photoPlaceholder.style.display = "none";

            // Notifica outras áreas (ex.: header) para atualizar avatar/status
            window.dispatchEvent(new CustomEvent("profile:updated", { detail: { userData: { ...userData, fotoURL: fotoUrl } } }));

            showCustomizableMessage({ title: "Foto atualizada", message: "Sua foto de perfil foi atualizada com sucesso!", type: "success" });
          } catch (err) {
            showCustomizableMessage({ title: "Erro", message: err?.message || "Erro ao atualizar foto de perfil.", type: "error" });
          } finally {
            hideLoading();
            inputFoto.value = "";
          }
        });
      }
    }

    // Modal de edição de perfil
    if (btnEditarPerfil && !btnEditarPerfil._bound) {
      btnEditarPerfil._bound = true;
      btnEditarPerfil.addEventListener("click", () => abrirModalEdicao(userData, userDocRef, user));
    }

  function abrirModalEdicao(dados, userDocRef, user) {
    // Cria modal se não existir
    let modal = document.getElementById("modal-editar-perfil");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "modal-editar-perfil";
      modal.innerHTML = `
        <style>
          .perfil-modal-overlay {
            position: fixed; inset: 0;
            background: rgba(30,77,107,0.18);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
          }
          .perfil-modal-box {
            width: min(920px, 92vw);
            max-height: 86vh;
            overflow: auto;
            background: var(--white);
            border: 1px solid var(--el-color-info-light-8);
            border-radius: var(--radius-6);
            box-shadow: var(--shadow-elevated);
            padding: 1rem 1rem 0.5rem;
          }
          .perfil-modal-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 0.5rem;
          }
          .perfil-modal-header h3 {
            margin: 0; color: var(--primary-color); font-weight: 800;
          }
          .perfil-modal-close {
            background: none; border: none; font-size: 1.4rem; cursor: pointer; color: var(--primary-color);
          }
          .perfil-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(220px, 1fr));
            gap: 0.75rem 1rem;
          }
          .perfil-form-grid label {
            display: flex; flex-direction: column;
            font-size: 0.8rem; color: var(--primary-color);
          }
          .perfil-form-grid input, .perfil-form-grid textarea, .perfil-form-grid select {
            margin-top: 0.25rem;
            padding: 0.6rem 0.7rem;
            font-size: 0.95rem;
            border: 1px solid var(--el-color-info-light-8);
            border-radius: var(--radius-4);
            background: var(--white);
            color: var(--text-color);
            box-shadow: var(--shadow-default);
          }
          .perfil-form-grid .full { grid-column: 1 / -1; }
          .perfil-modal-footer {
            display: flex; gap: 0.75rem; justify-content: flex-end; padding: 0.9rem 0;
            position: sticky; bottom: 0; background: var(--white);
          }
          @media (max-width: 760px) {
            .perfil-form-grid { grid-template-columns: 1fr; }
          }
        </style>
        <div class="perfil-modal-overlay">
          <div class="perfil-modal-box">
            <div class="perfil-modal-header">
              <h3>Editar Perfil</h3>
              <button class="perfil-modal-close" aria-label="Fechar">&times;</button>
            </div>
            <form id="form-editar-perfil" class="perfil-form-grid" autocomplete="off" enctype="multipart/form-data"></form>
            <div class="perfil-modal-footer">
              <button type="button" id="btn-cancelar-edicao" class="action-button btn-gray">Cancelar</button>
              <button type="submit" form="form-editar-perfil" class="action-button btn-blue">Salvar</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const overlay = modal.querySelector(".perfil-modal-overlay");
    const closeBtn = modal.querySelector(".perfil-modal-close");
    const btnCancelar = modal.querySelector("#btn-cancelar-edicao");
    const formModal = modal.querySelector("#form-editar-perfil");

    // Monta campos solicitados
    const campos = [
      { label: "Nome completo", name: "nome", type: "text", placeholder: "Seu nome completo" },
      { label: "CRP", name: "crp", type: "text", placeholder: "Nº CRP" },
      { label: "CPF", name: "cpf", type: "text", placeholder: "000.000.000-00" },
      { label: "Telefone", name: "telefone", type: "tel", placeholder: "(00) 00000-0000" },
      { label: "E-mail", name: "email", type: "email", placeholder: "email@exemplo.com" },
      { label: "Especialidade", name: "especialidade", type: "text", placeholder: "Ex: Psicologia Clínica" },

      { label: "Nome da clínica", name: "nomeClinica", type: "text", placeholder: "Nome da clínica" },
      { label: "CNPJ", name: "cnpjClinica", type: "text", placeholder: "00.000.000/0000-00" },
      { label: "Telefone fixo/WhatsApp", name: "telefoneClinica", type: "tel", placeholder: "(00) 00000-0000" },
      { label: "E-mail da clínica", name: "emailClinica", type: "email", placeholder: "clinica@exemplo.com" },

      { label: "Logo da clínica (Cloudinary)", name: "logoClinica", type: "file", placeholder: "" },
      { label: "Responsável técnico", name: "responsavelTecnico", type: "text", placeholder: "Nome do responsável" },
      { label: "CPF do responsável técnico", name: "cpfResponsavelTecnico", type: "text", placeholder: "000.000.000-00" },
      { label: "Assinatura (imagem - Cloudinary)", name: "assinatura", type: "file", placeholder: "" },

      { label: "Endereço completo", name: "enderecoClinica", type: "text", placeholder: "Rua, número e complemento", class: "full" },
      { label: "Bairro", name: "bairroClinica", type: "text", placeholder: "Bairro" },
      { label: "Cidade", name: "cidadeClinica", type: "text", placeholder: "Cidade" },
      { label: "UF", name: "ufClinica", type: "text", placeholder: "UF" },
      { label: "CEP", name: "cepClinica", type: "text", placeholder: "00000-000" },

      { label: "Modelo de assinatura (texto)", name: "modeloAssinatura", type: "text", placeholder: "Texto exibido no documento", class: "full" },
      { label: "Modelo de rodapé", name: "modeloRodape", type: "text", placeholder: "Rodapé dos documentos", class: "full" },
      { label: "Cor primária (hex)", name: "corPrimaria", type: "text", placeholder: "#1E4D6B" },
      { label: "Site", name: "site", type: "url", placeholder: "https://www.seusite.com" },
      { label: "Redes sociais", name: "redesSociais", type: "text", placeholder: "@instagram, /facebook, LinkedIn...", class: "full" }
    ];

    // Render
    formModal.innerHTML = "";
    campos.forEach((c) => {
      const valor = c.type === "file" ? "" : (dados[c.name] || "");
      const classFull = c.class === "full" ? "full" : "";
      const input = c.type === "file"
        ? `<input type="file" name="${c.name}" />`
        : `<input type="${c.type}" name="${c.name}" value="${valor}" placeholder="${c.placeholder || ""}" />`;
      formModal.innerHTML += `
        <label class="${classFull}">${c.label}
          ${input}
        </label>
      `;
    });

    // Ações modal
    const fechar = () => (modal.style.display = "none");
    overlay.style.display = "flex";
    modal.style.display = "block";
    closeBtn.onclick = fechar;
    btnCancelar.onclick = fechar;

    formModal.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(formModal);
      const novosDados = {};

      // Uploads (Cloudinary) — logo e assinatura
      try {
        showLoading();

        // Processa e envia LOGO (reduzida e com fallback de transformação)
        const logoFile = formData.get("logoClinica");
        if (logoFile && logoFile.size > 0) {
          const logoOptimized = await processImage(logoFile, { maxSide: 800, maxBytes: 1_000_000 });
          let urlLogo = await uploadToCloudinary(logoOptimized, `icoulaudos/users/${user.uid}/logo`, { preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_USERS });
          if (urlLogo?.includes("res.cloudinary.com")) {
            try { const p = urlLogo.split("/upload/"); if (p.length === 2) urlLogo = `${p[0]}/upload/c_limit,w_800/${p[1]}`; } catch {}
          }
          novosDados.logoClinicaURL = urlLogo;
        }
        // Processa e envia ASSINATURA (preferir largura limitada)
        const assinaturaFile = formData.get("assinatura");
        if (assinaturaFile && assinaturaFile.size > 0) {
          const assOptimized = await processImage(assinaturaFile, { maxSide: 800, maxBytes: 1_000_000 });
          let urlAss = await uploadToCloudinary(assOptimized, `icoulaudos/users/${user.uid}/assinatura`, { preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_USERS });
          if (urlAss?.includes("res.cloudinary.com")) {
            try { const p = urlAss.split("/upload/"); if (p.length === 2) urlAss = `${p[0]}/upload/c_limit,w_800/${p[1]}`; } catch {}
          }
          novosDados.assinaturaURL = urlAss;
        }

        // Demais campos (texto)
        campos.forEach((campo) => {
          if (campo.type !== "file") {
            novosDados[campo.name] = formData.get(campo.name);
          }
        });

  await updateDoc(userDocRef, novosDados);
        showCustomizableMessage({
          title: "Sucesso",
          message: "Perfil atualizado com sucesso!",
          type: "success"
        });

        // Atualiza estado local/visualização
        Object.assign(userData, novosDados);
        if (nomeEl) nomeEl.textContent = userData.nome || "Usuário";
        if (formView) {
          Object.keys(novosDados).forEach((k) => {
            const el = formView.querySelector(`[name="${k}"]`);
            if (el) el.value = novosDados[k] || "";
          });
        }
    // Notifica outras áreas para atualizar rapidamente
    window.dispatchEvent(new CustomEvent("profile:updated", { detail: { userData } }));
    fechar();
      } catch (err) {
        showCustomizableMessage({
          title: "Erro",
          message: "Não foi possível salvar as alterações. Verifique suas credenciais e configuração do Cloudinary.",
          type: "error"
        });
      } finally {
        hideLoading();
      }
    };
  }
  }); // fim onAuthStateChanged
}

perfilSettingsFunctions();

export { perfilSettingsFunctions };