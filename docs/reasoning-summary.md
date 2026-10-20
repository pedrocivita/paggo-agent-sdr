# Raciocínio, em resumo

O documento curto que o case pede: para cada parte construída, o problema, a escolha, por que não as outras e a prova. Cada medição, com as tabelas completas, está no diário ([reasoning.md](reasoning.md)); a versão de uma linha de cada decisão está em [DECISIONS.md](../DECISIONS.md).

**O fluxo:** o lead preenche o formulário; um agente pesquisa a pessoa e a empresa e escreve um briefing com a fonte de cada fato; um assistente de voz conversa com o lead no site, qualifica pelo SPICED e marca a reunião na agenda da Paggo; o painel interno mostra formulário, pesquisa, conversa e o rastro de cada ferramenta.

**O método:** cada peça serve a um critério Crítico ou Alto do case ([case.md](case.md#como-a-banca-avalia)); primeiro o caminho mais simples de ponta a ponta, depois o refinamento; nada é "pronto" sem prova ao vivo.

## Índice

- [Uma aplicação só](#uma-aplicação-só)
- [Formulário](#formulário)
- [Pesquisa](#pesquisa)
- [Briefing correto](#briefing-correto)
- [Rastro](#rastro)
- [Voz](#voz)
- [Agenda](#agenda)
- [Saída estruturada](#saída-estruturada)
- [Qualificação e objeções](#qualificação-e-objeções)
- [Dados pessoais](#dados-pessoais)
- [Como foi testado](#como-foi-testado)
- [O que não está resolvido](#o-que-não-está-resolvido)

## Uma aplicação só

- **Escolha:** um app Next.js no Vercel com formulário, painel, agente de pesquisa e webhooks; Postgres (Neon) com duas tabelas, `leads` e `events`.
- **Por que não as outras:** dois serviços dobrariam deploy e segredos sem ganho visível para a banca; uma terceira tabela não se pagaria, porque o lead guarda formulário, briefing e conversa como JSON.
- **Prova:** produção no ar desde 16/10, com deploy a cada push.

## Formulário

- **Escolha:** nome completo, e-mail de trabalho, telefone, empresa, cargo na lista do formulário da própria Paggo (cada cargo vira a persona do comitê de compra que o CRM dela usa), campo livre, aceite obrigatório com aviso de IA e um campo escondido contra robôs. A origem do lead (UTM e site de origem) vai em campos escondidos.
- **Por que não as outras:** segmento e dor ficam de fora porque a pesquisa e a conversa descobrem; captcha pediria algo de quem é gente; nome e sobrenome separados não cabem bem em nomes brasileiros. A origem não é critério do case: serve à vaga (custo por lead de cada canal).
- **Prova:** envio com o campo escondido não cria lead; lead de teste em produção gravou cargo, aceite e as três UTM.

## Pesquisa

- **Escolha:** um agente [eve](https://github.com/vercel/eve) com Claude Sonnet 5.5 e três ferramentas: `fetch_site` (o site do domínio do e-mail), `lookup_cnpj` (a Receita pela BrasilAPI) e `web_search` (Exa). A ordem está nas instruções: site, pessoa e, com e-mail pessoal, o CNPJ em paralelo; depois a Receita e as SPEs do grupo.
- **Por que não as outras:** eve é o formato que o time da Paggo usa; o AI Gateway exigia crédito pago para esse modelo; o Haiku 5.5 custa um décimo, mas no mesmo lead foi mais lento (36 s contra 25 s) e mais fraco no juízo; a busca embutida do modelo esconderia as consultas do rastro.
- **Prova:** 6 casos difíceis com pessoas fictícias (homônimo, e-mail pessoal, site sem CNPJ, empresa estrangeira, a própria Paggo): CNPJ certo em todos, média de 22,8 s e máximo de 33,3 s por briefing, cerca de US$ 0,06 cada ([research-cases.md](research-cases.md)).

## Briefing correto

- **Escolha:** cada fato tem fonte ou sai "não encontrado"; todo CNPJ passa pela Receita; CNPJ cujo nome não bate com a empresa do formulário vira possível homônimo; nenhum dado pessoal de sócio; nada sobre preço, que nem o deck nem o site da Paggo dizem.
- **Por que não as outras:** aceitar sites agregadores de CNPJ perdia o regime tributário, que mexe no fit; deixar o modelo "completar" a regra de preço pôs no briefing uma informação que ninguém deu.
- **Prova:** o eval (abaixo) confere CNPJ, fit, ferramentas chamadas, ausência de nome de sócio e de regra de preço.

## Rastro

- **Escolha:** toda ferramenta, da pesquisa e da voz, roda dentro de `traced()`: uma linha por chamada com entrada, saída, URLs, tempo e erro, ligada ao lead.
- **Por que não as outras:** registrar ferramenta por ferramenta depende de lembrar; uma regra só cobre as duas pontas.
- **Prova:** a aba Rastro de cada lead de produção, inclusive a consulta e a marcação feitas pela voz.

## Voz

- **Escolha:** ElevenLabs Agents, conversa no próprio site, `gemini-2.5-flash` sem raciocínio, voz brasileira da conta da Paggo. O agente se apresenta como assistente virtual e diz que é IA. O prompt e a configuração ficam em `voice/` e são publicados por um script, para a banca ler o agente no repo.
- **Por que não as outras:** montar fala-para-texto, LLM e voz à mão gastaria o tempo em encanamento; telefone ou WhatsApp pedem número e aprovação, e o case diz que o canal importa menos. Entre 4 LLMs em 20 simulações, o `claude-haiku-5-5` teve o melhor estilo, mas 31% das falas acima de 2 s; demora é critério Alto e não se corrige no prompt.
- **Prova:** duas conversas em produção na conta da Paggo, de ponta a ponta; na última, mediana de 1,25 s do fim da fala do lead até o áudio.

## Agenda

- **Escolha:** a agenda real da Paggo atrás de uma interface, com uma falsa no lugar enquanto ela não existia. A consulta devolve até dois horários de manhã e dois de tarde por dia útil; a rota de marcação só aceita um horário livre dessa janela.
- **Por que não as outras:** na primeira conversa em produção o agente inventou um horário quando o lead pediu outro dia; uma lista para escolher tira a necessidade de inventar, e a trava no código não depende do modelo. Sem parâmetro de data, porque o modelo erraria a conta de "quarta que vem".
- **Prova:** consulta, marcação, 409 e recusa de horário fora da janela pelas rotas de produção; reunião marcada pela voz na segunda conversa.

## Saída estruturada

- **Escolha:** o webhook pós-chamada do ElevenLabs, assinado com HMAC, grava transcrição, resumo e 10 campos: as 5 letras do SPICED, resultado, horário, objeções, dados corrigidos e o que ficou para o time.
- **Por que não as outras:** buscar a conversa pela API depois da chamada seria um caminho a mais; o SDK para conferir a assinatura seria uma dependência a mais para 15 linhas.
- **Prova:** as abas Conversa estruturada e Transcrição das conversas de produção; a rota recusa chamada sem assinatura.

## Qualificação e objeções

- **Escolha:** o SPICED como checklist, não roteiro: começa pelo gancho do briefing, pergunta só o que falta, no máximo cinco perguntas, e sempre quem decide antes da agenda. O fit fica no painel para o time filtrar; a voz não encerra uma conversa por achar que a empresa não tem o perfil. O agente não promete o que o sistema não faz: nada de convite ou material, só "deixo anotado para o time". Regras em [business-rules.md](business-rules.md), objeções em [objections.md](objections.md).
- **Por que não as outras:** passar o fit para a voz arriscaria encerrar uma conversa boa por um fit errado da pesquisa; prometer convite ou material seria falso, porque nada os envia.
- **Prova:** as personas por texto (abaixo) e as conversas de produção.

## Dados pessoais

- **Escolha:** aceite obrigatório no formulário, com data e hora guardadas (consentimento, LGPD, art. 7º, I); só informação pública da empresa; nada de CPF, idade ou dado pessoal de sócios, nem no briefing nem na fala; o CPF que aparece na razão social de MEI é removido.
- **Prova:** o eval confere que nenhum nome de sócio pessoa física aparece no briefing.

## Como foi testado

O prompt foi tratado como uma página de conversão: muda, mede, decide.

- **Pesquisa:** um eval do eve com 7 casos difíceis, ferramentas reais e checagens fixas, sem LLM como juiz (`npm run eval`, cerca de US$ 0,45). Um caso novo entra quando aparece um erro novo: o sétimo, um lead que pergunta o preço, entrou quando um briefing de produção inventou como a Paggo cobra.
- **Voz:** conversas simuladas por texto contra o agente publicado, com 4 personas (interessada, cético com preço, pessoa errada, lead que deixa o agente conduzir) e checagens na transcrição: tamanho das falas, palavras proibidas, decisão antes da agenda, horário da lista, despedida antes de desligar, promessa de envio, abertura que lê o formulário. Cada erro achado numa conversa real virou uma checagem.
- **Ao vivo:** 4 conversas com microfone na conta de teste e 2 na conta da Paggo, lidas no rastro e na API de conversas do ElevenLabs.

## O que não está resolvido

- O agente quase nunca pergunta o evento crítico, ainda escorrega em falas longas e, em cerca de 1 de cada 15 simulações, pula a pergunta de decisão ou desliga sem falar.
- A pesquisa oscila no caso de e-mail pessoal (às vezes pula a busca de SPEs); a busca pelo cargo só foi testada com nomes fictícios.
- O `gemini-2.5-flash` sai em 30/11/2026: a comparação de LLMs precisa rodar de novo.

**O que eu faria com mais tempo:** telefone e WhatsApp com o mesmo agente; integração com o CRM da Paggo, que passa a mandar convite e retorno ao lead; o fit chegando à voz com uma regra própria; os testes de prompt rodando sozinhos a cada mudança; monitoramento de custo e de demora por conversa; "como conheceu a Paggo" ao lado da origem medida.
