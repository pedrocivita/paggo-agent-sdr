# Identidade visual

A UI usa a linguagem visual do próprio material do case da Paggo, sem biblioteca de UI. Os tokens e componentes foram extraídos do HTML do case para `app/paggo.css`; o que é só deste app fica em `app/app.css`.

## Índice

- [Tokens](#tokens)
- [Componentes prontos](#componentes-prontos)
- [Regras](#regras)

## Tokens

Definidos em `:root` de `app/paggo.css`, com tema escuro em `prefers-color-scheme` e em `[data-theme=dark]`. O app usa sempre o escuro: `data-theme="dark"` no `<html>` de `app/layout.tsx`.

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `--ground` | `#f4f4f2` | `#0b0b0c` | Fundo da página |
| `--surface` | `#fcfcfb` | `#141416` | Cartões, tabelas, campos |
| `--ink` | `#131316` | `#f4f4f2` | Títulos e texto forte |
| `--high` | `#3e3a3a` | `#d6d3cc` | Texto corrido |
| `--mid` | `#746f6e` | `#9b9693` | Texto secundário, metadados |
| `--accent` | `#8b5a2b` | `#d1a26a` | Destaque, foco, pontos |
| `--ok` `--warn` `--err` `--info` | verde, âmbar, vermelho, azul | versões claras | Chips de status e confiança |
| `--r-md` | 14px | | Cantos de cartões e campos |
| `--r-pill` | 18px | | Botões em pílula |

Fonte: Outfit em tudo, carregada por `next/font` em `app/layout.tsx`. Em `app/app.css` o token `--mono` aponta para ela também, então chips e metadados usam a mesma fonte; só o JSON cru do Rastro usa a monoespaçada do sistema.

## Componentes prontos

| Classe | Para quê |
| --- | --- |
| `.doc`, `.masthead`, `.doc-head`, `.eyebrow`, `.lede` | Estrutura da página e cabeçalho |
| `.btn` (`.ghost`, `.quiet`, `.sm`) | Botões em pílula |
| `.chip` (`.ok`, `.warn`, `.err`, `.info`, `.accent`, `.quiet`) | Status do lead, confiança de um fato, tipo de execução |
| `.card`, `.kit` | Cartões e grade de cartões |
| `.tabs` com `[role=tab]` | Abas do detalhe do lead no painel |
| `.rows` / `.row`, `.tablewrap` | Listas de pares e tabelas |
| `.note` (`.ok`, `.warn`, `.err`, `.info`) | Avisos |
| `.form`, `.field`, `.status`, `.facts`, `.event` | Só deste app (`app/app.css`): formulário, indicador de pesquisa, fatos com fonte, linha do rastro |
| `.band` | Só deste app: o bloco grafite do último slide do deck, usado como chamada para a voz na tela de espera |

## Regras

- Reusar classe existente antes de criar CSS novo. CSS novo vai para `app/app.css`, nunca para `app/paggo.css`.
- Destaque (`--accent`) é para o que importa na tela, não para decorar.
- Tom dos textos da UI igual ao do site: direto, concreto, sem jargão de vendas ([paggo.md](paggo.md)).
- Toda mudança de UI se prova olhando a página rodando, no desktop e em largura de celular.
