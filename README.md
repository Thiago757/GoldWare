<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=FFD700&height=120&section=header" alt="Banner do Projeto" style="width:100%; max-width:800px; border-radius: 8px;">
  <br>
  <h1> GoldWare - Sistema de Gestão para Joalheria</h1>
</div>

<h3>📚 Projeto Integrador de Sistemas Web - UNISATC</h3>

---

## 📄 Sobre o Projeto

O **GoldWare** é um sistema desenvolvido no contexto do **Projeto Integrador de Sistemas Web**, componente curricular do curso de Engenharia de Software da **UNISATC**.

A proposta da disciplina é identificar um problema real em uma organização existente e desenvolver uma solução de software que auxilie no processo de gestão.

Neste caso, o sistema foi pensado para atender às necessidades de uma **joalheria**, que não possuía ferramentas digitais adequadas para acompanhar suas atividades administrativas.

---

## 🎯 Objetivos do Projeto

- Cadastro de clientes, fornecedores e produtos  
- Gestão de vendas e pagamentos  
- Controle de estoque  
- Relatórios e indicadores para tomada de decisão  

---

## ⚙️ Tecnologias Utilizadas

<div align="center">
  <img src="https://skillicons.dev/icons?i=js,react,nodejs,postgres,github" />
</div>

---

## 📂 Estrutura do Projeto

- **Frontend:** React  
- **Backend:** Node.js  
- **Banco:** PostgreSQL  
- **Upload:** Multer  
- **Auth:** JWT  

---

## 🚀 Guia de Instalação

### 1. Clonar o Repositório

    git clone https://github.com/Thiago757/GoldWare.git
    cd GoldWare

---

## 2. Configurar o Banco de Dados

Criar banco: **goldware**

### A) Executar schema.sql no banco
Conteúdo do arquivo: `database/schema.sql`

### B) Executar seed.sql no banco
Conteúdo do arquivo: `database/seed.sql`

---

## 3. Configurar o Backend

### Instalar dependências:

    npm install

### Criar `.env`:

    PORT=3001
    JWT_SECRET=sua_chave_secreta_muito_forte_aqui
    DB_HOST=localhost
    DB_USER=postgres
    DB_PASSWORD=123456
    DB_DATABASE=goldware
    DB_PORT=5432

### Gerar hash da senha:

    node gerar-hash.js

### Inserir usuário admin:

    INSERT INTO usuarios (nome, email, senha_hash, tipo)
    VALUES ('Seu Nome', 'seu.email@exemplo.com', 'COLE_O_HASH_AQUI', 'admin');

### Iniciar backend:

    npm start

---

## 4. Configurar o Frontend

### Entrar no diretório:

    cd frontend

### Instalar dependências:

    npm install

### Criar `.env`:

    REACT_APP_API_BASE_URL=http://localhost:3001

### Rodar na pasta Frontend:

    npm start
    

Acesso: http://localhost:3000

---

## 👨‍👩‍👧‍👦 Equipe

Alexandre Tibes  
Elias Maciel  
Thiago Mazzucco  
Isabel Bastos  

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=FFD700&height=120&section=footer">
</div>
