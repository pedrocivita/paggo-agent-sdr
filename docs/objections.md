# Mapa de objeções

Entregável do case. As respostas usam só fatos de [paggo.md](paggo.md) (deck institucional e site); o que nenhum dos dois diz o agente não afirma. O mesmo conteúdo entra no prompt do agente de voz (`voice/prompt.md`).

Regra geral: entender antes de responder. Uma pergunta curta sobre a objeção, um fato, e volta para a conversa. No máximo duas tentativas na mesma objeção; depois registra e segue.

| Objeção | O que costuma estar por trás | Resposta do agente | Se não resolver |
| --- | --- | --- | --- |
| "Quanto custa?" | Quer saber se cabe no bolso | Não fala número: quem monta a proposta é o time, na reunião. Pode dizer que a implementação é gratuita e que o saldo nas contas Paggo rende 100% do CDI, líquido de IOF | Oferece a reunião para a proposta |
| "Agora não é o momento" | Outra prioridade na frente | Pergunta o que muda e quando (vira o evento crítico). A implantação pede de 1 a 2 horas do time | Marca mais à frente ou registra "retornar depois" com a data |
| "Já uso outra solução" ou "já tenho ERP" | Trocar dá trabalho | Pergunta o que funciona e o que falta. A Paggo integra ao ERP, conecta contas de outros bancos via Open Finance e importa dados de outras plataformas: não precisa trocar tudo | Registra a ferramenta atual e a lacuna |
| "Integra com o meu ERP X?" | Medo de retrabalho | Diz que integra com ERP, mas que confirma o X com o time; não afirma integração específica | Anota a dúvida para a reunião |
| "A gente resolve na planilha" | Funciona, mas cansa | Pergunta quanto tempo o time gasta consolidando contas e obras. A ideia da Paggo é justamente tirar planilha e controle paralelo | Registra o tempo gasto como impacto |
| "Não sou a pessoa certa" | Está na rotina, não na decisão | Pergunta quem decide e se participaria junto | "Indicou outra pessoa", com nome e contato |
| "É banco? É seguro?" | Medo de risco | Não é banco. Contas numa Instituição de Pagamento regulada pelo Banco Central, recursos segregados, autenticação em duas etapas, limites por horário e tipo de pagamento | Oferece mostrar na reunião |
| "Quem usa?" | Quer prova | Incorporadoras como BP, ATR e Hype, entre outras; mais de 300 empreendimentos usam a Paggo | Oferece a reunião |
| "Vocês são novos" | Medo de apostar numa startup | Mais de R$ 10 bilhões transacionados até janeiro de 2026; apoiada por Kaszek, Monashees, ONEVC e Picus | Registra a preocupação |
| "Migrar dá muito trabalho" | Implantação anterior foi ruim | Implementação gratuita e acompanhada; contas abertas em poucos minutos | Pergunta o que deu errado da última vez |
| "Me manda por e-mail" | Saída educada | Aceita, faz uma pergunta para o material ser útil e oferece 30 minutos | "Retornar depois" |
| "Não tenho tempo" | Agenda cheia | São 30 minutos; oferece dois horários, inclusive na semana seguinte | "Qualificado sem reunião" |
| "Você é um robô?" | Curiosidade ou desconfiança | Confirma que é a assistente virtual da Paggo e pergunta se pode seguir ou se prefere falar com uma pessoa do time | Marca direto com o time |

Toda objeção levantada entra no campo `objecoes` da coleta de dados pós-chamada e aparece na aba Conversa estruturada do painel.
