# Status

Memória viva do projeto: onde estamos, o que está provado, o que falta e as armadilhas. Toda sessão lê este arquivo no começo e o reescreve antes do push (substituir, não acrescentar). Atualizado em 17/10/2026, noite.

## Índice

- [Onde estamos](#onde-estamos)
- [Provado e não provado](#provado-e-não-provado)
- [Próximos passos](#próximos-passos)
- [Calendário até a entrega](#calendário-até-a-entrega)
- [Pendências que dependem da Paggo](#pendências-que-dependem-da-paggo)
- [Armadilhas](#armadilhas)
- [Linha de corte](#linha-de-corte)

## Onde estamos

- **Marco 1** (no ar) e **Marco 2** (pesquisa boa) estão fechados. Os casos difíceis e o eval estão em [research-cases.md](research-cases.md).
- **Marco 3** (voz): funciona de ponta a ponta numa conta de teste do ElevenLabs. Foram 3 conversas reais com microfone, e o prompt foi ajustado a cada uma ([reasoning.md](reasoning.md)).
- **Marco 4** (agenda e pós-chamada): as ferramentas da agenda estão provadas em produção, com a agenda falsa. O webhook pós-chamada está escrito e testado, mas ainda não recebeu uma chamada real.
- **Bloqueio:** a chave do ElevenLabs que a Paggo mandou não tem permissão de Agents nem de Voices, então o agente não vai para a conta da Paggo e o token em produção não abre conversa. Provado que a chave é da Paggo (outra conta, não a de teste). O Pedro pediu ao Murilo uma chave com permissões; a resposta deve vir na segunda, 19/10. Até lá, a voz só roda no dev local com a conta de teste. Em caso extremo, o Pedro aceita assinar o plano Starter da conta de teste (US$ 1 no primeiro mês, 75 minutos, licença comercial) e usá-la em produção.

## Provado e não provado

| Item | Estado | Como foi provado |
| --- | --- | --- |
| Portões | Provado | `npm test` (16), `npm run typecheck`, `npm run lint`, `npm run build` |
| App, banco e pesquisa em produção | Provado | Leads `f68b9483` e `4ba706aa` em https://paggo-agent-sdr.vercel.app, com as 3 ferramentas no Rastro |
| Pesquisa nos casos difíceis | Provado | 6 empresas reais duas vezes, nenhum CNPJ errado, média de 22,8 s; `npm run eval` 6/6 com 57/57 checagens ([research-cases.md](research-cases.md)) |
| Conhecimento da Paggo | Feito | Deck institucional lido inteiro; fatos com página em [paggo.md](paggo.md), objeções e regras atualizadas |
| Agente de voz publicado | Provado na conta de teste | `scripts/voice-sync.mjs`; agente `agent_6301m55qhz5se97vdtaxy7aj9r0p` conferido pela API (pt-br, `gemini-2.5-flash`, `eleven_v4_turbo` a 1,2x, auth ligada, 10 campos de coleta) |
| Conversa por voz no site | Provado em dev | Botão em `/l/[id]`, 3 conversas com microfone (`conv_3101...`, `conv_8301...`, `conv_5401...`), demora de 0,8 a 1,9 s |
| Ferramentas da agenda em produção | Provado | `consultar_agenda` e `marcar_reuniao` chamadas pelo agente nas conversas, gravadas no Rastro com o id da conversa e o lead certo; `curl` sem segredo responde 401 |
| Webhook pós-chamada | Não provado ao vivo | Assinatura e mapeamento com testes (`lib/voice.test.ts`); formato do payload conferido nas conversas reais pela API. Falta criar o webhook na conta da Paggo |
| Conversa estruturada e Transcrição no painel | Não provado | Dependem do webhook |
| Conversa por voz em produção | Não provado | Depende de uma chave da Paggo com permissão de Agents |
| Agenda real | Não provado | Endpoint ainda sendo construído pela Paggo |
| Painel de produção com senha, visto na tela | Não provado | Visto pelo painel local, que lê o mesmo banco |

## Próximos passos

### 1. Voz na conta da Paggo (Crítico, assim que a chave chegar)

- [ ] Chave com permissão de Agents (leitura e escrita), Voices (leitura) e Webhooks (escrita), ou sem restrição. Colocar no Vercel como `ELEVENLABS_API_KEY`, nos 3 ambientes, sem "Sensitive".
- [ ] Ver se a voz escolhida existe na conta (`GET /v1/voices/<id>`); se não, adicionar da biblioteca (`POST /v1/voices/add/{public_user_id}/{voice_id}`).
- [ ] Criar o webhook pós-chamada (`POST /v1/workspace/webhooks`, `auth_type: "hmac"`, URL `https://paggo-agent-sdr.vercel.app/api/voice/webhook`). Gravar o segredo devolvido direto no Vercel como `ELEVENLABS_WEBHOOK_SECRET`, sem imprimir.
- [ ] `node --env-file=<arquivo> scripts/voice-sync.mjs` com a chave da Paggo, `VOICE_TOOL_SECRET`, `ELEVENLABS_VOICE_ID` e `POST_CALL_WEBHOOK_ID`. Gravar o `ELEVENLABS_AGENT_ID` impresso no Vercel.
- [ ] Deploy novo, apagar o `.env.development.local` (conta de teste) e fazer `vercel env pull .env.local`.
- [ ] Prova em produção: lead novo pelo formulário, conversa, e as abas Conversa estruturada, Transcrição e Rastro preenchidas.

### 2. Qualidade da conversa (Alto)

- [ ] Comparar 2 ou 3 LLMs com o mesmo prompt, medindo demora e obediência ao estilo: `gemini-2.5-flash` (atual, ainda diz "Ótimo!" e lista módulos), um Gemini mais novo, `claude-haiku-5-5`, `gpt-5-mini`. Testar por texto antes de gastar voz: `POST /v1/convai/agents/{agent_id}/simulate-conversation` roda a conversa inteira com um usuário simulado (`simulation_specification.simulated_user_config.prompt` descreve a persona, `tool_mock_config` simula as ferramentas, `extra_evaluation_criteria` avalia). Está descontinuado e sai em 31/10/2026; o substituto é `/v1/convai/agent-testing/create` mais `/v1/convai/agents/{agent_id}/run-tests`. Cobra LLM dos dois lados, não minuto de voz; a conta de teste tem uns 2.000 créditos.
- [ ] 3 conversas com personas: interessado, cético com preço, pessoa errada. Conferir objeções, SPICED, resultado e coleta.
- [ ] Testar o fechamento novo: uma fala só com "até mais" e `end_call` logo depois, sem silêncio.

### 3. Agenda real (Alto)

- [ ] Quando o endpoint chegar: `AGENDA_URL` e `AGENDA_TOKEN` no Vercel; conferir o cabeçalho de auth e o formato de `de`/`ate`.

### 4. Acabamento e entrega

- [ ] UI com o deck: a frase "O orquestrador financeiro da construção" na home, o bloco escuro como chamada para a voz, centavos menores nos valores. Corrigir os links do Rastro que quebram de linha torto.
- [ ] Limpar os leads de teste "Ana Teste" e os eventos `teste-manual` (com ok do Pedro).
- [ ] README, revisão final de [reasoning.md](reasoning.md), [business-rules.md](business-rules.md) e [objections.md](objections.md).

## Calendário até a entrega

| Dia | Foco |
| --- | --- |
| Sex 16/10 | Esqueleto, repo, primeiro deploy (feito) |
| Sáb 17/10 | Pesquisa (feito) e voz funcionando (feito na conta de teste) |
| Dom 18/10 | Voz na conta da Paggo e prova em produção, LLMs, personas, agenda |
| Seg 19/10 | Acabamento da UI, tom e latência, documentos finais |
| Ter 20/10 | Revisar e enviar |

## Pendências que dependem da Paggo

- **Chave do ElevenLabs com permissão de Agents, Voices e Webhooks** (a atual responde 401 `missing_permissions`), e quantos minutos ela tem. Pedido feito ao Murilo no sábado, 17/10. Basta ele editar as permissões da mesma chave.
- Endpoint da agenda: URL, token, formato do cabeçalho de auth e de `de`/`ate`.
- Preço ou faixa que o agente pode falar; quais ERPs têm integração pronta (o Sienge aparece nas conversas).
- O estudo de caso, que aparece no menu do deck sem conteúdo.
- Campos do SPICED que o SalesOS usa; formato da entrega.

## Armadilhas

- A chave da Paggo é restrita: lê webhooks, mas não agentes, ferramentas, segredos nem vozes. O token da conversa em produção (`/api/leads/[id]/voice`) também usa essa chave.
- A conta de teste do ElevenLabs é grátis: 15 minutos por mês (sobram uns 3), uso pessoal. Crédito equivale a minuto, cerca de 700 por minuto.
- O `.env.development.local` aponta o dev local para a conta de teste e tem prioridade sobre o `.env.local`.
- Se o dev server subir em outra porta (a 3000 ocupada por outra sessão), a pesquisa local continua chamando o eve em `localhost:3000` (`EVE_HOST` em `lib/research.ts`). Leads novos precisam do servidor na 3000, ou de `EVE_HOST` apontando para a porta certa.
- Dev e produção usam o mesmo banco Neon: leads e eventos de teste aparecem no painel de produção.
- A velocidade da fala já está no máximo (`speed` 1,2). Para parecer mais rápido, o que sobra é a demora até começar a responder: LLM, `speculative_turn` (ligado) e falas curtas.
- O ElevenLabs só alcança a produção: as ferramentas e o webhook apontam para `paggo-agent-sdr.vercel.app`, fora da proteção de deploy. Mudou rota, precisa de push antes de testar a voz.
- O `vercel env pull` acrescenta `.env*.local` ao `.gitignore` toda vez; a linha é redundante e não deve ser commitada.
- O aviso `error reading from signal stream` no console vem do `livekit-client` quando a conexão de voz fecha; em dev o overlay do Next mostra como erro.
- Mais armadilhas do código em `AGENTS.md`, seção Gotchas.

## Linha de corte

Se atrasar, sai nesta ordem: comparação de LLMs além de 2; acabamento da UI além dos tokens da Paggo; objeções além das que o case cita. Nunca sai: rastro, briefing com fonte, voz funcionando em produção e agenda.

Agent: Claude Code (claude-opus-5-5), sessão local no app desktop.
