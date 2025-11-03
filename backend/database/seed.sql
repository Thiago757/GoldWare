-- Etapa 1: População dos Dados de Apoio (Lookup)
INSERT INTO estados (nome, sigla) VALUES
('Santa Catarina', 'SC'),
('Rio Grande do Sul', 'RS'),
('Paraná', 'PR');

INSERT INTO cidades (nome, id_estado, uf) VALUES
('Criciúma', 1, 'SC'),
('Florianópolis', 1, 'SC'),
('Porto Alegre', 2, 'RS'),
('Curitiba', 3, 'PR');

INSERT INTO categorias (nome) VALUES
('Anéis'), ('Colares'), ('Pulseiras'), ('Brincos'), ('Relógios'), ('Alianças');

INSERT INTO tipos_servico (nome) VALUES
('Ajuste'), ('Limpeza'), ('Gravação'), ('Reparo');

INSERT INTO formas_pagamento (nome, ativo) VALUES
('Dinheiro', 'S'), ('Cartão de Crédito', 'S'), ('Cartão de Débito', 'S'), ('Pix', 'S');

INSERT INTO contas_bancarias (nome_conta, banco, saldo) VALUES
('Conta Principal (Banco A)', 'Banco A', 10000.00),
('Caixa da Loja', 'Caixa Interno', 500.00);

-- Etapa 2: População dos Dados Principais (Entidades)
INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES
('Alexandre', 'alexandretibes9@gmail.com', '$2b$10$/nhwI/5J1UX3jfAnBncqGugPRqhDi0dVZ2CiFFn7J8yBKSOdFKrCC', 'admin'),
('João Vendedor', 'joao@goldware.com', '$2b$10$fakehashparavendedor1', 'vendedor'),
('Maria Estoquista', 'maria@goldware.com', '$2b$10$fakehashparaestoque1', 'estoquista');

INSERT INTO clientes (nome, cpf, telefone, email, id_cidade, id_estado, status) VALUES
('Maria Silva', '111.111.111-11', '(48) 99999-1111', 'maria.silva@email.com', 1, 1, 'ativo'),
('João Santos', '222.222.222-22', '(48) 99999-2222', 'joao.santos@email.com', 2, 1, 'ativo'),
('Ana Paula', '333.333.333-33', '(51) 99999-3333', 'ana.paula@email.com', 3, 2, 'inativo');

INSERT INTO fornecedores (nome, cnpj, id_cidade, responsavel) VALUES
('Ouro Fino Ltda', '12.345.678/0001-99', 4, 'Carlos Andrade'),
('Pratas & Cia', '98.765.432/0001-11', 1, 'Beatriz Lima');

INSERT INTO servicos (id_tipo_servico, nome, preco_base) VALUES
(1, 'Ajuste de Anel', 80.00), (2, 'Limpeza de Joias', 50.00), (3, 'Gravação Simples', 100.00);

INSERT INTO produtos (nome, descricao, preco_venda, custo, quantidade_estoque, id_categoria, codigo_barras) VALUES
('Anel de Ouro 18k Solitário', 'Anel solitário com diamante 0.2ct', 1500.00, 800.00, 0, 1, '10001'),
('Colar de Prata 925 Ponto de Luz', 'Colar de 45cm com zircônia', 250.00, 110.00, 0, 2, '10002'),
('Pulseira de Ouro 18k Grumet', 'Pulseira masculina 21cm', 3200.00, 1800.00, 0, 3, '10003'),
('Brinco de Prata 925 Argola', 'Brinco argola 2cm', 180.00, 75.00, 0, 4, '10004'),
('Aliança de Ouro 18k 4mm (Par)', 'Par de alianças tradicionais', 2800.00, 1500.00, 0, 6, '10005'),
('Relógio Masculino Aço', 'Relógio cronógrafo à prova d''água', 950.00, 450.00, 0, 5, '10006');

-- Etapa 3: População dos Dados Transacionais (Movimentações)

-- (INSERTs de estados, cidades, categorias, usuarios, clientes, produtos, etc...)

-- INSERTS DE VENDAS (COM O ID_USUARIO)
INSERT INTO vendas (id_venda, id_cliente, id_usuario, data_venda, valor_total, status) VALUES
(1, 1, 2, '2025-10-01 10:30:00', 1500.00, 'concluida'), -- Venda do João (ID 2)
(2, 2, 2, '2025-10-05 11:45:00', 600.00, 'concluida'), -- Venda do João (ID 2)
(3, 3, 1, '2025-10-06 14:10:00', 2800.00, 'cancelada'),-- Venda do Alexandre (ID 1)
(4, 1, 2, '2025-11-01 16:00:00', 950.00, 'concluida'); -- Venda do João (ID 2) no mês atual

