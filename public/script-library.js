window.APP_SCRIPT_LIBRARY = {
  DEFAULT: [
    {
      id: "confirmacao-dados",
      categoria: "Abertura",
      titulo: "Confirmação de dados",
      texto:
        "Olá, {{primeiro_nome}}. Antes de avançarmos, preciso confirmar rapidamente alguns dados para localizar corretamente o seu atendimento na {{carteira}}. Com essa validação eu consigo te passar a informação certa e evitar qualquer divergência.",
    },
    {
      id: "fora-assessoria",
      categoria: "Fluxo",
      titulo: "Cliente fora de assessoria",
      texto:
        "Olá, {{primeiro_nome}}. No momento este contrato não está sob atendimento da nossa assessoria. Para continuidade, peço que você siga diretamente pelo canal oficial da carteira: {{canal_oficial}}. Se quiser, eu ainda posso te orientar sobre o próximo passo.",
    },
    {
      id: "alega-pagamento",
      categoria: "Contestação",
      titulo: "Alega pagamento",
      texto:
        "Perfeito, {{primeiro_nome}}. Obrigado por me avisar. Para eu validar com segurança, me envie por favor o comprovante com data, valor e identificação da transação. Assim que eu receber, sigo com a conferência do seu atendimento.",
    },
    {
      id: "desempregado",
      categoria: "Objeção",
      titulo: "Argumentação para desemprego",
      texto:
        "Entendo sua situação, {{primeiro_nome}}, e por isso estou buscando a condição mais leve disponível para o seu atendimento. A ideia é te ajudar a regularizar sem apertar ainda mais o seu orçamento. Se fizer sentido, eu verifico uma composição mais ajustada para você.",
    },
    {
      id: "retomada",
      categoria: "Acompanhamento",
      titulo: "Retomada sem resposta",
      texto:
        "Olá, {{primeiro_nome}}. Retomei seu atendimento porque ainda temos possibilidade de negociação para o contrato {{contrato}}. Se você quiser, eu te passo agora as condições disponíveis para regularização.",
    },
    {
      id: "finalizacao-acordo",
      categoria: "Encerramento",
      titulo: "Finalização de acordo",
      texto:
        "Perfeito, {{primeiro_nome}}. Sua negociação foi encaminhada e agora vamos seguir com a formalização. Peço apenas que acompanhe o prazo combinado para manter o acordo ativo. Se precisar, eu posso te reenviar os detalhes por aqui.",
    },
  ],
  BEMOL: [
    {
      id: "bemol-abertura",
      categoria: "Abertura",
      titulo: "Apresentação Bemol",
      texto:
        "Olá, {{primeiro_nome}}. Sou da equipe da Syscob no atendimento da Bemol e estou por aqui para te ajudar da melhor forma possível. Localizei o contrato {{contrato}} e consigo verificar uma condição de regularização para hoje. Posso te passar os detalhes?",
    },
    {
      id: "bemol-cliente-desconhecido",
      categoria: "Fluxo",
      titulo: "Cliente desconhecido",
      texto:
        "Olá. Obrigado pelo retorno. Vou retirar este contato do nosso fluxo da Bemol para evitar novos acionamentos por engano. Pode desconsiderar a mensagem anterior. Desejo um excelente dia.",
    },
    {
      id: "bemol-avista",
      categoria: "Negociação",
      titulo: "Proposta à vista",
      texto:
        "{{primeiro_nome}}, localizei uma condição especial para o contrato {{contrato}} na Bemol. Se você conseguir concluir até {{data_pagamento}}, eu sigo com a melhor condição à vista disponível e já deixo tudo pronto por aqui. Posso te enviar os detalhes agora?",
    },
    {
      id: "bemol-parcelamento",
      categoria: "Negociação",
      titulo: "Parcelamento",
      texto:
        "Para facilitar sua regularização com a Bemol, consigo trabalhar com entrada a partir de {{valor_entrada}} e demais parcelas mensais conforme a condição liberada para o contrato {{contrato}}. Se fizer sentido para você, eu te apresento agora a composição mais leve disponível.",
    },
    {
      id: "bemol-ajuste-data",
      categoria: "Objeção",
      titulo: "Argumentação de data",
      texto:
        "Entendo que a data original pode ficar apertada, {{primeiro_nome}}. Posso verificar uma prorrogação para {{data_pagamento}} e, assim, te dar um prazo mais confortável para seguir com a regularização. Se essa data funcionar para você, eu atualizo a negociação por aqui.",
    },
    {
      id: "bemol-objecao-valor",
      categoria: "Objeção",
      titulo: "Valor apertado",
      texto:
        "Se o pagamento à vista ficar pesado agora, eu consigo buscar uma alternativa parcelada para o contrato {{contrato}}. A ideia é te dar mais fôlego sem perder a oportunidade disponível neste momento. Se quiser, eu sigo com uma simulação mais ajustada ao que você consegue assumir.",
    },
    {
      id: "bemol-finalizacao",
      categoria: "Encerramento",
      titulo: "Finalização positiva",
      texto:
        "Perfeito, {{primeiro_nome}}. Deixei sua tratativa da Bemol registrada conforme combinamos. Assim que o pagamento for realizado, me envie o comprovante por este canal para eu agilizar a baixa e acompanhar a evolução do seu atendimento.",
    },
  ],
  RCHLO: [
    {
      id: "rchlo-abertura",
      categoria: "Abertura",
      titulo: "Abertura digital",
      texto:
        "Olá, {{primeiro_nome}}. Aqui é a equipe da Syscob no atendimento Riachuelo. Localizei o contrato {{contrato}} com uma janela ativa de negociação e posso te apresentar as condições disponíveis agora mesmo. Quer que eu siga?",
    },
    {
      id: "rchlo-quitacao",
      categoria: "Negociação",
      titulo: "Proposta de quitação",
      texto:
        "{{primeiro_nome}}, existe uma oportunidade para quitar o contrato {{contrato}} com condição especial na Riachuelo. Se você conseguir concluir até {{data_pagamento}}, eu te envio a proposta para fechamento ainda hoje. Posso seguir?",
    },
    {
      id: "rchlo-parcelamento",
      categoria: "Negociação",
      titulo: "Parcelamento de fatura",
      texto:
        "Para facilitar sua regularização, consigo verificar parcelamento para o contrato {{contrato}} com entrada a partir de {{valor_entrada}} e demais parcelas mensais. Se essa for a melhor saída para você, eu já te apresento a opção disponível.",
    },
    {
      id: "rchlo-data",
      categoria: "Objeção",
      titulo: "Prorrogação de data",
      texto:
        "Entendo o seu ponto, {{primeiro_nome}}. Posso tentar uma exceção de data para {{data_pagamento}}, desde que essa seja uma data segura para você cumprir. Se estiver de acordo, eu formalizo a tratativa com esse novo vencimento.",
    },
    {
      id: "rchlo-contraproposta",
      categoria: "Negociação",
      titulo: "Encaminhar contraproposta",
      texto:
        "Consigo encaminhar uma contraproposta para análise da Riachuelo, mas preciso da sua confirmação real de pagamento caso ela seja aprovada. Me diga qual valor total você consegue assumir à vista que eu sigo com essa validação agora.",
    },
    {
      id: "rchlo-boleto",
      categoria: "Acompanhamento",
      titulo: "Boleto e segunda via",
      texto:
        "Perfeito, {{primeiro_nome}}. Assim que o boleto estiver liberado, eu te encaminho por este canal. Depois do pagamento, me envie o comprovante para eu agilizar a baixa e acompanhar a retirada da pendência no prazo operacional.",
    },
    {
      id: "rchlo-alega-pagamento",
      categoria: "Contestação",
      titulo: "Alega pagamento",
      texto:
        "Obrigado pela informação, {{primeiro_nome}}. Vou registrar no atendimento da Riachuelo, mas preciso que você me envie o comprovante para conferência. Assim conseguimos validar a baixa com mais rapidez e segurança.",
    },
    {
      id: "rchlo-fora-assessoria",
      categoria: "Fluxo",
      titulo: "Fora de assessoria",
      texto:
        "Verifiquei aqui e este contrato não está mais sob atendimento da Syscob. Para seguir com a tratativa da Riachuelo, peço que você fale diretamente com a Midway pelos canais oficiais: {{canal_oficial}}.",
    },
  ],
  GMATEUS: [
    {
      id: "gmateus-abertura",
      categoria: "Abertura",
      titulo: "Abordagem inicial",
      texto:
        "Olá, {{primeiro_nome}}. Sou da equipe da Syscob no atendimento do Grupo Mateus. Localizei o contrato {{contrato}} e posso te apresentar uma condição especial de regularização para hoje. Se quiser, eu te passo os detalhes agora.",
    },
    {
      id: "gmateus-avista",
      categoria: "Negociação",
      titulo: "Proposta à vista",
      texto:
        "{{primeiro_nome}}, consegui localizar uma proposta à vista para o contrato {{contrato}} com condição diferenciada. Se você conseguir concluir até {{data_pagamento}}, eu formalizo essa tratativa e já deixo o processo encaminhado. Posso seguir?",
    },
    {
      id: "gmateus-parcelamento",
      categoria: "Negociação",
      titulo: "Parcelamento total",
      texto:
        "Se o à vista ficar pesado, posso te apresentar uma composição parcelada no Grupo Mateus, considerando entrada a partir de {{valor_entrada}} e demais parcelas mensais. Se fizer sentido para você, eu já monto as opções disponíveis para o contrato {{contrato}}.",
    },
    {
      id: "gmateus-contraproposta",
      categoria: "Negociação",
      titulo: "Contraproposta",
      texto:
        "Consigo encaminhar uma contraproposta para análise da central do Grupo Mateus, mas só seguimos se houver real possibilidade de pagamento após a aprovação. Me diga qual valor total você consegue assumir que eu verifico a viabilidade agora.",
    },
    {
      id: "gmateus-quita-plus",
      categoria: "Objeção",
      titulo: "Alternativa no cartão",
      texto:
        "Se o pagamento à vista continuar pesado, existe a possibilidade de liquidação por cartão de crédito. Assim você consegue dividir o valor e ainda regularizar o contrato {{contrato}} com mais conforto. Se quiser, eu te explico como funciona essa etapa.",
    },
    {
      id: "gmateus-confirmacao",
      categoria: "Acompanhamento",
      titulo: "Confirmação de acordo",
      texto:
        "Só confirmando, {{primeiro_nome}}: vamos deixar o contrato {{contrato}} programado para pagamento em {{data_pagamento}}. Se estiver tudo certo, eu sigo com a formalização e te orientarei sobre os próximos passos.",
    },
    {
      id: "gmateus-preventivo",
      categoria: "Acompanhamento",
      titulo: "Preventivo de vencimento",
      texto:
        "Olá, {{primeiro_nome}}. Passando para lembrar que o seu acordo do Grupo Mateus está programado para {{data_pagamento}}. É importante manter esse prazo para preservar a condição liberada. Se precisar de apoio com o boleto, estou à disposição.",
    },
    {
      id: "gmateus-fora-assessoria",
      categoria: "Fluxo",
      titulo: "Fora de assessoria",
      texto:
        "Verifiquei aqui e o contrato {{contrato}} não está mais com a Syscob. Para continuidade com o Grupo Mateus, peço que você utilize o canal oficial: {{canal_oficial}}.",
    },
  ],
  TOPFAMA: [
    {
      id: "topfama-abertura",
      categoria: "Abertura",
      titulo: "Abordagem inicial",
      texto:
        "Olá, {{primeiro_nome}}. Sou da equipe da Syscob no atendimento da Topfama. Localizei o contrato {{contrato}} com uma condição especial de regularização e posso te apresentar essa oportunidade agora. Posso seguir?",
    },
    {
      id: "topfama-quebra",
      categoria: "Fluxo",
      titulo: "Quebra de acordo",
      texto:
        "Como o acordo anterior não foi cumprido, o sistema cancelou a condição e o contrato {{contrato}} voltou para cobrança. Ainda assim, consigo verificar uma nova chance de regularização amigável hoje. Se quiser, eu sigo com a atualização por aqui.",
    },
    {
      id: "topfama-avista",
      categoria: "Negociação",
      titulo: "Proposta à vista",
      texto:
        "{{primeiro_nome}}, localizei uma proposta à vista para a Topfama com vencimento em {{data_pagamento}}. Essa condição reduz bastante o impacto do débito e pode acelerar a regularização do contrato {{contrato}}. Posso te enviar para fechamento?",
    },
    {
      id: "topfama-parcelamento",
      categoria: "Negociação",
      titulo: "Parcelamento total",
      texto:
        "Se você preferir parcelar, consigo te apresentar opções com entrada a partir de {{valor_entrada}} e demais parcelas mensais para o contrato {{contrato}}. A ideia é ajustar o acordo ao que cabe no seu momento sem perder a oportunidade disponível.",
    },
    {
      id: "topfama-contraproposta",
      categoria: "Negociação",
      titulo: "Análise de contraproposta",
      texto:
        "Posso encaminhar uma contraproposta para análise da Topfama, mas preciso da sua confirmação real de pagamento caso ela seja aprovada. Me diga qual valor à vista você consegue assumir que eu verifico a viabilidade agora.",
    },
    {
      id: "topfama-link",
      categoria: "Objeção",
      titulo: "Liquidação no cartão",
      texto:
        "Se o à vista não encaixar agora, existe a possibilidade de liquidação via cartão de crédito. Eu te envio um link seguro, você escolhe a quantidade de parcelas disponível e depois me manda o comprovante para eu acompanhar a baixa. Se quiser, eu já preparo esse envio.",
    },
    {
      id: "topfama-confirmacao",
      categoria: "Acompanhamento",
      titulo: "Confirmação do acordo",
      texto:
        "Só confirmando, {{primeiro_nome}}: vamos deixar o contrato {{contrato}} programado para {{data_pagamento}}, com a entrada de {{valor_entrada}} e demais condições já alinhadas. Se estiver correto, eu sigo com a formalização agora.",
    },
    {
      id: "topfama-encerramento",
      categoria: "Encerramento",
      titulo: "Sem condição no momento",
      texto:
        "Entendi, {{primeiro_nome}}. Como não conseguimos avançar agora, o contrato {{contrato}} seguirá em aberto e os valores podem sofrer atualização com o tempo. Se você quiser retomar essa conversa mais à frente, eu fico à disposição para verificar uma nova condição.",
    },
  ],
  SUPERDB: [
    {
      id: "superdb-abertura-debito",
      categoria: "Abertura",
      titulo: "Abordagem de débito",
      texto:
        "Olá, {{primeiro_nome}}. Sou da equipe da Syscob no atendimento do Supermercados DB. Localizei uma pendência vinculada ao contrato {{contrato}} e posso te apresentar uma condição especial de regularização agora. Quer que eu siga?",
    },
    {
      id: "superdb-abertura-fatura",
      categoria: "Abertura",
      titulo: "Abordagem de fatura",
      texto:
        "Olá, {{primeiro_nome}}. Verifiquei uma fatura em aberto do Supermercados DB vinculada ao contrato {{contrato}}. Dependendo da sua preferência, eu posso seguir com segunda via para pagamento ou te apresentar outras opções de negociação.",
    },
    {
      id: "superdb-avista",
      categoria: "Negociação",
      titulo: "Proposta à vista",
      texto:
        "{{primeiro_nome}}, localizei uma proposta à vista para o contrato {{contrato}} com vencimento em {{data_pagamento}}. Se essa opção fizer sentido para você, eu sigo com a formalização para aproveitar a condição disponível neste momento.",
    },
    {
      id: "superdb-parcelamento",
      categoria: "Negociação",
      titulo: "Parcelamento de fatura",
      texto:
        "Para facilitar sua regularização no Supermercados DB, consigo trabalhar com uma composição parcelada considerando entrada a partir de {{valor_entrada}} e demais parcelas mensais para o contrato {{contrato}}. Se quiser, eu já te apresento as opções liberadas.",
    },
    {
      id: "superdb-protesto",
      categoria: "Objeção",
      titulo: "Orientação sobre protesto",
      texto:
        "Se este contrato já estiver protestado, além do pagamento principal será necessário regularizar também as taxas cartorárias diretamente com o canal do Supermercados DB. Se estiver nessa situação, eu te explico certinho o passo a passo para não ficar nenhuma pendência em aberto.",
    },
    {
      id: "superdb-data-extensa",
      categoria: "Objeção",
      titulo: "Data mais longa",
      texto:
        "Consigo tentar uma exceção de data para {{data_pagamento}}, mas preciso te sinalizar que prazos mais longos podem alterar o valor e aumentar o risco de perda das condições atuais. Se essa data for segura para você, eu sigo com a atualização.",
    },
    {
      id: "superdb-alega-pagamento",
      categoria: "Contestação",
      titulo: "Alega pagamento",
      texto:
        "Perfeito, {{primeiro_nome}}. Me envie por favor o comprovante do pagamento para eu anexar ao atendimento do Supermercados DB e acompanhar a baixa. Se houver protesto ativo, eu também te oriento sobre a etapa complementar com o cartório.",
    },
    {
      id: "superdb-encerramento",
      categoria: "Encerramento",
      titulo: "Finalização com boleto",
      texto:
        "Combinado, {{primeiro_nome}}. Assim que o boleto for emitido, eu te envio por aqui. Depois do pagamento, peço que me encaminhe o comprovante para eu agilizar a baixa do contrato {{contrato}} e acompanhar a atualização do seu atendimento.",
    },
  ],
};
