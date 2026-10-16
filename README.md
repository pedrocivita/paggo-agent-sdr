# Paggo: agente de pré-vendas por voz

Case para a vaga de Marketing e GTM Engineering da Paggo. Um lead preenche um formulário, um agente pesquisa a pessoa e a empresa, uma assistente de voz conversa com o lead usando essa pesquisa, qualifica pelo SPICED e marca uma reunião. Um painel interno mostra tudo, inclusive cada ferramenta que os agentes usaram.

## Índice

- [Resumo](#resumo)
- [Para quem vai mexer no código](#para-quem-vai-mexer-no-código)
- [Rodar localmente](#rodar-localmente)
- [Documentação](#documentação)
- [Estado](#estado)

## Resumo

1. O lead preenche nome, e-mail, telefone e empresa.
2. Um agente lê o site da empresa, consulta a Receita pelo CNPJ e busca na web só o que faltar. Cada fato do briefing sai com a fonte.
3. A assistente de voz abre a conversa já sabendo quem é a empresa, confirma o que a pesquisa achou e pergunta só o que falta.
4. No fim, a conversa vira dados: SPICED letra por letra, resultado e reunião marcada.
5. O painel interno mostra, para cada lead, o formulário, a pesquisa, a conversa e o rastro de cada ferramenta consultada.

## Para quem vai mexer no código

| Pasta | O que tem |
| --- | --- |
| `app/` | As telas (formulário, espera, painel) e as rotas da API |
| `agent/` | O agente de pesquisa no formato eve: instruções e 3 ferramentas |
| `lib/` | Lógica compartilhada: CNPJ, site, busca, briefing, banco, rastro, agenda |
| `db/schema.sql` | As duas tabelas, criadas a cada build se não existirem |
| `docs/` | Enunciado, arquitetura, regras de negócio, objeções, especificação da voz e o estado atual |

Stack: Next.js 16 no Vercel, eve 0.80.1 para o agente de pesquisa, ElevenLabs Agents para a voz, Postgres, BrasilAPI e Exa. As decisões e o porquê de cada uma estão em [DECISIONS.md](DECISIONS.md). Regras para agentes de código (Claude Code, Cursor, Codex) em [AGENTS.md](AGENTS.md).

## Rodar localmente

Requer Node 24.

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL e as chaves
npm run dev                  # http://localhost:3000
npm test
```

Antes de cada push: `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`.

## Documentação

Comece por [docs/STATUS.md](docs/STATUS.md) (onde estamos e próximos passos). O índice completo está em [docs/README.md](docs/README.md).

## Estado

Em construção até 20/10/2026. Esqueleto ponta a ponta pronto com agenda falsa; falta o primeiro deploy. A voz entra no marco 3.
