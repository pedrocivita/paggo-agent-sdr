# Status

Memória viva do projeto: onde estamos, o que está provado, o que falta e as armadilhas. Toda sessão lê este arquivo no começo e o reescreve antes do push (substituir, não acrescentar). Atualizado em 20/10/2026, dia da entrega, antes do congelamento do código.

## Índice

- [Onde estamos](#onde-estamos)
- [O que mudou em 20/10](#o-que-mudou-em-2010)
- [Provado e não provado](#provado-e-não-provado)
- [Próximos passos](#próximos-passos)
- [Entrega](#entrega)
- [Pendências que dependem da Paggo](#pendências-que-dependem-da-paggo)
- [Dados de teste no banco](#dados-de-teste-no-banco)
- [Armadilhas](#armadilhas)

## Onde estamos

- **Tudo em produção:** formulário, pesquisa, voz na conta da Paggo (voz Samuel, `gemini-2.5-flash`), agenda real com trava na marcação, pós-chamada com resumo próprio e painel com as 5 abas.
- **Últimas provas ponta a ponta:** terceira conversa em produção (20/10, `conv_7501...`, 3,3 min), com o evento crítico; quarta (20/10, `conv_7301...`, 1,8 min), que provou o resumo próprio e mostrou o fit vazando para a voz; sexta (20/10, 15h53, `conv_5601...`, 3,2 min), que provou as correções da tarde. Detalhes em [reasoning.md](reasoning.md#agente-de-voz).
- **O entregável está completo:** app no ar, repo com README de teste para a banca, regras de negócio com a base legal da LGPD, objeções e o raciocínio curto ([reasoning-summary.md](reasoning-summary.md)). Falta só o envio.

## O que mudou em 20/10

Cada item tem opções, escolha e prova em [reasoning.md](reasoning.md) e uma linha em [DECISIONS.md](../DECISIONS.md) quando é decisão.

| Mudança | Prova |
| --- | --- |
| O agente pergunta o evento crítico antes da agenda, numerado com a pergunta de quem decide | Simulação: 2 de 6 antes, 11 de 15 depois; conversa em produção com as cinco letras na coleta |
| Resumo do pós-chamada próprio (campo `resumo`), porque o do ElevenLabs afirmou um envio de e-mail que nada faz | Teste unitário; 5 simulações sem afirmar envio; conversa em produção com o resumo novo no painel |
| O fit não vai mais no resumo que a voz lê (instruções da pesquisa e checagem no eval), e a voz ignora fit ou perfil se ainda vier | Eval: nenhum dos 7 briefings com fit no resumo; 6 simulações da persona nova `fora-do-perfil` sem falar em perfil |
| A página do lead no painel se atualiza a cada 5 s até a conversa chegar (o pós-chamada leva cerca de 80 s) | Dev local: 4 releituras em 20 s num lead sem conversa, nenhuma num lead que já conversou |
| O botão "Enviar" trava durante o envio (um duplo clique criou dois leads) | Dev local, pelo caminho do campo contra robôs, sem criar lead |
| Checagem de preço do eval corta frase também em "?" e "!" (falso positivo no caso Cury) | Os 7 briefings salvos: 79 de 79 |
| Voz: quem é de tecnologia é lead; sem enchimento nem resumo do que o lead disse; despedida uma vez só (da quinta conversa em produção) | 12 simulações: nenhum enchimento (5 em 29 antes), 21% das falas acima de 25 palavras (28% antes), quem decide antes das 10 reuniões; sexta conversa em produção (15h53): lead de tecnologia seguiu a descoberta, despedida uma vez só, cinco letras na coleta |
| Formulário cabia fora da tela no celular (o select de cargo empurrava a grade) | Dev local a 375 px: documento com 375 px; CSS conferido em produção |
| Painel mostra "médio" e "média" com acento | Dev local |
| README abre com o teste de 5 minutos, o que cada aba mostra e os limites conhecidos | Commit |
| LGPD: base legal de cada dado e o que fica para a operação real | [business-rules.md](business-rules.md#dados-pessoais) |
| Raciocínio curto revisado contra o código: a abertura diz "assistente virtual", não "sou IA"; o formulário avisa da IA | Commit |
| Checagem `askedCriticalEvent` no `voice-simulate.mjs` | Conferida nas transcrições |

## Provado e não provado

| Item | Estado | Como foi provado |
| --- | --- | --- |
| Portões | Provado | `npm test` (25), `npm run typecheck`, `npm run lint`, `npm run build` |
| Pesquisa | Provado | Eval de 7 casos em 20/10, com as instruções novas: 79 de 79 checagens com a checagem de preço corrigida. A Cury já oscilou (pulou a busca de SPEs); o CNPJ escolhido sempre foi o certo ([research-cases.md](research-cases.md)) |
| Voz em produção | Provado | Seis conversas na conta da Paggo. A de 20/10 de manhã: evento crítico e quem decide antes da agenda, reunião marcada pela trava, pedido de e-mail sem promessa. A primeira da tarde encerrou por perfil, pelo fit no resumo; a segunda, depois da correção, não falou em perfil, mas tratou o lead de tecnologia como pessoa errada, falou demais e repetiu a despedida. A sexta, às 15h53, depois da correção no prompt: lead de tecnologia na descoberta, despedida uma vez só, cinco letras na coleta, mediana de 1,38 s |
| Demora | Provado, com uma ressalva | Mediana de 1,25 s em 19/10, à noite; 2,19 s em 20/10, no meio do dia, com o LLM uns 0,3 s mais lento. Nas simulações o prompt novo não mudou o tempo do LLM |
| Agenda real | Provado | Consulta, marcação, 409 e recusa de horário fora da janela, todos pelas rotas de produção |
| Pós-chamada | Provado | Webhook HMAC na conta da Paggo; rota recusa assinatura falsa (401). O campo `resumo` chegou ao painel na conversa de 20/10 à tarde, cerca de 80 s depois do fim |
| Não provado | Aberto | O evento crítico só é perguntado quando o lead pede a reunião; quando o agente vai sozinho para a agenda, pula (decidido manter em 20/10). "Perfeito" ainda escapa no começo da resposta. Em 2 de 14 reuniões simuladas, antes das correções da tarde, marcou sem perguntar quem decide (e a coleta deduz quem decide); desligamento mudo em cerca de 1 de 15 simulações; falas longas com o cético; a falha da agenda (timeout) nunca foi provocada ao vivo; a busca pelo cargo só foi testada com nomes fictícios |

## Próximos passos

1. **Código congelado às 16h** (último commit de código: `4ba0d16`). Daqui em diante, só documentos.
2. **Envio, até 18h:** o repo está público desde 20/10, com descrição, e o link, o README e os documentos abrem sem login (conferido; o histórico não tem segredo). Falta mandar a mensagem com o link do app, o do repo e a senha do painel. A senha vai só na mensagem.
3. **Na mensagem**, avisar a Paggo das reuniões de teste na agenda do case (lista abaixo).

### Depois do case

- O `simulate-conversation` sai do ar em 31/10/2026: trocar por `agent-testing/create` e `run-tests` no `voice-simulate.mjs`.
- O `gemini-2.5-flash` sai em 30/11/2026, com desvio de parte das chamadas a partir de 1/11: rodar a comparação de LLMs de novo, medindo também no meio do dia.
- Pergunta de quem decide com garantia em código (campo obrigatório em `consultar_agenda`), agora que o evento crítico divide o mesmo momento.
- O eval monta o formulário sem o cargo: incluir o cargo nos casos.
- Passar o fit para a voz com uma regra no prompt; convite e retorno ao lead pela integração com o CRM da Paggo; "como conheceu" no formulário, ao lado da origem medida.
- LGPD para operação real: canal para os direitos do titular, prazo de retenção e cláusulas-padrão da ANPD nos contratos com os serviços de fora do Brasil.

## Entrega

| Quando | O quê |
| --- | --- |
| Ter 20/10, 16h | Código congelado. Depois disso, só documentos |
| Ter 20/10, 18h | Envio: link do app, link do repo (público) e a senha do painel na mensagem, nunca no repo |

## Pendências que dependem da Paggo

- Reuniões de teste na agenda do case, que a API não deixa desmarcar: 19/10 às 12h, 21/10 às 13h, 21/10 às 14h30, 22/10 às 9h, 22/10 às 9h30 e 22/10 às 13h.
- Preço ou faixa que o agente pode falar; quais ERPs têm integração pronta.
- O estudo de caso, que aparece no menu do deck sem conteúdo.

## Dados de teste no banco

Dev e produção usam o mesmo banco, e a banca abre o painel. Em 20/10 o dono do projeto decidiu não fazer varredura: ficam os leads fictícios dos casos difíceis, os testes do formulário e da origem, as conversas de prova do desenvolvedor (17/10, 19/10 e 20/10, inclusive o lead duplicado de 20/10 às 13h12, do duplo clique), o lead "Ana Teste" de 20/10 à noite (teste da chave da Paggo) e os eventos de teste e das rodadas do eval. O README avisa a banca que esses leads existem.

## Armadilhas

- A chave do ElevenLabs está marcada como sensível no Vercel: o `vercel env pull` traz o valor vazio. Os scripts usam um arquivo de chave fora do repo, um por conta (teste e Paggo); confira qual conta antes de publicar.
- O ElevenLabs só alcança a produção: ferramentas e webhook apontam para `paggo-agent-sdr.vercel.app`. Mudou rota, push antes de testar a voz. O `voice-sync.mjs` reaproveita o webhook pela URL e não troca o segredo.
- A simulação aceita no máximo 8 conversas ao mesmo tempo por conta (HTTP 429); rodar em lotes de 6.
- Na simulação as ferramentas da agenda são falsas: a trava da marcação só é exercitada em produção.
- Uma taxa de 1 em 15 não se prova com 15 rodadas; com 6 a 12 rodadas, diferença de uma ocorrência é ruído.
- A demora da voz varia com a hora: comparar conversas no mesmo período do dia.
- O resumo automático do ElevenLabs não tem prompt configurável; o painel usa o campo `resumo` da coleta.
- O pós-chamada chega cerca de 80 s depois da conversa: olhar o painel antes disso mostra o lead sem conversa.
- `npm run eval` recusa rodar com o dev server ligado (o agente eve já está no ar): desligar o preview antes.
- Uma falha que a simulação não reproduz (o encerramento por perfil) não tem antes e depois: corrigir a causa na fonte e dizer que o efeito na voz não tem número.
- Cada rodada do eval grava eventos sem lead no banco compartilhado.
- O dev local usa a conta de teste do ElevenLabs (`.env.development.local`, que tem prioridade sobre o `.env.local`). Cada worktree precisa dos dois arquivos, copiados de outro worktree e nunca commitados, e de `npm install`; desfazer a mudança que o install fizer no `package-lock.json`.
- A pesquisa em produção usa a chave da Anthropic que a Paggo mandou, desde 20/10 à noite (variável de Production, seguida de redeploy; lead de teste com briefing em 21 s). Preview e Development seguem com a chave do desenvolvedor. Variável nova só vale depois de um deploy novo, e o `vercel redeploy` precisa de `--scope` do time do projeto.
- Mais armadilhas do código em `AGENTS.md`, seção Gotchas.

Agent: Claude Code (claude-opus-5-5).