-- (Resto dos INSERTs...)
INSERT INTO itens_venda (id_venda, id_produto, quantidade, preco_unitario) VALUES
(1, 1, 1, 1500.00), (2, 2, 2, 250.00), (2, 4, 1, 100.00), (3, 5, 1, 2800.00), (4, 6, 1, 950.00); 

INSERT INTO compras (id_fornecedor, id_usuario_responsavel, valor_total, numero_nota_fiscal, status, data_compra) VALUES
(2, 3, 1850.00, 'NF-001', 'recebido', '2025-10-15 09:00:00'),
(1, 3, 6200.00, 'NF-002', 'recebido', '2025-10-20 09:00:00');

INSERT INTO itens_compra (id_compra, id_produto, quantidade, custo_unitario) VALUES
(1, 2, 10, 110.00), (1, 4, 10, 75.00), (2, 1, 5, 800.00), (2, 6, 5, 450.00); 

INSERT INTO ordens_servico (id_cliente, id_usuario_responsavel, data_abertura, status) VALUES
(1, 2, '2025-10-10 09:00:00', 'concluida'), (2, 2, '2025-10-11 14:00:00', 'em_andamento');

INSERT INTO itens_os (id_os, id_servico, quantidade, prazo_estimado, preco_unitario) VALUES
(1, 2, 1, 1, 50.00), (2, 1, 1, 3, 80.00);

INSERT INTO contas_a_pagar (id_compra, id_fornecedor, descricao, valor, data_vencimento, status) VALUES
(1, 2, 'Nota Fiscal NF-001 - Pratas & Cia', 1850.00, '2025-10-20', 'pago'),
(2, 1, 'Nota Fiscal NF-002 - Ouro Fino Ltda', 6200.00, '2025-11-15', 'pendente'),
(NULL, 1, 'Aluguel Loja', 3500.00, '2025-11-05', 'pendente'),
(NULL, NULL, 'Conta de Energia Elétrica', 450.00, '2025-11-08', 'pendente');

INSERT INTO contas_a_receber (id_venda, id_os, id_cliente, numero_parcela, total_parcelas, valor_parcela, data_vencimento, status) VALUES
(1, NULL, 1, 1, 1, 1500.00, '2025-10-01', 'pago'),
(2, NULL, 2, 1, 2, 300.00, '2025-10-05', 'pago'),
(2, NULL, 2, 2, 2, 300.00, '2025-11-05', 'pendente'),
(4, NULL, 1, 1, 1, 950.00, '2025-11-10', 'pendente'),
(NULL, 1, 1, 1, 1, 50.00, '2025-10-15', 'pago');

-- Etapa 4: Movimentações (Vão disparar os Triggers)
INSERT INTO pagamento_compra (id_conta_pagar, id_conta_bancaria, id_forma_pagamento, valor_pago, data_pagamento) VALUES
(1, 1, 4, 1850.00, '2025-10-20 10:00:00');

INSERT INTO recebimento_venda (id_conta_receber, id_conta_bancaria, id_forma_pagamento, valor_recebido, data_recebimento) VALUES
(1, 2, 1, 1500.00, '2025-10-01 10:35:00'),
(2, 1, 3, 300.00, '2025-10-05 11:50:00'),
(5, 2, 1, 50.00, '2025-10-10 09:30:00');

INSERT INTO movimentacoes_estoque (id_produto, tipo_movimentacao, quantidade, id_item_compra, id_usuario_responsavel, observacao) VALUES
(2, 'entrada', 10, 1, 3, 'Compra ID 1 / NF-001'),
(4, 'entrada', 10, 2, 3, 'Compra ID 1 / NF-001'),
(1, 'entrada', 5, 3, 3, 'Compra ID 2 / NF-002'),
(6, 'entrada', 5, 4, 3, 'Compra ID 2 / NF-002');
INSERT INTO movimentacoes_estoque (id_produto, tipo_movimentacao, quantidade, id_item_venda, id_usuario_responsavel, observacao) VALUES
(1, 'saida', 1, 1, 2, 'Venda ID 1'),
(2, 'saida', 2, 2, 2, 'Venda ID 2'),
(4, 'saida', 1, 3, 2, 'Venda ID 2'),
(6, 'saida', 1, 5, 2, 'Venda ID 4');