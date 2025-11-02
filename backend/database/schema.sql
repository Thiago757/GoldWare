-- ETAPA 1: TABELAS DE APOIO

CREATE TABLE estados (
    id_estado SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(2) NOT NULL
);

CREATE TABLE cidades (
    id_cidade SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    id_estado INT REFERENCES estados(id_estado),
    uf VARCHAR(2) NOT NULL
);

CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE formas_pagamento (
    id_forma_pagamento SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    ativo CHAR(1) DEFAULT 'S' CHECK (ativo IN ('S', 'N'))
);

CREATE TABLE contas_bancarias (
    id_conta_bancaria SERIAL PRIMARY KEY,
    nome_conta VARCHAR(100) NOT NULL,
    banco VARCHAR(50),
    agencia VARCHAR(20),
    numero_conta VARCHAR(30),
    saldo NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    ativo CHAR(1) DEFAULT 'S' CHECK (ativo IN ('S', 'N'))
);

CREATE TABLE tipos_servico (
    id_tipo_servico SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- ETAPA 2: TABELAS DE ENTIDADES (Dependem das tabelas de apoio)


CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    senha_hash TEXT NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('admin', 'vendedor', 'estoquista')),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    cep VARCHAR(9),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    id_cidade INT REFERENCES cidades(id_cidade),
    id_estado INT REFERENCES estados(id_estado),
    status VARCHAR(10) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fornecedores (
    id_fornecedor SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    id_cidade INT REFERENCES cidades(id_cidade),
    responsavel VARCHAR(100),
    status VARCHAR(10) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE produtos (
    id_produto SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco_venda NUMERIC(10,2) NOT NULL,
    custo NUMERIC(10,2),
    quantidade_estoque INT NOT NULL DEFAULT 0,
    ativo CHAR(1) NOT NULL DEFAULT 'S' CHECK (ativo IN ('S', 'N')),
    id_categoria INT REFERENCES categorias(id_categoria),
    codigo_barras VARCHAR(50) UNIQUE,
    imagem_url TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicos (
    id_servico SERIAL PRIMARY KEY,
    id_tipo_servico INT REFERENCES tipos_servico(id_tipo_servico),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco_base NUMERIC(10,2) NOT NULL,
    prazo_estimado INT,
    ativo CHAR(1) NOT NULL DEFAULT 'S' CHECK (ativo IN ('S','N')),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ETAPA 3: TABELAS TRANSACIONAIS (Dependem das Entidades)

CREATE TABLE vendas (
    id_venda SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES clientes(id_cliente),
    id_usuario INT REFERENCES usuarios(id_usuario),
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total NUMERIC(10,2),
    desconto NUMERIC(10,2) DEFAULT 0,
    observacao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'aberta'
        CHECK (status IN ('aberta','concluida','cancelada','devolvida'))
);

CREATE TABLE itens_venda (
    id_item_venda SERIAL PRIMARY KEY,
    id_venda INT NOT NULL REFERENCES vendas(id_venda) ON DELETE CASCADE,
    id_produto INT NOT NULL REFERENCES produtos(id_produto),
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL
);

CREATE TABLE compras (
    id_compra SERIAL PRIMARY KEY,
    id_fornecedor INT NOT NULL REFERENCES fornecedores(id_fornecedor),
    id_usuario_responsavel INT REFERENCES usuarios(id_usuario),
    data_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total NUMERIC(10, 2) NOT NULL,
    numero_nota_fiscal VARCHAR(50),
    status VARCHAR(20) DEFAULT 'recebido' CHECK (status IN ('pendente', 'recebido', 'cancelado'))
);

CREATE TABLE itens_compra (
    id_item_compra SERIAL PRIMARY KEY,
    id_compra INT NOT NULL REFERENCES compras(id_compra) ON DELETE CASCADE,
    id_produto INT NOT NULL REFERENCES produtos(id_produto),
    quantidade INT NOT NULL CHECK (quantidade > 0),
    custo_unitario NUMERIC(10, 2) NOT NULL
);

CREATE TABLE ordens_servico (
    id_os SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES clientes(id_cliente),
    id_usuario_responsavel INT REFERENCES usuarios(id_usuario),
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'aberta'
        CHECK (status IN ('aberta','em_andamento','concluida','cancelada')),
    observacao TEXT
);

CREATE TABLE itens_os (
    id_item_os SERIAL PRIMARY KEY,
    id_os INT NOT NULL REFERENCES ordens_servico(id_os) ON DELETE CASCADE,
    id_servico INT NOT NULL REFERENCES servicos(id_servico),
    quantidade INT NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    prazo_estimado INT NOT NULL,
    preco_unitario NUMERIC(10,2) NOT NULL,
    desconto NUMERIC(10,2) DEFAULT 0,
    subtotal NUMERIC(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario - desconto) STORED
);

CREATE TABLE contas_a_pagar (
    id_conta_pagar SERIAL PRIMARY KEY,
    id_compra INT REFERENCES compras(id_compra),
    id_fornecedor INT REFERENCES fornecedores(id_fornecedor),
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    valor_pago NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_quitacao DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'parcial', 'atrasado', 'cancelado'))
);

CREATE TABLE contas_a_receber (
    id_conta_receber SERIAL PRIMARY KEY,
    id_venda INT REFERENCES vendas(id_venda),
    id_os INT REFERENCES ordens_servico(id_os), 
    id_cliente INT NOT NULL REFERENCES clientes(id_cliente),
    numero_parcela INT NOT NULL,
    total_parcelas INT NOT NULL,
    valor_parcela NUMERIC(10, 2) NOT NULL,
    valor_recebido NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'parcial', 'atrasado', 'cancelado'))
);

