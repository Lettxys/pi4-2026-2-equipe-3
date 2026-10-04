BEGIN;

TRUNCATE usuario, token_redefinicao_senha, token_revogado, quiz, quiz_resposta, processo, etapa, etapa_acao,
         tipo_documento, etapa_documento, processo_etapa, condutor_autorizado, documento, dossie
    RESTART IDENTITY CASCADE;

INSERT INTO tipo_documento (id, codigo, nome, dono, regra_validade, validade_dias) VALUES
(1, 'MEDICAL_REPORT_IPI', 'Laudo médico para o IPI', 'HOLDER', 'DAYS_FROM_ISSUE', 365),
(2, 'MEDICAL_REPORT_ICMS', 'Laudo médico para o ICMS e o IPVA', 'HOLDER', 'DAYS_FROM_ISSUE', 365),
(3, 'ID_CARD', 'RG ou CIN', 'HOLDER', 'NONE', NULL),
(4, 'CPF', 'CPF', 'HOLDER', 'NONE', NULL),
(5, 'PROOF_OF_ADDRESS', 'Comprovante de residência', 'HOLDER', 'DAYS_FROM_ISSUE', 90),
(6, 'FINANCIAL_DECLARATION', 'Declaração de disponibilidade financeira', 'HOLDER', 'NONE', NULL),
(7, 'SPECIAL_DRIVER_LICENSE', 'CNH especial com restrições', 'HOLDER', 'PRINTED_EXPIRY', NULL),
(8, 'DRIVER_LICENSE', 'CNH do condutor autorizado', 'DRIVER', 'PRINTED_EXPIRY', NULL),
(9, 'IPI_AUTHORIZATION', 'Autorização de isenção do IPI', 'HOLDER', 'DAYS_FROM_ISSUE', 270),
(10, 'ICMS_AUTHORIZATION', 'Autorização de isenção do ICMS', 'HOLDER', 'DAYS_FROM_ISSUE', 270);

INSERT INTO etapa (id, tipo_perfil, ordem, titulo, orgao, explicacao_simplificada) VALUES
(1, 'PCD_DRIVER', 1, 'Documentos Pessoais', NULL,
    'Envie seu RG ou CIN, seu CPF e um comprovante de residência com no máximo 3 meses. Todos os pedidos usam esses documentos.'),
(2, 'PCD_DRIVER', 2, 'Obtenção do Laudo Médico', 'CLINIC',
    'O laudo é o documento em que o médico confirma a deficiência. A Receita Federal (IPI) e a Secretaria da Fazenda (ICMS e IPVA) usam modelos diferentes, por isso você precisa de dois laudos.'),
(3, 'PCD_DRIVER', 3, 'CNH Especial com Restrição', 'DETRAN',
    'Para pedir a isenção como condutor, sua CNH precisa trazer as restrições e adaptações do seu caso. Sem elas, os órgãos negam o pedido.'),
(4, 'PCD_DRIVER', 4, 'Solicitação de Isenção de IPI no SISEN', 'RECEITA_FEDERAL',
    'Você faz o pedido do IPI pela internet, no SISEN da Receita Federal, com a sua conta gov.br. Se estiver tudo certo, a resposta sai em até 72 horas, e a autorização vale 270 dias.'),
(5, 'PCD_DRIVER', 5, 'Solicitação de Isenção de ICMS e IPVA', 'SEFAZ',
    'Você pede o ICMS à Secretaria da Fazenda do Ceará pelo sistema Tramita e junta uma declaração de que tem dinheiro ou bens para pagar o carro. A autorização vale 270 dias. Depois, com o carro já no seu nome, você pede o IPVA.'),
(6, 'PCD_DRIVER', 6, 'Faturamento na Concessionária', 'DEALERSHIP',
    'Leve as autorizações do IPI e do ICMS dentro da validade. Antes de assinar, confira se o preço cabe no limite e se a nota fiscal traz seu CPF e o valor do imposto dispensado.'),
