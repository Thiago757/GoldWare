<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=FFD700&height=120&section=header" alt="Banner do Projeto" style="width:100%; max-width:800px; border-radius: 8px;">
  <br>
  <h1> GoldWare - Sistema de Gestão para Joalheria</h1>
</div>

<h3>📚 Projeto Integrador de Sistemas Web - UNISATC</h3>

---

## 📄 Sobre o Projeto

O **GoldWare** é um sistema desenvolvido no contexto do **Projeto Integrador de Sistemas Web**, componente curricular do curso de Engenharia de Software da **UNISATC**.  

A proposta da disciplina é **identificar um problema real em uma organização existente** e desenvolver uma solução de software que auxilie no processo de gestão.  

Neste caso, o sistema foi pensado para atender às necessidades de uma **joalheria**, que não possuía ferramentas digitais adequadas para acompanhar suas atividades administrativas.

---

## 🎯 Objetivos do Projeto

O objetivo geral do projeto é **desenvolver um sistema web que permita a organização e o controle de processos essenciais de um pequeno negócio**.  

Entre os objetivos específicos, destacam-se:  
- Estruturar o **cadastro de clientes, fornecedores e produtos** - Gerenciar **vendas e pagamentos**, inclusive parcelados  
- Controlar o **estoque e suas movimentações** - Fornecer **indicadores e relatórios** que auxiliem na tomada de decisão  

Assim, busca-se aplicar, na prática, os conhecimentos adquiridos no curso, passando por todas as etapas de desenvolvimento de sistemas: levantamento de requisitos, análise, modelagem, implementação e testes.

---

## ⚙️ Tecnologias Utilizadas

<div align="center">

<a href="https://skillicons.dev">
  <img src="https://skillicons.dev/icons?i=js,react,nodejs,postgres,github" alt="Tecnologias" />
</a>

</div>

---

## 📂 Estrutura do Projeto

- **Frontend:** React (com Context API e React Router)  
- **Backend:** Node.js + Express  
- **Banco de Dados:** PostgreSQL  
- **Upload de arquivos:** Multer  
- **Autenticação:** JWT  

---

## 🚀 Como Rodar o Projeto Localmente

Para executar o projeto na sua máquina, siga os passos abaixo.

### **Pré-requisitos**

Antes de começar, garanta que você tem as seguintes ferramentas instaladas:
* [Node.js](https://nodejs.org/) (versão 18.x ou superior)
* [Git](https://git-scm.com/)
* **PostgreSQL** rodando na sua máquina.

### **Passo a Passo**

O projeto é dividido em `backend` e `frontend`. Ambos precisam estar rodando **ao mesmo tempo** em terminais diferentes.

1.  **Clone o Repositório**
    ```bash
    git clone [https://github.com/Thiago757/GoldWare.git](https://github.com/Thiago757/GoldWare.git)
    cd GoldWare
    ```

2.  **Configure o Back-end**
    * Navegue até a pasta do back-end:
        ```bash
        cd backend
        ```
    * Instale as dependências:
        ```bash
        npm install
        ```
    * **Configure as Variáveis de Ambiente:** Crie um arquivo chamado `.env` dentro da pasta `backend`. Copie o conteúdo abaixo para dentro dele e preencha com as suas credenciais do PostgreSQL.
        ```env
        # Credenciais do Banco de Dados PostgreSQL
        DB_HOST=localhost
        DB_USER=postgres
        DB_PASSWORD=sua_senha_secreta
        DB_DATABASE=goldware_db
        DB_PORT=5432
        ```
        > **Importante:** Certifique-se de que o banco de dados `goldware_db` já foi criado no seu PostgreSQL e que as tabelas do projeto foram populadas.

    * Execute o servidor do back-end:
        ```bash
        npm start
        ```
        O servidor estará rodando em `http://localhost:3001`.

3.  **Configure o Front-end**
    * **Abra um novo terminal.** Deixe o terminal do back-end rodando.
    * A partir da raiz do projeto (`GoldWare`), navegue até a pasta do front-end:
        ```bash
        cd frontend
        ```
    * Instale as dependências:
        ```bash
        npm install
        ```
    * Execute a aplicação:
        ```bash
        npm run dev
        ```
        A aplicação React será aberta no seu navegador, geralmente em `http://localhost:3000` ou `http://localhost:5173`.

---

## 👨‍👩‍👧‍👦 Equipe de Desenvolvimento

- **Alexandre Tibes** - **Elias Maciel** - **Thiago Mazzucco** - **Isabel Bastos**

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=FFD700&height=120&section=footer" alt="Rodapé do Projeto" style="width:100%; max-width:800px; border-radius: 8px;">
</div>