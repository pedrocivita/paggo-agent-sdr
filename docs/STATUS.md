# Status

Memória viva do projeto: onde estamos, o que está provado, o que falta e as armadilhas. Toda sessão lê este arquivo no começo e o reescreve antes do push (substituir, não acrescentar). Atualizado em 16/10/2026, 23h50.

## Índice

- [Onde estamos](#onde-estamos)
- [Provado e não provado](#provado-e-não-provado)
- [Comparação de modelos](#comparação-de-modelos)
- [Próximos passos](#próximos-passos)
- [Calendário até a entrega](#calendário-até-a-entrega)
- [Pendências que dependem da Paggo](#pendências-que-dependem-da-paggo)
- [Armadilhas](#armadilhas)
- [Linha de corte](#linha-de-corte)

## Onde estamos

Marco 1 no ar em https://paggo-agent-sdr.vercel.app. O caminho formulário, pesquisa do eve, briefing com fontes e Rastro rodou ao vivo em produção e localmente. O modelo do agente é o Claude Sonnet 5.5, chamado direto na Anthropic com a chave pessoal do Pedro: o AI Gateway recusou o modelo sem crédito pago. Próximo: Marco 2 (pesquisa boa nos 5 casos difíceis).

## Provado e não provado

| Item | Estado | Como foi provado |
| --- | --- | --- |
| Portões | Provado | `npm test` (6), `npm run typecheck`, `npm run lint`, `npm run build`. O typecheck agora roda `next typegen` antes, porque num clone novo os tipos `PageProps` e `RouteContext` não existiam |
| Projeto no Vercel | Provado | `paggo-agent-sdr` no time "Pedro's projects", Next.js, Node 24.x, ligado ao GitHub. Push no `main` gerou o deploy de produção de `682d135`, Ready em 53 s (`vercel ls paggo-agent-sdr`) |
| Banco | Provado | Neon Free pelo Marketplace, região iad1, `DATABASE_URL` nos 3 ambientes. Tabelas criadas por `node --env-file=.env.local scripts/db-setup.mjs` e pelo build de produção (`db-setup: schema ready` no log de `vercel inspect --logs`) |
| Sessão do eve em produção | Provado | Lead `f68b9483` ficou `ready`, sessão `wrun_41M53W3W4D0GHYAFK2AZDMFN7E`. A auth `vercelOidc()` aceitou o token OIDC do projeto chamando `VERCEL_URL`, mesmo com essa URL respondendo 302 a navegadores |
| Pesquisa ponta a ponta | Provado | Cyrela com lead fictício: local com Sonnet (25,1 s) e Haiku (36,3 s); produção com Sonnet em 2 leads. CNPJ certo (73.178.600/0001-18) em todos |
| Rastro com as 3 ferramentas | Provado | Local: aba Rastro do lead `2d58b3fe` com 4 chamadas ok (`web_search` 2x, `fetch_site`, `lookup_cnpj`), vista em screenshot no preview. Produção, na tabela `events`: `fetch_site` + `lookup_cnpj` (lead `f68b9483`) e `web_search` + `lookup_cnpj` (lead `4ba706aa`, e-mail pessoal) |
| Busca web (Exa) | Provado | `web_search` ok local e em produção |
| Painel protegido em produção | Provado | `/painel` responde 401 sem senha; o domínio de produção responde 200 |
| Tela do painel em produção | Não provado | Precisa do `PANEL_PASSWORD`, que só o Pedro tem. Local, o painel foi visto em screenshot |
| Agenda real | Não provado | Cabeçalho `Authorization: Bearer` e formato ISO de `de`/`ate` são suposições |
| Voz | Não começado | Especificação em [voice-agent.md](voice-agent.md) |

## Comparação de modelos

Mesmo lead (Cyrela, e-mail no domínio da empresa), uma rodada de cada, medida pelo banco e pelo `data.usage` do stream do eve. Preços da Anthropic: Sonnet 5.5 US$ 2 / 10 por milhão de tokens (entrada / saída), Haiku 5.5 US$ 0,10 / 0,50.

| | Sonnet 5.5 | Haiku 5.5 |
| --- | --- | --- |
| Tempo até o briefing | 25,1 s | 36,3 s |
| Chamadas de ferramenta | 2 (site, Receita) | 4 (busca, site, Receita, busca) |
| Tokens entrada / saída | 31,9 mil / 2,0 mil | 67,4 mil / 4,8 mil |
| Custo por briefing | ~US$ 0,056 | ~US$ 0,006 |
| Julgamento | Notou que o lead parece de teste; perguntas em ordem SPICED | Pesquisou mais, mas disse que o e-mail "confirma" a pessoa e usou site terceiro de CNPJ tendo a Receita |

Escolha: Sonnet 5.5 (linha no DECISIONS.md). É uma rodada só; o Marco 2 mede de verdade.

## Próximos passos

### Marco 1: fechar

- [ ] Pedro abre `/painel` em produção com a senha e confere as abas Pesquisa e Rastro dos leads `f68b9483` e `4ba706aa`.
- [ ] Decidir se o desenvolvimento ganha um branch próprio no Neon (hoje dev e produção usam o mesmo banco).

### Marco 2: pesquisa boa

- [ ] Rodar 5 casos reais: incorporadora com SPEs, empresa homônima, e-mail pessoal, site sem CNPJ, empresa estrangeira.
- [ ] Ver se o Sonnet faz falta ao pular a busca web quando site e Receita bastam (cargo do lead, empresas do grupo e SPEs ficaram "não encontrado").
- [ ] Ajustar `agent/instructions.md` com o que errar; meta de briefing em menos de 45 s (hoje 25 s na Cyrela).
- [ ] Velocidade, se precisar: briefing mais curto (a saída é a parte mais lenta) e site + busca em paralelo nas instruções.
- [ ] Ao mexer na busca, consultar a skill `build-with-exa` da Exa (busca de pessoa e empresa).
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
- [ ] Limpar os leads de teste "Ana Teste" do banco antes da entrega (com ok do Pedro).
- [ ] Entregáveis finais: [regras de negócio](business-rules.md), [mapa de objeções](objections.md), documento curto de raciocínio (`docs/reasoning.md`), README.

## Calendário até a entrega

| Dia | Foco |
| --- | --- |
| Sex 16/10 | Esqueleto, repo, primeiro deploy (feito) |
| Sáb 17/10 | Pesquisa real (marco 2) e voz funcionando (marco 3) |
| Dom 18/10 | SPICED, agenda, saída estruturada, objeções (marcos 4 e 5) |
| Seg 19/10 | Polimento de latência e tom, documento de raciocínio |
| Ter 20/10 | Revisar e enviar |

## Pendências que dependem da Paggo

- Chave do ElevenLabs: qual o plano (minutos, concorrência) e em que conta criar o agente.
- URL e token da agenda: formato do cabeçalho de auth e de `de`/`ate`; se a agenda é compartilhada (horários podem sumir durante o teste).
- Chave do Codex: deixou de ser necessária para a pesquisa (o agente usa a chave Anthropic do Pedro).
- Material de produto: preço ou faixa que o agente pode falar, perfil de cliente ideal oficial.
- Campos do SPICED que o SalesOS usa, para a saída estruturada bater com o que o time lê.
- Se voz no site atende ou se querem ver a ligação para o telefone.
- Formato da entrega: repo público ou convite, documento de raciocínio no repo ou à parte.

## Armadilhas

- Dev e produção usam o mesmo banco Neon: o `.env.local` vindo do `vercel env pull` aponta para ele, e leads de teste locais aparecem no painel de produção.
- O AI Gateway recusa modelos sem crédito pago neste time (`customer_verification_required`). Por isso o agente chama a Anthropic direto; trocar de volta para um id de gateway quebra a pesquisa.
- A proteção de deploy do Vercel cobre as URLs de cada deploy (302 para navegador). Webhooks de fora (ElevenLabs) devem usar o domínio de produção `paggo-agent-sdr.vercel.app`, que está fora da proteção.
- O `vercel env pull` acrescenta `.env*.local` ao `.gitignore` toda vez; a linha é redundante com `.env*` e não deve ser commitada.
- BrasilAPI pode limitar (429) ou cair; a reserva prevista é a CNPJá aberta (5 consultas por minuto por IP), ainda não implementada.
- Se o webhook pós-chamada não chegar, a conversa some do painel; reserva prevista: buscar a conversa pela API do ElevenLabs. Não implementado.
- O eve é pré 1.0 e muda quase todo dia: versão exata no `package.json`, doc em `node_modules/eve/docs`.
- Mais armadilhas do código, já provadas, em `AGENTS.md`, seção Gotchas.

## Linha de corte

Se atrasar, sai nesta ordem: evals do eve; acabamento do painel além dos tokens da Paggo; objeções além das quatro que o case cita. Nunca sai: rastro, briefing com fonte, voz funcionando e agenda.

Agent: Claude Code (claude-opus-5-5), sessão local no app desktop.