(7, 'PCD_NON_DRIVER', 1, 'Documentos Pessoais', NULL,
    'Envie seu RG ou CIN, seu CPF e um comprovante de residência com no máximo 3 meses. Todos os pedidos usam esses documentos.'),
(8, 'PCD_NON_DRIVER', 2, 'Obtenção do Laudo Médico', 'CLINIC',
    'O laudo é o documento em que o médico confirma a deficiência. A Receita Federal (IPI) e a Secretaria da Fazenda (ICMS e IPVA) usam modelos diferentes, por isso você precisa de dois laudos.'),
(9, 'PCD_NON_DRIVER', 3, 'Indicação de Condutores', NULL,
    'Como você não vai dirigir, indique até 3 pessoas para dirigir o carro. Cada uma envia a própria CNH, dentro da validade.'),
(10, 'PCD_NON_DRIVER', 4, 'Solicitação de Isenção de IPI no SISEN', 'RECEITA_FEDERAL',
    'Você faz o pedido do IPI pela internet, no SISEN da Receita Federal, com a sua conta gov.br. Se estiver tudo certo, a resposta sai em até 72 horas, e a autorização vale 270 dias.'),
(11, 'PCD_NON_DRIVER', 5, 'Solicitação de Isenção de ICMS e IPVA', 'SEFAZ',
    'Você pede o ICMS à Secretaria da Fazenda do Ceará pelo sistema Tramita e junta uma declaração de que tem dinheiro ou bens para pagar o carro. A autorização vale 270 dias. Depois, com o carro já no seu nome, você pede o IPVA.'),
(12, 'PCD_NON_DRIVER', 6, 'Faturamento na Concessionária', 'DEALERSHIP',
    'Leve as autorizações do IPI e do ICMS dentro da validade. Antes de assinar, confira se o preço cabe no limite e se a nota fiscal traz seu CPF e o valor do imposto dispensado.');

INSERT INTO etapa_acao (etapa_id, ordem, descricao) VALUES
(1, 1, 'Separar o RG (ou a CIN) e o CPF'),
(1, 2, 'Pegar um comprovante de residência emitido nos últimos 3 meses'),
(1, 3, 'Enviar os arquivos em PDF, JPG ou PNG'),
(2, 1, 'Agendar consulta com médico credenciado'),
(2, 2, 'Solicitar o preenchimento do formulário padrão de isenção'),
(2, 3, 'Conferir a data de emissão e realizar o upload no sistema'),
(3, 1, 'Agendar a perícia médica no Detran'),
(3, 2, 'Fazer o exame prático em veículo adaptado'),
(3, 3, 'Conferir se as restrições aparecem na CNH nova'),
(4, 1, 'Entrar no SISEN com a conta gov.br'),
(4, 2, 'Preencher o pedido e anexar o laudo do IPI'),
(4, 3, 'Enviar aqui a autorização quando o pedido for aprovado'),
(5, 1, 'Preencher a declaração de disponibilidade financeira'),
(5, 2, 'Abrir o pedido de ICMS no Tramita com o laudo do ICMS'),
(5, 3, 'Enviar aqui a autorização quando o pedido for aprovado'),
(5, 4, 'Pedir a isenção do IPVA depois que o carro estiver no seu nome'),
(6, 1, 'Entregar as autorizações do IPI e do ICMS dentro da validade'),
(6, 2, 'Conferir se o preço do carro está dentro do limite da isenção'),
(6, 3, 'Conferir se a nota fiscal traz seu CPF e o imposto dispensado'),
(7, 1, 'Separar o RG (ou a CIN) e o CPF'),
(7, 2, 'Pegar um comprovante de residência emitido nos últimos 3 meses'),
(7, 3, 'Enviar os arquivos em PDF, JPG ou PNG'),
(8, 1, 'Agendar consulta com médico credenciado'),
(8, 2, 'Solicitar o preenchimento do formulário padrão de isenção'),
(8, 3, 'Conferir a data de emissão e realizar o upload no sistema'),
(9, 1, 'Cadastrar até 3 condutores que morem na sua cidade'),
(9, 2, 'Enviar a CNH de cada condutor'),
(9, 3, 'Conferir se as CNHs estão dentro da validade'),
(10, 1, 'Entrar no SISEN com a conta gov.br'),
(10, 2, 'Preencher o pedido e anexar o laudo do IPI'),
(10, 3, 'Indicar os condutores pelo ChatRFB, na opção Protocolar Processo'),
(10, 4, 'Enviar aqui a autorização quando o pedido for aprovado'),
(11, 1, 'Preencher a declaração de disponibilidade financeira'),
(11, 2, 'Abrir o pedido de ICMS no Tramita com o laudo do ICMS'),
(11, 3, 'Enviar aqui a autorização quando o pedido for aprovado'),
(11, 4, 'Pedir a isenção do IPVA depois que o carro estiver no seu nome'),
(12, 1, 'Entregar as autorizações do IPI e do ICMS dentro da validade'),
(12, 2, 'Conferir se o preço do carro está dentro do limite da isenção'),
(12, 3, 'Conferir se a nota fiscal traz seu CPF e o imposto dispensado');

