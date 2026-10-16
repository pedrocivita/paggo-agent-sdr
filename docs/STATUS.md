# Status

Memória viva do projeto: onde estamos, o que está provado, o que falta e as armadilhas. Toda sessão lê este arquivo no começo e o reescreve antes do push (substituir, não acrescentar). Atualizado em 16/10/2026, 20h.

## Índice

- [Onde estamos](#onde-estamos)
- [Provado e não provado](#provado-e-não-provado)
- [Próximos passos](#próximos-passos)
- [Calendário até a entrega](#calendário-até-a-entrega)
- [Pendências que dependem da Paggo](#pendências-que-dependem-da-paggo)
- [Armadilhas](#armadilhas)
- [Linha de corte](#linha-de-corte)

## Onde estamos

Marco 1 (esqueleto ponta a ponta) com o código pronto e todos os portões verdes localmente. Repositório no GitHub. Falta o primeiro deploy: sem banco, sem chave de busca e sem o modelo rodando de verdade, a pesquisa nunca rodou ponta a ponta.

## Provado e não provado

| Item | Estado | Como foi provado |
| --- | --- | --- |
| Testes de CNPJ (6) | Provado | `npm test` |
| Tipos e lint | Provado | `npm run typecheck`, `npm run lint` |
| Build do Next.js | Provado | `npm run build` sem `DATABASE_URL` (o setup do banco é pulado com aviso) |
| Agente eve compila com exatamente 3 tools | Provado | `eve build`, resumo do agente compilado |
| `readSite("paggo.com.br")` acha CNPJs no site | Provado | Achou dois: o da Paggo e um MEI sem relação (prova do risco de homônimo) |
| `lookupCnpj` na BrasilAPI | Provado | CNPJ da Paggo Tecnologia: ativa, Lucro Real 2024, São Paulo |
| Pesquisa ponta a ponta com o modelo | Não provado | Precisa do deploy (AI Gateway via OIDC) ou de uma chave local |
| Sessão do eve em produção | Não provado | Auth do canal `vercelOidc()` falha fechada; provar no primeiro deploy |
| Banco real | Não provado | Sem `DATABASE_URL` ainda |
| Busca web (Exa) | Não provado | Sem `EXA_API_KEY` ainda |
| Agenda real | Não provado | Cabeçalho `Authorization: Bearer` e formato ISO de `de`/`ate` são suposições |
| Voz | Não começado | Especificação em [voice-agent.md](voice-agent.md) |

## Próximos passos

### Marco 1: no ar

- [ ] Projeto no Vercel ligado a este repo, no time pessoal do Pedro, Node 24 (precisa do ok do Pedro para criar).
- [ ] Postgres: Neon pelo Vercel Marketplace, que já preenche `DATABASE_URL` (recomendação; confirmar com o Pedro).
- [ ] `EXA_API_KEY` e `PANEL_PASSWORD` nas variáveis do Vercel (o Pedro cola direto lá, nunca no chat).
- [ ] Conferir que o modelo do agente responde pelo AI Gateway com o OIDC do projeto; se não, chave própria (BYOK) com a chave que a Paggo oferece.
- [ ] Prova ao vivo: formulário com uma empresa real, briefing com fontes na aba Pesquisa, 3 ferramentas na aba Rastro.
- [ ] Se a sessão do eve recusar em produção por mais de 1 hora de tentativa: plano B com o `ToolLoopAgent` do AI SDK e as mesmas tools em Zod. Registrar no DECISIONS.md.

### Marco 2: pesquisa boa

- [ ] Rodar 5 casos reais: incorporadora com SPEs, empresa homônima, e-mail pessoal, site sem CNPJ, empresa estrangeira.
- [ ] Ajustar `agent/instructions.md` com o que errar; meta de briefing em menos de 45 s.
- [ ] Se sobrar tempo: um eval do eve (`eve eval`) com um lead de incorporadora.

### Marco 3: voz

- [ ] Testar a demo de voz do ElevenLabs em português antes de configurar.
- [ ] Config do agente em `voice/` pela CLI: prompt em 6 blocos, LLM rápido, voz PT-BR, dicionário de pronúncia.
- [ ] Rota que gera o conversation token e as variáveis do briefing; botão "Falar com a Paggo" na tela de espera.
- [ ] Testar com microfone real, com o briefing de uma empresa real.

### Marco 4: agenda e pós-chamada

- [ ] Ferramentas `consultar_agenda` e `marcar_reuniao` apontando para `/api/agenda/[action]`, com `traced()` e `run.kind = "voice"`.
- [ ] Webhook pós-chamada com verificação da assinatura, gravando transcrição, resumo e a coleta de dados no lead.
- [ ] Trocar a agenda falsa pela real assim que URL e token chegarem (duas variáveis de ambiente).

### Marco 5: acabamento

- [ ] Objeções e material da Paggo no prompt e na base de conhecimento.
- [ ] Tom e latência: 3 conversas de teste com personas diferentes (interessado, cético com preço, pessoa errada).
- [ ] Polimento da UI com os tokens da Paggo.
- [ ] Entregáveis finais: [regras de negócio](business-rules.md), [mapa de objeções](objections.md), documento curto de raciocínio (`docs/reasoning.md`), README.

## Calendário até a entrega

| Dia | Foco |
| --- | --- |
| Sex 16/10 | Esqueleto, repo, primeiro deploy |
| Sáb 17/10 | Pesquisa real (marco 2) e voz funcionando (marco 3) |
| Dom 18/10 | SPICED, agenda, saída estruturada, objeções (marcos 4 e 5) |
| Seg 19/10 | Polimento de latência e tom, documento de raciocínio |
| Ter 20/10 | Revisar e enviar |

## Pendências que dependem da Paggo

- Chave do ElevenLabs: qual o plano (minutos, concorrência) e em que conta criar o agente.
- URL e token da agenda: formato do cabeçalho de auth e de `de`/`ate`; se a agenda é compartilhada (horários podem sumir durante o teste).
- Chave do Codex: se é da API da OpenAI e se entra no AI Gateway como chave própria.
- Material de produto: preço ou faixa que o agente pode falar, perfil de cliente ideal oficial.
- Campos do SPICED que o SalesOS usa, para a saída estruturada bater com o que o time lê.
- Se voz no site atende ou se querem ver a ligação para o telefone.
- Formato da entrega: repo público ou convite, documento de raciocínio no repo ou à parte.

## Armadilhas

- A proteção de deploy do Vercel bloqueia webhooks de fora: usar o domínio de produção e liberar as rotas de webhook.
- BrasilAPI pode limitar (429) ou cair; a reserva prevista é a CNPJá aberta (5 consultas por minuto por IP), ainda não implementada.
- Se o webhook pós-chamada não chegar, a conversa some do painel; reserva prevista: buscar a conversa pela API do ElevenLabs. Não implementado.
- O eve é pré 1.0 e muda quase todo dia: versão exata no `package.json`, doc em `node_modules/eve/docs`.
- Mais armadilhas do código, já provadas, em `AGENTS.md`, seção Gotchas.

## Linha de corte

Se atrasar, sai nesta ordem: evals do eve; acabamento do painel além dos tokens da Paggo; objeções além das quatro que o case cita. Nunca sai: rastro, briefing com fonte, voz funcionando e agenda.

Agent: Claude Code (claude-opus-5-5), sessão na nuvem.
