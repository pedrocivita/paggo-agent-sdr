# Regras de negócio

Entregável do case. Rascunho de 16/10/2026, baseado no site da Paggo; validar com o material oficial de produto quando chegar. As regras de fit já estão em uso nas instruções do agente de pesquisa (`agent/instructions.md`); as de conversa e agenda entram no prompt da voz no marco 3.

## Índice

- [Qualificação](#qualificação)
- [Fit da empresa](#fit-da-empresa)
- [Pesquisa](#pesquisa)
- [SPICED](#spiced)
- [Resultado da conversa](#resultado-da-conversa)
- [Agenda](#agenda)
- [Conversa](#conversa)
- [Dados pessoais](#dados-pessoais)

## Qualificação

Qualificado = fit diferente de baixo, dor clara e sabe-se quem decide. Impacto e evento crítico sobem a prioridade, mas não são obrigatórios para marcar a reunião.

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

- Ordem: site do domínio do e-mail, depois a Receita com o CNPJ achado, depois a busca web só para o que faltar (no máximo 4 buscas).
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

- Só oferece reunião a quem está qualificado ou pediu.
- Consulta os próximos 5 dias úteis e oferece dois horários, nunca a lista inteira.
- Repete dia e hora antes de marcar; usa nome e e-mail do formulário (ou os corrigidos pelo lead).
- No 409 (horário ocupado), consulta de novo e oferece o próximo.
- Sem horário bom, registra a preferência como "retornar depois".

## Conversa

- Alvo de 4 a 7 minutos.
- No máximo duas tentativas na mesma objeção ([mapa de objeções](objections.md)).
- Pessoa errada: pede nome e contato de quem decide e se ela participaria junto.
- Se perguntarem, confirma que é uma assistente virtual da Paggo.

## Dados pessoais

- Só informação pública da empresa. Nada de CPF, idade ou dado pessoal de sócios; o CPF que aparece na razão social de MEI é removido antes de salvar.
- Dado de sócio serve para entender a decisão e nunca é falado na conversa.
- O que o lead corrige vale mais que o briefing e fica marcado como corrigido pelo lead.
