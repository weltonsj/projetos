function capitalizeWords(str) {
    if (!str) return "";
    return str.replace(/\b\w/g, l => l.toUpperCase()).replace(/\B\w/g, l => l.toLowerCase());
}

function maskCPF(value) {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
}

function maskRG(value) {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1})$/, "$1-$2")
        .slice(0, 12);
}

function maskOrgaoEmissor(value) {
    return value.toUpperCase();
}

function maskTelefone(value) {
    return value
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
        .slice(0, 15);
}

function maskCEP(value) {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d{1,3})$/, "$1-$2")
        .slice(0, 9);
}

export { capitalizeWords, maskCPF, maskRG, maskOrgaoEmissor, maskTelefone, maskCEP };