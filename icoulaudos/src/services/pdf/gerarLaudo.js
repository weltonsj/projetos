// ...existing code...
import { saveLaudoPdfToB2 } from "./storageLaudo.js";

/**
 * Helper: após gerar o Blob do PDF, chama o serviço para upload no B2 e registro no Firestore.
 * @param {Blob} pdfBlob Blob do PDF gerado
 * @param {{ pacienteId?: string|number, nomeArquivo?: string, metadados?: Record<string,any> }} meta
 */
export async function uploadAndRegisterLaudo(pdfBlob, { pacienteId, nomeArquivo, metadados } = {}) {
	return await saveLaudoPdfToB2(pdfBlob, { pacienteId, nomeArquivo, metadados });
}

// Exemplo de uso (adapte ao seu fluxo de geração de PDF):
// const worker = html2pdf().set(opt).from(container);
// const pdfBlob = await worker.outputPdf('blob');
// const { url, b2Key } = await uploadAndRegisterLaudo(pdfBlob, { pacienteId: dadosPaciente?.id });
// if (url) window.open(url, "_blank");
// ...existing code...