INSERT INTO etapa_documento (etapa_id, tipo_documento_id) VALUES
(1, 3), (1, 4), (1, 5),
(2, 1), (2, 2),
(3, 7),
(4, 9),
(5, 6), (5, 10),
(7, 3), (7, 4), (7, 5),
(8, 1), (8, 2),
(9, 8),
(10, 9),
(11, 6), (11, 10);

INSERT INTO usuario (id, nome_completo, cpf, email, telefone, data_nascimento, papel, cep, logradouro, numero, complemento, bairro, cidade, uf, criado_em, atualizado_em) VALUES
(1, 'Emanuel Carvalho', NULL, 'admin@example.com', NULL, NULL, 'ADMIN', NULL, NULL, NULL, NULL, NULL, NULL, NULL, now() - interval '120 days', now() - interval '120 days'),
(2, 'Karla Carvalho Melo', '11621718123', 'karla_melo79@example.com', '88912058571', '1977-09-16', 'USER', '63700000', 'Travessa Albuquerque', '1558', 'Apto. 071', 'São José', 'Crateús', 'CE', now() - interval '54 days', now() - interval '54 days'),
(3, 'Norberto Xavier Macedo', '50049011049', 'norberto57@example.com', '88935763690', '1963-01-21', 'USER', '63740000', 'Travessa Heitor', '1620', 'Casa 5', 'Centro', 'Novo Oriente', 'CE', now() - interval '51 days', now() - interval '51 days'),
(4, 'Ana Luiza Xavier Costa', '69379253877', 'analuiza_costa52@example.com', '88937354041', '1953-04-26', 'USER', '63700000', 'Avenida Costa', '603', NULL, 'São José', 'Crateús', 'CE', now() - interval '48 days', now() - interval '48 days'),
(5, 'Roberta Costa Oliveira', '49097705690', 'roberta57@example.com', '88945810487', '1979-07-07', 'USER', '63700000', 'Avenida Braga', '1013', 'Casa 6', 'São José', 'Crateús', 'CE', now() - interval '45 days', now() - interval '45 days'),
(6, 'Ladislau Carvalho Saraiva', '36063648810', 'ladislau_saraiva@example.com', '88942263758', '1986-01-06', 'USER', '63900000', 'Travessa Luiza', '1913', 'Sobrado 55', 'Planalto', 'Quixadá', 'CE', now() - interval '42 days', now() - interval '42 days'),
(7, 'Isaac Martins Oliveira', '06652810484', 'isaac_oliveira4@example.com', '88958999177', '1958-05-16', 'USER', '62320000', 'Rua Isaac', '1521', NULL, 'Centro', 'Tianguá', 'CE', now() - interval '39 days', now() - interval '39 days'),
(8, 'Tertuliano Reis Franco', '69405668137', 'tertuliano_franco@example.com', '88939827169', '2005-04-06', 'USER', '62010000', 'Avenida Sara', '2087', NULL, 'Centro', 'Sobral', 'CE', now() - interval '36 days', now() - interval '36 days'),
(9, 'Elisa Moreira Silva', '00048207977', 'elisa_silva59@example.com', '88951025698', '2017-02-06', 'USER', '62320000', 'Avenida Santos', '380', NULL, 'São José', 'Tianguá', 'CE', now() - interval '33 days', now() - interval '33 days'),
(10, 'Mércia Reis Xavier', '50084793422', 'mercia.xavier@example.com', '85954825304', '1992-12-08', 'USER', '60339095', 'Avenida Pereira', '805', NULL, 'Meireles', 'Fortaleza', 'CE', now() - interval '30 days', now() - interval '30 days'),
(11, 'Vitor Souza Costa', '09244959445', 'vitor_costa58@example.com', '85972684192', '1953-07-28', 'USER', '60934593', 'Travessa Márcia', '700', 'Casa 4', 'Montese', 'Fortaleza', 'CE', now() - interval '27 days', now() - interval '27 days'),
(12, 'Cecília Moraes Xavier', '30589525891', 'cecilia.xavier25@example.com', '88949440745', '1990-03-16', 'USER', '63700000', 'Rua Larissa', '1207', NULL, 'Nova Esperança', 'Crateús', 'CE', now() - interval '3 days', now() - interval '3 days'),
(13, 'Maria Clara Albuquerque Martins', '91101488174', 'mariaclara.martins@example.com', '85949757302', '2017-06-06', 'USER', '60297124', 'Rua Pereira', '1701', NULL, 'Parangaba', 'Fortaleza', 'CE', now() - interval '2 days', now() - interval '2 days'),
(14, 'Fabrícia Carvalho Santos', '16770896281', 'fabricia99@example.com', '88954473978', '1966-12-08', 'USER', '63700000', 'Travessa Tertuliano', '2247', NULL, 'Nova Esperança', 'Crateús', 'CE', now() - interval '21 days', now() - interval '21 days'),
(15, 'Paula Macedo Reis', '06087434291', 'paula95@example.com', '85939980989', '2011-12-30', 'USER', '60351857', 'Avenida Antônio', '1815', NULL, 'Benfica', 'Fortaleza', 'CE', now() - interval '16 days', now() - interval '16 days'),
(16, 'Carlos Braga Xavier', '29063206925', 'carlos38@example.com', '88986571206', '1959-03-16', 'USER', '63700000', 'Rua Batista', '784', NULL, 'São José', 'Crateús', 'CE', now() - interval '26 days', now() - interval '26 days'),
(17, 'Giovanna Martins Oliveira', '76199793013', 'giovanna_oliveira@example.com', '85944636817', '1983-10-05', 'USER', '60801746', 'Travessa Yago', '1439', NULL, 'Messejana', 'Fortaleza', 'CE', now() - interval '13 days', now() - interval '13 days'),
(18, 'Fabrício Carvalho Moraes', '22834366306', 'fabricio_moraes50@example.com', '88913998062', '1994-01-17', 'USER', '63010000', 'Rua Davi', '412', 'Lote 04', 'Nova Esperança', 'Juazeiro do Norte', 'CE', now() - interval '7 days', now() - interval '7 days'),
(19, 'Dalila Oliveira Xavier', '64639127863', 'dalila53@example.com', '88981649540', '2001-05-13', 'USER', '63700000', 'Rua Batista', '784', NULL, 'São José', 'Crateús', 'CE', now() - interval '40 days', now() - interval '40 days'),
(20, 'Marina Souza Batista', '95671198054', 'marina_batista@example.com', '88901516684', '1998-06-04', 'USER', '63700000', 'Alameda Costa', '775', NULL, 'Centro', 'Crateús', 'CE', now() - interval '3 days', now() - interval '3 days');

