export const formatCPF = (cpf) => {
    if (!cpf) return '';
    const cpfLimpo = cpf.replace(/[^\d]/g, "");
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatTelefone = (telefone) => {
    if (!telefone) return '';
    const telLimpo = telefone.replace(/[^\d]/g, "");
    if (telLimpo.length === 11) {
        return telLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};