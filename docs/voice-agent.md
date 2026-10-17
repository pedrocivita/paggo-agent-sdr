# Agente de voz

Especificação dos marcos 3 e 4. Nada disto está construído ainda. A seção [Fatos verificados](#fatos-verificados) separa o que foi conferido no código dos pacotes do que ainda é hipótese.

## Índice

- [Desenho](#desenho)
- [Prompt](#prompt)
- [Variáveis dinâmicas](#variáveis-dinâmicas)
- [Ferramentas](#ferramentas)
- [Coleta de dados](#coleta-de-dados)
- [Latência](#latência)
- [Sessão no site](#sessão-no-site)
- [Fatos verificados](#fatos-verificados)
- [Em aberto](#em-aberto)

## Desenho

Um agente só no ElevenLabs Agents, com a config versionada em `voice/` e publicada pela CLI oficial (`@elevenlabs/agents-cli`). Prompt curto, briefing injetado na abertura. O SPICED é checklist, não roteiro. O painel do ElevenLabs serve só para testar.

## Prompt

Seis blocos:

| Bloco | O que diz |
| --- | --- |
| Identidade | Assistente virtual da Paggo; diz isso na abertura e confirma que é IA se perguntarem |
| Contexto | O briefing; usa o que sabe para confirmar ("vi que vocês têm algumas SPEs, é isso?") |
| Objetivo | Entender a operação, completar o SPICED e, se fizer sentido, marcar 30 minutos |
| Estilo | Uma pergunta por vez, frases curtas, sem lista falada, nada de pitch antes da dor |
| Limites | Não inventa preço nem recurso; não fala dado pessoal da pesquisa; pessoa errada pede indicação |
| Ferramentas | Quando chamar cada uma e o que falar enquanto ela roda |

Regras de conversa e agenda: [business-rules.md](business-rules.md). Objeções: [objections.md](objections.md).

## Variáveis dinâmicas

| Variável | Vem de |
| --- | --- |
| `lead_id` | Id do lead; vai no corpo das ferramentas para o rastro ligar a chamada ao lead |
| `lead_name` | Primeiro nome do formulário |
| `company_name` | `briefing.company.legalName.value`, ou o nome digitado se a pesquisa não achou |
| `briefing` | `briefing.forAgent`: o que já se sabe, o que falta perguntar e um gancho de abertura; sem pesquisa, uma frase pedindo para confirmar empresa e papel |

A rota `POST /api/leads/[id]/voice` gera o token e devolve essas variáveis; só atende depois que a pesquisa terminou.

O id do lead também vai como `userId` da sessão e volta no webhook pós-chamada como `data.user_id`.

## Ferramentas

| Ferramenta | Tipo | Regra |
| --- | --- | --- |
| `consultar_agenda` | Webhook para `POST /api/agenda/consultar` | Próximos 5 dias úteis, a partir de 1 hora depois de agora; devolve até 4 opções com o texto falado ("terça-feira, dia 20, às 10h"); o agente oferece duas |
| `marcar_reuniao` | Webhook para `POST /api/agenda/marcar` | Repete dia e hora; usa nome e e-mail do formulário, ou o e-mail que o lead pedir; no 409 oferece o próximo |
| `end_call` | Ferramenta de sistema | Encerra depois do resumo e da despedida |

Corpo das duas: `lead_id` e `conversation_id` vêm de variáveis (não do LLM); `inicio` (ISO, de uma opção de `consultar_agenda`) e `email` (opcional) vêm do LLM. As rotas exigem o cabeçalho `x-tool-secret` igual a `VOICE_TOOL_SECRET` (secret no ElevenLabs, variável no Vercel), chamam `lib/agenda.ts` dentro de `traced()` com `run.kind = "voice"` e `run.id` = id da conversa, e respondem em frases curtas. Erro da agenda vira a frase "o time confirma o horário por e-mail" e fica no rastro.

## Coleta de dados

Campos da aba Analysis, declarados na config do agente, que chegam prontos no webhook pós-chamada. Dez campos, abaixo do limite de 25. O painel lê as chaves SPICED com esses nomes (`app/painel/[id]/lead-tabs.tsx`).

| Campo | Descrição na config |
| --- | --- |
| `situacao` | Como o financeiro da empresa funciona hoje, nas palavras do lead. Vazio se ele não falou |
| `dor` | O que trava ou incomoda o lead no financeiro, nas palavras dele. Vazio se não falou |
| `impacto` | Quanto a dor custa em tempo, multa, juros ou dinheiro, nas palavras dele. Vazio se não falou |
| `evento_critico` | O que obriga a resolver agora, com data se ele disse. Vazio se não falou |
| `decisao` | Quem decide a compra e como, nas palavras dele. Vazio se não falou |
| `resultado` | Um de: reunião marcada, qualificado sem reunião, retornar depois, indicou outra pessoa, não qualificado |
| `horario_marcado` | Dia e hora da reunião marcada, ou vazio |
| `objecoes` | Objeções levantadas e como ficaram, separadas por ponto e vírgula |
| `dados_corrigidos` | Dados que o lead confirmou ou corrigiu (nome, cargo, empresa, e-mail, indicação de outra pessoa) |
| `duvidas` | Perguntas que o agente não soube responder e ficaram para o time |

## Latência

Critério alto da banca: soar como pessoa, sem demora.

- LLM rápido com raciocínio no mínimo, escolhido testando 2 ou 3 modelos com o prompt real.
- Prompt e briefing enxutos.
- Fala curta antes de cada ferramenta (`force_pre_tool_speech`).
- Voz em português do Brasil e dicionário de pronúncia para Paggo, CDI, SPE e CNPJ.

## Sessão no site

A chave fica no servidor. O navegador pede à nossa rota um conversation token e as variáveis, e abre a sessão:

```ts
await conversation.startSession({
  conversationToken,          // gerado no servidor com a chave do ElevenLabs
  userId: lead.id,            // volta no webhook pós-chamada
  dynamicVariables: {
    lead_id: lead.id,
    lead_name: lead.form.name,
    company_name: companyName,
    briefing: lead.briefing.forAgent,
  },
});
```

## Fatos verificados

Conferidos em 16/10/2026 no código publicado no npm, não só na documentação.

| Fato | Onde foi conferido |
| --- | --- |
| `startSession` aceita `conversationToken`, `userId` e `dynamicVariables` (valores string, number ou boolean) | `@elevenlabs/client` 1.28.0, `dist/utils/BaseConnection.d.ts` |
| O SDK React re-exporta o client e exige um `ConversationProvider`; `useConversation` devolve `status`, `isSpeaking`, `startSession`, `endSession` | Docs do `@elevenlabs/react` 1.18.0 |
| Token WebRTC: `GET https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=...` com o cabeçalho `xi-api-key`; a resposta traz `token` | Docs do SDK React |
| Assinatura do webhook: cabeçalho `ElevenLabs-Signature` no formato `t=<unix>,v0=<hex>`; `v0` = HMAC-SHA256 com o segredo sobre `` `${t}.${corpoBruto}` ``; tolerância de 30 minutos | `@elevenlabs/elevenlabs-js` 2.73.0, `dist/wrapper/webhooks.js` |
| Payload pós-chamada: `type = "post_call_transcription"`; em `data`: `conversation_id`, `user_id`, `transcript[]` (`role`, `message`, `tool_calls`, `tool_results`), `analysis` (`transcript_summary`, `call_successful`, `data_collection_results`), `conversation_initiation_client_data.dynamic_variables` | Docs de post-call webhooks |
| Layout da CLI: `agents.json`, `tools.json`, `agent_configs/`, `tool_configs/`. Ferramentas são recursos próprios, ligadas ao agente por `prompt.tool_ids` | `@elevenlabs/agents-cli` 0.6.1, `dist/cli.js` e `dist/templates.js` |
| Webhook tool: `api_schema` (`url`, `method`, `request_body_schema`, `request_headers`), `response_timeout_secs`, `force_pre_tool_speech`, `assignments`, `dynamic_variables` | Idem |
| `agents add-webhook-tool` já cria a ferramenta na conta do ElevenLabs, então a CLI só roda com a chave | Idem |

## Em aberto

- Como uma propriedade do corpo da ferramenta é preenchida por uma variável dinâmica (`lead_id`). Conferir na referência da API de agentes antes de escrever a config.
- Shape exato de `data_collection_results` (provavelmente um objeto por campo com `value` e justificativa). Conferir com uma conversa real antes de mapear para `Conversation`.
- Plano da chave (minutos, concorrência) e em que conta o agente é criado.
- Verificar a assinatura com o SDK (`webhooks.constructEvent`, uma dependência a mais) ou com 15 linhas nossas usando `crypto`. Preferência: as 15 linhas, com teste.