-- senha de todos os usuários: Senha@123
UPDATE usuario SET senha_hash = 'AQAAAAIAAYagAAAAEDS9PCXaPjsyUKM8SxkVc/Hn0XdHEAml4cWmLlxXm6TF7kXI1YsTYGdTUWN8CNaWcg==';

INSERT INTO token_redefinicao_senha (usuario_id, token_hash, expira_em, criado_em)
SELECT id, encode(sha256(gen_random_uuid()::text::bytea), 'hex'), now() + interval '30 minutes', now()
FROM usuario
WHERE id BETWEEN 2 AND 11;

INSERT INTO token_revogado (jti, expira_em)
SELECT gen_random_uuid()::text, now() + interval '1 hour'
FROM generate_series(1, 10);

INSERT INTO quiz (id, usuario_id, token_anonimo, tipo_perfil, tipo_deficiencia, elegivel, consentimento_em, criado_em, vinculado_em) VALUES
(1, 2, gen_random_uuid(), 'PCD_DRIVER', 'PHYSICAL', true, now() - interval '54 days 1 hour', now() - interval '54 days 1 hour', now() - interval '54 days'),
(2, 4, gen_random_uuid(), 'PCD_DRIVER', 'PHYSICAL', true, now() - interval '48 days 1 hour', now() - interval '48 days 1 hour', now() - interval '48 days'),
(3, 5, gen_random_uuid(), 'PCD_DRIVER', 'PHYSICAL', true, now() - interval '45 days 1 hour', now() - interval '45 days 1 hour', now() - interval '45 days'),
(4, 7, gen_random_uuid(), 'PCD_NON_DRIVER', 'VISUAL', true, now() - interval '39 days 1 hour', now() - interval '39 days 1 hour', now() - interval '39 days'),
(5, 9, gen_random_uuid(), 'PCD_NON_DRIVER', 'AUTISM', true, now() - interval '33 days 1 hour', now() - interval '33 days 1 hour', now() - interval '33 days'),
(6, 11, gen_random_uuid(), 'PCD_NON_DRIVER', 'PHYSICAL', true, now() - interval '27 days 1 hour', now() - interval '27 days 1 hour', now() - interval '27 days'),
(7, 12, gen_random_uuid(), 'PCD_DRIVER', 'PHYSICAL', true, now() - interval '3 days 1 hour', now() - interval '3 days 1 hour', now() - interval '3 days'),
(8, 14, gen_random_uuid(), 'PCD_DRIVER', 'PHYSICAL', true, now() - interval '21 days 1 hour', now() - interval '21 days 1 hour', now() - interval '21 days'),
(9, 16, gen_random_uuid(), 'PCD_NON_DRIVER', 'PHYSICAL', true, now() - interval '26 days 1 hour', now() - interval '26 days 1 hour', now() - interval '26 days'),
(10, 17, gen_random_uuid(), 'PCD_DRIVER', 'PHYSICAL', true, now() - interval '13 days 1 hour', now() - interval '13 days 1 hour', now() - interval '13 days'),
(11, 20, gen_random_uuid(), 'PCD_DRIVER', 'HEARING', true, now() - interval '3 days 1 hour', now() - interval '3 days 1 hour', now() - interval '3 days'),
(12, NULL, gen_random_uuid(), 'PCD_NON_DRIVER', 'VISUAL', true, now() - interval '9 days', now() - interval '9 days', NULL);

