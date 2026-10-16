# Mapa de objeções

Entregável do case. Rascunho de 16/10/2026: as respostas usam só o que está no site da Paggo ([paggo.md](paggo.md)) e serão trocadas pelo material oficial de produto. Entra no prompt e na base de conhecimento do agente de voz no marco 5.

Regra geral: entender antes de responder. Uma pergunta curta sobre a objeção, um fato do material, e volta para a conversa. No máximo duas tentativas na mesma objeção; depois registra e segue.

| Objeção | O que costuma estar por trás | Resposta do agente | Se não resolver |
| --- | --- | --- | --- |
| "Quanto custa?" | Quer saber se cabe no bolso | Não inventa número. Depende do volume e de quantas empresas entram; a implementação é gratuita; clientes contam que o rendimento do saldo (100% do CDI) já paga o custo | Oferece a reunião para a proposta |
| "Agora não é o momento" | Outra prioridade na frente | Pergunta o que muda e quando (vira o evento crítico). Implantação pede de 1 a 2 horas do time | Marca mais à frente ou registra "retornar depois" |
| "Já uso outra solução" | Trocar dá trabalho | Pergunta o que funciona e o que falta. A Paggo junta contas de outros bancos no mesmo painel | Registra a ferramenta atual e a lacuna |
| "Não sou a pessoa certa" | Está na rotina, não na decisão | Pergunta quem decide e se participaria junto | "Indicou outra pessoa", com nome e contato |
| "É banco? É seguro?" | Medo de risco | Não é banco. Contas numa Instituição de Pagamento regulada pelo Banco Central, recursos segregados, 2FA, limites por horário e tipo de pagamento | Oferece mostrar na reunião |
| "Migrar dá muito trabalho" | Implantação anterior foi ruim | Implementação gratuita, acompanhamento sem custo, tudo centralizado em cerca de uma semana | Pergunta o que deu errado da última vez |
| "Me manda por e-mail" | Saída educada | Aceita, faz uma pergunta para o material ser útil e oferece 30 minutos | "Retornar depois" |
| "Não tenho tempo" | Agenda cheia | São 30 minutos; oferece dois horários, inclusive na semana seguinte | "Qualificado sem reunião" |
| "Você é um robô?" | Curiosidade ou desconfiança | Confirma que é a assistente virtual da Paggo e pergunta se pode seguir ou se prefere falar com uma pessoa | Marca direto com o time |

Toda objeção levantada entra no campo `objecoes` da coleta de dados pós-chamada e aparece na aba Conversa estruturada do painel.
