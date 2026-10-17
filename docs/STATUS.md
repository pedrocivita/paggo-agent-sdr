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

- **Marcos 1 e 2** (no ar, pesquisa boa) fechados. **Marco 3** (voz) funciona de ponta a ponta na conta de teste do ElevenLabs. **Marco 4** (agenda e pós-chamada): agenda provada em produção com a agenda falsa; o webhook pós-chamada nunca recebeu uma chamada real.
- Nesta sessão: o LLM da voz foi escolhido por número (fica o `gemini-2.5-flash`, entre 4 modelos em 20 simulações por texto), o prompt foi corrigido com 3 personas, a UI ganhou a cara do deck (frase na home, bloco escuro na espera, tema escuro, uma fonte só), o Rastro parou de quebrar no celular, o README foi reescrito e o `voice-sync.mjs` passou a adicionar a voz e criar o webhook sozinho. Detalhes e provas em [reasoning.md](reasoning.md).
- **Bloqueio:** a chave do ElevenLabs da Paggo não tem permissão de Agents nem de Voices. O Pedro pediu ao Murilo para liberar; a resposta deve vir na segunda, 19/10. Até lá não há voz em produção. Só em caso extremo o Pedro assina o Starter da conta de teste (US$ 1 no primeiro mês).

## Provado e não provado

