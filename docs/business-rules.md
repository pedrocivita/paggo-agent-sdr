# Regras de negócio

Entregável do case. Conferidas em 17/10/2026 com o deck institucional da Paggo e em 19/10/2026 com o código, que confirma o foco em construtoras e incorporadoras ([paggo.md](paggo.md)). As regras de fit estão em uso nas instruções do agente de pesquisa (`agent/instructions.md`); as de conversa e agenda, no prompt da voz (`voice/prompt.md`).

## Índice

- [Formulário](#formulário)
- [Qualificação](#qualificação)
- [Fit da empresa](#fit-da-empresa)
- [Pesquisa](#pesquisa)
- [SPICED](#spiced)
- [Resultado da conversa](#resultado-da-conversa)
- [Agenda](#agenda)
- [Conversa](#conversa)
- [Dados pessoais](#dados-pessoais)

## Formulário

- Pede nome completo, e-mail de trabalho, telefone, **cargo**, empresa e um campo livre opcional. O cargo usa as opções do formulário da própria Paggo, e cada uma vira o papel na compra que o time comercial dela usa: Decisor Financeiro, Influenciador Técnico, Usuário Principal ou Decisor Não-Financeiro ([paggo.md](paggo.md#como-a-paggo-capta-leads-hoje)). A pesquisa recebe o cargo, a voz não pergunta de novo, e o painel mostra a persona.
- Segmento e desafio principal ficam de fora, de propósito: a pesquisa descobre o segmento pelo CNAE, e a conversa descobre a dor. Formulário curto é menos atrito.
- Aceite obrigatório para guardar e processar os dados, com aviso de que a pesquisa usa dados públicos da empresa e de que a conversa é com IA. A data e hora do aceite ficam no lead.
- A origem do lead (as UTM da URL e o site de origem) vai em campos escondidos e aparece no painel, para medir o custo por canal. Nenhum cookie é gravado, e a pesquisa e a voz não a recebem.
- Um campo escondido que só robôs preenchem: envio com ele preenchido volta para a home sem criar lead, porque cada lead dispara uma pesquisa paga.

## Qualificação

Qualificado = fit diferente de baixo, dor clara e sabe-se quem decide. Impacto e evento crítico sobem a prioridade, mas não são obrigatórios para marcar a reunião.

A voz não recebe o fit. Ela oferece a reunião a quem passou pela descoberta (ou pediu a reunião antes) e disse quem decide. O fit fica no briefing e no painel, para o time decidir se mantém a reunião, e o resultado da conversa marca "não qualificado" quando a conversa mostra que a empresa não tem o perfil. Levar o fit para a voz fica para depois: um fit errado da pesquisa (homônimo, CNPJ de outra empresa) encerraria uma conversa boa.

## Fit da empresa

Calculado pela pesquisa, antes da conversa, e mostrado no briefing com os motivos.

| Fit | Quando | Fonte |
| --- | --- | --- |
| Alto | CNAE de incorporação (4110-7/00) ou de construção de edifícios (4120-4/00), ou grupo com SPEs; situação ativa | Receita, site |
| Médio | Outro segmento de alta complexidade financeira (serviços financeiros, seguradora, securitizadora) ou empresa com vários CNPJs | Receita, busca |
| Baixo | Optante pelo Simples ou MEI, empresa inativa, sem CNPJ ou fora do Brasil | Receita |
| Desconhecido | CNPJ não encontrado ou Receita indisponível | O agente de voz confirma |
| Ajuste | Lucro Real na ECF mais recente sobe um nível: operação grande e complexa | Receita |

## Pesquisa

- Ordem: na primeira rodada, em paralelo, o site do domínio do e-mail e uma busca pelo cargo da pessoa; depois a Receita com o CNPJ achado; para construtora ou incorporadora, uma busca pelas SPEs do grupo. No máximo 4 buscas. O detalhe está em `agent/instructions.md`.
- E-mail pessoal (gmail, outlook, hotmail e similares): pula o site e pesquisa pelo nome da empresa. A confiança da empresa cai para média e a voz confirma logo no começo.
- CNPJ cuja razão social não bate com a empresa do formulário é tratado como possível homônimo: confiança baixa e confirmação na conversa ("vocês são a X de Curitiba?").
- Nunca inventar. O que não foi achado sai como "não encontrado", sem fonte.

## SPICED

- Uma letra só conta com uma frase do lead ou com um fato do briefing que o lead confirmou. Hipótese da pesquisa não conta.
- O agente começa pelo que o briefing já sabe, confirma, e pergunta só o que falta.
- Lead que aparece no quadro de sócios já é evidência parcial de D (decisão).

## Resultado da conversa

Um por lead:

| Resultado | Quando |
| --- | --- |
| Reunião marcada | Horário confirmado na agenda |
| Qualificado sem reunião | Qualificado, mas não quis ou não pôde marcar agora |
| Retornar depois | Pediu outro momento; registra quando |
| Indicou outra pessoa | Não decide; registra nome e contato de quem decide |
| Não qualificado | Fit baixo ou sem dor que a Paggo resolve |

## Agenda

- Oferece a reunião depois da descoberta, ou antes se o lead pedir. Antes de consultar a agenda, precisa saber quem decide. O fit não barra a reunião (ver [Qualificação](#qualificação)).
- Consulta de agora até o fim do 5º dia útil, sem horário começando na próxima hora, e recebe até dois horários de manhã e dois de tarde por dia útil. Oferece dois, nunca a lista inteira; se o lead pedir outro dia ou período, escolhe na mesma lista. Só oferece e só marca horário que veio da consulta.
- Repete dia e hora e só marca depois do sim. Marca com o nome e o e-mail do formulário, ou com outro e-mail se o lead pedir.
- No 409 (horário ocupado), consulta de novo e oferece o próximo.
- A rota de marcação só aceita um horário livre da janela; qualquer outro é recusado antes de chegar à agenda, e o agente consulta de novo.
- Sem horário bom, registra a preferência como "retornar depois".

## Conversa

- Alvo de 4 a 7 minutos.
- No máximo duas tentativas na mesma objeção ([mapa de objeções](objections.md)).
- Pessoa errada (não cuida do financeiro nem participa da decisão): sem descoberta, pede nome e contato de quem decide e se ela participaria junto, e fecha dizendo que deixa o contato anotado para o time.
- O agente não manda e-mail, material, convite nem mensagem, e não promete que alguém vai mandar ou ligar: diz que deixa anotado para o time, e o pedido fica em `duvidas`, no painel. Nenhum aviso sai sozinho para o time.
- Se apresenta como assistente virtual da Paggo na abertura e confirma que é IA se perguntarem.
- Produto só depois da dor: no máximo um módulo por vez, ligado ao que o lead contou, em uma frase.
- Pergunta que o material não responde (preço, ERP específico, condições): diz que confirma com o time e registra em `duvidas`, que vai para a reunião.

## Dados pessoais

- O lead aceita o uso dos dados no formulário (consentimento, LGPD art. 7º, I), com data e hora guardadas.
- Só informação pública da empresa. Nada de CPF, idade ou dado pessoal de sócios; o CPF que aparece na razão social de MEI é removido antes de salvar.
- Dado de sócio serve para entender a decisão e nunca é falado na conversa.
- O que o lead corrige vale mais que o briefing: a correção fica em "Dados confirmados ou corrigidos", na aba Conversa estruturada, ao lado do briefing original, que não é sobrescrito.
