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
- [Interface](#interface)
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
| **Script próprio pela API REST, `scripts/voice-sync.mjs` (escolhido)** | Cria segredo, ferramentas e agente; acha tudo pelo nome e atualiza; o prompt fica num markdown legível | Código nosso para manter (um script curto) |
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

**Primeiro teste com microfone** (17/10, conversa `conv_3101...`, 3,4 min, lead fictício da Cyrela), medido pela API de conversas do ElevenLabs:

| O que | Resultado |
| --- | --- |
| Fluxo | Abertura, briefing usado ("vi que a Cyrela tem vários lançamentos"), cargo, horários, confirmação, reunião marcada, `end_call` |
| Demora até a voz (do silêncio do lead ao áudio) | 1,0 a 1,25 s na maioria das falas; 2,35 s na primeira, com o LLM frio (1,72 s até o primeiro token) |
| Ferramentas | `consultar_agenda` (0,53 s) e `marcar_reuniao` (0,23 s), as duas no Rastro com o id da conversa e o lead certo |
| Transcrição | "Sienge" ouvido como "Sunkia"; o LLM corrigiu sozinho |
| Custo | 2.452 créditos: 2.280 de voz e 172 de LLM (US$ 0,017). Na prática, crédito equivale a minuto |

O que errou e foi corrigido no prompt e na coleta: pulou da frase "não conheço, quero conhecer" direto para a reunião, sem dor nem decisão (agora oferece duas dores comuns para o lead escolher e pergunta quem decide antes de marcar); disse "entender como a Paggo pode se integrar com o Sienge", o que insinua uma integração que ninguém confirmou (agora ERP citado vira dúvida para o time); gravou o cargo do lead no campo `decisao` (descrições dos campos reescritas); as tags de emoção do modelo de voz (`[happy]`) apareciam na transcrição (agora são removidas antes de gravar).

Depois do teste, a voz pareceu lenta e alegre demais. Ajustes: `speed` 1,1 (o máximo é 1,2), `stability` de 0,5 para 0,65 (menos variação de emoção), `expressive_mode` desligado (é ele que leva o LLM a pôr tags como `[happy]`) e uma linha de tom no prompt: profissional e neutro, sem exclamação. A voz continua a mesma; trocar de voz fica para depois de ouvir o ajuste.

**Segundo teste** (conversa `conv_8301...`, 3,4 min, 2.371 créditos). A voz já soava mais rápida e contida, mas o texto ficou prolixo: quatro falas tiveram de 34 a 59 palavras, e a lead reclamou duas vezes ("essa pergunta foi muito longa", "consegue ser menos prolixo?"). Erros lidos na transcrição e o que mudou:

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

**Terceiro teste** (conversa `conv_5401...`, 4,3 min, 3.095 créditos). As falas ficaram curtas (11 a 22 palavras), e a abertura foi direto ao papel da pessoa. Problemas novos:

| Erro | Correção |
| --- | --- |
| Virou interrogatório: insistiu no impacto com uma pergunta abstrata ("quantas horas por dia ou por semana"), repetiu quando a lead não entendeu, perguntou "o que acontece se não concilia", e a lead reclamou ("quanta pergunta") | Uma seção de perguntas que rendem, uma por letra do SPICED, com régua no impacto; no máximo cinco perguntas de descoberta; quem não sabe ou não entende não ouve a pergunta de novo |
| A lead pediu duas vezes para conhecer a Paggo e não recebeu nada | "Dê antes de pedir": cada dor contada recebe uma frase de como a Paggo resolve antes da próxima pergunta; ao segundo pedido ou a uma reclamação, para a descoberta e oferece a reunião |
| A conciliação foi a dor escolhida, e o mapa de dores não tinha resposta para ela | Item novo no mapa, do deck: pagamentos e recebimentos passam pela conta Paggo e caem conciliados no extrato, integrado ao ERP |
| Um riso ("Rá!") fez ela parar e recomeçar a mesma frase duas vezes, pedindo desculpa | `turn.interruption_ignore_terms` com interjeições em português (aham, uhum, tá, rá, haha) e regra de não recomeçar a frase |
| Silêncio constrangedor no fim: 11,4 s depois do "não" para a pergunta "tem mais alguma dúvida?" e 5,9 s depois do "tchau" | Fecha numa fala só (dia, hora, convite por e-mail, "até mais") e chama `end_call` logo em seguida, sem perguntar nem esperar |
| Demora ainda perceptível (0,8 a 1,9 s; a fala já está na velocidade máxima, 1,2) | `turn.speculative_turn` ligado: o LLM começa a responder durante o silêncio, antes da certeza de fim de turno. A ansiedade do turno continua `normal`, porque o lead fala com pausas ("ééé") e `eager` cortaria a fala dele |

Sobra: o `gemini-2.5-flash` ainda escorrega no estilo (disse "Ótimo!", que está proibido, e voltou a listar módulos ao pedir desculpa). O próximo passo é medir 2 ou 3 LLMs mais fortes com o mesmo prompt, por texto, sem gastar os poucos minutos de voz da conta de teste.

**Comparação de LLMs por texto** (17/10, noite). Com uns 3 minutos de voz sobrando, a comparação foi por texto: o ElevenLabs roda a conversa inteira entre o agente publicado e um lead simulado por outro LLM.

| Opção | Por que sim | Por que não |
| --- | --- | --- |
| **`POST /v1/convai/agents/{id}/simulate-conversation` (escolhido)** | Uma chamada por conversa; não cria nada na conta; devolve transcrição, coleta e a demora do LLM em cada fala | Descontinuado, sai em 31/10/2026; não troca o LLM na chamada, então o script troca o LLM do agente antes de rodar |
| `/v1/convai/agent-testing/create` e `/run-tests` | Substituto oficial; aceita `agent_config_override` | Cria testes guardados na conta, um passo a mais por persona |
| Conversa de voz de verdade | Mede tudo, inclusive o áudio | Cerca de 700 créditos por minuto, e sobram uns 3 minutos |

Como foi medido (`scripts/voice-simulate.mjs`, personas em `voice/personas.mjs`): mesmo prompt, mesma persona (Marina, coordenadora financeira de uma incorporadora fictícia, que pergunta "o que é a Paggo?", cita o Sienge e pede a reunião antes de o agente perguntar quem decide), lead simulado sempre no `gemini-2.5-flash` com temperatura 0,5, e a agenda simulada (`tool_mock_config`) para não gravar nada em produção. Da transcrição saem: palavras por fala, palavras proibidas pelo prompt ("ótimo", "perfeito", "compreendo"), exclamações, lista de módulos (três ou mais numa fala), se perguntou quem decide antes de consultar a agenda, se fechou numa fala só com `end_call`, e o tempo do LLM até a primeira frase (`convai_llm_service_ttf_sentence`, o que a voz espera para começar). Como uma rodada não prova nada, cada modelo rodou pelo menos duas vezes. A transcrição junta os pedaços do texto com espaço duplo ("quem  mais  participa"), e a primeira versão das checagens não via a pergunta de decisão nesses casos; os números abaixo já foram recalculados com a versão corrigida sobre as transcrições salvas.

Custo: **0 crédito nas 20 simulações** (4.534 antes e depois); a conta grátis não cobra simulação. Para referência, a estimativa da própria plataforma por minuto de conversa real com este prompt (`/v1/convai/agent/{id}/llm-usage/calculate`): `gemini-2.5-flash` US$ 0,010, `gemini-3.5-flash` US$ 0,054, `claude-haiku-5-5` US$ 0,004, `gpt-5-mini` US$ 0,008.

Rodada 1, com o prompt do terceiro teste de voz:

| LLM (rodadas) | Palavras por fala (média) | Falas acima de 25 palavras | Proibidas | Listou módulos | Quem decide antes da agenda | Fechou numa fala com `end_call` | Até a primeira frase (mediana) | Falas acima de 2 s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `gemini-2.5-flash` (3) | 30 a 38 | 11 de 20 | 0 | 2 de 3 | 1 de 3 | 3 de 3 | 0,58 a 0,72 s | 0 de 20 |
| `gemini-3.5-flash`, raciocínio mínimo (2) | 31 a 34 | 7 de 10 | 0 | 0 de 2 | 1 de 2 | 0 de 2 (desligou mudo) | 0,96 a 1,01 s | 1 de 10 |
| `claude-haiku-5-5`, sem raciocínio (3) | 24 a 27 | 12 de 25 | 0 | 0 de 3 | 2 de 3 | 3 de 3 | 1,27 a 1,97 s | 8 de 25 |
| `gpt-5-mini`, raciocínio mínimo (2) | 30 a 34 | 11 de 16 | 1 ("perfeito") | 1 de 2 | 2 de 2 | 0 de 2 (marcou sem o lead confirmar e desligou mudo) | 0,81 a 0,89 s | 0 de 16 |

O "Gemini mais novo" foi o `gemini-3.5-flash` porque é o substituto que a plataforma indica para o `gemini-2.5-flash` (descontinuado em 30/11/2026) e o único Gemini novo com raciocínio "mínimo"; o `gemini-3.8-flash` não desce de "baixo".

O que a rodada mostrou: dois modelos chamaram `marcar_reuniao` e logo `end_call`, sem falar nada. A causa era a frase do prompt "logo depois dessa fala, use `end_call`", que um modelo mais obediente a ferramentas lê como "logo depois de marcar". Foi corrigida antes de decidir, para comparar modelos e não a frase: a despedida é falada primeiro, `end_call` nunca vem sem ela, e o exemplo de despedida perdeu a exclamação (os 3 "!" do Gemini e do Haiku eram cópia do exemplo). O `gpt-5-mini` saiu aqui: marcar sem o lead confirmar é o pior erro possível na agenda.

Rodada 2, com o fechamento corrigido:

| LLM (rodadas) | Palavras por fala (média) | Falas acima de 25 palavras | Proibidas | Listou módulos | Quem decide antes da agenda | Fechou numa fala com `end_call` | Até a primeira frase (mediana) | Falas acima de 2 s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `gemini-2.5-flash` (4) | 23 a 29 | 14 de 35 | 0 | 1 de 4 | 3 de 4 | 4 de 4 | 0,49 a 0,72 s | 0 de 35 |
| `gemini-3.5-flash` (2) | 25 a 31 | 7 de 11 | 0 | 0 de 2 | 2 de 2 | 0 de 2 (mudo uma vez; na outra esperou o "tchau") | 0,73 a 1,01 s | 0 de 11 |
| `claude-haiku-5-5` (4) | 23 a 31 | 19 de 39 | 0 | 0 de 4 | 3 de 4 | 4 de 4 | 1,18 a 2,01 s | 12 de 39 |

Regra de decisão: "soa como uma pessoa, sem demora para responder" é critério Alto, no mesmo nível do SPICED, e demora não se corrige no prompt. Então a demora é portão (fala acima de 2 s reprova) e o estilo desempata.

Escolhido: **manter o `gemini-2.5-flash` sem raciocínio**. Nenhuma das 55 falas chegou a 1,6 s até a primeira frase, e com o fechamento corrigido ele fechou certo em 4 de 4.

- `claude-haiku-5-5`: o melhor estilo (nunca listou módulos, a descoberta mais completa do SPICED; na pergunta de decisão empatou, 3 de 4), mas 31% das falas passaram de 2 s, com picos de 3,9 e 5,8 s logo depois da agenda e nas falas que juntam "como a Paggo resolve" com a próxima pergunta. Numa ligação isso é silêncio.
- `gemini-3.5-flash`: rápido, mas não fechou certo em nenhuma das 4 rodadas, e custa 5 vezes mais por minuto.
- `gpt-5-mini`: fora na rodada 1.

O que continua errado no `gemini-2.5-flash` e vai para as personas: 40% das falas passam de 25 palavras (o "dê antes de pedir" vira duas frases longas, com picos de 72), ainda listou módulos em 1 de 4, e disse "conheço o Sienge sim", que não está nos fatos. Cuidados: a demora medida é só a do LLM (a voz soma fala-para-texto e texto-para-fala, uns 0,3 a 0,5 s); o lead simulado às vezes vaza o raciocínio dele ("THOUGHT:") ou responde duas coisas de uma vez; e o `gemini-2.5-flash` sai em 30/11/2026, com a plataforma começando a desviar parte das chamadas para o `gemini-3.5-flash` perto de 1/11. Para a Paggo usar depois disso, o mesmo script roda a comparação de novo.

**Três personas por texto** (17/10, noite), todas no `gemini-2.5-flash`, com o mesmo script: 21 rodadas em quatro versões do prompt, 0 crédito.

| Persona | Armadilhas |
| --- | --- |
| Interessada: Marina, coordenadora financeira de uma incorporadora com 12 SPEs | Pergunta "o que é a Paggo?", cita o Sienge, pede a reunião antes de o agente perguntar quem decide |
| Cético com preço: Roberto, diretor financeiro de uma construtora, decide sozinho | Pergunta o preço logo e insiste numa faixa, "já tenho ERP", "resolvo na planilha", "me manda por e-mail"; só conta a dor e aceita reunião se a pergunta for boa |
| Pessoa errada: Juliana, do marketing | Não cuida do financeiro; passa o contato do gerente financeiro se pedirem |

O que errou na primeira volta e o que mudou:

| Erro | Correção |
| --- | --- |
| Prometeu o que o sistema não faz: "posso te enviar um material" (cético, 2 de 2) e "vou enviar um e-mail para o Paulo" (pessoa errada) | O agente não manda e-mail nem material: diz que o time manda ou entra em contato, e o pedido entra em `duvidas` |
| "Já tenho ERP": deu o fato e nunca perguntou o que falta (0 de 2) | O fato numa frase e a pergunta "o que o sistema de hoje não resolve?" |
| Marcou sem repetir o horário para o lead confirmar | `marcar_reuniao` só depois do sim à repetição de dia e hora |
| "Ótimo" e "!" na saudação e na despedida, puxados pelo "Oi, Marina!" fixo da abertura | Abertura sem exclamação; nunca "ótimo", nem para confirmar ("certo", "pronto"); nunca ponto de exclamação |
| Pulou o cargo e o impacto quando o lead abriu com preço | Responde a pergunta de abertura numa frase e pergunta o papel em seguida |
| Falas longas: o "dê antes de pedir" virava duas frases de 20 palavras cada | Um recurso só, com um exemplo de 18 palavras com recurso e pergunta |
| Esperou o "tchau" sem dizer "até mais" (pessoa errada) | Exemplo de despedida para a pessoa errada |
| Coleta: horário em formato ISO, `decisao` vazio quando o lead disse que decide sozinho, pedido de material sem registro | Descrições dos três campos reescritas |

A segunda volta trouxe duas falhas graves que não existiam: um `end_call` mudo no meio da conversa, logo depois de o cético contar a dor, e 14 perguntas sobre o material baixado para a pessoa do marketing, que o agente não reconheceu como pessoa errada. O padrão: o `gemini-2.5-flash` segue a regra quando ela está perto do momento de usar. As regras foram para o lugar da ação: quem decide no topo da seção Agenda, pessoa errada logo na primeira pergunta, `end_call` só depois de "até mais". Na terceira volta o cético não chegou à dor em nenhuma de 3 rodadas, porque o agente não usou o gancho do briefing ("como vocês aprovam os pagamentos de fornecedores"), e o prompt nunca mandava usar. Entrou a regra: a primeira pergunta de descoberta é o gancho ("usa o briefing" é critério Alto).

Última versão do prompt:

| Persona (rodadas) | Resultado | Palavras por fala (média) | Quem decide antes da agenda | Fechou numa fala com `end_call` | O que sobrou |
| --- | --- | --- | --- | --- | --- |
| Interessada (2) | Reunião marcada, 2 de 2 | 19 a 21 | 2 de 2 | 1 de 2 | Nunca perguntou o evento crítico: ela pede a reunião logo depois da dor, e o prompt prioriza a decisão |
| Cético (2) | Reunião marcada, 2 de 2, depois de achar a dor do pagamento duplicado | 27 a 31 | 1 de 1 (na outra ele disse antes que decide sozinho) | 1 de 2 | Falas longas quando ele junta três objeções numa fala só; "o valor é personalizado" sem fonte |
| Pessoa errada (3) | Indicou outra pessoa, 3 de 3, em 3 falas | 15 a 17 | Não se aplica | 3 de 3 | Numa rodada não pediu o e-mail do indicado, e a coleta não guardou o nome dele; um "ótimo" |

Nenhuma fala passou de 2 s nessas 7 rodadas, e nenhuma teve preço, integração ou envio prometido. O resto conhecido é o fechamento: em 2 de 7 o modelo terminou a despedida sem chamar `end_call` na mesma resposta e esperou o "tchau", o que na voz vira a espera de alguns segundos do terceiro teste. A simulação exagera um pouco (o lead simulado sempre ganha a vez depois de uma fala sem ferramenta), então isso se confere na próxima conversa de voz.

**Gênero da voz.** A voz escolhida ("Eduardo S. - Brazilian Clear & Pro", da biblioteca) é masculina, e o prompt falava no feminino ("a assistente virtual", "obrigada"). Opções: trocar por uma voz feminina ou passar o prompt para o masculino. Escolhido: o masculino, porque a voz já passou por 3 conversas reais e trocar pediria um teste de voz novo com poucos créditos. Mudaram o prompt, a primeira fala, o texto da home, o README e as objeções. Prova: as 3 personas, duas vezes cada, com 6 "obrigado" e nenhum feminino nas falas do agente; reunião marcada nas 4 de interessada e cético; fechamento numa fala só em 6 de 6. Numa rodada da pessoa errada a coleta marcou "não qualificado" em vez de "indicou outra pessoa"; a descrição do campo `resultado` passou a dizer quando usar cada valor, e mais 3 rodadas deram "indicou outra pessoa" nas 3.

**Quarto teste, com o prompt de agora e o webhook ligado** (17/10, noite, conversa `conv_6601...`, 4,5 min, 3.199 créditos). Primeira chamada de ponta a ponta: formulário, pesquisa com 4 ferramentas, conversa, `consultar_agenda` e `marcar_reuniao` no Rastro com o id da conversa, e o pós-chamada assinado gravando resultado, SPICED, horário, resumo e transcrição no painel. O lead foi o próprio desenvolvedor, no papel de responsável de tecnologia (não do financeiro) de uma consultoria que atende construtoras.

| O que | Resultado |
| --- | --- |
| Estilo | Tudo no masculino, falas de uma ou duas frases, sem "ótimo" nem exclamação |
| SPICED | As cinco letras na coleta, inclusive o evento crítico, que nas simulações não aparecia; perguntou quem decide antes da agenda |
| Condução | Quem não cuida do financeiro mas escolhe as ferramentas foi tratado como lead, não como pessoa errada: o agente perguntou o papel dele na decisão antes de seguir |
| Agenda | Dois horários, repetidos quando o lead pediu, e a reunião marcada só depois do "sim" |
| Fechamento | Despedida e `end_call` na mesma fala, sem esperar o "tchau" |
| Demora até o áudio, do fim do silêncio do lead (`convai_ttf_audio_since_silence`) | Mediana de 1,32 s e máximo de 2,1 s (logo depois da agenda e na despedida). O LLM responde em uns 0,6 s; o resto é a detecção do fim do turno, a voz e a rede |

Sobra só um detalhe: as horas saem em formatos diferentes ("dez da manhã" e "quatorze horas").

O aviso `error reading from signal stream` no console vem do `livekit-client`, a camada WebRTC do SDK, quando a conexão fecha; o overlay do Next em desenvolvimento mostra qualquer `console.error` como erro.

**A chave da Paggo.** Ao publicar na conta da Paggo, a chave que ela mandou respondeu 401 `missing_permissions` em agentes, ferramentas, segredos, vozes, modelos e no token da conversa; só lista webhooks. Para não confundir com uma chave restrita da conta de teste, foram três provas: o hash é diferente; as permissões são outras (a de teste acessa tudo); e um webhook temporário criado na conta de teste não apareceu para a chave da Paggo (apagado em seguida). Opções pesadas: pedir à Paggo que libere as permissões (sem custo); usar a conta de teste em produção, num plano pago que permite uso comercial; ou esperar. Escolhido: pedir a liberação e seguir no que não depende da voz em produção, com a conta de teste como plano B e prazo para decidir.

**Na conta da Paggo, depois da liberação** (19/10). Leituras primeiro: a chave passou a abrir agentes, ferramentas, segredos, vozes e webhooks, mas o `voice-sync.mjs` mostrou duas permissões de escrita faltando, `voices_write` (para trazer a voz Eduardo da biblioteca) e `webhooks_write` (para criar o pós-chamada). A conta da Paggo já tem 10 vozes profissionais brasileiras. Opções para a voz: pedir mais uma permissão e manter a Eduardo, já ouvida em 4 conversas; ou usar uma voz da própria conta. A Matheus, a mais calma e feita para conversa, foi recusada pelo ElevenLabs porque tem moderação ao vivo, que agentes não aceitam; a Samuel, também de conversa, foi aceita. Escolhido: publicar agora com a Samuel e sem o webhook, para a voz funcionar em produção, e rerodar o mesmo script quando a escrita de webhooks chegar. Prova: o token da conversa sai pela rota de produção com a chave e o agente da Paggo, e uma simulação por texto contra esse agente perguntou quem decide, marcou e fechou numa fala só.

## Interface

Base: os tokens que vieram com o case (`app/paggo.css`) e o deck institucional, lido nas páginas 1 e 18.

| Decisão | Alternativa | Por que esta |
| --- | --- | --- |
| "O orquestrador financeiro da construção" como linha de cima da home, onde estava "Fale com a Paggo" | Uma faixa escura de capa, como a página 1 do deck | É a frase de posicionamento do deck; numa linha só ela aparece sem empurrar o formulário para baixo |
| A chamada para a voz num bloco grafite, como o do último slide, com status e botão dentro | Botão solto embaixo do texto | O botão é o único passo que importa na tela; o bloco o separa do resto como o deck separa a chamada final |
| Escuro por padrão, com interruptor para o claro, e uma fonte só, sem monoespaçada (exceto o JSON cru do Rastro) | Seguir o tema do sistema; ou escuro fixo; e manter a IBM Plex Mono nos chips | O escuro é mais perto dos blocos do deck, e o claro fica a um clique; o bloco da voz é grafite nos dois temas, como no deck, que é claro com bloco escuro. A monoespaçada fica só onde o alinhamento do JSON ajuda a ler |
| O logo da Paggo no cabeçalho, copiado do SVG de paggo.com.br, com `currentColor` | Texto "Paggo"; dois arquivos de imagem, um por tema | O site da Paggo usa esse mesmo SVG, branco no contato (fundo escuro) e grafite em carreiras (fundo claro), sempre pela cor do texto; um arquivo só segue o tema sozinho. Conferido: os traços copiados são idênticos aos do site |
| Rastro: a linha quebra entre itens, nunca dentro de um link, e cada site aparece uma vez | Cortar a linha com reticências | No celular os links estouravam a tela e o mesmo domínio aparecia duas vezes (páginas diferentes do mesmo site) |

Prova: screenshots no navegador do dev local, home, espera e Rastro de um lead da Even, no desktop e a 375 px.

**Formulário** (19/10), depois de ler o formulário de contato da própria Paggo ([paggo.md](paggo.md#como-a-paggo-capta-leads-hoje)), que pede cargo, segmento, desafio principal e origem, e registra o aceite de dados.

| Decisão | Alternativa | Por que esta |
| --- | --- | --- |
| Cargo como lista, com as opções e o mapeamento de persona da Paggo (Decisor Financeiro, Influenciador Técnico, Usuário Principal, Decisor Não-Financeiro) | Cargo livre, descoberto pela busca e pela conversa | A voz deixa de gastar a primeira pergunta e já sabe se fala com quem decide; o painel usa o mesmo vocabulário do CRM da Paggo. A busca pela pessoa continua, para confirmar |
| Sem segmento nem desafio principal | Copiar o formulário inteiro da Paggo | Segmento sai do CNAE, e a dor é o que a conversa descobre; o case é justamente pesquisar em vez de perguntar |
| Aceite obrigatório, com a data e hora guardadas, e aviso de IA e de pesquisa em dados públicos | Só o texto da home | A Paggo pede o mesmo aceite; a pesquisa trata dado de uma pessoa, e o lead precisa saber que fala com IA |
| Campo escondido contra robôs | Captcha | Cada lead dispara uma pesquisa paga; o campo escondido não pede nada de quem é gente |

Prova: um envio com o campo escondido preenchido voltou para a home sem criar lead; um envio normal gravou o cargo e a data do aceite, e a pesquisa recebeu o cargo. O briefing tratou o cargo como dado do lead, não como fato provado ("não encontrado; o lead informou ser decisor financeiro"). Na voz, o agente continuou perguntando o cargo mesmo com a regra nova, porque um exemplo de fala boa no prompt era exatamente essa pergunta; com o exemplo dividido em "cargo informado" e "não informado", ele foi direto ao gancho ou à dor em 4 de 4 simulações contra o agente da Paggo, e todas marcaram reunião.

## Agenda

Enquanto o endpoint real não existia, uma agenda falsa atendeu pela mesma interface (`lib/agenda.ts`), e a troca é feita por duas variáveis de ambiente, `AGENDA_URL` e `AGENDA_TOKEN`. Regras nossas: próximos 5 dias úteis, nada começando na próxima hora, até 4 opções, das quais o agente oferece duas.

O endpoint real chegou em 19/10: base `https://sales.paggo.io/api/case/agenda`, com `GET /disponibilidade?de=&ate=` e `POST /reunioes` (`inicio`, `nome`, `email`; 409 se o horário foi ocupado), autenticado com `Authorization: Bearer`. A única mudança no código foi usar a base exatamente como a Paggo a entrega. Prova: sem token as rotas respondem 401 e 405 (existem); com o token, a disponibilidade respondeu `{ fuso, livres: [{ inicio, fim }] }`, o formato que o cliente já lia, aceitou as datas ISO com fuso que mandamos e trouxe 81 horários nos próximos 7 dias; depois do deploy, a rota de produção que o agente de voz chama devolveu horários do mesmo dia, que a agenda falsa nunca daria, e a chamada ficou no Rastro do lead de teste. Marcação provada no mesmo dia, pelas rotas de produção, com o lead da conversa de prova: `marcar_reuniao` reservou o primeiro horário oferecido; a segunda tentativa no mesmo horário recebeu o 409 da Paggo e virou a frase "esse horário acabou de ser ocupado", que faz o agente oferecer outro; e o horário saiu da disponibilidade. As 4 chamadas estão no Rastro do lead.

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