INSERT INTO quiz_resposta (quiz_id, codigo_pergunta, resposta)
SELECT id, 'profileType', tipo_perfil FROM quiz WHERE tipo_perfil IS NOT NULL
UNION ALL
SELECT id, 'disabilityType', tipo_deficiencia FROM quiz WHERE tipo_deficiencia IS NOT NULL;

INSERT INTO processo (id, usuario_id, quiz_id, tipo_perfil, tipo_deficiencia, status, cnh_numero, cnh_validade, cnh_possui_restricao, veiculo_modelo, veiculo_valor, data_prevista_compra, data_ultima_compra_isenta, aceite_zero_km_em, criado_em, atualizado_em, concluido_em) VALUES
(1, 2, 1, 'PCD_DRIVER', 'PHYSICAL', 'COMPLETED', '25970723270', current_date + 1460, true, 'Chevrolet Onix Plus LT 1.0 Turbo', 98990.00, current_date + 10, NULL, now() - interval '53 days', now() - interval '53 days', now() - interval '28 days', now() - interval '28 days'),
(2, 3, NULL, 'PCD_DRIVER', 'PHYSICAL', 'COMPLETED', '52826175298', current_date + 1100, true, 'Hyundai HB20S Comfort 1.0', 94590.00, current_date + 15, NULL, now() - interval '50 days', now() - interval '50 days', now() - interval '25 days', now() - interval '25 days'),
(3, 4, 2, 'PCD_DRIVER', 'PHYSICAL', 'COMPLETED', '54361834786', current_date + 900, true, 'Fiat Cronos Drive 1.3', 92990.00, current_date + 20, NULL, now() - interval '47 days', now() - interval '47 days', now() - interval '22 days', now() - interval '22 days'),
(4, 5, 3, 'PCD_DRIVER', 'PHYSICAL', 'COMPLETED', '37518456754', current_date + 2200, true, 'Volkswagen Virtus TSI', 119990.00, current_date + 25, NULL, now() - interval '44 days', now() - interval '44 days', now() - interval '19 days', now() - interval '19 days'),
(5, 6, NULL, 'PCD_DRIVER', 'PHYSICAL', 'COMPLETED', '91779445216', current_date + 1300, true, 'Nissan Kicks Sense', 117490.00, current_date + 30, NULL, now() - interval '41 days', now() - interval '41 days', now() - interval '16 days', now() - interval '16 days'),
(6, 7, 4, 'PCD_NON_DRIVER', 'VISUAL', 'COMPLETED', NULL, NULL, NULL, 'Toyota Yaris Sedan XL', 109990.00, current_date + 12, NULL, now() - interval '38 days', now() - interval '38 days', now() - interval '13 days', now() - interval '13 days'),
(7, 8, NULL, 'PCD_NON_DRIVER', 'DOWN_SYNDROME', 'COMPLETED', NULL, NULL, NULL, 'Renault Kwid Zen 1.0', 69990.00, current_date + 18, NULL, now() - interval '35 days', now() - interval '35 days', now() - interval '10 days', now() - interval '10 days'),
(8, 9, 5, 'PCD_NON_DRIVER', 'AUTISM', 'COMPLETED', NULL, NULL, NULL, 'Volkswagen T-Cross Sense', 117990.00, current_date + 22, NULL, now() - interval '32 days', now() - interval '32 days', now() - interval '7 days', now() - interval '7 days'),
(9, 10, NULL, 'PCD_NON_DRIVER', 'INTELLECTUAL', 'COMPLETED', NULL, NULL, NULL, 'Fiat Pulse Drive 1.3', 104990.00, current_date + 28, NULL, now() - interval '29 days', now() - interval '29 days', now() - interval '4 days', now() - interval '4 days'),
(10, 11, 6, 'PCD_NON_DRIVER', 'PHYSICAL', 'COMPLETED', NULL, NULL, NULL, 'Hyundai Creta Action', 119490.00, current_date + 35, NULL, now() - interval '26 days', now() - interval '26 days', now() - interval '1 day', now() - interval '1 day'),
(11, 12, 7, 'PCD_DRIVER', 'PHYSICAL', 'DRAFT', NULL, NULL, NULL, 'Fiat Argo Drive 1.0', 86990.00, current_date + 90, NULL, now() - interval '2 days', now() - interval '2 days', now() - interval '1 day', NULL),
(12, 13, NULL, 'PCD_NON_DRIVER', 'AUTISM', 'DRAFT', NULL, NULL, NULL, NULL, NULL, NULL, NULL, now() - interval '1 day', now() - interval '1 day', now() - interval '1 day', NULL),
(13, 14, 8, 'PCD_DRIVER', 'PHYSICAL', 'IN_PROGRESS', NULL, NULL, NULL, 'Chevrolet Onix LT 1.0', 89990.00, current_date + 75, NULL, now() - interval '20 days', now() - interval '20 days', now() - interval '12 days', NULL),
(14, 15, NULL, 'PCD_NON_DRIVER', 'DOWN_SYNDROME', 'IN_PROGRESS', NULL, NULL, NULL, 'Renault Kardian Evolution', 112990.00, current_date + 60, NULL, now() - interval '15 days', now() - interval '15 days', now() - interval '1 day', NULL),
(15, 16, 9, 'PCD_NON_DRIVER', 'PHYSICAL', 'IN_PROGRESS', NULL, NULL, NULL, 'Volkswagen Polo Track', 84990.00, current_date + 45, NULL, now() - interval '25 days', now() - interval '25 days', now() - interval '13 days', NULL),
(16, 17, 10, 'PCD_DRIVER', 'PHYSICAL', 'BLOCKED', NULL, NULL, NULL, 'Fiat Cronos Drive 1.3', 92990.00, current_date + 50, NULL, now() - interval '12 days', now() - interval '12 days', now() - interval '5 days', NULL),
(17, 18, NULL, 'PCD_NON_DRIVER', 'VISUAL', 'BLOCKED', NULL, NULL, NULL, 'Hyundai HB20 Comfort 1.0', 89990.00, current_date + 40, NULL, now() - interval '6 days', now() - interval '6 days', now() - interval '3 days', NULL);

