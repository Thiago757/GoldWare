-- ========= CRIAÇÃO DAS TABELAS =========

-- TABELA: Clientes
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: Fornecedores
CREATE TABLE fornecedores (
    id_fornecedor SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    responsavel VARCHAR(100),
    status VARCHAR(10) NOT NULL DEFAULT 'S' CHECK (status IN ('S', 'N')),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: Produtos
CREATE TABLE produtos (
    id_produto SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco_venda NUMERIC(10,2) NOT NULL,
    custo NUMERIC(10,2),
    quantidade_estoque INT DEFAULT 0,
    ativo VARCHAR(10) NOT NULL DEFAULT 'S' CHECK (ativo IN ('S', 'N')),
    categoria VARCHAR(50),
    codigo_barras VARCHAR(50) UNIQUE, -- Adicionado
    imagem_url TEXT, -- Adicionado
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: Movimentações de Estoque
CREATE TABLE movimentacoes_estoque (
    id_movimentacao SERIAL PRIMARY KEY,
    id_produto INT NOT NULL REFERENCES produtos(id_produto),
    tipo_movimentacao VARCHAR(10) NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida')),
    quantidade INT NOT NULL CHECK (quantidade > 0),
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_fornecedor INT REFERENCES fornecedores(id_fornecedor),
    usuario_responsavel VARCHAR(100),
    origem VARCHAR(50),
    observacao TEXT
);

-- TABELA: Vendas
CREATE TABLE vendas (
    id_venda SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES clientes(id_cliente),
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total NUMERIC(10,2),
    desconto NUMERIC(10,2) DEFAULT 0,
    observacao TEXT,
    status_pagamento VARCHAR(20) CHECK (status_pagamento IN ('pago', 'pendente', 'cancelado', 'parcial'))
);

-- TABELA: Itens da Venda
CREATE TABLE itens_venda (
    id_item SERIAL PRIMARY KEY,
    id_venda INT REFERENCES vendas(id_venda) ON DELETE CASCADE,
    id_produto INT REFERENCES produtos(id_produto),
    nome_produto_snapshot VARCHAR(100),
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL
);

-- TABELA: Pagamentos
CREATE TABLE pagamentos (
    id_pagamento SERIAL PRIMARY KEY,
    id_venda INT REFERENCES vendas(id_venda),
    data_pagamento TIMESTAMP,
    valor_pago NUMERIC(10,2),
    forma_pagamento VARCHAR(50),
    status VARCHAR(20) DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'pendente', 'estornado', 'agendado')),
    parcelas INT DEFAULT 1 -- Adicionado
);

-- TABELA: Usuários do sistema
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    senha_hash TEXT NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('admin', 'vendedor', 'estoquista')),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token VARCHAR(255), -- Adicionado
    reset_token_expires TIMESTAMP, -- Adicionado
    avatar_url TEXT -- Adicionado
);

-- TABELA: Contas a Receber (Parcelas)
CREATE TABLE contas_a_receber (
    id_conta SERIAL PRIMARY KEY,
    id_venda INT NOT NULL REFERENCES vendas(id_venda),
    id_cliente INT NOT NULL REFERENCES clientes(id_cliente),
    numero_parcela INT NOT NULL,
    total_parcelas INT NOT NULL,
    valor_parcela NUMERIC(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado'))
);


-- ========= CRIAÇÃO DE TODOS OS ÍNDICES =========

-- ÍNDICES: Clientes
[cite_start]CREATE INDEX idx_clientes_nome ON clientes(nome); [cite: 10]
[cite_start]CREATE INDEX idx_clientes_cpf ON clientes(cpf); [cite: 10]
[cite_start]CREATE INDEX idx_clientes_status ON clientes(status); [cite: 10]

-- ÍNDICES: Fornecedores
[cite_start]CREATE INDEX idx_fornecedores_nome ON fornecedores(nome); [cite: 9]
[cite_start]CREATE INDEX idx_fornecedores_status ON fornecedores(status); [cite: 9]

-- ÍNDICES: Produtos
[cite_start]CREATE INDEX idx_produtos_nome ON produtos(nome); [cite: 11]
[cite_start]CREATE INDEX idx_produtos_categoria ON produtos(categoria); [cite: 11]
[cite_start]CREATE INDEX idx_produtos_ativo ON produtos(ativo); [cite: 11]
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras);

-- ÍNDICES: Movimentações de Estoque
[cite_start]CREATE INDEX idx_mov_produto ON movimentacoes_estoque(id_produto); [cite: 12]
[cite_start]CREATE INDEX idx_mov_fornecedor ON movimentacoes_estoque(id_fornecedor); [cite: 12]
[cite_start]CREATE INDEX idx_mov_data ON movimentacoes_estoque(data_movimentacao); [cite: 12]
[cite_start]CREATE INDEX idx_mov_tipo ON movimentacoes_estoque(tipo_movimentacao); [cite: 13]

-- ÍNDICES: Vendas
[cite_start]CREATE INDEX idx_vendas_data ON vendas(data_venda); [cite: 13]
[cite_start]CREATE INDEX idx_vendas_status ON vendas(status_pagamento); [cite: 13]
[cite_start]CREATE INDEX idx_vendas_cliente ON vendas(id_cliente); [cite: 14]

-- ÍNDICES: Itens da Venda
[cite_start]CREATE INDEX idx_itens_venda_venda ON itens_venda(id_venda); [cite: 14]
[cite_start]CREATE INDEX idx_itens_venda_produto ON itens_venda(id_produto); [cite: 14]

-- ÍNDICES: Pagamentos
[cite_start]CREATE INDEX idx_pagamentos_data ON pagamentos(data_pagamento); [cite: 15]
[cite_start]CREATE INDEX idx_pagamentos_status ON pagamentos(status); [cite: 15]
[cite_start]CREATE INDEX idx_pagamentos_venda ON pagamentos(id_venda); [cite: 15]

-- ÍNDICES: Usuários
[cite_start]CREATE INDEX idx_usuarios_email ON usuarios(email); [cite: 16]
[cite_start]CREATE INDEX idx_usuarios_tipo ON usuarios(tipo); [cite: 16]

-- ÍNDICES: Contas a Receber
CREATE INDEX idx_contas_a_receber_status ON contas_a_receber(status);
CREATE INDEX idx_contas_a_receber_vencimento ON contas_a_receber(data_vencimento);
CREATE INDEX idx_contas_a_receber_cliente ON contas_a_receber(id_cliente);