-- ETAPA 4: TABELAS DE LIGAÇÃO (Dependem das Transacionais)


CREATE TABLE movimentacoes_estoque (
    id_movimentacao SERIAL PRIMARY KEY,
    id_produto INT NOT NULL REFERENCES produtos(id_produto),
    tipo_movimentacao VARCHAR(10) NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida', 'ajuste')),
    quantidade INT NOT NULL,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_item_venda INT REFERENCES itens_venda(id_item_venda),
    id_item_compra INT REFERENCES itens_compra(id_item_compra),
    id_usuario_responsavel INT REFERENCES usuarios(id_usuario),
    observacao TEXT
);

CREATE TABLE recebimento_venda (
    id_recebimento SERIAL PRIMARY KEY,
    id_conta_receber INT NOT NULL REFERENCES contas_a_receber(id_conta_receber),
    id_conta_bancaria INT NOT NULL REFERENCES contas_bancarias(id_conta_bancaria),
    id_forma_pagamento INT NOT NULL REFERENCES formas_pagamento(id_forma_pagamento),
    valor_recebido NUMERIC(10,2) NOT NULL,
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagamento_compra (
    id_pagamento_compra SERIAL PRIMARY KEY,
    id_conta_pagar INT NOT NULL REFERENCES contas_a_pagar(id_conta_pagar),
    id_conta_bancaria INT NOT NULL REFERENCES contas_bancarias(id_conta_bancaria),
    id_forma_pagamento INT REFERENCES formas_pagamento(id_forma_pagamento),
    valor_pago NUMERIC(10, 2) NOT NULL,
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacao TEXT
);

-- ETAPA 5: CRIAÇÃO DOS TRIGGERS

CREATE OR REPLACE FUNCTION atualizar_saldo_recebimento()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contas_bancarias
    SET saldo = saldo + NEW.valor_recebido
    WHERE id_conta_bancaria = NEW.id_conta_bancaria;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_after_insert_recebimento
AFTER INSERT ON recebimento_venda
FOR EACH ROW
EXECUTE FUNCTION atualizar_saldo_recebimento();


CREATE OR REPLACE FUNCTION atualizar_saldo_pagamento()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contas_bancarias
    SET saldo = saldo - NEW.valor_pago
    WHERE id_conta_bancaria = NEW.id_conta_bancaria;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_after_insert_pagamento
AFTER INSERT ON pagamento_compra
FOR EACH ROW
EXECUTE FUNCTION atualizar_saldo_pagamento();


CREATE OR REPLACE FUNCTION atualizar_quantidade_estoque()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.tipo_movimentacao = 'entrada' THEN
            UPDATE produtos SET quantidade_estoque = quantidade_estoque + NEW.quantidade WHERE id_produto = NEW.id_produto;
        ELSIF NEW.tipo_movimentacao = 'saida' THEN
            UPDATE produtos SET quantidade_estoque = quantidade_estoque - NEW.quantidade WHERE id_produto = NEW.id_produto;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.tipo_movimentacao = 'entrada' THEN
            UPDATE produtos SET quantidade_estoque = quantidade_estoque - OLD.quantidade WHERE id_produto = OLD.id_produto;
        ELSIF OLD.tipo_movimentacao = 'saida' THEN
            UPDATE produtos SET quantidade_estoque = quantidade_estoque + OLD.quantidade WHERE id_produto = OLD.id_produto;
        END IF;
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.tipo_movimentacao = 'entrada' THEN
            UPDATE produtos SET quantidade_estoque = quantidade_estoque - OLD.quantidade WHERE id_produto = OLD.id_produto;
        ELSIF OLD.tipo_movimentacao = 'saida' THEN
            UPDATE produtos SET quantidade_estoque = quantidade_estoque + OLD.quantidade WHERE id_produto = OLD.id_produto;
        END IF;
        IF NEW.tipo_movimentacao = 'entrada' THEN
            UPDATE produtos SET quantidade_estoque = quantidade_estoque + NEW.quantidade WHERE id_produto = NEW.id_produto;
        ELSIF NEW.tipo_movimentacao = 'saida' THEN
            UPDATE produtos SET quantidade_estoque = quantidade_estoque - NEW.quantidade WHERE id_produto = NEW.id_produto;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_atualizar_estoque
AFTER INSERT OR DELETE OR UPDATE ON movimentacoes_estoque
FOR EACH ROW
EXECUTE FUNCTION atualizar_quantidade_estoque();