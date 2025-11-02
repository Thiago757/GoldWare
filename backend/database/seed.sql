-- SEÇÃO DE LIMPEZA (Apaga todos os dados e reinicia as contagens)
TRUNCATE TABLE 
    pagamento_compra, recebimento_venda, 
    movimentacoes_estoque, 
    contas_a_pagar, contas_a_receber, 
    itens_os, ordens_servico, 
    itens_compra, compras, 
    itens_venda, vendas,
    servicos, produtos, usuarios, fornecedores, clientes,
    tipos_servico, categorias, cidades, estados, 
    contas_bancarias, formas_pagamento
RESTART IDENTITY CASCADE;

-- DADOS DE APOIO (Tabelas "Lookup")

INSERT INTO estados (nome, sigla) VALUES
('Santa Catarina', 'SC'),
('Rio Grande do Sul', 'RS'),
('Paraná', 'PR');

INSERT INTO cidades (nome, id_estado) VALUES
('Criciúma', 1),
('Florianópolis', 1),
('Porto Alegre', 2),
('Curitiba', 3);

INSERT INTO categorias (nome) VALUES
('Anéis'),
('Colares'),
('Pulseiras'),
('Brincos'),
('Relógios'),
('Alianças');

INSERT INTO tipos_servico (nome) VALUES
('Ajuste'),
('Limpeza'),
('Gravação'),
('Reparo');

INSERT INTO formas_pagamento (nome, ativo) VALUES
('Dinheiro', 'S'),
('Cartão de Crédito', 'S'),
('Cartão de Débito', 'S'),
('Pix', 'S');

INSERT INTO contas_bancarias (nome_conta, banco, agencia, numero_conta, saldo) VALUES
('Conta Principal', 'Banco A', '0001', '12345-6', 10000.00),
('Caixa da Loja', 'Caixa Interno', '', '', 500.00);

-- DADOS PRINCIPAIS (Entidades)

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
(1, 'Ajuste de Anel', 80.00),
(2, 'Limpeza de Joias', 50.00),
(3, 'Gravação Simples', 100.00);

-- Produtos são inseridos com estoque 0.
-- O estoque será atualizado pelas 'movimentacoes_estoque' via TRIGGER.
INSERT INTO produtos (nome, descricao, preco_venda, custo, quantidade_estoque, id_categoria, codigo_barras) VALUES
('Anel de Ouro 18k Solitário', 'Anel solitário com diamante 0.2ct', 1500.00, 800.00, 0, 1, '10001'),
('Colar de Prata 925 Ponto de Luz', 'Colar de 45cm com zircônia', 250.00, 110.00, 0, 2, '10002'),
('Pulseira de Ouro 18k Grumet', 'Pulseira masculina 21cm', 3200.00, 1800.00, 0, 3, '10003'),
('Brinco de Prata 925 Argola', 'Brinco argola 2cm', 180.00, 75.00, 0, 4, '10004'),
('Aliança de Ouro 18k 4mm (Par)', 'Par de alianças tradicionais', 2800.00, 1500.00, 0, 6, '10005'),
('Relógio Masculino Aço', 'Relógio cronógrafo à prova d''água', 950.00, 450.00, 0, 5, '10006');

-- DADOS TRANSACIONAIS (Movimentações)

INSERT INTO vendas (id_cliente, id_usuario, data_venda, valor_total, status) VALUES
(1, 2, '2024-10-01 10:30:00', 1500.00, 'concluida'), -- Venda do João
(2, 2, '2024-10-05 11:45:00', 600.00, 'concluida'), -- Venda do João
(3, 1, '2024-10-06 14:10:00', 2800.00, 'cancelada'), -- Venda do Alexandre (Cancelada)
(1, 2, '2024-10-10 16:00:00', 950.00, 'concluida'); -- Venda do João

INSERT INTO itens_venda (id_venda, id_produto, quantidade, preco_unitario) VALUES
(1, 1, 1, 1500.00), -- Venda 1: Anel Solitário
(2, 2, 2, 250.00),  -- Venda 2: 2 Colares Ponto de Luz
(2, 4, 1, 100.00),  -- Venda 2: 1 Brinco Argola (preço com desconto)
(3, 5, 1, 2800.00), -- Venda 3: Aliança (venda cancelada)
(4, 6, 1, 950.00);  -- Venda 4: Relógio

-- Compras
INSERT INTO compras (id_fornecedor, id_usuario_responsavel, valor_total, numero_nota_fiscal, status) VALUES
(2, 3, 1850.00, 'NF-001', 'recebido'), -- Compra da Maria (Estoquista)
(1, 3, 6200.00, 'NF-002', 'recebido'); -- Compra da Maria (Estoquista)

