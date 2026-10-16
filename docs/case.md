# O case

Enunciado do case de entrada da Paggo, transcrito do material recebido em 16/10/2026. É a fonte da verdade sobre o que entregar e como a banca avalia.

## Índice

- [Monte um agente de voz que pesquisa o visitante antes de conversar com ele](#monte-um-agente-de-voz-que-pesquisa-o-visitante-antes-de-conversar-com-ele)
- [O que entregar](#o-que-entregar)
- [Como o agente qualifica](#como-o-agente-qualifica)
- [O que fica registrado](#o-que-fica-registrado)
- [Agenda fictícia](#agenda-fictícia)
- [O que recebemos](#o-que-recebemos)
- [Como a banca avalia](#como-a-banca-avalia)
- [Dicas](#dicas)

## Monte um agente de voz que pesquisa o visitante antes de conversar com ele

Prazo: terça-feira, 20 de outubro de 2026.

Pense num lead, alguém com potencial de interesse na Paggo, entrando no site e preenchendo um formulário. O formulário pede o básico: nome, e-mail, telefone e nome da empresa. Se quiser, o lead conta mais, como o número de funcionários, num campo extra cujo formato fica a nosso critério.

Quando um formulário desses chega, o ideal é o vendedor pesquisar a pessoa e a empresa, montar um pequeno briefing e ligar para o telefone que o lead deixou. O case pede o mesmo com IA: o sistema pesquisa, monta o briefing interno e um agente de voz conversa com o lead, descobre o que falta, qualifica e tenta marcar uma reunião.

O canal fica a nosso critério. Pode ser uma ligação para o telefone do lead, inclusive pelo WhatsApp, ou uma conversa por voz dentro do próprio site, em que o lead clica num botão e fala com o agente.

## O que entregar

- Link de um web app no ar, com a stack que escolhermos, que:
    - recebe o formulário do lead;
    - pesquisa a pessoa e a empresa e monta um briefing interno;
    - conversa por voz com o lead, qualifica e marca a reunião na agenda;
    - mostra num painel interno a pesquisa e a conversa.
- Link do repositório.
- As regras de negócio pensadas e usadas ([business-rules.md](business-rules.md)).
- O mapeamento de objeções, com a resposta para cada uma ([objections.md](objections.md)).
- Um documento curto com o raciocínio por trás de cada parte construída (a escrever no fim; as decisões já estão em [DECISIONS.md](../DECISIONS.md)).

## Como o agente qualifica

O agente segue o SPICED, o mesmo critério do SalesOS da Paggo. Ele começa pelo que o briefing já sabe e pergunta só o que falta.

| Letra | Significa | Pergunta que responde |
| --- | --- | --- |
| S | Situação | Como a empresa funciona hoje |
| P | Dor | O que trava ou incomoda |
| I | Impacto | Quanto isso custa em tempo ou dinheiro |
| C | Evento crítico | O que obriga a resolver agora |
| D | Decisão | Quem decide e como |

Objeções: mapear as que um lead pode levantar, como preço, momento, "já uso outra solução" ou "não sou a pessoa certa", e definir como o agente esclarece cada uma. Esse mapeamento faz parte da entrega.

## O que fica registrado

Um registro por visitante, com a pesquisa e a conversa juntas. É isso que o painel interno mostra.

| Parte | Conteúdo |
| --- | --- |
| Formulário | Nome, e-mail, telefone e empresa, como o lead digitou |
| Pesquisa | Os dados encontrados sobre a empresa e a pessoa e o briefing |
| Conversa, estruturado | Dados da pessoa confirmados ou corrigidos, SPICED letra por letra e resultado |
| Conversa, texto | Transcrição completa e resumo |
| Rastro | Fontes, ferramentas e tudo o que o agente consultou em cada execução |

## Agenda fictícia

A Paggo serve um endpoint com duas rotas, protegido por um token de autenticação que vem com o case.

| Rota | O que faz |
| --- | --- |
| `GET /agenda/disponibilidade?de=&ate=` | Lista os horários livres de 30 minutos |
| `POST /agenda/reunioes` | Marca a reunião. Retorna 409 se o horário já estiver ocupado |

Resposta 200 de disponibilidade:

```json
{
  "fuso": "America/Sao_Paulo",
  "livres": [
    { "inicio": "2026-10-20T10:00:00-03:00", "fim": "2026-10-20T10:30:00-03:00" },
    { "inicio": "2026-10-21T15:30:00-03:00", "fim": "2026-10-21T16:00:00-03:00" }
  ]
}
```

Corpo do POST de reuniões:

```json
{ "inicio": "2026-10-20T10:00:00-03:00", "nome": "Ana Souza", "email": "ana@exemplo.com.br" }
```

O enunciado não diz o formato do cabeçalho de autenticação nem o formato exato de `de` e `ate`. O código assume `Authorization: Bearer <token>` e datas ISO (ver [STATUS.md](STATUS.md)).

## O que recebemos

| Item | Conteúdo |
| --- | --- |
| ElevenLabs | Chave da API |
| Agenda | URL do endpoint e token de autenticação |
| Paggo | Material sobre o produto para o agente |
| Opcional | Chave de API do Codex, se precisar |

## Como a banca avalia

A banca preenche o formulário com dados reais, conversa com o agente fazendo o papel do cliente e depois abre o painel. Critérios em ordem de importância:

| Nível | O que observam |
| --- | --- |
| Crítico | Gera o briefing |
| Crítico | A conversa por voz acontece, pelo canal escolhido |
| Crítico | O painel mostra as fontes e as ferramentas consultadas em cada execução |
| Alto | O briefing está correto |
| Alto | O agente usa o briefing |
| Alto | Soa como uma pessoa, sem demora para responder |
| Alto | Qualifica com o SPICED |
| Alto | Gera saída estruturada depois da conversa |
| Alto | Consulta a agenda |
| Médio | Responde objeções sobre a Paggo |
| Médio | Conduz a conversa sem soar como vendedor |

## Dicas

- A stack é livre. Um framework de agentes ajuda, como o Deep Agents da LangChain, o Mastra ou o [eve da Vercel](https://github.com/vercel/eve), conectado ao ElevenLabs.
- Antes de escrever código, testar a demo de voz no site do ElevenLabs para sentir o nível de naturalidade possível.
- O canal importa menos do que o agente. Priorizar um agente que funcione e responda bem; decidir depois se ele liga pelo WhatsApp ou conversa pelo site.
- Se fechar o escopo principal e sobrar tempo, refinar ao máximo a experiência da conversa. Depois disso, se ainda sobrar tempo, expandir o escopo.
