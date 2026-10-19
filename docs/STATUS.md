# Status

Memória viva do projeto: onde estamos, o que está provado, o que falta e as armadilhas. Toda sessão lê este arquivo no começo e o reescreve antes do push (substituir, não acrescentar). Atualizado em 19/10/2026.

## Índice

- [Onde estamos](#onde-estamos)
- [Provado e não provado](#provado-e-não-provado)
- [Próximos passos](#próximos-passos)
- [Calendário até a entrega](#calendário-até-a-entrega)
- [Pendências que dependem da Paggo](#pendências-que-dependem-da-paggo)
- [Armadilhas](#armadilhas)
- [Linha de corte](#linha-de-corte)

## Onde estamos

- **Em produção:** formulário, pesquisa, voz na conta da Paggo, agenda real da Paggo e painel com Rastro. A voz é a Samuel, uma voz brasileira que já estava na conta da Paggo, aprovada ouvindo a conversa de produção.
- **Pós-chamada na conta da Paggo ligado (19/10):** com a escrita de webhooks liberada, o webhook foi criado, ligado ao agente, o segredo foi para o Vercel e a produção foi redeployada. **Provado em produção (19/10):** uma conversa na conta da Paggo (`conv_4701...`) passou por formulário, pesquisa, voz, agenda real e pós-chamada, com o painel cheio. Dois erros dela foram corrigidos e provados por simulação: o agente inventou um horário quando o lead pediu outro dia, e ficou 13 s em silêncio antes de consultar a agenda.
- **Hoje (19/10):** agenda real ligada e provada; agente publicado na conta da Paggo; formulário com cargo no formato da Paggo (persona do comitê de compra), aceite de dados e campo antirrobô; prompt com os fatos do FAQ da Paggo e a Reforma Tributária como evento crítico. Detalhes e provas em [reasoning.md](reasoning.md).

## Provado e não provado

| Item | Estado | Como foi provado |
| --- | --- | --- |
| Portões | Provado | `npm test` (19), `npm run typecheck`, `npm run lint`, `npm run build` |
| Pesquisa em produção e nos casos difíceis | Provado | Leads em produção com as 3 ferramentas no Rastro; `npm run eval` 6/6, 57/57 checagens ([research-cases.md](research-cases.md)) |
| Formulário novo | Provado no dev local e no ar | Envio com o campo escondido preenchido voltou para a home sem criar lead; envio normal gravou cargo e data do aceite; a pesquisa recebeu o cargo e o tratou como dado do lead; o painel mostra cargo, papel na compra e aceite. O HTML de produção tem os três campos |
| LLM e prompt da voz | Provado por texto | `gemini-2.5-flash` escolhido entre 4 LLMs em 20 simulações; personas corrigidas; contra o agente da Paggo, com o cargo vindo do formulário, 4 de 4 foram direto ao gancho e marcaram reunião |
| Conversa por voz | Provado no dev, conta de teste | 4 conversas com microfone; a última com o prompt no masculino: SPICED completo, reunião marcada, despedida e `end_call` juntos, demora até o áudio com mediana de 1,32 s |
| Voz em produção | Provado | Conversa `conv_4701...` com microfone, 4 min, mediana de 1,46 s até o áudio, reunião marcada na agenda real, lead gravado com conversa, resumo e SPICED |
| Agenda real | Provado em produção | Consulta, marcação e 409 pelas rotas de produção; marcação pela voz na conversa `conv_4701...`. A consulta devolve dois horários de manhã e dois de tarde por dia útil (22 opções em 6 dias), e o agente só marca horário da lista (2 de 2 simulações). Reuniões de teste na agenda da Paggo: 19/10 às 12h e 21/10 às 14h30 |
| Pós-chamada (abas Conversa estruturada e Transcrição) | Provado nas duas contas | Conversa `conv_6601...` (conta de teste) gravou tudo no painel. Na conta da Paggo: um webhook HMAC só, ligado ao agente, segredo no Vercel de produção, rota recusando chamada sem assinatura. Conversas da conta de teste deixaram de ser gravadas |
| UI | Provado no dev local | Screenshots de home, espera, Rastro e formulário, claro e escuro, desktop e 375 px |

## Próximos passos

### 1. Pós-chamada na conta da Paggo (Alto, feito em 19/10)

Feito com os comandos abaixo. Ficam para rerodar se o segredo precisar ser trocado: desligar o webhook do agente, apagar, rerodar o script.

Com `webhooks_write` liberada na mesma chave (pedido feito à Paggo em 19/10), cerca de 5 minutos. No Git Bash, na raiz do repo; `$F` é o arquivo de chave da Paggo, fora do repo, que já tem `WEBHOOK_SECRET_FILE`:

```bash
node --env-file=$F scripts/voice-sync.mjs
vercel env add ELEVENLABS_WEBHOOK_SECRET production --force < ~/.paggo-webhook-secret && rm ~/.paggo-webhook-secret
```

Depois, redeploy: `vercel ls --prod` mostra a URL do último deploy, e `vercel redeploy <url> --target production --scope <time do projeto> --non-interactive`. A partir daí, conversas da conta de teste deixam de ser gravadas, porque o segredo passa a ser o da Paggo.

Se a permissão não vier a tempo: buscar a conversa do nosso lado. Quando a ligação termina, o site avisa o servidor, que lê a conversa pela API (a chave da Paggo já lê conversas) e grava no lead do mesmo jeito que o webhook. Cerca de 1 hora de código e teste.

### 2. Prova em produção (Crítico)

- [x] Conversa com microfone em produção (19/10): ponta a ponta, com o painel cheio.
- [ ] Uma segunda conversa curta em produção depois da correção da agenda, pedindo outro dia, para ouvir a escolha na lista e a consulta sem pausa.
- [ ] Ver o painel de produção com senha na tela.

### 3. Entrega (terça, 20/10)

- [ ] Limpar os leads de teste, com ok do dono do projeto: "Ana Teste", os dos casos difíceis, "Carla Mendes" (teste do formulário de 19/10), as conversas de prova de 17/10 e 19/10, que têm dados reais do desenvolvedor, e os eventos `teste-manual` e `smoke-*`. Avisar a Paggo das reuniões de teste de 19/10 às 12h e 21/10 às 14h30.
- [ ] Revisão final de [reasoning.md](reasoning.md), [business-rules.md](business-rules.md) e [objections.md](objections.md).
- [ ] Se sobrar tempo: o documento curto de visão de GTM (funil, custo por lead, passagem para o CRM, LGPD) e o raciocínio enxuto com uma fonte por decisão.

### Depois do case

- [ ] O `simulate-conversation` sai do ar em 31/10/2026: trocar por `/v1/convai/agent-testing/create` e `run-tests` no `voice-simulate.mjs`.
- [ ] O `gemini-2.5-flash` sai em 30/11/2026: rodar a comparação de LLMs de novo.

## Calendário até a entrega

| Dia | Foco |
| --- | --- |
| Sex 16/10 | Esqueleto, repo, primeiro deploy (feito) |
| Sáb 17/10 | Pesquisa, voz na conta de teste, LLM, personas, UI, README (feito) |
| Dom 18/10 | Conversa de prova com o webhook na conta de teste (feito) |
| Seg 19/10 | Agenda real, voz na conta da Paggo, formulário no formato da Paggo (feito); pós-chamada na Paggo e prova em produção |
| Ter 20/10 | Limpeza, revisão e envio |

## Pendências que dependem da Paggo

- Nada de permissão pendente: a escrita de webhooks foi liberada em 19/10, e a escrita de vozes não é mais necessária com a Samuel.
- Preço ou faixa que o agente pode falar; quais ERPs têm integração pronta.
- O estudo de caso, que aparece no menu do deck sem conteúdo.

## Armadilhas

- No Vercel a chave do ElevenLabs está marcada como sensível: o `vercel env pull` traz o valor vazio. Para scripts, usar o arquivo de chave fora do repo. A chave da Paggo também não lê a assinatura da conta: o `voice-simulate.mjs` mostra créditos como `null` nela.
- `vercel env add` sem ambiente, ou sem `--non-interactive`, para numa pergunta e trava em scripts.
- Voz com moderação ao vivo (`sharing.live_moderation_enabled`) não pode ser usada em agente: a Matheus, da conta da Paggo, foi recusada por isso. O prompt fala no masculino; trocar para voz feminina pede trocar o gênero do prompt.
- O dev local continua na conta de teste do ElevenLabs (`.env.development.local`, que tem prioridade sobre o `.env.local`). Cada worktree precisa dos dois arquivos, copiados de outro worktree e nunca commitados.
- Dev e produção usam o mesmo banco Neon: leads e eventos de teste aparecem no painel de produção.
- O ElevenLabs só alcança a produção: ferramentas e webhook apontam para `paggo-agent-sdr.vercel.app`. Mudou rota, precisa de push antes de testar a voz. Mudou uma variável que o prompt usa: primeiro o deploy do código que manda a variável, depois a publicação do agente.
- Alguns arquivos do repo têm quebra de linha CRLF; scripts que editam texto devem normalizar antes de comparar.
- Simulação por texto não gastou crédito na conta grátis. A demora que ela mede é só a do LLM; a voz soma uns 0,3 a 0,5 s.
- O tema é escuro por padrão, com um interruptor no cabeçalho; a escolha fica no `localStorage` e um `next/script` `beforeInteractive` a aplica antes da primeira pintura.
- Mais armadilhas do código em `AGENTS.md`, seção Gotchas.

## Linha de corte

Se atrasar, sai nesta ordem: documento de GTM e raciocínio enxuto; acabamento da UI; objeções além das que o case cita. Nunca sai: rastro, briefing com fonte, voz funcionando em produção, agenda e a saída estruturada da conversa.

Agent: Claude Code (claude-opus-5-5).