INSERT INTO itens_compra (id_compra, id_produto, quantidade, custo_unitario) VALUES
(1, 2, 10, 110.00), -- 10 Colares Ponto de Luz
(1, 4, 10, 75.00),  -- 10 Brincos Argola
(2, 1, 5, 800.00),  -- 5 Anéis Solitário
(2, 6, 5, 450.00);  -- 5 Relógios

-- Ordens de Serviço
INSERT INTO ordens_servico (id_cliente, id_usuario_responsavel, data_abertura, status) VALUES
(1, 2, '2024-10-10 09:00:00', 'concluida'),
(2, 2, '2024-10-11 14:00:00', 'em_andamento');

INSERT INTO itens_os (id_os, id_servico, quantidade, prazo_estimado, preco_unitario) VALUES
(1, 2, 1, 1, 50.00), -- Limpeza de Joias para Maria
(2, 1, 1, 3, 80.00); -- Ajuste de Anel para João

-- Contas a Pagar
INSERT INTO contas_a_pagar (id_compra, id_fornecedor, descricao, valor, data_vencimento, status) VALUES
(1, 2, 'Nota Fiscal NF-001 - Pratas & Cia', 1850.00, '2024-10-20', 'pago'),
(2, 1, 'Nota Fiscal NF-002 - Ouro Fino Ltda', 6200.00, '2024-11-15', 'pendente'),
(NULL, 1, 'Aluguel Loja', 3500.00, '2024-11-05', 'pendente'),
(NULL, NULL, 'Conta de Energia Elétrica', 450.00, '2024-11-08', 'pendente');

-- Contas a Receber
INSERT INTO contas_a_receber (id_venda, id_os, id_cliente, numero_parcela, total_parcelas, valor_parcela, data_vencimento, status) VALUES
(1, NULL, 1, 1, 1, 1500.00, '2024-10-01', 'pago'), -- Venda 1
(2, NULL, 2, 1, 2, 300.00, '2024-10-05', 'pago'), -- Venda 2
(2, NULL, 2, 2, 2, 300.00, '2024-11-05', 'pendente'), -- Venda 2
(4, NULL, 1, 1, 1, 950.00, '2024-11-10', 'pendente'), -- Venda 4
(NULL, 1, 1, 1, 1, 50.00, '2024-10-15', 'pago'); -- OS 1

-- MOVIMENTAÇÕES (para disparar os Triggers)

-- Pagamentos (Saídas do Caixa) -> Dispara Trigger de Saldo Bancário
INSERT INTO pagamento_compra (id_conta_pagar, id_conta_bancaria, id_forma_pagamento, valor_pago, data_pagamento) VALUES
(1, 1, 4, 1850.00, '2024-10-20 10:00:00'); -- Pagamento da NF-001 da Conta Principal via Pix

-- Recebimentos (Entradas no Caixa) -> Dispara Trigger de Saldo Bancário
INSERT INTO recebimento_venda (id_conta_receber, id_conta_bancaria, id_forma_pagamento, valor_recebido, data_recebimento) VALUES
(1, 2, 1, 1500.00, '2024-10-01 10:35:00'), -- Venda 1 recebida no Caixa da Loja em Dinheiro
(2, 1, 3, 300.00, '2024-10-05 11:50:00'),  -- Parcela 1 da Venda 2 recebida na Conta Principal via Débito
(5, 2, 1, 50.00, '2024-10-10 09:30:00');   -- OS 1 recebida no Caixa da Loja em Dinheiro

-- Movimentações de Estoque -> Dispara Trigger de Saldo de Estoque
-- Entradas das compras
INSERT INTO movimentacoes_estoque (id_produto, tipo_movimentacao, quantidade, id_item_compra, id_usuario_responsavel, observacao) VALUES
(2, 'entrada', 10, 1, 3, 'Compra ID 1 / NF-001'),
(4, 'entrada', 10, 2, 3, 'Compra ID 1 / NF-001'),
(1, 'entrada', 5, 3, 3, 'Compra ID 2 / NF-002'),
(6, 'entrada', 5, 4, 3, 'Compra ID 2 / NF-002');
-- Saídas das vendas (apenas das concluídas)
INSERT INTO movimentacoes_estoque (id_produto, tipo_movimentacao, quantidade, id_item_venda, id_usuario_responsavel, observacao) VALUES
(1, 'saida', 1, 1, 2, 'Venda ID 1'),
(2, 'saida', 2, 2, 2, 'Venda ID 2'),
(4, 'saida', 1, 3, 2, 'Venda ID 2'),
(6, 'saida', 1, 5, 2, 'Venda ID 4');