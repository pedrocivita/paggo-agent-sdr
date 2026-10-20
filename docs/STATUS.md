# Status

Memória viva do projeto: onde estamos, o que está provado, o que falta e as armadilhas. Toda sessão lê este arquivo no começo e o reescreve antes do push (substituir, não acrescentar). Atualizado em 19/10/2026, à noite.

## Índice

- [Onde estamos](#onde-estamos)
- [O que mudou em 19/10](#o-que-mudou-em-1910)
- [Provado e não provado](#provado-e-não-provado)
- [Próximos passos](#próximos-passos)
- [Entrega](#entrega)
- [Pendências que dependem da Paggo](#pendências-que-dependem-da-paggo)
- [Dados de teste no banco](#dados-de-teste-no-banco)
- [Armadilhas](#armadilhas)
- [Linha de corte](#linha-de-corte)

## Onde estamos

- **Tudo em produção:** formulário, pesquisa, voz na conta da Paggo (voz Samuel, `gemini-2.5-flash`), agenda real com trava na marcação, pós-chamada e painel com as 5 abas.
- **Última prova ponta a ponta:** segunda conversa em produção (19/10, noite, `conv_6301...`, 5,4 min), depois de todas as mudanças do dia. Detalhes em [reasoning.md](reasoning.md#agente-de-voz).
- **O entregável está completo:** app no ar, repo, regras de negócio, objeções e o raciocínio curto ([reasoning-summary.md](reasoning-summary.md)), com custo por lead e por reunião. O que resta é entendimento e defesa (Bloco 1), a base legal da LGPD mais detalhada e a varredura final.

## O que mudou em 19/10

Cada item tem opções, escolha e prova em [reasoning.md](reasoning.md) e uma linha em [DECISIONS.md](../DECISIONS.md).

| Mudança | Prova |
| --- | --- |
| O agente não promete convite: a agenda do case é fictícia e não manda nada | 3 simulações sem "convite"; conversa em produção sem convite |
| "Deixo anotado para o time" no lugar de "o time manda" (material, pessoa errada, falha da agenda), com exemplo bom e ruim e no máximo duas ofertas de reunião | Checagem `promisedSending`: 0 em 5 rodadas na versão final; conversa em produção |
| Regras de decisão e de desligamento na descrição de `consultar_agenda` e `end_call`; "nunca encerre por achar que a empresa não tem o perfil" | Lote de 15 e mais 5 rodadas; as taxas baixas não provam queda, só que nada quebrou |
| Trava na rota de marcação: só horário livre da janela | Teste unitário; duas recusas em produção; caminho feliz na conversa em produção |
| Abertura sem ler o formulário de volta | Persona `direto`: 2 de 5 aberturas liam o formulário antes, 0 de 5 depois |
| A pesquisa não inventa como a Paggo cobra | 7º caso no eval: 2 de 2 rodadas inventavam antes, 0 depois |
| Formulário pede "Nome completo"; origem do lead (UTM e site de origem) gravada e mostrada no painel | Print no dev local; lead de teste em produção vindo de `example.com` com as 3 UTM |
| Revisão dos documentos da banca: texto velho, promessas, fontes de cada número | Commits de 19/10 |

## Provado e não provado

| Item | Estado | Como foi provado |
| --- | --- | --- |
| Portões | Provado | `npm test` (24), `npm run typecheck`, `npm run lint`, `npm run build` |
| Pesquisa | Provado, com uma oscilação | Eval de 7 casos em 19/10: 6 de 7, 71 de 72 gates. A Cury oscila (pula a busca de SPEs ou dá confiança alta sem domínio), com ou sem a regra nova; o CNPJ escolhido sempre foi o certo ([research-cases.md](research-cases.md)) |
| Voz em produção | Provado | Duas conversas na conta da Paggo; a última com mediana de 1,25 s até o áudio, SPICED no pós-chamada e reunião marcada pela trava |
| Agenda real | Provado | Consulta (20 a 22 horários em 6 dias úteis), marcação, 409 e recusa de horário fora da janela, todos pelas rotas de produção |
| Pós-chamada | Provado | Webhook HMAC na conta da Paggo; rota recusa chamada sem assinatura ou com assinatura falsa (401) |
| Origem do lead | Provado | Lead de teste em produção com UTM e referrer; aba Formulário mostra a linha Origem |
| Simulações por texto | Ferramenta | `scripts/voice-simulate.mjs` com 4 personas (interessado, cetico, pessoa-errada, direto) e checagens de estilo, decisão, agenda, despedida, promessa e abertura |
| Não provado | Aberto | O agente quase nunca pergunta o evento crítico; ainda escorrega em falas longas; leu "outro dia, à tarde" como a tarde do mesmo dia; desligamento mudo e decisão pulada aparecem em cerca de 1 de cada 15 simulações; a falha da agenda (timeout) nunca foi provocada ao vivo; a busca pelo cargo só foi testada com nomes fictícios |

## Próximos passos

1. **Bloco 1, com o dono do projeto:** tour do código seguindo um lead (o passo 1, formulário e `app/actions.ts`, está feito); rodar uma vez `npm run eval` e uma simulação lendo o rastro e as medidas; kit de defesa fora do repo.
2. **Feito em 19/10, à noite:** o raciocínio curto ([reasoning-summary.md](reasoning-summary.md)), com o custo por lead (cerca de R$ 2,70 com conversa) e por reunião (cerca de R$ 9,90, com um funil hipotético), cada preço com fonte.
3. **LGPD:** detalhar a base legal nas regras de negócio, com a lei e o guia da ANPD (hoje só cita o consentimento, art. 7º, I).
4. **Varredura final antes do congelamento** (ver [Dados de teste no banco](#dados-de-teste-no-banco)), com ok item por item.

### Depois do case

- O `simulate-conversation` sai do ar em 31/10/2026: trocar por `agent-testing/create` e `run-tests` no `voice-simulate.mjs`.
- O `gemini-2.5-flash` sai em 30/11/2026, com desvio de parte das chamadas a partir de 1/11 (`deprecation_info` do `GET /v1/convai/llm/list`): rodar a comparação de LLMs de novo.
- O eval monta o formulário sem o cargo (`researchMessage` recebe nome, e-mail, telefone, empresa e campo livre): incluir o cargo nos casos.
- Passar o fit para a voz com uma regra no prompt; convite e retorno ao lead pela integração com o CRM da Paggo; "como conheceu" no formulário, ao lado da origem medida.

## Entrega

| Quando | O quê |
| --- | --- |
| Ter 20/10, 16h | Código congelado. Depois disso, só documentos |
| Ter 20/10, 18h | Envio: link do app, link do repo, e a senha do painel na mensagem, nunca no repo |

## Pendências que dependem da Paggo

- Avisar a Paggo das três reuniões de teste na agenda do case: 19/10 às 12h, 21/10 às 13h e 21/10 às 14h30. A API não tem rota para desmarcar.
- Preço ou faixa que o agente pode falar; quais ERPs têm integração pronta.
- O estudo de caso, que aparece no menu do deck sem conteúdo.

## Dados de teste no banco

Dev e produção usam o mesmo banco, e a banca abre o painel. Em 19/10 saíram, com ok do dono do projeto, um lead com dados de uma pessoa real e as 31 linhas sem lead de rodadas antigas do eval. Ficaram, por decisão dele, para a varredura final:

- Leads de pessoas fictícias: os "Teste" dos casos difíceis, "Carla Mendes" (teste do formulário) e "Lucas Origem Teste" (teste da origem).
- Leads com dados reais do desenvolvedor: as conversas de prova de 17/10, 19/10 de manhã e 19/10 à noite, e um lead de 17/10 sem conversa.
- Eventos de teste: `teste-manual`, `smoke-*` (inclusive `smoke-2026-10-19` e `smoke-booking-guard-2026-10-19`) e as linhas sem lead das rodadas do eval de 19/10.

## Armadilhas

- A chave do ElevenLabs está marcada como sensível no Vercel: o `vercel env pull` traz o valor vazio. Scripts usam o arquivo de chave fora do repo. A chave da Paggo não lê a assinatura da conta: créditos aparecem como `null` na simulação.
- O ElevenLabs só alcança a produção: ferramentas e webhook apontam para `paggo-agent-sdr.vercel.app`. Mudou rota, push antes de testar a voz. Mudou variável que o prompt usa: deploy do código antes da publicação do agente. O `voice-sync.mjs` reaproveita o webhook pela URL e não troca o segredo.
- Na simulação as ferramentas da agenda são falsas: a trava da marcação só é exercitada em produção.
- Uma taxa de 1 em 15 não se prova com 15 rodadas; uma checagem por palavra deixa passar a mesma ideia dita de outro jeito (aconteceu com o preço: virou uma checagem por frase).
- Cada rodada do eval grava eventos sem lead no banco compartilhado; entram na varredura.
- Em 19/10 esta máquina ficou uns 10 minutos sem alcançar o Neon (porta 5432 e 443), com a produção normal: antes de depurar o código, testar a conexão.
- O painel do navegador do app troca `127.0.0.1` por `localhost`: para provar o referrer, navegar a partir de um site externo em HTTPS para a produção.
- Voz com moderação ao vivo não pode ser usada em agente; o prompt fala no masculino.
- O dev local usa a conta de teste do ElevenLabs (`.env.development.local`, que tem prioridade sobre o `.env.local`). Cada worktree precisa dos dois arquivos, copiados de outro worktree e nunca commitados, e de `npm install`; desfazer a mudança que o install fizer no `package-lock.json`.
- Mais armadilhas do código em `AGENTS.md`, seção Gotchas.

## Linha de corte

Se atrasar, sai nesta ordem: kit de defesa vira só o roteiro; custo e LGPD ficam curtos; o raciocínio curto vira um sumário no topo do reasoning. Nunca sai: rastro, briefing com fonte, voz em produção, agenda e a saída estruturada da conversa.

Agent: Claude Code (claude-opus-5-5).
