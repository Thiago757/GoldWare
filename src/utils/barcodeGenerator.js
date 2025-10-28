function calcularDigitoVerificador(codigo) {
    let soma = 0;
    for (let i = 0; i < 12; i++) {
        soma += parseInt(codigo[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const resto = soma % 10;
    return resto === 0 ? 0 : 10 - resto;
}

function generateEAN13() {
    let codigoParcial = '';
    for (let i = 0; i < 12; i++) {
        codigoParcial += Math.floor(Math.random() * 10);
    }

    const digitoVerificador = calcularDigitoVerificador(codigoParcial);

    return codigoParcial + digitoVerificador;
}

module.exports = generateEAN13;