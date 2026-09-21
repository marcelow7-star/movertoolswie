import React, { useState, useMemo, useEffect } from "react";

const NAVY = "#1A2A3A";
const BLUE = "#1E5A96";
const LIGHTBLUE = "#4A9EE8";

async function callClaude(prompt, maxTokens = 300) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Falha ao chamar a IA");
  }
  return data.text || "";
}

function notifyConsultor(assunto, corpo) {
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assunto, corpo }),
  }).catch(() => {
    /* silencioso: a pessoa já tem o PDF e o botão de e-mail manual como reforço */
  });
}

const SUPABASE_URL = "https://ffoenurvsibztibpabtm.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmb2VudXJ2c2lienRpYnBhYnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MjQ2MzQsImV4cCI6MjEwMzEwMDYzNH0.d3YDLtkuZKuNMFW88_KfXMaov9-NGAUNJp7APUVsOj0";

const LIVRO_CONTEXTO = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 01 · Raízes das Lealdades Invisíveis):

PROPÓSITO: trazer à consciência compromissos emocionais e vínculos de lealdade (com pais, sócios,
colaboradores antigos, a história da empresa ou um projeto de vida abandonado) que travam decisões
de sucessão sem que a pessoa perceba. O objetivo não é romper lealdades, é torná-las visíveis para
serem escolhidas conscientemente, não apenas obedecidas por hábito ou culpa.

O QUE RESOLVE: a maioria das travas na sucessão não é técnica. O sucessor sabe o que "deveria"
fazer mas não consegue agir; o fundador sabe que deveria soltar o comando mas adia. Por trás disso
quase sempre existe um conflito de lealdades não nomeado. A ferramenta transforma um mal-estar
difuso em um conflito específico, com nome e lados definidos.

TRÊS CASOS REAIS DE VALIDAÇÃO:
- Marina (34, CFO, sucessora): travada em assumir a diretoria-geral. Conflito: "Meu pai" (5, Família)
  vs "Objetivos profissionais" (1, Projeto de Vida). A virada veio quando, na consolidação familiar,
  o pai revelou que nunca esperou que ela liderasse "do jeito dele". O pai virou conselheiro
  estratégico, ela assumiu em 45 dias com estilo próprio.
- Rafael e os irmãos (herdeiros, sócios): travados em modernizar a gestão. Conflito: "Sonho do
  fundador" (5, Negócio) vs "Crescimento patrimonial" (2, Patrimônio). A virada veio ao perceber que
  os 3 irmãos interpretavam "sonho do fundador" de formas diferentes (não mudar nada vs. fazer a
  empresa durar). Nomear essa diferença tirou o debate do campo emocional. Sistema implementado
  em 60 dias.
- Antônio (68, fundador): travado em soltar as aprovações financeiras. Conflito: "Sonho do fundador"
  e "Marca da família" (5, Negócio) vs "Liberdade de escolha" (2, Projeto de Vida). A virada não veio
  da comparação de notas, veio da Reflexão Individual: ele percebeu que não tinha resposta para
  "o que eu seria fora da empresa". Soltar não era delegar, era o medo de desaparecer. Virou
  "guardião do legado" no conselho, com projeto pessoal de mentoria.

PADRÃO COMUM AOS TRÊS CASOS: o travamento nunca era técnico, era uma lealdade não nomeada.
Nomear a lealdade foi suficiente para destravar decisões paradas há meses ou anos, dentro de 30 a
90 dias.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): preencher sozinho e nunca compartilhar
em família; usar as descobertas como arma em discussão; confundir lealdade com obrigação ou culpa
(nem toda lealdade alta é um problema); aplicar em crise aguda sem segurança emocional; tratar as
notas como diagnóstico definitivo em vez de ponto de partida para conversa.

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela pessoa,
sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor, sobre as barreiras invisíveis por
trás da resistência à sucessão):

As barreiras invisíveis mais comuns: o medo do fundador de perder o controle e a identidade; o
receio dos herdeiros de não estarem à altura do legado; o silêncio sobre conflitos passados que
ressurgem quando se fala em futuro; a crença de que "meu caso é diferente" e o tempo não vai
atingir a família. "Essas são barreiras invisíveis, porém muito poderosas. São elas que, em última
instância, determinam se uma sucessão será bem-sucedida ou não."

Por que herdeiros carregam culpas que não são suas: eles crescem sob uma narrativa de sacrifício
("seu avô começou do zero", "seu pai abriu mão de tudo por essa empresa", "vocês têm que honrar
esse legado"). Essa carga simbólica cria uma sensação de dívida permanente. A culpa aparece tanto
quando o herdeiro quer inovar, como se estivesse desrespeitando o passado, quanto quando quer
sair, como se estivesse traindo a família. Para o fundador, quando o próprio valor pessoal está
associado exclusivamente à empresa, qualquer movimento de saída é vivido como ameaça de
inutilidade, não como aposentadoria.
`.trim();

const PAPEIS = [
  {
    key: "protetor",
    nome: "Protetor",
    oQueFaz: "Assume responsabilidades que não são suas para evitar que alguém saia machucado.",
    custaExcesso: "Impede que os outros desenvolvam a própria capacidade de lidar com dificuldades.",
  },
  {
    key: "controlador",
    nome: "Controlador",
    oQueFaz: "Centraliza decisões para reduzir a sensação de risco.",
    custaExcesso: "Trava a autonomia e o desenvolvimento de quem está ao redor.",
  },
  {
    key: "pacificador",
    nome: "Pacificador",
    oQueFaz: "Evita conflitos a qualquer custo para preservar a harmonia aparente.",
    custaExcesso: "Empurra problemas reais para debaixo do tapete.",
  },
  {
    key: "heroi",
    nome: "Herói",
    oQueFaz: "Resolve as crises sozinho e se torna indispensável.",
    custaExcesso: "Sobrecarrega quem exerce o papel e impede que outros desenvolvam competência.",
  },
  {
    key: "rebelde",
    nome: "Rebelde",
    oQueFaz: "Questiona regras e decisões estabelecidas.",
    custaExcesso: "Pode ser rotulado como \"o difícil\" e perder espaço de influência.",
  },
  {
    key: "invisivel",
    nome: "Invisível",
    oQueFaz: "Evita ocupar espaço e chamar atenção.",
    custaExcesso: "Silencia contribuições e talentos que a família precisa.",
  },
  {
    key: "escolhido",
    nome: "Escolhido",
    oQueFaz: "Carrega expectativas explícitas de ser o sucessor ou continuador do legado.",
    custaExcesso: "Pode não sobrar espaço para escolher um caminho próprio.",
  },
  {
    key: "guardiao",
    nome: "Guardião do Legado",
    oQueFaz: "Preserva tradições, valores e a memória da família.",
    custaExcesso: "Pode resistir a mudanças necessárias para a empresa evoluir.",
  },
];

function faixaPapel(pontos) {
  if (pontos >= 4) return { label: "Papel dominante", cor: BLUE };
  if (pontos >= 2) return { label: "Papel secundário", cor: LIGHTBLUE };
  return { label: "Pouco expressado", cor: "#9AA7B4" };
}

const LIVRO_CONTEXTO_F2 = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 02 · Radar de Papéis Ocultos):

PROPÓSITO: trazer à consciência os papéis emocionais (Protetor, Controlador, Pacificador, Herói,
Rebelde, Invisível, Escolhido, Guardião do Legado) que os membros de uma família empresária
assumem, muitas vezes automaticamente, para manter o equilíbrio do sistema familiar. O objetivo
não é eliminar esses papéis, é torná-los visíveis para que cada pessoa escolha, conscientemente,
quais fortalecer e quais soltar.

O QUE RESOLVE: muitos comportamentos que parecem apenas "o jeito de ser" de alguém (controlar
tudo, evitar qualquer atrito, resolver sozinho os problemas da empresa) são papéis assumidos
inconscientemente para manter a estabilidade emocional da família. Isso explica por que a mesma
pessoa reage do mesmo jeito em toda crise, e por que mudar um comportamento isolado raramente
funciona sem entender o papel por trás dele.

OS OITO PAPÉIS (o que fazem e o que custam em excesso):
${PAPEIS.map((p) => `- ${p.nome}: ${p.oQueFaz} Em excesso: ${p.custaExcesso}`).join("\n")}

TRÊS CASOS REAIS DE VALIDAÇÃO:
- Camila (41, diretora administrativa, a Pacificadora): 45 pontos em Pacificador. Nunca discordava
  abertamente em reuniões, dizia "preferir manter a paz", mas os temas evitados se acumulavam. Na
  reflexão, percebeu que isso a impedia de expressar discordâncias importantes sobre decisões
  financeiras. A família criou uma regra: discordâncias técnicas passaram a ser registradas por
  escrito antes da reunião, para que ela não precisasse mediar tudo em tempo real. Em 30 dias, dois
  temas represados há meses foram finalmente discutidos.
- Eduardo (52, CEO, o Controlador): 50 pontos em Controlador. Centralizava a aprovação de quase
  todas as decisões operacionais, a diretoria reclamava de microgestão. Percebeu que o papel, que o
  ajudou a salvar a empresa numa crise antiga, agora impedia os diretores de desenvolverem
  autonomia. Formalizou, com apoio do conselho, três decisões operacionais que passaram a ser
  autônomas da diretoria. Em 60 dias, mais engajamento na diretoria e menos exaustão para ele.
- Bruno (29, sem cargo formal, o Herói): 40 pontos em Herói. Resolvia todas as emergências da
  fábrica a qualquer hora, estava exausto, sentia que "se parar, tudo desmorona". A família percebeu
  que isso impedia a formação de outros líderes operacionais. Criaram um plano para que dois
  supervisores assumissem parte das emergências. Em 90 dias, Bruno teve a primeira semana sem
  nenhuma ligação de emergência fora do horário.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): tratar o papel como rótulo fixo e
definitivo (a pessoa não é o papel, ela o exerce mais em alguns contextos que em outros); preencher
sozinho e nunca compartilhar com a família; usar o papel do outro como acusação; ignorar que quando
um membro muda de papel o sistema familiar inteiro precisa se reajustar; transformar a pontuação em
competição entre pessoas; achar que papéis como Herói e Guardião do Legado são "bons" e Rebelde ou
Invisível são "ruins" — todos têm função e todos têm risco.

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela pessoa,
sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor): "No fundo, a sucessão é menos
sobre transferência de poder e cargos e mais sobre transição de significados. Quem sou eu sem o
negócio? Quem sou eu diante deste legado?" Os papéis emocionais mapeados nesta ferramenta
costumam ser a forma prática, do dia a dia, dessa pergunta maior de identidade.
`.trim();

const PADROES_F3 = [
  {
    key: "centralizacao",
    nome: "Centralização",
    sinais: "Decisões concentradas em uma única pessoa, em mais de uma geração.",
    pergunta: "O sistema funciona sem essa pessoa?",
  },
  {
    key: "falta_dialogo",
    nome: "Falta de diálogo",
    sinais: "Assuntos importantes são sistematicamente evitados.",
    pergunta: "Sobre o que ninguém fala nesta família?",
  },
  {
    key: "conflitos_irmaos",
    nome: "Conflitos entre irmãos",
    sinais: "Competição constante por espaço, reconhecimento ou herança.",
    pergunta: "Estamos competindo ou construindo continuidade?",
  },
  {
    key: "escolha_informal",
    nome: "Escolha informal de sucessores",
    sinais: "Não existem critérios claros para definir quem assume a liderança.",
    pergunta: "A sucessão está sendo construída ou apenas presumida?",
  },
  {
    key: "resistencia_mudanca",
    nome: "Resistência à mudança",
    sinais: "A mesma forma de fazer as coisas se mantém mesmo diante de resultados ruins.",
    pergunta: "Estamos evoluindo ou repetindo por hábito?",
  },
  {
    key: "dependencia_fundador",
    nome: "Dependência do fundador",
    sinais: "Decisões importantes retornam sempre à mesma figura de autoridade original.",
    pergunta: "Estamos formando sucessores ou dependentes?",
  },
];

function interpretaGeracoes(n) {
  if (!n || n <= 1) return { label: "Evento isolado", texto: "ainda não é um padrão, é apenas um evento isolado." };
  if (n === 2) return { label: "Padrão emergente", texto: "já vale atenção, mas ainda pode ser coincidência." };
  return { label: "Padrão estrutural", texto: "profundamente enraizado na história da família." };
}

const LIVRO_CONTEXTO_F3 = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 03 · Linha de Repetição Familiar):

PROPÓSITO: reconstituir a linha do tempo da família e da empresa para identificar comportamentos,
decisões e dinâmicas que se repetem entre gerações, tornando conscientes os padrões que sustentam
a continuidade e os que colocam a continuidade em risco.

O QUE RESOLVE: muitos conflitos que parecem "novos" na família empresária não são realmente novos,
são versões atualizadas de um padrão que já apareceu na geração anterior, e na anterior a essa. Sem
olhar a linha do tempo completa, a família trata cada crise como um evento isolado e repete, sem
perceber, a mesma dinâmica que já causou problemas antes.

OS SEIS PADRÕES MAIS COMUNS (sinais e a pergunta-chave de cada um):
${PADROES_F3.map((p) => `- ${p.nome}: ${p.sinais} Pergunta-chave: "${p.pergunta}"`).join("\n")}

COMO INTERPRETAR O NÚMERO DE GERAÇÕES: 1 geração ainda não é um padrão, é só um evento isolado; 2
gerações é um padrão emergente, já vale atenção mas pode ser coincidência; 3 gerações ou mais é um
padrão estrutural, profundamente enraizado na história da família.

TRÊS CASOS REAIS DE VALIDAÇÃO:
- Família Andrade (padrão de Centralização, 3 gerações: avô, pai e o neto Ricardo): Ricardo prometeu
  liderança mais colaborativa, mas também retinha praticamente todas as aprovações. Ao perguntar "o
  sistema funciona sem essa pessoa?", a resposta foi não para as três gerações — isso tirou o peso
  individual de cima de Ricardo, mostrando um padrão estrutural, não um erro pessoal. Classificaram
  como Interromper: três alçadas de decisão formalmente delegadas em 60 dias.
- Família Bittencourt (padrão de Conflitos entre irmãos, 3 gerações: fundadores brigaram por
  herança, os filhos por sociedade, os netos por espaço — o conteúdo mudou, a forma se repetiu):
  ver os três episódios lado a lado, não como fofoca de família, mudou o tom da conversa. Decidiram
  Transformar: conselho de família com decisão por consenso qualificado, primeiro conflito de
  dividendos resolvido em 90 dias sem ruptura.
- Família Souza (padrão de Escolha informal de sucessores, 2 gerações, prestes a virar a 3ª): o
  filho mais velho "sempre foi óbvio" como sucessor, sem processo formal, gerando ressentimento
  silencioso. A pergunta "a sucessão está sendo construída ou presumida?" expôs que ninguém, nem o
  próprio neto mais velho, tinha sido formalmente consultado. Decidiram Interromper: processo formal
  de avaliação aberto a todos os netos interessados, dois se inscreveram em 45 dias.

PADRÃO COMUM AOS TRÊS CASOS: nomear o padrão como estrutural (não como culpa individual) foi o que
destravou a mudança — a pessoa parou de se sentir "o problema" e passou a ver que estava repetindo
uma herança que ninguém tinha nomeado antes.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): tentar reconstruir a linha do tempo sozinho,
sem ouvir os membros mais velhos da família; buscar quem teve culpa em vez de qual padrão se repete
(é sobre sistema, não sobre culpa individual); parar na identificação do padrão sem chegar à
classificação (Preservar, Transformar ou Interromper); tratar todo padrão repetido como negativo,
quando alguns merecem ser preservados; pular a Reflexão Individual e ir direto para a consolidação
em grupo.

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela pessoa,
sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor): "Essas dores não são exceção, são a
regra. O que aconteceu com essas famílias empresárias não é um ponto fora da curva, é parte de um
padrão que se repete em diversas culturas, setores e gerações."
`.trim();

const PADROES_F4 = [
  {
    key: "concentrada",
    nome: "Autoridade Concentrada",
    sinais: "Uma única pessoa domina praticamente todas as decisões importantes.",
    pergunta: "O sistema funciona sem essa pessoa?",
  },
  {
    key: "difusa",
    nome: "Autoridade Difusa",
    sinais: "Ninguém sabe, com clareza, quem decide cada tipo de assunto.",
    pergunta: "Existe clareza de papéis?",
  },
  {
    key: "paralela",
    nome: "Autoridade Paralela",
    sinais: "Quem ocupa o cargo formalmente não é quem decide na prática.",
    pergunta: "O organograma reflete a realidade?",
  },
  {
    key: "ausente",
    nome: "Autoridade Ausente",
    sinais: "Um tema fica sem dono: ninguém assume a responsabilidade por ele.",
    pergunta: "Quem responde pelos resultados?",
  },
];

const GARGALOS_F4 = ["Contratações", "Investimentos", "Sucessão", "Patrimônio", "Estratégia"];

const LIVRO_CONTEXTO_F4 = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 04 · Matriz de Autoridade Real):

PROPÓSITO: identificar quem realmente influencia, decide e assume responsabilidade dentro da
família empresária, comparando a autoridade formal (o cargo) com a autoridade real (a quem as
pessoas de fato procuram quando precisam decidir), para redesenhar essa estrutura com consciência.

O QUE RESOLVE: muitas famílias empresárias têm organogramas bem desenhados que não refletem como
as decisões realmente acontecem — um diretor tem o cargo, mas quem a equipe procura pra decidir de
verdade é o fundador formalmente aposentado, ou um irmão sem cargo formal nenhum. Essa distância
entre autoridade formal e autoridade real gera lentidão, confusão e conflito.

OS QUATRO PADRÕES DE GARGALO DE AUTORIDADE (sinais e a pergunta-chave de cada um):
${PADROES_F4.map((p) => `- ${p.nome}: ${p.sinais} Pergunta-chave: "${p.pergunta}"`).join("\n")}

TRÊS CASOS REAIS DE VALIDAÇÃO:
- Marcos (diretor comercial, Autoridade Paralela): tinha o cargo formal e a autoridade no papel,
  mas a equipe comercial sistematicamente confirmava decisões importantes com o pai, apenas
  "consultor" sem cargo executivo algum. Ao perguntar "o organograma reflete a realidade?", a
  própria equipe respondeu não, unanimemente. A família formalizou por escrito três categorias de
  decisão comercial exclusivas de Marcos, com o pai se comprometendo a redirecionar a equipe. Em
  45 dias, a equipe já procurava Marcos diretamente na maioria dos casos.
- Fernanda (analista sênior, Autoridade Ausente): depois que a gerente de operações saiu, ninguém
  foi nomeado no lugar. Decisões simples ficavam paradas semanas porque cada um presumia que era
  outra pessoa quem decidiria. O padrão nomeado foi Autoridade Ausente, não Concentrada — o que
  mudou completamente o plano: o problema não era tirar poder de alguém, era criar um dono formal
  pra área. A família promoveu Fernanda a gerente interina, com autoridade formal até certo valor.
  Em 30 dias, o tempo médio de decisão caiu de semanas para dias.
- Osvaldo (fundador formalmente aposentado, Autoridade Concentrada): três anos após formalizar a
  saída da presidência, todas as decisões grandes, mesmo já aprovadas por outros diretores, ainda
  passavam informalmente por ele antes de serem executadas. Confrontado com a própria pontuação
  máxima em influência e decisão, reconheceu que continuava sendo procurado e continuava
  respondendo, mesmo sem querer assumir esse peso publicamente. A família classificou o padrão
  como algo a transformar, não eliminar de uma vez: criou um papel formal de veto em decisões
  patrimoniais específicas, e ele deixou de ser consultado em decisões operacionais. Em 60 dias, o
  número de decisões operacionais que chegavam até ele caiu bastante.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): tratar toda concentração de autoridade
como um problema a ser eliminado de imediato, quando às vezes ela só precisa ser formalizada ou
limitada, não extinta; preencher a matriz sozinho, sem ouvir quem de fato interage com cada pessoa
no dia a dia; confundir Autoridade Ausente (um vazio, ninguém decide) com Autoridade Difusa (uma
confusão, todos acham que decidem); usar a matriz para expor publicamente alguém como "o
problema", em vez de tratar o descompasso como questão estrutural do sistema; redesenhar a
autoridade sem formalizar por escrito, deixando a mudança depender só da boa vontade das pessoas.

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela
pessoa, sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor): "Essas perguntas não se respondem
com planilhas, protocolos ou organogramas. Elas pedem coragem para olhar para dentro."
`.trim();

const ASPECTOS_F5 = [
  "Confiança",
  "Comunicação",
  "Liderança",
  "Autonomia",
  "Capacidade de Delegar",
  "Visão de Futuro",
];

const GERACOES_F5 = [
  { key: "atual", label: "Geração atual", desc: "Fundador(a) ou liderança presente hoje" },
  { key: "proxima", label: "Próxima geração", desc: "Sucessor(a) em processo de assumir" },
];

function interpretaDiferencaF5(diff) {
  const d = Math.abs(diff);
  if (d <= 2) return { label: "Alinhamento", texto: "as duas gerações percebem esse aspecto de forma semelhante." };
  if (d <= 4) return { label: "Vale conversar", texto: "diferença que merece uma conversa estruturada — investiguem a origem dela." };
  return { label: "Desalinhamento relevante", texto: "risco real de conflito geracional se não for endereçado." };
}

function corSemaforoF5(diff) {
  const d = Math.abs(diff);
  if (d <= 2) return "#1E7A3D";
  if (d <= 4) return "#B8860B";
  return "#B3261E";
}

const LIVRO_CONTEXTO_F5 = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 05 · Ponte de Gerações):

PROPÓSITO: compreender como fundadores e sucessores se percebem mutuamente em aspectos centrais
pra continuidade — confiança, comunicação, liderança, autonomia, capacidade de delegar e visão de
futuro — e transformar essas percepções em compromissos concretos entre as gerações.

O QUE RESOLVE: a maior parte dos conflitos geracionais nasce de expectativas nunca verbalizadas —
o fundador acha que o sucessor não tem paciência, o sucessor acha que o fundador não confia nele.
Sem comparar como cada geração avalia a si mesma, a família discute sintomas (uma decisão
específica, uma frase mal interpretada) sem nunca acessar a causa: o gap de percepção entre elas.

COMO INTERPRETAR A DIFERENÇA ENTRE AS NOTAS (escala de 0 a 10 por aspecto): até 2 pontos é
alinhamento (as duas gerações percebem o aspecto de forma semelhante); 3 a 4 pontos indica
necessidade de conversa estruturada (vale investigar a origem da diferença); acima de 4 pontos é
desalinhamento relevante, com risco real de conflito geracional se não for endereçado. O objetivo
não é descobrir qual geração está certa, é compreender como cada uma percebe a realidade, e a
partir daí construir pontes, não vencedores.

TRÊS CASOS REAIS DE VALIDAÇÃO:
- Hélio e Diego (gap de Confiança e Capacidade de Delegar, diferença de 5 pontos): Hélio, fundador,
  achava que Diego tinha pouca paciência pra aprender o negócio; Diego achava que o pai não
  delegava por falta de confiança nele. Ao comparar as notas, os dois ficaram surpresos — nenhum
  jamais tinha verbalizado essas expectativas pro outro. Criaram um plano de delegação progressiva
  com marcos claros, e reuniões mensais de alinhamento. Em 90 dias, Diego assumiu formalmente três
  decisões que antes dependiam da aprovação de Hélio. "A gente nunca tinha dito isso um pro outro.
  Só supunha", disse Diego.
- Marta e Júlia (gap de Comunicação e Visão de Futuro, diferença de 4 pontos): Marta sentia que
  Júlia não valorizava a tradição da empresa; Júlia sentia que a mãe não queria ouvir novas ideias.
  Na consolidação, ficou claro que Marta interpretava as sugestões de Júlia como rejeição ao
  passado, enquanto Júlia via suas ideias como forma de honrar esse passado, atualizando-o.
  Criaram um ritual mensal só pra discutir novas ideias, separado das reuniões operacionais. Em 60
  dias, duas propostas de Júlia foram testadas em pequena escala. "Eu não queria mudar a empresa
  da minha mãe. Queria continuar construindo ela", disse Júlia.
- Família Prado (gap de Autonomia, diferença de 5 pontos, apesar de boa avaliação mútua em
  Liderança): o pai achava que já dava autonomia suficiente ao filho na fábrica; o filho sentia
  que toda decisão relevante ainda precisava da aprovação informal do pai. Definiram por escrito
  três categorias de decisão exclusivas do filho, sem validação prévia. Em 45 dias, o filho
  relatou decidir com mais segurança e menos consultas informais. "Ele achava que já tinha me
  soltado. Eu ainda sentia a mão dele no volante", disse o filho sucessor.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): comparar as notas em busca de quem está
certo, quando o objetivo é compreender as duas percepções, não julgá-las; uma geração preencher a
ficha pela outra, presumindo a resposta, o que invalida a comparação; reagir emocionalmente a
qualquer diferença, mesmo pequena, sem consultar o guia de interpretação antes; tratar as
expectativas listadas como cobranças unilaterais, em vez de ponto de partida pra negociação
conjunta; parar no preenchimento das notas sem avançar pra Consolidação Familiar, perdendo a
chance de transformar percepção em compromisso.

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela
pessoa, sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor): "Ao resistir a compartilhar
decisões, o líder perpetua a dependência da sua presença, e as gerações seguintes não aprendem a
caminhar sozinhas."
`.trim();

const DIMENSOES_ICS = [
  {
    key: "Competência",
    desc: "Conhecimento técnico e experiência prática na área de atuação.",
    exemploAlto: "domina os processos técnicos há anos, resolve problemas complexos sem ajuda.",
    exemploBaixo: "ainda depende de apoio constante pra decisões técnicas do dia a dia.",
  },
  {
    key: "Valores",
    desc: "Alinhamento com os princípios e a cultura da família empresária.",
    exemploAlto: "age de acordo com os princípios da família mesmo quando ninguém está observando.",
    exemploBaixo: "já tomou decisões que contradizem os valores que a família diz defender.",
  },
  {
    key: "Liderança",
    desc: "Capacidade de influenciar, mobilizar e ser seguido por outras pessoas.",
    exemploAlto: "a equipe o procura espontaneamente e segue suas orientações sem resistência.",
    exemploBaixo: "precisa recorrer à autoridade formal do cargo pra ser ouvido pela equipe.",
  },
  {
    key: "Autonomia",
    desc: "Capacidade de tomar decisões e assumir responsabilidades sem depender de aprovação constante.",
    exemploAlto: "decide e age sozinho em situações do seu escopo, sem precisar de aval prévio.",
    exemploBaixo: "consulta antes de decisões que já estariam dentro da sua alçada.",
  },
  {
    key: "Responsabilidade Patrimonial",
    desc: "Capacidade de atuar como guardião consciente do patrimônio da família.",
    exemploAlto: "entende as implicações patrimoniais de decisões grandes antes de agir.",
    exemploBaixo: "ainda não participou de decisões que envolvem o patrimônio da família.",
  },
];

function classificaICS(score) {
  if (score < 40) return { label: "Confiança Baixa", cor: "#B3261E" };
  if (score < 60) return { label: "Confiança Moderada", cor: "#B8860B" };
  if (score < 80) return { label: "Confiança Consistente", cor: "#1E5A96" };
  return { label: "Confiança Elevada", cor: "#1E7A3D" };
}

const LIVRO_CONTEXTO_F6 = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 06 · Índice de Confiança
Sucessória - ICS):

PROPÓSITO: mensurar objetivamente o nível de confiança para a transferência gradual de
responsabilidades, liderança e patrimônio entre gerações, a partir de cinco dimensões, em vez de
depender só de impressão subjetiva ou vontade de acelerar o processo.

O QUE RESOLVE: "confiamos nele" ou "ainda não é hora" são afirmações vagas baseadas em impressão,
não em critério. Isso leva famílias a acelerar demais uma transição pra qual o sucessor ainda não
estava pronto, ou a atrasar demais uma transição que já poderia acontecer. O ICS transforma
confiança em um número comparável ao longo do tempo, dividido em dimensões que podem ser
desenvolvidas uma a uma.

MÉTODO: o ICS é a média simples das notas (0 a 100) atribuídas a cinco dimensões: Competência,
Valores, Liderança, Autonomia e Responsabilidade Patrimonial.

COMO INTERPRETAR O RESULTADO FINAL: 0 a 39 pontos é Confiança Baixa; 40 a 59 é Confiança
Moderada; 60 a 79 é Confiança Consistente; 80 a 100 é Confiança Elevada. O ICS faz parte de uma
família de quatro índices numéricos do método (junto com o Índice de Autenticidade da Escolha, o
Índice de Maturidade Familiar e o Índice de Equilíbrio Sistêmico), pensados pra acompanhar a
evolução da família ao longo do tempo com os mesmos critérios.

TRÊS CASOS REAIS DE VALIDAÇÃO:
- Família Oliveira (ICS 72, Confiança Consistente): o fundador Carlos queria iniciar a transição
  pro filho Rafael, 34 anos. Competência (88) e Valores (92) estavam altos, mas Autonomia (54) e
  Responsabilidade Patrimonial (58) eram os pontos mais baixos — não era um problema de
  capacidade técnica, era falta de prática em decidir sozinho e em temas patrimoniais. A família
  ampliou gradualmente as responsabilidades de Rafael e incluiu ele em fóruns patrimoniais, com
  meta de elevar o ICS de 72 para 85 em 12 meses.
- Família Menezes (ICS 38, Confiança Baixa): Beatriz, 26 anos, entrou direto numa posição de
  coordenação por ser a única filha interessada no negócio. A família já cogitava promovê-la à
  diretoria em poucos meses. O ICS baixo em praticamente todas as dimensões evitou uma decisão
  precipitada: em vez de avançar o cargo, estruturaram um período formal de mentoria de 18 meses,
  com metas trimestrais por dimensão. "Foi mais difícil ouvir o número do que eu esperava. Mas
  foi mais fácil aceitar um plano do que uma sensação vaga de que eu não estava pronta", disse
  Beatriz.
- Família Vasconcelos (ICS 87, Confiança Elevada): Camila, 38 anos, já ocupava a vice-presidência
  executiva há cinco anos, assumindo na prática boa parte das decisões estratégicas. O ICS alto
  em todas as dimensões confirmou, com dados, o que a família já sentia mas nunca tinha
  formalizado — ela estava pronta havia tempo. A família antecipou em 8 meses a posse formal de
  Camila, com o fundador migrando pra um conselho consultivo com poder de veto só em decisões
  patrimoniais. "O número não me deu a confiança. Ele só mostrou a confiança que já existia, e
  que a gente tinha medo de admitir", disse o fundador.

O QUE OS TRÊS CASOS VALIDAM: o mesmo instrumento orientou três decisões completamente diferentes
(acelerar, pausar e confirmar), porque a decisão certa depende do número real, não da intuição
isolada de quem está mais próximo ou mais distante emocionalmente do sucessor.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): tratar o ICS como veredito definitivo e
permanente, quando deve ser medido periodicamente; deixar uma única pessoa (geralmente o
fundador) preencher a avaliação sozinha, sem contribuição de quem convive com o sucessor; usar o
resultado como arma em discussões familiares, em vez de ponto de partida pra desenvolvimento;
focar só na média final e ignorar as cinco dimensões individualmente; definir metas de evolução
sem prazo nem plano de desenvolvimento concreto.

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela
pessoa, sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor): "Histórias são revisitadas,
decisões são discutidas e pactos começam a ser construídos. Mais do que reuniões, são momentos de
construção de confiança."
`.trim();

const ETAPAS_CLARO = [
  {
    letra: "C",
    nome: "Contextualizar",
    fazer: "Definir o tema, a importância e o motivo da conversa antes de começar.",
    cuidado: "Não iniciar a conversa sem que todos saibam exatamente sobre o que ela é.",
  },
  {
    letra: "L",
    nome: "Levantar Percepções",
    fazer: "Ouvir todos os participantes, sem interromper e sem julgar.",
    cuidado: "Resistir à vontade de responder ou se defender antes de todos falarem.",
  },
  {
    letra: "A",
    nome: "Alinhar Interesses",
    fazer: "Identificar objetivos e interesses em comum entre os participantes.",
    cuidado: "Não pular esta etapa: é ela que sustenta a resolução das divergências.",
  },
  {
    letra: "R",
    nome: "Resolver Divergências",
    fazer: "Trabalhar cada ponto de discordância de forma estruturada.",
    cuidado: "Separar o que é negociável do que não é, antes de tentar resolver.",
  },
  {
    letra: "O",
    nome: "Organizar Próximos Passos",
    fazer: "Transformar a conversa em decisões, responsáveis e prazos.",
    cuidado: "Registrar tudo por escrito, decisões faladas se perdem com o tempo.",
  },
];

const STATUS_ACAO_F7 = ["Não iniciado", "Em andamento", "Concluído"];

const LIVRO_CONTEXTO_F7 = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 07 · Protocolo CLARO):

PROPÓSITO: estruturar conversas difíceis — sobre sucessão, remuneração, dividendos, venda da
empresa ou qualquer tema sensível — em um processo claro de cinco etapas, pra que elas terminem
em decisão e compromisso, não em mais um ciclo de discussão sem resolução.

O QUE RESOLVE: muitas famílias empresárias evitam conversas importantes porque, historicamente,
elas sempre terminam em conflito, silêncio ou impasse. Sem uma estrutura, a conversa vira disputa
de quem fala mais alto ou de quem cede primeiro. O Protocolo CLARO separa etapas — ouvir, alinhar,
resolver, decidir — que normalmente se misturam de forma caótica numa conversa difícil sem
estrutura.

AS CINCO ETAPAS (a ordem importa — cada etapa só deve começar depois que a anterior foi
concluída):
${ETAPAS_CLARO.map((e) => `- ${e.letra} — ${e.nome}: ${e.fazer} Cuidado: ${e.cuidado}`).join("\n")}

TRÊS CASOS REAIS DE VALIDAÇÃO (em todos, a etapa Alinhar Interesses foi o ponto de virada — não
porque eliminou a divergência, mas porque revelou que ela era menor e mais tratável do que a
briga que vinha causando):
- Família Andrade (disputa pela liderança): dois irmãos sócios disputavam a liderança há anos,
  com conversas terminando em portas batendo e silêncios de semanas. Na etapa Alinhar Interesses,
  reconheceram pela primeira vez em voz alta que os dois queriam a mesma coisa: preservar a
  empresa e a união familiar. A divergência real — o modelo de liderança — foi separada da
  disputa pessoal e tratada como questão técnica. Resultado: conselho consultivo criado, com
  critérios objetivos de liderança, prazo de 60 dias pra formalizar.
- Irmãs Ferraz (remuneração desigual): duas irmãs com cargos e remunerações diferentes guardavam
  ressentimento havia anos, sem nunca ter discutido abertamente. Na etapa Alinhar Interesses,
  perceberam que o interesse comum não era "ganhar o mesmo", era ter um critério claro e público,
  mesmo que os valores finais continuassem diferentes. Resultado: contratação de consultoria de
  cargos e salários, com política formal esperada em 90 dias. "A gente não discordava do valor.
  Discordava do critério, e nunca tinha dito isso em voz alta", disse uma das irmãs.
- Família Bezerra (vender ou não vender): diante de uma proposta de compra, a família se dividiu
  entre vender e manter o negócio, com reuniões virando torcida organizada. Na etapa Alinhar
  Interesses, perceberam que o objetivo comum de todos era a segurança financeira de longo prazo
  — vender ou manter eram só dois caminhos possíveis pro mesmo objetivo, vistos até então como
  posições morais opostas. Resultado: contratação de avaliação profissional independente antes de
  decidir. "A gente discutia se devia vender. Devíamos era decidir o que realmente queríamos
  proteger", disse um membro da família.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): pular direto pra Resolver Divergências
sem ter feito Contextualizar e Levantar Percepções, perdendo a base da conversa; confundir
Alinhar Interesses com concordar em tudo — alinhar interesses é achar o objetivo comum, não
eliminar divergências reais; deixar a etapa Organizar Próximos Passos apenas verbal, sem
registrar por escrito decisões, responsáveis e prazos; permitir que uma pessoa domine o tempo de
fala; usar o protocolo pra temas que exigem mediação profissional especializada, quando o apoio
de um terceiro qualificado é indispensável (ex.: segurança pessoal em risco).

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela
pessoa, sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor): "O silêncio custa caro. Evitar
conversas por medo de conflito é um erro clássico. O que parece paz é apenas calmaria
superficial."
`.trim();

const TEMAS_SEMAFORO_F8 = [
  "Reconhecimento",
  "Remuneração",
  "Promoções",
  "Participação societária",
  "Entrada de familiares na empresa",
  "Escolha de sucessores",
  "Distribuição de dividendos",
  "Conflitos antigos",
  "Falta de comunicação",
  "Decisões consideradas injustas",
];

const CORES_SEMAFORO_F8 = {
  verde: { label: "Verde", cor: "#1E7A3D", desc: "Tema resolvido ou que não gera desconforto significativo." },
  amarelo: { label: "Amarelo", cor: "#B8860B", desc: "Tema que merece atenção antes de se transformar em conflito." },
  vermelho: { label: "Vermelho", cor: "#B3261E", desc: "Tema que já está impactando relacionamentos, confiança ou decisões." },
};

const LIVRO_CONTEXTO_F8 = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 08 · Semáforo dos Temas
Sensíveis):

PROPÓSITO: identificar ressentimentos silenciosos, frustrações acumuladas e temas não resolvidos
que podem comprometer a continuidade da família empresária, classificando-os por prioridade de
atenção, pra que sejam tratados antes de se tornarem conflitos abertos ou decisões travadas.

O QUE RESOLVE: muita coisa que parece "só o jeito da família ser" — um clima meio tenso em certas
reuniões, uma decisão que sempre esbarra no mesmo obstáculo — na verdade é ressentimento acumulado
que nunca foi nomeado. O Semáforo oferece um sistema simples (verde, amarelo, vermelho) pra nomear
o que está, e o que não está, resolvido de verdade.

GUIA DE INTERPRETAÇÃO DAS CORES:
- Verde: tema resolvido ou que não gera desconforto significativo hoje. Nenhuma ação necessária.
- Amarelo: tema que merece atenção antes de se transformar em conflito aberto. Monitorar de
  perto e considerar uma conversa preventiva.
- Vermelho: tema que já está impactando relacionamentos, confiança ou decisões. Tratar com
  prioridade, geralmente com o Protocolo CLARO (Ferramenta 07).

O DADO MAIS REVELADOR NÃO É A COR ISOLADA, É A DIFERENÇA: quando pessoas diferentes da mesma
família avaliam o mesmo tema com cores diferentes, essa diferença — mais do que qualquer vermelho
isolado — costuma apontar exatamente onde a conversa precisa acontecer. A quantidade de temas
vermelhos é menos importante que a disposição da família pra tratá-los: uma família com três
vermelhos e disposição real de conversar está em posição melhor que uma família com um vermelho
só que ninguém quer tocar.

TRÊS CASOS REAIS DE VALIDAÇÃO:
- Família Rangel (escolha do sucessor): Tiago foi escolhido presidente, aceito por todos na
  aparência, mas o irmão mais novo Bruno marcou "Escolha de sucessores" como vermelho, enquanto
  Tiago marcou como verde. Essa diferença sozinha revelou mais que dois anos de pequenos atritos
  indiretos nunca nomeados. Resultado: conversa estruturada pelo Protocolo CLARO especificamente
  sobre o CRITÉRIO de escolha, não sobre a escolha em si.
- Sócios Coutinho (remuneração e reconhecimento): dois primos sócios, um operador e um
  investidor. O sócio operador marcou "Remuneração" e "Reconhecimento" como vermelho; o
  investidor, como verde. A virada: o desconforto do operador não era sobre valor em dividendos,
  era sobre reconhecimento do esforço diário, nunca nomeado nas conversas sobre números.
  Resultado: relatório trimestral de contribuição operacional criado. "Eu não queria mais
  dinheiro. Queria que alguém dissesse que via o que eu fazia", disse o sócio operador.
- Família Salgado (decisão antiga considerada injusta): uma irmã sentia, há mais de 15 anos, que
  a divisão de um imóvel herdado favoreceu os outros dois irmãos — nunca reaberto por medo de
  parecer mesquinha. Ela marcou "Decisões consideradas injustas" como vermelho; os irmãos, como
  verde, sem sequer saber que o tema ainda estava aberto. Resultado: revisão formal do
  entendimento patrimonial com apoio jurídico, mesmo sem alterar a divisão original. "Eu não
  queria desfazer a divisão. Só queria que alguém admitisse que doeu", disse a irmã.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): achar que o objetivo é zerar todos os
vermelhos de uma vez — a prioridade certa é escolher por onde começar, não resolver tudo
simultaneamente; preencher tentando adivinhar a percepção do outro, em vez de registrar a própria
percepção com sinceridade; comparar respostas de forma competitiva — quem marcou mais vermelhos
não sofre mais, a diferença é informação, não ranking; aplicar sozinho e nunca compartilhar os
resultados, perdendo justamente o efeito de comparação; tratar um Amarelo como se fosse Verde só
porque é mais confortável não falar sobre ele — Amarelo é aviso, não deve ser ignorado.

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela
pessoa, sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor): "Chegamos às cicatrizes ocultas.
Os ressentimentos antigos, comparações, rivalidades entre irmãos e/ou primos e expectativas não
atendidas são feridas emocionais que, se não atendidas, têm o poder de boicotar o processo."
`.trim();

const FREQUENCIAS_F9 = ["Diária", "Semanal", "Mensal", "Rara"];
const CONFIANCAS_F9 = ["Alta", "Média", "Baixa"];

const TIPOS_COMUNICACAO_F9 = {
  saudavel: { label: "Saudável", cor: "#1E7A3D", linha: "solida" },
  dificil: { label: "Difícil", cor: "#B8860B", linha: "tracejada" },
  inexistente: { label: "Inexistente", cor: "#B3261E", linha: "pontilhada" },
};

const TIPOS_RUIDO_F9 = ["Triangulação", "Silêncio", "Aliança não declarada", "Conflito recorrente"];

const LIVRO_CONTEXTO_F9 = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 09 · Mapa de Ruídos
Relacionais):

PROPÓSITO: identificar como a comunicação realmente acontece dentro da família empresária,
revelando ruídos, silêncios, triangulações, alianças e padrões relacionais que podem impactar a
confiança, a tomada de decisão e a continuidade do legado.

O QUE RESOLVE: famílias empresárias costumam ter reuniões formais onde tudo parece funcionar
bem, enquanto a comunicação real acontece em conversas paralelas, alianças não declaradas e
silêncios estratégicos. Sem mapear essa rede real de comunicação, decisões importantes continuam
sendo influenciadas por canais informais que ninguém reconhece oficialmente.

O SOCIOGRAMA: transforma percepções em algo visual — linha contínua indica comunicação saudável,
linha tracejada indica comunicação difícil, linha pontilhada indica comunicação inexistente. A
leitura busca três padrões: centralidade (quem concentra o maior número de conexões), isolamento
(quem tem poucas ou nenhuma conexão direta) e triangulação (duas pessoas que se comunicam
principalmente através de uma terceira).

TRÊS CASOS REAIS DE VALIDAÇÃO:
- Família Prado (triangulação entre irmãs): o fundador, já formalmente afastado, continuava
  sendo o principal canal de comunicação entre as duas filhas sócias, que raramente conversavam
  diretamente entre si. A comunicação entre as duas foi classificada como inexistente, e a de
  cada uma com o pai como saudável — uma triangulação clássica no sociograma. Resultado: canal de
  comunicação direta mensal criado entre as duas irmãs, sem intermediação do pai. "A gente não
  tinha um problema entre nós duas. Tinha um hábito de conversar através dele", disse uma delas.
- Diretor executivo (influência indireta): um diretor de confiança do fundador, sem vínculo
  familiar, tinha na prática mais influência sobre decisões estratégicas do que o próprio filho
  sucessor formalmente nomeado. O sucessor percebeu que sua dificuldade não era falta de
  competência técnica, era a ausência de um canal direto com essa figura-chave. Resultado:
  reuniões trimestrais estruturadas entre sucessor e diretor, mediadas por facilitador externo.
  "Eu competia com um organograma que não existia no papel, mas existia na prática", disse o
  sucessor.
- Genro isolado (isolamento estrutural): um genro, sócio por casamento, aparecia no sociograma
  sem nenhuma linha direta com o fundador, conectado só à esposa. O isolamento não era pessoal,
  era estrutural: a família nunca tinha decidido formalmente o papel de cônjuges na governança.
  Resultado: fórum específico criado para sócios por casamento, com regras claras de em quais
  temas eles têm voz. "Eu não queria decidir tudo. Só queria parar de descobrir as coisas por
  último", disse o genro.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): fazer o mapeamento sozinho, baseado só
na própria percepção, sem cruzar com a visão de outros participantes; usar o sociograma como
instrumento de vigilância sobre quem fala com quem, em vez de diagnóstico coletivo; tratar toda
triangulação como prejudicial — algumas são temporárias e até necessárias em transições; parar no
diagnóstico e nunca formalizar os pactos de comunicação que deveriam nascer dele; excluir do
mapeamento pessoas não familiares com grande influência, como executivos e conselheiros.

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela
pessoa, sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor): "A comunicação cura silêncios! Em
empresas familiares, a forma é tão importante quanto o conteúdo. A falta de conversa cria
fantasmas, enquanto a conversa malfeita gera feridas."
`.trim();

const TEMAS_QUERO_F10 = [
  "Liderança",
  "Gestão Empresarial",
  "Empreendedorismo",
  "Finanças",
  "Comercial",
  "Operações",
  "Inovação",
  "Tecnologia",
  "Pessoas e Cultura",
  "Marketing",
  "Projetos Sociais",
  "Sustentabilidade",
];

const COMPETENCIAS_F10 = [
  "Visão de Negócio",
  "Comunicação",
  "Liderança",
  "Trabalho em Equipe",
  "Capacidade Analítica",
  "Inteligência Emocional",
  "Organização",
  "Tomada de Decisão",
];

function combinacaoBussolaF10(quero, competencia, precisa) {
  const chave = `${quero}-${competencia}-${precisa}`;
  const tabela = {
    "true-true-true": {
      label: "Forte aderência",
      cor: "#1E7A3D",
      texto: "Interesse, preparo e necessidade convergem. É a combinação mais sólida das oito.",
    },
    "true-false-true": {
      label: "Desenvolvimento necessário",
      cor: "#B8860B",
      texto: "O interesse existe e a empresa precisa, mas a competência ainda precisa ser construída.",
    },
    "false-true-true": {
      label: "Risco de sucessão forçada",
      cor: "#B3261E",
      texto: "Há preparo e a empresa precisa, mas não há desejo real — risco de herdar um problema disfarçado de solução.",
    },
    "false-false-true": {
      label: "Desalinhamento elevado",
      cor: "#B3261E",
      texto: "Nem interesse nem preparo, mas a posição está em aberto. Merece atenção direta da família.",
    },
    "true-true-false": {
      label: "Talento disponível sem demanda atual",
      cor: "#1E5A96",
      texto: "Interesse e preparo existem, mas a empresa não precisa disso agora. Pode ser um caminho para o futuro.",
    },
    "true-false-false": {
      label: "Interesse pessoal sem urgência",
      cor: "#1E5A96",
      texto: "Espaço para desenvolver sem pressão imediata, já que a empresa não precisa disso agora.",
    },
    "false-true-false": {
      label: "Competência sem direção",
      cor: "#5A6B7A",
      texto: "Talento real que pode ser usado fora da empresa, sem gerar conflito nem obrigação.",
    },
    "false-false-false": {
      label: "Nenhuma aderência",
      cor: "#5A6B7A",
      texto: "Caminho claro para fora da empresa, sem tensão nem culpa.",
    },
  };
  return tabela[chave];
}

const LIVRO_CONTEXTO_F10 = `
Contexto do método (livro "Arquitetura da Sucessão", Ferramenta 10 · Bússola da Escolha
Profissional):

PROPÓSITO: ajudar membros da nova geração a compreenderem sua relação com a empresa familiar,
diferenciando expectativas familiares, vocação pessoal, competências, interesses e projeto de
vida, pra que a escolha profissional seja consciente, e não apenas uma obrigação presumida.

O QUE RESOLVE: muitos fundadores acreditam que seus filhos desejam assumir o negócio. Muitos
herdeiros acreditam que precisam assumir o negócio. Nenhuma dessas duas crenças costuma ser
verificada de fato, e a confusão entre expectativa, vocação, competência e necessidade real da
empresa está por trás de boa parte das sucessões que não funcionam bem no longo prazo. A Bússola
separa com clareza o que o sucessor quer, o que ele já sabe fazer, e o que a empresa de fato
precisa — três perguntas que raramente são feitas separadamente.

AS OITO COMBINAÇÕES (Quero / Tenho competência / A família precisa):
- Sim/Sim/Sim: Forte aderência — interesse, preparo e necessidade convergem.
- Sim/Não/Sim: Desenvolvimento necessário — o interesse existe, a competência ainda precisa ser
  construída.
- Não/Sim/Sim: Risco de sucessão forçada — há preparo, mas não há desejo real.
- Não/Não/Sim: Desalinhamento elevado — nem interesse nem preparo, mas a posição está em aberto.
- Sim/Sim/Não: Talento disponível sem demanda atual — pode ser um caminho para o futuro.
- Sim/Não/Não: Interesse pessoal sem urgência — espaço para desenvolver sem pressão imediata.
- Não/Sim/Não: Competência sem direção — talento que pode ser usado fora da empresa, sem conflito.
- Não/Não/Não: Nenhuma aderência — caminho claro para fora da empresa, sem tensão nem culpa.

IMPORTANTE: Desenvolvimento Necessário e Risco de Sucessão Forçada NÃO são a mesma coisa — são
interpretações diferentes, com planos de ação opostos. A primeira significa investir em preparo
porque o desejo já existe; a segunda significa abrir mão da expectativa de que essa pessoa assuma
esse papel, mesmo tendo competência, porque falta o desejo genuíno que sustenta uma liderança de
longo prazo.

TRÊS CASOS REAIS DE VALIDAÇÃO:
- Pedro Martins (desalinhamento com direção clara): único filho homem, visto por todos como
  sucessor natural da presidência, sem nunca ter se perguntado se realmente queria. Notas altas
  em Tecnologia e Inovação, baixas em Gestão Empresarial e Liderança; competências técnicas
  fortes, competências de gestão geral limitadas. A combinação real era mais próxima de
  "desenvolvimento necessário" em tecnologia do que aderência à presidência. Resultado: cargo de
  diretor de tecnologia e inovação criado especificamente para ele, enquanto a família iniciou
  separadamente uma busca por liderança executiva geral.
- Luiza (desenvolvimento necessário): 24 anos, desejava fortemente assumir a diretoria comercial,
  cargo em aberto, mas ainda com pouca experiência prática de mercado. Notas altas em Comercial e
  Liderança, baixas em Capacidade Analítica e Tomada de Decisão; a família confirmou que a
  diretoria realmente precisava ser preenchida. Resultado: plano de desenvolvimento de dois anos,
  com passagem por áreas operacionais e comerciais antes da assunção formal, com marcos a cada
  seis meses. "Prefiro esperar dois anos preparada do que assumir despreparada", disse Luiza.
- Enzo (risco de sucessão forçada): ótimo desempenho em praticamente qualquer área, mas nunca
  demonstrou entusiasmo real pela empresa da família. Pontuou alto em quase todas as
  competências, mas suas notas mais altas de interesse foram em Projetos Sociais e
  Sustentabilidade, temas distantes do núcleo operacional. Resultado: busca por liderança
  executiva profissional externa para a presidência, enquanto a família apoiou Enzo a estruturar
  um projeto de sustentabilidade dentro do próprio grupo. "Eu sempre fui bom no que faziam eu
  fazer. Ninguém tinha perguntado se eu queria fazer aquilo", disse Enzo.

ERROS COMUNS A EVITAR (nunca sugerir isso como caminho): aplicar a ferramenta já com a resposta
decidida de antemão, tentando confirmar uma escolha em vez de investigá-la genuinamente; ignorar
a pergunta "a família precisa disso", tratando a escolha como puramente individual; ignorar as
perguntas "quero" e "tenho competência", tratando a escolha como puramente uma questão de
necessidade da empresa; tratar Desenvolvimento Necessário e Risco de Sucessão Forçada como a
mesma coisa; tratar o resultado como definitivo para sempre — interesses e competências evoluem
ao longo do tempo, vale reaplicar periodicamente.

TOM: direto, acolhedor, sem clichês de autoajuda, sem jargão terapêutico. Nunca decidir pela
pessoa, sempre apontar um próximo passo concreto e pequeno.

CONTEXTO ADICIONAL (livro "Herança sem Dono", do mesmo autor): "Vivem sob a sombra de narrativas
de sacrifício, carregam culpas herdadas e tentam provar legitimidade em um palco em que cada
passo parece um teste."
`.trim();

async function supabaseInsert(table, row) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Supabase ${table}: ${response.status} ${errText}`);
  }
  return true;
}

const FERRAMENTAS_CATALOGO = [
  {
    letra: "M",
    etapa: "Mentalidade e Consciência",
    categoria: "Bastidores da Sucessão",
    cor: NAVY,
    ferramentas: [
      { n: 1, nome: "Raízes das Lealdades Invisíveis", ativa: true },
      { n: 2, nome: "Radar de Papéis Ocultos", ativa: true },
      { n: 3, nome: "Linha de Repetição Familiar", ativa: true },
    ],
  },
  {
    letra: "V",
    etapa: "Validação e Confiança",
    categoria: "Liderança Intergeracional",
    cor: "#3A6FA8",
    ferramentas: [
      { n: 4, nome: "Matriz de Autoridade Real", ativa: true },
      { n: 5, nome: "Ponte de Gerações", ativa: true },
      { n: 6, nome: "Índice de Confiança Sucessória", ativa: true },
    ],
  },
  {
    letra: "O",
    etapa: "Objetividade e Clareza",
    categoria: "Conversas Difíceis e Alinhamento",
    cor: BLUE,
    ferramentas: [
      { n: 7, nome: "Protocolo CLARO", ativa: true },
      { n: 8, nome: "Semáforo dos Temas Sensíveis", ativa: true },
      { n: 9, nome: "Mapa de Ruídos Relacionais", ativa: true },
    ],
  },
  {
    letra: "E",
    etapa: "Estratégia de Direção",
    categoria: "Identidade, Carreira e Legado",
    cor: "#2E7D32",
    ferramentas: [
      { n: 10, nome: "Bússola da Escolha Profissional", ativa: false },
      { n: 11, nome: "Teste da Escolha Autêntica", ativa: false },
      { n: 12, nome: "Escada do Legado", ativa: false },
    ],
  },
  {
    letra: "R",
    etapa: "Regras de Continuidade",
    categoria: "Governança Humana e Continuidade",
    cor: LIGHTBLUE,
    ferramentas: [
      { n: 13, nome: "Acordo de Continuidade Familiar", ativa: false },
      { n: 14, nome: "Termômetro da Maturidade Familiar", ativa: false },
      { n: 15, nome: "Radar de Equilíbrio Sistêmico", ativa: false },
    ],
  },
];

const QUADRANTS = [
  {
    key: "familia",
    name: "Família",
    color: NAVY,
    question: "o quanto essa relação pesa nessa decisão",
    items: ["Meu pai", "Minha mãe", "Meus irmãos", "Meu cônjuge", "Meus filhos"],
    example:
      "Você pode adorar sua mãe, mas se ela nunca opinou sobre sua carreira, a nota aqui é baixa. Por outro lado, pode ter uma relação distante com um irmão, mas se você evita certas decisões só pra não parecer que está competindo com ele, a nota é alta.",
  },
  {
    key: "negocio",
    name: "Negócio",
    color: BLUE,
    question: "o quanto esse vínculo com a empresa pesa nessa decisão",
    items: ["Sonho do fundador", "História da empresa", "Colaboradores antigos", "Clientes históricos", "Marca da família"],
    example:
      "Você pode ter orgulho da história da empresa sem isso pesar nessa decisão específica, nota baixa. Mas se você evita mudar um processo antigo por imaginar a reação de quem está lá desde o início, a nota é alta.",
  },
  {
    key: "patrimonio",
    name: "Patrimônio",
    color: "#3A6FA8",
    question: "o quanto isso pesa nessa decisão",
    items: ["Segurança financeira", "Preservação patrimonial", "Distribuição futura da riqueza", "Crescimento patrimonial", "Independência financeira pessoal"],
    example:
      "Você pode não pensar muito em dinheiro no dia a dia, nota baixa. Mas se o medo de comprometer a reserva da família está te fazendo adiar um investimento necessário, a nota é alta.",
  },
  {
    key: "projeto",
    name: "Projeto de Vida",
    color: LIGHTBLUE,
    question: "o quanto isso pesa nessa decisão",
    items: ["Liberdade de escolha", "Objetivos profissionais", "Realização pessoal", "Estilo de vida desejado", "Saúde e bem-estar pessoal"],
    example:
      "Você pode ter um objetivo pessoal que ama, mas que não tem nada a ver com essa decisão, nota baixa. Mas se abrir mão dele é exatamente o preço dessa escolha, a nota é alta.",
  },
];

const UNLOCK_GUIDANCE = {
  familia:
    "Essa lealdade provavelmente nunca foi dita em voz alta. O primeiro passo é nomear, por escrito, o que você imagina que essa pessoa esperaria de você, e depois checar se isso é real ou uma suposição sua.",
  negocio:
    "Você pode estar carregando uma expectativa que nem foi formalmente colocada por ninguém. Vale separar o que é sobre preservar a empresa do que é sobre preservar uma forma específica de fazer as coisas.",
  patrimonio:
    "Quando o patrimônio pesa mais do que uma estratégia, geralmente tem medo por trás, não cálculo. Vale nomear especificamente o que você teme perder, e checar se esse risco é real ou imaginado.",
};

const MARINA_EXEMPLO = {
  role: "herdeiro",
  decisao: "Assumir a diretoria-geral ou continuar adiando",
  scores: {
    familia: { "Meu pai": 5, "Minha mãe": 2, "Meus irmãos": 1, "Meu cônjuge": 1, "Meus filhos": 0 },
    negocio: {
      "Sonho do fundador": 4,
      "História da empresa": 3,
      "Colaboradores antigos": 2,
      "Clientes históricos": 1,
      "Marca da família": 2,
    },
    patrimonio: {
      "Segurança financeira": 1,
      "Preservação patrimonial": 1,
      "Distribuição futura da riqueza": 0,
      "Crescimento patrimonial": 1,
      "Independência financeira pessoal": 1,
    },
    projeto: {
      "Liberdade de escolha": 1,
      "Objetivos profissionais": 1,
      "Realização pessoal": 1,
      "Estilo de vida desejado": 1,
      "Saúde e bem-estar pessoal": 1,
    },
  },
  reflexao: {
    descoberta: "Que a lealdade ao meu pai pesava mais nessa decisão do que minha própria carreira.",
    conviccao: "Tomar decisões técnicas difíceis sozinha, sem esperar aprovação de ninguém.",
    obrigacao: "Adiar a diretoria-geral, esperando um sinal do meu pai que nunca vinha.",
  },
  consolidacao: {
    descoberta:
      "Assumir o cargo me parecia, sem eu perceber, uma forma de apagar o lugar que meu pai sempre ocupou sozinho.",
    impacto:
      "Meu pai revelou que nunca esperou que eu liderasse do jeito dele, e sim com o próprio estilo. Isso mudou a conversa inteira.",
  },
  decisaoFinal: {
    classificacao: "transformar",
    como: "Eu proporia que meu pai participasse como conselheiro estratégico, com reuniões mensais, em vez de comandar diretamente. Mas isso é uma proposta minha, precisa ser conversada com ele antes de qualquer coisa.",
  },
  plano: [
    {
      id: 1,
      acao: "Comunicar ao pai e ao conselho a intenção de assumir a diretoria-geral em breve.",
      responsavel: "Marina",
      prazo: "15 dias",
    },
    {
      id: 2,
      acao: "Assumir formalmente a diretoria-geral, com modelo de liderança próprio.",
      responsavel: "Marina",
      prazo: "45 dias",
    },
    {
      id: 3,
      acao: "Revisar com o pai, já como conselheiro, os primeiros 90 dias de gestão.",
      responsavel: "Marina e o pai",
      prazo: "135 dias",
    },
  ],
  alinhamento: {
    fazSentido: true,
    faltaAlgo: "",
    comoParticipar: "Meu pai participa das reuniões mensais de transição, como conselheiro.",
  },
};

const FUNDADOR_EXEMPLO = {
  role: "fundador",
  decisao: "Delegar o comando da empresa para o sucessor, ou continuar segurando",
  scores: {
    familia: { "Meu pai": 1, "Minha mãe": 1, "Meus irmãos": 1, "Meu cônjuge": 2, "Meus filhos": 3 },
    negocio: {
      "Sonho do fundador": 5,
      "História da empresa": 4,
      "Colaboradores antigos": 3,
      "Clientes históricos": 2,
      "Marca da família": 5,
    },
    patrimonio: {
      "Segurança financeira": 2,
      "Preservação patrimonial": 3,
      "Distribuição futura da riqueza": 2,
      "Crescimento patrimonial": 2,
      "Independência financeira pessoal": 2,
    },
    projeto: {
      "Liberdade de escolha": 2,
      "Objetivos profissionais": 1,
      "Realização pessoal": 1,
      "Estilo de vida desejado": 1,
      "Saúde e bem-estar pessoal": 2,
    },
  },
  picoEscolhido: "Sonho do fundador",
  baixaEscolhida: "Objetivos profissionais",
  reflexao: {
    descoberta: "Eu nunca separei quem eu sou do que eu construí.",
    conviccao: "Proteger o legado da empresa e da marca da família.",
    obrigacao: "Manter todas as aprovações comigo, achando que ninguém mais dá conta do jeito que eu dou.",
  },
  consolidacao: {
    descoberta: "Percebi, na frente da família, que não sei responder quem eu seria fora da empresa.",
    impacto:
      "Combinamos começar por um período de transição, com aprovações compartilhadas, em vez de uma troca de uma vez só.",
  },
  decisaoFinal: {
    classificacao: "transformar",
    como:
      "Eu proporia criar um papel de conselheiro, ou guardião do legado, mantendo alguma proximidade sem segurar as aprovações do dia a dia. Isso precisa ser conversado com o sucessor, não decidido sozinho.",
  },
  plano: [
    {
      id: 1,
      acao: "Comunicar ao conselho e à diretoria a intenção de iniciar a transição de aprovações.",
      responsavel: "Antônio",
      prazo: "15 dias",
    },
    {
      id: 2,
      acao: "Transferir formalmente as aprovações de pagamento ao sucessor, começando por um período de transição supervisionada.",
      responsavel: "Antônio, com o sucessor",
      prazo: "90 dias",
    },
    {
      id: 3,
      acao: "Formalizar o papel de conselheiro/guardião do legado para Antônio junto ao conselho.",
      responsavel: "Antônio e o conselho",
      prazo: "120 dias",
    },
  ],
  alinhamento: {
    fazSentido: true,
    faltaAlgo: "",
    comoParticipar: "O sucessor participa da definição do período de transição.",
  },
};

const ROLES = [
  { key: "fundador", label: "Fundador(a)", desc: "Você criou ou lidera o negócio hoje" },
  { key: "herdeiro", label: "Herdeiro(a) / Sucessor(a)", desc: "Você é filho(a) ou próxima geração" },
  { key: "conjuge", label: "Cônjuge", desc: "Seu parceiro(a) é fundador(a) ou sucessor(a)" },
];

const ROLE_COPY = {
  fundador: {
    decisionPrompt: "Qual decisão sobre a sucessão você está enfrentando agora?",
    decisionLead:
      "Pode ser soltar o comando, dividir responsabilidades, ou qualquer decisão que esteja travada. Todas as notas a seguir serão dadas em relação a ela.",
    placeholder: "Ex.: soltar o comando da diretoria-geral…",
  },
  herdeiro: {
    decisionPrompt: "Qual decisão sobre sua vida profissional está em jogo agora?",
    decisionLead:
      "Pode ser assumir um cargo, propor uma mudança, ou cobrar mais autonomia. Todas as notas a seguir serão dadas em relação a ela.",
    placeholder: "Ex.: assumir a diretoria-geral ou continuar adiando…",
  },
  conjuge: {
    decisionPrompt: "Qual decisão da família empresária está travada agora?",
    decisionLead:
      "Pode ser sobre o papel do seu parceiro(a) na empresa, ou uma mudança que afeta a família toda. Todas as notas a seguir serão dadas em relação a ela.",
    placeholder: "Ex.: meu parceiro(a) assumir mais responsabilidade na empresa…",
  },
};

const TIPOS_DESAFIO = [
  {
    id: "assumir",
    label: "Assumir uma posição",
    lente:
      "a pessoa está prestes a assumir um cargo, papel ou responsabilidade que antes não era dela. " +
      "O tema central costuma ser legitimidade: ela vai ser respeitada nesse novo lugar, ou vai " +
      "continuar sendo vista como quem era antes?",
  },
  {
    id: "soltar",
    label: "Soltar o controle",
    lente:
      "a pessoa está prestes a abrir mão de controle, aprovação ou protagonismo que exercia até " +
      "aqui. O tema central costuma ser identidade: quem ela é, se não for mais essa pessoa " +
      "insubstituível?",
  },
  {
    id: "dividir",
    label: "Dividir poder ou patrimônio",
    lente:
      "a decisão envolve repartir poder, papéis, decisões ou patrimônio entre mais de uma pessoa. " +
      "O tema central costuma ser justiça percebida: o que é dividido igual nem sempre é sentido " +
      "como justo.",
  },
  {
    id: "mudar",
    label: "Mudar um processo ou sistema",
    lente:
      "a decisão é sobre implementar uma mudança de processo, sistema ou jeito de operar que afeta " +
      "pessoas acostumadas ao jeito antigo. O tema central costuma ser o que essa mudança " +
      "significa simbolicamente pras pessoas envolvidas, não só operacionalmente.",
  },
];

function classificarTipoDesafioHeuristico(decisao) {
  const t = decisao
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const test = (words) => words.some((w) => t.includes(w));
  if (
    test([
      "dividir",
      "repartir",
      "reparti",
      "entre os irmaos",
      "entre irmaos",
      "socios iguais",
      "distribuir",
      "partilha",
    ])
  )
    return "dividir";
  if (
    test([
      "soltar",
      "delegar",
      "abrir mao",
      "passar o comando",
      "sair da operacao",
      "aposentar",
      "afastar",
      "ceder o controle",
      "largar",
    ])
  )
    return "soltar";
  if (
    test([
      "assumir",
      "virar diretor",
      "virar diretora",
      "liderar",
      "tomar a frente",
      "presidencia",
      "diretoria-geral",
      "diretoria geral",
      "cargo de",
      "assumir o comando",
    ])
  )
    return "assumir";
  if (
    test([
      "implementar",
      "mudar o sistema",
      "novo processo",
      "profissionalizar",
      "reestruturar",
      "sistema de gestao",
      "novo modelo",
    ])
  )
    return "mudar";
  return null;
}

async function classificarTipoDesafioIA(decisao) {
  const prompt =
    `Classifique o desafio de sucessão familiar abaixo em UMA destas 4 categorias, respondendo ` +
    `apenas com o id exato, sem mais nada:\n` +
    TIPOS_DESAFIO.map((t) => `- ${t.id}: ${t.label}`).join("\n") +
    `\n\nDesafio: "${decisao}"\n\nResponda só com o id, nada mais.`;
  try {
    const resp = await callClaude(prompt, 10);
    const id = resp
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    return TIPOS_DESAFIO.some((t) => t.id === id) ? id : null;
  } catch (e) {
    return null;
  }
}

const STEP_ROLE = 0;
const STEP_DECISAO = 1;
const STEP_QUADRANTE_START = 2; // occupies 2..5 (4 quadrantes)
const STEP_DESEMPATE = 2 + QUADRANTS.length; // = 6
const STEP_CONFLITO = STEP_DESEMPATE + 1; // = 7
const STEP_REFLEXAO = STEP_CONFLITO + 1; // = 8
const STEP_CONSOLIDACAO = STEP_REFLEXAO + 1; // = 9
const STEP_DECISAO_FINAL = STEP_CONSOLIDACAO + 1; // = 10
const STEP_PLANO = STEP_DECISAO_FINAL + 1; // = 11
const STEP_ALINHAMENTO = STEP_PLANO + 1; // = 12
const STEP_FECHAMENTO = STEP_ALINHAMENTO + 1; // = 13 (terminal)

function initScores() {
  const s = {};
  QUADRANTS.forEach((q) => {
    s[q.key] = {};
    q.items.forEach((it) => (s[q.key][it] = null));
  });
  return s;
}

function PrintStyles() {
  return (
    <style>{`
      @media print {
        .no-print { display: none !important; }
        body { background: #fff !important; }
        .print-shell {
          box-shadow: none !important;
          border: none !important;
          max-width: 100% !important;
          margin: 0 !important;
        }
        .print-shell * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
  );
}

export default function App() {
  const [view, setView] = useState("catalogo"); // "catalogo" | "ferramenta"
  const [step, setStep] = useState(STEP_ROLE);
  const [role, setRole] = useState(null);
  const [decisao, setDecisao] = useState("");
  const [scores, setScores] = useState(initScores());
  const [picoEscolhido, setPicoEscolhido] = useState(null);
  const [baixaEscolhida, setBaixaEscolhida] = useState(null);
  const [reflexao, setReflexao] = useState({ descoberta: "", conviccao: "", obrigacao: "" });
  const [consolidacao, setConsolidacao] = useState({ descoberta: "", impacto: "" });
  const [decisaoFinal, setDecisaoFinal] = useState({ classificacao: null, como: "" });
  const [plano, setPlano] = useState([{ id: 1, acao: "", responsavel: "", prazo: "" }]);
  const [alinhamento, setAlinhamento] = useState({ fazSentido: null, faltaAlgo: "", comoParticipar: "" });
  const [envioId, setEnvioId] = useState(null);
  const [tipoDesafio, setTipoDesafio] = useState(null);
  const [tipoDesafioManual, setTipoDesafioManual] = useState(false);

  // detecta automaticamente o tipo de desafio (assumir / soltar / dividir / mudar) a partir
  // do texto livre da decisão, pra adaptar tom e exemplos ao longo da jornada. se a pessoa
  // corrigir manualmente (tipoDesafioManual), paramos de reclassificar sozinhos.
  useEffect(() => {
    if (tipoDesafioManual) return;
    if (!decisao || decisao.trim().length < 4) {
      setTipoDesafio(null);
      return;
    }
    const heuristico = classificarTipoDesafioHeuristico(decisao);
    if (heuristico) {
      setTipoDesafio(heuristico);
      return;
    }
    let cancelado = false;
    const timer = setTimeout(() => {
      classificarTipoDesafioIA(decisao).then((id) => {
        if (!cancelado && id) setTipoDesafio(id);
      });
    }, 700);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [decisao, tipoDesafioManual]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const papelParam = params.get("papel");
      const ferramentaParam = params.get("ferramenta");
      const envioParam = params.get("envio");
      if (envioParam) setEnvioId(envioParam);
      if (ferramentaParam === "1" && ROLES.some((r) => r.key === papelParam)) {
        setRole(papelParam);
        setView("ferramenta");
        setStep(STEP_DECISAO);
      } else if (ferramentaParam === "2") {
        setView("ferramenta2");
      } else if (ferramentaParam === "3") {
        setView("ferramenta3");
      } else if (ferramentaParam === "4") {
        setView("ferramenta4");
      } else if (ferramentaParam === "5") {
        setView("ferramenta5");
      } else if (ferramentaParam === "6") {
        setView("ferramenta6");
      } else if (ferramentaParam === "7") {
        setView("ferramenta7");
      } else if (ferramentaParam === "8") {
        setView("ferramenta8");
      } else if (ferramentaParam === "9") {
        setView("ferramenta9");
      }
    } catch (e) {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reiniciar = () => {
    setView("catalogo");
    setStep(STEP_ROLE);
    setRole(null);
    setDecisao("");
    setScores(initScores());
    setPicoEscolhido(null);
    setBaixaEscolhida(null);
    setReflexao({ descoberta: "", conviccao: "", obrigacao: "" });
    setConsolidacao({ descoberta: "", impacto: "" });
    setDecisaoFinal({ classificacao: null, como: "" });
    setPlano({ acao: "", responsavel: "", prazo: "" });
    setAlinhamento({ fazSentido: null, faltaAlgo: "", comoParticipar: "" });
    setTipoDesafio(null);
    setTipoDesafioManual(false);
  };

  const carregarExemplo = (exemplo) => {
    setTipoDesafioManual(false);
    setRole(exemplo.role);
    setDecisao(exemplo.decisao);
    setScores(exemplo.scores);
    setPicoEscolhido(exemplo.picoEscolhido || null);
    setBaixaEscolhida(exemplo.baixaEscolhida || null);
    setReflexao(exemplo.reflexao);
    setConsolidacao(exemplo.consolidacao);
    setDecisaoFinal(exemplo.decisaoFinal);
    setPlano(exemplo.plano);
    setAlinhamento(exemplo.alinhamento);
    setStep(STEP_CONFLITO);
  };

  const setScore = (qKey, item, val) => {
    setScores((prev) => ({ ...prev, [qKey]: { ...prev[qKey], [item]: val } }));
    // reset tie-break choices if the person changes an answer, they may no longer apply
    setPicoEscolhido(null);
    setBaixaEscolhida(null);
  };

  const quadrantComplete = (qKey) =>
    Object.values(scores[qKey]).every((v) => v !== null);

  const bruto = useMemo(() => {
    const resumo = QUADRANTS.map((q) => {
      const entries = Object.entries(scores[q.key]).filter(
        ([, v]) => v !== null && v !== "NA"
      );
      if (entries.length === 0) return { ...q, top: [], max: null, applicableCount: 0 };
      const max = Math.max(...entries.map(([, v]) => v));
      const top = entries.filter(([, v]) => v === max).map(([k]) => k);
      return { ...q, top, max, applicableCount: entries.length };
    });

    const externos = resumo.filter((r) => r.key !== "projeto");
    let picoGeral = null;
    externos.forEach((r) => {
      if (r.max !== null && (picoGeral === null || r.max > picoGeral.max)) {
        picoGeral = r;
      }
    });

    const projEntries = Object.entries(scores.projeto).filter(
      ([, v]) => v !== null && v !== "NA"
    );
    let projMin = null;
    if (projEntries.length) {
      const min = Math.min(...projEntries.map(([, v]) => v));
      const items = projEntries.filter(([, v]) => v === min).map(([k]) => k);
      projMin = { min, items };
    }

    return { resumo, picoGeral, projMin };
  }, [scores]);

  const picoHasTie = bruto.picoGeral && bruto.picoGeral.top.length > 1;
  const baixaHasTie =
    bruto.projMin &&
    bruto.projMin.items.length > 1 &&
    bruto.projMin.items.length < bruto.resumo.find((r) => r.key === "projeto").applicableCount;
  const needsDesempate = picoHasTie || baixaHasTie;

  const canAdvance = () => {
    if (step === STEP_ROLE) return role !== null;
    if (step === STEP_DECISAO) return decisao.trim().length > 3;
    if (step >= STEP_QUADRANTE_START && step < STEP_DESEMPATE) {
      const q = QUADRANTS[step - STEP_QUADRANTE_START];
      return quadrantComplete(q.key);
    }
    if (step === STEP_DESEMPATE) {
      if (picoHasTie && !picoEscolhido) return false;
      if (baixaHasTie && !baixaEscolhida) return false;
      return true;
    }
    if (step === STEP_CONFLITO) return true;
    if (step === STEP_REFLEXAO) {
      return (
        reflexao.descoberta.trim().length > 3 &&
        reflexao.conviccao.trim().length > 3 &&
        reflexao.obrigacao.trim().length > 3
      );
    }
    if (step === STEP_CONSOLIDACAO) {
      return consolidacao.descoberta.trim().length > 3 && consolidacao.impacto.trim().length > 3;
    }
    if (step === STEP_DECISAO_FINAL) return decisaoFinal.classificacao !== null;
    if (step === STEP_PLANO) {
      return plano.some(
        (p) => p.acao.trim().length > 3 && p.responsavel.trim().length > 0 && p.prazo.trim().length > 0
      );
    }
    if (step === STEP_ALINHAMENTO) return alinhamento.fazSentido !== null;
    return true;
  };

  // resultado final aplica as escolhas de desempate, quando existirem
  const resultado = useMemo(() => {
    const { resumo, picoGeral, projMin } = bruto;
    let finalPico = picoGeral;
    let finalProjMin = projMin;
    if (picoGeral && picoHasTie && picoEscolhido) {
      finalPico = { ...picoGeral, top: [picoEscolhido] };
    }
    if (projMin && baixaHasTie && baixaEscolhida) {
      finalProjMin = { ...projMin, items: [baixaEscolhida] };
    }
    return { resumo, picoGeral: finalPico, projMin: finalProjMin };
  }, [bruto, picoEscolhido, baixaEscolhida, picoHasTie, baixaHasTie]);

  const effectiveTotal = needsDesempate ? STEP_FECHAMENTO : STEP_FECHAMENTO - 1;
  const copy = role ? ROLE_COPY[role] : ROLE_COPY.herdeiro;

  const goNext = () => {
    setStep((s) => {
      if (s === STEP_DESEMPATE - 1 && !needsDesempate) return STEP_CONFLITO;
      return Math.min(STEP_FECHAMENTO, s + 1);
    });
  };
  const goBack = () => {
    setStep((s) => {
      if (s === STEP_CONFLITO && !needsDesempate) return STEP_DESEMPATE - 1;
      return Math.max(STEP_ROLE, s - 1);
    });
  };

  const abrirFerramenta1 = () => {
    reiniciar();
    setView("ferramenta");
  };

  const abrirFerramenta2 = () => {
    setView("ferramenta2");
  };

  const abrirFerramenta3 = () => {
    setView("ferramenta3");
  };

  const abrirFerramenta4 = () => {
    setView("ferramenta4");
  };

  const abrirFerramenta5 = () => {
    setView("ferramenta5");
  };

  const abrirFerramenta6 = () => {
    setView("ferramenta6");
  };

  const abrirFerramenta7 = () => {
    setView("ferramenta7");
  };

  const abrirFerramenta8 = () => {
    setView("ferramenta8");
  };

  const abrirFerramenta9 = () => {
    setView("ferramenta9");
  };

  if (view === "catalogo") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shellWide} className="print-shell">
          <Catalogo
            onAbrirFerramenta1={abrirFerramenta1}
            onAbrirFerramenta2={abrirFerramenta2}
            onAbrirFerramenta3={abrirFerramenta3}
            onAbrirFerramenta4={abrirFerramenta4}
            onAbrirFerramenta5={abrirFerramenta5}
            onAbrirFerramenta6={abrirFerramenta6}
            onAbrirFerramenta7={abrirFerramenta7}
            onAbrirFerramenta8={abrirFerramenta8}
            onAbrirFerramenta9={abrirFerramenta9}
            onAbrirComparacao={() => setView("comparacao")}
            onAbrirNovaFamilia={() => setView("novaFamilia")}
          />
        </div>
      </div>
    );
  }

  if (view === "novaFamilia") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shellWide} className="print-shell">
          <NovaFamilia onVoltar={() => setView("catalogo")} />
        </div>
      </div>
    );
  }

  if (view === "comparacao") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shellWide} className="print-shell">
          <Comparacao onVoltar={() => setView("catalogo")} />
        </div>
      </div>
    );
  }

  if (view === "ferramenta2") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shell} className="print-shell">
          <Ferramenta2App onVoltarCatalogo={() => setView("catalogo")} envioIdInicial={envioId} />
        </div>
      </div>
    );
  }

  if (view === "ferramenta3") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shell} className="print-shell">
          <Ferramenta3App onVoltarCatalogo={() => setView("catalogo")} envioIdInicial={envioId} />
        </div>
      </div>
    );
  }

  if (view === "ferramenta4") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shell} className="print-shell">
          <Ferramenta4App onVoltarCatalogo={() => setView("catalogo")} envioIdInicial={envioId} />
        </div>
      </div>
    );
  }

  if (view === "ferramenta5") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shell} className="print-shell">
          <Ferramenta5App onVoltarCatalogo={() => setView("catalogo")} envioIdInicial={envioId} />
        </div>
      </div>
    );
  }

  if (view === "ferramenta6") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shell} className="print-shell">
          <Ferramenta6App onVoltarCatalogo={() => setView("catalogo")} envioIdInicial={envioId} />
        </div>
      </div>
    );
  }

  if (view === "ferramenta7") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shell} className="print-shell">
          <Ferramenta7App onVoltarCatalogo={() => setView("catalogo")} envioIdInicial={envioId} />
        </div>
      </div>
    );
  }

  if (view === "ferramenta8") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shell} className="print-shell">
          <Ferramenta8App onVoltarCatalogo={() => setView("catalogo")} envioIdInicial={envioId} />
        </div>
      </div>
    );
  }

  if (view === "ferramenta9") {
    return (
      <div style={styles.page}><PrintStyles />
        <div style={styles.shell} className="print-shell">
          <Ferramenta9App onVoltarCatalogo={() => setView("catalogo")} envioIdInicial={envioId} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}><PrintStyles />
      <div style={styles.shell} className="print-shell">
        <Header
          step={step}
          needsDesempate={needsDesempate}
          onVoltarCatalogo={() => setView("catalogo")}
          tipoDesafio={tipoDesafio}
          onChangeTipoDesafio={(id) => {
            setTipoDesafio(id);
            setTipoDesafioManual(true);
          }}
        />
        <div style={styles.body}>
          {step === STEP_ROLE && (
            <StepRole role={role} setRole={setRole} onCarregarExemplo={carregarExemplo} />
          )}
          {step === STEP_DECISAO && (
            <StepDecisao decisao={decisao} setDecisao={setDecisao} copy={copy} />
          )}
          {step >= STEP_QUADRANTE_START && step < STEP_DESEMPATE && (
            <StepQuadrante
              quadrant={QUADRANTS[step - STEP_QUADRANTE_START]}
              decisao={decisao}
              tipoDesafio={tipoDesafio}
              scores={scores[QUADRANTS[step - STEP_QUADRANTE_START].key]}
              setScore={(item, val) =>
                setScore(QUADRANTS[step - STEP_QUADRANTE_START].key, item, val)
              }
            />
          )}
          {step === STEP_DESEMPATE && needsDesempate && (
            <StepDesempate
              picoHasTie={picoHasTie}
              picoGeral={bruto.picoGeral}
              picoEscolhido={picoEscolhido}
              setPicoEscolhido={setPicoEscolhido}
              baixaHasTie={baixaHasTie}
              projMin={bruto.projMin}
              baixaEscolhida={baixaEscolhida}
              setBaixaEscolhida={setBaixaEscolhida}
            />
          )}
          {step === STEP_CONFLITO && (
            <StepConflito decisao={decisao} tipoDesafio={tipoDesafio} resultado={resultado} />
          )}
          {step === STEP_REFLEXAO && (
            <StepReflexao
              reflexao={reflexao}
              setReflexao={setReflexao}
              resultado={resultado}
              decisao={decisao}
              tipoDesafio={tipoDesafio}
            />
          )}
          {step === STEP_CONSOLIDACAO && (
            <StepConsolidacao
              consolidacao={consolidacao}
              setConsolidacao={setConsolidacao}
              resultado={resultado}
              decisao={decisao}
              tipoDesafio={tipoDesafio}
              reflexao={reflexao}
            />
          )}
          {step === STEP_DECISAO_FINAL && (
            <StepDecisaoFinal
              resultado={resultado}
              decisaoFinal={decisaoFinal}
              setDecisaoFinal={setDecisaoFinal}
            />
          )}
          {step === STEP_PLANO && (
            <StepPlano
              plano={plano}
              setPlano={setPlano}
              decisao={decisao}
              tipoDesafio={tipoDesafio}
              resultado={resultado}
              decisaoFinal={decisaoFinal}
              reflexao={reflexao}
            />
          )}
          {step === STEP_ALINHAMENTO && (
            <StepAlinhamento alinhamento={alinhamento} setAlinhamento={setAlinhamento} />
          )}
          {step === STEP_FECHAMENTO && (
            <StepFechamento
              decisao={decisao}
              resultado={resultado}
              decisaoFinal={decisaoFinal}
              plano={plano}
              reflexao={reflexao}
              consolidacao={consolidacao}
              onReiniciar={reiniciar}
              role={role}
              scores={scores}
              alinhamento={alinhamento}
              envioId={envioId}
              tipoDesafio={tipoDesafio}
            />
          )}
        </div>
        {step < STEP_FECHAMENTO && (
          <Footer
            step={step}
            canAdvance={canAdvance()}
            isLastQuadrante={step === STEP_DESEMPATE - 1 && !needsDesempate}
            isDesempate={step === STEP_DESEMPATE}
            isPenultimate={step === STEP_ALINHAMENTO}
            onBack={goBack}
            onNext={goNext}
          />
        )}
      </div>
    </div>
  );
}

function TipoDesafioBadge({ tipoDesafio, onChange }) {
  const [aberto, setAberto] = useState(false);
  const atual = TIPOS_DESAFIO.find((t) => t.id === tipoDesafio);
  return (
    <div style={styles.tipoDesafioWrap}>
      <button type="button" onClick={() => setAberto((v) => !v)} style={styles.tipoDesafioPill}>
        {atual ? `Tipo de desafio: ${atual.label}` : "Identificando o tipo de desafio…"} ▾
      </button>
      {aberto && (
        <div style={styles.tipoDesafioMenu}>
          {TIPOS_DESAFIO.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => {
                onChange(t.id);
                setAberto(false);
              }}
              style={{
                ...styles.tipoDesafioOption,
                ...(t.id === tipoDesafio ? styles.tipoDesafioOptionActive : {}),
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Header({ step, needsDesempate, onVoltarCatalogo, tipoDesafio, onChangeTipoDesafio }) {
  const labels = [
    "Seu papel",
    "Sua decisão",
    "Família",
    "Negócio",
    "Patrimônio",
    "Projeto de Vida",
    "Desempate",
    "Conflito",
    "Reflexão individual",
    "Consolidação familiar",
    "Decisão final",
    "Plano de ação",
    "Alinhamento",
    "Fechamento",
  ];
  const effectiveTotal = needsDesempate ? STEP_FECHAMENTO : STEP_FECHAMENTO - 1;
  const progress = Math.round((step / effectiveTotal) * 100);
  return (
    <div style={styles.header} className="no-print">
      <div style={styles.headerTop}>
        <button onClick={onVoltarCatalogo} style={styles.backToCatalogo}>
          ← Catálogo
        </button>
        <span style={styles.stepLabel}>{labels[step]}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
      {step >= STEP_QUADRANTE_START && step <= STEP_PLANO && (
        <TipoDesafioBadge tipoDesafio={tipoDesafio} onChange={onChangeTipoDesafio} />
      )}
    </div>
  );
}

function Catalogo({
  onAbrirFerramenta1,
  onAbrirFerramenta2,
  onAbrirFerramenta3,
  onAbrirFerramenta4,
  onAbrirFerramenta5,
  onAbrirFerramenta6,
  onAbrirFerramenta7,
  onAbrirFerramenta8,
  onAbrirFerramenta9,
  onAbrirComparacao,
  onAbrirNovaFamilia,
}) {
  const handlers = {
    1: onAbrirFerramenta1,
    2: onAbrirFerramenta2,
    3: onAbrirFerramenta3,
    4: onAbrirFerramenta4,
    5: onAbrirFerramenta5,
    6: onAbrirFerramenta6,
    7: onAbrirFerramenta7,
    8: onAbrirFerramenta8,
    9: onAbrirFerramenta9,
  };

  const [envioAberto, setEnvioAberto] = useState(null);
  const [nomeEnvio, setNomeEnvio] = useState("");
  const [papelEnvio, setPapelEnvio] = useState("fundador");
  const [linkGerado, setLinkGerado] = useState(null);
  const [gerandoEnvio, setGerandoEnvio] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const abrirEnvio = (n) => (e) => {
    e.stopPropagation();
    setEnvioAberto(envioAberto === n ? null : n);
    setNomeEnvio("");
    setPapelEnvio("fundador");
    setLinkGerado(null);
    setErroEnvio(false);
    setCopiado(false);
  };

  const gerarLinkRapido = async (n) => {
    if (!nomeEnvio.trim()) return;
    setGerandoEnvio(true);
    setErroEnvio(false);
    try {
      const novoId = crypto.randomUUID();
      const row =
        n === 1
          ? {
              id: novoId,
              ferramenta_numero: 1,
              papel: papelEnvio,
              nome_destinatario: nomeEnvio.trim(),
              status: "pendente",
            }
          : {
              id: novoId,
              ferramenta_numero: n,
              nome_destinatario: nomeEnvio.trim(),
              status: "pendente",
            };
      await supabaseInsert("envios", row);
      const base = window.location.href.split("?")[0];
      const url =
        n === 1 ? `${base}?ferramenta=1&papel=${papelEnvio}&envio=${novoId}` : `${base}?ferramenta=${n}&envio=${novoId}`;
      setLinkGerado(url);
    } catch (e) {
      setErroEnvio(true);
    } finally {
      setGerandoEnvio(false);
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkGerado).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  return (
    <div style={styles.catalogoWrap}>
      <div style={styles.catalogoHeader}>
        <span style={styles.eyebrow}>MÉTODO MOVER · 15 FERRAMENTAS</span>
        <h1 style={styles.catalogoH1}>Catálogo de diagnósticos</h1>
        <p style={styles.lead}>
          Organizadas pelas cinco etapas do método. Clique num card disponível pra abrir a
          ferramenta na hora, ou use "Enviar pra alguém" pra gerar um link individual sem sair
          daqui. As demais ferramentas aparecem como referência.
        </p>
      </div>

      {FERRAMENTAS_CATALOGO.map((grupo) => (
        <div key={grupo.letra} style={styles.grupoBox}>
          <div style={styles.grupoHeader}>
            <span style={{ ...styles.grupoLetra, background: grupo.cor }}>{grupo.letra}</span>
            <div style={styles.grupoHeaderText}>
              <span style={styles.grupoEtapa}>{grupo.etapa}</span>
              <span style={styles.grupoCategoria}>{grupo.categoria}</span>
            </div>
          </div>
          <div style={styles.ferramentasGrid}>
            {grupo.ferramentas.map((f) => {
              const abrir = handlers[f.n];
              const clicavel = f.ativa && abrir;
              const envioAbertoAqui = envioAberto === f.n;
              return (
                <div
                  key={f.n}
                  onClick={clicavel ? abrir : undefined}
                  role={clicavel ? "button" : undefined}
                  tabIndex={clicavel ? 0 : undefined}
                  onKeyDown={
                    clicavel
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") abrir();
                        }
                      : undefined
                  }
                  style={{
                    ...styles.ferramentaCard,
                    opacity: f.ativa ? 1 : 0.55,
                    cursor: clicavel ? "pointer" : "default",
                    borderColor: f.ativa ? BLUE : "#EEF2F6",
                    background: f.ativa ? "#F5F9FE" : "#FAFBFC",
                  }}
                >
                  <span style={styles.ferramentaNum}>{String(f.n).padStart(2, "0")}</span>
                  <span style={styles.ferramentaNome}>{f.nome}</span>
                  {f.ativa ? (
                    <>
                      <span style={styles.ferramentaAtiva}>Disponível →</span>
                      <button onClick={abrirEnvio(f.n)} style={styles.enviarCardLink} type="button">
                        {envioAbertoAqui ? "✕ Fechar" : "✉ Enviar pra alguém"}
                      </button>
                    </>
                  ) : (
                    <span style={styles.ferramentaEmBreve}>Em breve</span>
                  )}

                  {envioAbertoAqui && (
                    <div style={styles.enviarCardBox} onClick={(e) => e.stopPropagation()}>
                      {!linkGerado ? (
                        <>
                          <input
                            style={{ ...styles.input, flex: "none" }}
                            value={nomeEnvio}
                            onChange={(e) => setNomeEnvio(e.target.value)}
                            placeholder="Nome da pessoa"
                          />
                          {f.n === 1 && (
                            <select
                              style={{ ...styles.input, flex: "none" }}
                              value={papelEnvio}
                              onChange={(e) => setPapelEnvio(e.target.value)}
                            >
                              {ROLES.map((r) => (
                                <option key={r.key} value={r.key}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            onClick={() => gerarLinkRapido(f.n)}
                            disabled={!nomeEnvio.trim() || gerandoEnvio}
                            style={styles.demoLink}
                            type="button"
                          >
                            {gerandoEnvio ? "Gerando…" : "Gerar link →"}
                          </button>
                          {erroEnvio && (
                            <span style={styles.saveStatusErr}>Não deu pra gerar, tente de novo.</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span style={styles.papelDescricao}>{linkGerado}</span>
                          <button onClick={copiarLink} style={styles.demoLink} type="button">
                            {copiado ? "✓ Copiado!" : "Copiar link"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={styles.envioBox}>
        <span style={styles.eyebrowSmall}>ENVIAR PARA A FAMÍLIA</span>
        <p style={styles.lead}>
          Adicione as pessoas que vão preencher (com nome, ferramenta e papel quando for o caso)
          e gere todos os links de uma vez, já organizados sob o mesmo código de família.
        </p>
        <button onClick={onAbrirNovaFamilia} style={styles.ctaButton}>
          Adicionar pessoas e gerar links →
        </button>
      </div>

      <button onClick={onAbrirComparacao} style={styles.restartButton}>
        Comparar resultados de mais de uma pessoa da família →
      </button>
    </div>
  );
}

function NovaFamilia({ onVoltar }) {
  const [grupoFamilia, setGrupoFamilia] = useState("");
  const [pessoas, setPessoas] = useState([{ id: 1, nome: "", ferramenta: "1", papel: "" }]);
  const [gerando, setGerando] = useState(false);
  const [resultados, setResultados] = useState(null);
  const [copiadoId, setCopiadoId] = useState(null);

  const addPessoa = () =>
    setPessoas((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, nome: "", ferramenta: "1", papel: "" },
    ]);
  const removePessoa = (id) => setPessoas((prev) => prev.filter((p) => p.id !== id));
  const setPessoa = (id, field, val) =>
    setPessoas((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)));

  const linhaValida = (p) => p.nome.trim().length > 0 && (p.ferramenta !== "1" || p.papel);
  const podeGerar = pessoas.some(linhaValida) && !gerando;

  const gerarTodos = async () => {
    setGerando(true);
    setResultados(null);
    const base = window.location.href.split("?")[0];
    const validas = pessoas.filter(linhaValida);
    const saida = [];
    for (const p of validas) {
      try {
        const novoId = crypto.randomUUID();
        const row =
          p.ferramenta === "1"
            ? {
                id: novoId,
                ferramenta_numero: 1,
                papel: p.papel,
                nome_destinatario: p.nome.trim(),
                grupo: grupoFamilia.trim() || null,
                status: "pendente",
              }
            : {
                id: novoId,
                ferramenta_numero: Number(p.ferramenta),
                nome_destinatario: p.nome.trim(),
                grupo: grupoFamilia.trim() || null,
                status: "pendente",
              };
        await supabaseInsert("envios", row);
        const url =
          p.ferramenta === "1"
            ? `${base}?ferramenta=1&papel=${p.papel}&envio=${novoId}`
            : `${base}?ferramenta=${p.ferramenta}&envio=${novoId}`;
        saida.push({ id: p.id, nome: p.nome.trim(), ferramenta: p.ferramenta, url, erro: false });
      } catch (e) {
        saida.push({ id: p.id, nome: p.nome.trim(), ferramenta: p.ferramenta, url: null, erro: true });
      }
    }
    setResultados(saida);
    setGerando(false);
  };

  const copiar = async (url, id) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const ferramentaLabel = (f) =>
    ({
      "1": "Ferramenta 01 · Raízes das Lealdades",
      "2": "Ferramenta 02 · Radar de Papéis",
      "3": "Ferramenta 03 · Linha de Repetição",
      "4": "Ferramenta 04 · Autoridade Real",
      "5": "Ferramenta 05 · Ponte de Gerações",
      "6": "Ferramenta 06 · Índice de Confiança",
      "7": "Ferramenta 07 · Protocolo CLARO",
      "8": "Ferramenta 08 · Semáforo dos Temas",
      "9": "Ferramenta 09 · Mapa de Ruídos",
    }[f] || `Ferramenta ${f}`);

  return (
    <div style={styles.catalogoWrap}>
      <button onClick={onVoltar} style={styles.backToCatalogo}>
        ← Catálogo
      </button>
      <div style={styles.catalogoHeader}>
        <span style={styles.eyebrow}>NOVA FAMÍLIA</span>
        <h1 style={styles.catalogoH1}>Adicione as pessoas e gere todos os links de uma vez</h1>
        <p style={styles.lead}>
          Cada pessoa recebe um link individual, isolado. O código de família é só uma etiqueta
          organizacional no banco, não libera ninguém a ver os dados dos outros.
        </p>
      </div>

      <label style={styles.fieldLabel}>Código ou nome da família (opcional)</label>
      <input
        style={{ ...styles.input, flex: "none" }}
        value={grupoFamilia}
        onChange={(e) => setGrupoFamilia(e.target.value)}
        placeholder="Ex.: Família Silva"
      />

      <div style={styles.familiaList}>
        {pessoas.map((p) => (
          <div key={p.id} style={styles.familiaRow}>
            <input
              style={styles.input}
              value={p.nome}
              onChange={(e) => setPessoa(p.id, "nome", e.target.value)}
              placeholder="Nome da pessoa"
            />
            <select
              style={styles.input}
              value={p.ferramenta}
              onChange={(e) => setPessoa(p.id, "ferramenta", e.target.value)}
            >
              <option value="1">Ferramenta 01 · Lealdades</option>
              <option value="2">Ferramenta 02 · Papéis</option>
              <option value="3">Ferramenta 03 · Repetição</option>
              <option value="4">Ferramenta 04 · Autoridade</option>
              <option value="5">Ferramenta 05 · Ponte</option>
              <option value="6">Ferramenta 06 · ICS</option>
              <option value="7">Ferramenta 07 · CLARO</option>
              <option value="8">Ferramenta 08 · Semáforo</option>
              <option value="9">Ferramenta 09 · Ruídos</option>
            </select>
            {p.ferramenta === "1" && (
              <select
                style={styles.input}
                value={p.papel}
                onChange={(e) => setPessoa(p.id, "papel", e.target.value)}
              >
                <option value="">Papel…</option>
                {ROLES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            )}
            {pessoas.length > 1 && (
              <button
                onClick={() => removePessoa(p.id)}
                style={styles.removeRowButton}
                type="button"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={addPessoa} type="button" style={styles.demoLink}>
        + Adicionar outra pessoa
      </button>

      <button onClick={gerarTodos} disabled={!podeGerar} style={styles.ctaButton}>
        {gerando ? "Gerando links…" : "Gerar links pra todo mundo →"}
      </button>

      {resultados && (
        <div style={styles.envioBox}>
          <span style={styles.eyebrowSmall}>LINKS GERADOS</span>
          <div style={styles.familiaList}>
            {resultados.map((r) => (
              <div key={r.id} style={styles.familiaRow}>
                <div style={styles.papelRowText}>
                  <span style={styles.papelNome}>{r.nome}</span>
                  <span style={styles.papelDescricao}>{ferramentaLabel(r.ferramenta)}</span>
                </div>
                {r.erro ? (
                  <span style={styles.saveStatusErr}>Não deu pra gerar, tente de novo</span>
                ) : (
                  <button onClick={() => copiar(r.url, r.id)} style={styles.envioButton}>
                    {copiadoId === r.id ? "✓ Copiado!" : "Copiar link"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const RESUMO_EXEMPLO_MARINA_F2 = `Radar de Papéis Ocultos

Papéis predominantes: Escolhido (5), Protetor (4), Guardião do Legado (2)

Síntese: Meu papel de Escolhida me dá clareza sobre meu lugar, mas também me trava, porque
sinto que preciso liderar exatamente como meu pai lideraria, não do meu jeito. Meu papel de
Protetora reforça isso: adio assumir o cargo pra não fazer ele se sentir substituído antes
da hora.

Mapa da família: Meu pai — Guardião do Legado

Comportamento a mudar: Perguntar direto pra ele o que ele espera de verdade, em vez de
continuar supondo.

Papéis a fortalecer: Meu jeito próprio de liderar, mesmo que seja diferente do dele.
Papéis a reduzir: A parte do papel de Escolhida que me faz tentar copiar o estilo dele em vez
de criar o meu.

Ação: Ter uma conversa aberta com meu pai perguntando o que ele espera de mim de verdade,
como sucessora.
Responsável: Marina
Prazo: 30 dias`;

const RESUMO_EXEMPLO_ANTONIO_F2 = `Radar de Papéis Ocultos

Papéis predominantes: Controlador (5), Guardião do Legado (4), Herói (2)

Síntese: Meu papel de Controlador me ajudou a evitar erros caros por décadas, mas hoje trava
meu sucessor, que não consegue decidir nada sem minha aprovação. Meu papel de Guardião do
Legado mantém viva a história da empresa, mas às vezes me faz resistir a mudanças que ela
precisa pra evoluir.

Mapa da família: Meu sucessor — Herói

Comportamento a mudar: Delegar formalmente as aprovações de rotina, e reservar minha
assinatura só pra decisões estratégicas maiores.

Papéis a fortalecer: Meu papel de Guardião do Legado, mas exercido como conselheiro, não
como aprovador do dia a dia.
Papéis a reduzir: O Controlador, preciso soltar as aprovações operacionais de rotina.

Ação: Transferir formalmente as aprovações financeiras de rotina ao sucessor, mantendo
comigo só as decisões estratégicas.
Responsável: Antônio, com o sucessor
Prazo: 90 dias`;

function Comparacao({ onVoltar }) {
  const [pessoas, setPessoas] = useState([{ nome: "", resumo: "" }, { nome: "", resumo: "" }]);
  const [analise, setAnalise] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const atualizar = (i, field, val) => {
    setPessoas((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));
  };

  const addPessoa = () => setPessoas((prev) => [...prev, { nome: "", resumo: "" }]);

  const carregarExemplo = () => {
    setPessoas([
      { nome: "Marina", resumo: RESUMO_EXEMPLO_MARINA_F2 },
      { nome: "Antônio", resumo: RESUMO_EXEMPLO_ANTONIO_F2 },
    ]);
    setAnalise(null);
  };

  const comparar = () => {
    const preenchidas = pessoas.filter((p) => p.nome.trim() && p.resumo.trim());
    if (preenchidas.length < 2) return;
    setCarregando(true);
    setAnalise(null);
    const blocos = preenchidas
      .map((p) => `--- ${p.nome} ---\n${p.resumo}`)
      .join("\n\n");
    const prompt =
      `${LIVRO_CONTEXTO}\n\n${LIVRO_CONTEXTO_F2}\n\n${LIVRO_CONTEXTO_F3}\n\n${LIVRO_CONTEXTO_F4}\n\n${LIVRO_CONTEXTO_F5}\n\n${LIVRO_CONTEXTO_F6}\n\n${LIVRO_CONTEXTO_F7}\n\n${LIVRO_CONTEXTO_F8}\n\n${LIVRO_CONTEXTO_F9}\n\n` +
      `Você ajuda a preparar uma conversa de Consolidação Familiar, seguindo os métodos acima. ` +
      `Abaixo estão os resultados de diagnóstico individual de ${preenchidas.length} pessoas ` +
      `da mesma família. Cada resumo pode ser de ferramentas diferentes do método (lealdades ` +
      `invisíveis, papéis emocionais, ou outra), identifique pelo próprio texto de qual se trata:` +
      `\n\n${blocos}\n\n` +
      `Analise e responda em português do Brasil, de forma objetiva, em até 200 palavras, no tom ` +
      `descrito acima:\n` +
      `1) Onde os padrões dessas pessoas se reforçam (apontam pra mesma tensão ou dinâmica)?\n` +
      `2) Onde eles se chocam (uma pessoa quer ou faz uma coisa que trava a outra)?\n` +
      `3) Uma sugestão de como abrir a conversa de Consolidação Familiar entre elas, seguindo os ` +
      `erros comuns a evitar de cada método.`;

    callClaude(prompt, 500)
      .then((texto) => setAnalise(texto))
      .catch(() => setAnalise("Não foi possível gerar a análise agora. Tente novamente."))
      .finally(() => setCarregando(false));
  };

  return (
    <div style={styles.catalogoWrap}>
      <button onClick={onVoltar} style={styles.backToCatalogo}>
        ← Catálogo
      </button>
      <div style={styles.catalogoHeader}>
        <span style={styles.eyebrow}>CONSOLIDAÇÃO FAMILIAR</span>
        <h1 style={styles.catalogoH1}>Comparar resultados de mais de uma pessoa</h1>
        <p style={styles.lead}>
          Cole aqui o resumo que cada pessoa te mandou por e-mail (decisão, conflito, o que
          descobriu). A IA cruza os pontos e sugere onde eles se reforçam, onde se chocam, e
          como abrir a conversa.
        </p>
      </div>

      <button onClick={carregarExemplo} style={styles.demoLink}>
        ⚡ Carregar exemplo: Marina + Antônio (Ferramenta 02)
      </button>

      {pessoas.map((p, i) => (
        <div key={i} style={styles.pessoaBox}>
          <input
            style={{ ...styles.input, flex: "none" }}
            placeholder={`Nome da pessoa ${i + 1}`}
            value={p.nome}
            onChange={(e) => atualizar(i, "nome", e.target.value)}
          />
          <textarea
            style={styles.textareaSmall}
            rows={4}
            placeholder="Cole aqui o resumo que essa pessoa te mandou (decisão, conflito, descobertas)…"
            value={p.resumo}
            onChange={(e) => atualizar(i, "resumo", e.target.value)}
          />
        </div>
      ))}

      <button onClick={addPessoa} style={styles.demoLink}>
        + Adicionar outra pessoa
      </button>

      <button onClick={comparar} disabled={carregando} style={styles.ctaButton}>
        {carregando ? "Analisando…" : "Comparar com IA →"}
      </button>

      {analise && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ análise gerada pela IA</span>
          <p style={styles.scriptText}>{analise}</p>
        </div>
      )}
    </div>
  );
}

function StepRole({ role, setRole, onCarregarExemplo }) {
  return (
    <div style={styles.stepWrap}>
      <h1 style={styles.h1}>Qual desses te descreve melhor?</h1>
      <p style={styles.lead}>
        Isso ajuda a ajustar as perguntas seguintes para a sua situação específica.
      </p>
      <div style={styles.roleGrid}>
        {ROLES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRole(r.key)}
            style={{
              ...styles.roleCard,
              borderColor: role === r.key ? BLUE : "#E4EAF0",
              background: role === r.key ? "#EAF2FB" : "#fff",
            }}
          >
            <span style={styles.roleLabel}>{r.label}</span>
            <span style={styles.roleDesc}>{r.desc}</span>
          </button>
        ))}
      </div>
      <div style={styles.demoLinksRow}>
        <button onClick={() => onCarregarExemplo(MARINA_EXEMPLO)} style={styles.demoLink}>
          ⚡ Exemplo: Marina (herdeira)
        </button>
        <button onClick={() => onCarregarExemplo(FUNDADOR_EXEMPLO)} style={styles.demoLink}>
          ⚡ Exemplo: Antônio (fundador)
        </button>
      </div>
    </div>
  );
}

function StepDecisao({ decisao, setDecisao, copy }) {
  return (
    <div style={styles.stepWrap}>
      <h1 style={styles.h1}>{copy.decisionPrompt}</h1>
      <p style={styles.lead}>{copy.decisionLead}</p>
      <textarea
        style={styles.textarea}
        placeholder={copy.placeholder}
        value={decisao}
        onChange={(e) => setDecisao(e.target.value)}
        rows={3}
        autoFocus
      />
    </div>
  );
}

function StepQuadrante({ quadrant, decisao, tipoDesafio, scores, setScore }) {
  const [exemploIA, setExemploIA] = useState(null);
  const [carregandoExemplo, setCarregandoExemplo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setExemploIA(null);
    if (!decisao || decisao.trim().length < 4) return;
    setCarregandoExemplo(true);
    const tipo = TIPOS_DESAFIO.find((t) => t.id === tipoDesafio);
    const prompt =
      `${LIVRO_CONTEXTO}\n\n` +
      `Você ajuda a explicar a ferramenta acima. A pessoa está prestes a dar notas de 0 a 5 para itens ` +
      `do quadrante "${quadrant.name}" (itens: ${quadrant.items.join(", ")}), em relação à decisão ` +
      `específica: "${decisao}".${tipo ? ` Contexto do tipo de desafio: ${tipo.lente}` : ""}\n\n` +
      `Escreva UM exemplo curto (2 frases, no máximo 45 palavras), no mesmo estilo destes exemplos:\n` +
      `- "Você pode adorar sua mãe, mas se ela nunca opinou sobre sua carreira, a nota aqui é baixa. ` +
      `Por outro lado, pode ter uma relação distante com um irmão, mas se você evita certas decisões ` +
      `só pra não parecer que está competindo com ele, a nota é alta."\n\n` +
      `O exemplo deve contrastar um caso de nota BAIXA com um caso de nota ALTA, usando itens do ` +
      `quadrante "${quadrant.name}", e mencionando de forma natural a decisão específica da pessoa ` +
      `("${decisao}"). Use o tom do método (direto, sem clichês). Responda só com o exemplo, sem ` +
      `introdução, sem aspas, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setExemploIA(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoExemplo(false);
      });

    return () => {
      cancelado = true;
    };
  }, [quadrant.key, decisao, tipoDesafio]);

  const textoExemplo = exemploIA || quadrant.example;

  return (
    <div style={styles.stepWrap}>
      <div style={{ ...styles.quadrantBadge, background: quadrant.color }}>{quadrant.name}</div>
      <h1 style={styles.h1}>
        De 0 a 5, {quadrant.question}
        {decisao ? <>: <em style={{ color: quadrant.color }}>&ldquo;{decisao}&rdquo;</em></> : "?"}
      </h1>
      <p style={styles.explainer}>
        A nota não mede afeto, nem o quanto essa relação importa na sua vida. Mede o quanto
        ela pesa <strong>nessa decisão específica</strong>, mesmo que você não perceba isso
        conscientemente.
      </p>
      <p style={styles.explainerExample}>
        {carregandoExemplo ? (
          <span style={{ opacity: 0.6 }}>Gerando um exemplo pra sua decisão específica…</span>
        ) : (
          <>
            Por exemplo: {textoExemplo} A pergunta não é{" "}
            <em>&ldquo;o quanto eu gosto&rdquo;</em>, é{" "}
            <em>&ldquo;o quanto isso me trava&rdquo;</em>.
            {exemploIA && <span style={styles.aiTag}>✦ gerado pra sua decisão</span>}
          </>
        )}
      </p>
      <div style={styles.legendBox}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: "#D7DEE6" }}>0–1</span>
          <span>Praticamente não pesa nessa decisão</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: "#A9C4E0" }}>2–3</span>
          <span>Pesa algo, mas costuma ser negociável</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: quadrant.color, color: "#fff" }}>4–5</span>
          <span>Provavelmente já travou ou adiou essa decisão</span>
        </div>
      </div>
      <div style={styles.itemList}>
        {quadrant.items.map((item) => (
          <div key={item} style={styles.itemRow}>
            <span style={styles.itemName}>{item}</span>
            <div style={styles.dots}>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(item, n)}
                  aria-label={`Nota ${n} para ${item}`}
                  style={{
                    ...styles.dot,
                    background: scores[item] === n ? quadrant.color : "#fff",
                    borderColor: scores[item] === n ? quadrant.color : "#D7DEE6",
                    color: scores[item] === n ? "#fff" : "#8A97A3",
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setScore(item, "NA")}
                aria-label={`Não se aplica para ${item}`}
                style={{
                  ...styles.dotNA,
                  background: scores[item] === "NA" ? "#5A6B7A" : "#fff",
                  borderColor: scores[item] === "NA" ? "#5A6B7A" : "#D7DEE6",
                  color: scores[item] === "NA" ? "#fff" : "#8A97A3",
                }}
              >
                N/A
              </button>
            </div>
          </div>
        ))}
      </div>
      <p style={styles.naHint}>
        Não se aplica: use quando o item não existe na sua vida (ex.: ainda não tem
        filhos). Ele fica de fora do resultado, em vez de contar como nota 0.
      </p>
    </div>
  );
}

function StepDesempate({
  picoHasTie,
  picoGeral,
  picoEscolhido,
  setPicoEscolhido,
  baixaHasTie,
  projMin,
  baixaEscolhida,
  setBaixaEscolhida,
}) {
  return (
    <div style={styles.stepWrap}>
      <h1 style={styles.h1}>Deu empate em algumas notas.</h1>
      <p style={styles.lead}>
        Um empate nos números nem sempre é um empate no que você sente. Qual desses pesa
        mais de verdade, hoje, nessa decisão?
      </p>

      {picoHasTie && (
        <div style={styles.desempateBlock}>
          <span style={styles.desempateLabel}>
            EMPATE NA NOTA MAIS ALTA ({picoGeral.name}, nota {picoGeral.max})
          </span>
          <div style={styles.desempateOptions}>
            {picoGeral.top.map((item) => (
              <button
                key={item}
                onClick={() => setPicoEscolhido(item)}
                style={{
                  ...styles.desempateOption,
                  borderColor: picoEscolhido === item ? picoGeral.color : "#E4EAF0",
                  background: picoEscolhido === item ? "#EAF2FB" : "#fff",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {baixaHasTie && (
        <div style={styles.desempateBlock}>
          <span style={styles.desempateLabel}>
            EMPATE NA NOTA MAIS BAIXA DE PROJETO DE VIDA (nota {projMin.min})
          </span>
          <p style={styles.desempateHint}>
            Escolha o que tem mais a ver com o conteúdo da sua decisão específica.
          </p>
          <div style={styles.desempateOptions}>
            {projMin.items.map((item) => (
              <button
                key={item}
                onClick={() => setBaixaEscolhida(item)}
                style={{
                  ...styles.desempateOption,
                  borderColor: baixaEscolhida === item ? LIGHTBLUE : "#E4EAF0",
                  background: baixaEscolhida === item ? "#EAF2FB" : "#fff",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepConflito({ decisao, tipoDesafio, resultado }) {
  const { resumo, picoGeral, projMin } = resultado;
  const isFullTie = projMin && projMin.items.length === 5;

  const [destravarIA, setDestravarIA] = useState(null);
  const [carregandoDestravar, setCarregandoDestravar] = useState(false);

  const altoNome = picoGeral ? picoGeral.top.join(" e ") : null;
  const baixoNome = projMin && !isFullTie ? projMin.items.join(" e ") : null;

  useEffect(() => {
    let cancelado = false;
    setDestravarIA(null);
    if (!picoGeral || !decisao) return;
    setCarregandoDestravar(true);
    const tipo = TIPOS_DESAFIO.find((t) => t.id === tipoDesafio);
    const prompt =
      `${LIVRO_CONTEXTO}\n\n` +
      `Alguém que usou a ferramenta acima acabou de identificar um conflito de lealdade que está ` +
      `travando uma decisão de sucessão familiar. A decisão é: "${decisao}".${tipo ? ` Contexto do ` +
      `tipo de desafio: ${tipo.lente}` : ""} A lealdade que mais ` +
      `pesa é "${altoNome}" (quadrante ${picoGeral.name})${baixoNome ? `, puxando contra "${baixoNome}" (Projeto de Vida)` : ""}.\n\n` +
      `Escreva uma orientação curta (2-3 frases, no máximo 70 palavras) e prática de como começar ` +
      `a destravar isso, específica pra essa decisão e essa lealdade, não genérica. Se fizer sentido, ` +
      `inspire-se no padrão de algum dos três casos reais do método (mas sem citar os nomes deles, ` +
      `a pessoa não os conhece). Tom direto, acolhedor, sem clichês de autoajuda. Responda só com o ` +
      `texto, sem introdução, em português do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => {
        if (!cancelado && texto) setDestravarIA(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoDestravar(false);
      });

    return () => {
      cancelado = true;
    };
  }, [decisao, tipoDesafio, picoGeral && picoGeral.key, altoNome, baixoNome]);

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 1 DE 7 · CONFLITO IDENTIFICADO</span>
      <h1 style={styles.h1}>Aqui está o que travava a decisão de:</h1>
      <p style={styles.decisionEcho}>&ldquo;{decisao}&rdquo;</p>

      <div style={styles.resumoGrid}>
        {resumo.map((r) => (
          <div key={r.key} style={styles.resumoCard}>
            <div style={{ ...styles.resumoBar, background: r.color }} />
            <div style={styles.resumoCardInner}>
              <span style={styles.resumoName}>{r.name}</span>
              <span style={styles.resumoValue}>
                {r.top.length === 0
                  ? "—"
                  : r.top.length === r.applicableCount
                  ? "nenhum item se destaca"
                  : r.top.join(" · ")}
              </span>
              {r.max !== null && r.top.length < r.applicableCount && (
                <span style={styles.resumoScore}>nota {r.max}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {picoGeral && projMin && (
        <div style={styles.conflictBox}>
          <span style={styles.conflictLabel}>CONFLITO DE LEALDADE IDENTIFICADO</span>
          <p style={styles.conflictText}>
            <strong>
              {picoGeral.top.join(" e ")} ({picoGeral.max})
            </strong>{" "}
            versus{" "}
            {isFullTie ? (
              <strong>Projeto de Vida como um todo (nenhum item se destaca)</strong>
            ) : (
              <strong>
                {projMin.items.join(" e ")} ({projMin.min})
              </strong>
            )}
          </p>
          <p style={styles.conflictHelp}>
            Isso costuma significar que essa lealdade está pesando mais do que o que você
            mesmo quer para si nessa decisão. Não é um diagnóstico fechado, é o ponto de
            partida certo para o próximo passo: a Reflexão Individual.
          </p>
        </div>
      )}

      {picoGeral && projMin && (
        <div style={styles.unlockBox}>
          <span style={styles.unlockLabel}>ONDE PESA, E COMO DESTRAVAR</span>
          <p style={styles.unlockWhere}>
            A decisão está pesando principalmente em <strong>{picoGeral.name}</strong>
            {picoGeral.top.length === 1 ? (
              <>
                , puxada por <strong>{picoGeral.top[0]}</strong>
              </>
            ) : (
              <>
                , puxada por <strong>{picoGeral.top.join(" e ")}</strong>
              </>
            )}
            .
          </p>
          {carregandoDestravar ? (
            <p style={styles.unlockHow}>
              <span style={{ opacity: 0.6 }}>Gerando orientação pra sua situação específica…</span>
            </p>
          ) : (
            <>
              <p style={styles.unlockHow}>
                {destravarIA ||
                  UNLOCK_GUIDANCE[picoGeral.key] ||
                  "Vale nomear especificamente o que essa lealdade está pedindo de você, e checar se isso é real ou uma suposição."}
              </p>
              {destravarIA && <span style={styles.aiTag}>✦ gerado pra sua decisão</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CampoReflexao({ pergunta, valor, onChange, placeholder, contexto, contextoLivro }) {
  const [alternativas, setAlternativas] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [valorGerado, setValorGerado] = useState(null);

  const textoMudouBastante =
    alternativas && valor.trim() !== (valorGerado || "").trim() && valor.trim().length > 0;

  const aprofundar = () => {
    setGerando(true);
    const respostaAtual = valor.trim();
    const vazio = respostaAtual.length < 3;

    const prompt =
      `${contextoLivro || LIVRO_CONTEXTO}\n\n` +
      `Alguém está respondendo, na Reflexão Individual, à pergunta "${pergunta}", dentro do contexto: ` +
      `${contexto}\n\n` +
      (vazio
        ? `A pessoa ainda não escreveu nada. Gere 3 perguntas CURTAS (no máximo 15 palavras cada) que ` +
          `ajudem a destravar o início da resposta, ancoradas no contexto específico dela (a decisão e ` +
          `a lealdade citadas acima), não genéricas.\n\n`
        : `A pessoa já escreveu isto: "${respostaAtual}"\n\n` +
          `Leia com atenção o que ela escreveu. Gere 3 perguntas CURTAS de aprofundamento (no máximo ` +
          `18 palavras cada), cada uma reagindo a uma palavra, frase ou lacuna ESPECÍFICA do que ela ` +
          `escreveu (cite ou parafraseie um trecho da resposta dela em pelo menos 2 das 3 perguntas), ` +
          `não perguntas genéricas que serviriam pra qualquer resposta. Não responda por ela, não ` +
          `sugira a resposta certa, só aponte o que ficou de fora ou raso.\n\n`) +
      `Formate como uma lista numerada de 1 a 3, uma pergunta por linha, sem nada além disso, em ` +
      `português do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => {
        const linhas = texto
          .split("\n")
          .map((l) => l.replace(/^\d+[.).\s]+/, "").trim())
          .filter((l) => l.length > 3);
        setAlternativas(linhas.slice(0, 3));
        setValorGerado(valor);
      })
      .catch(() => setAlternativas([]))
      .finally(() => setGerando(false));
  };

  return (
    <>
      <label style={styles.fieldLabel}>{pergunta}</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={valor}
        onChange={onChange}
        placeholder={placeholder}
      />
      {(!alternativas || textoMudouBastante) && (
        <button onClick={aprofundar} disabled={gerando} style={styles.demoLink}>
          {gerando
            ? "Gerando perguntas…"
            : alternativas
            ? "✦ Aprofundar de novo, com base no que você acrescentou"
            : "✦ Aprofundar essa resposta"}
        </button>
      )}
      {alternativas && alternativas.length > 0 && (
        <div style={styles.aprofundarBox}>
          <span style={styles.aiTag}>✦ escolha a que fizer mais sentido pra você</span>
          {alternativas.map((alt, i) => (
            <p key={i} style={styles.aprofundarItem}>
              {alt}
            </p>
          ))}
        </div>
      )}
    </>
  );
}

function StepReflexao({ reflexao, setReflexao, resultado, decisao, tipoDesafio }) {
  const set = (field) => (e) => setReflexao((r) => ({ ...r, [field]: e.target.value }));
  const alto = resultado.picoGeral ? resultado.picoGeral.top.join(" e ") : "essa lealdade";
  const baixoTem =
    resultado.projMin && resultado.projMin.items.length > 0 && resultado.projMin.items.length < 5;
  const baixo = baixoTem ? resultado.projMin.items.join(" e ") : null;
  const tipo = TIPOS_DESAFIO.find((t) => t.id === tipoDesafio);
  const contexto = `decisão "${decisao}", lealdade em conflito "${alto}"${
    tipo ? `. Contexto do tipo de desafio: ${tipo.lente}` : ""
  }`;

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 2 DE 7 · REFLEXÃO INDIVIDUAL</span>
      <h1 style={styles.h1}>
        Sozinho, antes de qualquer conversa em grupo.
      </h1>
      <p style={styles.lead}>
        Você identificou que <strong style={{ color: BLUE }}>&ldquo;{alto}&rdquo;</strong> está
        pesando mais nessa decisão{baixo ? (
          <>
            {" "}
            do que <strong style={{ color: BLUE }}>&ldquo;{baixo}&rdquo;</strong>
          </>
        ) : (
          ""
        )}
        . Ninguém além de você vai ler isso. Escreva o que for verdade, não o que soa bem.
      </p>

      <CampoReflexao
        pergunta={`Qual foi minha maior descoberta sobre o peso de "${alto}" nessa decisão?`}
        valor={reflexao.descoberta}
        onChange={set("descoberta")}
        placeholder="O que você percebeu que não tinha percebido antes…"
        contexto={contexto}
      />

      <CampoReflexao
        pergunta="O que eu faço por convicção nessa decisão?"
        valor={reflexao.conviccao}
        onChange={set("conviccao")}
        placeholder="Escolhas que você faria mesmo sem nenhuma pressão externa…"
        contexto={contexto}
      />

      <CampoReflexao
        pergunta={`O que eu faço só por causa de "${alto}", por obrigação?`}
        valor={reflexao.obrigacao}
        onChange={set("obrigacao")}
        placeholder="Escolhas mantidas para não decepcionar, magoar ou romper com alguém…"
        contexto={contexto}
      />
    </div>
  );
}

function StepConsolidacao({ consolidacao, setConsolidacao, resultado, decisao, tipoDesafio, reflexao }) {
  const set = (field) => (e) => setConsolidacao((c) => ({ ...c, [field]: e.target.value }));
  const alto = resultado.picoGeral ? resultado.picoGeral.top.join(" e ") : "essa lealdade";

  const [script, setScript] = useState(null);
  const [gerandoScript, setGerandoScript] = useState(false);

  const prepararConversa = () => {
    setGerandoScript(true);
    setScript(null);
    const tipo = TIPOS_DESAFIO.find((t) => t.id === tipoDesafio);
    const prompt =
      `${LIVRO_CONTEXTO}\n\n` +
      `Você ajuda alguém que usou a ferramenta acima a se preparar para a Consolidação Familiar. ` +
      `A decisão em jogo é: "${decisao}".${tipo ? ` Contexto do tipo de desafio: ${tipo.lente}` : ""} A pessoa descobriu que a lealdade "${alto}" está pesando ` +
      `mais do que gostaria nessa decisão.${reflexao && reflexao.descoberta ? ` A maior descoberta dela na reflexão individual foi: "${reflexao.descoberta}".` : ""}\n\n` +
      `Sugira 2-3 frases curtas de abertura que essa pessoa poderia usar para começar essa conversa ` +
      `em família, de um jeito que não soe como acusação, e sim como convite a entender juntos. ` +
      `Siga os erros comuns a evitar do método (nunca sugerir usar a descoberta como arma). ` +
      `Formate como uma lista curta. Responda só com as frases, sem introdução, em português do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => setScript(texto))
      .catch(() => setScript("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerandoScript(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 3 DE 7 · CONSOLIDAÇÃO FAMILIAR</span>
      <h1 style={styles.h1}>Em grupo, com um facilitador conduzindo a conversa.</h1>
      <p style={styles.lead}>
        Leve o que você descobriu sobre <strong style={{ color: BLUE }}>&ldquo;{alto}&rdquo;</strong>{" "}
        para uma conversa de verdade. Compartilhe o insight, não as notas numéricas.
      </p>

      {!script && (
        <button onClick={prepararConversa} disabled={gerandoScript} style={styles.demoLink}>
          {gerandoScript ? "Gerando sugestão…" : "✦ Preciso de ajuda para começar a conversa"}
        </button>
      )}
      {script && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ sugestão gerada pra sua situação</span>
          <p style={styles.scriptText}>{script}</p>
        </div>
      )}

      <p style={styles.lead}>Depois da conversa, volte aqui e registre:</p>

      <label style={styles.fieldLabel}>
        O que mudou ao compartilhar o peso de &ldquo;{alto}&rdquo; com a família?
      </label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={consolidacao.descoberta}
        onChange={set("descoberta")}
        placeholder="Ex.: percebi que essa pessoa nunca tinha dito isso com clareza…"
      />

      <label style={styles.fieldLabel}>Como isso muda a forma de decidir daqui para frente?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={consolidacao.impacto}
        onChange={set("impacto")}
        placeholder="Ex.: combinamos que…"
      />
    </div>
  );
}

function StepDecisaoFinal({ resultado, decisaoFinal, setDecisaoFinal }) {
  const item = resultado.picoGeral ? resultado.picoGeral.top.join(" e ") : "essa lealdade";
  const options = [
    { key: "preservar", label: "Preservar", desc: "Faz sentido manter essa lealdade como está" },
    { key: "transformar", label: "Transformar", desc: "Renegociar ou expressar de outra forma" },
    { key: "deixar", label: "Deixar para trás", desc: "Soltar com consciência, sem culpa" },
  ];
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 4 DE 7 · DECISÃO FINAL</span>
      <h1 style={styles.h1}>
        O que fazer com <em style={{ color: BLUE }}>&ldquo;{item}&rdquo;</em>?
      </h1>
      <p style={styles.lead}>
        Isso é uma proposta sua, não uma decisão sobre a vida de outra pessoa. Se envolve
        mudar o papel de alguém, isso ainda precisa ser negociado com essa pessoa, não
        decidido por você sozinho.
      </p>
      <div style={styles.decisaoFinalOptions}>
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => setDecisaoFinal((d) => ({ ...d, classificacao: o.key }))}
            style={{
              ...styles.decisaoFinalCard,
              borderColor: decisaoFinal.classificacao === o.key ? BLUE : "#E4EAF0",
              background: decisaoFinal.classificacao === o.key ? "#EAF2FB" : "#fff",
            }}
          >
            <span style={styles.decisaoFinalLabel}>{o.label}</span>
            <span style={styles.decisaoFinalDesc}>{o.desc}</span>
          </button>
        ))}
      </div>
      <label style={styles.fieldLabel}>
        Como você imagina isso funcionando? (rascunho, ainda a negociar)
      </label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoFinal.como}
        onChange={(e) => setDecisaoFinal((d) => ({ ...d, como: e.target.value }))}
        placeholder="Ex.: eu proporia que ele participasse como conselheiro estratégico, mas isso é algo pra conversar com ele, não pra decidir por ele…"
      />
    </div>
  );
}

function StepPlano({ plano, setPlano, decisao, tipoDesafio, resultado, decisaoFinal, reflexao }) {
  const [gerandoSugestao, setGerandoSugestao] = useState(false);
  const [sugestaoErro, setSugestaoErro] = useState(false);

  const classifLabel = { preservar: "Preservar", transformar: "Transformar", deixar: "Deixar para trás" };
  const item = resultado.picoGeral ? resultado.picoGeral.top.join(" e ") : "essa lealdade";

  const addAcao = () =>
    setPlano((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, acao: "", responsavel: "", prazo: "" },
    ]);
  const removeAcao = (id) => setPlano((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setPlano((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirAcoes = () => {
    setGerandoSugestao(true);
    setSugestaoErro(false);
    const tipo = TIPOS_DESAFIO.find((t) => t.id === tipoDesafio);
    const prompt =
      `${LIVRO_CONTEXTO}\n\n` +
      `Você ajuda alguém que já percorreu a ferramenta acima a transformar a decisão em um plano ` +
      `de ação de verdade. Contexto:\n` +
      `- Decisão: "${decisao}"\n` +
      `${tipo ? `- Tipo de desafio: ${tipo.lente}\n` : ""}` +
      `- Lealdade em conflito: "${item}"\n` +
      `- Classificação escolhida: ${decisaoFinal.classificacao ? classifLabel[decisaoFinal.classificacao] : "não definida"}` +
      `${decisaoFinal.como ? `, proposta: "${decisaoFinal.como}"` : ""}\n` +
      `${reflexao && reflexao.descoberta ? `- Maior descoberta na Reflexão Individual: "${reflexao.descoberta}"\n` : ""}\n` +
      `Sugira 3 ações em sequência cronológica (a primeira mais imediata, a última mais à frente), ` +
      `cada uma no infinitivo, com responsável e prazo sugeridos. Lembre que isso ainda precisa ser ` +
      `negociado com quem for afetado, não é uma decisão unilateral.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"acao":"","responsavel":"","prazo":""},{"acao":"","responsavel":"","prazo":""},` +
      `{"acao":"","responsavel":"","prazo":""}]`;

    callClaude(prompt, 400)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlano(
            parsed.map((a, i) => ({
              id: i + 1,
              acao: a.acao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
            }))
          );
        }
      })
      .catch(() => setSugestaoErro(true))
      .finally(() => setGerandoSugestao(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 5 DE 7 · PLANO DE AÇÃO</span>
      <h1 style={styles.h1}>Transforme a decisão em ações concretas, em sequência.</h1>
      <p style={styles.lead}>
        Uma ação sem responsável e prazo tende a virar apenas uma boa intenção. Pense em 2 ou 3
        passos, do mais imediato ao mais à frente. Isso é um rascunho, será revisado com a
        família antes de virar definitivo.
      </p>

      <button onClick={sugerirAcoes} disabled={gerandoSugestao} style={styles.demoLink}>
        {gerandoSugestao ? "Gerando sugestões…" : "✦ Sugerir 3 ações em sequência"}
      </button>
      {sugestaoErro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {plano.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              {plano.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.acao}
              onChange={(e) => setAcao(a.id, "acao", e.target.value)}
              placeholder="Ex.: assumir formalmente a diretoria-geral, com modelo de liderança próprio…"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: 45 dias"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra ação
      </button>
    </div>
  );
}

function StepAlinhamento({ alinhamento, setAlinhamento }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 6 DE 7 · ALINHAMENTO COM A FAMÍLIA</span>
      <h1 style={styles.h1}>Antes de virar definitivo, volte com quem participou.</h1>
      <p style={styles.lead}>
        O objetivo não é pedir permissão, é checar se o caminho faz sentido para quem vai
        conviver com essa decisão.
      </p>

      <label style={styles.fieldLabel}>Esse plano faz sentido para eles também?</label>
      <div style={styles.simNaoRow}>
        <button
          onClick={() => setAlinhamento((a) => ({ ...a, fazSentido: true }))}
          style={{
            ...styles.simNaoButton,
            borderColor: alinhamento.fazSentido === true ? BLUE : "#E4EAF0",
            background: alinhamento.fazSentido === true ? "#EAF2FB" : "#fff",
          }}
        >
          Sim
        </button>
        <button
          onClick={() => setAlinhamento((a) => ({ ...a, fazSentido: false }))}
          style={{
            ...styles.simNaoButton,
            borderColor: alinhamento.fazSentido === false ? BLUE : "#E4EAF0",
            background: alinhamento.fazSentido === false ? "#EAF2FB" : "#fff",
          }}
        >
          Ainda não, precisa ajustar
        </button>
      </div>

      <label style={styles.fieldLabel}>Falta alguma coisa que eles veem e você não viu? (opcional)</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={alinhamento.faltaAlgo}
        onChange={(e) => setAlinhamento((a) => ({ ...a, faltaAlgo: e.target.value }))}
      />

      <label style={styles.fieldLabel}>Como eles querem participar dessa ação? (opcional)</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={alinhamento.comoParticipar}
        onChange={(e) => setAlinhamento((a) => ({ ...a, comoParticipar: e.target.value }))}
      />
    </div>
  );
}

function StepFechamento({
  decisao,
  resultado,
  decisaoFinal,
  plano,
  reflexao,
  consolidacao,
  onReiniciar,
  role,
  scores,
  alinhamento,
  envioId,
  tipoDesafio,
}) {
  const classifLabel = { preservar: "Preservar", transformar: "Transformar", deixar: "Deixar para trás" };
  const [salvando, setSalvando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setSalvando(true);
    setErroSalvar(false);

    const conflito = resultado.picoGeral
      ? {
          alto: resultado.picoGeral.top,
          alto_quadrante: resultado.picoGeral.name,
          alto_nota: resultado.picoGeral.max,
          baixo: resultado.projMin ? resultado.projMin.items : [],
          baixo_nota: resultado.projMin ? resultado.projMin.min : null,
          tipo_desafio: tipoDesafio || null,
        }
      : { tipo_desafio: tipoDesafio || null };

    supabaseInsert("respostas", {
      envio_id: envioId || null,
      ferramenta_numero: 1,
      papel: role,
      decisao,
      notas: scores,
      conflito,
      reflexao,
      consolidacao,
      decisao_final: decisaoFinal,
      plano_acao: plano,
      alinhamento,
    })
      .then(() => {
        if (!cancelado) setSalvo(true);
      })
      .catch(() => {
        if (!cancelado) setErroSalvar(true);
      })
      .finally(() => {
        if (!cancelado) setSalvando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const montarResumo = () => {
    const linhas = [
      `Decisão: ${decisao}`,
      "",
      `Conflito de lealdade: ${resultado.picoGeral ? resultado.picoGeral.top.join(" e ") : "—"}`,
      "",
      `Maior descoberta (Reflexão Individual): ${reflexao.descoberta || "—"}`,
      "",
      `Descoberta na Consolidação Familiar: ${consolidacao.descoberta || "—"}`,
      "",
      `Decisão final: ${decisaoFinal.classificacao ? classifLabel[decisaoFinal.classificacao] : "—"}${decisaoFinal.como ? " — " + decisaoFinal.como : ""}`,
      "",
      "Plano de ação:",
      plano
        .filter((a) => a.acao.trim())
        .map((a, i) => `${i + 1}. ${a.acao} — Responsável: ${a.responsavel || "—"} — Prazo: ${a.prazo || "—"}`)
        .join("\n") || "—",
    ];
    return linhas.join("\n");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      notifyConsultor("Meu resultado — Raízes das Lealdades Invisíveis", montarResumo());
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stepWrap}>
      <div style={styles.saveStatus}>
        {salvando && <span style={styles.saveStatusText}>Salvando seu resultado…</span>}
        {!salvando && salvo && <span style={styles.saveStatusOk}>✓ Resultado salvo</span>}
        {!salvando && erroSalvar && (
          <span style={styles.saveStatusErr}>Não deu pra salvar automaticamente, use o e-mail abaixo</span>
        )}
      </div>
      <span style={styles.eyebrowSmall}>PASSO 7 DE 7 · FECHAMENTO</span>
      <h1 style={styles.h1}>Do achado à ação, resumido.</h1>
      <p style={styles.decisionEcho}>&ldquo;{decisao}&rdquo;</p>

      <div style={styles.fechamentoBox}>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>CONFLITO</span>
          <span style={styles.fechamentoValue}>
            {resultado.picoGeral ? resultado.picoGeral.top.join(" e ") : "—"}
          </span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>DECISÃO</span>
          <span style={styles.fechamentoValue}>
            {decisaoFinal.classificacao ? classifLabel[decisaoFinal.classificacao] : "—"}
            {decisaoFinal.como ? ` — ${decisaoFinal.como}` : ""}
          </span>
        </div>
      </div>

      <div style={styles.familiaList}>
        {plano
          .filter((a) => a.acao.trim())
          .map((a, i) => (
            <div key={a.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              <span style={styles.papelDescricao}>{a.acao}</span>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>RESPONSÁVEL</span>
                <span style={styles.fechamentoValue}>{a.responsavel || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>PRAZO</span>
                <span style={styles.fechamentoValue}>{a.prazo || "—"}</span>
              </div>
            </div>
          ))}
      </div>

      <div style={styles.ctaBox}>
        <p style={styles.ctaTitle}>Agora é executar, com acompanhamento.</p>
        <p style={styles.ctaSub}>
          Você percorreu as 7 etapas: nomeou o conflito, refletiu sozinho, conversou com a
          família, decidiu, planejou e alinhou. O que falta agora é colocar em prática, e
          rever se o plano continua fazendo sentido ao longo do caminho.
        </p>
      </div>

      <p style={{ ...styles.papelDescricao, marginTop: 4 }} className="no-print">
        Um resumo desse resultado já foi enviado automaticamente pro consultor.
      </p>
      <div style={styles.finalButtonsRow} className="no-print">
        <button onClick={() => window.print()} style={styles.ctaButton}>
          🖨️ Baixar / imprimir PDF
        </button>
        <button onClick={onReiniciar} style={styles.restartButton}>
          ↺ Voltar ao início
        </button>
      </div>
    </div>
  );
}

const STEP_F2_DISTRIBUICAO = 0;
const STEP_F2_PREDOMINANTES = 1;
const STEP_F2_CONTRIBUICOES = 2;
const STEP_F2_REFLEXAO = 3;
const STEP_F2_CONSOLIDACAO = 4;
const STEP_F2_DECISAO = 5;
const STEP_F2_PLANO = 6;
const STEP_F2_FECHAMENTO = 7;

function initPontosF2() {
  return PAPEIS.reduce((acc, p) => {
    acc[p.key] = null;
    return acc;
  }, {});
}

function papeisDominantesF2(pontos) {
  const comPontos = PAPEIS.filter((p) => pontos[p.key] !== null && pontos[p.key] > 0)
    .slice()
    .sort((a, b) => pontos[b.key] - pontos[a.key]);
  const dominantes = comPontos.filter((p) => pontos[p.key] >= 4);
  if (dominantes.length > 0) return dominantes.slice(0, 3);
  return comPontos.slice(0, 2);
}

function rankingF2(pontos) {
  return PAPEIS.filter((p) => pontos[p.key] !== null && pontos[p.key] > 0)
    .slice()
    .sort((a, b) => pontos[b.key] - pontos[a.key])
    .slice(0, 3);
}

const MARINA_EXEMPLO_F2 = {
  pontos: {
    protetor: 4,
    controlador: 1,
    pacificador: 1,
    heroi: 1,
    rebelde: 0,
    invisivel: 0,
    escolhido: 5,
    guardiao: 2,
  },
  contribuicoes: {
    escolhido: {
      comoAjuda: "Me dá clareza e legitimidade, todo mundo já sabe que serei eu a assumir.",
      comoLimita: "Não sobra espaço pra eu escolher meu próprio jeito de liderar, sinto que preciso repetir o dele.",
    },
    protetor: {
      comoAjuda: "Evito magoar meu pai ou fazer ele se sentir substituído antes da hora.",
      comoLimita: "Acabo adiando a minha própria assunção do cargo só pra não parecer que estou empurrando ele pra fora.",
    },
  },
  reflexaoF2: {
    influencia: "O papel de 'Escolhida': sinto que preciso assumir exatamente como ele assumiria, não do meu jeito.",
    limita: "Não decido nada sem imaginar se ele aprovaria, mesmo que ele nunca tenha dito isso com todas as letras.",
    mudar: "Perguntar direto pra ele o que ele espera de verdade, em vez de continuar supondo.",
  },
  familia: [{ id: 1, nome: "Meu pai", papel: "guardiao" }],
  decisaoPapeis: {
    fortalecer: "Meu jeito próprio de liderar, mesmo que seja diferente do dele.",
    reduzir: "A parte do papel de Escolhida que me faz tentar copiar o estilo dele em vez de criar o meu.",
  },
  planoF2: [
    {
      id: 1,
      acao: "Ter uma conversa aberta com meu pai perguntando o que ele espera de mim de verdade, como sucessora.",
      responsavel: "Marina",
      prazo: "30 dias",
    },
    {
      id: 2,
      acao: "Assumir formalmente a diretoria-geral com um estilo de liderança próprio, combinado com o pai.",
      responsavel: "Marina",
      prazo: "60 dias",
    },
  ],
};

const ANTONIO_EXEMPLO_F2 = {
  pontos: {
    protetor: 1,
    controlador: 5,
    pacificador: 0,
    heroi: 2,
    rebelde: 0,
    invisivel: 0,
    escolhido: 0,
    guardiao: 4,
  },
  contribuicoes: {
    controlador: {
      comoAjuda: "Por décadas isso evitou erros caros e manteve a empresa de pé nos momentos difíceis.",
      comoLimita: "Hoje trava a diretoria e o sucessor, que não consegue decidir nada sem minha aprovação.",
    },
    guardiao: {
      comoAjuda: "Mantém viva a história e os valores que fundaram a empresa.",
      comoLimita: "Às vezes me faz resistir a mudanças que a empresa precisa pra continuar evoluindo.",
    },
  },
  reflexaoF2: {
    influencia: "O papel de Controlador: não solto uma aprovação financeira sem checar pessoalmente, mesmo tendo gente capaz pra isso.",
    limita: "Isso impede meu sucessor de desenvolver a própria autoridade e trava decisões que ele já teria condição de tomar sozinho.",
    mudar: "Delegar formalmente as aprovações de rotina, e reservar minha assinatura só pra decisões estratégicas maiores.",
  },
  familia: [{ id: 1, nome: "Meu sucessor", papel: "heroi" }],
  decisaoPapeis: {
    fortalecer: "Meu papel de Guardião do Legado, mas exercido como conselheiro, não como aprovador do dia a dia.",
    reduzir: "O Controlador, preciso soltar as aprovações operacionais de rotina.",
  },
  planoF2: [
    {
      id: 1,
      acao: "Comunicar ao conselho a intenção de iniciar a transição de aprovações financeiras.",
      responsavel: "Antônio",
      prazo: "15 dias",
    },
    {
      id: 2,
      acao: "Transferir formalmente as aprovações financeiras de rotina ao sucessor, mantendo comigo só as decisões estratégicas.",
      responsavel: "Antônio, com o sucessor",
      prazo: "90 dias",
    },
  ],
};

function Ferramenta2App({ onVoltarCatalogo, envioIdInicial }) {
  const [step, setStep] = useState(STEP_F2_DISTRIBUICAO);
  const [pontos, setPontos] = useState(initPontosF2());
  const [contribuicoes, setContribuicoes] = useState({});
  const [reflexaoF2, setReflexaoF2] = useState({ influencia: "", limita: "", mudar: "" });
  const [familia, setFamilia] = useState([{ id: 1, nome: "", papel: "" }]);
  const [decisaoPapeis, setDecisaoPapeis] = useState({ fortalecer: "", reduzir: "" });
  const [planoF2, setPlanoF2] = useState([{ id: 1, acao: "", responsavel: "", prazo: "" }]);

  const dominantes = useMemo(() => papeisDominantesF2(pontos), [pontos]);
  const ranking = useMemo(() => rankingF2(pontos), [pontos]);
  const todasPreenchidas = useMemo(
    () => PAPEIS.every((p) => pontos[p.key] !== null),
    [pontos]
  );

  const setPonto = (key, val) => {
    setPontos((prev) => ({ ...prev, [key]: val }));
  };

  const carregarExemploF2 = (exemplo) => {
    setPontos(exemplo.pontos);
    setContribuicoes(exemplo.contribuicoes);
    setReflexaoF2(exemplo.reflexaoF2);
    setFamilia(exemplo.familia);
    setDecisaoPapeis(exemplo.decisaoPapeis);
    setPlanoF2(exemplo.planoF2);
    setStep(STEP_F2_PREDOMINANTES);
  };

  const setContribuicao = (key, field, val) => {
    setContribuicoes((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { comoAjuda: "", comoLimita: "" }), [field]: val },
    }));
  };

  const addFamiliar = () =>
    setFamilia((prev) => [...prev, { id: (prev[prev.length - 1]?.id || 0) + 1, nome: "", papel: "" }]);
  const removeFamiliar = (id) => setFamilia((prev) => prev.filter((f) => f.id !== id));
  const setFamiliar = (id, field, val) =>
    setFamilia((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: val } : f)));

  const canAdvance = () => {
    if (step === STEP_F2_DISTRIBUICAO) return todasPreenchidas;
    if (step === STEP_F2_PREDOMINANTES) return true;
    if (step === STEP_F2_CONTRIBUICOES) {
      return dominantes.every((p) => (contribuicoes[p.key]?.comoLimita || "").trim().length > 3);
    }
    if (step === STEP_F2_REFLEXAO) {
      return (
        reflexaoF2.influencia.trim().length > 3 &&
        reflexaoF2.limita.trim().length > 3 &&
        reflexaoF2.mudar.trim().length > 3
      );
    }
    if (step === STEP_F2_CONSOLIDACAO) return true;
    if (step === STEP_F2_DECISAO) {
      return decisaoPapeis.fortalecer.trim().length > 3 && decisaoPapeis.reduzir.trim().length > 3;
    }
    if (step === STEP_F2_PLANO) {
      return planoF2.some(
        (p) => p.acao.trim().length > 3 && p.responsavel.trim().length > 0 && p.prazo.trim().length > 0
      );
    }
    return true;
  };

  const goNext = () => setStep((s) => Math.min(STEP_F2_FECHAMENTO, s + 1));
  const goBack = () => setStep((s) => Math.max(STEP_F2_DISTRIBUICAO, s - 1));

  return (
    <>
      <Header2 step={step} onVoltarCatalogo={onVoltarCatalogo} />
      <div style={styles.body}>
        {step === STEP_F2_DISTRIBUICAO && (
          <StepDistribuicao
            pontos={pontos}
            setPonto={setPonto}
            onCarregarExemploMarina={() => carregarExemploF2(MARINA_EXEMPLO_F2)}
            onCarregarExemploAntonio={() => carregarExemploF2(ANTONIO_EXEMPLO_F2)}
          />
        )}
        {step === STEP_F2_PREDOMINANTES && <StepPredominantes pontos={pontos} ranking={ranking} />}
        {step === STEP_F2_CONTRIBUICOES && (
          <StepContribuicoes
            dominantes={dominantes}
            contribuicoes={contribuicoes}
            setContribuicao={setContribuicao}
          />
        )}
        {step === STEP_F2_REFLEXAO && (
          <StepReflexaoF2
            reflexaoF2={reflexaoF2}
            setReflexaoF2={setReflexaoF2}
            dominantes={dominantes}
          />
        )}
        {step === STEP_F2_CONSOLIDACAO && (
          <StepConsolidacaoF2
            familia={familia}
            addFamiliar={addFamiliar}
            removeFamiliar={removeFamiliar}
            setFamiliar={setFamiliar}
            dominantes={dominantes}
            reflexaoF2={reflexaoF2}
          />
        )}
        {step === STEP_F2_DECISAO && (
          <StepDecisaoF2 decisaoPapeis={decisaoPapeis} setDecisaoPapeis={setDecisaoPapeis} />
        )}
        {step === STEP_F2_PLANO && (
          <StepPlanoF2
            planoF2={planoF2}
            setPlanoF2={setPlanoF2}
            dominantes={dominantes}
            decisaoPapeis={decisaoPapeis}
            reflexaoF2={reflexaoF2}
          />
        )}
        {step === STEP_F2_FECHAMENTO && (
          <StepFechamentoF2
            pontos={pontos}
            ranking={ranking}
            dominantes={dominantes}
            contribuicoes={contribuicoes}
            reflexaoF2={reflexaoF2}
            familia={familia}
            decisaoPapeis={decisaoPapeis}
            planoF2={planoF2}
            onReiniciar={onVoltarCatalogo}
            envioId={envioIdInicial}
          />
        )}
      </div>
      {step < STEP_F2_FECHAMENTO && (
        <Footer
          step={step}
          canAdvance={canAdvance()}
          isLastQuadrante={false}
          isDesempate={false}
          isPenultimate={step === STEP_F2_PLANO}
          onBack={goBack}
          onNext={goNext}
        />
      )}
    </>
  );
}

function Header2({ step, onVoltarCatalogo }) {
  const labels = [
    "Distribuir pontos",
    "Papéis predominantes",
    "Contribuições e riscos",
    "Reflexão individual",
    "Consolidação familiar",
    "Decisão",
    "Plano de ação",
    "Fechamento",
  ];
  const progress = Math.round((step / STEP_F2_FECHAMENTO) * 100);
  return (
    <div style={styles.header} className="no-print">
      <div style={styles.headerTop}>
        <button onClick={onVoltarCatalogo} style={styles.backToCatalogo}>
          ← Catálogo
        </button>
        <span style={styles.stepLabel}>Radar de Papéis Ocultos · {labels[step]}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

function StepDistribuicao({ pontos, setPonto, onCarregarExemploMarina, onCarregarExemploAntonio }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 1 DE 7 · DÊ UMA NOTA PARA CADA PAPEL</span>
      <h1 style={styles.h1}>Qual papel você costuma assumir dentro da família empresária?</h1>
      <p style={styles.lead}>
        De 0 a 5, o quanto cada papel abaixo descreve seu comportamento típico na família e na
        empresa. Pontue o que você realmente faz, não o que gostaria de fazer — é normal que 2
        ou 3 papéis fiquem com nota alta e os demais baixa.
      </p>

      <div style={styles.demoLinksRow}>
        <button onClick={onCarregarExemploMarina} style={styles.demoLink}>
          ⚡ Exemplo: Marina (herdeira)
        </button>
        <button onClick={onCarregarExemploAntonio} style={styles.demoLink}>
          ⚡ Exemplo: Antônio (fundador)
        </button>
      </div>

      <div style={styles.legendBox}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: "#D7DEE6" }}>0–1</span>
          <span>Pouco expressado, não é um padrão relevante hoje</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: "#A9C4E0" }}>2–3</span>
          <span>Aparece em algumas situações, mas não domina</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: BLUE, color: "#fff" }}>4–5</span>
          <span>Molda boa parte do seu comportamento</span>
        </div>
      </div>

      <div style={styles.papeisList}>
        {PAPEIS.map((p) => (
          <div key={p.key} style={styles.papelRow}>
            <div style={styles.papelRowText}>
              <span style={styles.papelNome}>{p.nome}</span>
              <span style={styles.papelDescricao}>{p.oQueFaz}</span>
            </div>
            <div style={styles.dots}>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setPonto(p.key, n)}
                  aria-label={`Nota ${n} para ${p.nome}`}
                  style={{
                    ...styles.dot,
                    background: pontos[p.key] === n ? BLUE : "#fff",
                    borderColor: pontos[p.key] === n ? BLUE : "#D7DEE6",
                    color: pontos[p.key] === n ? "#fff" : "#8A97A3",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ pontos }) {
  const size = 300;
  const center = size / 2;
  const maxR = 95;
  const scaleMax = 5;
  const n = PAPEIS.length;

  const angleFor = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const pointFor = (i, valor) => {
    const angle = angleFor(i);
    const r = (Math.min(valor, scaleMax) / scaleMax) * maxR;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const ringPoints = (frac) =>
    PAPEIS.map((_, i) => {
      const angle = angleFor(i);
      const r = maxR * frac;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(" ");

  const dataPoints = PAPEIS.map((p, i) => pointFor(i, pontos[p.key] || 0));
  const dataPath = dataPoints.map((pt) => pt.join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={styles.radarSvg}>
      {[0.25, 0.5, 0.75, 1].map((frac) => (
        <polygon key={frac} points={ringPoints(frac)} fill="none" stroke="#E4EAF0" strokeWidth={1} />
      ))}
      {PAPEIS.map((p, i) => {
        const angle = angleFor(i);
        return (
          <line
            key={p.key}
            x1={center}
            y1={center}
            x2={center + maxR * Math.cos(angle)}
            y2={center + maxR * Math.sin(angle)}
            stroke="#E4EAF0"
            strokeWidth={1}
          />
        );
      })}
      <polygon points={dataPath} fill={LIGHTBLUE} fillOpacity={0.35} stroke={BLUE} strokeWidth={2} />
      {dataPoints.map((pt, i) => (
        <circle key={i} cx={pt[0]} cy={pt[1]} r={3} fill={BLUE} />
      ))}
      {PAPEIS.map((p, i) => {
        const angle = angleFor(i);
        const lx = center + (maxR + 32) * Math.cos(angle);
        const ly = center + (maxR + 32) * Math.sin(angle);
        return (
          <text
            key={p.key}
            x={lx}
            y={ly}
            fontSize={10.5}
            fontWeight={600}
            fill={NAVY}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {p.nome}
          </text>
        );
      })}
    </svg>
  );
}

function StepPredominantes({ pontos, ranking }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 2 DE 7 · PAPÉIS PREDOMINANTES</span>
      <h1 style={styles.h1}>Este é o seu Radar.</h1>
      <p style={styles.lead}>
        Quanto mais um papel se projeta para fora do centro, mais ele molda seu comportamento
        hoje na família e na empresa.
      </p>

      <RadarChart pontos={pontos} />

      <div style={styles.resumoGrid}>
        {ranking.length === 0 && (
          <p style={styles.lead}>Nenhum papel se destacou — revise a distribuição de pontos.</p>
        )}
        {ranking.map((p, i) => {
          const faixa = faixaPapel(pontos[p.key]);
          return (
            <div key={p.key} style={styles.resumoCard}>
              <div style={{ ...styles.resumoBar, background: faixa.cor }} />
              <div style={styles.resumoCardInner}>
                <span style={styles.resumoName}>
                  {i + 1}º · {p.nome}
                </span>
                <span style={styles.resumoValue}>nota {pontos[p.key]}</span>
                <span style={styles.resumoScore}>{faixa.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContribuicaoPapel({ papel, valor, onChange }) {
  const [textoIA, setTextoIA] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setTextoIA(null);
    setCarregando(true);
    const prompt =
      `${LIVRO_CONTEXTO_F2}\n\n` +
      `A pessoa pontuou o papel "${papel.nome}" como um dos seus papéis dominantes. Escreva um ` +
      `parágrafo curto (2-3 frases, no máximo 60 palavras) e específico ajudando ela a reconhecer, ` +
      `na prática do dia a dia dela, como esse papel provavelmente ajuda a família ou empresa, e o ` +
      `que ele provavelmente custa quando exercido em excesso. Inspire-se, sem citar nomes, no ` +
      `padrão de algum dos três casos reais do método. Tom direto, acolhedor, sem clichês. ` +
      `Responda só com o texto, sem introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setTextoIA(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [papel.key]);

  return (
    <div style={styles.contribuicaoBox}>
      <span style={{ ...styles.quadrantBadge, background: BLUE }}>{papel.nome}</span>
      {carregando ? (
        <p style={styles.unlockHow}>
          <span style={{ opacity: 0.6 }}>Gerando reflexão pra esse papel…</span>
        </p>
      ) : (
        <>
          <p style={styles.unlockHow}>
            {textoIA || `${papel.oQueFaz} Em excesso: ${papel.custaExcesso}`}
          </p>
          {textoIA && <span style={styles.aiTag}>✦ gerado pra sua pontuação</span>}
        </>
      )}

      <label style={styles.fieldLabel}>Como esse papel te ajuda hoje?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={valor.comoAjuda}
        onChange={(e) => onChange("comoAjuda", e.target.value)}
        placeholder="O que esse papel te dá, na prática…"
      />
      <label style={styles.fieldLabel}>Como esse papel te limita hoje?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={valor.comoLimita}
        onChange={(e) => onChange("comoLimita", e.target.value)}
        placeholder="O que esse papel te custa, na prática…"
      />
    </div>
  );
}

function StepContribuicoes({ dominantes, contribuicoes, setContribuicao }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 3 DE 7 · CONTRIBUIÇÕES E RISCOS</span>
      <h1 style={styles.h1}>O que esse papel te dá, e o que ele custa.</h1>
      <p style={styles.lead}>
        Preencha isso só para os papéis de maior pontuação. Não é necessário fazer isso para os
        oito papéis.
      </p>

      {dominantes.map((p) => (
        <ContribuicaoPapel
          key={p.key}
          papel={p}
          valor={contribuicoes[p.key] || { comoAjuda: "", comoLimita: "" }}
          onChange={(field, val) => setContribuicao(p.key, field, val)}
        />
      ))}
    </div>
  );
}

function StepReflexaoF2({ reflexaoF2, setReflexaoF2, dominantes }) {
  const set = (field) => (e) => setReflexaoF2((r) => ({ ...r, [field]: e.target.value }));
  const principal = dominantes[0] ? dominantes[0].nome : "esse papel";
  const contexto = `papel predominante "${principal}"`;

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 4 DE 7 · REFLEXÃO INDIVIDUAL</span>
      <h1 style={styles.h1}>Sozinho, antes de qualquer conversa em grupo.</h1>
      <p style={styles.lead}>
        Você identificou <strong style={{ color: BLUE }}>{principal}</strong> como um papel forte
        seu. Ninguém além de você vai ler isso. Escreva o que for verdade, não o que soa bem.
      </p>

      <CampoReflexao
        pergunta="Qual papel mais influencia minhas decisões?"
        valor={reflexaoF2.influencia}
        onChange={set("influencia")}
        placeholder="O papel que, na prática, mais pesa quando você decide algo importante…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F2}
      />
      <CampoReflexao
        pergunta="Qual papel mais limita meu crescimento?"
        valor={reflexaoF2.limita}
        onChange={set("limita")}
        placeholder="O papel que, apesar de ajudar em algum momento, hoje custa mais do que traz…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F2}
      />
      <CampoReflexao
        pergunta="Qual comportamento preciso mudar?"
        valor={reflexaoF2.mudar}
        onChange={set("mudar")}
        placeholder="Uma ação concreta, não uma intenção vaga, que você pode ajustar esta semana…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F2}
      />
    </div>
  );
}

function StepConsolidacaoF2({ familia, addFamiliar, removeFamiliar, setFamiliar, dominantes, reflexaoF2 }) {
  const [script, setScript] = useState(null);
  const [gerando, setGerando] = useState(false);
  const principal = dominantes[0] ? dominantes[0].nome : "seu papel predominante";

  const prepararConversa = () => {
    setGerando(true);
    setScript(null);
    const mapa = familia
      .filter((f) => f.nome.trim() && f.papel)
      .map((f) => `${f.nome}: ${PAPEIS.find((p) => p.key === f.papel)?.nome || f.papel}`)
      .join("; ");
    const prompt =
      `${LIVRO_CONTEXTO_F2}\n\n` +
      `Você ajuda alguém que usou o Radar de Papéis Ocultos a se preparar para uma Consolidação ` +
      `Familiar. O papel predominante dela é "${principal}".${
        mapa ? ` Ela já mapeou os papéis da família assim: ${mapa}.` : ""
      }${
        reflexaoF2.limita ? ` Na reflexão individual, ela percebeu que esse papel limita: "${reflexaoF2.limita}".` : ""
      }\n\n` +
      `Sugira 2-3 frases curtas de abertura pra essa pessoa começar essa conversa em família, sem ` +
      `soar como acusação, e sim como convite a entender juntos a "arquitetura de papéis" da ` +
      `família. Formate como lista curta. Responda só com as frases, sem introdução, em português ` +
      `do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => setScript(texto))
      .catch(() => setScript("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 5 DE 7 · CONSOLIDAÇÃO FAMILIAR</span>
      <h1 style={styles.h1}>Mapeie o papel predominante de cada integrante.</h1>
      <p style={styles.lead}>
        Reúna a família e, juntos, identifiquem o papel que mais descreve cada pessoa. Isso revela
        a &ldquo;arquitetura de papéis&rdquo; da família como um todo — se todos forem
        Pacificadores, ninguém confronta problemas reais; se todos forem Controladores, a família
        vive em disputa de poder.
      </p>

      {!script && (
        <button onClick={prepararConversa} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando sugestão…" : "✦ Preciso de ajuda para começar a conversa"}
        </button>
      )}
      {script && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ sugestão gerada pra sua situação</span>
          <p style={styles.scriptText}>{script}</p>
        </div>
      )}

      <div style={styles.familiaList}>
        {familia.map((f) => (
          <div key={f.id} style={styles.familiaRow}>
            <input
              style={styles.input}
              value={f.nome}
              onChange={(e) => setFamiliar(f.id, "nome", e.target.value)}
              placeholder="Nome (ex.: meu pai)"
            />
            <select
              style={styles.input}
              value={f.papel}
              onChange={(e) => setFamiliar(f.id, "papel", e.target.value)}
            >
              <option value="">Papel predominante…</option>
              {PAPEIS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.nome}
                </option>
              ))}
            </select>
            {familia.length > 1 && (
              <button
                onClick={() => removeFamiliar(f.id)}
                style={styles.removeRowButton}
                type="button"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={addFamiliar} type="button" style={styles.demoLink}>
        + Adicionar outro integrante
      </button>
    </div>
  );
}

function StepDecisaoF2({ decisaoPapeis, setDecisaoPapeis }) {
  const set = (field) => (e) => setDecisaoPapeis((d) => ({ ...d, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 6 DE 7 · DECISÃO</span>
      <h1 style={styles.h1}>Com o mapa de papéis em mãos, o que fazer a partir de agora?</h1>
      <p style={styles.lead}>
        Isso é uma proposta sua, vale negociar com a família antes de virar definitivo.
      </p>

      <label style={styles.fieldLabel}>Quais papéis devem ser fortalecidos?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoPapeis.fortalecer}
        onChange={set("fortalecer")}
        placeholder="Papéis que trazem mais benefício do que custo hoje…"
      />
      <label style={styles.fieldLabel}>Quais papéis devem ser reduzidos?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoPapeis.reduzir}
        onChange={set("reduzir")}
        placeholder="Papéis que já cobram um preço alto demais…"
      />
    </div>
  );
}

function StepPlanoF2({ planoF2, setPlanoF2, dominantes, decisaoPapeis, reflexaoF2 }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);
  const principal = dominantes[0] ? dominantes[0].nome : "esse papel";

  const addAcao = () =>
    setPlanoF2((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, acao: "", responsavel: "", prazo: "" },
    ]);
  const removeAcao = (id) => setPlanoF2((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setPlanoF2((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirAcoes = () => {
    setGerando(true);
    setErro(false);
    const prompt =
      `${LIVRO_CONTEXTO_F2}\n\n` +
      `Você ajuda alguém que já percorreu o Radar de Papéis Ocultos a transformar a decisão em um ` +
      `plano de ação. Contexto:\n` +
      `- Papel predominante: "${principal}"\n` +
      `${reflexaoF2.mudar ? `- Comportamento que ela quer mudar: "${reflexaoF2.mudar}"\n` : ""}` +
      `${decisaoPapeis.reduzir ? `- Papéis a reduzir: "${decisaoPapeis.reduzir}"\n` : ""}\n` +
      `Sugira 3 ações em sequência cronológica (a primeira mais imediata, a última mais à frente), ` +
      `cada uma no infinitivo, com responsável e prazo sugeridos. Lembre que isso ainda precisa ser ` +
      `negociado com quem for afetado.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"acao":"","responsavel":"","prazo":""},{"acao":"","responsavel":"","prazo":""},` +
      `{"acao":"","responsavel":"","prazo":""}]`;

    callClaude(prompt, 400)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlanoF2(
            parsed.map((a, i) => ({
              id: i + 1,
              acao: a.acao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
            }))
          );
        }
      })
      .catch(() => setErro(true))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 7 DE 7 · PLANO DE AÇÃO</span>
      <h1 style={styles.h1}>Transforme a decisão em ações concretas, em sequência.</h1>
      <p style={styles.lead}>
        Uma ação sem responsável e prazo tende a virar apenas uma boa intenção. Pense em 2 ou 3
        passos, do mais imediato ao mais à frente.
      </p>

      <button onClick={sugerirAcoes} disabled={gerando} style={styles.demoLink}>
        {gerando ? "Gerando sugestões…" : "✦ Sugerir 3 ações em sequência"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {planoF2.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              {planoF2.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.acao}
              onChange={(e) => setAcao(a.id, "acao", e.target.value)}
              placeholder="Ex.: delegar a aprovação de despesas até R$5 mil aos diretores…"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: 60 dias"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra ação
      </button>
    </div>
  );
}

function StepFechamentoF2({
  pontos,
  ranking,
  dominantes,
  contribuicoes,
  reflexaoF2,
  familia,
  decisaoPapeis,
  planoF2,
  onReiniciar,
  envioId,
}) {
  const [salvando, setSalvando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);
  const [sintese, setSintese] = useState(null);
  const [carregandoSintese, setCarregandoSintese] = useState(false);

  const familiaPreenchida = familia.filter((f) => f.nome.trim() && f.papel);
  const nomesPapel = (key) => PAPEIS.find((p) => p.key === key)?.nome || key;

  useEffect(() => {
    let cancelado = false;
    setSalvando(true);
    setErroSalvar(false);

    supabaseInsert("respostas", {
      envio_id: envioId || null,
      ferramenta_numero: 2,
      notas: pontos,
      conflito: {
        ranking: ranking.map((p) => ({ papel: p.key, nome: p.nome, pontos: pontos[p.key] })),
        contribuicoes,
      },
      reflexao: reflexaoF2,
      consolidacao: { familia: familiaPreenchida },
      decisao_final: decisaoPapeis,
      plano_acao: planoF2,
    })
      .then(() => {
        if (!cancelado) setSalvo(true);
      })
      .catch(() => {
        if (!cancelado) setErroSalvar(true);
      })
      .finally(() => {
        if (!cancelado) setSalvando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelado = false;
    if (dominantes.length === 0) return;
    setCarregandoSintese(true);
    const dominantesNomes = dominantes.map((p) => p.nome).join(" e ");
    const contribResumo = dominantes
      .map((p) => {
        const c = contribuicoes[p.key];
        return c ? `${p.nome} — ajuda: "${c.comoAjuda}"; limita: "${c.comoLimita}"` : p.nome;
      })
      .join(". ");
    const prompt =
      `${LIVRO_CONTEXTO_F2}\n\n` +
      `Alguém acabou de completar o Radar de Papéis Ocultos. Papel(is) dominante(s): ` +
      `${dominantesNomes}.${contribResumo ? ` O que ela mesma escreveu sobre eles: ${contribResumo}.` : ""}` +
      `${reflexaoF2.mudar ? ` Na reflexão, o comportamento que ela quer mudar é: "${reflexaoF2.mudar}".` : ""}` +
      `${decisaoPapeis.fortalecer ? ` Decidiu fortalecer: "${decisaoPapeis.fortalecer}".` : ""}` +
      `${decisaoPapeis.reduzir ? ` Decidiu reduzir: "${decisaoPapeis.reduzir}".` : ""}\n\n` +
      `Escreva um parágrafo curto de fechamento (3-4 frases, no máximo 80 palavras) que amarre isso ` +
      `numa síntese concreta e acolhedora, reforçando que o papel não é um rótulo fixo e que isso é ` +
      `o começo de um ajuste, não o fim. Tom direto, sem clichês de autoajuda. Responda só com o ` +
      `texto, sem introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setSintese(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoSintese(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const montarResumo = () => {
    const linhas = [
      "Radar de Papéis Ocultos",
      "",
      `Papéis predominantes: ${ranking.map((p) => `${p.nome} (${pontos[p.key]})`).join(", ") || "—"}`,
      "",
      sintese ? `Síntese: ${sintese}` : null,
      sintese ? "" : null,
      familiaPreenchida.length > 0
        ? `Mapa da família: ${familiaPreenchida.map((f) => `${f.nome} — ${nomesPapel(f.papel)}`).join(", ")}`
        : null,
      familiaPreenchida.length > 0 ? "" : null,
      `Comportamento a mudar: ${reflexaoF2.mudar || "—"}`,
      "",
      `Papéis a fortalecer: ${decisaoPapeis.fortalecer || "—"}`,
      `Papéis a reduzir: ${decisaoPapeis.reduzir || "—"}`,
      "",
      "Plano de ação:",
      planoF2
        .filter((a) => a.acao.trim())
        .map((a, i) => `${i + 1}. ${a.acao} — Responsável: ${a.responsavel || "—"} — Prazo: ${a.prazo || "—"}`)
        .join("\n") || "—",
    ].filter((l) => l !== null);
    return linhas.join("\n");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      notifyConsultor("Meu resultado — Radar de Papéis Ocultos", montarResumo());
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stepWrap}>
      <div style={styles.saveStatus}>
        {salvando && <span style={styles.saveStatusText}>Salvando seu resultado…</span>}
        {!salvando && salvo && <span style={styles.saveStatusOk}>✓ Resultado salvo</span>}
        {!salvando && erroSalvar && (
          <span style={styles.saveStatusErr}>Não deu pra salvar automaticamente, use o e-mail abaixo</span>
        )}
      </div>
      <span style={styles.eyebrowSmall}>FECHAMENTO</span>
      <h1 style={styles.h1}>Seu Radar de Papéis Ocultos, resumido.</h1>

      <RadarChart pontos={pontos} />

      <div style={styles.resumoGrid}>
        {ranking.map((p, i) => (
          <div key={p.key} style={styles.resumoCard}>
            <div style={{ ...styles.resumoBar, background: faixaPapel(pontos[p.key]).cor }} />
            <div style={styles.resumoCardInner}>
              <span style={styles.resumoName}>
                {i + 1}º · {p.nome}
              </span>
              <span style={styles.resumoValue}>nota {pontos[p.key]}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.unlockBox}>
        <span style={styles.unlockLabel}>SÍNTESE</span>
        {carregandoSintese ? (
          <p style={styles.unlockHow}>
            <span style={{ opacity: 0.6 }}>Gerando síntese pra sua situação específica…</span>
          </p>
        ) : (
          <>
            <p style={styles.unlockHow}>
              {sintese ||
                "O padrão que apareceu aqui não é um rótulo fixo, é o ponto de partida para escolher, conscientemente, o que fortalecer e o que soltar."}
            </p>
            {sintese && <span style={styles.aiTag}>✦ gerado pra sua situação</span>}
          </>
        )}
      </div>

      {familiaPreenchida.length > 0 && (
        <div style={styles.fechamentoBox}>
          <span style={styles.fechamentoLabel}>MAPA DA FAMÍLIA</span>
          {familiaPreenchida.map((f) => (
            <div key={f.id} style={styles.fechamentoRow}>
              <span style={styles.fechamentoValue}>{f.nome}</span>
              <span style={styles.fechamentoValue}>{nomesPapel(f.papel)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.fechamentoBox}>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>COMPORTAMENTO A MUDAR</span>
          <span style={styles.fechamentoValue}>{reflexaoF2.mudar || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>FORTALECER</span>
          <span style={styles.fechamentoValue}>{decisaoPapeis.fortalecer || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>REDUZIR</span>
          <span style={styles.fechamentoValue}>{decisaoPapeis.reduzir || "—"}</span>
        </div>
      </div>

      <div style={styles.familiaList}>
        {planoF2
          .filter((a) => a.acao.trim())
          .map((a, i) => (
            <div key={a.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              <span style={styles.papelDescricao}>{a.acao}</span>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>RESPONSÁVEL</span>
                <span style={styles.fechamentoValue}>{a.responsavel || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>PRAZO</span>
                <span style={styles.fechamentoValue}>{a.prazo || "—"}</span>
              </div>
            </div>
          ))}
      </div>

      <div style={styles.ctaBox}>
        <p style={styles.ctaTitle}>Agora é executar, com acompanhamento.</p>
        <p style={styles.ctaSub}>
          Você percorreu as etapas do Radar: pontuou, viu o padrão, refletiu sozinho, mapeou a
          família, decidiu e planejou. O que falta agora é colocar em prática, e revisitar o Radar
          daqui a alguns meses para ver se o desenho mudou.
        </p>
      </div>

      <p style={{ ...styles.papelDescricao, marginTop: 4 }} className="no-print">
        Um resumo desse resultado já foi enviado automaticamente pro consultor.
      </p>
      <div style={styles.finalButtonsRow} className="no-print">
        <button onClick={() => window.print()} style={styles.ctaButton}>
          🖨️ Baixar / imprimir PDF
        </button>
        <button onClick={onReiniciar} style={styles.restartButton}>
          ↺ Voltar ao início
        </button>
      </div>
    </div>
  );
}

const STEP_F3_TIMELINE = 0;
const STEP_F3_PADROES = 1;
const STEP_F3_CLASSIFICACAO = 2;
const STEP_F3_REFLEXAO = 3;
const STEP_F3_CONSOLIDACAO = 4;
const STEP_F3_DECISAO = 5;
const STEP_F3_PLANO = 6;
const STEP_F3_IMPACTOS = 7;
const STEP_F3_FECHAMENTO = 8;

function initEventosF3() {
  return [{ id: 1, periodo: "", evento: "", oQueAconteceu: "", impacto: "" }];
}

function initPadroesF3() {
  return PADROES_F3.reduce((acc, p) => {
    acc[p.key] = { ondeApareceu: "", geracoes: null };
    return acc;
  }, {});
}

function classifLabelF3(c) {
  return { preservar: "Preservar", transformar: "Transformar", interromper: "Interromper" }[c] || "—";
}

const FAMILIA_EXEMPLO_F3 = {
  eventos: [
    {
      id: 1,
      periodo: "1975",
      evento: "Fundação da empresa pelo avô de Marina",
      oQueAconteceu: "O avô centralizava todas as decisões financeiras, a empresa vivia fase de sobrevivência.",
      impacto: "Criou uma cultura de que só uma pessoa decide.",
    },
    {
      id: 2,
      periodo: "1998",
      evento: "Saída do primeiro sócio",
      oQueAconteceu: "Divergência sobre expansão da empresa.",
      impacto: "Antônio (pai) passou a decidir tudo sozinho a partir daí.",
    },
    {
      id: 3,
      periodo: "2022",
      evento: "Conselho sinaliza hora da transição para Marina",
      oQueAconteceu: "Antônio adia repetidamente a saída, mantém aprovações financeiras.",
      impacto: "Marina hesita em assumir, sentindo que precisa liderar \"do jeito dele\".",
    },
  ],
  padroes: {
    ...initPadroesF3(),
    centralizacao: { ondeApareceu: "Avô, Antônio e agora Marina (em risco de repetir)", geracoes: 3 },
    dependencia_fundador: { ondeApareceu: "Antônio ainda decide tudo, mesmo com Marina pronta", geracoes: 2 },
  },
  padraoCustom: { nome: "", ondeApareceu: "", geracoes: null },
  classificacao: { centralizacao: "interromper", dependencia_fundador: "transformar" },
  reflexaoF3: {
    maisChamouAtencao: "Eu achava que centralizar era só um jeito meu de ser cuidadosa, mas vem desde o meu avô.",
    continuaInfluenciando: "Ainda hoje eu mesma peço aprovação do meu pai antes de decidir coisas que já poderia decidir sozinha.",
    precisaInterromper: "A ideia de que só uma pessoa pode decidir por vez, isso trava a empresa toda.",
    legadoPreservar: "O cuidado extremo com a saúde financeira da empresa, isso sim vale manter, só não precisa ser uma pessoa só cuidando.",
  },
  repetir: [
    {
      id: 1,
      comportamento: "Cuidado rigoroso com a saúde financeira da empresa",
      motivo: "Foi o que manteve a empresa de pé em todas as crises",
    },
  ],
  transformarLista: [
    {
      id: 1,
      de: "Dependência do fundador nas decisões importantes",
      para: "Decisão dividida entre mais de uma pessoa, não só o pai",
    },
  ],
  interromperLista: [
    {
      id: 1,
      comportamento: "Decisões financeiras concentradas em uma só pessoa",
      motivo: "Impede que a próxima geração desenvolva autoridade real",
    },
  ],
  decisaoF3: {
    fortalecer: "O cuidado financeiro rigoroso, mas exercido em conjunto, não sozinho.",
    limitando: "A centralização das aprovações, que já trava a empresa há três gerações.",
    novosComportamentos: "Um comitê financeiro com mais de uma pessoa aprovando decisões acima de um valor definido.",
  },
  planoF3: [
    {
      id: 1,
      acao: "Comunicar ao conselho e à diretoria que as aprovações acima de R$50 mil passarão a ser conjuntas.",
      responsavel: "Antônio",
      prazo: "15 dias",
    },
    {
      id: 2,
      acao: "Criar formalmente o comitê financeiro com Antônio e Marina aprovando juntos decisões acima de R$50 mil.",
      responsavel: "Antônio e Marina",
      prazo: "60 dias",
    },
    {
      id: 3,
      acao: "Revisar o funcionamento do comitê e decidir se Marina passa a aprovar sozinha valores menores.",
      responsavel: "Antônio e Marina, com o conselho",
      prazo: "120 dias",
    },
  ],
  impactosF3: {
    familia: "Menos tensão nas reuniões, porque a decisão deixa de depender só da aprovação do pai.",
    negocio: "Decisões mais ágeis, sem depender da disponibilidade de uma pessoa só.",
    patrimonio: "Redução do risco de a empresa travar se algo acontecer com Antônio.",
  },
};

function Ferramenta3App({ onVoltarCatalogo, envioIdInicial }) {
  const [step, setStep] = useState(STEP_F3_TIMELINE);
  const [eventos, setEventos] = useState(initEventosF3());
  const [padroes, setPadroes] = useState(initPadroesF3());
  const [padraoCustom, setPadraoCustom] = useState({ nome: "", ondeApareceu: "", geracoes: null });
  const [classificacao, setClassificacao] = useState({});
  const [reflexaoF3, setReflexaoF3] = useState({
    maisChamouAtencao: "",
    continuaInfluenciando: "",
    precisaInterromper: "",
    legadoPreservar: "",
  });
  const [repetir, setRepetir] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [transformarLista, setTransformarLista] = useState([{ id: 1, de: "", para: "" }]);
  const [interromperLista, setInterromperLista] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [decisaoF3, setDecisaoF3] = useState({ fortalecer: "", limitando: "", novosComportamentos: "" });
  const [planoF3, setPlanoF3] = useState([{ id: 1, acao: "", responsavel: "", prazo: "" }]);
  const [impactosF3, setImpactosF3] = useState({ familia: "", negocio: "", patrimonio: "" });
  const [historiaLivre, setHistoriaLivre] = useState("");

  const padroesTodos = useMemo(() => {
    const fixos = PADROES_F3.map((p) => ({
      key: p.key,
      nome: p.nome,
      pergunta: p.pergunta,
      ondeApareceu: padroes[p.key].ondeApareceu,
      geracoes: padroes[p.key].geracoes,
    }));
    const lista = [...fixos];
    if (padraoCustom.nome.trim()) {
      lista.push({
        key: "custom",
        nome: padraoCustom.nome.trim(),
        pergunta: null,
        ondeApareceu: padraoCustom.ondeApareceu,
        geracoes: padraoCustom.geracoes,
      });
    }
    return lista;
  }, [padroes, padraoCustom]);

  const padroesIdentificados = useMemo(
    () => padroesTodos.filter((p) => p.geracoes && p.geracoes >= 1),
    [padroesTodos]
  );

  const setPadrao = (key, field, val) =>
    setPadroes((prev) => ({ ...prev, [key]: { ...prev[key], [field]: val } }));

  const addEvento = () =>
    setEventos((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, periodo: "", evento: "", oQueAconteceu: "", impacto: "" },
    ]);
  const removeEvento = (id) => setEventos((prev) => prev.filter((e) => e.id !== id));
  const setEvento = (id, field, val) =>
    setEventos((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: val } : e)));

  const carregarExemploF3 = () => {
    setEventos(FAMILIA_EXEMPLO_F3.eventos);
    setPadroes(FAMILIA_EXEMPLO_F3.padroes);
    setPadraoCustom(FAMILIA_EXEMPLO_F3.padraoCustom);
    setClassificacao(FAMILIA_EXEMPLO_F3.classificacao);
    setReflexaoF3(FAMILIA_EXEMPLO_F3.reflexaoF3);
    setRepetir(FAMILIA_EXEMPLO_F3.repetir);
    setTransformarLista(FAMILIA_EXEMPLO_F3.transformarLista);
    setInterromperLista(FAMILIA_EXEMPLO_F3.interromperLista);
    setDecisaoF3(FAMILIA_EXEMPLO_F3.decisaoF3);
    setPlanoF3(FAMILIA_EXEMPLO_F3.planoF3);
    setImpactosF3(FAMILIA_EXEMPLO_F3.impactosF3);
    setStep(STEP_F3_PADROES);
  };

  const [extraindo, setExtraindo] = useState(false);
  const [erroExtracao, setErroExtracao] = useState(false);

  const extrairAutomatico = async () => {
    if (historiaLivre.trim().length < 20) return;
    setExtraindo(true);
    setErroExtracao(false);
    const chavesPadroes = PADROES_F3.map((p) => p.key).join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F3}\n\n` +
      `A pessoa escreveu, com as próprias palavras, a história da família e da empresa:\n\n` +
      `"${historiaLivre.trim()}"\n\n` +
      `Extraia dessa história:\n` +
      `1) Até 6 eventos marcantes, do mais antigo pro mais recente, cada um com período (ano ou ` +
      `década aproximada), evento (título curto), oQueAconteceu (1 frase) e impacto (1 frase, o que ` +
      `isso gerou).\n` +
      `2) Para cada um destes seis padrões (use exatamente estas chaves): ${chavesPadroes} — diga se ` +
      `ele aparece no texto (mesmo que implicitamente), onde apareceu (quem, resumido) e em quantas ` +
      `gerações (1, 2 ou 3, use 3 para "3 ou mais"). Se um padrão não aparecer no texto, não inclua a ` +
      `chave dele.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `{"eventos":[{"periodo":"","evento":"","oQueAconteceu":"","impacto":""}],"padroes":{"CHAVE":` +
      `{"ondeApareceu":"","geracoes":1}}}`;

    try {
      const texto = await callClaude(prompt, 900);
      const limpo = texto.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(limpo);
      if (Array.isArray(parsed.eventos) && parsed.eventos.length > 0) {
        setEventos(
          parsed.eventos.map((e, i) => ({
            id: i + 1,
            periodo: e.periodo || "",
            evento: e.evento || "",
            oQueAconteceu: e.oQueAconteceu || "",
            impacto: e.impacto || "",
          }))
        );
      }
      if (parsed.padroes && typeof parsed.padroes === "object") {
        setPadroes((prev) => {
          const novo = { ...prev };
          Object.entries(parsed.padroes).forEach(([chave, val]) => {
            if (novo[chave]) {
              novo[chave] = {
                ondeApareceu: (val && val.ondeApareceu) || "",
                geracoes: val && [1, 2, 3].includes(val.geracoes) ? val.geracoes : null,
              };
            }
          });
          return novo;
        });
      }
      setStep(STEP_F3_PADROES);
    } catch (e) {
      setErroExtracao(true);
    } finally {
      setExtraindo(false);
    }
  };

  const addLinha = (setter) => (prev) => [
    ...prev,
    { id: (prev[prev.length - 1]?.id || 0) + 1, comportamento: "", motivo: "" },
  ];
  const setLinha = (setter, id, field, val) =>
    setter((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));

  const canAdvance = () => {
    if (step === STEP_F3_TIMELINE) {
      return eventos.some((e) => e.periodo.trim().length > 0 && e.evento.trim().length > 0);
    }
    if (step === STEP_F3_PADROES) return padroesIdentificados.length > 0;
    if (step === STEP_F3_CLASSIFICACAO) {
      return padroesIdentificados.every((p) => classificacao[p.key]);
    }
    if (step === STEP_F3_REFLEXAO) {
      return (
        reflexaoF3.maisChamouAtencao.trim().length > 3 &&
        reflexaoF3.continuaInfluenciando.trim().length > 3 &&
        reflexaoF3.precisaInterromper.trim().length > 3 &&
        reflexaoF3.legadoPreservar.trim().length > 3
      );
    }
    if (step === STEP_F3_CONSOLIDACAO) {
      const temRepetir = repetir.some((r) => r.comportamento.trim() && r.motivo.trim());
      const temTransformar = transformarLista.some((r) => r.de.trim() && r.para.trim());
      const temInterromper = interromperLista.some((r) => r.comportamento.trim() && r.motivo.trim());
      return temRepetir || temTransformar || temInterromper;
    }
    if (step === STEP_F3_DECISAO) {
      return (
        decisaoF3.fortalecer.trim().length > 3 &&
        decisaoF3.limitando.trim().length > 3 &&
        decisaoF3.novosComportamentos.trim().length > 3
      );
    }
    if (step === STEP_F3_PLANO) {
      return planoF3.some(
        (p) => p.acao.trim().length > 3 && p.responsavel.trim().length > 0 && p.prazo.trim().length > 0
      );
    }
    if (step === STEP_F3_IMPACTOS) {
      return (
        impactosF3.familia.trim().length > 3 &&
        impactosF3.negocio.trim().length > 3 &&
        impactosF3.patrimonio.trim().length > 3
      );
    }
    return true;
  };

  const goNext = () => setStep((s) => Math.min(STEP_F3_FECHAMENTO, s + 1));
  const goBack = () => setStep((s) => Math.max(STEP_F3_TIMELINE, s - 1));

  return (
    <>
      <Header3 step={step} onVoltarCatalogo={onVoltarCatalogo} />
      <div style={styles.body}>
        {step === STEP_F3_TIMELINE && (
          <StepTimeline
            eventos={eventos}
            addEvento={addEvento}
            removeEvento={removeEvento}
            setEvento={setEvento}
            onCarregarExemplo={carregarExemploF3}
            historiaLivre={historiaLivre}
            setHistoriaLivre={setHistoriaLivre}
            onExtrairAutomatico={extrairAutomatico}
            extraindo={extraindo}
            erroExtracao={erroExtracao}
          />
        )}
        {step === STEP_F3_PADROES && (
          <StepPadroes
            padroes={padroes}
            setPadrao={setPadrao}
            padraoCustom={padraoCustom}
            setPadraoCustom={setPadraoCustom}
            eventos={eventos}
            padroesIdentificados={padroesIdentificados}
          />
        )}
        {step === STEP_F3_CLASSIFICACAO && (
          <StepClassificacao
            padroesIdentificados={padroesIdentificados}
            classificacao={classificacao}
            setClassificacao={setClassificacao}
          />
        )}
        {step === STEP_F3_REFLEXAO && (
          <StepReflexaoF3 reflexaoF3={reflexaoF3} setReflexaoF3={setReflexaoF3} padroesIdentificados={padroesIdentificados} />
        )}
        {step === STEP_F3_CONSOLIDACAO && (
          <StepConsolidacaoF3
            repetir={repetir}
            setRepetir={setRepetir}
            transformarLista={transformarLista}
            setTransformarLista={setTransformarLista}
            interromperLista={interromperLista}
            setInterromperLista={setInterromperLista}
            padroesIdentificados={padroesIdentificados}
            classificacao={classificacao}
          />
        )}
        {step === STEP_F3_DECISAO && (
          <StepDecisaoF3 decisaoF3={decisaoF3} setDecisaoF3={setDecisaoF3} />
        )}
        {step === STEP_F3_PLANO && (
          <StepPlanoF3
            planoF3={planoF3}
            setPlanoF3={setPlanoF3}
            padroesIdentificados={padroesIdentificados}
            classificacao={classificacao}
            decisaoF3={decisaoF3}
          />
        )}
        {step === STEP_F3_IMPACTOS && (
          <StepImpactosF3 impactosF3={impactosF3} setImpactosF3={setImpactosF3} />
        )}
        {step === STEP_F3_FECHAMENTO && (
          <StepFechamentoF3
            eventos={eventos}
            padroesIdentificados={padroesIdentificados}
            classificacao={classificacao}
            reflexaoF3={reflexaoF3}
            repetir={repetir}
            transformarLista={transformarLista}
            interromperLista={interromperLista}
            decisaoF3={decisaoF3}
            planoF3={planoF3}
            impactosF3={impactosF3}
            onReiniciar={onVoltarCatalogo}
            envioId={envioIdInicial}
          />
        )}
      </div>
      {step < STEP_F3_FECHAMENTO && (
        <Footer
          step={step}
          canAdvance={canAdvance()}
          isLastQuadrante={false}
          isDesempate={false}
          isPenultimate={step === STEP_F3_IMPACTOS}
          onBack={goBack}
          onNext={goNext}
        />
      )}
    </>
  );
}

function Header3({ step, onVoltarCatalogo }) {
  const labels = [
    "Linha do tempo",
    "Padrões identificados",
    "Classificação",
    "Reflexão individual",
    "Consolidação familiar",
    "Decisão",
    "Plano de ação",
    "Impactos esperados",
    "Fechamento",
  ];
  const progress = Math.round((step / STEP_F3_FECHAMENTO) * 100);
  return (
    <div style={styles.header} className="no-print">
      <div style={styles.headerTop}>
        <button onClick={onVoltarCatalogo} style={styles.backToCatalogo}>
          ← Catálogo
        </button>
        <span style={styles.stepLabel}>Linha de Repetição Familiar · {labels[step]}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

function StepTimeline({
  eventos,
  addEvento,
  removeEvento,
  setEvento,
  onCarregarExemplo,
  historiaLivre,
  setHistoriaLivre,
  onExtrairAutomatico,
  extraindo,
  erroExtracao,
}) {
  const temConteudo = eventos.some((e) => e.evento.trim() || e.oQueAconteceu.trim());
  const [mostrarManual, setMostrarManual] = useState(temConteudo);

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 1 DE 8 · LINHA DO TEMPO</span>
      <h1 style={styles.h1}>O que estamos repetindo há gerações sem perceber?</h1>
      <p style={styles.lead}>
        Conte, com suas palavras, a história da família e da empresa — os momentos que mais
        marcaram, ao longo das gerações. Pode ser corrido, sem se preocupar com ordem perfeita ou
        detalhes. A IA organiza isso numa linha do tempo e já aponta os padrões que aparecem.
      </p>

      <div style={styles.demoLinksRow}>
        <button onClick={onCarregarExemplo} style={styles.demoLink}>
          ⚡ Exemplo: família da Marina e do Antônio
        </button>
      </div>

      <textarea
        style={styles.textareaSmall}
        rows={6}
        value={historiaLivre}
        onChange={(e) => setHistoriaLivre(e.target.value)}
        placeholder="Ex.: meu avô fundou a empresa em 1975 e sempre decidiu tudo sozinho, por necessidade, a empresa era pequena. Meu pai assumiu depois de brigar com o sócio em 1998, e manteve o mesmo jeito de centralizar. Hoje sou eu que deveria assumir, mas ele ainda aprova tudo pessoalmente…"
      />
      <button
        onClick={onExtrairAutomatico}
        disabled={extraindo || historiaLivre.trim().length < 20}
        style={styles.ctaButton}
      >
        {extraindo ? "Lendo sua história…" : "✦ Organizar automaticamente →"}
      </button>
      {erroExtracao && (
        <span style={styles.saveStatusErr}>
          Não deu pra organizar automaticamente agora. Preencha manualmente abaixo.
        </span>
      )}

      <button
        onClick={() => setMostrarManual((v) => !v)}
        type="button"
        style={styles.demoLink}
      >
        {mostrarManual ? "− Esconder edição manual" : "+ Prefiro (ou preciso) editar manualmente"}
      </button>

      {mostrarManual && (
        <>
          <div style={styles.familiaList}>
            {eventos.map((e) => (
              <div key={e.id} style={styles.timelineCard}>
                <div style={styles.timelineTopRow}>
                  <input
                    style={{ ...styles.input, flex: "0 1 140px" }}
                    value={e.periodo}
                    onChange={(ev) => setEvento(e.id, "periodo", ev.target.value)}
                    placeholder="Período (ex.: 1998)"
                  />
                  <input
                    style={{ ...styles.input, flex: "1 1 240px" }}
                    value={e.evento}
                    onChange={(ev) => setEvento(e.id, "evento", ev.target.value)}
                    placeholder="Evento (ex.: saída do primeiro sócio)"
                  />
                  {eventos.length > 1 && (
                    <button onClick={() => removeEvento(e.id)} style={styles.removeRowButton} type="button">
                      ×
                    </button>
                  )}
                </div>
                <textarea
                  style={styles.textareaSmall}
                  rows={2}
                  value={e.oQueAconteceu}
                  onChange={(ev) => setEvento(e.id, "oQueAconteceu", ev.target.value)}
                  placeholder="O que aconteceu? (ex.: divergência sobre expansão da empresa)"
                />
                <textarea
                  style={styles.textareaSmall}
                  rows={2}
                  value={e.impacto}
                  onChange={(ev) => setEvento(e.id, "impacto", ev.target.value)}
                  placeholder="Impacto gerado (ex.: fundador passou a decidir tudo sozinho a partir daí)"
                />
              </div>
            ))}
          </div>
          <button onClick={addEvento} type="button" style={styles.demoLink}>
            + Adicionar outro evento
          </button>
        </>
      )}
    </div>
  );
}

function StepPadroes({ padroes, setPadrao, padraoCustom, setPadraoCustom, eventos, padroesIdentificados }) {
  const [insight, setInsight] = useState(null);
  const [gerandoInsight, setGerandoInsight] = useState(false);

  const gerarInsight = () => {
    setGerandoInsight(true);
    setInsight(null);
    const eventosResumo = eventos
      .filter((e) => e.evento.trim())
      .map((e) => `${e.periodo || "?"}: ${e.evento}${e.impacto ? ` (impacto: ${e.impacto})` : ""}`)
      .join("; ");
    const padroesResumo = padroesIdentificados
      .map((p) => `${p.nome} em ${p.geracoes} geraç${p.geracoes === 1 ? "ão" : "ões"}${p.ondeApareceu ? `, onde apareceu: ${p.ondeApareceu}` : ""}`)
      .join(". ");
    const prompt =
      `${LIVRO_CONTEXTO_F3}\n\n` +
      `Alguém está usando a ferramenta acima. Linha do tempo que registrou: ${eventosResumo || "não detalhada"}.\n` +
      `Padrões que identificou: ${padroesResumo || "nenhum ainda"}.\n\n` +
      `Escreva um parágrafo curto (3-4 frases, no máximo 80 palavras) apontando qual desses ` +
      `padrões parece mais estrutural e o que isso costuma significar pra decisões de sucessão, ` +
      `inspirando-se, sem citar nomes, no padrão de algum dos três casos reais do método. Tom ` +
      `direto, acolhedor, sem clichês. Responda só com o texto, sem introdução, em português do ` +
      `Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => setInsight(texto))
      .catch(() => setInsight("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerandoInsight(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 2 DE 8 · PADRÕES IDENTIFICADOS</span>
      <h1 style={styles.h1}>Algum comportamento aparece mais de uma vez?</h1>
      <p style={styles.lead}>
        Volte pra linha do tempo e observe: algum desses seis padrões se repete, em pessoas ou
        momentos diferentes? Preencha onde apareceu e em quantas gerações. Não precisa preencher
        todos, só os que fizerem sentido.
      </p>

      <div style={styles.familiaList}>
        {PADROES_F3.map((p) => (
          <div key={p.key} style={styles.padraoCard}>
            <span style={styles.papelNome}>{p.nome}</span>
            <span style={styles.papelDescricao}>{p.sinais}</span>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={padroes[p.key].ondeApareceu}
              onChange={(e) => setPadrao(p.key, "ondeApareceu", e.target.value)}
              placeholder="Onde apareceu? (ex.: avô, pai e eu)"
            />
            <div style={styles.desempateOptions} role="group">
              <div style={styles.envioButtonsRow}>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPadrao(p.key, "geracoes", n)}
                    style={{
                      ...styles.geracaoOption,
                      borderColor: padroes[p.key].geracoes === n ? BLUE : "#E4EAF0",
                      background: padroes[p.key].geracoes === n ? "#EAF2FB" : "#fff",
                    }}
                  >
                    {n === 3 ? "3 ou mais gerações" : `${n} geraç${n === 1 ? "ão" : "ões"}`}
                  </button>
                ))}
              </div>
            </div>
            {padroes[p.key].geracoes && (
              <span style={styles.padraoInterpretacao}>
                {interpretaGeracoes(padroes[p.key].geracoes).label}: {interpretaGeracoes(padroes[p.key].geracoes).texto}
              </span>
            )}
          </div>
        ))}

        <div style={styles.padraoCard}>
          <span style={styles.papelNome}>Outro padrão (opcional)</span>
          <span style={styles.papelDescricao}>
            Se nenhum dos seis descrever bem o que vocês observaram, nomeie o seu.
          </span>
          <input
            style={{ ...styles.input, flex: "none" }}
            value={padraoCustom.nome}
            onChange={(e) => setPadraoCustom((c) => ({ ...c, nome: e.target.value }))}
            placeholder="Nome do padrão"
          />
          {padraoCustom.nome.trim() && (
            <>
              <input
                style={{ ...styles.input, flex: "none" }}
                value={padraoCustom.ondeApareceu}
                onChange={(e) => setPadraoCustom((c) => ({ ...c, ondeApareceu: e.target.value }))}
                placeholder="Onde apareceu?"
              />
              <div style={styles.envioButtonsRow}>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPadraoCustom((c) => ({ ...c, geracoes: n }))}
                    style={{
                      ...styles.geracaoOption,
                      borderColor: padraoCustom.geracoes === n ? BLUE : "#E4EAF0",
                      background: padraoCustom.geracoes === n ? "#EAF2FB" : "#fff",
                    }}
                  >
                    {n === 3 ? "3 ou mais gerações" : `${n} geraç${n === 1 ? "ão" : "ões"}`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {padroesIdentificados.length > 0 && (
        <>
          {!insight && (
            <button onClick={gerarInsight} disabled={gerandoInsight} style={styles.demoLink}>
              {gerandoInsight ? "Gerando leitura…" : "✦ O que esses padrões podem significar"}
            </button>
          )}
          {insight && (
            <div style={styles.unlockBox}>
              <span style={styles.unlockLabel}>LEITURA DOS PADRÕES</span>
              <p style={styles.unlockHow}>{insight}</p>
              <span style={styles.aiTag}>✦ gerado pra sua linha do tempo</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StepClassificacao({ padroesIdentificados, classificacao, setClassificacao }) {
  const opcoes = [
    { key: "preservar", label: "Preservar" },
    { key: "transformar", label: "Transformar" },
    { key: "interromper", label: "Interromper" },
  ];
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 3 DE 8 · CLASSIFICAÇÃO DOS PADRÕES</span>
      <h1 style={styles.h1}>Para cada padrão, o que fazer com ele?</h1>
      <p style={styles.lead}>
        Um padrão só deve ser marcado em uma coluna. Nem todo padrão repetido é negativo, alguns
        merecem ser preservados.
      </p>

      <div style={styles.familiaList}>
        {padroesIdentificados.map((p) => (
          <div key={p.key} style={styles.padraoCard}>
            <span style={styles.papelNome}>{p.nome}</span>
            <span style={styles.papelDescricao}>
              {interpretaGeracoes(p.geracoes).label} · {p.geracoes === 3 ? "3+" : p.geracoes} geraç
              {p.geracoes === 1 ? "ão" : "ões"}
              {p.ondeApareceu ? ` — ${p.ondeApareceu}` : ""}
            </span>
            <div style={styles.envioButtonsRow}>
              {opcoes.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setClassificacao((c) => ({ ...c, [p.key]: o.key }))}
                  style={{
                    ...styles.geracaoOption,
                    borderColor: classificacao[p.key] === o.key ? BLUE : "#E4EAF0",
                    background: classificacao[p.key] === o.key ? "#EAF2FB" : "#fff",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepReflexaoF3({ reflexaoF3, setReflexaoF3, padroesIdentificados }) {
  const set = (field) => (e) => setReflexaoF3((r) => ({ ...r, [field]: e.target.value }));
  const nomes = padroesIdentificados.map((p) => p.nome).join(", ");
  const contexto = `padrões identificados na linha do tempo: ${nomes || "nenhum específico"}`;

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 4 DE 8 · REFLEXÃO INDIVIDUAL</span>
      <h1 style={styles.h1}>Sozinho, antes de qualquer conversa em grupo.</h1>
      <p style={styles.lead}>
        Essas perguntas ajudam a transformar o mapeamento histórico em posicionamento pessoal.
      </p>

      <CampoReflexao
        pergunta="Qual padrão mais me chamou atenção?"
        valor={reflexaoF3.maisChamouAtencao}
        onChange={set("maisChamouAtencao")}
        placeholder="O que mais surpreendeu você ao ver a linha do tempo completa…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F3}
      />
      <CampoReflexao
        pergunta="Qual padrão continua influenciando nossas decisões?"
        valor={reflexaoF3.continuaInfluenciando}
        onChange={set("continuaInfluenciando")}
        placeholder="O padrão que você reconhece agindo, ainda hoje, nas decisões da família ou da empresa…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F3}
      />
      <CampoReflexao
        pergunta="Qual padrão precisa ser interrompido?"
        valor={reflexaoF3.precisaInterromper}
        onChange={set("precisaInterromper")}
        placeholder="O padrão que custa mais do que ajuda, e não deveria chegar à próxima geração…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F3}
      />
      <CampoReflexao
        pergunta="Qual legado merece ser preservado?"
        valor={reflexaoF3.legadoPreservar}
        onChange={set("legadoPreservar")}
        placeholder="O padrão ou valor que atravessou gerações de forma positiva…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F3}
      />
    </div>
  );
}

function TabelaComportamentos({
  titulo,
  linhas,
  setLinhas,
  labelComportamento,
  labelMotivo,
  placeholderComportamento,
  placeholderMotivo,
}) {
  const add = () =>
    setLinhas((prev) => [...prev, { id: (prev[prev.length - 1]?.id || 0) + 1, comportamento: "", motivo: "" }]);
  const remove = (id) => setLinhas((prev) => prev.filter((l) => l.id !== id));
  const set = (id, field, val) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));

  return (
    <div style={styles.padraoCard}>
      <span style={styles.papelNome}>{titulo}</span>
      <div style={styles.timelineTopRow}>
        <span style={{ ...styles.padraoInterpretacao, flex: "1 1 200px" }}>{labelComportamento}</span>
        <span style={{ ...styles.padraoInterpretacao, flex: "1 1 200px" }}>{labelMotivo}</span>
      </div>
      <div style={styles.familiaList}>
        {linhas.map((l) => (
          <div key={l.id} style={styles.familiaRow}>
            <input
              style={styles.input}
              value={l.comportamento}
              onChange={(e) => set(l.id, "comportamento", e.target.value)}
              placeholder={placeholderComportamento}
            />
            <input
              style={styles.input}
              value={l.motivo}
              onChange={(e) => set(l.id, "motivo", e.target.value)}
              placeholder={placeholderMotivo}
            />
            {linhas.length > 1 && (
              <button onClick={() => remove(l.id)} style={styles.removeRowButton} type="button">
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={add} type="button" style={styles.demoLink}>
        + Adicionar
      </button>
    </div>
  );
}

function TabelaTransformar({ titulo, linhas, setLinhas }) {
  const add = () =>
    setLinhas((prev) => [...prev, { id: (prev[prev.length - 1]?.id || 0) + 1, de: "", para: "" }]);
  const remove = (id) => setLinhas((prev) => prev.filter((l) => l.id !== id));
  const set = (id, field, val) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));

  return (
    <div style={styles.padraoCard}>
      <span style={styles.papelNome}>{titulo}</span>
      <div style={styles.familiaList}>
        {linhas.map((l) => (
          <div key={l.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.padraoInterpretacao}>DE</span>
              {linhas.length > 1 && (
                <button onClick={() => remove(l.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={l.de}
              onChange={(e) => set(l.id, "de", e.target.value)}
              placeholder="Ex.: decisões concentradas em uma só pessoa"
            />
            <span style={styles.padraoInterpretacao}>PARA</span>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={l.para}
              onChange={(e) => set(l.id, "para", e.target.value)}
              placeholder="Ex.: decisão por consenso qualificado entre os sócios"
            />
          </div>
        ))}
      </div>
      <button onClick={add} type="button" style={styles.demoLink}>
        + Adicionar
      </button>
    </div>
  );
}

function TabelaTresColunas({ titulo, linhas, setLinhas, campos, labels, placeholders, opcoesColuna2 }) {
  const [c1, c2, c3] = campos;
  const add = () =>
    setLinhas((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, [c1]: "", [c2]: "", [c3]: "" },
    ]);
  const remove = (id) => setLinhas((prev) => prev.filter((l) => l.id !== id));
  const set = (id, field, val) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));

  return (
    <div style={styles.padraoCard}>
      <span style={styles.papelNome}>{titulo}</span>
      <div style={styles.familiaList}>
        {linhas.map((l) => (
          <div key={l.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.padraoInterpretacao}>{labels[0]}</span>
              {linhas.length > 1 && (
                <button onClick={() => remove(l.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={l[c1]}
              onChange={(e) => set(l.id, c1, e.target.value)}
              placeholder={placeholders[0]}
            />
            <span style={styles.padraoInterpretacao}>{labels[1]}</span>
            {opcoesColuna2 ? (
              <div style={styles.envioButtonsRow}>
                {opcoesColuna2.map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => set(l.id, c2, op)}
                    style={{
                      ...styles.geracaoOption,
                      borderColor: l[c2] === op ? BLUE : "#E4EAF0",
                      background: l[c2] === op ? "#EAF2FB" : "#fff",
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            ) : (
              <input
                style={{ ...styles.input, flex: "none" }}
                value={l[c2]}
                onChange={(e) => set(l.id, c2, e.target.value)}
                placeholder={placeholders[1]}
              />
            )}
            <span style={styles.padraoInterpretacao}>{labels[2]}</span>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={l[c3]}
              onChange={(e) => set(l.id, c3, e.target.value)}
              placeholder={placeholders[2]}
            />
          </div>
        ))}
      </div>
      <button onClick={add} type="button" style={styles.demoLink}>
        + Adicionar
      </button>
    </div>
  );
}

function StepConsolidacaoF3({
  repetir,
  setRepetir,
  transformarLista,
  setTransformarLista,
  interromperLista,
  setInterromperLista,
  padroesIdentificados,
  classificacao,
}) {
  const [script, setScript] = useState(null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    const aindaVaziaCM = (lista) => lista.length === 1 && !lista[0].comportamento.trim();
    const aindaVaziaDP = (lista) => lista.length === 1 && !lista[0].de.trim();
    if (
      padroesIdentificados.length > 0 &&
      aindaVaziaCM(repetir) &&
      aindaVaziaDP(transformarLista) &&
      aindaVaziaCM(interromperLista)
    ) {
      let idR = 1;
      let idT = 1;
      let idI = 1;
      const novoRepetir = [];
      const novoTransformar = [];
      const novoInterromper = [];
      padroesIdentificados.forEach((p) => {
        const c = classificacao[p.key];
        if (c === "preservar") novoRepetir.push({ id: idR++, comportamento: p.nome, motivo: "" });
        else if (c === "transformar") novoTransformar.push({ id: idT++, de: p.nome, para: "" });
        else if (c === "interromper") novoInterromper.push({ id: idI++, comportamento: p.nome, motivo: "" });
      });
      if (novoRepetir.length) setRepetir(novoRepetir);
      if (novoTransformar.length) setTransformarLista(novoTransformar);
      if (novoInterromper.length) setInterromperLista(novoInterromper);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prepararConversa = () => {
    setGerando(true);
    setScript(null);
    const resumo = padroesIdentificados
      .map((p) => `${p.nome} (${classifLabelF3(classificacao[p.key])})`)
      .join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F3}\n\n` +
      `Você ajuda alguém que usou a ferramenta acima a se preparar para a Consolidação Familiar. ` +
      `Os padrões identificados e já classificados foram: ${resumo || "nenhum ainda"}.\n\n` +
      `Sugira 2-3 frases curtas de abertura pra essa pessoa começar essa conversa em família, ` +
      `apresentando isso como um padrão de sistema (não como culpa de ninguém). Formate como ` +
      `lista curta. Responda só com as frases, sem introdução, em português do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => setScript(texto))
      .catch(() => setScript("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 5 DE 8 · CONSOLIDAÇÃO FAMILIAR</span>
      <h1 style={styles.h1}>Reúna a família: o que repetir, transformar, interromper?</h1>
      <p style={styles.lead}>
        Já pré-preenchi as três tabelas abaixo com base no que vocês classificaram no Passo 3 —
        revisem, ajustem e completem o motivo de cada uma.
      </p>

      {!script && (
        <button onClick={prepararConversa} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando sugestão…" : "✦ Preciso de ajuda para começar a conversa"}
        </button>
      )}
      {script && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ sugestão gerada pra sua situação</span>
          <p style={styles.scriptText}>{script}</p>
        </div>
      )}

      <TabelaComportamentos
        titulo="O que queremos repetir?"
        linhas={repetir}
        setLinhas={setRepetir}
        labelComportamento="COMPORTAMENTO"
        labelMotivo="MOTIVO"
        placeholderComportamento="Ex.: compromisso com a qualidade do produto"
        placeholderMotivo="Ex.: sustenta a reputação da marca há três gerações"
      />
      <TabelaTransformar
        titulo="O que queremos transformar?"
        linhas={transformarLista}
        setLinhas={setTransformarLista}
      />
      <TabelaComportamentos
        titulo="O que queremos interromper?"
        linhas={interromperLista}
        setLinhas={setInterromperLista}
        labelComportamento="COMPORTAMENTO"
        labelMotivo="MOTIVO"
        placeholderComportamento="Ex.: decisões concentradas em uma só pessoa"
        placeholderMotivo="Ex.: impede o desenvolvimento dos próximos líderes"
      />
    </div>
  );
}

function StepDecisaoF3({ decisaoF3, setDecisaoF3 }) {
  const set = (field) => (e) => setDecisaoF3((d) => ({ ...d, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 6 DE 8 · DECISÃO</span>
      <h1 style={styles.h1}>Feche o processo respondendo, como família.</h1>
      <p style={styles.lead}>
        Com os padrões já classificados e a família alinhada na Consolidação, é hora de decidir
        o que muda a partir de agora. Isso é uma proposta, vale negociar antes de virar
        definitivo.
      </p>

      <label style={styles.fieldLabel}>Quais padrões devem continuar fortalecendo a família empresária?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF3.fortalecer}
        onChange={set("fortalecer")}
        placeholder="Padrões classificados como Preservar que merecem ser reforçados ativamente…"
      />
      <label style={styles.fieldLabel}>Quais padrões estão limitando a continuidade?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF3.limitando}
        onChange={set("limitando")}
        placeholder="Padrões classificados como Interromper ou Transformar que exigem ação concreta…"
      />
      <label style={styles.fieldLabel}>Quais novos comportamentos queremos construir?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF3.novosComportamentos}
        onChange={set("novosComportamentos")}
        placeholder="Comportamentos que ainda não existem na história da família, mas que vocês querem iniciar…"
      />
    </div>
  );
}

function StepPlanoF3({ planoF3, setPlanoF3, padroesIdentificados, classificacao, decisaoF3 }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  const addAcao = () =>
    setPlanoF3((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, acao: "", responsavel: "", prazo: "" },
    ]);
  const removeAcao = (id) => setPlanoF3((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setPlanoF3((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirAcoes = () => {
    setGerando(true);
    setErro(false);
    const resumo = padroesIdentificados
      .map((p) => `${p.nome} (${classifLabelF3(classificacao[p.key])})`)
      .join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F3}\n\n` +
      `Você ajuda alguém que já percorreu a ferramenta acima a transformar a decisão em um plano ` +
      `de ação. Contexto:\n` +
      `- Padrões identificados e classificados: ${resumo || "não informado"}\n` +
      `${decisaoF3.limitando ? `- O que está limitando a continuidade: "${decisaoF3.limitando}"\n` : ""}` +
      `${decisaoF3.novosComportamentos ? `- Novo comportamento desejado: "${decisaoF3.novosComportamentos}"\n` : ""}\n` +
      `Sugira 3 ações em sequência cronológica (a primeira mais imediata, a última mais à frente), ` +
      `cada uma no infinitivo, com responsável e prazo sugeridos. Lembre que isso ainda precisa ser ` +
      `negociado em família, não é uma decisão unilateral.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"acao":"","responsavel":"","prazo":""},{"acao":"","responsavel":"","prazo":""},` +
      `{"acao":"","responsavel":"","prazo":""}]`;

    callClaude(prompt, 400)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlanoF3(
            parsed.map((a, i) => ({
              id: i + 1,
              acao: a.acao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
            }))
          );
        }
      })
      .catch(() => setErro(true))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 7 DE 8 · PLANO DE AÇÃO</span>
      <h1 style={styles.h1}>Transforme a decisão em ações concretas, em sequência.</h1>
      <p style={styles.lead}>
        Uma ação sem responsável e prazo tende a virar só uma boa intenção. Pense em 2 ou 3 passos,
        do mais imediato ao mais à frente.
      </p>

      <button onClick={sugerirAcoes} disabled={gerando} style={styles.demoLink}>
        {gerando ? "Gerando sugestões…" : "✦ Sugerir 3 ações em sequência"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {planoF3.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              {planoF3.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.acao}
              onChange={(e) => setAcao(a.id, "acao", e.target.value)}
              placeholder="Ex.: formalizar três alçadas de decisão autônomas da diretoria…"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: 60 dias"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra ação
      </button>
    </div>
  );
}

function StepImpactosF3({ impactosF3, setImpactosF3 }) {
  const set = (field) => (e) => setImpactosF3((i) => ({ ...i, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 8 DE 8 · IMPACTOS ESPERADOS</span>
      <h1 style={styles.h1}>As mudanças raramente afetam só um domínio.</h1>
      <p style={styles.lead}>
        Interromper ou transformar um padrão de gerações mexe com mais do que a rotina da
        empresa. Preencha os três campos abaixo pra antecipar reflexos em cada área, antes que
        eles apareçam sem aviso.
      </p>

      <label style={styles.fieldLabel}>Família</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={impactosF3.familia}
        onChange={set("familia")}
        placeholder="Como as mudanças decididas devem afetar as relações e a dinâmica familiar…"
      />
      <label style={styles.fieldLabel}>Negócio</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={impactosF3.negocio}
        onChange={set("negocio")}
        placeholder="Como as mudanças decididas devem afetar a operação e a gestão da empresa…"
      />
      <label style={styles.fieldLabel}>Patrimônio</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={impactosF3.patrimonio}
        onChange={set("patrimonio")}
        placeholder="Como as mudanças decididas devem afetar a proteção, distribuição ou crescimento do patrimônio…"
      />
    </div>
  );
}

function StepFechamentoF3({
  eventos,
  padroesIdentificados,
  classificacao,
  reflexaoF3,
  repetir,
  transformarLista,
  interromperLista,
  decisaoF3,
  planoF3,
  impactosF3,
  onReiniciar,
  envioId,
}) {
  const [salvando, setSalvando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);
  const [sintese, setSintese] = useState(null);
  const [carregandoSintese, setCarregandoSintese] = useState(false);

  const repetirPreenchida = repetir.filter((r) => r.comportamento.trim());
  const transformarPreenchida = transformarLista.filter((r) => r.de.trim());
  const interromperPreenchida = interromperLista.filter((r) => r.comportamento.trim());

  useEffect(() => {
    let cancelado = false;
    setSalvando(true);
    setErroSalvar(false);

    supabaseInsert("respostas", {
      envio_id: envioId || null,
      ferramenta_numero: 3,
      notas: { eventos },
      conflito: {
        padroes: padroesIdentificados.map((p) => ({
          nome: p.nome,
          geracoes: p.geracoes,
          ondeApareceu: p.ondeApareceu,
          classificacao: classificacao[p.key] || null,
        })),
      },
      reflexao: reflexaoF3,
      consolidacao: {
        repetir: repetirPreenchida,
        transformar: transformarPreenchida,
        interromper: interromperPreenchida,
      },
      decisao_final: decisaoF3,
      plano_acao: planoF3,
      alinhamento: impactosF3,
    })
      .then(() => {
        if (!cancelado) setSalvo(true);
      })
      .catch(() => {
        if (!cancelado) setErroSalvar(true);
      })
      .finally(() => {
        if (!cancelado) setSalvando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelado = false;
    if (padroesIdentificados.length === 0) return;
    setCarregandoSintese(true);
    const resumo = padroesIdentificados
      .map((p) => `${p.nome} (${classifLabelF3(classificacao[p.key])}, ${p.geracoes} gerações)`)
      .join(". ");
    const prompt =
      `${LIVRO_CONTEXTO_F3}\n\n` +
      `Alguém completou a Linha de Repetição Familiar. Padrões identificados e classificados: ${resumo}.` +
      `${decisaoF3.novosComportamentos ? ` Novo comportamento que querem construir: "${decisaoF3.novosComportamentos}".` : ""}\n\n` +
      `Escreva um parágrafo curto de fechamento (3-4 frases, no máximo 80 palavras) que amarre isso ` +
      `numa síntese concreta e acolhedora, reforçando que nomear o padrão como estrutural (não ` +
      `como culpa individual) é o que costuma destravar a mudança. Tom direto, sem clichês de ` +
      `autoajuda. Responda só com o texto, sem introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setSintese(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoSintese(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const montarResumo = () => {
    const acoesTexto = planoF3
      .filter((a) => a.acao.trim())
      .map((a, i) => `${i + 1}. ${a.acao} — Responsável: ${a.responsavel || "—"} — Prazo: ${a.prazo || "—"}`)
      .join("\n");
    const linhas = [
      "Linha de Repetição Familiar",
      "",
      `Padrões identificados: ${padroesIdentificados.map((p) => `${p.nome} (${classifLabelF3(classificacao[p.key])})`).join(", ") || "—"}`,
      "",
      sintese ? `Síntese: ${sintese}` : null,
      sintese ? "" : null,
      `Queremos repetir: ${repetirPreenchida.map((r) => r.comportamento).join(", ") || "—"}`,
      `Queremos transformar: ${transformarPreenchida.map((r) => `${r.de} → ${r.para || "?"}`).join("; ") || "—"}`,
      `Queremos interromper: ${interromperPreenchida.map((r) => r.comportamento).join(", ") || "—"}`,
      "",
      "Plano de ação:",
      acoesTexto || "—",
    ].filter((l) => l !== null);
    return linhas.join("\n");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      notifyConsultor("Nosso resultado — Linha de Repetição Familiar", montarResumo());
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stepWrap}>
      <div style={styles.saveStatus}>
        {salvando && <span style={styles.saveStatusText}>Salvando seu resultado…</span>}
        {!salvando && salvo && <span style={styles.saveStatusOk}>✓ Resultado salvo</span>}
        {!salvando && erroSalvar && (
          <span style={styles.saveStatusErr}>Não deu pra salvar automaticamente, use o e-mail abaixo</span>
        )}
      </div>
      <span style={styles.eyebrowSmall}>FECHAMENTO</span>
      <h1 style={styles.h1}>Sua Linha de Repetição Familiar, resumida.</h1>

      <div style={styles.resumoGrid}>
        {padroesIdentificados.map((p) => (
          <div key={p.key} style={styles.resumoCard}>
            <div
              style={{
                ...styles.resumoBar,
                background: p.geracoes >= 3 ? BLUE : p.geracoes === 2 ? LIGHTBLUE : "#9AA7B4",
              }}
            />
            <div style={styles.resumoCardInner}>
              <span style={styles.resumoName}>{p.nome}</span>
              <span style={styles.resumoValue}>{classifLabelF3(classificacao[p.key])}</span>
              <span style={styles.resumoScore}>{interpretaGeracoes(p.geracoes).label}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.unlockBox}>
        <span style={styles.unlockLabel}>SÍNTESE</span>
        {carregandoSintese ? (
          <p style={styles.unlockHow}>
            <span style={{ opacity: 0.6 }}>Gerando síntese pra sua situação específica…</span>
          </p>
        ) : (
          <>
            <p style={styles.unlockHow}>
              {sintese ||
                "Os padrões que apareceram aqui não são defeito de ninguém, são heranças que ninguém tinha nomeado antes. Nomear é o que abre espaço pra escolher."}
            </p>
            {sintese && <span style={styles.aiTag}>✦ gerado pra sua situação</span>}
          </>
        )}
      </div>

      <div style={styles.fechamentoBox}>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>QUEREMOS REPETIR</span>
          <span style={styles.fechamentoValue}>
            {repetirPreenchida.map((r) => r.comportamento).join(", ") || "—"}
          </span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>QUEREMOS TRANSFORMAR</span>
          <span style={styles.fechamentoValue}>
            {transformarPreenchida.map((r) => `${r.de} → ${r.para || "?"}`).join("; ") || "—"}
          </span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>QUEREMOS INTERROMPER</span>
          <span style={styles.fechamentoValue}>
            {interromperPreenchida.map((r) => r.comportamento).join(", ") || "—"}
          </span>
        </div>
      </div>

      <div style={styles.familiaList}>
        {planoF3
          .filter((a) => a.acao.trim())
          .map((a, i) => (
            <div key={a.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              <span style={styles.papelDescricao}>{a.acao}</span>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>RESPONSÁVEL</span>
                <span style={styles.fechamentoValue}>{a.responsavel || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>PRAZO</span>
                <span style={styles.fechamentoValue}>{a.prazo || "—"}</span>
              </div>
            </div>
          ))}
      </div>

      <div style={styles.ctaBox}>
        <p style={styles.ctaTitle}>Agora é executar, com acompanhamento.</p>
        <p style={styles.ctaSub}>
          Vocês percorreram a linha do tempo, identificaram os padrões, classificaram, refletiram
          sozinhos, consolidaram em família, decidiram e planejaram. O que falta agora é colocar
          em prática, e revisitar daqui a alguns meses pra ver se o padrão mudou de verdade.
        </p>
      </div>

      <p style={{ ...styles.papelDescricao, marginTop: 4 }} className="no-print">
        Um resumo desse resultado já foi enviado automaticamente pro consultor.
      </p>
      <div style={styles.finalButtonsRow} className="no-print">
        <button onClick={() => window.print()} style={styles.ctaButton}>
          🖨️ Baixar / imprimir PDF
        </button>
        <button onClick={onReiniciar} style={styles.restartButton}>
          ↺ Voltar ao início
        </button>
      </div>
    </div>
  );
}

const STEP_F4_MAPEAMENTO = 0;
const STEP_F4_FORMAL_REAL = 1;
const STEP_F4_GARGALOS = 2;
const STEP_F4_CLASSIFICACAO = 3;
const STEP_F4_REFLEXAO = 4;
const STEP_F4_CONSOLIDACAO = 5;
const STEP_F4_DECISAO = 6;
const STEP_F4_PLANO = 7;
const STEP_F4_IMPACTOS = 8;
const STEP_F4_FECHAMENTO = 9;

function initPessoasF4() {
  return [{ id: 1, nome: "", influencia: null, decisao: null, responsabilidade: null }];
}

function initGargalosF4() {
  return GARGALOS_F4.reduce((acc, g) => {
    acc[g] = { deveria: "", realmente: "" };
    return acc;
  }, {});
}

function classifLabelF4(key) {
  const p = PADROES_F4.find((x) => x.key === key);
  return p ? p.nome : "—";
}

const FAMILIA_EXEMPLO_F4 = {
  pessoas: [
    { id: 1, nome: "Marina", influencia: 4, decisao: 3, responsabilidade: 4 },
    { id: 2, nome: "Antônio (pai)", influencia: 5, decisao: 5, responsabilidade: 2 },
  ],
  formalReal: {
    1: { cargo: "Diretora Financeira", procuram: "Ainda procuram o pai pra decisões acima de R$50 mil" },
    2: { cargo: "Conselheiro (formalmente afastado da diretoria)", procuram: "Ele mesmo, apesar de já não ter cargo executivo" },
  },
  gargalos: {
    ...initGargalosF4(),
    Investimentos: { deveria: "Diretoria, com Marina como financeira", realmente: "Antônio, mesmo sem cargo executivo" },
    Sucessão: { deveria: "Conselho de família", realmente: "Ninguém decide, fica em aberto há meses" },
  },
  classificacao: { Investimentos: "paralela", Sucessão: "ausente" },
  reflexaoF4: {
    concentracao: "As decisões de investimento continuam passando pelo meu pai, mesmo com o cargo formal comigo.",
    vazio: "Ninguém assumiu formalmente decidir o cronograma da minha própria sucessão.",
    surpresa: "Perceber que o vazio na sucessão pesa tanto quanto o excesso de autoridade do meu pai.",
  },
  consolidacaoF4: [
    {
      id: 1,
      comportamento: "Meu pai ainda é procurado em decisões de investimento, mesmo formalmente afastado.",
      motivo: "Vamos redirecionar formalmente essas decisões pra diretoria financeira.",
    },
  ],
  decisaoF4: {
    migrar: "Decisões de investimento, hoje concentradas no meu pai, devem migrar formalmente pra mim.",
    formalizar: "Minha alçada de aprovação de investimentos até um valor definido.",
    foruns: "Um comitê de sucessão com reuniões trimestrais, que hoje não existe.",
  },
  planoF4: [
    {
      id: 1,
      acao: "Comunicar ao conselho a nova alçada de aprovação de investimentos da Marina.",
      responsavel: "Antônio",
      prazo: "15 dias",
    },
    {
      id: 2,
      acao: "Formalizar por escrito o limite de valor que Marina aprova sozinha.",
      responsavel: "Marina e Antônio",
      prazo: "45 dias",
    },
    {
      id: 3,
      acao: "Criar o comitê de sucessão com a primeira reunião marcada.",
      responsavel: "Antônio e o conselho",
      prazo: "90 dias",
    },
  ],
  impactosF4: {
    familia: "Menos tensão nas conversas de investimento, porque a alçada fica clara pra todo mundo.",
    negocio: "Decisões de investimento mais rápidas, sem depender da disponibilidade do meu pai.",
    patrimonio: "Processo de sucessão finalmente com um fórum formal, reduzindo o risco de ficar indefinido.",
  },
};

function Ferramenta4App({ onVoltarCatalogo, envioIdInicial }) {
  const [step, setStep] = useState(STEP_F4_MAPEAMENTO);
  const [pessoas, setPessoas] = useState(initPessoasF4());
  const [formalReal, setFormalReal] = useState({});
  const [gargalos, setGargalos] = useState(initGargalosF4());
  const [classificacao, setClassificacao] = useState({});
  const [reflexaoF4, setReflexaoF4] = useState({ concentracao: "", vazio: "", surpresa: "" });
  const [consolidacaoF4, setConsolidacaoF4] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [decisaoF4, setDecisaoF4] = useState({ migrar: "", formalizar: "", foruns: "" });
  const [planoF4, setPlanoF4] = useState([{ id: 1, acao: "", responsavel: "", prazo: "" }]);
  const [impactosF4, setImpactosF4] = useState({ familia: "", negocio: "", patrimonio: "" });

  const pessoasPreenchidas = useMemo(() => pessoas.filter((p) => p.nome.trim()), [pessoas]);
  const gargalosPreenchidos = useMemo(
    () => GARGALOS_F4.filter((g) => gargalos[g].deveria.trim() || gargalos[g].realmente.trim()),
    [gargalos]
  );

  const addPessoa = () =>
    setPessoas((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, nome: "", influencia: null, decisao: null, responsabilidade: null },
    ]);
  const removePessoa = (id) => {
    setPessoas((prev) => prev.filter((p) => p.id !== id));
    setFormalReal((prev) => {
      const novo = { ...prev };
      delete novo[id];
      return novo;
    });
  };
  const setPessoaField = (id, field, val) =>
    setPessoas((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)));

  const setFormalRealField = (id, field, val) =>
    setFormalReal((prev) => ({ ...prev, [id]: { ...(prev[id] || { cargo: "", procuram: "" }), [field]: val } }));

  const setGargaloField = (g, field, val) =>
    setGargalos((prev) => ({ ...prev, [g]: { ...prev[g], [field]: val } }));

  const carregarExemploF4 = () => {
    setPessoas(FAMILIA_EXEMPLO_F4.pessoas);
    setFormalReal(FAMILIA_EXEMPLO_F4.formalReal);
    setGargalos(FAMILIA_EXEMPLO_F4.gargalos);
    setClassificacao(FAMILIA_EXEMPLO_F4.classificacao);
    setReflexaoF4(FAMILIA_EXEMPLO_F4.reflexaoF4);
    setConsolidacaoF4(FAMILIA_EXEMPLO_F4.consolidacaoF4);
    setDecisaoF4(FAMILIA_EXEMPLO_F4.decisaoF4);
    setPlanoF4(FAMILIA_EXEMPLO_F4.planoF4);
    setImpactosF4(FAMILIA_EXEMPLO_F4.impactosF4);
    setStep(STEP_F4_GARGALOS);
  };

  const canAdvance = () => {
    if (step === STEP_F4_MAPEAMENTO) {
      return pessoasPreenchidas.some(
        (p) => p.influencia !== null && p.decisao !== null && p.responsabilidade !== null
      );
    }
    if (step === STEP_F4_FORMAL_REAL) {
      return pessoasPreenchidas.some((p) => {
        const fr = formalReal[p.id];
        return fr && fr.cargo.trim() && fr.procuram.trim();
      });
    }
    if (step === STEP_F4_GARGALOS) return gargalosPreenchidos.length > 0;
    if (step === STEP_F4_CLASSIFICACAO) return gargalosPreenchidos.every((g) => classificacao[g]);
    if (step === STEP_F4_REFLEXAO) {
      return (
        reflexaoF4.concentracao.trim().length > 3 &&
        reflexaoF4.vazio.trim().length > 3 &&
        reflexaoF4.surpresa.trim().length > 3
      );
    }
    if (step === STEP_F4_CONSOLIDACAO) {
      return consolidacaoF4.some((c) => c.comportamento.trim() && c.motivo.trim());
    }
    if (step === STEP_F4_DECISAO) {
      return (
        decisaoF4.migrar.trim().length > 3 &&
        decisaoF4.formalizar.trim().length > 3 &&
        decisaoF4.foruns.trim().length > 3
      );
    }
    if (step === STEP_F4_PLANO) {
      return planoF4.some(
        (a) => a.acao.trim().length > 3 && a.responsavel.trim().length > 0 && a.prazo.trim().length > 0
      );
    }
    if (step === STEP_F4_IMPACTOS) {
      return (
        impactosF4.familia.trim().length > 3 &&
        impactosF4.negocio.trim().length > 3 &&
        impactosF4.patrimonio.trim().length > 3
      );
    }
    return true;
  };

  const goNext = () => setStep((s) => Math.min(STEP_F4_FECHAMENTO, s + 1));
  const goBack = () => setStep((s) => Math.max(STEP_F4_MAPEAMENTO, s - 1));

  return (
    <>
      <Header4 step={step} onVoltarCatalogo={onVoltarCatalogo} />
      <div style={styles.body}>
        {step === STEP_F4_MAPEAMENTO && (
          <StepMapeamento
            pessoas={pessoas}
            addPessoa={addPessoa}
            removePessoa={removePessoa}
            setPessoaField={setPessoaField}
            onCarregarExemplo={carregarExemploF4}
          />
        )}
        {step === STEP_F4_FORMAL_REAL && (
          <StepFormalReal
            pessoasPreenchidas={pessoasPreenchidas}
            formalReal={formalReal}
            setFormalRealField={setFormalRealField}
          />
        )}
        {step === STEP_F4_GARGALOS && (
          <StepGargalos gargalos={gargalos} setGargaloField={setGargaloField} />
        )}
        {step === STEP_F4_CLASSIFICACAO && (
          <StepClassificacaoF4
            gargalos={gargalos}
            gargalosPreenchidos={gargalosPreenchidos}
            classificacao={classificacao}
            setClassificacao={setClassificacao}
          />
        )}
        {step === STEP_F4_REFLEXAO && (
          <StepReflexaoF4 reflexaoF4={reflexaoF4} setReflexaoF4={setReflexaoF4} classificacao={classificacao} />
        )}
        {step === STEP_F4_CONSOLIDACAO && (
          <StepConsolidacaoF4
            consolidacaoF4={consolidacaoF4}
            setConsolidacaoF4={setConsolidacaoF4}
            gargalosPreenchidos={gargalosPreenchidos}
            classificacao={classificacao}
          />
        )}
        {step === STEP_F4_DECISAO && <StepDecisaoF4 decisaoF4={decisaoF4} setDecisaoF4={setDecisaoF4} />}
        {step === STEP_F4_PLANO && (
          <StepPlanoF4
            planoF4={planoF4}
            setPlanoF4={setPlanoF4}
            gargalosPreenchidos={gargalosPreenchidos}
            classificacao={classificacao}
            decisaoF4={decisaoF4}
          />
        )}
        {step === STEP_F4_IMPACTOS && (
          <StepImpactosF4 impactosF4={impactosF4} setImpactosF4={setImpactosF4} />
        )}
        {step === STEP_F4_FECHAMENTO && (
          <StepFechamentoF4
            pessoasPreenchidas={pessoasPreenchidas}
            formalReal={formalReal}
            gargalosPreenchidos={gargalosPreenchidos}
            classificacao={classificacao}
            reflexaoF4={reflexaoF4}
            consolidacaoF4={consolidacaoF4}
            decisaoF4={decisaoF4}
            planoF4={planoF4}
            impactosF4={impactosF4}
            onReiniciar={onVoltarCatalogo}
            envioId={envioIdInicial}
          />
        )}
      </div>
      {step < STEP_F4_FECHAMENTO && (
        <Footer
          step={step}
          canAdvance={canAdvance()}
          isLastQuadrante={false}
          isDesempate={false}
          isPenultimate={step === STEP_F4_IMPACTOS}
          onBack={goBack}
          onNext={goNext}
        />
      )}
    </>
  );
}

function Header4({ step, onVoltarCatalogo }) {
  const labels = [
    "Mapeamento da autoridade",
    "Formal x Real",
    "Gargalos de autoridade",
    "Classificação",
    "Reflexão individual",
    "Consolidação familiar",
    "Decisão",
    "Plano de ação",
    "Impactos esperados",
    "Fechamento",
  ];
  const progress = Math.round((step / STEP_F4_FECHAMENTO) * 100);
  return (
    <div style={styles.header} className="no-print">
      <div style={styles.headerTop}>
        <button onClick={onVoltarCatalogo} style={styles.backToCatalogo}>
          ← Catálogo
        </button>
        <span style={styles.stepLabel}>Matriz de Autoridade Real · {labels[step]}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

function LinhaScore({ label, valor, onChange, max = 5 }) {
  const opcoes = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <div style={styles.scoreLinha}>
      <span style={styles.scoreLinhaLabel}>{label}</span>
      <div style={styles.dots}>
        {opcoes.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label}: nota ${n}`}
            style={{
              ...styles.dot,
              ...(max > 5 ? styles.dotSmall : null),
              background: valor === n ? BLUE : "#fff",
              borderColor: valor === n ? BLUE : "#D7DEE6",
              color: valor === n ? "#fff" : "#8A97A3",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderScore({ label, desc, exemploAlto, exemploBaixo, valor, onChange }) {
  const v = valor ?? 0;
  return (
    <div style={styles.padraoCard}>
      <div style={styles.timelineTopRow}>
        <span style={styles.papelNome}>{label}</span>
        <span style={{ ...styles.papelNome, color: BLUE }}>{valor === null ? "—" : v}</span>
      </div>
      {desc && <span style={styles.papelDescricao}>{desc}</span>}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        style={styles.sliderInput}
        aria-label={`${label}: nota de 0 a 100`}
      />
      <div style={styles.sliderTicks}>
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
      {(exemploAlto || exemploBaixo) && (
        <div style={styles.icsExemplosBox}>
          {exemploBaixo && (
            <span style={styles.icsExemploLinha}>
              <strong>Nota baixa parece com:</strong> {exemploBaixo}
            </span>
          )}
          {exemploAlto && (
            <span style={styles.icsExemploLinha}>
              <strong>Nota alta parece com:</strong> {exemploAlto}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function StepMapeamento({ pessoas, addPessoa, removePessoa, setPessoaField, onCarregarExemplo }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 1 DE 9 · MAPEAMENTO DA AUTORIDADE</span>
      <h1 style={styles.h1}>Quem realmente decide nesta família empresária?</h1>
      <p style={styles.lead}>
        Liste as pessoas mais relevantes na dinâmica de decisão, com ou sem cargo formal, e avalie
        cada uma de 0 a 5 em três dimensões: <strong>Influência</strong> (o quanto a opinião dessa
        pessoa pesa nas decisões, mesmo sem participar formalmente delas),{" "}
        <strong>Decisão</strong> (o quanto ela efetivamente decide, na prática) e{" "}
        <strong>Responsabilidade</strong> (o quanto ela responde pelos resultados, boas ou ruins).
        A escala vai de 0 (nenhuma) a 5 (dominante). Pontue o que você observa acontecer na
        prática, não o que está descrito no cargo ou no contrato.
      </p>

      <div style={styles.demoLinksRow}>
        <button onClick={onCarregarExemplo} style={styles.demoLink}>
          ⚡ Exemplo: família da Marina e do Antônio
        </button>
      </div>

      <div style={styles.familiaList}>
        {pessoas.map((p) => (
          <div key={p.id} style={styles.padraoCard}>
            <div style={styles.timelineTopRow}>
              <input
                style={{ ...styles.input, flex: "1 1 220px" }}
                value={p.nome}
                onChange={(e) => setPessoaField(p.id, "nome", e.target.value)}
                placeholder="Nome (ex.: meu pai, sem cargo formal)"
              />
              {pessoas.length > 1 && (
                <button onClick={() => removePessoa(p.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <LinhaScore
              label="Influência"
              valor={p.influencia}
              onChange={(n) => setPessoaField(p.id, "influencia", n)}
            />
            <LinhaScore label="Decisão" valor={p.decisao} onChange={(n) => setPessoaField(p.id, "decisao", n)} />
            <LinhaScore
              label="Responsabilidade"
              valor={p.responsabilidade}
              onChange={(n) => setPessoaField(p.id, "responsabilidade", n)}
            />
          </div>
        ))}
      </div>
      <button onClick={addPessoa} type="button" style={styles.demoLink}>
        + Adicionar outra pessoa
      </button>
    </div>
  );
}

function StepFormalReal({ pessoasPreenchidas, formalReal, setFormalRealField }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 2 DE 9 · AUTORIDADE FORMAL X AUTORIDADE REAL</span>
      <h1 style={styles.h1}>O cargo e a prática nem sempre coincidem.</h1>
      <p style={styles.lead}>
        Para cada pessoa que você listou, compare o cargo formal que ela ocupa com quem, na
        prática, as pessoas da empresa procuram quando precisam decidir algo relacionado a ela.
      </p>

      <div style={styles.familiaList}>
        {pessoasPreenchidas.map((p) => {
          const fr = formalReal[p.id] || { cargo: "", procuram: "" };
          return (
            <div key={p.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>{p.nome}</span>
              <span style={styles.padraoInterpretacao}>CARGO FORMAL</span>
              <input
                style={{ ...styles.input, flex: "none" }}
                value={fr.cargo}
                onChange={(e) => setFormalRealField(p.id, "cargo", e.target.value)}
                placeholder="Ex.: Diretor Comercial"
              />
              <span style={styles.padraoInterpretacao}>QUEM PROCURAM PARA DECIDIR</span>
              <input
                style={{ ...styles.input, flex: "none" }}
                value={fr.procuram}
                onChange={(e) => setFormalRealField(p.id, "procuram", e.target.value)}
                placeholder="Ex.: o pai, sem cargo formal"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepGargalos({ gargalos, setGargaloField }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 3 DE 9 · GARGALOS DE AUTORIDADE</span>
      <h1 style={styles.h1}>Em cada área, quem deveria decidir — e quem decide de fato?</h1>
      <p style={styles.lead}>
        Preencha as áreas que fizerem sentido pra sua família. Não precisa preencher todas as 5.
      </p>

      <div style={styles.familiaList}>
        {GARGALOS_F4.map((g) => (
          <div key={g} style={styles.padraoCard}>
            <span style={styles.papelNome}>{g}</span>
            <span style={styles.padraoInterpretacao}>QUEM DEVERIA DECIDIR</span>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={gargalos[g].deveria}
              onChange={(e) => setGargaloField(g, "deveria", e.target.value)}
              placeholder="Segundo o organograma ou o bom senso…"
            />
            <span style={styles.padraoInterpretacao}>QUEM REALMENTE DECIDE</span>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={gargalos[g].realmente}
              onChange={(e) => setGargaloField(g, "realmente", e.target.value)}
              placeholder="Na prática do dia a dia…"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepClassificacaoF4({ gargalos, gargalosPreenchidos, classificacao, setClassificacao }) {
  const [detectando, setDetectando] = useState(false);
  const [erro, setErro] = useState(false);

  const detectarAutomatico = () => {
    setDetectando(true);
    setErro(false);
    const resumo = gargalosPreenchidos
      .map((g) => `${g}: deveria decidir "${gargalos[g].deveria || "?"}", realmente decide "${gargalos[g].realmente || "?"}"`)
      .join("\n");
    const prompt =
      `${LIVRO_CONTEXTO_F4}\n\n` +
      `Para cada gargalo de autoridade abaixo, classifique em UM dos quatro padrões (use ` +
      `exatamente estas chaves: concentrada, difusa, paralela, ausente):\n\n${resumo}\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato: {"${gargalosPreenchidos[0] || "Contratações"}":"concentrada"}`;

    callClaude(prompt, 300)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        setClassificacao((prev) => {
          const novo = { ...prev };
          Object.entries(parsed).forEach(([g, val]) => {
            if (gargalosPreenchidos.includes(g) && PADROES_F4.some((p) => p.key === val)) {
              novo[g] = val;
            }
          });
          return novo;
        });
      })
      .catch(() => setErro(true))
      .finally(() => setDetectando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 4 DE 9 · CLASSIFICAÇÃO</span>
      <h1 style={styles.h1}>Para cada gargalo, qual padrão está presente?</h1>
      <p style={styles.lead}>
        Nomear o padrão certo muda o que fazer a seguir — um vazio de autoridade se resolve
        diferente de um excesso dela. Use o guia abaixo pra escolher com mais segurança.
      </p>

      <div style={styles.unlockBox}>
        <span style={styles.unlockLabel}>GUIA DE INTERPRETAÇÃO</span>
        <div style={styles.familiaList}>
          {PADROES_F4.map((p) => (
            <div key={p.key} style={styles.padraoGuiaRow}>
              <span style={styles.padraoGuiaNome}>{p.nome}</span>
              <span style={styles.papelDescricao}>{p.sinais}</span>
              <span style={styles.padraoInterpretacao}>Pergunta-chave: "{p.pergunta}"</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={detectarAutomatico} disabled={detectando} style={styles.demoLink}>
        {detectando ? "Detectando…" : "✦ Detectar os padrões automaticamente"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra detectar agora, escolha manualmente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {gargalosPreenchidos.map((g) => (
          <div key={g} style={styles.padraoCard}>
            <span style={styles.papelNome}>{g}</span>
            <span style={styles.papelDescricao}>
              Deveria: {gargalos[g].deveria || "—"} · Realmente: {gargalos[g].realmente || "—"}
            </span>
            <div style={styles.envioButtonsRow}>
              {PADROES_F4.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setClassificacao((c) => ({ ...c, [g]: p.key }))}
                  style={{
                    ...styles.geracaoOption,
                    borderColor: classificacao[g] === p.key ? BLUE : "#E4EAF0",
                    background: classificacao[g] === p.key ? "#EAF2FB" : "#fff",
                  }}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepReflexaoF4({ reflexaoF4, setReflexaoF4, classificacao }) {
  const set = (field) => (e) => setReflexaoF4((r) => ({ ...r, [field]: e.target.value }));
  const nomesPadroes = [...new Set(Object.values(classificacao).map((c) => classifLabelF4(c)))].join(", ");
  const contexto = `padrões de autoridade identificados: ${nomesPadroes || "nenhum específico"}`;

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 5 DE 9 · REFLEXÃO INDIVIDUAL</span>
      <h1 style={styles.h1}>Sozinho, antes de qualquer conversa em grupo.</h1>
      <p style={styles.lead}>
        Ninguém além de você vai ler isso agora. Essas perguntas não se respondem com planilha ou
        organograma — pedem coragem pra olhar pra dentro. Escreva o que for verdade, não o que
        soa bem de dizer em família.
      </p>

      <CampoReflexao
        pergunta="Onde percebo maior concentração de autoridade?"
        valor={reflexaoF4.concentracao}
        onChange={set("concentracao")}
        placeholder="A pessoa ou área em que o poder de decisão está mais centralizado hoje…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F4}
      />
      <CampoReflexao
        pergunta="Onde percebo maior vazio de liderança?"
        valor={reflexaoF4.vazio}
        onChange={set("vazio")}
        placeholder="A área em que ninguém, na prática, assume a responsabilidade de decidir…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F4}
      />
      <CampoReflexao
        pergunta="O que mais me chamou atenção?"
        valor={reflexaoF4.surpresa}
        onChange={set("surpresa")}
        placeholder="A descoberta que mais surpreendeu você ao comparar autoridade formal e real…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F4}
      />
    </div>
  );
}

function StepConsolidacaoF4({ consolidacaoF4, setConsolidacaoF4, gargalosPreenchidos, classificacao }) {
  const [script, setScript] = useState(null);
  const [gerando, setGerando] = useState(false);

  const prepararConversa = () => {
    setGerando(true);
    setScript(null);
    const resumo = gargalosPreenchidos.map((g) => `${g} (${classifLabelF4(classificacao[g])})`).join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F4}\n\n` +
      `Você ajuda alguém que usou a ferramenta acima a se preparar para a Consolidação Familiar. ` +
      `Os gargalos identificados e classificados foram: ${resumo || "nenhum ainda"}.\n\n` +
      `Sugira 2-3 frases curtas de abertura pra essa pessoa começar essa conversa em família, ` +
      `tratando o descompasso como questão estrutural, não como culpa de ninguém. Formate como ` +
      `lista curta. Responda só com as frases, sem introdução, em português do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => setScript(texto))
      .catch(() => setScript("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 6 DE 9 · CONSOLIDAÇÃO FAMILIAR</span>
      <h1 style={styles.h1}>Reúna o grupo e compartilhem as descobertas.</h1>
      <p style={styles.lead}>
        Registrem como cada descoberta muda a forma como vocês pretendem estruturar a autoridade
        daqui pra frente.
      </p>

      {!script && (
        <button onClick={prepararConversa} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando sugestão…" : "✦ Preciso de ajuda para começar a conversa"}
        </button>
      )}
      {script && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ sugestão gerada pra sua situação</span>
          <p style={styles.scriptText}>{script}</p>
        </div>
      )}

      <TabelaComportamentos
        titulo="Descobertas e impactos"
        linhas={consolidacaoF4}
        setLinhas={setConsolidacaoF4}
        labelComportamento="DESCOBERTA"
        labelMotivo="IMPACTO"
        placeholderComportamento="Ex.: o fundador ainda é procurado em decisões operacionais"
        placeholderMotivo="Ex.: vamos redirecionar formalmente essas decisões pros diretores"
      />
    </div>
  );
}

function StepDecisaoF4({ decisaoF4, setDecisaoF4 }) {
  const set = (field) => (e) => setDecisaoF4((d) => ({ ...d, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 7 DE 9 · DECISÃO</span>
      <h1 style={styles.h1}>Feche o processo respondendo, como família.</h1>
      <p style={styles.lead}>
        Com o mapa de autoridade e os gargalos já identificados, é hora de decidir o que muda a
        partir de agora. Isso é uma proposta, vale negociar com quem for afetado antes de virar
        definitivo.
      </p>

      <label style={styles.fieldLabel}>Quais decisões precisam migrar para a próxima geração?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF4.migrar}
        onChange={set("migrar")}
        placeholder="Decisões hoje concentradas em uma figura mais antiga…"
      />
      <label style={styles.fieldLabel}>Quais responsabilidades precisam ser formalizadas?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF4.formalizar}
        onChange={set("formalizar")}
        placeholder="Autoridades que já existem na prática, mas ainda não foram colocadas por escrito…"
      />
      <label style={styles.fieldLabel}>Quais fóruns precisam ser criados?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF4.foruns}
        onChange={set("foruns")}
        placeholder="Espaços de decisão que ainda não existem formalmente, como comitês ou reuniões periódicas…"
      />
    </div>
  );
}

function StepPlanoF4({ planoF4, setPlanoF4, gargalosPreenchidos, classificacao, decisaoF4 }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  const addAcao = () =>
    setPlanoF4((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, acao: "", responsavel: "", prazo: "" },
    ]);
  const removeAcao = (id) => setPlanoF4((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setPlanoF4((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirAcoes = () => {
    setGerando(true);
    setErro(false);
    const resumo = gargalosPreenchidos.map((g) => `${g} (${classifLabelF4(classificacao[g])})`).join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F4}\n\n` +
      `Você ajuda alguém que já percorreu a ferramenta acima a transformar a decisão em um plano ` +
      `de ação. Contexto:\n` +
      `- Gargalos identificados e classificados: ${resumo || "não informado"}\n` +
      `${decisaoF4.formalizar ? `- O que precisa ser formalizado: "${decisaoF4.formalizar}"\n` : ""}` +
      `${decisaoF4.foruns ? `- Fóruns a criar: "${decisaoF4.foruns}"\n` : ""}\n` +
      `Sugira 3 ações em sequência cronológica (a primeira mais imediata, a última mais à frente), ` +
      `cada uma no infinitivo, com responsável e prazo sugeridos. Lembre que isso ainda precisa ser ` +
      `negociado em família.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"acao":"","responsavel":"","prazo":""},{"acao":"","responsavel":"","prazo":""},` +
      `{"acao":"","responsavel":"","prazo":""}]`;

    callClaude(prompt, 400)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlanoF4(
            parsed.map((a, i) => ({
              id: i + 1,
              acao: a.acao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
            }))
          );
        }
      })
      .catch(() => setErro(true))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 8 DE 9 · PLANO DE AÇÃO</span>
      <h1 style={styles.h1}>Transforme a decisão em ações concretas, em sequência.</h1>
      <p style={styles.lead}>
        Uma ação sem responsável e prazo tende a virar apenas uma boa intenção.
      </p>

      <button onClick={sugerirAcoes} disabled={gerando} style={styles.demoLink}>
        {gerando ? "Gerando sugestões…" : "✦ Sugerir 3 ações em sequência"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {planoF4.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              {planoF4.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.acao}
              onChange={(e) => setAcao(a.id, "acao", e.target.value)}
              placeholder="Ex.: formalizar por escrito as três alçadas comerciais de Marcos…"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: 45 dias"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra ação
      </button>
    </div>
  );
}

function StepImpactosF4({ impactosF4, setImpactosF4 }) {
  const set = (field) => (e) => setImpactosF4((i) => ({ ...i, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 9 DE 9 · IMPACTOS ESPERADOS</span>
      <h1 style={styles.h1}>As mudanças na autoridade raramente afetam só a empresa.</h1>
      <p style={styles.lead}>
        Redesenhar quem decide o quê mexe com relações, não só com processos. Preencha os três
        campos abaixo pra antecipar reflexos em cada área, antes que eles apareçam sem aviso.
      </p>

      <label style={styles.fieldLabel}>Família</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={impactosF4.familia}
        onChange={set("familia")}
        placeholder="Como as mudanças decididas devem afetar as relações e a dinâmica familiar…"
      />
      <label style={styles.fieldLabel}>Negócio</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={impactosF4.negocio}
        onChange={set("negocio")}
        placeholder="Como as mudanças decididas devem afetar a operação e a velocidade de decisão…"
      />
      <label style={styles.fieldLabel}>Patrimônio</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={impactosF4.patrimonio}
        onChange={set("patrimonio")}
        placeholder="Como as mudanças decididas devem afetar a proteção ou gestão do patrimônio…"
      />
    </div>
  );
}

function StepFechamentoF4({
  pessoasPreenchidas,
  formalReal,
  gargalosPreenchidos,
  classificacao,
  reflexaoF4,
  consolidacaoF4,
  decisaoF4,
  planoF4,
  impactosF4,
  onReiniciar,
  envioId,
}) {
  const [salvando, setSalvando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);
  const [sintese, setSintese] = useState(null);
  const [carregandoSintese, setCarregandoSintese] = useState(false);

  const consolidacaoPreenchida = consolidacaoF4.filter((c) => c.comportamento.trim());

  useEffect(() => {
    let cancelado = false;
    setSalvando(true);
    setErroSalvar(false);

    supabaseInsert("respostas", {
      envio_id: envioId || null,
      ferramenta_numero: 4,
      notas: { pessoas: pessoasPreenchidas, formalReal },
      conflito: {
        gargalos: gargalosPreenchidos.map((g) => ({ area: g, classificacao: classificacao[g] || null })),
      },
      reflexao: reflexaoF4,
      consolidacao: { descobertas: consolidacaoPreenchida },
      decisao_final: decisaoF4,
      plano_acao: planoF4,
      alinhamento: impactosF4,
    })
      .then(() => {
        if (!cancelado) setSalvo(true);
      })
      .catch(() => {
        if (!cancelado) setErroSalvar(true);
      })
      .finally(() => {
        if (!cancelado) setSalvando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelado = false;
    if (gargalosPreenchidos.length === 0) return;
    setCarregandoSintese(true);
    const resumo = gargalosPreenchidos.map((g) => `${g} (${classifLabelF4(classificacao[g])})`).join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F4}\n\n` +
      `Alguém completou a Matriz de Autoridade Real. Gargalos identificados e classificados: ${resumo}.` +
      `${decisaoF4.migrar ? ` Decisões que devem migrar: "${decisaoF4.migrar}".` : ""}\n\n` +
      `Escreva um parágrafo curto de fechamento (3-4 frases, no máximo 80 palavras) que amarre isso ` +
      `numa síntese concreta e acolhedora, reforçando que o descompasso entre autoridade formal e ` +
      `real é uma questão estrutural, não uma falha pessoal. Tom direto, sem clichês de autoajuda. ` +
      `Responda só com o texto, sem introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setSintese(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoSintese(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const montarResumo = () => {
    const linhas = [
      "Matriz de Autoridade Real",
      "",
      `Gargalos identificados: ${gargalosPreenchidos.map((g) => `${g} (${classifLabelF4(classificacao[g])})`).join(", ") || "—"}`,
      "",
      sintese ? `Síntese: ${sintese}` : null,
      sintese ? "" : null,
      consolidacaoPreenchida.length > 0
        ? `Descobertas: ${consolidacaoPreenchida.map((c) => c.comportamento).join("; ")}`
        : null,
      consolidacaoPreenchida.length > 0 ? "" : null,
      `Decisões a migrar: ${decisaoF4.migrar || "—"}`,
      `A formalizar: ${decisaoF4.formalizar || "—"}`,
      `Fóruns a criar: ${decisaoF4.foruns || "—"}`,
      "",
      "Plano de ação:",
      planoF4
        .filter((a) => a.acao.trim())
        .map((a, i) => `${i + 1}. ${a.acao} — Responsável: ${a.responsavel || "—"} — Prazo: ${a.prazo || "—"}`)
        .join("\n") || "—",
    ].filter((l) => l !== null);
    return linhas.join("\n");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      notifyConsultor("Nosso resultado — Matriz de Autoridade Real", montarResumo());
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stepWrap}>
      <div style={styles.saveStatus}>
        {salvando && <span style={styles.saveStatusText}>Salvando seu resultado…</span>}
        {!salvando && salvo && <span style={styles.saveStatusOk}>✓ Resultado salvo</span>}
        {!salvando && erroSalvar && (
          <span style={styles.saveStatusErr}>Não deu pra salvar automaticamente, use o e-mail abaixo</span>
        )}
      </div>
      <span style={styles.eyebrowSmall}>FECHAMENTO</span>
      <h1 style={styles.h1}>Sua Matriz de Autoridade Real, resumida.</h1>

      <div style={styles.resumoGrid}>
        {gargalosPreenchidos.map((g) => (
          <div key={g} style={styles.resumoCard}>
            <div style={{ ...styles.resumoBar, background: BLUE }} />
            <div style={styles.resumoCardInner}>
              <span style={styles.resumoName}>{g}</span>
              <span style={styles.resumoValue}>{classifLabelF4(classificacao[g])}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.unlockBox}>
        <span style={styles.unlockLabel}>SÍNTESE</span>
        {carregandoSintese ? (
          <p style={styles.unlockHow}>
            <span style={{ opacity: 0.6 }}>Gerando síntese pra sua situação específica…</span>
          </p>
        ) : (
          <>
            <p style={styles.unlockHow}>
              {sintese ||
                "O descompasso entre autoridade formal e real não é falha de ninguém, é o ponto de partida para redesenhar a estrutura com consciência."}
            </p>
            {sintese && <span style={styles.aiTag}>✦ gerado pra sua situação</span>}
          </>
        )}
      </div>

      {consolidacaoPreenchida.length > 0 && (
        <div style={styles.familiaList}>
          {consolidacaoPreenchida.map((c) => (
            <div key={c.id} style={styles.padraoCard}>
              <span style={styles.padraoInterpretacao}>DESCOBERTA</span>
              <span style={styles.papelDescricao}>{c.comportamento}</span>
              <span style={styles.padraoInterpretacao}>IMPACTO</span>
              <span style={styles.papelDescricao}>{c.motivo || "—"}</span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.fechamentoBox}>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>DECISÕES A MIGRAR</span>
          <span style={styles.fechamentoValue}>{decisaoF4.migrar || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>A FORMALIZAR</span>
          <span style={styles.fechamentoValue}>{decisaoF4.formalizar || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>FÓRUNS A CRIAR</span>
          <span style={styles.fechamentoValue}>{decisaoF4.foruns || "—"}</span>
        </div>
      </div>

      <div style={styles.familiaList}>
        {planoF4
          .filter((a) => a.acao.trim())
          .map((a, i) => (
            <div key={a.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              <span style={styles.papelDescricao}>{a.acao}</span>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>RESPONSÁVEL</span>
                <span style={styles.fechamentoValue}>{a.responsavel || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>PRAZO</span>
                <span style={styles.fechamentoValue}>{a.prazo || "—"}</span>
              </div>
            </div>
          ))}
      </div>

      <div style={styles.ctaBox}>
        <p style={styles.ctaTitle}>Agora é executar, com acompanhamento.</p>
        <p style={styles.ctaSub}>
          Vocês mapearam quem decide de verdade, compararam com o organograma, identificaram os
          gargalos, refletiram sozinhos, consolidaram em família, decidiram e planejaram. O que
          falta agora é formalizar por escrito e revisitar daqui a alguns meses.
        </p>
      </div>

      <p style={{ ...styles.papelDescricao, marginTop: 4 }} className="no-print">
        Um resumo desse resultado já foi enviado automaticamente pro consultor.
      </p>
      <div style={styles.finalButtonsRow} className="no-print">
        <button onClick={() => window.print()} style={styles.ctaButton}>
          🖨️ Baixar / imprimir PDF
        </button>
        <button onClick={onReiniciar} style={styles.restartButton}>
          ↺ Voltar ao início
        </button>
      </div>
    </div>
  );
}

const STEP_F5_GERACAO = 0;
const STEP_F5_AUTOAVALIACAO = 1;
const STEP_F5_AVALIACAO_OUTRA = 2;
const STEP_F5_COMPARACAO = 3;
const STEP_F5_EXPECTATIVAS = 4;
const STEP_F5_REFLEXAO = 5;
const STEP_F5_CONSOLIDACAO = 6;
const STEP_F5_DECISAO = 7;
const STEP_F5_PLANO = 8;
const STEP_F5_FECHAMENTO = 9;

function initNotasF5() {
  return ASPECTOS_F5.reduce((acc, a) => {
    acc[a] = null;
    return acc;
  }, {});
}

const ANTONIO_EXEMPLO_F5 = {
  geracao: "atual",
  notasPropria: {
    Confiança: 8,
    Comunicação: 6,
    Liderança: 7,
    Autonomia: 5,
    "Capacidade de Delegar": 4,
    "Visão de Futuro": 8,
  },
  notasOutra: {
    Confiança: 4,
    Comunicação: 5,
    Liderança: 6,
    Autonomia: 3,
    "Capacidade de Delegar": 3,
    "Visão de Futuro": 6,
  },
  expectativas: [
    {
      id: 1,
      comportamento: "Mais paciência para aprender os detalhes do negócio antes de propor mudanças.",
      motivo: "Alguns processos só fazem sentido depois de vividos na prática.",
    },
  ],
  reflexaoF5: {
    surpresa: "Achei que ela sentia mais confiança da minha parte do que realmente sente.",
    aprendizado: "Ela não vê minha hesitação em delegar como falta de confiança, e sim como medo de errar.",
    expectativaNuncaDita: "Eu nunca disse claramente que espero que ela pergunte mais antes de agir sozinha.",
    mudarEu: "Vou parar de esperar que ela adivinhe o que eu quero e começar a falar diretamente.",
  },
  consolidacaoF5: [
    {
      id: 1,
      comportamento: "Nenhum dos dois havia verbalizado a expectativa de confiança um pro outro.",
      motivo: "Vamos criar reuniões mensais só para alinhar expectativas, separadas do operacional.",
    },
  ],
  decisaoF5: {
    atualDesenvolver: "Delegar por escrito três decisões que hoje ainda dependem da minha aprovação.",
    proximaDesenvolver: "Perguntar antes de agir sozinha em decisões acima de um valor combinado.",
    compromissos: "Reunião mensal de alinhamento, sem falar de operação — só de expectativas.",
  },
  planoF5: [
    {
      id: 1,
      acao: "Marcar a primeira reunião mensal de alinhamento entre nós dois.",
      responsavel: "Eu",
      prazo: "15 dias",
      indicador: "Reunião realizada, com pauta registrada",
    },
    {
      id: 2,
      acao: "Formalizar por escrito as três decisões que passam a ser dela.",
      responsavel: "Eu e ela",
      prazo: "45 dias",
      indicador: "Documento assinado pelos dois",
    },
  ],
};

const MARINA_EXEMPLO_F5 = {
  geracao: "proxima",
  notasPropria: {
    Confiança: 6,
    Comunicação: 7,
    Liderança: 6,
    Autonomia: 6,
    "Capacidade de Delegar": 5,
    "Visão de Futuro": 8,
  },
  notasOutra: {
    Confiança: 5,
    Comunicação: 5,
    Liderança: 8,
    Autonomia: 3,
    "Capacidade de Delegar": 3,
    "Visão de Futuro": 5,
  },
  expectativas: [
    {
      id: 1,
      comportamento: "Que ele confie decisões operacionais a mim sem precisar aprovar tudo antes.",
      motivo: "Enquanto tudo passa por ele, eu não desenvolvo segurança pra decidir sozinha.",
    },
    {
      id: 2,
      comportamento: "Que ele ouça minhas ideias novas sem achar que estou querendo mudar tudo de uma vez.",
      motivo: "Eu quero continuar o que ele construiu, só atualizando o que já não funciona mais.",
    },
  ],
  reflexaoF5: {
    surpresa: "Eu achava que ele confiava mais em mim do que a nota dele mostrou.",
    aprendizado: "Ele não segura as decisões por controle, ele segura porque tem medo de eu errar sozinha e a empresa sofrer.",
    expectativaNuncaDita: "Eu nunca disse claramente que quero autonomia real, não só ouvir 'pode fazer' e depois ser questionada.",
    mudarEu: "Vou parar de esperar ele notar que estou pronta e vou pedir a autonomia diretamente.",
  },
  consolidacaoF5: [
    {
      id: 1,
      comportamento: "Eu interpreto as perguntas dele como desconfiança, e ele interpreta como cuidado.",
      motivo: "Vamos combinar um limite de valor claro, pra ele parar de perguntar dentro desse limite.",
    },
  ],
  decisaoF5: {
    atualDesenvolver: "Ele precisa soltar as aprovações de rotina, mesmo sentindo desconforto no início.",
    proximaDesenvolver: "Eu preciso avisar antes de agir em decisões grandes, não só depois.",
    compromissos: "Reunião mensal de alinhamento, só de expectativas, sem falar de operação do dia a dia.",
  },
  planoF5: [
    {
      id: 1,
      acao: "Propor a ele o valor-limite pra aprovações que passam a ser só minhas.",
      responsavel: "Marina",
      prazo: "15 dias",
      indicador: "Valor definido e registrado por escrito",
    },
    {
      id: 2,
      acao: "Testar um mês decidindo sozinha dentro desse limite, e revisar juntos como foi.",
      responsavel: "Marina e o pai",
      prazo: "45 dias",
      indicador: "Reunião de revisão realizada, com ajustes se necessário",
    },
  ],
};

function Ferramenta5App({ onVoltarCatalogo, envioIdInicial }) {
  const [step, setStep] = useState(STEP_F5_GERACAO);
  const [geracao, setGeracao] = useState(null);
  const [notasPropria, setNotasPropria] = useState(initNotasF5());
  const [notasOutra, setNotasOutra] = useState(initNotasF5());
  const [expectativas, setExpectativas] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [reflexaoF5, setReflexaoF5] = useState({
    surpresa: "",
    aprendizado: "",
    expectativaNuncaDita: "",
    mudarEu: "",
  });
  const [consolidacaoF5, setConsolidacaoF5] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [decisaoF5, setDecisaoF5] = useState({ atualDesenvolver: "", proximaDesenvolver: "", compromissos: "" });
  const [planoF5, setPlanoF5] = useState([{ id: 1, acao: "", responsavel: "", prazo: "", indicador: "" }]);

  const diferencas = useMemo(
    () =>
      ASPECTOS_F5.map((a) => ({
        aspecto: a,
        propria: notasPropria[a],
        outra: notasOutra[a],
        diff: notasPropria[a] !== null && notasOutra[a] !== null ? notasPropria[a] - notasOutra[a] : null,
      })),
    [notasPropria, notasOutra]
  );

  const outroLabel = geracao === "atual" ? "a próxima geração" : "a geração atual";
  const proprioLabel = geracao === "atual" ? "a geração atual" : "a próxima geração";

  const carregarExemploF5 = (exemplo) => {
    setGeracao(exemplo.geracao);
    setNotasPropria(exemplo.notasPropria);
    setNotasOutra(exemplo.notasOutra);
    setExpectativas(exemplo.expectativas);
    setReflexaoF5(exemplo.reflexaoF5);
    setConsolidacaoF5(exemplo.consolidacaoF5);
    setDecisaoF5(exemplo.decisaoF5);
    setPlanoF5(exemplo.planoF5);
    setStep(STEP_F5_COMPARACAO);
  };

  const canAdvance = () => {
    if (step === STEP_F5_GERACAO) return geracao !== null;
    if (step === STEP_F5_AUTOAVALIACAO) return ASPECTOS_F5.every((a) => notasPropria[a] !== null);
    if (step === STEP_F5_AVALIACAO_OUTRA) return ASPECTOS_F5.every((a) => notasOutra[a] !== null);
    if (step === STEP_F5_COMPARACAO) return true;
    if (step === STEP_F5_EXPECTATIVAS) {
      return expectativas.some((e) => e.comportamento.trim() && e.motivo.trim());
    }
    if (step === STEP_F5_REFLEXAO) {
      return (
        reflexaoF5.surpresa.trim().length > 3 &&
        reflexaoF5.aprendizado.trim().length > 3 &&
        reflexaoF5.expectativaNuncaDita.trim().length > 3 &&
        reflexaoF5.mudarEu.trim().length > 3
      );
    }
    if (step === STEP_F5_CONSOLIDACAO) {
      return consolidacaoF5.some((c) => c.comportamento.trim() && c.motivo.trim());
    }
    if (step === STEP_F5_DECISAO) {
      return (
        decisaoF5.atualDesenvolver.trim().length > 3 &&
        decisaoF5.proximaDesenvolver.trim().length > 3 &&
        decisaoF5.compromissos.trim().length > 3
      );
    }
    if (step === STEP_F5_PLANO) {
      return planoF5.some(
        (a) => a.acao.trim().length > 3 && a.responsavel.trim().length > 0 && a.prazo.trim().length > 0
      );
    }
    return true;
  };

  const goNext = () => setStep((s) => Math.min(STEP_F5_FECHAMENTO, s + 1));
  const goBack = () => setStep((s) => Math.max(STEP_F5_GERACAO, s - 1));

  return (
    <>
      <Header5 step={step} onVoltarCatalogo={onVoltarCatalogo} />
      <div style={styles.body}>
        {step === STEP_F5_GERACAO && (
          <StepGeracao
            geracao={geracao}
            setGeracao={setGeracao}
            onCarregarExemploAtual={() => carregarExemploF5(ANTONIO_EXEMPLO_F5)}
            onCarregarExemploProxima={() => carregarExemploF5(MARINA_EXEMPLO_F5)}
          />
        )}
        {step === STEP_F5_AUTOAVALIACAO && (
          <StepAvaliacaoF5
            titulo="Avalie sua própria geração"
            passo="PASSO 2 DE 9 · AUTOAVALIAÇÃO"
            pergunta={`De 0 a 10, como você avalia ${proprioLabel} em cada aspecto?`}
            explicacao="Pontue com honestidade, mesmo sabendo que a outra geração pode ler isso depois."
            notas={notasPropria}
            setNotas={setNotasPropria}
          />
        )}
        {step === STEP_F5_AVALIACAO_OUTRA && (
          <StepAvaliacaoF5
            titulo="Agora avalie a outra geração"
            passo="PASSO 3 DE 9 · AVALIAÇÃO DA OUTRA GERAÇÃO"
            pergunta={`De 0 a 10, como você avalia ${outroLabel} nos mesmos aspectos?`}
            explicacao="Isso não é para acertar a nota que ela daria a si mesma, é a sua percepção sincera."
            notas={notasOutra}
            setNotas={setNotasOutra}
          />
        )}
        {step === STEP_F5_COMPARACAO && (
          <StepComparacaoF5 diferencas={diferencas} geracao={geracao} proprioLabel={proprioLabel} outroLabel={outroLabel} />
        )}
        {step === STEP_F5_EXPECTATIVAS && (
          <StepExpectativasF5
            expectativas={expectativas}
            setExpectativas={setExpectativas}
            outroLabel={outroLabel}
          />
        )}
        {step === STEP_F5_REFLEXAO && (
          <StepReflexaoF5 reflexaoF5={reflexaoF5} setReflexaoF5={setReflexaoF5} diferencas={diferencas} />
        )}
        {step === STEP_F5_CONSOLIDACAO && (
          <StepConsolidacaoF5
            consolidacaoF5={consolidacaoF5}
            setConsolidacaoF5={setConsolidacaoF5}
            diferencas={diferencas}
          />
        )}
        {step === STEP_F5_DECISAO && <StepDecisaoF5 decisaoF5={decisaoF5} setDecisaoF5={setDecisaoF5} />}
        {step === STEP_F5_PLANO && (
          <StepPlanoF5 planoF5={planoF5} setPlanoF5={setPlanoF5} decisaoF5={decisaoF5} diferencas={diferencas} />
        )}
        {step === STEP_F5_FECHAMENTO && (
          <StepFechamentoF5
            geracao={geracao}
            diferencas={diferencas}
            expectativas={expectativas}
            reflexaoF5={reflexaoF5}
            consolidacaoF5={consolidacaoF5}
            decisaoF5={decisaoF5}
            planoF5={planoF5}
            onReiniciar={onVoltarCatalogo}
            envioId={envioIdInicial}
          />
        )}
      </div>
      {step < STEP_F5_FECHAMENTO && (
        <Footer
          step={step}
          canAdvance={canAdvance()}
          isLastQuadrante={false}
          isDesempate={false}
          isPenultimate={step === STEP_F5_PLANO}
          onBack={goBack}
          onNext={goNext}
        />
      )}
    </>
  );
}

function Header5({ step, onVoltarCatalogo }) {
  const labels = [
    "Qual geração você é",
    "Autoavaliação",
    "Avaliação da outra geração",
    "Comparação",
    "Expectativas",
    "Reflexão individual",
    "Consolidação familiar",
    "Decisão",
    "Plano de ação",
    "Fechamento",
  ];
  const progress = Math.round((step / STEP_F5_FECHAMENTO) * 100);
  return (
    <div style={styles.header} className="no-print">
      <div style={styles.headerTop}>
        <button onClick={onVoltarCatalogo} style={styles.backToCatalogo}>
          ← Catálogo
        </button>
        <span style={styles.stepLabel}>Ponte de Gerações · {labels[step]}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

function StepGeracao({ geracao, setGeracao, onCarregarExemploAtual, onCarregarExemploProxima }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 1 DE 9 · QUAL GERAÇÃO VOCÊ REPRESENTA</span>
      <h1 style={styles.h1}>O que cada geração precisa compreender da outra?</h1>
      <p style={styles.lead}>
        Isso ajusta as perguntas seguintes pro seu lado da ponte. Responda pensando na sua própria
        experiência, mesmo sabendo que a outra geração pode preencher isso também depois.
      </p>

      <div style={styles.demoLinksRow}>
        <button onClick={onCarregarExemploAtual} style={styles.demoLink}>
          ⚡ Exemplo: Antônio (geração atual)
        </button>
        <button onClick={onCarregarExemploProxima} style={styles.demoLink}>
          ⚡ Exemplo: Marina (próxima geração)
        </button>
      </div>

      <div style={styles.roleGrid}>
        {GERACOES_F5.map((g) => (
          <button
            key={g.key}
            onClick={() => setGeracao(g.key)}
            style={{
              ...styles.roleCard,
              borderColor: geracao === g.key ? BLUE : "#E4EAF0",
              background: geracao === g.key ? "#EAF2FB" : "#fff",
            }}
          >
            <span style={styles.roleLabel}>{g.label}</span>
            <span style={styles.roleDesc}>{g.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepAvaliacaoF5({ titulo, passo, pergunta, explicacao, notas, setNotas }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>{passo}</span>
      <h1 style={styles.h1}>{titulo}</h1>
      <p style={styles.lead}>{pergunta}</p>
      <p style={styles.lead}>
        Use 0 quando o aspecto está praticamente ausente, 5 quando está presente de forma
        moderada, e 10 quando está plenamente presente. {explicacao}
      </p>

      <div style={styles.familiaList}>
        {ASPECTOS_F5.map((a) => (
          <LinhaScore
            key={a}
            label={a}
            valor={notas[a]}
            onChange={(n) => setNotas((prev) => ({ ...prev, [a]: n }))}
            max={10}
          />
        ))}
      </div>
    </div>
  );
}

function StepComparacaoF5({ diferencas, geracao, proprioLabel, outroLabel }) {
  const [insight, setInsight] = useState(null);
  const [gerando, setGerando] = useState(false);

  const maioresGaps = [...diferencas]
    .filter((d) => d.diff !== null)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 2);

  const gerarInsight = () => {
    setGerando(true);
    setInsight(null);
    const resumo = diferencas
      .filter((d) => d.diff !== null)
      .map((d) => `${d.aspecto}: nota própria ${d.propria}, percepção da outra geração ${d.outra} (diferença ${Math.abs(d.diff)})`)
      .join("; ");
    const prompt =
      `${LIVRO_CONTEXTO_F5}\n\n` +
      `Alguém que representa ${proprioLabel} comparou suas notas com sua percepção sobre ${outroLabel}: ${resumo}.\n\n` +
      `Escreva um parágrafo curto (3-4 frases, no máximo 80 palavras) apontando qual aspecto parece ` +
      `ter o gap mais relevante e o que isso costuma significar pra uma conversa entre gerações, ` +
      `inspirando-se, sem citar nomes, no padrão de algum dos três casos reais do método. Tom ` +
      `direto, acolhedor, sem clichês. Responda só com o texto, sem introdução, em português do ` +
      `Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => setInsight(texto))
      .catch(() => setInsight("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 4 DE 9 · COMPARAÇÃO</span>
      <h1 style={styles.h1}>Onde a percepção se encontra, e onde ela se afasta.</h1>
      <p style={styles.lead}>
        Em cada linha abaixo, a primeira nota é a que você deu para {proprioLabel.toLowerCase()}{" "}
        (a sua própria), e a segunda é a nota que você deu, na sua percepção, para{" "}
        {outroLabel.toLowerCase()}. A diferença entre as duas é o que importa observar.
      </p>
      <p style={styles.lead}>
        O objetivo não é descobrir quem está certo, é enxergar onde as duas percepções se
        distanciam. Até 2 pontos de diferença é alinhamento; 3 a 4 vale conversa estruturada;
        acima de 4 é desalinhamento relevante — veja o guia abaixo de cada aspecto.
      </p>

      <div style={styles.familiaList}>
        {diferencas.map((d) => {
          const interp = d.diff !== null ? interpretaDiferencaF5(d.diff) : null;
          return (
            <div key={d.aspecto} style={styles.padraoCard}>
              <span style={styles.papelNome}>{d.aspecto}</span>
              <div style={styles.envioButtonsRow}>
                <span style={styles.papelDescricao}>
                  Nota que dei pra {proprioLabel.replace(/^a /i, "").toLowerCase()}:{" "}
                  <strong>{d.propria ?? "—"}</strong>
                </span>
                <span style={styles.papelDescricao}>
                  Nota que dei pra {outroLabel.replace(/^a /i, "").toLowerCase()}:{" "}
                  <strong>{d.outra ?? "—"}</strong>
                </span>
              </div>
              {interp && (
                <span style={{ ...styles.padraoInterpretacao, color: corSemaforoF5(d.diff) }}>
                  Diferença de {Math.abs(d.diff)} ponto{Math.abs(d.diff) === 1 ? "" : "s"} —{" "}
                  <strong>{interp.label}</strong>: {interp.texto}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {maioresGaps.length > 0 && (
        <>
          {!insight && (
            <button onClick={gerarInsight} disabled={gerando} style={styles.demoLink}>
              {gerando ? "Gerando leitura…" : "✦ O que esses gaps podem significar"}
            </button>
          )}
          {insight && (
            <div style={styles.unlockBox}>
              <span style={styles.unlockLabel}>LEITURA DA COMPARAÇÃO</span>
              <p style={styles.unlockHow}>{insight}</p>
              <span style={styles.aiTag}>✦ gerado pra sua situação</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StepExpectativasF5({ expectativas, setExpectativas, outroLabel }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 5 DE 9 · EXPECTATIVAS</span>
      <h1 style={styles.h1}>O que você espera d{outroLabel}, e por quê?</h1>
      <p style={styles.lead}>
        Nomear a expectativa é o primeiro passo pra ela deixar de ser uma cobrança silenciosa e
        virar um ponto de partida pra negociação.
      </p>

      <TabelaComportamentos
        titulo="Minhas expectativas"
        linhas={expectativas}
        setLinhas={setExpectativas}
        labelComportamento="O QUE ESPERO"
        labelMotivo="POR QUE ISSO IMPORTA"
        placeholderComportamento="Ex.: mais paciência para aprender os detalhes do negócio"
        placeholderMotivo="Ex.: alguns processos só fazem sentido depois de vividos na prática"
      />
    </div>
  );
}

function StepReflexaoF5({ reflexaoF5, setReflexaoF5, diferencas }) {
  const set = (field) => (e) => setReflexaoF5((r) => ({ ...r, [field]: e.target.value }));
  const maiorGap = [...diferencas].filter((d) => d.diff !== null).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];
  const contexto = maiorGap ? `maior diferença de percepção em "${maiorGap.aspecto}"` : "comparação entre gerações";

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 6 DE 9 · REFLEXÃO INDIVIDUAL</span>
      <h1 style={styles.h1}>Sozinho, depois de ver a comparação.</h1>
      <p style={styles.lead}>
        Ninguém além de você vai ler isso agora. Escreva o que for verdade, não o que soa bem de
        dizer em família.
      </p>

      <CampoReflexao
        pergunta="O que mais me surpreendeu?"
        valor={reflexaoF5.surpresa}
        onChange={set("surpresa")}
        placeholder="A descoberta mais inesperada ao comparar sua percepção com a da outra geração…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F5}
      />
      <CampoReflexao
        pergunta="O que aprendi sobre a outra geração?"
        valor={reflexaoF5.aprendizado}
        onChange={set("aprendizado")}
        placeholder="Um entendimento novo sobre como a outra geração pensa ou sente…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F5}
      />
      <CampoReflexao
        pergunta="Qual expectativa nunca havia sido explicitada?"
        valor={reflexaoF5.expectativaNuncaDita}
        onChange={set("expectativaNuncaDita")}
        placeholder="Algo que você (ou a outra geração) sempre esperou, mas nunca disse em voz alta…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F5}
      />
      <CampoReflexao
        pergunta="O que preciso fazer diferente?"
        valor={reflexaoF5.mudarEu}
        onChange={set("mudarEu")}
        placeholder="Uma mudança concreta de comportamento que depende só de você…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F5}
      />
    </div>
  );
}

function StepConsolidacaoF5({ consolidacaoF5, setConsolidacaoF5, diferencas }) {
  const [script, setScript] = useState(null);
  const [gerando, setGerando] = useState(false);

  const prepararConversa = () => {
    setGerando(true);
    setScript(null);
    const maiorGap = [...diferencas].filter((d) => d.diff !== null).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];
    const prompt =
      `${LIVRO_CONTEXTO_F5}\n\n` +
      `Você ajuda alguém que usou a Ponte de Gerações a se preparar para a Consolidação Familiar. ` +
      `${maiorGap ? `O aspecto com maior diferença de percepção foi "${maiorGap.aspecto}" (diferença de ${Math.abs(maiorGap.diff)} pontos).` : ""}\n\n` +
      `Sugira 2-3 frases curtas de abertura pra essa pessoa começar essa conversa com a outra ` +
      `geração, deixando claro que o objetivo não é descobrir quem está certo, é entender as duas ` +
      `percepções. Formate como lista curta. Responda só com as frases, sem introdução, em ` +
      `português do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => setScript(texto))
      .catch(() => setScript("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 7 DE 9 · CONSOLIDAÇÃO FAMILIAR</span>
      <h1 style={styles.h1}>Reúnam-se e compartilhem as descobertas.</h1>
      <p style={styles.lead}>
        Registrem como cada descoberta muda a forma como vocês pretendem se relacionar daqui pra
        frente.
      </p>

      {!script && (
        <button onClick={prepararConversa} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando sugestão…" : "✦ Preciso de ajuda para começar a conversa"}
        </button>
      )}
      {script && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ sugestão gerada pra sua situação</span>
          <p style={styles.scriptText}>{script}</p>
        </div>
      )}

      <TabelaComportamentos
        titulo="Descobertas e impactos"
        linhas={consolidacaoF5}
        setLinhas={setConsolidacaoF5}
        labelComportamento="DESCOBERTA"
        labelMotivo="IMPACTO"
        placeholderComportamento="Ex.: nenhum dos dois havia verbalizado a expectativa de confiança"
        placeholderMotivo="Ex.: vamos criar reuniões mensais só pra alinhar expectativas"
      />
    </div>
  );
}

function StepDecisaoF5({ decisaoF5, setDecisaoF5 }) {
  const set = (field) => (e) => setDecisaoF5((d) => ({ ...d, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 8 DE 9 · DECISÃO</span>
      <h1 style={styles.h1}>Feche o processo respondendo, como família.</h1>
      <p style={styles.lead}>
        Com a comparação e as expectativas na mesa, é hora de decidir o que cada geração leva
        como compromisso — não é uma cobrança de um lado só.
      </p>

      <label style={styles.fieldLabel}>Quais comportamentos a geração atual precisa desenvolver?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF5.atualDesenvolver}
        onChange={set("atualDesenvolver")}
        placeholder="Mudanças concretas esperadas de quem ainda está à frente da liderança…"
      />
      <label style={styles.fieldLabel}>Quais comportamentos a próxima geração precisa desenvolver?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF5.proximaDesenvolver}
        onChange={set("proximaDesenvolver")}
        placeholder="Mudanças concretas esperadas de quem está assumindo a liderança…"
      />
      <label style={styles.fieldLabel}>Quais compromissos serão assumidos por ambas as gerações?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF5.compromissos}
        onChange={set("compromissos")}
        placeholder="Acordos mútuos, não unilaterais, que as duas gerações se comprometem a cumprir…"
      />
    </div>
  );
}

function StepPlanoF5({ planoF5, setPlanoF5, decisaoF5, diferencas }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  const addAcao = () =>
    setPlanoF5((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, acao: "", responsavel: "", prazo: "", indicador: "" },
    ]);
  const removeAcao = (id) => setPlanoF5((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setPlanoF5((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirAcoes = () => {
    setGerando(true);
    setErro(false);
    const maiorGap = [...diferencas].filter((d) => d.diff !== null).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];
    const prompt =
      `${LIVRO_CONTEXTO_F5}\n\n` +
      `Você ajuda alguém que já percorreu a Ponte de Gerações a transformar os compromissos em um ` +
      `plano de ação. Contexto:\n` +
      `${maiorGap ? `- Maior gap de percepção: "${maiorGap.aspecto}" (diferença de ${Math.abs(maiorGap.diff)})\n` : ""}` +
      `${decisaoF5.compromissos ? `- Compromissos mútuos combinados: "${decisaoF5.compromissos}"\n` : ""}\n` +
      `Sugira 2-3 ações em sequência cronológica, cada uma no infinitivo, com responsável, prazo e ` +
      `um indicador de sucesso (como saber se o compromisso está sendo cumprido). Lembre que isso ` +
      `ainda precisa ser negociado entre as gerações.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"acao":"","responsavel":"","prazo":"","indicador":""},` +
      `{"acao":"","responsavel":"","prazo":"","indicador":""}]`;

    callClaude(prompt, 450)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlanoF5(
            parsed.map((a, i) => ({
              id: i + 1,
              acao: a.acao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
              indicador: a.indicador || "",
            }))
          );
        }
      })
      .catch(() => setErro(true))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 9 DE 9 · PLANO DE AÇÃO</span>
      <h1 style={styles.h1}>Transforme os compromissos em ações, com um jeito de medir.</h1>
      <p style={styles.lead}>
        Além de ação, responsável e prazo, cada linha tem um indicador de sucesso — como vocês vão
        saber que o compromisso está sendo cumprido de verdade.
      </p>

      <button onClick={sugerirAcoes} disabled={gerando} style={styles.demoLink}>
        {gerando ? "Gerando sugestões…" : "✦ Sugerir ações com indicadores"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {planoF5.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              {planoF5.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.acao}
              onChange={(e) => setAcao(a.id, "acao", e.target.value)}
              placeholder="Ex.: reuniões mensais de alinhamento entre pai e filho…"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: início em 15 dias"
                />
              </div>
            </div>
            <label style={styles.fieldLabel}>Indicador de sucesso</label>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={a.indicador}
              onChange={(e) => setAcao(a.id, "indicador", e.target.value)}
              placeholder="Ex.: reunião realizada todo mês, sem faltas"
            />
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra ação
      </button>
    </div>
  );
}

function StepFechamentoF5({
  geracao,
  diferencas,
  expectativas,
  reflexaoF5,
  consolidacaoF5,
  decisaoF5,
  planoF5,
  onReiniciar,
  envioId,
}) {
  const [salvando, setSalvando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);
  const [sintese, setSintese] = useState(null);
  const [carregandoSintese, setCarregandoSintese] = useState(false);

  const expectativasPreenchidas = expectativas.filter((e) => e.comportamento.trim());
  const consolidacaoPreenchida = consolidacaoF5.filter((c) => c.comportamento.trim());
  const gapsRelevantes = diferencas.filter((d) => d.diff !== null && Math.abs(d.diff) > 2);

  useEffect(() => {
    let cancelado = false;
    setSalvando(true);
    setErroSalvar(false);

    supabaseInsert("respostas", {
      envio_id: envioId || null,
      ferramenta_numero: 5,
      papel: geracao,
      notas: diferencas.reduce((acc, d) => {
        acc[d.aspecto] = { propria: d.propria, outra: d.outra, diff: d.diff };
        return acc;
      }, {}),
      conflito: { gaps: gapsRelevantes },
      reflexao: reflexaoF5,
      consolidacao: { expectativas: expectativasPreenchidas, descobertas: consolidacaoPreenchida },
      decisao_final: decisaoF5,
      plano_acao: planoF5,
    })
      .then(() => {
        if (!cancelado) setSalvo(true);
      })
      .catch(() => {
        if (!cancelado) setErroSalvar(true);
      })
      .finally(() => {
        if (!cancelado) setSalvando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelado = false;
    if (gapsRelevantes.length === 0) return;
    setCarregandoSintese(true);
    const resumo = gapsRelevantes.map((d) => `${d.aspecto} (diferença de ${Math.abs(d.diff)})`).join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F5}\n\n` +
      `Alguém completou a Ponte de Gerações. Os aspectos com maior diferença de percepção foram: ` +
      `${resumo}.${decisaoF5.compromissos ? ` Compromissos combinados: "${decisaoF5.compromissos}".` : ""}\n\n` +
      `Escreva um parágrafo curto de fechamento (3-4 frases, no máximo 80 palavras) que amarre isso ` +
      `numa síntese concreta e acolhedora, reforçando que o objetivo nunca foi descobrir quem está ` +
      `certo, foi entender as duas percepções. Tom direto, sem clichês de autoajuda. Responda só ` +
      `com o texto, sem introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setSintese(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoSintese(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const montarResumo = () => {
    const linhas = [
      "Ponte de Gerações",
      "",
      `Aspectos com maior diferença: ${gapsRelevantes.map((d) => `${d.aspecto} (${Math.abs(d.diff)})`).join(", ") || "—"}`,
      "",
      sintese ? `Síntese: ${sintese}` : null,
      sintese ? "" : null,
      `Comportamento a desenvolver (geração atual): ${decisaoF5.atualDesenvolver || "—"}`,
      `Comportamento a desenvolver (próxima geração): ${decisaoF5.proximaDesenvolver || "—"}`,
      `Compromissos mútuos: ${decisaoF5.compromissos || "—"}`,
      "",
      "Plano de ação:",
      planoF5
        .filter((a) => a.acao.trim())
        .map(
          (a, i) =>
            `${i + 1}. ${a.acao} — Responsável: ${a.responsavel || "—"} — Prazo: ${a.prazo || "—"} — Indicador: ${a.indicador || "—"}`
        )
        .join("\n") || "—",
    ].filter((l) => l !== null);
    return linhas.join("\n");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      notifyConsultor("Nosso resultado — Ponte de Gerações", montarResumo());
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stepWrap}>
      <div style={styles.saveStatus}>
        {salvando && <span style={styles.saveStatusText}>Salvando seu resultado…</span>}
        {!salvando && salvo && <span style={styles.saveStatusOk}>✓ Resultado salvo</span>}
        {!salvando && erroSalvar && (
          <span style={styles.saveStatusErr}>Não deu pra salvar automaticamente, use o e-mail abaixo</span>
        )}
      </div>
      <span style={styles.eyebrowSmall}>FECHAMENTO</span>
      <h1 style={styles.h1}>Sua Ponte de Gerações, resumida.</h1>
      <p style={styles.lead}>
        Abaixo estão os aspectos em que sua nota e sua percepção da outra geração mais se
        distanciaram — verde é alinhamento, amarelo vale uma conversa, vermelho é desalinhamento
        que pede atenção.
      </p>

      <div style={styles.resumoGrid}>
        {diferencas
          .filter((d) => d.diff !== null)
          .map((d) => {
            const interp = interpretaDiferencaF5(d.diff);
            return (
              <div key={d.aspecto} style={styles.resumoCard}>
                <div
                  style={{
                    ...styles.resumoBar,
                    background: corSemaforoF5(d.diff),
                  }}
                />
                <div style={styles.resumoCardInner}>
                  <span style={styles.resumoName}>{d.aspecto}</span>
                  <span style={styles.resumoValue}>diferença {Math.abs(d.diff)}</span>
                  <span style={styles.resumoScore}>{interp.label}</span>
                </div>
              </div>
            );
          })}
      </div>

      <div style={styles.unlockBox}>
        <span style={styles.unlockLabel}>SÍNTESE</span>
        {carregandoSintese ? (
          <p style={styles.unlockHow}>
            <span style={{ opacity: 0.6 }}>Gerando síntese pra sua situação específica…</span>
          </p>
        ) : (
          <>
            <p style={styles.unlockHow}>
              {sintese ||
                "O objetivo nunca foi descobrir quem está certo, foi entender como cada geração enxerga a mesma realidade — e a partir daí, construir pontes, não vencedores."}
            </p>
            {sintese && <span style={styles.aiTag}>✦ gerado pra sua situação</span>}
          </>
        )}
      </div>

      <p style={{ ...styles.papelNome, marginTop: 8 }}>O que cada geração leva como compromisso</p>
      <div style={styles.fechamentoBox}>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>GERAÇÃO ATUAL DESENVOLVE</span>
          <span style={styles.fechamentoValue}>{decisaoF5.atualDesenvolver || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>PRÓXIMA GERAÇÃO DESENVOLVE</span>
          <span style={styles.fechamentoValue}>{decisaoF5.proximaDesenvolver || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>COMPROMISSOS MÚTUOS</span>
          <span style={styles.fechamentoValue}>{decisaoF5.compromissos || "—"}</span>
        </div>
      </div>

      <p style={{ ...styles.papelNome, marginTop: 8 }}>Plano de ação combinado</p>
      <div style={styles.familiaList}>
        {planoF5
          .filter((a) => a.acao.trim())
          .map((a, i) => (
            <div key={a.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              <span style={styles.papelDescricao}>{a.acao}</span>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>RESPONSÁVEL</span>
                <span style={styles.fechamentoValue}>{a.responsavel || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>PRAZO</span>
                <span style={styles.fechamentoValue}>{a.prazo || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>INDICADOR DE SUCESSO</span>
                <span style={styles.fechamentoValue}>{a.indicador || "—"}</span>
              </div>
            </div>
          ))}
      </div>

      <div style={styles.ctaBox}>
        <p style={styles.ctaTitle}>Agora é executar, com acompanhamento.</p>
        <p style={styles.ctaSub}>
          Vocês compararam percepções, nomearam expectativas, refletiram sozinhos, consolidaram em
          família, decidiram e planejaram. O que falta agora é colocar em prática, e revisitar a
          Ponte daqui a alguns meses pra ver se a distância diminuiu.
        </p>
      </div>

      <p style={{ ...styles.papelDescricao, marginTop: 4 }} className="no-print">
        Um resumo desse resultado já foi enviado automaticamente pro consultor.
      </p>
      <div style={styles.finalButtonsRow} className="no-print">
        <button onClick={() => window.print()} style={styles.ctaButton}>
          🖨️ Baixar / imprimir PDF
        </button>
        <button onClick={onReiniciar} style={styles.restartButton}>
          ↺ Voltar ao início
        </button>
      </div>
    </div>
  );
}

const STEP_F6_AVALIACAO = 0;
const STEP_F6_RESULTADO = 1;
const STEP_F6_MAPA = 2;
const STEP_F6_REFLEXAO = 3;
const STEP_F6_CONSOLIDACAO = 4;
const STEP_F6_DECISAO = 5;
const STEP_F6_PLANO = 6;
const STEP_F6_FECHAMENTO = 7;

function initNotasICS() {
  return DIMENSOES_ICS.reduce((acc, d) => {
    acc[d.key] = null;
    return acc;
  }, {});
}

function initMapaEvolucao() {
  return DIMENSOES_ICS.reduce((acc, d) => {
    acc[d.key] = { notaDesejada: null, acao: "" };
    return acc;
  }, {});
}

const OLIVEIRA_EXEMPLO_F6 = {
  notasICS: {
    Competência: 88,
    Valores: 92,
    Liderança: 70,
    Autonomia: 54,
    "Responsabilidade Patrimonial": 58,
  },
  mapaEvolucao: {
    Competência: { notaDesejada: 90, acao: "Manter, já é ponto forte." },
    Valores: { notaDesejada: 95, acao: "Manter e reforçar em conversas com a diretoria." },
    Liderança: { notaDesejada: 80, acao: "Assumir a condução de duas reuniões estratégicas por trimestre." },
    Autonomia: { notaDesejada: 70, acao: "Incluir Rafael em 3 decisões operacionais autônomas por trimestre." },
    "Responsabilidade Patrimonial": {
      notaDesejada: 75,
      acao: "Incluir Rafael em 2 fóruns patrimoniais por trimestre.",
    },
  },
  reflexaoF6: {
    maiorNota: "Valores — Rafael já demonstra estar plenamente alinhado com os princípios da família.",
    menorNota: "Autonomia — ele ainda espera aprovação em decisões que já poderia tomar sozinho.",
    fortalece: "O fato de Rafael nunca ter escondido uma dificuldade técnica, sempre pediu ajuda quando precisou.",
    limita: "Eu (o fundador) ainda respondo perguntas que ele já sabe responder, só pra me sentir útil.",
  },
  consolidacaoF6: [
    {
      id: 1,
      comportamento: "A autonomia está mais baixa do que todos imaginavam antes de ver o número.",
      motivo: "Vamos criar decisões de teste com autonomia real, sem aprovação prévia do meu pai.",
    },
  ],
  decisaoF6: {
    transferirAgora: "As decisões técnicas do dia a dia, onde Competência e Valores já são altos.",
    exigemPreparo: "Decisões patrimoniais maiores e representação da empresa em fóruns externos.",
    competenciasDesenvolver: "Tomada de decisão autônoma e leitura de contratos patrimoniais.",
  },
  planoF6: [
    {
      id: 1,
      prioridade: "1",
      acao: "Incluir Rafael em 2 fóruns patrimoniais por trimestre.",
      responsavel: "Sr. Carlos",
      prazo: "Início em 30 dias",
    },
    {
      id: 2,
      prioridade: "2",
      acao: "Definir 3 decisões operacionais que passam a ser autônomas de Rafael.",
      responsavel: "Sr. Carlos e Rafael",
      prazo: "60 dias",
    },
  ],
};

function Ferramenta6App({ onVoltarCatalogo, envioIdInicial }) {
  const [step, setStep] = useState(STEP_F6_AVALIACAO);
  const [nomeSucessor, setNomeSucessor] = useState("");
  const [notasICS, setNotasICS] = useState(initNotasICS());
  const [mapaEvolucao, setMapaEvolucao] = useState(initMapaEvolucao());
  const [reflexaoF6, setReflexaoF6] = useState({
    maiorNota: "",
    menorNota: "",
    fortalece: "",
    limita: "",
  });
  const [consolidacaoF6, setConsolidacaoF6] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [decisaoF6, setDecisaoF6] = useState({
    transferirAgora: "",
    exigemPreparo: "",
    competenciasDesenvolver: "",
  });
  const [planoF6, setPlanoF6] = useState([{ id: 1, prioridade: "1", acao: "", responsavel: "", prazo: "" }]);

  const todasPreenchidas = DIMENSOES_ICS.every((d) => notasICS[d.key] !== null);
  const icsFinal = useMemo(() => {
    if (!todasPreenchidas) return null;
    const soma = DIMENSOES_ICS.reduce((s, d) => s + notasICS[d.key], 0);
    return Math.round(soma / DIMENSOES_ICS.length);
  }, [notasICS, todasPreenchidas]);

  const carregarExemploF6 = () => {
    setNomeSucessor("Rafael");
    setNotasICS(OLIVEIRA_EXEMPLO_F6.notasICS);
    setMapaEvolucao(OLIVEIRA_EXEMPLO_F6.mapaEvolucao);
    setReflexaoF6(OLIVEIRA_EXEMPLO_F6.reflexaoF6);
    setConsolidacaoF6(OLIVEIRA_EXEMPLO_F6.consolidacaoF6);
    setDecisaoF6(OLIVEIRA_EXEMPLO_F6.decisaoF6);
    setPlanoF6(OLIVEIRA_EXEMPLO_F6.planoF6);
    setStep(STEP_F6_RESULTADO);
  };

  const canAdvance = () => {
    if (step === STEP_F6_AVALIACAO) return todasPreenchidas;
    if (step === STEP_F6_RESULTADO) return true;
    if (step === STEP_F6_MAPA) {
      return DIMENSOES_ICS.some((d) => mapaEvolucao[d.key].notaDesejada !== null && mapaEvolucao[d.key].acao.trim());
    }
    if (step === STEP_F6_REFLEXAO) {
      return (
        reflexaoF6.maiorNota.trim().length > 3 &&
        reflexaoF6.menorNota.trim().length > 3 &&
        reflexaoF6.fortalece.trim().length > 3 &&
        reflexaoF6.limita.trim().length > 3
      );
    }
    if (step === STEP_F6_CONSOLIDACAO) {
      return consolidacaoF6.some((c) => c.comportamento.trim() && c.motivo.trim());
    }
    if (step === STEP_F6_DECISAO) {
      return (
        decisaoF6.transferirAgora.trim().length > 3 &&
        decisaoF6.exigemPreparo.trim().length > 3 &&
        decisaoF6.competenciasDesenvolver.trim().length > 3
      );
    }
    if (step === STEP_F6_PLANO) {
      return planoF6.some(
        (a) => a.acao.trim().length > 3 && a.responsavel.trim().length > 0 && a.prazo.trim().length > 0
      );
    }
    return true;
  };

  const goNext = () => setStep((s) => Math.min(STEP_F6_FECHAMENTO, s + 1));
  const goBack = () => setStep((s) => Math.max(STEP_F6_AVALIACAO, s - 1));

  return (
    <>
      <Header6 step={step} onVoltarCatalogo={onVoltarCatalogo} />
      <div style={styles.body}>
        {step === STEP_F6_AVALIACAO && (
          <StepAvaliacaoICS
            nomeSucessor={nomeSucessor}
            setNomeSucessor={setNomeSucessor}
            notasICS={notasICS}
            setNotasICS={setNotasICS}
            onCarregarExemplo={carregarExemploF6}
          />
        )}
        {step === STEP_F6_RESULTADO && (
          <StepResultadoICS nomeSucessor={nomeSucessor} notasICS={notasICS} icsFinal={icsFinal} />
        )}
        {step === STEP_F6_MAPA && (
          <StepMapaEvolucao notasICS={notasICS} mapaEvolucao={mapaEvolucao} setMapaEvolucao={setMapaEvolucao} />
        )}
        {step === STEP_F6_REFLEXAO && (
          <StepReflexaoF6 reflexaoF6={reflexaoF6} setReflexaoF6={setReflexaoF6} icsFinal={icsFinal} />
        )}
        {step === STEP_F6_CONSOLIDACAO && (
          <StepConsolidacaoF6
            consolidacaoF6={consolidacaoF6}
            setConsolidacaoF6={setConsolidacaoF6}
            icsFinal={icsFinal}
          />
        )}
        {step === STEP_F6_DECISAO && <StepDecisaoF6 decisaoF6={decisaoF6} setDecisaoF6={setDecisaoF6} />}
        {step === STEP_F6_PLANO && (
          <StepPlanoF6 planoF6={planoF6} setPlanoF6={setPlanoF6} decisaoF6={decisaoF6} icsFinal={icsFinal} />
        )}
        {step === STEP_F6_FECHAMENTO && (
          <StepFechamentoF6
            nomeSucessor={nomeSucessor}
            notasICS={notasICS}
            icsFinal={icsFinal}
            mapaEvolucao={mapaEvolucao}
            decisaoF6={decisaoF6}
            planoF6={planoF6}
            onReiniciar={onVoltarCatalogo}
            envioId={envioIdInicial}
          />
        )}
      </div>
      {step < STEP_F6_FECHAMENTO && (
        <Footer
          step={step}
          canAdvance={canAdvance()}
          isLastQuadrante={false}
          isDesempate={false}
          isPenultimate={step === STEP_F6_PLANO}
          onBack={goBack}
          onNext={goNext}
        />
      )}
    </>
  );
}

function Header6({ step, onVoltarCatalogo }) {
  const labels = [
    "Avaliação das dimensões",
    "Resultado do ICS",
    "Mapa de evolução",
    "Reflexão individual",
    "Consolidação familiar",
    "Decisão",
    "Plano de desenvolvimento",
    "Fechamento",
  ];
  const progress = Math.round((step / STEP_F6_FECHAMENTO) * 100);
  return (
    <div style={styles.header} className="no-print">
      <div style={styles.headerTop}>
        <button onClick={onVoltarCatalogo} style={styles.backToCatalogo}>
          ← Catálogo
        </button>
        <span style={styles.stepLabel}>Índice de Confiança Sucessória · {labels[step]}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

function StepAvaliacaoICS({ nomeSucessor, setNomeSucessor, notasICS, setNotasICS, onCarregarExemplo }) {
  const preenchidas = DIMENSOES_ICS.filter((d) => notasICS[d.key] !== null);
  const previaICS =
    preenchidas.length > 0
      ? Math.round(preenchidas.reduce((s, d) => s + notasICS[d.key], 0) / preenchidas.length)
      : null;
  const previaClassif = previaICS !== null ? classificaICS(previaICS) : null;

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 1 DE 7 · AVALIAÇÃO DAS DIMENSÕES</span>
      <h1 style={styles.h1}>Quanto realmente confiamos na capacidade do sucessor?</h1>
      <p style={styles.lead}>
        Dê uma nota de 0 a 100 pra cada dimensão, baseada em evidências concretas que você
        observa na prática — não na impressão geral ou no afeto. Idealmente, reúna mais de uma
        pessoa (o sucessor, o fundador, e se possível um observador próximo) antes de preencher.
        Cada dimensão vem com exemplos do que uma nota alta ou baixa parece na prática, pra
        ajudar a calibrar.
      </p>
      <p style={styles.lead}>
        Se houver mais de um candidato à sucessão, rode esta ferramenta uma vez pra cada um,
        identificando o nome abaixo — assim dá pra comparar os resultados depois.
      </p>

      <label style={styles.fieldLabel}>Nome do sucessor avaliado</label>
      <input
        style={{ ...styles.input, flex: "none" }}
        value={nomeSucessor}
        onChange={(e) => setNomeSucessor(e.target.value)}
        placeholder="Ex.: Rafael"
      />

      <div style={styles.demoLinksRow}>
        <button onClick={onCarregarExemplo} style={styles.demoLink}>
          ⚡ Exemplo: Família Oliveira (caso do livro)
        </button>
      </div>

      <div style={styles.familiaList}>
        {DIMENSOES_ICS.map((d) => (
          <SliderScore
            key={d.key}
            label={d.key}
            desc={d.desc}
            exemploAlto={d.exemploAlto}
            exemploBaixo={d.exemploBaixo}
            valor={notasICS[d.key]}
            onChange={(n) => setNotasICS((prev) => ({ ...prev, [d.key]: n }))}
          />
        ))}
      </div>

      {previaICS !== null && (
        <div style={{ ...styles.icsPreviaBox, borderColor: previaClassif.cor }}>
          <span style={styles.papelDescricao}>
            Prévia com {preenchidas.length} de {DIMENSOES_ICS.length} dimensões preenchidas:
          </span>
          <span style={{ ...styles.papelNome, color: previaClassif.cor }}>
            {previaICS} — {previaClassif.label}
          </span>
        </div>
      )}
    </div>
  );
}

function StepResultadoICS({ nomeSucessor, notasICS, icsFinal }) {
  const [insight, setInsight] = useState(null);
  const [gerando, setGerando] = useState(false);
  const classif = icsFinal !== null ? classificaICS(icsFinal) : null;

  const gerarInsight = () => {
    setGerando(true);
    setInsight(null);
    const ranking = [...DIMENSOES_ICS].sort((a, b) => notasICS[b.key] - notasICS[a.key]);
    const maisForte = ranking[0];
    const maisFraca = ranking[ranking.length - 1];
    const resumo = DIMENSOES_ICS.map((d) => `${d.key}: ${notasICS[d.key]}`).join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F6}\n\n` +
      `${nomeSucessor.trim() ? `Sucessor avaliado: ${nomeSucessor.trim()}.` : ""} ICS Final: ${icsFinal} ` +
      `(${classif.label}). Notas completas: ${resumo}.\n` +
      `Dimensão mais forte: ${maisForte.key} (${notasICS[maisForte.key]}).\n` +
      `Dimensão mais fraca: ${maisFraca.key} (${notasICS[maisFraca.key]}).\n\n` +
      `Escreva um parágrafo curto (3-4 frases, no máximo 80 palavras) explicando que a dimensão mais ` +
      `fraca (use exatamente o nome indicado acima) é o que mais puxa o resultado pra baixo hoje, e ` +
      `o que isso costuma significar na prática, inspirando-se, sem citar nomes, no padrão de algum ` +
      `dos três casos reais do método. Tom direto, acolhedor, sem clichês. Responda só com o texto, ` +
      `sem introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => setInsight(texto))
      .catch(() => setInsight("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 2 DE 7 · RESULTADO DO ICS</span>
      <h1 style={styles.h1}>O número que resume a confiança, hoje.</h1>
      <p style={styles.lead}>
        O ICS é a média das cinco dimensões. Faixas: 0-39 Confiança Baixa, 40-59 Moderada, 60-79
        Consistente, 80-100 Elevada. Isso não é um veredito definitivo, é uma fotografia de agora
        — vale reavaliar periodicamente.
      </p>

      {icsFinal !== null && (
        <div style={{ ...styles.unlockBox, borderColor: classif.cor }}>
          <span style={styles.unlockLabel}>ICS FINAL</span>
          <div style={styles.icsPainelRow}>
            <span style={{ ...styles.icsPainelNumero, color: classif.cor }}>{icsFinal}</span>
            <span style={{ ...styles.padraoGuiaNome, color: classif.cor }}>{classif.label}</span>
          </div>
        </div>
      )}

      <div style={styles.familiaList}>
        {DIMENSOES_ICS.map((d) => {
          const faixaDim = classificaICS(notasICS[d.key]);
          return (
            <div key={d.key} style={styles.padraoCard}>
              <div style={styles.timelineTopRow}>
                <span style={styles.papelNome}>{d.key}</span>
                <span style={styles.papelNome}>{notasICS[d.key]}</span>
              </div>
              <div style={styles.icsBarTrack}>
                <div
                  style={{
                    ...styles.icsBarFill,
                    width: `${notasICS[d.key]}%`,
                    background: faixaDim.cor,
                  }}
                />
              </div>
              <span style={{ ...styles.padraoInterpretacao, color: faixaDim.cor }}>{faixaDim.label}</span>
            </div>
          );
        })}
      </div>

      {!insight && (
        <button onClick={gerarInsight} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando leitura…" : "✦ O que esse resultado pode significar"}
        </button>
      )}
      {insight && (
        <div style={styles.unlockBox}>
          <span style={styles.unlockLabel}>LEITURA DO RESULTADO</span>
          <p style={styles.unlockHow}>{insight}</p>
          <span style={styles.aiTag}>✦ gerado pra sua situação</span>
        </div>
      )}
    </div>
  );
}

function StepMapaEvolucao({ notasICS, mapaEvolucao, setMapaEvolucao }) {
  const setCampo = (dim, campo, val) =>
    setMapaEvolucao((prev) => ({ ...prev, [dim]: { ...prev[dim], [campo]: val } }));

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 3 DE 7 · MAPA DE EVOLUÇÃO DA CONFIANÇA</span>
      <h1 style={styles.h1}>Pra onde cada dimensão precisa ir?</h1>
      <p style={styles.lead}>
        Pra cada dimensão, defina a nota desejada pra próxima reavaliação e a ação principal pra
        chegar lá. Não precisa preencher todas agora, comece pelas mais baixas.
      </p>

      <div style={styles.familiaList}>
        {DIMENSOES_ICS.map((d) => (
          <div key={d.key} style={styles.padraoCard}>
            <span style={styles.papelNome}>{d.key}</span>
            <span style={styles.papelDescricao}>Nota atual: {notasICS[d.key]}</span>
            <label style={styles.fieldLabel}>Nota desejada na próxima reavaliação</label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={mapaEvolucao[d.key].notaDesejada ?? notasICS[d.key] ?? 0}
              onChange={(e) => setCampo(d.key, "notaDesejada", Number(e.target.value))}
              style={styles.sliderInput}
            />
            <span style={styles.padraoInterpretacao}>{mapaEvolucao[d.key].notaDesejada ?? "—"}</span>
            <label style={styles.fieldLabel}>Ação principal pra chegar lá</label>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={mapaEvolucao[d.key].acao}
              onChange={(e) => setCampo(d.key, "acao", e.target.value)}
              placeholder="Ex.: incluir em 3 decisões operacionais autônomas por trimestre"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepReflexaoF6({ reflexaoF6, setReflexaoF6, icsFinal }) {
  const set = (field) => (e) => setReflexaoF6((r) => ({ ...r, [field]: e.target.value }));
  const contexto = icsFinal !== null ? `ICS final de ${icsFinal} (${classificaICS(icsFinal).label})` : "avaliação de confiança sucessória";

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 4 DE 7 · REFLEXÃO INDIVIDUAL</span>
      <h1 style={styles.h1}>Sozinho, depois de ver o resultado e o mapa.</h1>
      <p style={styles.lead}>
        Ninguém além de você vai ler isso agora. Escreva o que for verdade, não o que soa bem de
        dizer em família.
      </p>

      <CampoReflexao
        pergunta="Qual dimensão apresentou a maior nota?"
        valor={reflexaoF6.maiorNota}
        onChange={set("maiorNota")}
        placeholder="A área em que o sucessor já demonstra mais prontidão hoje…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F6}
      />
      <CampoReflexao
        pergunta="Qual dimensão precisa de maior desenvolvimento?"
        valor={reflexaoF6.menorNota}
        onChange={set("menorNota")}
        placeholder="A área que mais limita o ICS Final atualmente…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F6}
      />
      <CampoReflexao
        pergunta="O que mais fortalece a confiança da família?"
        valor={reflexaoF6.fortalece}
        onChange={set("fortalece")}
        placeholder="Um fator concreto que já contribui positivamente pra confiança sucessória…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F6}
      />
      <CampoReflexao
        pergunta="O que mais limita a confiança da família?"
        valor={reflexaoF6.limita}
        onChange={set("limita")}
        placeholder="Um fator concreto que hoje trava a evolução dessa confiança…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F6}
      />
    </div>
  );
}

function StepConsolidacaoF6({ consolidacaoF6, setConsolidacaoF6, icsFinal }) {
  const [script, setScript] = useState(null);
  const [gerando, setGerando] = useState(false);

  const prepararConversa = () => {
    setGerando(true);
    setScript(null);
    const classif = icsFinal !== null ? classificaICS(icsFinal) : null;
    const prompt =
      `${LIVRO_CONTEXTO_F6}\n\n` +
      `Você ajuda alguém que calculou o ICS a se preparar para a Consolidação Familiar. ` +
      `${classif ? `O ICS Final foi ${icsFinal} (${classif.label}).` : ""}\n\n` +
      `Sugira 2-3 frases curtas de abertura pra essa pessoa começar essa conversa em família, ` +
      `apresentando o número como ponto de partida pra desenvolvimento, nunca como julgamento ` +
      `pessoal do sucessor. Formate como lista curta. Responda só com as frases, sem introdução, ` +
      `em português do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => setScript(texto))
      .catch(() => setScript("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 5 DE 7 · CONSOLIDAÇÃO FAMILIAR</span>
      <h1 style={styles.h1}>Reúnam-se e compartilhem as descobertas.</h1>
      <p style={styles.lead}>
        Registrem como cada descoberta da Reflexão Individual muda o plano de desenvolvimento do
        sucessor.
      </p>

      {!script && (
        <button onClick={prepararConversa} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando sugestão…" : "✦ Preciso de ajuda para começar a conversa"}
        </button>
      )}
      {script && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ sugestão gerada pra sua situação</span>
          <p style={styles.scriptText}>{script}</p>
        </div>
      )}

      <TabelaComportamentos
        titulo="Descobertas e impactos"
        linhas={consolidacaoF6}
        setLinhas={setConsolidacaoF6}
        labelComportamento="DESCOBERTA"
        labelMotivo="IMPACTO"
        placeholderComportamento="Ex.: a autonomia está mais baixa do que todos imaginavam"
        placeholderMotivo="Ex.: vamos criar decisões de teste com autonomia real, sem aprovação prévia"
      />
    </div>
  );
}

function StepDecisaoF6({ decisaoF6, setDecisaoF6 }) {
  const set = (field) => (e) => setDecisaoF6((d) => ({ ...d, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 6 DE 7 · DECISÃO</span>
      <h1 style={styles.h1}>Feche o processo respondendo, como família.</h1>
      <p style={styles.lead}>
        Com o número, o mapa e as descobertas na mesa, é hora de decidir o que pode avançar
        agora e o que ainda precisa de preparo.
      </p>

      <label style={styles.fieldLabel}>Quais responsabilidades podem ser transferidas imediatamente?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF6.transferirAgora}
        onChange={set("transferirAgora")}
        placeholder="Responsabilidades ligadas às dimensões com nota mais alta, já prontas pra transferência…"
      />
      <label style={styles.fieldLabel}>Quais responsabilidades exigem preparação adicional?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF6.exigemPreparo}
        onChange={set("exigemPreparo")}
        placeholder="Responsabilidades ligadas às dimensões com nota mais baixa, que exigem desenvolvimento antes…"
      />
      <label style={styles.fieldLabel}>Quais competências precisam ser desenvolvidas?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF6.competenciasDesenvolver}
        onChange={set("competenciasDesenvolver")}
        placeholder="Competências específicas a trabalhar até a próxima reavaliação do ICS…"
      />
    </div>
  );
}

function StepPlanoF6({ planoF6, setPlanoF6, decisaoF6, icsFinal }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  const addAcao = () =>
    setPlanoF6((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, prioridade: String(prev.length + 1), acao: "", responsavel: "", prazo: "" },
    ]);
  const removeAcao = (id) => setPlanoF6((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setPlanoF6((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirAcoes = () => {
    setGerando(true);
    setErro(false);
    const prompt =
      `${LIVRO_CONTEXTO_F6}\n\n` +
      `Você ajuda alguém que já calculou o ICS a transformar a decisão em um plano de ` +
      `desenvolvimento sucessório. Contexto:\n` +
      `${icsFinal !== null ? `- ICS Final: ${icsFinal} (${classificaICS(icsFinal).label})\n` : ""}` +
      `${decisaoF6.exigemPreparo ? `- Responsabilidades que exigem preparo: "${decisaoF6.exigemPreparo}"\n` : ""}` +
      `${decisaoF6.competenciasDesenvolver ? `- Competências a desenvolver: "${decisaoF6.competenciasDesenvolver}"\n` : ""}\n` +
      `Sugira 2-3 ações priorizadas (1 = mais urgente), cada uma no infinitivo, com responsável e ` +
      `prazo. Lembre que isso ainda precisa ser negociado em família.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"prioridade":"1","acao":"","responsavel":"","prazo":""},` +
      `{"prioridade":"2","acao":"","responsavel":"","prazo":""}]`;

    callClaude(prompt, 400)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlanoF6(
            parsed.map((a, i) => ({
              id: i + 1,
              prioridade: a.prioridade || String(i + 1),
              acao: a.acao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
            }))
          );
        }
      })
      .catch(() => setErro(true))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 7 DE 7 · PLANO DE DESENVOLVIMENTO SUCESSÓRIO</span>
      <h1 style={styles.h1}>Transforme a decisão em ações priorizadas.</h1>
      <p style={styles.lead}>
        Cada ação tem uma prioridade — comece pela que destrava mais rápido o desenvolvimento do
        sucessor.
      </p>

      <button onClick={sugerirAcoes} disabled={gerando} style={styles.demoLink}>
        {gerando ? "Gerando sugestões…" : "✦ Sugerir ações priorizadas"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {planoF6.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>Prioridade {a.prioridade || i + 1}</span>
              {planoF6.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.acao}
              onChange={(e) => setAcao(a.id, "acao", e.target.value)}
              placeholder="Ex.: incluir Rafael em 2 fóruns patrimoniais por trimestre…"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: início em 30 dias"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra ação
      </button>
    </div>
  );
}

function StepFechamentoF6({ nomeSucessor, notasICS, icsFinal, mapaEvolucao, decisaoF6, planoF6, onReiniciar, envioId }) {
  const [salvando, setSalvando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);
  const [sintese, setSintese] = useState(null);
  const [carregandoSintese, setCarregandoSintese] = useState(false);

  const classif = icsFinal !== null ? classificaICS(icsFinal) : null;
  const rankingDims =
    icsFinal !== null ? [...DIMENSOES_ICS].sort((a, b) => notasICS[b.key] - notasICS[a.key]) : [];
  const maisForteDim = rankingDims[0];
  const maisFracaDim = rankingDims[rankingDims.length - 1];
  const sinteseFallback =
    icsFinal !== null
      ? `Este número não é um veredito definitivo sobre ${nomeSucessor.trim() || "a pessoa"}, é uma fotografia de agora. Hoje, ${maisForteDim.key} é o ponto mais forte, e ${maisFracaDim.key} é o que mais limita o resultado — e é exatamente aí que o desenvolvimento pode ter mais impacto na próxima reavaliação.`
      : "";

  useEffect(() => {
    let cancelado = false;
    setSalvando(true);
    setErroSalvar(false);

    supabaseInsert("respostas", {
      envio_id: envioId || null,
      ferramenta_numero: 6,
      nome: nomeSucessor.trim() || null,
      notas: { ...notasICS, ICS_Final: icsFinal },
      conflito: { classificacao: classif ? classif.label : null, mapaEvolucao },
      decisao_final: decisaoF6,
      plano_acao: planoF6,
    })
      .then(() => {
        if (!cancelado) setSalvo(true);
      })
      .catch(() => {
        if (!cancelado) setErroSalvar(true);
      })
      .finally(() => {
        if (!cancelado) setSalvando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelado = false;
    if (icsFinal === null) return;
    setCarregandoSintese(true);
    const ranking = [...DIMENSOES_ICS].sort((a, b) => notasICS[b.key] - notasICS[a.key]);
    const maisForte = ranking[0];
    const maisFraca = ranking[ranking.length - 1];
    const resumo = DIMENSOES_ICS.map((d) => `${d.key}: ${notasICS[d.key]}`).join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F6}\n\n` +
      `${nomeSucessor.trim() ? `Sucessor avaliado: ${nomeSucessor.trim()}.` : ""} ICS Final: ${icsFinal} ` +
      `(${classif.label}). Notas completas: ${resumo}.\n` +
      `Dimensão mais forte: ${maisForte.key} (${notasICS[maisForte.key]}).\n` +
      `Dimensão mais fraca: ${maisFraca.key} (${notasICS[maisFraca.key]}).\n` +
      `${decisaoF6.transferirAgora ? `Decidiram transferir agora: "${decisaoF6.transferirAgora}".` : ""}\n\n` +
      `Escreva um parágrafo curto de fechamento (3-4 frases, no máximo 80 palavras) que amarre isso ` +
      `numa síntese concreta e acolhedora. Mencione explicitamente a dimensão mais forte e a mais ` +
      `fraca pelo nome (use exatamente os nomes indicados acima, não invente outra dimensão), e ` +
      `reforce que o ICS não é um veredito definitivo, é uma fotografia que pode e deve mudar com ` +
      `desenvolvimento. Tom direto, sem clichês de autoajuda. Responda só com o texto, sem ` +
      `introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setSintese(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoSintese(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const montarResumo = () => {
    const linhas = [
      "Índice de Confiança Sucessória (ICS)",
      nomeSucessor.trim() ? `Sucessor avaliado: ${nomeSucessor.trim()}` : null,
      "",
      `ICS Final: ${icsFinal} — ${classif ? classif.label : "—"}`,
      `Notas por dimensão: ${DIMENSOES_ICS.map((d) => `${d.key} ${notasICS[d.key]}`).join(", ")}`,
      "",
      sintese ? `Síntese: ${sintese}` : null,
      sintese ? "" : null,
      `Transferir imediatamente: ${decisaoF6.transferirAgora || "—"}`,
      `Exige preparo: ${decisaoF6.exigemPreparo || "—"}`,
      `Competências a desenvolver: ${decisaoF6.competenciasDesenvolver || "—"}`,
      "",
      "Plano de desenvolvimento sucessório:",
      planoF6
        .filter((a) => a.acao.trim())
        .map((a) => `Prioridade ${a.prioridade}. ${a.acao} — Responsável: ${a.responsavel || "—"} — Prazo: ${a.prazo || "—"}`)
        .join("\n") || "—",
    ].filter((l) => l !== null);
    return linhas.join("\n");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const assunto = nomeSucessor.trim()
        ? `Índice de Confiança Sucessória — ${nomeSucessor.trim()}`
        : "Nosso resultado — Índice de Confiança Sucessória";
      notifyConsultor(assunto, montarResumo());
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stepWrap}>
      <div style={styles.saveStatus}>
        {salvando && <span style={styles.saveStatusText}>Salvando seu resultado…</span>}
        {!salvando && salvo && <span style={styles.saveStatusOk}>✓ Resultado salvo</span>}
        {!salvando && erroSalvar && (
          <span style={styles.saveStatusErr}>Não deu pra salvar automaticamente, use o e-mail abaixo</span>
        )}
      </div>
      <span style={styles.eyebrowSmall}>FECHAMENTO</span>
      <h1 style={styles.h1}>
        {nomeSucessor.trim() ? `ICS de ${nomeSucessor.trim()}, resumido.` : "Seu Índice de Confiança Sucessória, resumido."}
      </h1>

      {icsFinal !== null && (
        <div style={{ ...styles.unlockBox, borderColor: classif.cor }}>
          <span style={styles.unlockLabel}>ICS FINAL</span>
          <div style={styles.icsPainelRow}>
            <span style={{ ...styles.icsPainelNumero, color: classif.cor }}>{icsFinal}</span>
            <span style={{ ...styles.padraoGuiaNome, color: classif.cor }}>{classif.label}</span>
          </div>
        </div>
      )}

      <div style={styles.unlockBox}>
        <span style={styles.unlockLabel}>SÍNTESE</span>
        {carregandoSintese ? (
          <p style={styles.unlockHow}>
            <span style={{ opacity: 0.6 }}>Gerando síntese pra sua situação específica…</span>
          </p>
        ) : (
          <>
            <p style={styles.unlockHow}>
              {sintese || sinteseFallback}
            </p>
            {sintese && <span style={styles.aiTag}>✦ gerado pra sua situação</span>}
          </>
        )}
      </div>

      <p style={{ ...styles.papelNome, marginTop: 8 }}>O que a família decidiu</p>
      <div style={styles.fechamentoBox}>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>TRANSFERIR AGORA</span>
          <span style={styles.fechamentoValue}>{decisaoF6.transferirAgora || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>EXIGE PREPARO</span>
          <span style={styles.fechamentoValue}>{decisaoF6.exigemPreparo || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>COMPETÊNCIAS A DESENVOLVER</span>
          <span style={styles.fechamentoValue}>{decisaoF6.competenciasDesenvolver || "—"}</span>
        </div>
      </div>

      <p style={{ ...styles.papelNome, marginTop: 8 }}>Plano de desenvolvimento sucessório</p>
      <div style={styles.familiaList}>
        {planoF6
          .filter((a) => a.acao.trim())
          .map((a) => (
            <div key={a.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>Prioridade {a.prioridade}</span>
              <span style={styles.papelDescricao}>{a.acao}</span>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>RESPONSÁVEL</span>
                <span style={styles.fechamentoValue}>{a.responsavel || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>PRAZO</span>
                <span style={styles.fechamentoValue}>{a.prazo || "—"}</span>
              </div>
            </div>
          ))}
      </div>

      <div style={styles.ctaBox}>
        <p style={styles.ctaTitle}>Agora é executar, com acompanhamento.</p>
        <p style={styles.ctaSub}>
          Vocês mediram a confiança em cinco dimensões, mapearam a evolução desejada, refletiram
          sozinhos, consolidaram em família, decidiram e planejaram. O que falta agora é colocar
          em prática, e reavaliar o ICS daqui a alguns meses.
        </p>
      </div>

      <p style={{ ...styles.papelDescricao, marginTop: 4 }} className="no-print">
        Um resumo desse resultado já foi enviado automaticamente pro consultor.
      </p>
      <div style={styles.finalButtonsRow} className="no-print">
        <button onClick={() => window.print()} style={styles.ctaButton}>
          🖨️ Baixar / imprimir PDF
        </button>
        <button onClick={onReiniciar} style={styles.restartButton}>
          ↺ Voltar ao início
        </button>
      </div>
    </div>
  );
}

const STEP_F7_CONTEXTUALIZAR = 0;
const STEP_F7_LEVANTAR = 1;
const STEP_F7_ALINHAR = 2;
const STEP_F7_RESOLVER = 3;
const STEP_F7_ORGANIZAR = 4;
const STEP_F7_REFLEXAO = 5;
const STEP_F7_CONSOLIDACAO = 6;
const STEP_F7_DECISAO = 7;
const STEP_F7_PLANO = 8;
const STEP_F7_FECHAMENTO = 9;

const ANDRADE_EXEMPLO_F7 = {
  contexto: {
    assunto: "Quem vai liderar a empresa",
    porque: "Os dois irmãos disputam a liderança há anos, desde que o pai saiu do dia a dia, e o assunto vem sendo evitado.",
    participantes: "Eduardo (irmão mais velho), Rogério (irmão mais novo), facilitador externo",
    data: "15/04",
    facilitador: "Facilitador externo (consultor de família)",
  },
  percepcoes: [
    {
      id: 1,
      participante: "Eduardo",
      pensa: "Deveria assumir a presidência por ser o mais velho e mais experiente na operação.",
      preocupa: "Perder o respeito da equipe se não for reconhecido como líder formal.",
    },
    {
      id: 2,
      participante: "Rogério",
      pensa: "A liderança deveria ser decidida por competência, não por ordem de nascimento.",
      preocupa: "Ficar eternamente na sombra do irmão mais velho, mesmo entregando resultados melhores.",
    },
  ],
  interesses: [
    {
      id: 1,
      comportamento: "Preservar a empresa que o pai construiu",
      motivo: "Eduardo e Rogério",
    },
    {
      id: 2,
      comportamento: "Manter a união entre os irmãos",
      motivo: "Eduardo e Rogério",
    },
  ],
  divergencias: [
    {
      id: 1,
      divergencia: "Qual modelo de liderança adotar (um presidente único vs. liderança compartilhada)",
      negociavel: "Sim",
      tratamento: "Tratado como questão técnica, decidido por critérios objetivos definidos por um conselho consultivo",
    },
  ],
  organizacao: [
    {
      id: 1,
      decisao: "Criar um conselho consultivo com critérios objetivos de liderança",
      responsavel: "Eduardo e Rogério",
      prazo: "60 dias",
    },
  ],
  reflexaoF7: {
    chamouAtencao: "O momento em que os dois reconheceram, pela primeira vez em voz alta, que queriam a mesma coisa.",
    aprendiSobreOutros: "Meu irmão não quer o poder pelo poder, ele tem medo real de ficar invisível.",
    conduzirDiferente: "Deveríamos ter feito essa conversa com facilitador anos atrás, antes do ressentimento acumular.",
  },
  consolidacaoF7: [
    {
      id: 1,
      comportamento: "Os dois irmãos nunca tinham verbalizado que queriam a mesma coisa.",
      motivo: "Vamos sempre começar futuras conversas alinhando interesses antes de discutir posições.",
    },
  ],
  decisaoF7: {
    decisoesTomadas: "Criar um conselho consultivo com critérios objetivos de liderança, tirando a disputa do campo pessoal.",
    temasNovaConversa: "A remuneração de cada um dentro do novo modelo de liderança ainda precisa ser conversada à parte.",
  },
  planoF7: [
    {
      id: 1,
      acao: "Formalizar os critérios do conselho consultivo com apoio jurídico.",
      responsavel: "Advogado da família",
      prazo: "45 dias",
      status: "Em andamento",
    },
    {
      id: 2,
      acao: "Realizar a primeira reunião do conselho consultivo.",
      responsavel: "Eduardo e Rogério",
      prazo: "60 dias",
      status: "Não iniciado",
    },
  ],
};

function Ferramenta7App({ onVoltarCatalogo, envioIdInicial }) {
  const [step, setStep] = useState(STEP_F7_CONTEXTUALIZAR);
  const [contexto, setContexto] = useState({
    assunto: "",
    porque: "",
    participantes: "",
    data: "",
    facilitador: "",
  });
  const [percepcoes, setPercepcoes] = useState([
    { id: 1, participante: "", pensa: "", preocupa: "" },
  ]);
  const [interesses, setInteresses] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [divergencias, setDivergencias] = useState([
    { id: 1, divergencia: "", negociavel: "", tratamento: "" },
  ]);
  const [organizacao, setOrganizacao] = useState([
    { id: 1, decisao: "", responsavel: "", prazo: "" },
  ]);
  const [reflexaoF7, setReflexaoF7] = useState({
    chamouAtencao: "",
    aprendiSobreOutros: "",
    conduzirDiferente: "",
  });
  const [consolidacaoF7, setConsolidacaoF7] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [decisaoF7, setDecisaoF7] = useState({ decisoesTomadas: "", temasNovaConversa: "" });
  const [planoF7, setPlanoF7] = useState([
    { id: 1, acao: "", responsavel: "", prazo: "", status: "Não iniciado" },
  ]);

  const carregarExemploF7 = () => {
    setContexto(ANDRADE_EXEMPLO_F7.contexto);
    setPercepcoes(ANDRADE_EXEMPLO_F7.percepcoes);
    setInteresses(ANDRADE_EXEMPLO_F7.interesses);
    setDivergencias(ANDRADE_EXEMPLO_F7.divergencias);
    setOrganizacao(ANDRADE_EXEMPLO_F7.organizacao);
    setReflexaoF7(ANDRADE_EXEMPLO_F7.reflexaoF7);
    setConsolidacaoF7(ANDRADE_EXEMPLO_F7.consolidacaoF7);
    setDecisaoF7(ANDRADE_EXEMPLO_F7.decisaoF7);
    setPlanoF7(ANDRADE_EXEMPLO_F7.planoF7);
    setStep(STEP_F7_RESOLVER);
  };

  const canAdvance = () => {
    if (step === STEP_F7_CONTEXTUALIZAR) {
      return contexto.assunto.trim().length > 3 && contexto.participantes.trim().length > 0;
    }
    if (step === STEP_F7_LEVANTAR) {
      return percepcoes.some((p) => p.participante.trim() && p.pensa.trim());
    }
    if (step === STEP_F7_ALINHAR) {
      return interesses.some((i) => i.comportamento.trim());
    }
    if (step === STEP_F7_RESOLVER) {
      return divergencias.some((d) => d.divergencia.trim());
    }
    if (step === STEP_F7_ORGANIZAR) {
      return organizacao.some((o) => o.decisao.trim() && o.responsavel.trim());
    }
    if (step === STEP_F7_REFLEXAO) {
      return (
        reflexaoF7.chamouAtencao.trim().length > 3 &&
        reflexaoF7.aprendiSobreOutros.trim().length > 3 &&
        reflexaoF7.conduzirDiferente.trim().length > 3
      );
    }
    if (step === STEP_F7_CONSOLIDACAO) {
      return consolidacaoF7.some((c) => c.comportamento.trim() && c.motivo.trim());
    }
    if (step === STEP_F7_DECISAO) {
      return (
        decisaoF7.decisoesTomadas.trim().length > 3 && decisaoF7.temasNovaConversa.trim().length > 0
      );
    }
    if (step === STEP_F7_PLANO) {
      return planoF7.some(
        (a) => a.acao.trim().length > 3 && a.responsavel.trim().length > 0 && a.prazo.trim().length > 0
      );
    }
    return true;
  };

  const goNext = () => setStep((s) => Math.min(STEP_F7_FECHAMENTO, s + 1));
  const goBack = () => setStep((s) => Math.max(STEP_F7_CONTEXTUALIZAR, s - 1));

  return (
    <>
      <Header7 step={step} onVoltarCatalogo={onVoltarCatalogo} />
      <div style={styles.body}>
        {step === STEP_F7_CONTEXTUALIZAR && (
          <StepContextualizar contexto={contexto} setContexto={setContexto} onCarregarExemplo={carregarExemploF7} />
        )}
        {step === STEP_F7_LEVANTAR && (
          <StepLevantarPercepcoes percepcoes={percepcoes} setPercepcoes={setPercepcoes} />
        )}
        {step === STEP_F7_ALINHAR && (
          <StepAlinharInteresses interesses={interesses} setInteresses={setInteresses} />
        )}
        {step === STEP_F7_RESOLVER && (
          <StepResolverDivergencias divergencias={divergencias} setDivergencias={setDivergencias} />
        )}
        {step === STEP_F7_ORGANIZAR && (
          <StepOrganizarPassos organizacao={organizacao} setOrganizacao={setOrganizacao} />
        )}
        {step === STEP_F7_REFLEXAO && (
          <StepReflexaoF7 reflexaoF7={reflexaoF7} setReflexaoF7={setReflexaoF7} contexto={contexto} />
        )}
        {step === STEP_F7_CONSOLIDACAO && (
          <StepConsolidacaoF7
            consolidacaoF7={consolidacaoF7}
            setConsolidacaoF7={setConsolidacaoF7}
            contexto={contexto}
          />
        )}
        {step === STEP_F7_DECISAO && <StepDecisaoF7 decisaoF7={decisaoF7} setDecisaoF7={setDecisaoF7} />}
        {step === STEP_F7_PLANO && (
          <StepPlanoF7 planoF7={planoF7} setPlanoF7={setPlanoF7} decisaoF7={decisaoF7} contexto={contexto} />
        )}
        {step === STEP_F7_FECHAMENTO && (
          <StepFechamentoF7
            contexto={contexto}
            divergencias={divergencias}
            decisaoF7={decisaoF7}
            planoF7={planoF7}
            onReiniciar={onVoltarCatalogo}
            envioId={envioIdInicial}
          />
        )}
      </div>
      {step < STEP_F7_FECHAMENTO && (
        <Footer
          step={step}
          canAdvance={canAdvance()}
          isLastQuadrante={false}
          isDesempate={false}
          isPenultimate={step === STEP_F7_PLANO}
          onBack={goBack}
          onNext={goNext}
        />
      )}
    </>
  );
}

function Header7({ step, onVoltarCatalogo }) {
  const labels = [
    "Contextualizar",
    "Levantar Percepções",
    "Alinhar Interesses",
    "Resolver Divergências",
    "Organizar Próximos Passos",
    "Reflexão individual",
    "Consolidação familiar",
    "Decisão",
    "Plano de ação",
    "Fechamento",
  ];
  const progress = Math.round((step / STEP_F7_FECHAMENTO) * 100);
  return (
    <div style={styles.header} className="no-print">
      <div style={styles.headerTop}>
        <button onClick={onVoltarCatalogo} style={styles.backToCatalogo}>
          ← Catálogo
        </button>
        <span style={styles.stepLabel}>Protocolo CLARO · {labels[step]}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

function ClaroGuiaMini({ atual }) {
  return (
    <div style={styles.claroGuiaRow}>
      {ETAPAS_CLARO.map((e) => (
        <div
          key={e.letra}
          style={{
            ...styles.claroLetraBox,
            background: e.letra === atual ? BLUE : "#EEF2F6",
            color: e.letra === atual ? "#fff" : "#8A97A3",
          }}
        >
          {e.letra}
        </div>
      ))}
    </div>
  );
}

function StepContextualizar({ contexto, setContexto, onCarregarExemplo }) {
  const set = (field) => (e) => setContexto((c) => ({ ...c, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <ClaroGuiaMini atual="C" />
      <span style={styles.eyebrowSmall}>PASSO 1 DE 9 · C — CONTEXTUALIZAR</span>
      <h1 style={styles.h1}>Antes de reunir todo mundo, deixe claro sobre o quê é a conversa.</h1>
      <p style={styles.lead}>
        Preencha isso antes da conversa, e compartilhe com todos os participantes com
        antecedência — ninguém deve chegar sem saber exatamente sobre o que vão falar.
      </p>

      <div style={styles.demoLinksRow}>
        <button onClick={onCarregarExemplo} style={styles.demoLink}>
          ⚡ Exemplo: Família Andrade (caso do livro)
        </button>
      </div>

      <label style={styles.fieldLabel}>Assunto principal</label>
      <input
        style={{ ...styles.input, flex: "none" }}
        value={contexto.assunto}
        onChange={set("assunto")}
        placeholder="Ex.: revisão da política de remuneração dos sócios"
      />
      <label style={styles.fieldLabel}>Por que é importante agora?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={contexto.porque}
        onChange={set("porque")}
        placeholder="O motivo real de tratar isso agora, não em outro momento…"
      />
      <label style={styles.fieldLabel}>Participantes</label>
      <input
        style={{ ...styles.input, flex: "none" }}
        value={contexto.participantes}
        onChange={set("participantes")}
        placeholder="Ex.: os dois irmãos sócios e um facilitador externo"
      />
      <div style={styles.planoRow}>
        <div style={styles.planoField}>
          <label style={styles.fieldLabel}>Data</label>
          <input
            style={{ ...styles.input, flex: "none" }}
            value={contexto.data}
            onChange={set("data")}
            placeholder="Ex.: 15/04"
          />
        </div>
        <div style={styles.planoField}>
          <label style={styles.fieldLabel}>Facilitador</label>
          <input
            style={{ ...styles.input, flex: "none" }}
            value={contexto.facilitador}
            onChange={set("facilitador")}
            placeholder="Quem conduz as cinco etapas"
          />
        </div>
      </div>
    </div>
  );
}

function StepLevantarPercepcoes({ percepcoes, setPercepcoes }) {
  const add = () =>
    setPercepcoes((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, participante: "", pensa: "", preocupa: "" },
    ]);
  const remove = (id) => setPercepcoes((prev) => prev.filter((p) => p.id !== id));
  const set = (id, field, val) =>
    setPercepcoes((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)));

  return (
    <div style={styles.stepWrap}>
      <ClaroGuiaMini atual="L" />
      <span style={styles.eyebrowSmall}>PASSO 2 DE 9 · L — LEVANTAR PERCEPÇÕES</span>
      <h1 style={styles.h1}>Durante a conversa, ouça todo mundo, sem interromper.</h1>
      <p style={styles.lead}>
        Registre o que cada participante pensa e o que mais o preocupa em relação ao tema.
        Resista à vontade de responder ou se defender antes de todos falarem.
      </p>

      <div style={styles.familiaList}>
        {percepcoes.map((p) => (
          <div key={p.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <input
                style={{ ...styles.input, flex: "1 1 200px" }}
                value={p.participante}
                onChange={(e) => set(p.id, "participante", e.target.value)}
                placeholder="Nome do participante"
              />
              {percepcoes.length > 1 && (
                <button onClick={() => remove(p.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <span style={styles.padraoInterpretacao}>O QUE PENSA</span>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={p.pensa}
              onChange={(e) => set(p.id, "pensa", e.target.value)}
              placeholder="Ex.: deveria assumir a presidência por ser o mais experiente"
            />
            <span style={styles.padraoInterpretacao}>O QUE PREOCUPA</span>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={p.preocupa}
              onChange={(e) => set(p.id, "preocupa", e.target.value)}
              placeholder="Ex.: perder espaço se o critério mudar"
            />
          </div>
        ))}
      </div>
      <button onClick={add} type="button" style={styles.demoLink}>
        + Adicionar participante
      </button>
    </div>
  );
}

function StepAlinharInteresses({ interesses, setInteresses }) {
  return (
    <div style={styles.stepWrap}>
      <ClaroGuiaMini atual="A" />
      <span style={styles.eyebrowSmall}>PASSO 3 DE 9 · A — ALINHAR INTERESSES</span>
      <h1 style={styles.h1}>Depois de ouvir todos, o que vocês querem, no fundo, em comum?</h1>
      <p style={styles.lead}>
        Identifique os interesses que aparecem em comum entre os participantes, mesmo que as
        posições declaradas pareçam opostas. Não pule esta etapa: é ela que sustenta a resolução
        das divergências.
      </p>

      <TabelaComportamentos
        titulo="Interesses em comum"
        linhas={interesses}
        setLinhas={setInteresses}
        labelComportamento="INTERESSE"
        labelMotivo="QUEM COMPARTILHA"
        placeholderComportamento="Ex.: preservar a união entre os irmãos"
        placeholderMotivo="Ex.: todos os participantes"
      />
    </div>
  );
}

function StepResolverDivergencias({ divergencias, setDivergencias }) {
  return (
    <div style={styles.stepWrap}>
      <ClaroGuiaMini atual="R" />
      <span style={styles.eyebrowSmall}>PASSO 4 DE 9 · R — RESOLVER DIVERGÊNCIAS</span>
      <h1 style={styles.h1}>Agora sim: trate cada divergência, uma de cada vez.</h1>
      <p style={styles.lead}>
        Liste cada divergência específica, identifique se ela é negociável, e combine como será
        tratada. Separar o que é negociável do que não é vem antes de tentar resolver.
      </p>

      <TabelaTresColunas
        titulo="Divergências"
        linhas={divergencias}
        setLinhas={setDivergencias}
        campos={["divergencia", "negociavel", "tratamento"]}
        labels={["DIVERGÊNCIA", "NEGOCIÁVEL?", "COMO SERÁ TRATADA"]}
        opcoesColuna2={["Sim", "Não"]}
        placeholders={[
          "Ex.: quem assume a presidência",
          "Sim ou não",
          "Ex.: critério técnico definido pelo conselho consultivo",
        ]}
      />
    </div>
  );
}

function StepOrganizarPassos({ organizacao, setOrganizacao }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  const addAcao = () =>
    setOrganizacao((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, decisao: "", responsavel: "", prazo: "" },
    ]);
  const removeAcao = (id) => setOrganizacao((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setOrganizacao((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirDecisoes = () => {
    setGerando(true);
    setErro(false);
    const prompt =
      `${LIVRO_CONTEXTO_F7}\n\n` +
      `Você ajuda alguém que acabou de conduzir uma conversa difícil pelo Protocolo CLARO a ` +
      `transformar isso em decisões concretas. Sugira 2 decisões plausíveis de exemplo pra uma ` +
      `conversa sobre um tema sensível de sucessão familiar, cada uma no infinitivo, com ` +
      `responsável e prazo. Isso é só um rascunho pra pessoa editar.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"decisao":"","responsavel":"","prazo":""},{"decisao":"","responsavel":"","prazo":""}]`;

    callClaude(prompt, 350)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrganizacao(
            parsed.map((a, i) => ({
              id: i + 1,
              decisao: a.decisao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
            }))
          );
        }
      })
      .catch(() => setErro(true))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <ClaroGuiaMini atual="O" />
      <span style={styles.eyebrowSmall}>PASSO 5 DE 9 · O — ORGANIZAR PRÓXIMOS PASSOS</span>
      <h1 style={styles.h1}>Transforme a conversa em decisão, não em mais um ciclo sem fim.</h1>
      <p style={styles.lead}>
        Registre por escrito o que ficou decidido, com responsável e prazo — decisões faladas se
        perdem com o tempo.
      </p>

      <button onClick={sugerirDecisoes} disabled={gerando} style={styles.demoLink}>
        {gerando ? "Gerando exemplo…" : "✦ Ver um exemplo de como registrar"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {organizacao.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>Decisão {i + 1}</span>
              {organizacao.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.decisao}
              onChange={(e) => setAcao(a.id, "decisao", e.target.value)}
              placeholder="Ex.: criar conselho consultivo"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: 60 dias"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra decisão
      </button>
    </div>
  );
}

function StepReflexaoF7({ reflexaoF7, setReflexaoF7, contexto }) {
  const set = (field) => (e) => setReflexaoF7((r) => ({ ...r, [field]: e.target.value }));
  const contextoTexto = contexto.assunto ? `conversa sobre "${contexto.assunto}"` : "conversa difícil pelo Protocolo CLARO";

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 6 DE 9 · REFLEXÃO INDIVIDUAL</span>
      <h1 style={styles.h1}>Sozinho, logo depois da conversa.</h1>
      <p style={styles.lead}>
        Ninguém além de você vai ler isso agora. Escreva o que for verdade, não o que soa bem de
        dizer em família.
      </p>

      <CampoReflexao
        pergunta="O que mais me chamou atenção nesta conversa?"
        valor={reflexaoF7.chamouAtencao}
        onChange={set("chamouAtencao")}
        placeholder="O momento ou a fala que mais se destacou pra você durante o processo…"
        contexto={contextoTexto}
        contextoLivro={LIVRO_CONTEXTO_F7}
      />
      <CampoReflexao
        pergunta="O que aprendi sobre os demais participantes?"
        valor={reflexaoF7.aprendiSobreOutros}
        onChange={set("aprendiSobreOutros")}
        placeholder="Uma percepção nova sobre como a outra pessoa pensa ou sente em relação ao tema…"
        contexto={contextoTexto}
        contextoLivro={LIVRO_CONTEXTO_F7}
      />
      <CampoReflexao
        pergunta="O que poderia ter sido conduzido de forma diferente?"
        valor={reflexaoF7.conduzirDiferente}
        onChange={set("conduzirDiferente")}
        placeholder="Um ajuste que melhoraria a condução dessa conversa da próxima vez…"
        contexto={contextoTexto}
        contextoLivro={LIVRO_CONTEXTO_F7}
      />
    </div>
  );
}

function StepConsolidacaoF7({ consolidacaoF7, setConsolidacaoF7, contexto }) {
  const [script, setScript] = useState(null);
  const [gerando, setGerando] = useState(false);

  const prepararConversa = () => {
    setGerando(true);
    setScript(null);
    const prompt =
      `${LIVRO_CONTEXTO_F7}\n\n` +
      `Você ajuda alguém que conduziu uma conversa pelo Protocolo CLARO, sobre "${contexto.assunto || "um tema sensível"}", ` +
      `a se preparar pra Consolidação Familiar.\n\n` +
      `Sugira 2-3 frases curtas de abertura pra essa pessoa começar essa conversa de consolidação, ` +
      `focando em como as descobertas individuais devem mudar futuras conversas. Formate como ` +
      `lista curta. Responda só com as frases, sem introdução, em português do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => setScript(texto))
      .catch(() => setScript("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 7 DE 9 · CONSOLIDAÇÃO FAMILIAR</span>
      <h1 style={styles.h1}>Reúnam-se e compartilhem as descobertas.</h1>
      <p style={styles.lead}>
        Registrem, na coluna Impacto, como cada descoberta deve influenciar futuras conversas.
      </p>

      {!script && (
        <button onClick={prepararConversa} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando sugestão…" : "✦ Preciso de ajuda para começar a conversa"}
        </button>
      )}
      {script && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ sugestão gerada pra sua situação</span>
          <p style={styles.scriptText}>{script}</p>
        </div>
      )}

      <TabelaComportamentos
        titulo="Descobertas e impactos"
        linhas={consolidacaoF7}
        setLinhas={setConsolidacaoF7}
        labelComportamento="DESCOBERTA"
        labelMotivo="IMPACTO"
        placeholderComportamento="Ex.: os dois irmãos nunca tinham verbalizado que queriam a mesma coisa"
        placeholderMotivo="Ex.: vamos sempre alinhar interesses antes de discutir posições"
      />
    </div>
  );
}

function StepDecisaoF7({ decisaoF7, setDecisaoF7 }) {
  const set = (field) => (e) => setDecisaoF7((d) => ({ ...d, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 8 DE 9 · DECISÃO</span>
      <h1 style={styles.h1}>Feche o processo respondendo, como família.</h1>
      <p style={styles.lead}>
        Um resumo objetivo do que ficou decidido, e do que ainda precisa de uma nova conversa.
      </p>

      <label style={styles.fieldLabel}>Quais decisões foram tomadas?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF7.decisoesTomadas}
        onChange={set("decisoesTomadas")}
        placeholder="Resumo objetivo do que ficou decidido ao final da conversa…"
      />
      <label style={styles.fieldLabel}>Quais temas exigirão novas conversas?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF7.temasNovaConversa}
        onChange={set("temasNovaConversa")}
        placeholder="Assuntos que ainda não foram resolvidos e precisam de um novo ciclo do Protocolo CLARO…"
      />
    </div>
  );
}

function StepPlanoF7({ planoF7, setPlanoF7, decisaoF7, contexto }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  const addAcao = () =>
    setPlanoF7((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, acao: "", responsavel: "", prazo: "", status: "Não iniciado" },
    ]);
  const removeAcao = (id) => setPlanoF7((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setPlanoF7((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirAcoes = () => {
    setGerando(true);
    setErro(false);
    const prompt =
      `${LIVRO_CONTEXTO_F7}\n\n` +
      `Você ajuda alguém que já percorreu o Protocolo CLARO a transformar a decisão em um plano ` +
      `de ação. Contexto:\n` +
      `${contexto.assunto ? `- Assunto da conversa: "${contexto.assunto}"\n` : ""}` +
      `${decisaoF7.decisoesTomadas ? `- Decisões tomadas: "${decisaoF7.decisoesTomadas}"\n` : ""}\n` +
      `Sugira 2-3 ações em sequência cronológica, cada uma no infinitivo, com responsável e ` +
      `prazo. Lembre que isso ainda precisa ser negociado em família.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"acao":"","responsavel":"","prazo":""},{"acao":"","responsavel":"","prazo":""}]`;

    callClaude(prompt, 400)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlanoF7(
            parsed.map((a, i) => ({
              id: i + 1,
              acao: a.acao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
              status: "Não iniciado",
            }))
          );
        }
      })
      .catch(() => setErro(true))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 9 DE 9 · PLANO DE AÇÃO</span>
      <h1 style={styles.h1}>Transforme as decisões em ações, com status de acompanhamento.</h1>
      <p style={styles.lead}>
        Cada ação tem um status — volte aqui daqui a algumas semanas e atualize, pra saber se os
        compromissos foram cumpridos de verdade.
      </p>

      <button onClick={sugerirAcoes} disabled={gerando} style={styles.demoLink}>
        {gerando ? "Gerando sugestões…" : "✦ Sugerir ações"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {planoF7.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              {planoF7.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.acao}
              onChange={(e) => setAcao(a.id, "acao", e.target.value)}
              placeholder="Ex.: formalizar os critérios do conselho consultivo…"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: 45 dias"
                />
              </div>
            </div>
            <label style={styles.fieldLabel}>Status</label>
            <div style={styles.envioButtonsRow}>
              {STATUS_ACAO_F7.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAcao(a.id, "status", s)}
                  style={{
                    ...styles.geracaoOption,
                    borderColor: a.status === s ? BLUE : "#E4EAF0",
                    background: a.status === s ? "#EAF2FB" : "#fff",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra ação
      </button>
    </div>
  );
}

function StepFechamentoF7({ contexto, divergencias, decisaoF7, planoF7, onReiniciar, envioId }) {
  const [salvando, setSalvando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);
  const [sintese, setSintese] = useState(null);
  const [carregandoSintese, setCarregandoSintese] = useState(false);

  const divergenciasPreenchidas = divergencias.filter((d) => d.divergencia.trim());

  useEffect(() => {
    let cancelado = false;
    setSalvando(true);
    setErroSalvar(false);

    supabaseInsert("respostas", {
      envio_id: envioId || null,
      ferramenta_numero: 7,
      notas: { assunto: contexto.assunto, contexto },
      conflito: { divergencias: divergenciasPreenchidas },
      decisao_final: decisaoF7,
      plano_acao: planoF7,
    })
      .then(() => {
        if (!cancelado) setSalvo(true);
      })
      .catch(() => {
        if (!cancelado) setErroSalvar(true);
      })
      .finally(() => {
        if (!cancelado) setSalvando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCarregandoSintese(true);
    const prompt =
      `${LIVRO_CONTEXTO_F7}\n\n` +
      `Alguém completou o Protocolo CLARO sobre "${contexto.assunto || "um tema sensível"}". ` +
      `${decisaoF7.decisoesTomadas ? `Decisões tomadas: "${decisaoF7.decisoesTomadas}".` : ""}\n\n` +
      `Escreva um parágrafo curto de fechamento (3-4 frases, no máximo 80 palavras) que amarre ` +
      `isso numa síntese concreta e acolhedora, reforçando que o silêncio custa caro e que a ` +
      `estrutura da conversa é o que faz a diferença entre impasse e decisão. Tom direto, sem ` +
      `clichês de autoajuda. Responda só com o texto, sem introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setSintese(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoSintese(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const assunto = contexto.assunto
        ? `Protocolo CLARO — ${contexto.assunto}`
        : "Nosso resultado — Protocolo CLARO";
      notifyConsultor(assunto, montarResumo());
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const montarResumo = () => {
    const linhas = [
      "Protocolo CLARO",
      "",
      `Assunto: ${contexto.assunto || "—"}`,
      `Participantes: ${contexto.participantes || "—"}`,
      "",
      sintese ? `Síntese: ${sintese}` : null,
      sintese ? "" : null,
      `Decisões tomadas: ${decisaoF7.decisoesTomadas || "—"}`,
      `Temas que exigem nova conversa: ${decisaoF7.temasNovaConversa || "—"}`,
      "",
      "Plano de ação:",
      planoF7
        .filter((a) => a.acao.trim())
        .map(
          (a, i) =>
            `${i + 1}. ${a.acao} — Responsável: ${a.responsavel || "—"} — Prazo: ${a.prazo || "—"} — Status: ${a.status || "—"}`
        )
        .join("\n") || "—",
    ].filter((l) => l !== null);
    return linhas.join("\n");
  };

  return (
    <div style={styles.stepWrap}>
      <div style={styles.saveStatus}>
        {salvando && <span style={styles.saveStatusText}>Salvando seu resultado…</span>}
        {!salvando && salvo && <span style={styles.saveStatusOk}>✓ Resultado salvo</span>}
        {!salvando && erroSalvar && (
          <span style={styles.saveStatusErr}>Não deu pra salvar automaticamente</span>
        )}
      </div>
      <span style={styles.eyebrowSmall}>FECHAMENTO</span>
      <h1 style={styles.h1}>Seu Protocolo CLARO, resumido.</h1>
      <p style={styles.decisionEcho}>&ldquo;{contexto.assunto}&rdquo;</p>

      <div style={styles.unlockBox}>
        <span style={styles.unlockLabel}>SÍNTESE</span>
        {carregandoSintese ? (
          <p style={styles.unlockHow}>
            <span style={{ opacity: 0.6 }}>Gerando síntese pra sua situação específica…</span>
          </p>
        ) : (
          <>
            <p style={styles.unlockHow}>
              {sintese ||
                "O silêncio custa caro. Estruturar a conversa é o que separa impasse de decisão."}
            </p>
            {sintese && <span style={styles.aiTag}>✦ gerado pra sua situação</span>}
          </>
        )}
      </div>

      <div style={styles.fechamentoBox}>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>DECISÕES TOMADAS</span>
          <span style={styles.fechamentoValue}>{decisaoF7.decisoesTomadas || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>TEMAS PRA NOVA CONVERSA</span>
          <span style={styles.fechamentoValue}>{decisaoF7.temasNovaConversa || "—"}</span>
        </div>
      </div>

      <div style={styles.familiaList}>
        {planoF7
          .filter((a) => a.acao.trim())
          .map((a, i) => (
            <div key={a.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              <span style={styles.papelDescricao}>{a.acao}</span>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>RESPONSÁVEL</span>
                <span style={styles.fechamentoValue}>{a.responsavel || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>PRAZO</span>
                <span style={styles.fechamentoValue}>{a.prazo || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>STATUS</span>
                <span style={styles.fechamentoValue}>{a.status || "—"}</span>
              </div>
            </div>
          ))}
      </div>

      <div style={styles.ctaBox}>
        <p style={styles.ctaTitle}>Agora é executar, com acompanhamento.</p>
        <p style={styles.ctaSub}>
          Vocês contextualizaram, ouviram, alinharam interesses, resolveram divergências e
          organizaram próximos passos. O que falta agora é colocar em prática, e revisar em 30
          dias se os compromissos foram cumpridos.
        </p>
      </div>

      <p style={{ ...styles.papelDescricao, marginTop: 4 }} className="no-print">
        Um resumo desse resultado já foi enviado automaticamente pro consultor.
      </p>
      <div style={styles.finalButtonsRow} className="no-print">
        <button onClick={() => window.print()} style={styles.ctaButton}>
          🖨️ Baixar / imprimir PDF
        </button>
        <button onClick={onReiniciar} style={styles.restartButton}>
          ↺ Voltar ao início
        </button>
      </div>
    </div>
  );
}

const STEP_F8_SEMAFORO = 0;
const STEP_F8_RESULTADO = 1;
const STEP_F8_TEMAS_VERMELHOS = 2;
const STEP_F8_REFLEXAO = 3;
const STEP_F8_CONSOLIDACAO = 4;
const STEP_F8_DECISAO = 5;
const STEP_F8_PLANO = 6;
const STEP_F8_FECHAMENTO = 7;

function initTemasF8() {
  return TEMAS_SEMAFORO_F8.map((nome, i) => ({ id: i + 1, nome, cor: null, custom: false }));
}

const BRUNO_EXEMPLO_F8 = {
  temas: [
    { id: 1, nome: "Reconhecimento", cor: "amarelo", custom: false },
    { id: 2, nome: "Remuneração", cor: "verde", custom: false },
    { id: 3, nome: "Promoções", cor: "verde", custom: false },
    { id: 4, nome: "Participação societária", cor: "verde", custom: false },
    { id: 5, nome: "Entrada de familiares na empresa", cor: "amarelo", custom: false },
    { id: 6, nome: "Escolha de sucessores", cor: "vermelho", custom: false },
    { id: 7, nome: "Distribuição de dividendos", cor: "verde", custom: false },
    { id: 8, nome: "Conflitos antigos", cor: "amarelo", custom: false },
    { id: 9, nome: "Falta de comunicação", cor: "vermelho", custom: false },
    { id: 10, nome: "Decisões consideradas injustas", cor: "verde", custom: false },
  ],
  temasVermelhosDetalhe: [
    {
      id: 1,
      tema: "Escolha de sucessores",
      porque: "Nunca foi discutido abertamente entre nós dois, mesmo com decisões operacionais esbarrando nisso há dois anos.",
      conversa: "Conversa sobre o critério de escolha do sucessor, usando o Protocolo CLARO, não sobre a escolha em si.",
    },
    {
      id: 2,
      tema: "Falta de comunicação",
      porque: "A gente só conversa sobre operação, nunca sobre como cada um está se sentindo dentro da empresa.",
      conversa: "Um espaço regular, fora da pauta operacional, só pra alinhar expectativas.",
    },
  ],
  reflexaoF8: {
    temaChamouAtencao: "Ver que marquei 'Escolha de sucessores' de vermelho me surpreendeu — achei que já tinha aceitado.",
    ressentimentoSemSolucao: "A sensação de que fui preterido sem nunca ter sido consultado sobre o critério.",
    conversaEvitando: "Perguntar ao meu pai por que ele escolheu o Tiago, e não eu.",
    oQuePrecisoFazer: "Parar de esperar que alguém puxe esse assunto e marcar eu mesmo essa conversa.",
  },
  consolidacaoF8: [
    {
      id: 1,
      comportamento: "Um de nós via a escolha do sucessor como vermelha, o outro como verde.",
      motivo: "Vamos abrir uma conversa estruturada sobre o critério de escolha, pelo Protocolo CLARO.",
    },
  ],
  decisaoF8: {
    tratarImediatamente: "Escolha de sucessores — é o tema com maior diferença de percepção entre nós.",
    exigemPreparacao: "Falta de comunicação exige um formato novo de conversa, não só uma reunião a mais.",
    conversasAgendadas: "Conversa sobre o critério de escolha do sucessor, com facilitador externo, em 3 semanas.",
  },
  planoF8: [
    {
      id: 1,
      acao: "Agendar conversa pelo Protocolo CLARO sobre o critério de escolha do sucessor.",
      responsavel: "Facilitador externo",
      prazo: "30 dias",
      status: "Não iniciado",
    },
  ],
};

function Ferramenta8App({ onVoltarCatalogo, envioIdInicial }) {
  const [step, setStep] = useState(STEP_F8_SEMAFORO);
  const [temas, setTemas] = useState(initTemasF8());
  const [temasVermelhosDetalhe, setTemasVermelhosDetalhe] = useState([]);
  const [reflexaoF8, setReflexaoF8] = useState({
    temaChamouAtencao: "",
    ressentimentoSemSolucao: "",
    conversaEvitando: "",
    oQuePrecisoFazer: "",
  });
  const [consolidacaoF8, setConsolidacaoF8] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [decisaoF8, setDecisaoF8] = useState({
    tratarImediatamente: "",
    exigemPreparacao: "",
    conversasAgendadas: "",
  });
  const [planoF8, setPlanoF8] = useState([
    { id: 1, acao: "", responsavel: "", prazo: "", status: "Não iniciado" },
  ]);

  const temasClassificados = useMemo(() => temas.filter((t) => t.cor !== null), [temas]);
  const temasVermelhos = useMemo(() => temas.filter((t) => t.cor === "vermelho"), [temas]);
  const contagem = useMemo(
    () => ({
      verde: temas.filter((t) => t.cor === "verde").length,
      amarelo: temas.filter((t) => t.cor === "amarelo").length,
      vermelho: temas.filter((t) => t.cor === "vermelho").length,
    }),
    [temas]
  );

  const carregarExemploF8 = () => {
    setTemas(BRUNO_EXEMPLO_F8.temas);
    setTemasVermelhosDetalhe(BRUNO_EXEMPLO_F8.temasVermelhosDetalhe);
    setReflexaoF8(BRUNO_EXEMPLO_F8.reflexaoF8);
    setConsolidacaoF8(BRUNO_EXEMPLO_F8.consolidacaoF8);
    setDecisaoF8(BRUNO_EXEMPLO_F8.decisaoF8);
    setPlanoF8(BRUNO_EXEMPLO_F8.planoF8);
    setStep(STEP_F8_RESULTADO);
  };

  const canAdvance = () => {
    if (step === STEP_F8_SEMAFORO) return temasClassificados.length >= temas.length;
    if (step === STEP_F8_RESULTADO) return true;
    if (step === STEP_F8_TEMAS_VERMELHOS) {
      return temasVermelhos.length === 0 || temasVermelhosDetalhe.some((d) => d.porque.trim());
    }
    if (step === STEP_F8_REFLEXAO) {
      return (
        reflexaoF8.temaChamouAtencao.trim().length > 3 &&
        reflexaoF8.ressentimentoSemSolucao.trim().length > 3 &&
        reflexaoF8.conversaEvitando.trim().length > 3 &&
        reflexaoF8.oQuePrecisoFazer.trim().length > 3
      );
    }
    if (step === STEP_F8_CONSOLIDACAO) {
      return consolidacaoF8.some((c) => c.comportamento.trim() && c.motivo.trim());
    }
    if (step === STEP_F8_DECISAO) {
      return decisaoF8.tratarImediatamente.trim().length > 3;
    }
    if (step === STEP_F8_PLANO) {
      return planoF8.some(
        (a) => a.acao.trim().length > 3 && a.responsavel.trim().length > 0 && a.prazo.trim().length > 0
      );
    }
    return true;
  };

  const goNext = () => setStep((s) => Math.min(STEP_F8_FECHAMENTO, s + 1));
  const goBack = () => setStep((s) => Math.max(STEP_F8_SEMAFORO, s - 1));

  return (
    <>
      <Header8 step={step} onVoltarCatalogo={onVoltarCatalogo} />
      <div style={styles.body}>
        {step === STEP_F8_SEMAFORO && (
          <StepSemaforo temas={temas} setTemas={setTemas} onCarregarExemplo={carregarExemploF8} />
        )}
        {step === STEP_F8_RESULTADO && <StepResultadoF8 temas={temas} contagem={contagem} />}
        {step === STEP_F8_TEMAS_VERMELHOS && (
          <StepTemasVermelhos
            temasVermelhos={temasVermelhos}
            temasVermelhosDetalhe={temasVermelhosDetalhe}
            setTemasVermelhosDetalhe={setTemasVermelhosDetalhe}
          />
        )}
        {step === STEP_F8_REFLEXAO && (
          <StepReflexaoF8 reflexaoF8={reflexaoF8} setReflexaoF8={setReflexaoF8} contagem={contagem} />
        )}
        {step === STEP_F8_CONSOLIDACAO && (
          <StepConsolidacaoF8
            consolidacaoF8={consolidacaoF8}
            setConsolidacaoF8={setConsolidacaoF8}
            temasVermelhos={temasVermelhos}
          />
        )}
        {step === STEP_F8_DECISAO && <StepDecisaoF8 decisaoF8={decisaoF8} setDecisaoF8={setDecisaoF8} />}
        {step === STEP_F8_PLANO && (
          <StepPlanoF8 planoF8={planoF8} setPlanoF8={setPlanoF8} decisaoF8={decisaoF8} />
        )}
        {step === STEP_F8_FECHAMENTO && (
          <StepFechamentoF8
            temas={temas}
            contagem={contagem}
            decisaoF8={decisaoF8}
            planoF8={planoF8}
            onReiniciar={onVoltarCatalogo}
            envioId={envioIdInicial}
          />
        )}
      </div>
      {step < STEP_F8_FECHAMENTO && (
        <Footer
          step={step}
          canAdvance={canAdvance()}
          isLastQuadrante={false}
          isDesempate={false}
          isPenultimate={step === STEP_F8_PLANO}
          onBack={goBack}
          onNext={goNext}
        />
      )}
    </>
  );
}

function Header8({ step, onVoltarCatalogo }) {
  const labels = [
    "Semáforo dos temas",
    "Resultado",
    "Temas vermelhos",
    "Reflexão individual",
    "Consolidação familiar",
    "Decisão",
    "Plano de ação",
    "Fechamento",
  ];
  const progress = Math.round((step / STEP_F8_FECHAMENTO) * 100);
  return (
    <div style={styles.header} className="no-print">
      <div style={styles.headerTop}>
        <button onClick={onVoltarCatalogo} style={styles.backToCatalogo}>
          ← Catálogo
        </button>
        <span style={styles.stepLabel}>Semáforo dos Temas Sensíveis · {labels[step]}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

function StepSemaforo({ temas, setTemas, onCarregarExemplo }) {
  const [novoTema, setNovoTema] = useState("");
  const setCor = (id, cor) => setTemas((prev) => prev.map((t) => (t.id === id ? { ...t, cor } : t)));
  const addTemaCustom = () => {
    if (!novoTema.trim()) return;
    setTemas((prev) => [...prev, { id: (prev[prev.length - 1]?.id || 0) + 1, nome: novoTema.trim(), cor: null, custom: true }]);
    setNovoTema("");
  };
  const removeTema = (id) => setTemas((prev) => prev.filter((t) => t.id !== id));

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 1 DE 7 · SEMÁFORO DOS TEMAS</span>
      <h1 style={styles.h1}>Quais assuntos ainda estão presentes, mesmo sem ninguém falar deles?</h1>
      <p style={styles.lead}>
        Reflita sozinho sobre cada tema e marque a cor que melhor descreve como ele está hoje pra
        você — não como você acha que os outros veem. Isso é confidencial, ninguém vai punir você
        por marcar vermelho; essa é a informação mais valiosa da ferramenta.
      </p>

      <div style={styles.demoLinksRow}>
        <button onClick={onCarregarExemplo} style={styles.demoLink}>
          ⚡ Exemplo: Bruno, Família Rangel (caso do livro)
        </button>
      </div>

      <div style={styles.familiaList}>
        {temas.map((t) => (
          <div key={t.id} style={styles.padraoCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{t.nome}</span>
              {t.custom && (
                <button onClick={() => removeTema(t.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <div style={styles.envioButtonsRow}>
              {Object.entries(CORES_SEMAFORO_F8).map(([key, c]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCor(t.id, key)}
                  style={{
                    ...styles.semaforoBotao,
                    borderColor: t.cor === key ? c.cor : "#E4EAF0",
                    background: t.cor === key ? c.cor : "#fff",
                    color: t.cor === key ? "#fff" : "#5A6B7A",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.envioButtonsRow}>
        <input
          style={{ ...styles.input, flex: "1 1 200px" }}
          value={novoTema}
          onChange={(e) => setNovoTema(e.target.value)}
          placeholder="Adicionar outro tema (opcional)"
        />
        <button onClick={addTemaCustom} type="button" style={styles.demoLink}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}

function StepResultadoF8({ temas, contagem }) {
  const [insight, setInsight] = useState(null);
  const [gerando, setGerando] = useState(false);

  const gerarInsight = () => {
    setGerando(true);
    setInsight(null);
    const resumo = temas.map((t) => `${t.nome}: ${t.cor}`).join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F8}\n\n` +
      `Alguém preencheu o Semáforo dos Temas Sensíveis. Classificações: ${resumo}. ` +
      `Contagem: ${contagem.verde} verdes, ${contagem.amarelo} amarelos, ${contagem.vermelho} vermelhos.\n\n` +
      `Escreva um parágrafo curto (3-4 frases, no máximo 80 palavras) comentando o padrão geral ` +
      `(não é sobre quantidade de vermelhos, é sobre disposição de tratar o que apareceu), ` +
      `inspirando-se, sem citar nomes, no padrão de algum dos três casos reais do método. Tom ` +
      `direto, acolhedor, sem clichês. Responda só com o texto, sem introdução, em português do ` +
      `Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => setInsight(texto))
      .catch(() => setInsight("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 2 DE 7 · RESULTADO</span>
      <h1 style={styles.h1}>Seu painel de temas, cor por cor.</h1>
      <p style={styles.lead}>
        A quantidade de vermelhos importa menos do que parece — o que importa é a disposição de
        tratá-los. O dado mais revelador costuma ser a diferença entre como cada pessoa da família
        vê o mesmo tema, não o vermelho isolado.
      </p>

      <div style={styles.resumoGrid}>
        {Object.entries(CORES_SEMAFORO_F8).map(([key, c]) => (
          <div key={key} style={styles.resumoCard}>
            <div style={{ ...styles.resumoBar, background: c.cor }} />
            <div style={styles.resumoCardInner}>
              <span style={styles.resumoName}>{c.label}</span>
              <span style={{ ...styles.icsPainelNumero, fontSize: 28, color: c.cor }}>{contagem[key]}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.familiaList}>
        {temas.map((t) => (
          <div key={t.id} style={styles.padraoCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{t.nome}</span>
              <span
                style={{
                  ...styles.ferramentaAtiva,
                  color: "#fff",
                  background: t.cor ? CORES_SEMAFORO_F8[t.cor].cor : "#B0BAC4",
                  padding: "3px 10px",
                  borderRadius: 6,
                }}
              >
                {t.cor ? CORES_SEMAFORO_F8[t.cor].label : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!insight && (
        <button onClick={gerarInsight} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando leitura…" : "✦ O que esse painel pode significar"}
        </button>
      )}
      {insight && (
        <div style={styles.unlockBox}>
          <span style={styles.unlockLabel}>LEITURA DO PAINEL</span>
          <p style={styles.unlockHow}>{insight}</p>
          <span style={styles.aiTag}>✦ gerado pra sua situação</span>
        </div>
      )}
    </div>
  );
}

function StepTemasVermelhos({ temasVermelhos, temasVermelhosDetalhe, setTemasVermelhosDetalhe }) {
  useEffect(() => {
    if (temasVermelhos.length === 0) return;
    setTemasVermelhosDetalhe((prev) => {
      const existentes = new Set(prev.map((d) => d.tema));
      const novos = temasVermelhos
        .filter((t) => !existentes.has(t.nome))
        .map((t, i) => ({ id: (prev[prev.length - 1]?.id || 0) + i + 1, tema: t.nome, porque: "", conversa: "" }));
      return novos.length > 0 ? [...prev, ...novos] : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temasVermelhos.length]);

  const set = (id, field, val) =>
    setTemasVermelhosDetalhe((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: val } : d)));

  if (temasVermelhos.length === 0) {
    return (
      <div style={styles.stepWrap}>
        <span style={styles.eyebrowSmall}>PASSO 3 DE 7 · TEMAS VERMELHOS</span>
        <h1 style={styles.h1}>Nenhum tema marcado como vermelho — ótimo sinal.</h1>
        <p style={styles.lead}>
          Se isso mudar numa próxima rodada, volte aqui pra detalhar por que o tema importa e qual
          conversa precisa acontecer.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 3 DE 7 · TEMAS VERMELHOS</span>
      <h1 style={styles.h1}>Pra cada tema vermelho, o que está por trás dele?</h1>
      <p style={styles.lead}>
        Detalhe por que cada tema importa e qual conversa precisa acontecer pra tratá-lo —
        provavelmente usando o Protocolo CLARO.
      </p>

      <div style={styles.familiaList}>
        {temasVermelhosDetalhe.map((d) => (
          <div key={d.id} style={styles.padraoCard}>
            <span style={{ ...styles.papelNome, color: CORES_SEMAFORO_F8.vermelho.cor }}>{d.tema}</span>
            <label style={styles.fieldLabel}>Por que é importante?</label>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={d.porque}
              onChange={(e) => set(d.id, "porque", e.target.value)}
              placeholder="Ex.: nunca foi discutido abertamente entre os envolvidos"
            />
            <label style={styles.fieldLabel}>Qual conversa precisa acontecer?</label>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={d.conversa}
              onChange={(e) => set(d.id, "conversa", e.target.value)}
              placeholder="Ex.: conversa sobre o critério de escolha, usando o Protocolo CLARO"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepReflexaoF8({ reflexaoF8, setReflexaoF8, contagem }) {
  const set = (field) => (e) => setReflexaoF8((r) => ({ ...r, [field]: e.target.value }));
  const contexto = `${contagem.vermelho} tema(s) marcado(s) como vermelho, ${contagem.amarelo} como amarelo`;

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 4 DE 7 · REFLEXÃO INDIVIDUAL</span>
      <h1 style={styles.h1}>Sozinho, depois de preencher o semáforo.</h1>
      <p style={styles.lead}>
        Ninguém além de você vai ler isso agora. Escreva o que for verdade, não o que soa bem de
        dizer em família.
      </p>

      <CampoReflexao
        pergunta="Qual tema me chamou mais atenção?"
        valor={reflexaoF8.temaChamouAtencao}
        onChange={set("temaChamouAtencao")}
        placeholder="O tema que mais surpreendeu você ao ver a própria lista completa…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F8}
      />
      <CampoReflexao
        pergunta="Qual ressentimento permanece sem solução?"
        valor={reflexaoF8.ressentimentoSemSolucao}
        onChange={set("ressentimentoSemSolucao")}
        placeholder="Um tema que, mesmo depois de anos, você sente que ainda pesa…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F8}
      />
      <CampoReflexao
        pergunta="Que conversa estou evitando?"
        valor={reflexaoF8.conversaEvitando}
        onChange={set("conversaEvitando")}
        placeholder="Uma conversa específica que você sabe que precisa acontecer, mas ainda adia…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F8}
      />
      <CampoReflexao
        pergunta="O que preciso fazer pra contribuir com a solução?"
        valor={reflexaoF8.oQuePrecisoFazer}
        onChange={set("oQuePrecisoFazer")}
        placeholder="Uma ação concreta, da sua parte, que ajudaria a destravar pelo menos um tema…"
        contexto={contexto}
        contextoLivro={LIVRO_CONTEXTO_F8}
      />
    </div>
  );
}

function StepConsolidacaoF8({ consolidacaoF8, setConsolidacaoF8, temasVermelhos }) {
  const [script, setScript] = useState(null);
  const [gerando, setGerando] = useState(false);

  const prepararConversa = () => {
    setGerando(true);
    setScript(null);
    const resumo = temasVermelhos.map((t) => t.nome).join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F8}\n\n` +
      `Você ajuda alguém que preencheu o Semáforo dos Temas Sensíveis a se preparar pra ` +
      `Consolidação Familiar. Temas marcados como vermelho: ${resumo || "nenhum"}.\n\n` +
      `Sugira 2-3 frases curtas de abertura pra essa pessoa compartilhar isso em família, ` +
      `deixando claro que o semáforo serve pra mapear, não pra acusar. Formate como lista curta. ` +
      `Responda só com as frases, sem introdução, em português do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => setScript(texto))
      .catch(() => setScript("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 5 DE 7 · CONSOLIDAÇÃO FAMILIAR</span>
      <h1 style={styles.h1}>Reúnam-se e compartilhem os temas identificados.</h1>
      <p style={styles.lead}>
        Registrem, na coluna Impacto, o que cada descoberta muda na forma como a família pretende
        lidar com esses assuntos.
      </p>

      {!script && (
        <button onClick={prepararConversa} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando sugestão…" : "✦ Preciso de ajuda para começar a conversa"}
        </button>
      )}
      {script && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ sugestão gerada pra sua situação</span>
          <p style={styles.scriptText}>{script}</p>
        </div>
      )}

      <TabelaComportamentos
        titulo="Descobertas e impactos"
        linhas={consolidacaoF8}
        setLinhas={setConsolidacaoF8}
        labelComportamento="DESCOBERTA"
        labelMotivo="IMPACTO"
        placeholderComportamento="Ex.: um via a escolha do sucessor como vermelha, o outro como verde"
        placeholderMotivo="Ex.: vamos abrir uma conversa estruturada sobre o critério de escolha"
      />
    </div>
  );
}

function StepDecisaoF8({ decisaoF8, setDecisaoF8 }) {
  const set = (field) => (e) => setDecisaoF8((d) => ({ ...d, [field]: e.target.value }));
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 6 DE 7 · DECISÃO</span>
      <h1 style={styles.h1}>Feche o processo respondendo, como família.</h1>
      <p style={styles.lead}>
        Não dá pra tratar tudo de uma vez — escolha por onde começar.
      </p>

      <label style={styles.fieldLabel}>Quais temas serão tratados imediatamente?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF8.tratarImediatamente}
        onChange={set("tratarImediatamente")}
        placeholder="Temas vermelhos escolhidos como prioridade para as próximas semanas…"
      />
      <label style={styles.fieldLabel}>Quais temas exigem preparação adicional?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF8.exigemPreparacao}
        onChange={set("exigemPreparacao")}
        placeholder="Temas que precisam de mais tempo, dados ou apoio externo antes da conversa…"
      />
      <label style={styles.fieldLabel}>Quais conversas serão agendadas?</label>
      <textarea
        style={styles.textareaSmall}
        rows={2}
        value={decisaoF8.conversasAgendadas}
        onChange={set("conversasAgendadas")}
        placeholder="Conversas específicas, com data prevista, decorrentes desta avaliação…"
      />
    </div>
  );
}

function StepPlanoF8({ planoF8, setPlanoF8, decisaoF8 }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  const addAcao = () =>
    setPlanoF8((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, acao: "", responsavel: "", prazo: "", status: "Não iniciado" },
    ]);
  const removeAcao = (id) => setPlanoF8((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setPlanoF8((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirAcoes = () => {
    setGerando(true);
    setErro(false);
    const prompt =
      `${LIVRO_CONTEXTO_F8}\n\n` +
      `Você ajuda alguém que já preencheu o Semáforo dos Temas Sensíveis a transformar a decisão ` +
      `em um plano de ação.\n` +
      `${decisaoF8.tratarImediatamente ? `- Temas a tratar imediatamente: "${decisaoF8.tratarImediatamente}"\n` : ""}` +
      `${decisaoF8.conversasAgendadas ? `- Conversas a agendar: "${decisaoF8.conversasAgendadas}"\n` : ""}\n` +
      `Sugira 2 ações em sequência cronológica, cada uma no infinitivo, com responsável e prazo.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"acao":"","responsavel":"","prazo":""},{"acao":"","responsavel":"","prazo":""}]`;

    callClaude(prompt, 350)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlanoF8(
            parsed.map((a, i) => ({
              id: i + 1,
              acao: a.acao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
              status: "Não iniciado",
            }))
          );
        }
      })
      .catch(() => setErro(true))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 7 DE 7 · PLANO DE AÇÃO</span>
      <h1 style={styles.h1}>Transforme a decisão em ações, com status de acompanhamento.</h1>
      <p style={styles.lead}>
        Cada ação tem um status — volte aqui daqui a alguns dias e atualize.
      </p>

      <button onClick={sugerirAcoes} disabled={gerando} style={styles.demoLink}>
        {gerando ? "Gerando sugestões…" : "✦ Sugerir ações"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {planoF8.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              {planoF8.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.acao}
              onChange={(e) => setAcao(a.id, "acao", e.target.value)}
              placeholder="Ex.: agendar conversa CLARO sobre escolha do sucessor…"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: 30 dias"
                />
              </div>
            </div>
            <label style={styles.fieldLabel}>Status</label>
            <div style={styles.envioButtonsRow}>
              {STATUS_ACAO_F7.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAcao(a.id, "status", s)}
                  style={{
                    ...styles.geracaoOption,
                    borderColor: a.status === s ? BLUE : "#E4EAF0",
                    background: a.status === s ? "#EAF2FB" : "#fff",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra ação
      </button>
    </div>
  );
}

function StepFechamentoF8({ temas, contagem, decisaoF8, planoF8, onReiniciar, envioId }) {
  const [salvando, setSalvando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);
  const [sintese, setSintese] = useState(null);
  const [carregandoSintese, setCarregandoSintese] = useState(false);

  const temasVermelhos = temas.filter((t) => t.cor === "vermelho");

  useEffect(() => {
    let cancelado = false;
    setSalvando(true);
    setErroSalvar(false);

    supabaseInsert("respostas", {
      envio_id: envioId || null,
      ferramenta_numero: 8,
      notas: { temas: temas.map((t) => ({ nome: t.nome, cor: t.cor })), contagem },
      conflito: { temasVermelhos: temasVermelhos.map((t) => t.nome) },
      decisao_final: decisaoF8,
      plano_acao: planoF8,
    })
      .then(() => {
        if (!cancelado) setSalvo(true);
      })
      .catch(() => {
        if (!cancelado) setErroSalvar(true);
      })
      .finally(() => {
        if (!cancelado) setSalvando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCarregandoSintese(true);
    const resumo = temasVermelhos.map((t) => t.nome).join(", ") || "nenhum tema vermelho";
    const prompt =
      `${LIVRO_CONTEXTO_F8}\n\n` +
      `Alguém completou o Semáforo dos Temas Sensíveis. ${contagem.verde} verdes, ` +
      `${contagem.amarelo} amarelos, ${contagem.vermelho} vermelhos. Temas vermelhos: ${resumo}.` +
      `${decisaoF8.tratarImediatamente ? ` Vão tratar imediatamente: "${decisaoF8.tratarImediatamente}".` : ""}\n\n` +
      `Escreva um parágrafo curto de fechamento (3-4 frases, no máximo 80 palavras) que amarre ` +
      `isso numa síntese concreta e acolhedora, reforçando que a quantidade de vermelhos importa ` +
      `menos que a disposição de tratá-los. Tom direto, sem clichês de autoajuda. Responda só com ` +
      `o texto, sem introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setSintese(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoSintese(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const montarResumo = () => {
    const linhas = [
      "Semáforo dos Temas Sensíveis",
      "",
      `Verde: ${contagem.verde} · Amarelo: ${contagem.amarelo} · Vermelho: ${contagem.vermelho}`,
      `Temas vermelhos: ${temasVermelhos.map((t) => t.nome).join(", ") || "—"}`,
      "",
      sintese ? `Síntese: ${sintese}` : null,
      sintese ? "" : null,
      `Tratar imediatamente: ${decisaoF8.tratarImediatamente || "—"}`,
      `Exigem preparação: ${decisaoF8.exigemPreparacao || "—"}`,
      `Conversas agendadas: ${decisaoF8.conversasAgendadas || "—"}`,
      "",
      "Plano de ação:",
      planoF8
        .filter((a) => a.acao.trim())
        .map(
          (a, i) =>
            `${i + 1}. ${a.acao} — Responsável: ${a.responsavel || "—"} — Prazo: ${a.prazo || "—"} — Status: ${a.status || "—"}`
        )
        .join("\n") || "—",
    ].filter((l) => l !== null);
    return linhas.join("\n");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      notifyConsultor("Nosso resultado — Semáforo dos Temas Sensíveis", montarResumo());
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stepWrap}>
      <div style={styles.saveStatus}>
        {salvando && <span style={styles.saveStatusText}>Salvando seu resultado…</span>}
        {!salvando && salvo && <span style={styles.saveStatusOk}>✓ Resultado salvo</span>}
        {!salvando && erroSalvar && (
          <span style={styles.saveStatusErr}>Não deu pra salvar automaticamente</span>
        )}
      </div>
      <span style={styles.eyebrowSmall}>FECHAMENTO</span>
      <h1 style={styles.h1}>Seu Semáforo dos Temas Sensíveis, resumido.</h1>

      <div style={styles.resumoGrid}>
        {Object.entries(CORES_SEMAFORO_F8).map(([key, c]) => (
          <div key={key} style={styles.resumoCard}>
            <div style={{ ...styles.resumoBar, background: c.cor }} />
            <div style={styles.resumoCardInner}>
              <span style={styles.resumoName}>{c.label}</span>
              <span style={{ ...styles.icsPainelNumero, fontSize: 28, color: c.cor }}>{contagem[key]}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.unlockBox}>
        <span style={styles.unlockLabel}>SÍNTESE</span>
        {carregandoSintese ? (
          <p style={styles.unlockHow}>
            <span style={{ opacity: 0.6 }}>Gerando síntese pra sua situação específica…</span>
          </p>
        ) : (
          <>
            <p style={styles.unlockHow}>
              {sintese ||
                "A quantidade de temas vermelhos importa menos do que a disposição da família pra tratá-los."}
            </p>
            {sintese && <span style={styles.aiTag}>✦ gerado pra sua situação</span>}
          </>
        )}
      </div>

      <div style={styles.fechamentoBox}>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>TRATAR IMEDIATAMENTE</span>
          <span style={styles.fechamentoValue}>{decisaoF8.tratarImediatamente || "—"}</span>
        </div>
        <div style={styles.fechamentoRow}>
          <span style={styles.fechamentoLabel}>CONVERSAS AGENDADAS</span>
          <span style={styles.fechamentoValue}>{decisaoF8.conversasAgendadas || "—"}</span>
        </div>
      </div>

      <div style={styles.familiaList}>
        {planoF8
          .filter((a) => a.acao.trim())
          .map((a, i) => (
            <div key={a.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              <span style={styles.papelDescricao}>{a.acao}</span>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>RESPONSÁVEL</span>
                <span style={styles.fechamentoValue}>{a.responsavel || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>PRAZO</span>
                <span style={styles.fechamentoValue}>{a.prazo || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>STATUS</span>
                <span style={styles.fechamentoValue}>{a.status || "—"}</span>
              </div>
            </div>
          ))}
      </div>

      <div style={styles.ctaBox}>
        <p style={styles.ctaTitle}>Agora é executar, com acompanhamento.</p>
        <p style={styles.ctaSub}>
          Vocês mapearam os temas, refletiram sozinhos, consolidaram em família, decidiram e
          planejaram. O que falta agora é colocar em prática, e revisitar em 60 dias se os temas
          vermelhos tratados de fato mudaram de cor.
        </p>
      </div>

      <p style={{ ...styles.papelDescricao, marginTop: 4 }} className="no-print">
        Um resumo desse resultado já foi enviado automaticamente pro consultor.
      </p>
      <div style={styles.finalButtonsRow} className="no-print">
        <button onClick={() => window.print()} style={styles.ctaButton}>
          🖨️ Baixar / imprimir PDF
        </button>
        <button onClick={onReiniciar} style={styles.restartButton}>
          ↺ Voltar ao início
        </button>
      </div>
    </div>
  );
}

const STEP_F9_PARTICIPANTES = 0;
const STEP_F9_RELACOES = 1;
const STEP_F9_RUIDOS = 2;
const STEP_F9_TEMAS = 3;
const STEP_F9_SOCIOGRAMA = 4;
const STEP_F9_CONSOLIDACAO = 5;
const STEP_F9_PLANO = 6;
const STEP_F9_FECHAMENTO = 7;

const PRADO_EXEMPLO_F9 = {
  participantes: [
    { id: 1, nome: "Pai (fundador)", familia: true, empresa: false, propriedade: true, influencia: 5, observacoes: "Formalmente afastado, mas ainda é o canal entre as filhas." },
    { id: 2, nome: "Filha A", familia: true, empresa: true, propriedade: true, influencia: 4, observacoes: "" },
    { id: 3, nome: "Filha B", familia: true, empresa: true, propriedade: true, influencia: 4, observacoes: "" },
  ],
  relacoes: [
    { id: 1, pessoa1Id: 1, pessoa2Id: 2, tipo: "saudavel", frequencia: "Diária", confianca: "Alta", observacoes: "" },
    { id: 2, pessoa1Id: 1, pessoa2Id: 3, tipo: "saudavel", frequencia: "Diária", confianca: "Alta", observacoes: "" },
    { id: 3, pessoa1Id: 2, pessoa2Id: 3, tipo: "inexistente", frequencia: "Rara", confianca: "Baixa", observacoes: "Só se comunicam através do pai." },
  ],
  ruidos: [
    {
      id: 1,
      relacaoAfetada: "Pai, Filha A e Filha B",
      tipoRuido: "Triangulação",
      descricao: "As duas irmãs só se comunicam através do pai, que repassa mensagens de uma pra outra.",
      impacto: "Decisões atrasadas e mensagens distorcidas sem querer no meio do caminho.",
    },
  ],
  temasNaoConversados: [
    {
      id: 1,
      tema: "Como será a comunicação entre nós duas quando o pai não estiver mais no meio",
      quemEvita: "As duas filhas",
      motivo: "Nunca foi preciso conversar diretamente, o hábito sempre foi passar pelo pai.",
      impacto: "Risco real de a comunicação parar de existir quando o pai se afastar de vez.",
    },
  ],
  consolidacaoF9: [
    {
      id: 1,
      comportamento: "As duas irmãs não tinham um problema entre si, tinham um hábito de conversar através do pai.",
      motivo: "Vamos criar uma reunião mensal direta entre as duas, sem intermediação.",
    },
  ],
  planoF9: [
    {
      id: 1,
      acao: "Criar uma reunião mensal direta entre as duas irmãs, com pauta fixa de assuntos operacionais.",
      responsavel: "Filha A e Filha B",
      prazo: "30 dias",
      status: "Não iniciado",
    },
  ],
};

function Ferramenta9App({ onVoltarCatalogo, envioIdInicial }) {
  const [step, setStep] = useState(STEP_F9_PARTICIPANTES);
  const [participantes, setParticipantes] = useState([
    { id: 1, nome: "", familia: false, empresa: false, propriedade: false, influencia: 3, observacoes: "" },
  ]);
  const [relacoes, setRelacoes] = useState([
    { id: 1, pessoa1Id: null, pessoa2Id: null, tipo: "saudavel", frequencia: "", confianca: "", observacoes: "" },
  ]);
  const [ruidos, setRuidos] = useState([
    { id: 1, relacaoAfetada: "", tipoRuido: "Triangulação", descricao: "", impacto: "" },
  ]);
  const [temasNaoConversados, setTemasNaoConversados] = useState([
    { id: 1, tema: "", quemEvita: "", motivo: "", impacto: "" },
  ]);
  const [consolidacaoF9, setConsolidacaoF9] = useState([{ id: 1, comportamento: "", motivo: "" }]);
  const [planoF9, setPlanoF9] = useState([
    { id: 1, acao: "", responsavel: "", prazo: "", status: "Não iniciado" },
  ]);

  const participantesPreenchidos = useMemo(() => participantes.filter((p) => p.nome.trim()), [participantes]);

  const carregarExemploF9 = () => {
    setParticipantes(PRADO_EXEMPLO_F9.participantes);
    setRelacoes(PRADO_EXEMPLO_F9.relacoes);
    setRuidos(PRADO_EXEMPLO_F9.ruidos);
    setTemasNaoConversados(PRADO_EXEMPLO_F9.temasNaoConversados);
    setConsolidacaoF9(PRADO_EXEMPLO_F9.consolidacaoF9);
    setPlanoF9(PRADO_EXEMPLO_F9.planoF9);
    setStep(STEP_F9_SOCIOGRAMA);
  };

  const canAdvance = () => {
    if (step === STEP_F9_PARTICIPANTES) return participantesPreenchidos.length >= 2;
    if (step === STEP_F9_RELACOES) {
      return relacoes.some((r) => r.pessoa1Id && r.pessoa2Id && r.pessoa1Id !== r.pessoa2Id);
    }
    if (step === STEP_F9_RUIDOS) return true;
    if (step === STEP_F9_TEMAS) return true;
    if (step === STEP_F9_SOCIOGRAMA) return true;
    if (step === STEP_F9_CONSOLIDACAO) {
      return consolidacaoF9.some((c) => c.comportamento.trim() && c.motivo.trim());
    }
    if (step === STEP_F9_PLANO) {
      return planoF9.some(
        (a) => a.acao.trim().length > 3 && a.responsavel.trim().length > 0 && a.prazo.trim().length > 0
      );
    }
    return true;
  };

  const goNext = () => setStep((s) => Math.min(STEP_F9_FECHAMENTO, s + 1));
  const goBack = () => setStep((s) => Math.max(STEP_F9_PARTICIPANTES, s - 1));

  return (
    <>
      <Header9 step={step} onVoltarCatalogo={onVoltarCatalogo} />
      <div style={styles.body}>
        {step === STEP_F9_PARTICIPANTES && (
          <StepParticipantesF9
            participantes={participantes}
            setParticipantes={setParticipantes}
            onCarregarExemplo={carregarExemploF9}
          />
        )}
        {step === STEP_F9_RELACOES && (
          <StepRelacoesF9
            relacoes={relacoes}
            setRelacoes={setRelacoes}
            participantesPreenchidos={participantesPreenchidos}
          />
        )}
        {step === STEP_F9_RUIDOS && <StepRuidosF9 ruidos={ruidos} setRuidos={setRuidos} />}
        {step === STEP_F9_TEMAS && (
          <StepTemasNaoConversados
            temasNaoConversados={temasNaoConversados}
            setTemasNaoConversados={setTemasNaoConversados}
          />
        )}
        {step === STEP_F9_SOCIOGRAMA && (
          <StepSociograma participantes={participantesPreenchidos} relacoes={relacoes} ruidos={ruidos} />
        )}
        {step === STEP_F9_CONSOLIDACAO && (
          <StepConsolidacaoF9 consolidacaoF9={consolidacaoF9} setConsolidacaoF9={setConsolidacaoF9} />
        )}
        {step === STEP_F9_PLANO && <StepPlanoF9_2 planoF9={planoF9} setPlanoF9={setPlanoF9} />}
        {step === STEP_F9_FECHAMENTO && (
          <StepFechamentoF9
            participantesPreenchidos={participantesPreenchidos}
            relacoes={relacoes}
            ruidos={ruidos}
            planoF9={planoF9}
            onReiniciar={onVoltarCatalogo}
            envioId={envioIdInicial}
          />
        )}
      </div>
      {step < STEP_F9_FECHAMENTO && (
        <Footer
          step={step}
          canAdvance={canAdvance()}
          isLastQuadrante={false}
          isDesempate={false}
          isPenultimate={step === STEP_F9_PLANO}
          onBack={goBack}
          onNext={goNext}
        />
      )}
    </>
  );
}

function Header9({ step, onVoltarCatalogo }) {
  const labels = [
    "Mapeamento dos participantes",
    "Mapa das relações",
    "Ruídos identificados",
    "Temas não conversados",
    "Sociograma familiar",
    "Consolidação familiar",
    "Plano de ação",
    "Fechamento",
  ];
  const progress = Math.round((step / STEP_F9_FECHAMENTO) * 100);
  return (
    <div style={styles.header} className="no-print">
      <div style={styles.headerTop}>
        <button onClick={onVoltarCatalogo} style={styles.backToCatalogo}>
          ← Catálogo
        </button>
        <span style={styles.stepLabel}>Mapa de Ruídos Relacionais · {labels[step]}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

function StepParticipantesF9({ participantes, setParticipantes, onCarregarExemplo }) {
  const [gerandoId, setGerandoId] = useState(null);

  const add = () =>
    setParticipantes((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, nome: "", familia: false, empresa: false, propriedade: false, influencia: 3, observacoes: "" },
    ]);
  const remove = (id) => setParticipantes((prev) => prev.filter((p) => p.id !== id));
  const set = (id, field, val) =>
    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)));

  const sugerirObservacao = (p) => {
    if (!p.nome.trim()) return;
    setGerandoId(p.id);
    const dimensoes = [p.familia && "família", p.empresa && "empresa", p.propriedade && "propriedade"]
      .filter(Boolean)
      .join(", ");
    const prompt =
      `${LIVRO_CONTEXTO_F9}\n\n` +
      `Você ajuda alguém a preencher o Mapeamento dos Participantes do Mapa de Ruídos ` +
      `Relacionais. Participante: "${p.nome}". Dimensões: ${dimensoes || "não marcadas"}. ` +
      `Influência (1-5): ${p.influencia}.\n\n` +
      `Sugira uma observação curta e plausível (no máximo 20 palavras) sobre o papel dessa ` +
      `pessoa no sistema de comunicação da família, no estilo do exemplo do livro ("maior ` +
      `influência prática do que o próprio sucessor"). Isso é só um rascunho pra pessoa editar ` +
      `ou substituir pela realidade dela. Responda só com a frase, sem aspas, sem introdução, em ` +
      `português do Brasil.`;

    callClaude(prompt, 80)
      .then((texto) => set(p.id, "observacoes", texto.trim()))
      .catch(() => {})
      .finally(() => setGerandoId(null));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 1 DE 7 · MAPEAMENTO DOS PARTICIPANTES</span>
      <h1 style={styles.h1}>Quem participa, influencia ou é impactado pelas decisões?</h1>
      <p style={styles.lead}>
        Liste família, empresa, propriedade e outros (conselheiros, mentores) — mesmo quem não
        ocupa um cargo formal de destaque. Não faça isso sozinho: cruze com a percepção de outros
        participantes depois.
      </p>

      <div style={styles.demoLinksRow}>
        <button onClick={onCarregarExemplo} style={styles.demoLink}>
          ⚡ Exemplo: Família Prado (caso do livro)
        </button>
      </div>

      <div style={styles.familiaList}>
        {participantes.map((p) => (
          <div key={p.id} style={styles.padraoCard}>
            <div style={styles.timelineTopRow}>
              <input
                style={{ ...styles.input, flex: "1 1 200px" }}
                value={p.nome}
                onChange={(e) => set(p.id, "nome", e.target.value)}
                placeholder="Nome ou papel (ex.: diretor executivo)"
              />
              {participantes.length > 1 && (
                <button onClick={() => remove(p.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <label style={styles.fieldLabel}>Dimensões (marque todas que se aplicam)</label>
            <div style={styles.envioButtonsRow}>
              {[
                ["familia", "Família"],
                ["empresa", "Empresa"],
                ["propriedade", "Propriedade"],
              ].map(([campo, label]) => (
                <button
                  key={campo}
                  type="button"
                  onClick={() => set(p.id, campo, !p[campo])}
                  style={{
                    ...styles.geracaoOption,
                    borderColor: p[campo] ? BLUE : "#E4EAF0",
                    background: p[campo] ? "#EAF2FB" : "#fff",
                  }}
                >
                  {p[campo] ? "✓ " : ""}
                  {label}
                </button>
              ))}
            </div>
            <LinhaScore label="Influência (1 a 5)" valor={p.influencia} onChange={(n) => set(p.id, "influencia", n || 1)} max={5} />
            <div style={styles.timelineTopRow}>
              <input
                style={{ ...styles.input, flex: "1 1 200px" }}
                value={p.observacoes}
                onChange={(e) => set(p.id, "observacoes", e.target.value)}
                placeholder="Observações (opcional)"
              />
              <button
                onClick={() => sugerirObservacao(p)}
                disabled={!p.nome.trim() || gerandoId === p.id}
                style={styles.enviarCardLink}
                type="button"
              >
                {gerandoId === p.id ? "Gerando…" : "✦ Sugerir"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} type="button" style={styles.demoLink}>
        + Adicionar participante
      </button>
    </div>
  );
}

function StepRelacoesF9({ relacoes, setRelacoes, participantesPreenchidos }) {
  const add = () =>
    setRelacoes((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, pessoa1Id: null, pessoa2Id: null, tipo: "saudavel", frequencia: "", confianca: "", observacoes: "" },
    ]);
  const remove = (id) => setRelacoes((prev) => prev.filter((r) => r.id !== id));
  const set = (id, field, val) =>
    setRelacoes((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 2 DE 7 · MAPA DAS RELAÇÕES</span>
      <h1 style={styles.h1}>Como é a comunicação real entre cada dupla?</h1>
      <p style={styles.lead}>
        Pra cada relação relevante, classifique o tipo de comunicação — pra além da aparência das
        interações formais.
      </p>

      <div style={styles.familiaList}>
        {relacoes.map((r) => (
          <div key={r.id} style={styles.padraoCard}>
            <div style={styles.timelineTopRow}>
              <select
                style={{ ...styles.input, flex: "1 1 150px" }}
                value={r.pessoa1Id ?? ""}
                onChange={(e) => set(r.id, "pessoa1Id", Number(e.target.value) || null)}
              >
                <option value="">Pessoa 1</option>
                {participantesPreenchidos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <span style={styles.padraoInterpretacao}>↔</span>
              <select
                style={{ ...styles.input, flex: "1 1 150px" }}
                value={r.pessoa2Id ?? ""}
                onChange={(e) => set(r.id, "pessoa2Id", Number(e.target.value) || null)}
              >
                <option value="">Pessoa 2</option>
                {participantesPreenchidos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              {relacoes.length > 1 && (
                <button onClick={() => remove(r.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <label style={styles.fieldLabel}>Tipo de Comunicação</label>
            <div style={styles.envioButtonsRow}>
              {Object.entries(TIPOS_COMUNICACAO_F9).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set(r.id, "tipo", key)}
                  style={{
                    ...styles.semaforoBotao,
                    borderColor: r.tipo === key ? t.cor : "#E4EAF0",
                    background: r.tipo === key ? t.cor : "#fff",
                    color: r.tipo === key ? "#fff" : "#5A6B7A",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Frequência</label>
                <div style={styles.envioButtonsRow}>
                  {FREQUENCIAS_F9.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => set(r.id, "frequencia", f)}
                      style={{
                        ...styles.geracaoOption,
                        borderColor: r.frequencia === f ? BLUE : "#E4EAF0",
                        background: r.frequencia === f ? "#EAF2FB" : "#fff",
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Confiança</label>
                <div style={styles.envioButtonsRow}>
                  {CONFIANCAS_F9.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set(r.id, "confianca", c)}
                      style={{
                        ...styles.geracaoOption,
                        borderColor: r.confianca === c ? BLUE : "#E4EAF0",
                        background: r.confianca === c ? "#EAF2FB" : "#fff",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} type="button" style={styles.demoLink}>
        + Adicionar outra relação
      </button>
    </div>
  );
}

function StepRuidosF9({ ruidos, setRuidos }) {
  const add = () =>
    setRuidos((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, relacaoAfetada: "", tipoRuido: "Triangulação", descricao: "", impacto: "" },
    ]);
  const remove = (id) => setRuidos((prev) => prev.filter((r) => r.id !== id));
  const set = (id, field, val) =>
    setRuidos((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 3 DE 7 · RUÍDOS IDENTIFICADOS</span>
      <h1 style={styles.h1}>Quais padrões impedem a comunicação de circular direito?</h1>
      <p style={styles.lead}>
        Registre triangulações, silêncios, alianças não declaradas e conflitos recorrentes,
        associando cada um à relação em que aparece.
      </p>

      <div style={styles.familiaList}>
        {ruidos.map((r, i) => (
          <div key={r.id} style={styles.padraoCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>Ruído {i + 1}</span>
              {ruidos.length > 1 && (
                <button onClick={() => remove(r.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <label style={styles.fieldLabel}>Relação Afetada</label>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={r.relacaoAfetada}
              onChange={(e) => set(r.id, "relacaoAfetada", e.target.value)}
              placeholder="Ex.: pai, filho A e filha B"
            />
            <label style={styles.fieldLabel}>Tipo de Ruído</label>
            <div style={styles.envioButtonsRow}>
              {TIPOS_RUIDO_F9.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set(r.id, "tipoRuido", t)}
                  style={{
                    ...styles.geracaoOption,
                    borderColor: r.tipoRuido === t ? BLUE : "#E4EAF0",
                    background: r.tipoRuido === t ? "#EAF2FB" : "#fff",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <label style={styles.fieldLabel}>Descrição</label>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={r.descricao}
              onChange={(e) => set(r.id, "descricao", e.target.value)}
              placeholder="Ex.: irmãos só se comunicam através do pai"
            />
            <label style={styles.fieldLabel}>Impacto</label>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={r.impacto}
              onChange={(e) => set(r.id, "impacto", e.target.value)}
              placeholder="Ex.: decisões atrasadas e mensagens distorcidas"
            />
          </div>
        ))}
      </div>
      <button onClick={add} type="button" style={styles.demoLink}>
        + Adicionar outro ruído
      </button>
    </div>
  );
}

function StepTemasNaoConversados({ temasNaoConversados, setTemasNaoConversados }) {
  const add = () =>
    setTemasNaoConversados((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, tema: "", quemEvita: "", motivo: "", impacto: "" },
    ]);
  const remove = (id) => setTemasNaoConversados((prev) => prev.filter((t) => t.id !== id));
  const set = (id, field, val) =>
    setTemasNaoConversados((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: val } : t)));

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 4 DE 7 · TEMAS QUE NÃO SÃO CONVERSADOS</span>
      <h1 style={styles.h1}>O que a família evita colocar na mesa?</h1>
      <p style={styles.lead}>
        Justamente por não serem discutidos, esses temas geram riscos futuros. Liste os temas
        evitados, quem tende a evitar cada um, o motivo aparente e o impacto que essa ausência já
        está gerando.
      </p>

      <div style={styles.familiaList}>
        {temasNaoConversados.map((t) => (
          <div key={t.id} style={styles.padraoCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>Tema {temasNaoConversados.indexOf(t) + 1}</span>
              {temasNaoConversados.length > 1 && (
                <button onClick={() => remove(t.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <label style={styles.fieldLabel}>Tema Central</label>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={t.tema}
              onChange={(e) => set(t.id, "tema", e.target.value)}
              placeholder="Ex.: papel dos cônjuges na governança"
            />
            <label style={styles.fieldLabel}>Quem evita falar</label>
            <input
              style={{ ...styles.input, flex: "none" }}
              value={t.quemEvita}
              onChange={(e) => set(t.id, "quemEvita", e.target.value)}
              placeholder="Ex.: toda a família"
            />
            <label style={styles.fieldLabel}>Motivo</label>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={t.motivo}
              onChange={(e) => set(t.id, "motivo", e.target.value)}
              placeholder="Ex.: nunca foi formalmente decidido"
            />
            <label style={styles.fieldLabel}>Impacto</label>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={t.impacto}
              onChange={(e) => set(t.id, "impacto", e.target.value)}
              placeholder="Ex.: desconforto silencioso e isolamento"
            />
          </div>
        ))}
      </div>
      <button onClick={add} type="button" style={styles.demoLink}>
        + Adicionar outro tema
      </button>
    </div>
  );
}

function Sociograma({ participantes, relacoes }) {
  const cx = 220;
  const cy = 200;
  const raio = 145;
  const n = participantes.length;
  const posicoes = {};
  participantes.forEach((p, i) => {
    const angulo = (i / n) * 2 * Math.PI - Math.PI / 2;
    posicoes[p.id] = {
      x: cx + raio * Math.cos(angulo),
      y: cy + raio * Math.sin(angulo),
    };
  });

  if (n < 2) {
    return (
      <p style={styles.papelDescricao}>
        Adicione pelo menos 2 participantes no Passo 1 pra ver o sociograma.
      </p>
    );
  }

  return (
    <svg viewBox="0 0 440 400" style={{ width: "100%", height: "auto" }}>
      {relacoes
        .filter((r) => r.pessoa1Id && r.pessoa2Id && posicoes[r.pessoa1Id] && posicoes[r.pessoa2Id])
        .map((r) => {
          const p1 = posicoes[r.pessoa1Id];
          const p2 = posicoes[r.pessoa2Id];
          const tipo = TIPOS_COMUNICACAO_F9[r.tipo] || TIPOS_COMUNICACAO_F9.saudavel;
          const dash = tipo.linha === "solida" ? "0" : tipo.linha === "tracejada" ? "8 6" : "2 5";
          return (
            <line
              key={r.id}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={tipo.cor}
              strokeWidth={2}
              strokeDasharray={dash}
              opacity={0.75}
            />
          );
        })}
      {participantes.map((p) => {
        const pos = posicoes[p.id];
        const raioCirculo = 14 + (p.influencia || 1) * 3;
        return (
          <g key={p.id}>
            <circle cx={pos.x} cy={pos.y} r={raioCirculo} fill="#fff" stroke={BLUE} strokeWidth={2} />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={NAVY}>
              {p.nome.length > 12 ? p.nome.slice(0, 11) + "…" : p.nome}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function StepSociograma({ participantes, relacoes, ruidos }) {
  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 5 DE 7 · SOCIOGRAMA FAMILIAR</span>
      <h1 style={styles.h1}>Veja a rede de comunicação da família, desenhada.</h1>
      <p style={styles.lead}>
        O tamanho do círculo reflete a influência de cada pessoa. Linha contínua verde é
        comunicação saudável, tracejada amarela é difícil, pontilhada vermelha é inexistente.
        Observe centralidade (quem concentra conexões), isolamento (quem tem poucas ou nenhuma) e
        possíveis triangulações.
      </p>

      <div style={styles.padraoCard}>
        <Sociograma participantes={participantes} relacoes={relacoes} />
      </div>

      <div style={styles.envioButtonsRow}>
        {Object.values(TIPOS_COMUNICACAO_F9).map((t) => (
          <span key={t.label} style={{ ...styles.padraoInterpretacao, color: t.cor }}>
            ● {t.label}
          </span>
        ))}
      </div>

      {ruidos.filter((r) => r.relacaoAfetada.trim()).length > 0 && (
        <div style={styles.familiaList}>
          <span style={styles.papelNome}>Ruídos nomeados nesta rede</span>
          {ruidos
            .filter((r) => r.relacaoAfetada.trim())
            .map((r) => (
              <div key={r.id} style={styles.padraoCard}>
                <span style={styles.papelNome}>{r.tipoRuido}</span>
                <span style={styles.papelDescricao}>{r.relacaoAfetada}</span>
                {r.descricao && <span style={styles.papelDescricao}>{r.descricao}</span>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function StepConsolidacaoF9({ consolidacaoF9, setConsolidacaoF9 }) {
  const [script, setScript] = useState(null);
  const [gerando, setGerando] = useState(false);

  const prepararConversa = () => {
    setGerando(true);
    setScript(null);
    const prompt =
      `${LIVRO_CONTEXTO_F9}\n\n` +
      `Você ajuda alguém que mapeou a rede de comunicação da família a se preparar pra ` +
      `Consolidação Familiar.\n\n` +
      `Sugira 2-3 frases curtas de abertura pra essa pessoa compartilhar as descobertas, ` +
      `deixando claro que o objetivo é diagnóstico coletivo, não vigilância sobre quem fala com ` +
      `quem. Formate como lista curta. Responda só com as frases, sem introdução, em português ` +
      `do Brasil.`;

    callClaude(prompt, 260)
      .then((texto) => setScript(texto))
      .catch(() => setScript("Não foi possível gerar agora. Tente de novo em instantes."))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 6 DE 7 · CONSOLIDAÇÃO FAMILIAR</span>
      <h1 style={styles.h1}>Reúnam-se e compartilhem as descobertas.</h1>
      <p style={styles.lead}>
        Registrem, na coluna Impacto, como cada descoberta deve influenciar a forma como a
        família se comunica daqui pra frente.
      </p>

      {!script && (
        <button onClick={prepararConversa} disabled={gerando} style={styles.demoLink}>
          {gerando ? "Gerando sugestão…" : "✦ Preciso de ajuda para começar a conversa"}
        </button>
      )}
      {script && (
        <div style={styles.scriptBox}>
          <span style={styles.aiTag}>✦ sugestão gerada pra sua situação</span>
          <p style={styles.scriptText}>{script}</p>
        </div>
      )}

      <TabelaComportamentos
        titulo="Descobertas e impactos"
        linhas={consolidacaoF9}
        setLinhas={setConsolidacaoF9}
        labelComportamento="DESCOBERTA"
        labelMotivo="IMPACTO"
        placeholderComportamento="Ex.: as duas irmãs só se comunicam através do pai"
        placeholderMotivo="Ex.: vamos criar uma reunião mensal direta entre elas"
      />
    </div>
  );
}

function StepPlanoF9_2({ planoF9, setPlanoF9 }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  const addAcao = () =>
    setPlanoF9((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id || 0) + 1, acao: "", responsavel: "", prazo: "", status: "Não iniciado" },
    ]);
  const removeAcao = (id) => setPlanoF9((prev) => prev.filter((a) => a.id !== id));
  const setAcao = (id, field, val) =>
    setPlanoF9((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));

  const sugerirAcoes = () => {
    setGerando(true);
    setErro(false);
    const prompt =
      `${LIVRO_CONTEXTO_F9}\n\n` +
      `Você ajuda alguém que mapeou os ruídos relacionais da família a transformar isso em um ` +
      `plano de ação. Sugira 2 ações em sequência cronológica, cada uma no infinitivo, com ` +
      `responsável e prazo.\n\n` +
      `Responda APENAS com um JSON válido, sem markdown, sem crases, sem texto antes ou depois, ` +
      `neste formato exato:\n` +
      `[{"acao":"","responsavel":"","prazo":""},{"acao":"","responsavel":"","prazo":""}]`;

    callClaude(prompt, 350)
      .then((texto) => {
        const limpo = texto.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(limpo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlanoF9(
            parsed.map((a, i) => ({
              id: i + 1,
              acao: a.acao || "",
              responsavel: a.responsavel || "",
              prazo: a.prazo || "",
              status: "Não iniciado",
            }))
          );
        }
      })
      .catch(() => setErro(true))
      .finally(() => setGerando(false));
  };

  return (
    <div style={styles.stepWrap}>
      <span style={styles.eyebrowSmall}>PASSO 7 DE 7 · PLANO DE AÇÃO</span>
      <h1 style={styles.h1}>Transforme as descobertas em ações, com status de acompanhamento.</h1>
      <p style={styles.lead}>
        Cada ação tem um status — volte aqui daqui a alguns meses e atualize.
      </p>

      <button onClick={sugerirAcoes} disabled={gerando} style={styles.demoLink}>
        {gerando ? "Gerando sugestões…" : "✦ Sugerir ações"}
      </button>
      {erro && (
        <span style={styles.saveStatusErr}>Não deu pra gerar agora, escreva livremente abaixo.</span>
      )}

      <div style={styles.familiaList}>
        {planoF9.map((a, i) => (
          <div key={a.id} style={styles.timelineCard}>
            <div style={styles.timelineTopRow}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              {planoF9.length > 1 && (
                <button onClick={() => removeAcao(a.id)} style={styles.removeRowButton} type="button">
                  ×
                </button>
              )}
            </div>
            <textarea
              style={styles.textareaSmall}
              rows={2}
              value={a.acao}
              onChange={(e) => setAcao(a.id, "acao", e.target.value)}
              placeholder="Ex.: criar fórum específico para sócios por casamento…"
            />
            <div style={styles.planoRow}>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Responsável</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.responsavel}
                  onChange={(e) => setAcao(a.id, "responsavel", e.target.value)}
                  placeholder="Quem conduz"
                />
              </div>
              <div style={styles.planoField}>
                <label style={styles.fieldLabel}>Prazo</label>
                <input
                  style={{ ...styles.input, flex: "none" }}
                  value={a.prazo}
                  onChange={(e) => setAcao(a.id, "prazo", e.target.value)}
                  placeholder="Ex.: 60 dias"
                />
              </div>
            </div>
            <label style={styles.fieldLabel}>Status</label>
            <div style={styles.envioButtonsRow}>
              {STATUS_ACAO_F7.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAcao(a.id, "status", s)}
                  style={{
                    ...styles.geracaoOption,
                    borderColor: a.status === s ? BLUE : "#E4EAF0",
                    background: a.status === s ? "#EAF2FB" : "#fff",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={addAcao} type="button" style={styles.demoLink}>
        + Adicionar outra ação
      </button>
    </div>
  );
}

function StepFechamentoF9({ participantesPreenchidos, relacoes, ruidos, planoF9, onReiniciar, envioId }) {
  const [salvando, setSalvando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);
  const [sintese, setSintese] = useState(null);
  const [carregandoSintese, setCarregandoSintese] = useState(false);

  const ruidosPreenchidos = ruidos.filter((r) => r.relacaoAfetada.trim());

  useEffect(() => {
    let cancelado = false;
    setSalvando(true);
    setErroSalvar(false);

    supabaseInsert("respostas", {
      envio_id: envioId || null,
      ferramenta_numero: 9,
      notas: { participantes: participantesPreenchidos, relacoes },
      conflito: { ruidos: ruidosPreenchidos },
      plano_acao: planoF9,
    })
      .then(() => {
        if (!cancelado) setSalvo(true);
      })
      .catch(() => {
        if (!cancelado) setErroSalvar(true);
      })
      .finally(() => {
        if (!cancelado) setSalvando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCarregandoSintese(true);
    const resumo = ruidosPreenchidos.map((r) => `${r.tipoRuido} em ${r.relacaoAfetada}`).join("; ") || "nenhum ruído nomeado";
    const prompt =
      `${LIVRO_CONTEXTO_F9}\n\n` +
      `Alguém mapeou a rede de comunicação da família. Ruídos identificados: ${resumo}.\n\n` +
      `Escreva um parágrafo curto de fechamento (3-4 frases, no máximo 80 palavras) que amarre ` +
      `isso numa síntese concreta e acolhedora, reforçando que o ruído revelado costuma ser um ` +
      `padrão estrutural do sistema, não um problema de personalidade. Tom direto, sem clichês ` +
      `de autoajuda. Responda só com o texto, sem introdução, em português do Brasil.`;

    callClaude(prompt, 220)
      .then((texto) => {
        if (!cancelado && texto) setSintese(texto);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoSintese(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const montarResumo = () => {
    const linhas = [
      "Mapa de Ruídos Relacionais",
      "",
      `Participantes mapeados: ${participantesPreenchidos.map((p) => p.nome).join(", ") || "—"}`,
      `Ruídos identificados: ${ruidosPreenchidos.map((r) => `${r.tipoRuido} (${r.relacaoAfetada})`).join("; ") || "—"}`,
      "",
      sintese ? `Síntese: ${sintese}` : null,
      sintese ? "" : null,
      "Plano de ação:",
      planoF9
        .filter((a) => a.acao.trim())
        .map(
          (a, i) =>
            `${i + 1}. ${a.acao} — Responsável: ${a.responsavel || "—"} — Prazo: ${a.prazo || "—"} — Status: ${a.status || "—"}`
        )
        .join("\n") || "—",
    ].filter((l) => l !== null);
    return linhas.join("\n");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      notifyConsultor("Nosso resultado — Mapa de Ruídos Relacionais", montarResumo());
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stepWrap}>
      <div style={styles.saveStatus}>
        {salvando && <span style={styles.saveStatusText}>Salvando seu resultado…</span>}
        {!salvando && salvo && <span style={styles.saveStatusOk}>✓ Resultado salvo</span>}
        {!salvando && erroSalvar && (
          <span style={styles.saveStatusErr}>Não deu pra salvar automaticamente</span>
        )}
      </div>
      <span style={styles.eyebrowSmall}>FECHAMENTO</span>
      <h1 style={styles.h1}>Seu Mapa de Ruídos Relacionais, resumido.</h1>

      <div style={styles.padraoCard}>
        <Sociograma participantes={participantesPreenchidos} relacoes={relacoes} />
      </div>

      <div style={styles.unlockBox}>
        <span style={styles.unlockLabel}>SÍNTESE</span>
        {carregandoSintese ? (
          <p style={styles.unlockHow}>
            <span style={{ opacity: 0.6 }}>Gerando síntese pra sua situação específica…</span>
          </p>
        ) : (
          <>
            <p style={styles.unlockHow}>
              {sintese || "O ruído revelado costuma ser um padrão estrutural do sistema, não um problema de personalidade."}
            </p>
            {sintese && <span style={styles.aiTag}>✦ gerado pra sua situação</span>}
          </>
        )}
      </div>

      <div style={styles.familiaList}>
        {ruidosPreenchidos.map((r) => (
          <div key={r.id} style={styles.padraoCard}>
            <span style={styles.papelNome}>{r.tipoRuido}</span>
            <span style={styles.papelDescricao}>{r.relacaoAfetada}</span>
          </div>
        ))}
      </div>

      <div style={styles.familiaList}>
        {planoF9
          .filter((a) => a.acao.trim())
          .map((a, i) => (
            <div key={a.id} style={styles.padraoCard}>
              <span style={styles.papelNome}>{i + 1}ª ação</span>
              <span style={styles.papelDescricao}>{a.acao}</span>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>RESPONSÁVEL</span>
                <span style={styles.fechamentoValue}>{a.responsavel || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>PRAZO</span>
                <span style={styles.fechamentoValue}>{a.prazo || "—"}</span>
              </div>
              <div style={styles.fechamentoRow}>
                <span style={styles.fechamentoLabel}>STATUS</span>
                <span style={styles.fechamentoValue}>{a.status || "—"}</span>
              </div>
            </div>
          ))}
      </div>

      <div style={styles.ctaBox}>
        <p style={styles.ctaTitle}>Agora é executar, com acompanhamento.</p>
        <p style={styles.ctaSub}>
          Vocês mapearam participantes, relações, ruídos e temas evitados, e desenharam o
          sociograma. O que falta agora é colocar em prática, e revisitar em 60 dias se os pactos
          de comunicação estão funcionando.
        </p>
      </div>

      <p style={{ ...styles.papelDescricao, marginTop: 4 }} className="no-print">
        Um resumo desse resultado já foi enviado automaticamente pro consultor.
      </p>
      <div style={styles.finalButtonsRow} className="no-print">
        <button onClick={() => window.print()} style={styles.ctaButton}>
          🖨️ Baixar / imprimir PDF
        </button>
        <button onClick={onReiniciar} style={styles.restartButton}>
          ↺ Voltar ao início
        </button>
      </div>
    </div>
  );
}

function Footer({ step, canAdvance, isLastQuadrante, isDesempate, isPenultimate, onBack, onNext }) {
  return (
    <div style={styles.footer} className="no-print">
      <button
        onClick={onBack}
        disabled={step === STEP_ROLE}
        style={{ ...styles.navButton, ...styles.navButtonGhost, opacity: step === STEP_ROLE ? 0.3 : 1 }}
      >
        ← Voltar
      </button>
      <button
        onClick={onNext}
        disabled={!canAdvance}
        style={{
          ...styles.navButton,
          ...styles.navButtonPrimary,
          opacity: canAdvance ? 1 : 0.4,
          cursor: canAdvance ? "pointer" : "not-allowed",
        }}
      >
        {isPenultimate
          ? "Ver fechamento →"
          : isDesempate || isLastQuadrante
          ? "Ver resultado →"
          : "Continuar →"}
      </button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F4F7FA",
    display: "flex",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Calibri', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
  },
  shell: {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 10px 40px rgba(26,42,58,0.10)",
    display: "flex",
    flexDirection: "column",
    minHeight: 640,
  },
  shellWide: {
    width: "100%",
    maxWidth: 900,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 10px 40px rgba(26,42,58,0.10)",
    padding: "36px 32px",
    boxSizing: "border-box",
  },
  catalogoWrap: { display: "flex", flexDirection: "column", gap: 22 },
  catalogoHeader: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 },
  catalogoH1: { fontFamily: "Cambria, Georgia, serif", fontSize: 26, fontWeight: 700, color: NAVY, margin: "2px 0" },
  backToCatalogo: {
    background: "none",
    border: "none",
    color: LIGHTBLUE,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
  grupoBox: { display: "flex", flexDirection: "column", gap: 10 },
  grupoHeader: { display: "flex", alignItems: "center", gap: 12 },
  grupoLetra: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: "50%",
    color: "#fff",
    fontFamily: "Cambria, Georgia, serif",
    fontSize: 16,
    fontWeight: 700,
  },
  grupoHeaderText: { display: "flex", flexDirection: "column" },
  grupoEtapa: { fontSize: 14.5, fontWeight: 700, color: NAVY },
  grupoCategoria: { fontSize: 12, color: "#8A97A3", fontStyle: "italic" },
  ferramentasGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  ferramentaCard: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "12px 14px",
    border: "1px solid #EEF2F6",
    borderRadius: 10,
    background: "#FAFBFC",
  },
  ferramentaNum: { fontSize: 11, fontWeight: 700, color: "#8A97A3" },
  ferramentaNome: { fontSize: 13, fontWeight: 600, color: NAVY, lineHeight: 1.3 },
  ferramentaAtiva: { fontSize: 10.5, fontWeight: 700, color: "#2E7D32" },
  ferramentaEmBreve: { fontSize: 10.5, fontWeight: 700, color: "#B0BAC4" },
  enviarCardLink: {
    background: "none",
    border: "none",
    padding: 0,
    marginTop: 2,
    fontSize: 11.5,
    fontWeight: 600,
    color: BLUE,
    textDecoration: "underline",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  enviarCardBox: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 6,
    padding: "10px 12px",
    background: "#fff",
    border: "1px solid #E4EAF0",
    borderRadius: 8,
  },
  envioBox: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "18px 20px",
    background: "#EAF2FB",
    borderRadius: 12,
    border: "1px solid #CFE0F2",
  },
  envioButtonsRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  envioButton: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1.5px solid " + BLUE,
    background: "#fff",
    color: BLUE,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  pessoaBox: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "14px 16px",
    background: "#FAFBFC",
    border: "1px solid #EEF2F6",
    borderRadius: 10,
  },
  header: {
    background: NAVY,
    padding: "22px 28px 18px",
    position: "sticky",
    top: 0,
    zIndex: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 6,
  },
  eyebrow: { color: LIGHTBLUE, fontSize: 11, fontWeight: 700, letterSpacing: 1.2 },
  stepLabel: { color: "#CADCFC", fontSize: 13, fontWeight: 600 },
  progressTrack: { height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", background: LIGHTBLUE, borderRadius: 3, transition: "width 0.35s ease" },
  tipoDesafioWrap: { position: "relative", marginTop: 12 },
  tipoDesafioPill: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#CADCFC",
    fontSize: 11.5,
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: 20,
    cursor: "pointer",
  },
  tipoDesafioMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    zIndex: 20,
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    padding: 6,
    display: "flex",
    flexDirection: "column",
    minWidth: 220,
  },
  tipoDesafioOption: {
    background: "transparent",
    border: "none",
    textAlign: "left",
    padding: "8px 10px",
    borderRadius: 6,
    fontSize: 13,
    color: NAVY,
    cursor: "pointer",
  },
  tipoDesafioOptionActive: { background: "#EAF2FD", fontWeight: 700, color: BLUE },
  body: { padding: "32px 28px", flex: 1, display: "flex", flexDirection: "column" },
  stepWrap: { display: "flex", flexDirection: "column", gap: 14 },
  h1: {
    fontFamily: "Cambria, Georgia, serif",
    fontSize: 24,
    fontWeight: 700,
    color: NAVY,
    lineHeight: 1.3,
    margin: 0,
  },
  lead: { fontSize: 14.5, color: "#5A6B7A", lineHeight: 1.55, margin: 0 },
  roleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 6 },
  roleCard: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "14px 16px",
    borderRadius: 10,
    border: "1.5px solid #E4EAF0",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  roleLabel: { fontSize: 14.5, fontWeight: 700, color: NAVY },
  roleDesc: { fontSize: 12, color: "#8A97A3" },
  demoLinksRow: { display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 },
  demoLink: {
    marginTop: 4,
    alignSelf: "flex-start",
    background: "none",
    border: "none",
    color: BLUE,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
    fontFamily: "inherit",
  },
  desempateBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "16px 18px",
    background: "#FAFBFC",
    border: "1px solid #EEF2F6",
    borderRadius: 12,
  },
  desempateLabel: { fontSize: 11.5, fontWeight: 700, color: BLUE, letterSpacing: 0.5 },
  desempateHint: { fontSize: 12.5, color: "#5A6B7A", margin: 0, fontStyle: "italic" },
  desempateOptions: { display: "flex", flexDirection: "column", gap: 8, marginTop: 2 },
  desempateOption: {
    padding: "12px 14px",
    borderRadius: 8,
    border: "1.5px solid #E4EAF0",
    background: "#fff",
    fontSize: 14,
    fontWeight: 600,
    color: NAVY,
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  textarea: {
    marginTop: 10,
    padding: "14px 16px",
    fontSize: 15,
    border: "1.5px solid #D7DEE6",
    borderRadius: 10,
    resize: "vertical",
    fontFamily: "inherit",
    color: NAVY,
    outline: "none",
  },
  quadrantBadge: {
    display: "inline-block",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    padding: "5px 12px",
    borderRadius: 20,
    letterSpacing: 0.5,
  },
  explainer: { fontSize: 13.5, color: "#5A6B7A", lineHeight: 1.55, margin: "-4px 0 2px" },
  explainerExample: {
    fontSize: 13,
    color: "#3A4A58",
    lineHeight: 1.55,
    margin: "0 0 4px",
    background: "#EAF2FB",
    borderRadius: 8,
    padding: "10px 12px",
  },
  aiTag: {
    display: "inline-block",
    marginTop: 6,
    fontSize: 10.5,
    fontWeight: 700,
    color: BLUE,
    letterSpacing: 0.3,
  },
  scriptBox: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "14px 16px",
    background: "#EAF2FB",
    border: "1px solid #CFE0F2",
    borderRadius: 10,
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  scriptText: { fontSize: 13.5, color: NAVY, margin: 0, lineHeight: 1.6, whiteSpace: "pre-line" },
  aprofundarBox: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "12px 14px",
    background: "#EAF2FB",
    border: "1px solid #CFE0F2",
    borderRadius: 10,
  },
  aprofundarItem: {
    fontSize: 13,
    color: NAVY,
    margin: "2px 0",
    lineHeight: 1.45,
    paddingLeft: 14,
    borderLeft: `2px solid ${LIGHTBLUE}`,
  },
  saveStatus: { marginBottom: -6 },
  saveStatusText: { fontSize: 12, color: "#8A97A3", fontStyle: "italic" },
  saveStatusOk: { fontSize: 12, color: "#2E7D32", fontWeight: 700 },
  saveStatusErr: { fontSize: 12, color: "#B0472B", fontStyle: "italic" },
  legendBox: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "#FAFBFC",
    border: "1px solid #EEF2F6",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 4,
  },
  legendItem: { display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#3A4A58" },
  legendDot: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 34,
    height: 22,
    borderRadius: 11,
    fontSize: 11,
    fontWeight: 700,
    color: "#3A4A58",
    padding: "0 6px",
  },
  itemList: { display: "flex", flexDirection: "column", gap: 10, marginTop: 4 },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: "10px 0",
    borderBottom: "1px solid #EEF2F6",
  },
  itemName: { fontSize: 14.5, color: NAVY, fontWeight: 500, flex: "1 1 180px" },
  dots: { display: "flex", gap: 6, flexWrap: "wrap" },
  dot: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1.5px solid #D7DEE6",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  dotSmall: { width: 26, height: 26, fontSize: 11 },
  dotNA: {
    height: 30,
    padding: "0 8px",
    borderRadius: 15,
    border: "1.5px solid #D7DEE6",
    fontSize: 10.5,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
    marginLeft: 4,
  },
  naHint: {
    fontSize: 11.5,
    color: "#8A97A3",
    fontStyle: "italic",
    margin: "2px 0 0",
  },
  eyebrowSmall: { color: BLUE, fontSize: 11, fontWeight: 700, letterSpacing: 1.2 },
  decisionEcho: { fontStyle: "italic", color: "#5A6B7A", fontSize: 15, margin: "-6px 0 6px" },
  resumoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 },
  resumoCard: {
    display: "flex",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #EEF2F6",
    background: "#FAFBFC",
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  resumoBar: { width: 5 },
  resumoCardInner: { padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 },
  resumoName: { fontSize: 12, fontWeight: 700, color: NAVY, textTransform: "uppercase", letterSpacing: 0.4 },
  resumoValue: { fontSize: 13.5, color: "#3A4A58", lineHeight: 1.3 },
  resumoScore: { fontSize: 11.5, color: "#8A97A3" },
  conflictBox: {
    marginTop: 8,
    background: NAVY,
    borderRadius: 12,
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  conflictLabel: { color: LIGHTBLUE, fontSize: 11, fontWeight: 700, letterSpacing: 1 },
  conflictText: { color: "#fff", fontSize: 16, margin: 0, lineHeight: 1.4 },
  conflictHelp: { color: "#B9C8D8", fontSize: 13, margin: 0, lineHeight: 1.5 },
  unlockBox: {
    marginTop: 4,
    padding: "18px 20px",
    background: "#EAF2FB",
    border: "1px solid #CFE0F2",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  unlockLabel: { color: BLUE, fontSize: 11, fontWeight: 700, letterSpacing: 1 },
  unlockWhere: { fontSize: 14.5, color: NAVY, margin: 0, lineHeight: 1.45 },
  unlockHow: { fontSize: 13.5, color: "#3A4A58", margin: 0, lineHeight: 1.5 },
  unlockNext: { fontSize: 12.5, color: "#5A6B7A", margin: "2px 0 0", lineHeight: 1.5, fontStyle: "italic" },
  roadmapBox: {
    marginTop: 4,
    padding: "18px 20px",
    background: "#FAFBFC",
    border: "1px solid #EEF2F6",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  roadmapLabel: { color: BLUE, fontSize: 11, fontWeight: 700, letterSpacing: 1 },
  roadmapIntro: { fontSize: 13, color: "#5A6B7A", margin: 0, lineHeight: 1.5 },
  roadmapList: { display: "flex", flexDirection: "column", gap: 7, marginTop: 2 },
  roadmapItem: { display: "flex", alignItems: "center", gap: 10 },
  roadmapNum: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    minWidth: 20,
    borderRadius: "50%",
    background: "#E4EAF0",
    color: "#8A97A3",
    fontSize: 10.5,
    fontWeight: 700,
  },
  roadmapNumDone: { background: BLUE, color: "#fff" },
  roadmapText: { fontSize: 12.5, color: "#8A97A3" },
  roadmapTextDone: { fontSize: 12.5, color: NAVY, fontWeight: 700 },
  fieldLabel: { fontSize: 13, fontWeight: 700, color: NAVY, marginTop: 4, marginBottom: -6 },
  textareaSmall: {
    padding: "12px 14px",
    fontSize: 14,
    border: "1.5px solid #D7DEE6",
    borderRadius: 10,
    resize: "vertical",
    fontFamily: "inherit",
    color: NAVY,
    outline: "none",
  },
  planoRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  planoField: { flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 4 },
  decisaoFinalOptions: { display: "flex", flexDirection: "column", gap: 8, marginTop: 2 },
  decisaoFinalCard: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1.5px solid #E4EAF0",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  decisaoFinalLabel: { fontSize: 14.5, fontWeight: 700, color: NAVY },
  decisaoFinalDesc: { fontSize: 12, color: "#8A97A3" },
  simNaoRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  simNaoButton: {
    padding: "11px 18px",
    borderRadius: 8,
    border: "1.5px solid #E4EAF0",
    background: "#fff",
    fontSize: 13.5,
    fontWeight: 600,
    color: NAVY,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  fechamentoBox: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    border: "1px solid #EEF2F6",
    borderRadius: 12,
    overflow: "hidden",
  },
  fechamentoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid #EEF2F6",
    background: "#FAFBFC",
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  fechamentoLabel: { fontSize: 11, fontWeight: 700, color: "#8A97A3", letterSpacing: 0.5, minWidth: 100 },
  fechamentoValue: { fontSize: 13.5, color: NAVY, textAlign: "right", flex: 1 },
  finalButtonsRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 },
  restartButton: {
    padding: "12px 20px",
    background: "#fff",
    color: "#5A6B7A",
    border: "1.5px solid #D7DEE6",
    borderRadius: 8,
    fontSize: 14.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  ctaBox: {
    marginTop: 10,
    padding: "20px 22px",
    background: "#F4F7FA",
    borderRadius: 12,
    border: "1px solid #E4EAF0",
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  ctaForm: { display: "flex", flexDirection: "column", gap: 10 },
  ctaTitle: { fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 },
  ctaSub: { fontSize: 13.5, color: "#5A6B7A", margin: 0, lineHeight: 1.5 },
  ctaFields: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { flex: "1 1 200px", padding: "11px 14px", fontSize: 14, border: "1.5px solid #D7DEE6", borderRadius: 8, outline: "none", fontFamily: "inherit" },
  ctaButton: { marginTop: 4, padding: "12px 20px", background: BLUE, color: "#fff", border: "none", borderRadius: 8, fontSize: 14.5, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" },
  ctaButtonSecondary: { display: "inline-block", marginTop: 8, padding: "12px 20px", background: BLUE, color: "#fff", textDecoration: "none", borderRadius: 8, fontSize: 14.5, fontWeight: 700 },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px 28px",
    borderTop: "1px solid #EEF2F6",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    background: "#fff",
    position: "sticky",
    bottom: 0,
    zIndex: 10,
  },
  navButton: { padding: "11px 20px", borderRadius: 8, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" },
  navButtonGhost: { background: "transparent", color: "#5A6B7A" },
  navButtonPrimary: { background: NAVY, color: "#fff" },
  totalBadge: {
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    textAlign: "center",
  },
  papeisList: { display: "flex", flexDirection: "column", gap: 10 },
  papelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: "12px 14px",
    border: "1.5px solid #E4EAF0",
    borderRadius: 10,
  },
  papelRowText: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  papelNome: { fontSize: 14.5, fontWeight: 700, color: NAVY },
  papelDescricao: { fontSize: 12.5, color: "#7A8794" },
  papelInput: {
    width: 64,
    padding: "9px 10px",
    fontSize: 15,
    fontWeight: 700,
    textAlign: "center",
    border: "1.5px solid #D7DEE6",
    borderRadius: 8,
    fontFamily: "inherit",
    color: NAVY,
  },
  radarSvg: { width: "100%", maxWidth: 340, alignSelf: "center", margin: "6px 0" },
  contribuicaoBox: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "16px 18px",
    background: "#F7FAFD",
    border: "1px solid #E4EAF0",
    borderRadius: 12,
  },
  familiaList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 6 },
  familiaRow: { display: "flex", gap: 8, alignItems: "center" },
  removeRowButton: {
    width: 34,
    height: 34,
    flexShrink: 0,
    border: "1.5px solid #D7DEE6",
    background: "#fff",
    color: "#8A97A3",
    borderRadius: 8,
    fontSize: 16,
    lineHeight: 1,
    cursor: "pointer",
  },
  timelineCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "14px 16px",
    background: "#FAFBFC",
    border: "1px solid #E4EAF0",
    borderRadius: 10,
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  timelineTopRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  padraoCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "16px 18px",
    background: "#F7FAFD",
    border: "1px solid #E4EAF0",
    borderRadius: 12,
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  geracaoOption: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1.5px solid #E4EAF0",
    background: "#fff",
    fontSize: 12.5,
    fontWeight: 600,
    color: NAVY,
    cursor: "pointer",
  },
  padraoInterpretacao: { fontSize: 12.5, color: BLUE, fontWeight: 600 },
  scoreLinha: { display: "flex", flexDirection: "column", gap: 4 },
  scoreLinhaLabel: { fontSize: 12.5, color: "#5A6B7A", fontWeight: 600 },
  padraoGuiaRow: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "10px 0",
    borderBottom: "1px solid #E4EAF0",
  },
  padraoGuiaNome: { fontSize: 13.5, fontWeight: 700, color: NAVY },
  sliderInput: { width: "100%", accentColor: BLUE, cursor: "pointer" },
  sliderTicks: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: "#9AA7B4",
    marginTop: -4,
  },
  icsPainelRow: { display: "flex", alignItems: "baseline", gap: 12 },
  icsPainelNumero: { fontSize: 42, fontWeight: 800, lineHeight: 1 },
  icsBarTrack: { height: 10, background: "#EEF2F6", borderRadius: 5, overflow: "hidden" },
  icsBarFill: { height: "100%", borderRadius: 5, transition: "width 0.3s ease" },
  icsExemplosBox: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    marginTop: 2,
    padding: "8px 10px",
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #E4EAF0",
  },
  icsExemploLinha: { fontSize: 12, color: "#5A6B7A", lineHeight: 1.4 },
  icsPreviaBox: {
    position: "sticky",
    bottom: 0,
    marginTop: 8,
    padding: "12px 16px",
    background: "#fff",
    border: "1.5px solid #E4EAF0",
    borderRadius: 12,
    boxShadow: "0 -4px 16px rgba(26,42,58,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  claroGuiaRow: { display: "flex", gap: 6, marginBottom: 4 },
  claroLetraBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 14,
    transition: "all 0.2s ease",
  },
  semaforoBotao: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1.5px solid #E4EAF0",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
  },
};
