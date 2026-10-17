# Casos difíceis da pesquisa

Relatório do Marco 2: a pesquisa do agente rodada em empresas reais com dados de pessoa fictícios, lida contra o rastro, corrigida e rodada de novo. Diz o que foi pesquisado, por que cada caso foi escolhido, o que o agente escolheu ou descartou e por quê. Rodado em 17/10/2026, local (`next dev`), com o Claude Sonnet 5.5.

## Índice

- [Método](#método)
- [Por que estes casos](#por-que-estes-casos)
- [Rodada 1: instruções originais](#rodada-1-instruções-originais)
- [Caso a caso](#caso-a-caso)
- [O que se repetiu](#o-que-se-repetiu)
- [Velocidade: quanto tempo o lead aceita esperar](#velocidade-quanto-tempo-o-lead-aceita-esperar)
- [O que mudou](#o-que-mudou)
- [Rodada 2: depois das mudanças](#rodada-2-depois-das-mudanças)
- [Eval: os 6 casos a cada mudança](#eval-os-6-casos-a-cada-mudança)
- [O que continua fraco](#o-que-continua-fraco)

## Método

- Cada caso entrou pelo formulário em `/`, como um lead de verdade. Pessoa fictícia ("Ana Teste", "Bruno Teste" e similares), telefone falso, empresa e domínio reais.
- Tempo até o briefing: do `created_at` do lead até o evento `session.waiting` do stream do eve (`/eve/v1/session/:id/stream?follow=false`). Tokens: `data.usage` desse mesmo evento. Chamadas de ferramenta: tabela `events`.
- Correção: cada fato do briefing foi procurado no texto que as ferramentas devolveram (coluna `output` de `events`). Fato que não aparece em nenhuma saída conta como inventado.
- Custo aproximado pelos preços do Sonnet 5.5 (US$ 2 por milhão de tokens de entrada, US$ 10 de saída; cache escrito a 1,25x e lido a 0,1x da entrada).
- Antes de rodar o agente, os sites candidatos foram lidos com o próprio `readSite` e os CNPJs achados conferidos na BrasilAPI, sem gastar modelo. Foi assim que as armadilhas abaixo apareceram.

## Por que estes casos

| Caso | Empresa | Por que foi escolhida |
| --- | --- | --- |
| 1. Incorporadora com muitas SPEs | Even (even.com.br) | Companhia aberta com dezenas de empreendimentos. Armadilha real: o único CNPJ do site é da Evenmob, a corretora do grupo (CNAE 6821-8/01), não da incorporadora |
| 2. Homônimo | Tenda (tenda.com) | "Tenda" é tanto a Construtora Tenda quanto a rede Tenda Atacado. O site responde 403 a robôs, então o agente precisa achar a empresa pela busca |
| 3. E-mail pessoal | Cury Construtora (gmail) | Sem domínio para ler; "Cury" é sobrenome comum. Testa a busca pelo nome e a confiança menor que as regras pedem |
| 4. Site sem CNPJ | Pacaembu Construtora (pacaembu.com) | O site lê bem, mas não mostra CNPJ; "Pacaembu" é nome de bairro e de muitas empresas |
| 5. Empresa estrangeira | Lennar (lennar.com) | Construtora americana. Existe uma "Lennar Empreendimentos Imobiliários" em Santa Catarina, sem ligação |
| 6. Bônus: a própria Paggo | Paggo (paggo.com.br) | É o que a banca provavelmente digita. O site mostra um MEI inapto de Belo Horizonte (um número de exemplo da tela de demonstração que existe de verdade) ao lado do CNPJ da Paggo |

Ficaram de fora: Helbor e Cyrela (site com CNPJ certo, caso fácil e já coberto no Marco 1), MRV e Mitre (o site não abriu para o `fetch`, mesmo efeito do caso Tenda).

## Rodada 1: instruções originais

| Caso | Tempo | Ferramentas | Tokens entrada / saída | Custo | CNPJ | Fit | O que errou |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Even | 30,8 s | site, Receita, busca, Receita | 64,0 mil / 2,5 mil | US$ 0,087 | Certo (descartou a Evenmob) | alto | Não buscou SPEs nem cargo; deduziu atuação em RJ, MG e RS de um menu do formulário do site |
| Tenda | 24,1 s | site (vazio), busca, Receita | 37,2 mil / 2,4 mil | US$ 0,045 | Certo (a B3 liga tenda.com ao CNPJ) | alto | Não buscou SPEs nem cargo |
| Cury (gmail) | 23,1 s | busca | 18,2 mil / 2,4 mil | US$ 0,039 | Certo, mas sem passar pela Receita | alto | Pulou o `lookup_cnpj`: dados cadastrais vieram de sites de terceiros e o regime tributário ficou sem resposta |
| Pacaembu | 28,2 s | site, busca, Receita | 55,1 mil / 2,1 mil | US$ 0,060 | Certo (Bauru, bate com o site) | alto | Deduziu estados de uma lista de cidades; "casas populares" onde o site diz "casas" |
| Lennar | 22,7 s | site (vazio), busca | 25,1 mil / 1,7 mil | US$ 0,034 | Nenhum, certo (descartou o homônimo de SC) | baixo | Deduziu "Miami" do DDD do telefone que o próprio lead digitou |
| Paggo | 13,9 s | site, Receita | 28,2 mil / 1,5 mil | US$ 0,031 | Certo (ignorou o MEI) | baixo | Abertura sugerida pergunta se o cadastro "foi um teste nosso": com a banca usando o e-mail da Paggo, a conversa desanda |

Total da rodada: cerca de US$ 0,30 em modelo e 5 buscas na Exa.

Nenhum CNPJ errado e nenhum fato sem rastro: tudo o que o briefing afirma aparece em alguma saída de ferramenta. Os erros são de três tipos: ferramenta pulada, dedução apresentada como fato e um `forAgent` que não ajuda a voz.

## Caso a caso

### 1. Even

- Pesquisado: site (home, fale conosco, sobre), Receita do CNPJ do site, busca "Even Construtora e Incorporadora S.A. CNPJ", Receita do CNPJ achado.
- Escolhido: 43.470.988/0001-65, Even Construtora e Incorporadora S/A, CNAE 4120-4/00, Lucro Real 2024. Por quê: a razão social bate com o formulário e a busca trouxe a página da B3 (EVEN3).
- Descartado: 09.285.569/0001-15, a Evenmob. Por quê: o próprio agente notou que é corretora (CNAE 6821-8/01) e a citou só como empresa do grupo.
- Ficou de fora: SPEs ("não foram listadas") e cargo da pessoa, porque nenhuma busca foi feita para isso.
- Dedução indevida: "atuação no RJ, MG e RS" saiu do menu de estados do formulário de contato, não de uma frase do site.

### 2. Tenda

- Pesquisado: site (403, voltou vazio), busca "Construtora Tenda S.A. CNPJ", Receita.
- Escolhido: 71.476.527/0001-35, Construtora Tenda S/A. Por quê: a página da B3 lista o site www.tenda.com junto do CNPJ, então o domínio do e-mail fica ligado à empresa por uma fonte, não só pelo nome.
- Descartado: nada; a Tenda Atacado não apareceu porque a busca já foi feita com "Construtora".
- Ficou de fora: SPEs ("não pesquisado em detalhe") e cargo.

### 3. Cury, com e-mail pessoal

- Pesquisado: só a busca "Cury Construtora e Incorporadora S.A. CNPJ".
- Escolhido: 08.797.760/0001-83 com confiança média, como as regras pedem para e-mail pessoal.
- Erro: o `lookup_cnpj` não foi chamado. Razão social, endereço, capital e "não optante pelo Simples" vieram de agregadores (procuracnpj, raizlegal, Serasa). Os dados batem com a Receita, mas o regime tributário (Lucro Real, que sobe o fit) ficou "não confirmado", e o próprio `forAgent` gastou uma linha avisando que a Receita não foi consultada.
- Ficou de fora: SPEs e cargo.

### 4. Pacaembu, site sem CNPJ

- Pesquisado: site (home e contato, sem CNPJ), busca "Pacaembu Construtora CNPJ razão social", Receita.
- Escolhido: 96.298.013/0001-68, Pacaembu Construtora S.A., Bauru/SP. Por quê: a cidade da Receita bate com a sede do site; os cinco resultados da busca apontavam o mesmo CNPJ.
- Ficou de fora: SPEs. O agente escreveu, com razão, "não afirme que existem SPEs".
- Dedução indevida: estados (SP, PR, MT, MS, GO, MG) deduzidos da lista de cidades do site; "casas populares" onde o site diz "casas".

### 5. Lennar, estrangeira

- Pesquisado: site (bloqueado, vazio), busca "Lennar CNPJ Brasil".
- Escolhido: nenhum CNPJ; fit baixo por estar fora do Brasil, como manda a regra.
- Descartado: 18.100.707/0001-35, Lennar Empreendimentos Imobiliários e Aluguéis, Curitibanos/SC. Por quê: nome igual, sem nenhuma ligação com a americana. Foi o melhor julgamento da rodada.
- Dedução indevida: "Miami/Flórida" a partir do DDD 305 do telefone que o lead digitou.

### 6. Paggo

- Pesquisado: site (home e contato), Receita.
- Escolhido: 47.883.739/0001-52, Paggo Tecnologia Ltda. Descartado em silêncio: o MEI inapto de BH que o site mostra.
- Erro: fit baixo e abertura "queria entender se foi um teste nosso". Se a banca preencher com o próprio e-mail e fizer o papel de cliente, a voz começa desconfiando e pode encerrar como não qualificado.
- Achado no código: na home da Paggo o CNPJ real fica no caractere 16.002 do texto e o `readSite` só procurava CNPJ nos primeiros 6.000. Ele só foi achado porque a página de contato também o mostra. Na Cyrela, os três CNPJs do rodapé ficam depois do caractere 9.000 e eram perdidos.

## O que se repetiu

- **Cargo do lead nunca buscado (6 de 6).** Com nome fictício a busca não acharia nada, mas o agente também não tentaria com um nome real: as instruções deixam a busca "só para o que faltar" e o Sonnet sempre considerou que já bastava.
- **SPEs nunca buscadas (4 de 4 incorporadoras).** O fit já sai alto pelo CNAE, então o agente para. A voz perde o dado que mais abre a conversa ("quantas SPEs vocês têm hoje?") e a dica de módulo.
- **Dedução como fato.** Menu de formulário, lista de cidades e telefone do lead viraram localização com confiança alta ou sem fonte.
- **`forAgent` com ruído.** CNPJ, aviso de que a Receita não foi consultada, "ele não está no quadro de diretores": nada disso ajuda a voz a conversar.

## Velocidade: quanto tempo o lead aceita esperar

Três leituras sobre tempo de resposta a lead: [Exact Sales](https://exactsales.com.br/tempo-de-resposta/), [RD Station](https://www.rdstation.com/blog/vendas/primeiro-contato-com-lead/) e [Rework](https://resources.rework.com/pt/libraries/lead-management/lead-response-time). O que elas dizem e o que muda aqui:

- A referência do mercado é falar com o lead em até 5 minutos depois do formulário. A Rework cita o estudo do MIT com a InsideSales (5 minutos contra 30) e o da Harvard Business Review com 2,24 milhões de leads; a Exact Sales fala em chance até 100 vezes maior de fechar ligando nesses 5 minutos. Aqui o lead clica e fala na hora, e a pesquisa leva de 14 a 31 s. O tempo da pesquisa não é o gargalo enquanto ficar bem abaixo de um minuto.
- As três insistem que rapidez sem relevância não basta: o vendedor chega sabendo o segmento, o cargo e o poder de decisão do lead. Era exatamente o que faltava nos briefings (cargo e SPEs).
- Decisão: vale gastar alguns segundos a mais em uma busca pela pessoa e uma pelas SPEs, desde que rodem em paralelo e o briefing continue abaixo de 45 s. A tela de espera já faz a "confirmação instantânea" que a Rework recomenda.

## O que mudou

No código (`lib/site.ts`, com teste em `lib/site.test.ts`):

- O CNPJ agora é procurado na página inteira; o agente continua recebendo só os primeiros 6.000 caracteres de texto. Antes, um rodapé depois desse ponto sumia (Cyrela, home da Paggo).

Nas instruções (`agent/instructions.md`):

| Mudança | Erro que corrige |
| --- | --- |
| Primeira rodada em paralelo: site, busca pela pessoa e, com e-mail pessoal, busca do CNPJ | Cargo nunca buscado; a busca extra não pode custar tempo |
| Todo CNPJ passa por `lookup_cnpj`; agregadores só servem para achar o número | Cury sem Receita e sem regime tributário |
| Uma busca de SPEs para construtora, incorporadora ou holding, mesmo com fit alto, no formato "<grupo> SPE Empreendimentos Imobiliários Ltda CNPJ" | SPEs nunca buscadas. O formato veio de um teste direto na Exa: "<razão social> SPE" trazia páginas genéricas, este traz SPEs pelo nome |
| SPE só conta se a fonte mostra a empresa como sócia ou se o nome tem o do grupo; cita até 3, "pelo menos N" | A busca também traz SPEs homônimas de outros grupos |
| Fato só com fonte que o diga; nada deduzido de menus, listas ou do telefone do lead | Estados da Even e da Pacaembu, "Miami" da Lennar |
| Site que não abre: ligação domínio e empresa só com fonte que cite o domínio | Tenda sem site (a B3 resolveu) |
| Domínio sem .br e sem CNPJ: busca em inglês pelo domínio | Lennar ficou "desconhecido" sem fonte de que é americana |
| Nome de sócio nunca entra, nem de empresa descartada | Lennar citou a família sócia da homônima de SC |
| E-mail @paggo.com.br: pesquisa a Paggo normalmente, fit "desconhecido", voz conduz como lead normal | Paggo com fit baixo e abertura "foi um teste nosso?" |
| `forAgent` em 5 partes, com 1 ou 2 módulos prováveis pela tabela de sinais (de [paggo.md](paggo.md)); fora dele CNPJ, URL, sócios e notas da pesquisa | Linhas que não ajudavam a voz; a voz não tinha dica de qual módulo citar depois da dor |

As instruções explicam o porquê de cada passo novo ("a voz usa as SPEs para abrir a conversa"). Sem o motivo, o Sonnet pulou a busca de SPEs numa das rodadas da Even porque o fit já estava alto.

## Rodada 2: depois das mudanças

Versão final das instruções. Em Even e Cury o nome é fictício mas realista (sem "Teste"), para a busca pela pessoa rodar.

| Caso | Tempo | Ferramentas | Tokens entrada / saída | Custo | O que ficou melhor | O que ainda errou |
| --- | --- | --- | --- | --- | --- | --- |
| Even | 24,3 s | 3 buscas (pessoa, SPEs, CNPJ), site, 3 Receitas | 89,9 mil / 2,4 mil | US$ 0,102 | SPE Even-SP 39/10 achada e provada na Receita (a Even está no quadro); pessoa buscada e não achada, sem inventar; módulos Tesouraria/Controladoria e Contas a receber | Nada relevante |
| Tenda | 17,8 s | site, 1 busca (CNPJ e SPEs juntos), Receita | 35,9 mil / 2,0 mil | US$ 0,041 | 3 SPEs nomeadas com a Construtora como sócia (Jusbrasil); módulos Tesouraria/Controladoria e Contas a receber (Minha Casa Minha Vida) | SPEs não conferidas na Receita (dito no briefing, confiança média) |
| Cury (gmail) | 33,3 s | 3 buscas (CNPJ, pessoa, SPEs), 2 Receitas | 69,1 mil / 2,5 mil | US$ 0,072 | Passa pela Receita: Lucro Real achado; rejeitou 4 perfis de outras "Julianas" no LinkedIn; Cury Empreendimentos Imobiliários com os mesmos administradores | Nenhuma SPE com o nome Cury |
| Pacaembu | 22,4 s | site, 1 busca (SPEs), 2 Receitas | 47,3 mil / 2,2 mil | US$ 0,059 | SPE Pacaembu RP achada, com aviso de que está baixada desde 2016 | "Companhia aberta" sem fonte (deduzido do título de um prospecto de IPO) |
| Lennar | 18,7 s | site, 1 busca em inglês | 20,6 mil / 1,6 mil | US$ 0,036 | Fit baixo com fonte: sede em Miami pela página de investidores, receita e entregas pela Wikipedia | Não procurou subsidiária brasileira |
| Paggo | 20,3 s | site, 1 busca, Receita | 42,3 mil / 1,6 mil | US$ 0,052 | Fit "desconhecido" e "conduza como lead normal"; o site agora devolve o CNPJ real já na home | Busca "Paggo CNPJ" sobrando: o site já tinha o número |

Média: 23,8 s na rodada 1 e 22,8 s na rodada 2, máximo de 33,3 s (meta: 45 s). Custo médio por briefing: de US$ 0,049 para US$ 0,060. As buscas extras não custaram tempo porque rodam junto com o site e com a Receita, e as respostas repetidas da Exa voltam do cache em menos de 300 ms.

Rodadas intermediárias, que levaram às últimas mudanças:

- Even com a primeira versão da busca de SPEs (30,7 s): consulta "<razão social> SPE" não trouxe nenhuma SPE.
- Even de novo (22,4 s): o Sonnet pulou a busca de SPEs. Entrou o porquê no passo 4.
- Lennar (15,1 s): fit "desconhecido" e sobrenome dos sócios da homônima. Entraram a busca em inglês e a regra dos sócios.
- Paggo (6,4 s): nenhuma ferramenta chamada, rastro vazio. A regra passou a mandar pesquisar a Paggo normalmente.

Custo total do Marco 2: cerca de US$ 0,95 em modelo e umas 30 buscas na Exa.

## Eval: os 6 casos a cada mudança

Os mesmos 6 casos viraram um eval do eve em `evals/research/hard-cases.eval.ts`, para rodar de novo sempre que `agent/instructions.md`, uma ferramenta ou o modelo mudar:

```bash
npm run eval
```

O eval manda ao agente a mesma mensagem e o mesmo `BriefingSchema` que o app (`researchMessage` em `lib/research.ts`), com ferramentas de verdade: sites, Receita e Exa. Por isso confere fatos e comportamento, não texto. Cada checagem nasceu de um erro desta página:

| Checagem | Severidade | Erro da rodada 1 que ela pega |
| --- | --- | --- |
| Primeiro CNPJ citado é o da empresa (Even, Tenda, Cury, Pacaembu, Paggo) | gate | Evenmob no lugar da Even, Tenda Atacado, MEI de BH na Paggo |
| `lookup_cnpj` chamado com esse CNPJ | gate | Cury sem Receita |
| Fit esperado (alto, baixo na Lennar, desconhecido na Paggo) | gate | Paggo com fit baixo |
| Nenhum nome de sócio pessoa física, dos quadros que o `lookup_cnpj` trouxe | gate | Regra de dados pessoais. Não pega o caso da Lennar: aquele sobrenome veio de uma busca, não da Receita |
| `forAgent` com "Módulos prováveis" | gate | Regra nova do Marco 2 |
| Busca de SPEs nas 4 incorporadoras | gate | SPEs nunca buscadas |
| Busca pela pessoa com nome realista (Even, Cury) | gate | Cargo nunca buscado |
| Briefing em menos de 45 s | gate | Meta de velocidade |
| Caso a caso: Cury sem `fetch_site` e sem confiança alta; Pacaembu em Bauru; Lennar sem CNPJ escolhido; Paggo com "lead normal" | gate | Regras de e-mail pessoal, homônimo, estrangeira e Paggo |
| Todo CNPJ citado passou pelo `lookup_cnpj` | soft, meta 100% | Dados cadastrais vindos de agregador |

Primeira rodada completa, 17/10/2026, 3 casos em paralelo: **6 de 6 passaram, 57 de 57 gates**, CNPJs citados 100% conferidos na Receita.

| Caso | Tempo | Ferramentas | Tokens entrada / saída |
| --- | --- | --- | --- |
| Even | 32,6 s | 7 | 83,0 mil / 2,4 mil |
| Tenda | 30,1 s | 6 | 54,2 mil / 2,4 mil |
| Cury (gmail) | 28,3 s | 6 | 63,6 mil / 2,4 mil |
| Pacaembu | 33,2 s | 4 | 47,8 mil / 2,6 mil |
| Lennar | 11,7 s | 2 | 17,0 mil / 1,5 mil |
| Paggo | 12,0 s | 3 | 36,9 mil / 1,5 mil |

Custo da rodada: cerca de US$ 0,39, em 1 minuto. Os detalhes de cada execução (eventos, asserções, `t.log`) ficam em `.eve/evals/<data>/`, fora do git.

Cuidados:

- Roda contra o mundo real: um site que muda ou a BrasilAPI fora do ar derrubam um caso sem que o agente tenha piorado. Antes de mexer nas instruções por causa de uma falha, olhe o evento da ferramenta no artefato.
- As ferramentas gravam no Neon compartilhado com produção pelo `traced()`: cada rodada deixa uma linha por chamada de ferramenta (28 na primeira) em `events`, sem `lead_id`, que o painel não mostra.
- O tempo medido inclui a concorrência de 3 casos por vez; rodando um só, cai uns segundos.

## O que continua fraco

- **Variação entre rodadas.** O mesmo lead da Even rodou 3 vezes com 3 caminhos diferentes. O eval acima não elimina a variação, mas mostra se ela quebra algo que importa; vale rodá-lo 2 ou 3 vezes antes de mudar uma regra.
- **Cargo de pessoa real não provado.** Todos os nomes são fictícios: está provado que o agente busca e rejeita homônimos (Cury), não que acha o cargo de alguém real. Teste pendente com uma pessoa real que autorize.
- **Pequenas deduções ainda passam.** "Companhia aberta" da Pacaembu, e às vezes a fonte de um fato aponta para a Receita quando o dado veio do site (escritórios da Pacaembu).
- **SPEs vêm de agregadores.** Só a da Even foi conferida na Receita; a BrasilAPI não lista as empresas de que um CNPJ é sócio, então o total de SPEs fica sempre "pelo menos N".
- **Sites que bloqueiam robôs** (Tenda, Lennar, MRV) dependem da busca para tudo.
- **Fit sem regra para outros segmentos.** Empresa de software ou de varejo com um CNPJ só não cai em nenhuma linha da tabela de fit; é uma decisão de regra de negócio, não de instrução.
