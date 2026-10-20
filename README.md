# Paggo: agente de pré-vendas por voz

Case da Paggo. Um lead preenche um formulário, um agente pesquisa a pessoa e a empresa e escreve um briefing com a fonte de cada fato, um assistente de voz conversa com o lead no próprio site, qualifica pelo SPICED e marca a reunião, e um painel interno mostra o formulário, a pesquisa, a conversa e o rastro de cada ferramenta usada.

No ar em https://paggo-agent-sdr.vercel.app (painel interno em `/painel`, com a senha enviada junto com a entrega).

## Testar em 5 minutos

1. Abra https://paggo-agent-sdr.vercel.app e preencha o formulário. Com e-mail de trabalho, a pesquisa começa pelo site da empresa.
2. A tela de espera mostra "pesquisando sua empresa". O briefing leva de 12 a 33 s; quando ficar pronto, o botão "Falar com a Paggo" libera. O navegador pede o microfone.
3. Converse como um lead. O agente confirma o que a pesquisa achou, pergunta só o que falta, responde objeções e, quando você topar a reunião, pergunta o que deixa isso urgente e quem decide antes de oferecer dois horários da agenda da Paggo.
4. Abra `/painel` e clique no seu nome. Formulário, pesquisa e rastro já estão lá desde o fim da pesquisa; a conversa estruturada e a transcrição chegam pelo pós-chamada, logo depois que a conversa termina (recarregue a página).

O painel já tem os leads de teste de 16 a 19/10: pessoas fictícias dos casos difíceis da pesquisa e as conversas de prova do desenvolvedor.

## O que olhar no painel

| Aba | O que mostra | Critério do case |
| --- | --- | --- |
| Formulário | O que o lead digitou, o cargo com o papel na compra, a hora do aceite e a origem (UTM e site) | Registro por visitante |
| Pesquisa | Fit com os motivos; cada fato com confiança e link da fonte, ou "não encontrado"; hipóteses de SPICED; o resumo que a voz recebeu | Gera o briefing; briefing correto |
| Conversa estruturada | Resultado, dados confirmados ou corrigidos, SPICED letra por letra, horário marcado, objeções e o que ficou para o time | Saída estruturada; SPICED |
| Transcrição | Resumo e transcrição completa | Conversa em texto |
| Rastro | Cada chamada de ferramenta, da pesquisa e da conversa, com entrada, saída, tempo, erro e os sites consultados | Fontes e ferramentas de cada execução |

## Como funciona

**Pesquisa.** Ao enviar o formulário, um agente [eve](https://github.com/vercel/eve) com Claude Sonnet 5.5 roda dentro do próprio app com três ferramentas: `fetch_site` lê o site do domínio do e-mail, `lookup_cnpj` consulta a Receita pela BrasilAPI e `web_search` busca na Exa o cargo da pessoa, o CNPJ que o site não mostra e as SPEs do grupo. Sai um briefing estruturado: cada fato com fonte ou "não encontrado", o fit com o cliente ideal, hipóteses de SPICED e um resumo para a voz. Leva de 12 a 33 s nos casos difíceis ([research-cases.md](docs/research-cases.md)). `npm run eval` roda 7 casos difíceis (homônimo, e-mail pessoal, empresa estrangeira, lead que pergunta o preço) com as ferramentas reais.

**Voz.** Com o briefing pronto, a tela de espera libera o botão. O servidor gera um token de conversa do ElevenLabs e passa o briefing como variáveis. O assistente roda na conta ElevenLabs da Paggo (LLM `gemini-2.5-flash`, modelo de voz `eleven_v4_turbo`, voz Samuel), confirma o que a pesquisa achou, pergunta só o que falta, responde objeções e consulta e marca a agenda por duas ferramentas que chamam `/api/agenda/*`. No fim, o webhook pós-chamada grava a transcrição, o resumo e os campos do SPICED. O agente está versionado em `voice/` e é publicado por `scripts/voice-sync.mjs`; `scripts/voice-simulate.mjs` testa o prompt por texto contra personas.

**Rastro.** Toda chamada de ferramenta, da pesquisa e da voz, passa por `traced()` e vira uma linha com entrada, saída, fontes, tempo e erro, ligada ao lead. É a aba Rastro do painel.

## Limites conhecidos

- A conversa é por voz no navegador; o case deixa o canal livre, e telefone ou WhatsApp usariam o mesmo agente.
- A agenda do case é fictícia: o agente marca o horário, mas nada envia convite, então ele não promete convite nem material ("deixo anotado para o time").
- Preço e ERPs integrados não estão no material da Paggo: o agente não inventa e registra a pergunta para a reunião.
- O resto, com números, em [O que não está resolvido](docs/reasoning-summary.md#o-que-não-está-resolvido).

## Rodar localmente

Requer Node 24.

```bash
npm install
cp .env.example .env.local   # DATABASE_URL, ANTHROPIC_API_KEY e EXA_API_KEY bastam para a pesquisa
npm run dev                  # http://localhost:3000, com o agente eve em /eve/v1
```

Sem `AGENDA_URL` e `AGENDA_TOKEN`, uma agenda falsa responde no lugar da real. A voz precisa de `ELEVENLABS_API_KEY`, do `ELEVENLABS_AGENT_ID` que o `voice-sync.mjs` imprime e do `VOICE_TOOL_SECRET`, que as ferramentas da agenda mandam; o pós-chamada, do `ELEVENLABS_WEBHOOK_SECRET`. Sem `PANEL_PASSWORD` o painel fica aberto, o que só serve para o desenvolvimento local. A lista comentada está em `.env.example`. Antes de cada push: `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`.

| Pasta | O que tem |
| --- | --- |
| `app/` | Telas (formulário, espera, painel) e rotas da API |
| `agent/`, `evals/` | Agente de pesquisa (instruções e ferramentas) e o eval dos casos difíceis |
| `lib/` | CNPJ, site, busca, briefing, banco, rastro e agenda |
| `voice/`, `scripts/` | Prompt, configuração e personas do agente de voz, e os scripts que publicam e simulam |
| `db/schema.sql` | As duas tabelas |

## Documentação

| Arquivo | O que tem |
| --- | --- |
| [docs/reasoning-summary.md](docs/reasoning-summary.md) | O raciocínio de cada parte, em resumo: o documento curto do case |
| [docs/reasoning.md](docs/reasoning.md) | O diário do raciocínio: cada medição, opção e prova, na ordem em que aconteceram |
| [docs/business-rules.md](docs/business-rules.md) | Regras de qualificação, fit, SPICED e agenda |
| [docs/objections.md](docs/objections.md) | Objeções e como o agente responde cada uma |
| [docs/architecture.md](docs/architecture.md) | Diagramas, contratos e mapa de arquivos |
| [DECISIONS.md](DECISIONS.md) | Uma linha por decisão, com o porquê |
| [docs/STATUS.md](docs/STATUS.md) | Onde o projeto está e o que falta |

O índice completo está em [docs/README.md](docs/README.md). Regras para agentes de código em [AGENTS.md](AGENTS.md).