| Item | Estado | Como foi provado |
| --- | --- | --- |
| Portões | Provado | `npm test` (16), `npm run typecheck`, `npm run lint`, `npm run build` |
| App, banco e pesquisa em produção | Provado | Leads `f68b9483` e `4ba706aa` em https://paggo-agent-sdr.vercel.app, com as 3 ferramentas no Rastro |
| Pesquisa nos casos difíceis | Provado | `npm run eval` 6/6, 57/57 checagens ([research-cases.md](research-cases.md)) |
| LLM da voz | Provado por texto | 4 LLMs, 20 simulações: `gemini-2.5-flash` é o único sem fala acima de 2 s até a primeira frase; Haiku 5.5 deixou 31% acima de 2 s; 3.5-flash e `gpt-5-mini` desligaram sem despedida ([reasoning.md](reasoning.md#agente-de-voz)) |
| Prompt contra 3 personas | Provado por texto | Última versão: interessada e cético marcam reunião, pessoa errada indica o gerente em 3 falas, nenhuma promessa de envio, preço ou integração, nenhuma fala acima de 2 s. Sobra: fechamento esperou o "tchau" em 2 de 7 e o evento crítico não é perguntado quando o lead pede a reunião cedo |
| Agente de voz publicado | Provado na conta de teste | `voice-sync.mjs` rerodado depois de cada mudança; conferido pela API: `gemini-2.5-flash`, raciocínio desligado, prompt igual ao do repo (12.031 caracteres) |
| Conversa por voz no site | Provado em dev, com o prompt antigo | 3 conversas com microfone (`conv_3101...`, `conv_8301...`, `conv_5401...`). O prompt de agora ainda não foi ouvido |
| UI com a cara do deck | Provado no dev local | Screenshots da home, da espera e do Rastro de um lead da Even, no desktop e a 375 px, tema escuro |
| Ferramentas da agenda em produção | Provado | Chamadas pelo agente nas conversas, no Rastro com o id da conversa e o lead certo |
| `voice-sync.mjs` adicionando voz e criando webhook | Não provado | Rerodado na conta de teste (voz achada, nenhum webhook criado); os dois caminhos novos só rodam na conta da Paggo |
| Webhook pós-chamada, abas Conversa estruturada e Transcrição | Não provado ao vivo | Assinatura e mapeamento com testes (`lib/voice.test.ts`); falta uma chamada real com o webhook ligado |
| Conversa por voz em produção | Não provado | Depende da chave da Paggo |
| Agenda real | Não provado | Endpoint ainda sendo construído pela Paggo |

## Próximos passos

### 1. Voz na conta da Paggo (Crítico, uns 20 minutos quando a chave chegar)

A chave precisa de: Agents (leitura e escrita), Voices (leitura e escrita, para adicionar a voz da biblioteca), Webhooks (escrita) e, opcional, User (leitura, só para o script mostrar créditos). Comandos no Git Bash, na raiz do repo, sem imprimir segredo:

1. O Pedro cria `C:/Users/pedro/.paggo-voice-prod.env` com uma linha só, `ELEVENLABS_API_KEY=<chave da Paggo>`. Nunca pelo chat.
2. Completar o arquivo. O `VOICE_TOOL_SECRET` é o mesmo que já está no Vercel e no arquivo da conta de teste; o dono da voz é público, da biblioteca:
   ```bash
   F=C:/Users/pedro/.paggo-voice-prod.env
   grep -E '^(VOICE_TOOL_SECRET|ELEVENLABS_VOICE_ID)=' C:/Users/pedro/.paggo-voice.env >> $F
   echo 'ELEVENLABS_VOICE_OWNER=127506543377b34b7f80ddd08b6603c9202136585fd1bdc547dccfc61dd6d910' >> $F
   echo 'WEBHOOK_SECRET_FILE=C:/Users/pedro/.paggo-webhook-secret' >> $F
   ```
3. Publicar: `node --env-file=$F scripts/voice-sync.mjs`. Adiciona a voz, cria o webhook pós-chamada (segredo vai para o arquivo, só o tamanho aparece), cria segredo, ferramentas e agente, e imprime `ELEVENLABS_AGENT_ID`. Um 401 aqui quer dizer permissão faltando: ler a mensagem, que diz qual.
4. Vercel (a chave da Paggo e o `VOICE_TOOL_SECRET` já estão lá):
   ```bash
   vercel env add ELEVENLABS_WEBHOOK_SECRET production < C:/Users/pedro/.paggo-webhook-secret && rm C:/Users/pedro/.paggo-webhook-secret
   vercel env add ELEVENLABS_AGENT_ID --value <id impresso> --yes
   ```
5. Redeploy da produção: `vercel ls --prod` mostra a URL do último deploy; `vercel redeploy <url>`.
6. Local: apagar o `.env.development.local` (aponta para a conta de teste) e rodar `vercel env pull .env.local`.
7. Prova por texto, grátis na conta de teste (conferir na da Paggo): `node --env-file=$F scripts/voice-simulate.mjs interessado`.
8. Prova ao vivo: lead novo pelo formulário em produção, conversa com microfone, e as abas Conversa estruturada, Transcrição e Rastro preenchidas no painel. Se o webhook não chegar, ver no ElevenLabs se ele está ligado ao agente e se o segredo no Vercel é o do arquivo.

Antes do passo 3, decidir a voz: a escolhida é masculina ("Eduardo S. - Brazilian Clear & Pro") e o prompt fala no feminino ("a assistente virtual", "obrigada"). Trocar a voz muda `ELEVENLABS_VOICE_ID` e `ELEVENLABS_VOICE_OWNER`; trocar o prompt muda o gênero das falas.

### 2. Qualidade da conversa (Alto)

- [ ] Uma conversa de voz com o prompt novo, na conta de teste (sobram 4.534 créditos, uns 6 minutos): ouvir o fechamento (despedida e `end_call` sem esperar o "tchau"), o gancho do briefing e a demora real.
- [ ] Decidir se vale perguntar o evento crítico mesmo quando o lead pede a reunião cedo (hoje o prompt prioriza a decisão).
- [ ] O `simulate-conversation` sai do ar em 31/10/2026; se a Paggo for usar depois, trocar por `/v1/convai/agent-testing/create` e `run-tests` no `voice-simulate.mjs`.

### 3. Agenda real (Alto)

- [ ] Quando o endpoint chegar: `AGENDA_URL` e `AGENDA_TOKEN` no Vercel; conferir o cabeçalho de auth e o formato de `de`/`ate`.

### 4. Acabamento e entrega

- [ ] Limpar os leads de teste ("Ana Teste" e os dos casos difíceis) e os eventos `teste-manual`, com ok do Pedro.
- [ ] Revisão final de [reasoning.md](reasoning.md), [business-rules.md](business-rules.md) e [objections.md](objections.md).
- [ ] Ver o painel de produção com senha na tela.

## Calendário até a entrega

| Dia | Foco |
| --- | --- |
| Sex 16/10 | Esqueleto, repo, primeiro deploy (feito) |
| Sáb 17/10 | Pesquisa, voz na conta de teste, LLM, personas, UI, README (feito) |
| Dom 18/10 | Conversa de voz com o prompt novo, decisão da voz, limpeza dos leads de teste |
| Seg 19/10 | Chave da Paggo: passo 1 inteiro e prova em produção; agenda real se chegar |
| Ter 20/10 | Revisar documentos e enviar |

## Pendências que dependem da Paggo

- **Permissões da chave do ElevenLabs** (Agents, Voices, Webhooks), pedidas ao Murilo no sábado, 17/10. Basta editar as permissões da mesma chave.
- Endpoint da agenda: URL, token, formato do cabeçalho de auth e de `de`/`ate`.
- Preço ou faixa que o agente pode falar; quais ERPs têm integração pronta.
- O estudo de caso, que aparece no menu do deck sem conteúdo.

## Armadilhas

- A chave da Paggo é restrita: lê webhooks, mas não agentes, ferramentas, segredos nem vozes. O token da conversa em produção (`/api/leads/[id]/voice`) também usa essa chave.
- A voz escolhida é da biblioteca: não existe na conta da Paggo até ser adicionada (o `voice-sync.mjs` faz isso com `ELEVENLABS_VOICE_OWNER`).
- Simulação por texto não gasta crédito na conta grátis (42 rodadas, 0 crédito). A demora que ela mede é só a do LLM; a voz soma uns 0,3 a 0,5 s.
- O `gemini-2.5-flash` sai em 30/11/2026, e a plataforma começa a desviar parte das chamadas para o `gemini-3.5-flash` perto de 1/11. Na comparação, o 3.5 desligou sem despedida.
- O `gemini-2.5-flash` segue melhor a regra que está perto do momento de usar: regra nova vai na seção onde a ação acontece, não só em "Objetivo".
- A transcrição simulada junta pedaços com espaço duplo; regex de checagem usa `\s+`.
- O `.env.development.local` aponta o dev local para a conta de teste e tem prioridade sobre o `.env.local`. Cada worktree precisa dos dois arquivos (copiados de outro worktree, nunca commitados).
- Dev e produção usam o mesmo banco Neon: leads e eventos de teste aparecem no painel de produção.
- O ElevenLabs só alcança a produção: ferramentas e webhook apontam para `paggo-agent-sdr.vercel.app`. Mudou rota, precisa de push antes de testar a voz.
- O `vercel env pull` acrescenta `.env*.local` ao `.gitignore` toda vez; a linha é redundante e não deve ser commitada.
- O app usa sempre o tema escuro (`data-theme="dark"` em `app/layout.tsx`); o claro dos tokens não aparece mais.
- Mais armadilhas do código em `AGENTS.md`, seção Gotchas.

## Linha de corte

Se atrasar, sai nesta ordem: acabamento da UI além do que está; objeções além das que o case cita; troca do `simulate-conversation`. Nunca sai: rastro, briefing com fonte, voz funcionando em produção e agenda.

Agent: Claude Code (claude-opus-5-5), sessão local no app desktop.