INSERT INTO condutor_autorizado (id, processo_id, usuario_id, posicao, nome, cpf, cnh_numero, cnh_validade, parentesco, criado_em) VALUES
(1, 6, NULL, 1, 'Isabelly Melo Oliveira', '35086283027', '63795156283', current_date + 1825, 'SPOUSE', now() - interval '29 days'),
(2, 7, NULL, 1, 'Larissa Barros Franco', '80490761720', '47478523140', current_date + 2400, 'MOTHER', now() - interval '26 days'),
(3, 7, NULL, 2, 'Matheus Reis Franco', '16108807571', '64736085853', current_date + 980, 'FATHER', now() - interval '26 days'),
(4, 8, NULL, 1, 'Eduarda Souza Silva', '00093505191', '32366849716', current_date + 3100, 'MOTHER', now() - interval '23 days'),
(5, 8, NULL, 2, 'Fabiano Barros Silva', '94026835260', '28730408714', current_date + 1500, 'FATHER', now() - interval '23 days'),
(6, 8, NULL, 3, 'Salvador Braga Silva', '55591495273', '43765760953', current_date + 3500, 'SIBLING', now() - interval '23 days'),
(7, 9, NULL, 1, 'Daniel Costa Oliveira', '08793458371', '56064455036', current_date + 700, 'OTHER', now() - interval '20 days'),
(8, 10, NULL, 1, 'Marcela Martins Costa', '27099785559', '69571435121', current_date + 1200, 'SPOUSE', now() - interval '17 days'),
(9, 10, NULL, 2, 'Roberto Braga Costa', '65890389106', '63725579470', current_date + 2900, 'CHILD', now() - interval '17 days'),
(10, 14, NULL, 1, 'Eloá Santos Reis', '21982189762', '15744933611', current_date + 1650, 'MOTHER', now() - interval '5 days'),
(11, 14, NULL, 2, 'Matheus Carvalho Reis', '51753292352', '78785621281', current_date + 2050, 'FATHER', now() - interval '5 days'),
(12, 15, NULL, 1, 'Aline Macedo Xavier', '22589491905', '49445163701', current_date + 1400, 'SPOUSE', now() - interval '16 days'),
(13, 15, 19, 2, 'Dalila Oliveira Xavier', '64639127863', '61358295330', current_date + 3300, 'CHILD', now() - interval '16 days'),
(14, 15, NULL, 3, 'Esther Moreira Xavier', '97428714931', '06544777915', current_date + 1100, 'SIBLING', now() - interval '16 days');

