// backend/gerar-hash.js
const bcrypt = require('bcryptjs');

const senhaPlana = 'thiagoa1208'; // A senha que queremos usar
const saltRounds = 10;       // Fator de segurança padrão

console.log(`Gerando hash para a senha: "${senhaPlana}"...`);

bcrypt.hash(senhaPlana, saltRounds, function(err, hash) {
    if (err) {
        console.error("Erro ao gerar o hash:", err);
        return;
    }
    console.log("\n---- HASH GERADO LOCALMENTE ----");
    console.log("Use este hash no seu comando SQL UPDATE:");
    console.log(hash);
    console.log("---------------------------------\n");
});

// node gerar-hash.js