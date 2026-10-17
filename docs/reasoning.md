# Raciocínio

O que foi pesquisado em cada parte, as opções, o que foi escolhido e por que não as outras, com a prova (medição, fonte ou teste ao vivo). É escrito enquanto o trabalho acontece; [DECISIONS.md](../DECISIONS.md) guarda a versão de uma linha de cada decisão. Atualizado em 17/10/2026.

## Índice

- [Método](#método)
- [Hospedagem e banco](#hospedagem-e-banco)
- [Modelo do agente de pesquisa](#modelo-do-agente-de-pesquisa)
- [Busca web](#busca-web)
- [Auth do eve em produção](#auth-do-eve-em-produção)
- [Conhecimento da Paggo](#conhecimento-da-paggo)
- [Agente de voz](#agente-de-voz)
- [Agenda](#agenda)
- [O que ainda não sabemos](#o-que-ainda-não-sabemos)
- [Fontes](#fontes)

## Método

- Cada peça serve um critério Crítico ou Alto do case ([case.md](case.md)); o que não serve fica de fora.
- Primeiro o caminho mais simples de ponta a ponta, depois o refinamento.
- Nada é "pronto" sem prova ao vivo: teste verde não basta. Cada seção abaixo diz como foi provado.

## Hospedagem e banco

| Opção | Por que sim | Por que não |
| --- | --- | --- |
| **Neon Free pelo Vercel Marketplace, região iad1 (escolhido)** | Preenche `DATABASE_URL` nos 3 ambientes sozinho; mesma região das funções do Vercel | Dev e produção ficam no mesmo banco (ver armadilha abaixo) |
| Neon em conta própria | Separação total | Copiar segredos à mão entre Neon e Vercel |
| Região São Paulo (Neon sa-east-1 e funções em gru1) | Mais perto do lead | Um ajuste de config a mais, sem ganho que a banca perceba na pesquisa |

Prova: lead criado em produção ficou salvo e o build de produção rodou `db-setup: schema ready` (log do `vercel inspect --logs`).

Armadilha: o `vercel env pull` do ambiente de desenvolvimento aponta para o mesmo banco da produção, então leads de teste locais aparecem no painel de produção. Ajuda nos testes (o agente de voz chama a produção com o id de um lead criado localmente), mas os leads de teste precisam ser limpos antes da entrega.

## Modelo do agente de pesquisa

O plano era o AI Gateway do Vercel com o token OIDC do projeto, sem chave no código. Na primeira chamada ele recusou com `customer_verification_required`.

O que a documentação de preços do AI Gateway diz: o cartão libera um crédito mensal grátis, mas só para uma lista pequena de modelos, sem OpenAI, Anthropic ou Google; e usar chave própria (BYOK) pelo Gateway também exige crédito comprado. Ou seja, não havia caminho grátis pelo Gateway para um modelo bom.

| Opção | Por que sim | Por que não |
| --- | --- | --- |
| **Anthropic direto com chave própria, helper `anthropic()` do eve (escolhido)** | Uma linha de config, sem pacote novo; chave criada só para este projeto | Uma chave a mais para guardar |
| OpenAI direto (`openai()` do eve) | Mesmo esforço | Não havia chave de API da OpenAI para o projeto |
| Gemini direto | Chave disponível | O eve não tem helper; exigiria o pacote `@ai-sdk/google` |
| AI Gateway com crédito comprado | Nada muda no código | Gasto e cartão só para contornar o problema |

Sonnet 5.5 contra Haiku 5.5, mesmo lead (Cyrela, pessoa fictícia), uma rodada de cada, medido pelo banco e pelo `data.usage` do stream do eve:

| | Sonnet 5.5 | Haiku 5.5 |
| --- | --- | --- |
| Tempo até o briefing | 25,1 s | 36,3 s |
| Chamadas de ferramenta | 2 (site, Receita) | 4 (busca, site, Receita, busca) |
| Tokens entrada / saída | 31,9 mil / 2,0 mil | 67,4 mil / 4,8 mil |
| Custo por briefing | ~US$ 0,056 | ~US$ 0,006 |

Os dois acertaram CNPJ, razão social e regime e não inventaram nada. O Sonnet teve mais juízo: notou que o lead parecia de teste e organizou as perguntas pelo SPICED. O Haiku pesquisou mais, mas afirmou que o domínio do e-mail "confirma" a pessoa e citou um site terceiro de CNPJ tendo a Receita. Escolhido o Sonnet: o critério é briefing correto, e a diferença de custo é irrelevante no volume do case. Uma rodada só não prova velocidade; o Marco 2 mede em 5 casos ([research-cases.md](research-cases.md)).

## Busca web

Exa como ferramenta explícita (`web_search`), e não a busca embutida do modelo: cada busca vira uma linha no Rastro com a consulta e os resultados, e a busca embutida esconde isso. O Rastro é critério Crítico. A Exa oferece uma skill de integração (`build-with-exa`) para busca de pessoa e empresa; fica para quando a busca for ajustada no Marco 2, porque o código atual já funciona.

Prova: `web_search` ok em produção no lead `4ba706aa` (e-mail pessoal, CNPJ achado pela busca e confirmado na Receita).

## Auth do eve em produção

Risco previsto: o servidor chama o agente pela URL do próprio deploy (`VERCEL_URL`), e essa URL responde 302 a navegadores por causa da proteção de deploy do Vercel. O plano B era trocar o eve pelo `ToolLoopAgent` do AI SDK com as mesmas ferramentas.

Resultado: não foi preciso. A auth `vercelOidc()` aceita o token OIDC do projeto mesmo com a proteção ligada. Prova: lead `f68b9483` ficou `ready` em produção, sessão `wrun_41M53W3W4D0GHYAFK2AZDMFN7E`.

## Conhecimento da Paggo

Fonte principal: a apresentação institucional de agosto de 2026 enviada pela Paggo (18 páginas). O PDF tem 111 MB, quase tudo imagem, e o texto extraído direto saiu embaralhado; as páginas foram renderizadas em alta resolução e lidas uma a uma.

O que o deck muda em relação ao site: o posicionamento é mais focado em construção ("o orquestrador financeiro da construção"); os números são outros (+300 empreendimentos, contra "+500 empresas" do site); traz 8 módulos com detalhes concretos, clientes, depoimentos e investidores. A seção "Estudo de Caso" aparece no menu do deck, mas não tem conteúdo.

| Decisão | Por quê |
| --- | --- |
| Um arquivo de fatos ([paggo.md](paggo.md)) com a página do deck em cada fato | O que o agente afirma pode ser conferido |
| Uma lista do que nem o deck nem o site dizem (preço, ERPs específicos, soluções de capital) | O agente não inventa: diz que confirma com o time e anota para a reunião |
| Os fatos num bloco curto dentro do prompt, e não numa base de conhecimento com busca | O material é pequeno; a busca acrescentaria uma consulta a cada resposta, e demora é critério Alto |
| O deck vira mapa de descoberta (dor do lead para módulo da Paggo), não roteiro de apresentação | Conduzir sem soar vendedor é critério; produto só depois de ouvir uma dor |

## Agente de voz

**Plataforma:** ElevenLabs Agents, a sugestão do case: turnos, interrupção e latência já resolvidos. Montar fala-para-texto, LLM e texto-para-fala à mão gastaria o tempo em encanamento.

**Conta:** o primeiro teste roda numa conta de teste do desenvolvedor, para não gastar minutos nem deixar agentes de teste na conta da Paggo. O plano grátis dá 15 minutos de chamada; os 10.000 créditos pagam o LLM, não os minutos, e a licença comercial só começa no plano Starter. A versão final vai para a conta da Paggo rodando o mesmo script com a outra chave.

**Publicação:**

| Opção | Por que sim | Por que não |
| --- | --- | --- |
| **Script próprio pela API REST, `scripts/voice-sync.mjs` (escolhido)** | Cria segredo, ferramentas e agente; acha tudo pelo nome e atualiza; o prompt fica num markdown legível | Código nosso para manter (80 linhas) |
| `@elevenlabs/agents-cli` | Era o plano | Descontinuada, parou na 0.6.1 |
| `@elevenlabs/cli` 1.x | Sucessora oficial | Saiu no mesmo dia; não cria segredos, webhooks nem dicionários de pronúncia |
| Configurar no painel | Rápido | Nada versionado; a banca não conseguiria ler o agente no repo |

**Modelos** (opções que a API do agente aceita):

| Peça | Escolhido | Alternativas e por que não agora |
| --- | --- | --- |
| LLM | `gemini-2.5-flash`, sem raciocínio | Padrão rápido da plataforma. Gemini mais novos, `gpt-5-mini`, `claude-haiku-5-5` ficam para medir com o prompt real; a plataforma não ranqueia velocidade |
| Voz | `eleven_v4_turbo` (~100 ms, fala português) | `eleven_flash_v2_5` (~75 ms, menor qualidade); `eleven_v3_conversational` (~280 ms); `eleven_multilingual_v2` (cita o Brasil explicitamente, mas é mais lento). `eleven_flash_v2` e `eleven_turbo_v2` só falam inglês |

**Persona:** "assistente virtual da Paggo", sem nome humano, e diz que é IA já na abertura. Soa como alguém do time, que conhece a rotina financeira de uma incorporadora, sem fingir ser pessoa: a banca vai testar isso, e mentir quebraria a confiança na primeira pergunta.

**Segurança e custo:** a auth do agente está ligada, então só abre sessão com o token que o nosso servidor gera, e o servidor só gera token para lead que existe e já tem a pesquisa terminada. As ferramentas da agenda só aceitam chamadas com o segredo compartilhado (`x-tool-secret`) e recusam tudo se ele não estiver configurado.

**Ferramentas:** o id do lead e o id da conversa entram no corpo por variável dinâmica, nunca pelo LLM, para o Rastro ligar cada chamada ao lead certo. As respostas já vêm em frase falável ("terça-feira, dia 20, às 10h"), para o agente não fazer conta de data nem ler formato ISO.

**Pós-chamada:** a assinatura HMAC é conferida com 15 linhas nossas usando `crypto`, com teste, e não com o SDK, que seria uma dependência a mais. A coleta tem 10 campos: os 5 do SPICED, resultado, horário, objeções, dados corrigidos e `duvidas`. O último guarda o que o agente não soube responder, para virar pauta da reunião.

## Agenda

O endpoint real ainda está sendo construído pela Paggo. Enquanto isso, uma agenda falsa atende pela mesma interface (`lib/agenda.ts`), e a troca é feita por duas variáveis de ambiente. Do enunciado, assumimos `Authorization: Bearer` e datas ISO em `de`/`ate`; o formato das respostas segue os exemplos do case. Regras: próximos 5 dias úteis, nada começando na próxima hora, até 4 opções, das quais o agente oferece duas.

## O que ainda não sabemos

- Preço e ERPs integrados: perguntado à Paggo.
- Formato exato do endpoint da agenda (cabeçalho de auth, `de`/`ate`).
- Onde o id do lead chega no pós-chamada (`data.user_id` ou `data.metadata.user_id`): o código lê os dois.
- Sotaque e latência reais da voz: só se sabe falando com o agente.

## Fontes

- [Preços do AI Gateway](https://vercel.com/docs/ai-gateway/pricing)
- [Preços do ElevenAgents](https://elevenlabs.io/pricing/agents) e [preços do ElevenLabs](https://elevenlabs.io/pricing)
- Pacotes conferidos no npm: `@elevenlabs/agents-cli` 0.6.1, `@elevenlabs/cli` 1.6.1 (OpenAPI embutido), `@elevenlabs/react` 1.18.0, `@elevenlabs/client` 1.28.0, `@elevenlabs/elevenlabs-js` 2.73.0
- Documentação do eve em `node_modules/eve/docs` (0.80.1)
- Apresentação institucional da Paggo, agosto de 2026, e [paggo.com.br](https://www.paggo.com.br/)