INSERT INTO processo_etapa (processo_id, etapa_id, status, validada_em, atualizado_em)
SELECT p.id,
       e.id,
       CASE
           WHEN e.ordem <= v.etapas_validadas THEN 'VALIDATED'
           WHEN e.ordem = v.etapas_validadas + 1 THEN 'IN_PROGRESS'
           ELSE 'LOCKED'
       END,
       CASE WHEN e.ordem <= v.etapas_validadas THEN p.criado_em + e.ordem * interval '4 days' END,
       CASE WHEN e.ordem <= v.etapas_validadas THEN p.criado_em + e.ordem * interval '4 days' ELSE p.criado_em END
FROM processo p
JOIN etapa e ON e.tipo_perfil = p.tipo_perfil
JOIN (VALUES
    (1, 6), (2, 6), (3, 6), (4, 6), (5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (10, 6),
    (11, 0), (12, 0), (13, 2), (14, 2), (15, 3), (16, 1), (17, 0)
) AS v(processo_id, etapas_validadas) ON v.processo_id = p.id
ORDER BY p.id, e.ordem;

INSERT INTO documento (processo_id, condutor_autorizado_id, tipo_documento_id, status, data_emissao, data_validade, caminho_arquivo, nome_original, tipo_conteudo, tamanho_bytes, enviado_em)
SELECT p.id,
       c.id,
       t.id,
       'VALID',
       CASE WHEN t.regra_validade <> 'PRINTED_EXPIRY' THEN (pe.validada_em - interval '10 days')::date END,
       CASE t.regra_validade
           WHEN 'DAYS_FROM_ISSUE' THEN (pe.validada_em - interval '10 days')::date + t.validade_dias
           WHEN 'PRINTED_EXPIRY' THEN coalesce(c.cnh_validade, p.cnh_validade)
       END,
       'uploads/' || gen_random_uuid() || '.pdf',
       t.nome || '.pdf',
       'application/pdf',
       100000 + (random() * 1500000)::int,
       pe.validada_em - interval '1 day'
FROM processo_etapa pe
JOIN processo p ON p.id = pe.processo_id
JOIN etapa_documento ed ON ed.etapa_id = pe.etapa_id
JOIN tipo_documento t ON t.id = ed.tipo_documento_id
LEFT JOIN condutor_autorizado c ON c.processo_id = p.id AND t.dono = 'DRIVER'
WHERE pe.status = 'VALIDATED'
  AND (t.dono = 'HOLDER' OR c.id IS NOT NULL)
ORDER BY p.id, pe.etapa_id, t.id, c.id;

INSERT INTO documento (processo_id, condutor_autorizado_id, tipo_documento_id, status, data_emissao, data_validade, caminho_arquivo, nome_original, tipo_conteudo, tamanho_bytes, enviado_em) VALUES
(17, NULL, 3, 'VALID', current_date - 3000, NULL, 'uploads/' || gen_random_uuid() || '.pdf', 'rg.pdf', 'application/pdf', 402115, now() - interval '3 days'),
(17, NULL, 4, 'VALID', current_date - 3, NULL, 'uploads/' || gen_random_uuid() || '.png', 'cpf.png', 'image/png', 98304, now() - interval '3 days'),
(17, NULL, 5, 'REJECTED', current_date - 15, current_date + 75, 'uploads/' || gen_random_uuid() || '.jpg', 'comprovante_endereco.jpg', 'image/jpeg', 2457600, now() - interval '3 days');

INSERT INTO dossie (processo_id, status, caminho_arquivo, total_documentos, gerado_em)
SELECT p.id, 'GENERATED', 'dossies/' || gen_random_uuid() || '.zip', count(*), p.concluido_em
FROM processo p
JOIN documento d ON d.processo_id = p.id
WHERE p.status = 'COMPLETED'
GROUP BY p.id
ORDER BY p.id;

SELECT setval(pg_get_serial_sequence('tipo_documento', 'id'), max(id)) FROM tipo_documento;
SELECT setval(pg_get_serial_sequence('etapa', 'id'), max(id)) FROM etapa;
SELECT setval(pg_get_serial_sequence('usuario', 'id'), max(id)) FROM usuario;
SELECT setval(pg_get_serial_sequence('quiz', 'id'), max(id)) FROM quiz;
SELECT setval(pg_get_serial_sequence('processo', 'id'), max(id)) FROM processo;
SELECT setval(pg_get_serial_sequence('condutor_autorizado', 'id'), max(id)) FROM condutor_autorizado;

COMMIT;
