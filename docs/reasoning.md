# Raciocínio

O que foi pesquisado em cada parte, as opções, o que foi escolhido e por que não as outras, com a prova (medição, fonte ou teste ao vivo). É escrito enquanto o trabalho acontece; [DECISIONS.md](../DECISIONS.md) guarda a versão de uma linha de cada decisão. Atualizado em 17/10/2026.

## Índice

- [Método](#método)
- [Hospedagem e banco](#hospedagem-e-banco)
- [Modelo do agente de pesquisa](#modelo-do-agente-de-pesquisa)
- [Busca web](#busca-web)
- [Pesquisa nos casos difíceis](#pesquisa-nos-casos-difíceis)
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

## Pesquisa nos casos difíceis

Marco 2: os 5 casos difíceis do plano (incorporadora com SPEs, homônimo, e-mail pessoal, site sem CNPJ, estrangeira) mais a própria Paggo, empresas reais com pessoas fictícias, enviados pelo formulário, lidos contra o Rastro, corrigidos e rodados de novo. O detalhe de cada caso, com o CNPJ escolhido e o descartado, está em [research-cases.md](research-cases.md).

Primeira rodada: nenhum CNPJ errado e nenhum fato fora do Rastro. Os erros foram ferramenta pulada (cargo e SPEs nunca buscados, Receita pulada no caso do Gmail), dedução apresentada como fato (estados tirados de um menu, cidade tirada do DDD do lead) e um `forAgent` com CNPJ e notas que não ajudavam a voz. E um bug: `lib/site.ts` procurava o CNPJ só nos primeiros 6.000 caracteres, e o rodapé da Cyrela e o da Paggo ficavam de fora.

| Decisão | Alternativa | Por que esta |
| --- | --- | --- |
| Buscar sempre o cargo e as SPEs, em paralelo com o site e a Receita | "Busca só para o que faltar" (a regra antiga) | O Sonnet nunca achou que faltava. Em paralelo, a média foi de 23,8 s para 22,8 s |
| Receita como única fonte do cadastro | Aceitar agregadores de CNPJ | Os dados batiam, mas sem a Receita o regime tributário sumia, e ele mexe no fit |
| Busca de SPE no formato "<grupo> SPE Empreendimentos Imobiliários Ltda CNPJ" | "<razão social> SPE" | Testado direto na Exa: o primeiro traz SPEs pelo nome, o segundo só páginas genéricas |
| Cada passo novo explica o motivo ("a voz usa as SPEs para abrir a conversa") | Ordem seca | Sem o motivo, o Sonnet pulou a busca de SPEs numa rodada da Even porque o fit já era alto |
| Lead @paggo.com.br: pesquisa normal, fit "desconhecido", voz conduz como lead normal | Fit baixo (antes); não pesquisar (testado: Rastro vazio) | A banca deve usar o próprio e-mail fazendo papel de cliente; fit baixo encerraria a conversa |
| `forAgent` com 1 ou 2 módulos prováveis | A voz escolher no meio da conversa | A pesquisa sabe se o grupo tem SPEs ou vende na planta; a voz cita um módulo só depois da dor |
| `lib/search.ts` sem mudança, skill `build-with-exa` não instalada | Ajustar a busca da Exa (categoria de pessoa) | O formato da consulta resolveu as SPEs, e a busca pela pessoa já trouxe perfis do LinkedIn |
| Nada de otimização de velocidade | Briefing mais curto, paralelismo no código | Máximo de 33 s, abaixo da meta de 45 s. As referências de tempo de resposta falam em 5 minutos até o contato; a pesquisa não é o gargalo |

O mesmo lead seguiu caminhos diferentes em rodadas seguidas, então uma rodada por caso não prova nada. Os 6 casos viraram um eval do eve (`npm run eval`):

| Opção | Por que sim | Por que não |
| --- | --- | --- |
| **Ferramentas de verdade e checagens fixas: CNPJ, fit, ferramentas chamadas, sem nome de sócio, dica de módulo, menos de 45 s (escolhido)** | Pega exatamente os erros que importaram; não precisa de juiz | Depende do mundo real: site fora do ar derruba um caso |
| Ferramentas falsas (tool stubs) | Determinístico e grátis | Testaria uma web inventada; os erros vinham das respostas reais |
| LLM como juiz | Avalia texto | Custo e ruído para julgar o que uma checagem simples confere |

Prova: rodada 2 com os 6 casos certos (CNPJ, fit, fontes) e a primeira execução do eval, 6 de 6, 57 de 57 gates, US$ 0,39.

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

**Primeiro teste com microfone** (17/10, conversa `conv_3101m55qx2jcfcbas9b27h3p55n2`, 3,4 min, lead fictício da Cyrela), medido pela API de conversas do ElevenLabs:

| O que | Resultado |
| --- | --- |
| Fluxo | Abertura, briefing usado ("vi que a Cyrela tem vários lançamentos"), cargo, horários, confirmação, reunião marcada, `end_call` |
| Demora até a voz (do silêncio do lead ao áudio) | 1,0 a 1,25 s na maioria das falas; 2,35 s na primeira, com o LLM frio (1,72 s até o primeiro token) |
| Ferramentas | `consultar_agenda` (0,53 s) e `marcar_reuniao` (0,23 s), as duas no Rastro com o id da conversa e o lead certo |
| Transcrição | "Sienge" ouvido como "Sunkia"; o LLM corrigiu sozinho |
| Custo | 2.452 créditos: 2.280 de voz e 172 de LLM (US$ 0,017). Na prática, crédito equivale a minuto |

O que errou e foi corrigido no prompt e na coleta: pulou da frase "não conheço, quero conhecer" direto para a reunião, sem dor nem decisão (agora oferece duas dores comuns para o lead escolher e pergunta quem decide antes de marcar); disse "entender como a Paggo pode se integrar com o Sienge", o que insinua uma integração que ninguém confirmou (agora ERP citado vira dúvida para o time); gravou o cargo do lead no campo `decisao` (descrições dos campos reescritas); as tags de emoção do modelo de voz (`[happy]`) apareciam na transcrição (agora são removidas antes de gravar).

Depois do teste, a voz pareceu lenta e alegre demais. Ajustes: `speed` 1,1 (o máximo é 1,2), `stability` de 0,5 para 0,65 (menos variação de emoção), `expressive_mode` desligado (é ele que leva o LLM a pôr tags como `[happy]`) e uma linha de tom no prompt: profissional e neutro, sem exclamação. A voz continua a mesma; trocar de voz fica para depois de ouvir o ajuste.

**Segundo teste** (conversa `conv_8301m55rhhcmedx8hxzbcns92sd1`, 3,4 min, 2.371 créditos). A voz já soava mais rápida e contida, mas o texto ficou prolixo: quatro falas tiveram de 34 a 59 palavras, e a lead reclamou duas vezes ("essa pergunta foi muito longa", "consegue ser menos prolixo?"). Erros lidos na transcrição e o que mudou:

| Erro | Correção |
| --- | --- |
| Falas longas, com pergunta composta | Limite de duas frases curtas (umas 20 palavras), uma ideia por pergunta, e exemplos de fala ruim e boa no prompt |
| Abriu lendo dados ("seu nome é Ana Teste e você é da Cyrela, certo?") | Não confirma nome nem empresa lendo de volta; pergunta direto qual parte do financeiro a pessoa cuida |
| Repetia a fala inteira do lead, elogiava ("isso é ótimo") e começava as frases com "Ana" | Eco de no máximo três palavras; nome só na despedida; "compreendo", "perfeito" e "ótimo" proibidos |
| Leu uma lista de módulos quando pediram para conhecer a Paggo | Uma frase pronta ("junta pagamentos, cobrança e caixa de todas as obras num lugar só") e duas dores para escolher |
| "Consultando agenda" e "Marcando reunião" falados, o segundo duas vezes, com a ferramenta chamada 13 s depois | `pre_tool_speech` de `force` para `auto` (as duas ferramentas respondem em menos de 1 s) e regra de marcar logo depois da confirmação, sem anunciar |
| Despedida cortada no meio ("Re"): encerrou a chamada enquanto falava | `end_call` só depois que os dois se despediram |
| Não perguntou quem decide antes de marcar | Pergunta de decisão obrigatória antes da agenda, mesmo quando o lead pede a reunião |
| Transcrição ouviu "Ceng" e "a pago" | Palavras-chave na transcrição (`asr.keywords`): Paggo, Sienge, Cyrela, SPE, INCC, CDI, TOTVS, SAP |
| Ainda devagar | `speed` 1,2, o máximo da plataforma |

**Terceiro teste** (conversa `conv_5401m55svdjze1xvcpjk1ae4m57k`, 4,3 min, 3.095 créditos). As falas ficaram curtas (11 a 22 palavras), e a abertura foi direto ao papel da pessoa. Problemas novos:

| Erro | Correção |
| --- | --- |
| Virou interrogatório: insistiu no impacto com uma pergunta abstrata ("quantas horas por dia ou por semana"), repetiu quando a lead não entendeu, perguntou "o que acontece se não concilia", e a lead reclamou ("quanta pergunta") | Uma seção de perguntas que rendem, uma por letra do SPICED, com régua no impacto; no máximo cinco perguntas de descoberta; quem não sabe ou não entende não ouve a pergunta de novo |
| A lead pediu duas vezes para conhecer a Paggo e não recebeu nada | "Dê antes de pedir": cada dor contada recebe uma frase de como a Paggo resolve antes da próxima pergunta; ao segundo pedido ou a uma reclamação, para a descoberta e oferece a reunião |
| A conciliação foi a dor escolhida, e o mapa de dores não tinha resposta para ela | Item novo no mapa, do deck: pagamentos e recebimentos passam pela conta Paggo e caem conciliados no extrato, integrado ao ERP |
| Um riso ("Rá!") fez ela parar e recomeçar a mesma frase duas vezes, pedindo desculpa | `turn.interruption_ignore_terms` com interjeições em português (aham, uhum, tá, rá, haha) e regra de não recomeçar a frase |
| Silêncio constrangedor no fim: 11,4 s depois do "não" para a pergunta "tem mais alguma dúvida?" e 5,9 s depois do "tchau" | Fecha numa fala só (dia, hora, convite por e-mail, "até mais") e chama `end_call` logo em seguida, sem perguntar nem esperar |
| Demora ainda perceptível (0,8 a 1,9 s; a fala já está na velocidade máxima, 1,2) | `turn.speculative_turn` ligado: o LLM começa a responder durante o silêncio, antes da certeza de fim de turno. A ansiedade do turno continua `normal`, porque o lead fala com pausas ("ééé") e `eager` cortaria a fala dele |

Sobra: o `gemini-2.5-flash` ainda escorrega no estilo (disse "Ótimo!", que está proibido, e voltou a listar módulos ao pedir desculpa). O próximo passo é medir 2 ou 3 LLMs mais fortes com o mesmo prompt, já na conta da Paggo; a conta de teste ficou com cerca de 2.000 créditos, uns 3 minutos.

O aviso `error reading from signal stream` no console vem do `livekit-client`, a camada WebRTC do SDK, quando a conexão fecha; o overlay do Next em desenvolvimento mostra qualquer `console.error` como erro.

## Agenda

O endpoint real ainda está sendo construído pela Paggo. Enquanto isso, uma agenda falsa atende pela mesma interface (`lib/agenda.ts`), e a troca é feita por duas variáveis de ambiente. Do enunciado, assumimos `Authorization: Bearer` e datas ISO em `de`/`ate`; o formato das respostas segue os exemplos do case. Regras: próximos 5 dias úteis, nada começando na próxima hora, até 4 opções, das quais o agente oferece duas.

## O que ainda não sabemos

- Preço e ERPs integrados: perguntado à Paggo.
- Formato exato do endpoint da agenda (cabeçalho de auth, `de`/`ate`).
- Onde o id do lead chega no pós-chamada (`data.user_id` ou `data.metadata.user_id`): o código lê os dois.
- Sotaque e latência reais da voz: só se sabe falando com o agente.
- Se a busca pela pessoa acha o cargo de alguém real: só foi testada com nomes fictícios (o agente rejeitou os homônimos e não inventou).

## Fontes

- [Preços do AI Gateway](https://vercel.com/docs/ai-gateway/pricing)
- [Preços do ElevenAgents](https://elevenlabs.io/pricing/agents) e [preços do ElevenLabs](https://elevenlabs.io/pricing)
- Pacotes conferidos no npm: `@elevenlabs/agents-cli` 0.6.1, `@elevenlabs/cli` 1.6.1 (OpenAPI embutido), `@elevenlabs/react` 1.18.0, `@elevenlabs/client` 1.28.0, `@elevenlabs/elevenlabs-js` 2.73.0
- Documentação do eve em `node_modules/eve/docs` (0.80.1)
- Tempo de resposta a lead: [Exact Sales](https://exactsales.com.br/tempo-de-resposta/), [RD Station](https://www.rdstation.com/blog/vendas/primeiro-contato-com-lead/), [Rework](https://resources.rework.com/pt/libraries/lead-management/lead-response-time)
- Apresentação institucional da Paggo, agosto de 2026, e [paggo.com.br](https://www.paggo.com.br/)
