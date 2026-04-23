// ---- PILLAR & QUESTION DATA -----------------------------------------------

export interface Subcategory {
  label: string;
  questions: string[];
}

export interface Pillar {
  id: string;
  icon: string;
  title: string;
  quote: string;
  subcategories: Subcategory[];
}

export const PILLARS: Pillar[] = [
  {
    id: 'ux', icon: '🧍', title: 'Estratégia de Experiência e Usuário',
    quote: 'Domínio profundo das dores e necessidades, garantindo que a solução resolva o problema real com o menor esforço possível.',
    subcategories: [
      { label: 'Visão e Empatia pelo Usuário', questions: [
        'Conheço profundamente quem é o meu usuário, seus objetivos e as dores reais que o trazem ao produto.',
        'Entendo o contexto de uso (onde, quando e por que ele usa) e como o produto se encaixa na rotina dele.',
        'Identifico diferentes segmentos e personas, adaptando a proposta de valor para cada um.',
        'Diferencio o que o usuário "diz querer" do que ele "precisa resolver" (Job to be Done).',
      ]},
      { label: 'Discovery e Redução de Incerteza', questions: [
        'Planejo e conduzo descobertas para validar hipóteses antes de levar soluções para desenvolvimento.',
        'Utilizo métodos qualitativos e quantitativos para extrair insights reais (entrevistas, análise de dados, surveys).',
        'Envolvo o time (Design e Eng) no processo de descoberta para criar uma visão compartilhada do problema.',
        'Sintetizo aprendizados de discovery em decisões acionáveis para o roadmap.',
      ]},
      { label: 'Arquitetura de Valor e Fricção', questions: [
        'Garanto que as soluções propostas são intuitivas e resolvem o problema com o menor esforço (fricção) para o usuário.',
        'Analiso a jornada de ponta a ponta, identificando gargalos e momentos de abandono.',
        'Articulo trade-offs de experiência: sei quando simplificar o fluxo para acelerar o aprendizado ou o valor.',
        'Garanto que o produto comunica claramente o valor e ajuda o usuário a progredir em sua tarefa.',
      ]},
      { label: 'Colaboração e Design Thinking', questions: [
        'Atuo como parceiro estratégico do design, definindo o "quê" e o "porquê", enquanto colaboro na visão do "como".',
        'Promovo uma cultura onde a experiência é responsabilidade de todos, não apenas do designer.',
        'Utilizo protótipos e experimentos para aprender rápido e evitar desperdício de código em ideias não validadas.',
        'Avalio propostas de design sob a ótica de viabilidade, negócio e valor para o usuário final.',
      ]},
      { label: 'Métricas de Sucesso e Impacto', questions: [
        'Defino e acompanho indicadores de sucesso baseados no sucesso do usuário (Retenção, CSAT, Conclusão de Tarefa).',
        'Conecto melhorias na experiência com resultados de negócio (ex: menos fricção aumentando conversão).',
        'Utilizo dados de uso real (analytics) para identificar onde a experiência precisa ser iterada e melhorada.',
      ]},
    ]
  },
  {
    id: 'tech', icon: '⚙️', title: 'Tecnologia',
    quote: 'Ser um bom parceiro de engenharia, entender como o produto funciona e fazer bons trade-offs entre valor, esforço e qualidade.',
    subcategories: [
      { label: 'Arquitetura e funcionamento básico do produto', questions: [
        'Tenho visão geral da arquitetura do produto: principais serviços, módulos e integrações críticas.',
        'Entendo os fluxos técnicos principais (como uma transação é processada, como dados são calculados, etc.).',
        'Conheço as dependências entre sistemas e o que acontece quando algo muda ou falha.',
      ]},
      { label: 'Linguagem e conceitos técnicos essenciais', questions: [
        'Domino conceitos básicos relevantes: APIs, cache, filas, SLAs, SLOs.',
        'Entendo o que é dívida técnica e seu impacto em velocidade e qualidade.',
        'Tenho noções de segurança e privacidade de dados aplicadas ao contexto do produto (ex.: LGPD).',
      ]},
      { label: 'Parceria com engenharia', questions: [
        'Envolvo devs na fase de discovery para explorar possibilidades e riscos técnicos.',
        'Faço boas perguntas sobre esforço, complexidade e riscos sem microgerenciar.',
        'Conduzo refinamentos claros: contexto do problema, critérios de aceite, riscos e dependências.',
        'Negocio escopo com base em impacto versus esforço, sem sacrificar qualidade crítica.',
      ]},
      { label: 'Qualidade e confiabilidade', questions: [
        'Entendo as implicações de performance para a experiência do usuário (latência, erros, indisponibilidades).',
        'Trabalho com engenharia para definir SLAs e SLOs para flows chave.',
        'Entendo o papel de testes automatizados, monitoramento e observabilidade do produto.',
      ]},
      { label: 'Plataforma e escalabilidade', questions: [
        'Tenho visão de longo prazo sobre o que precisa virar "plataforma" para ganhar escala.',
        'Sei quando priorizar investimentos de infraestrutura que desbloqueiam ganhos futuros.',
      ]},
    ]
  },
  {
    id: 'data', icon: '📊', title: 'Dados e Métricas',
    quote: 'Tomar decisões orientadas a outcomes, formular hipóteses, rodar experimentos e conectar dados a aprendizado e estratégia.',
    subcategories: [
      { label: 'Fundamentos de métricas de produto', questions: [
        'Entendo métricas de aquisição, ativação, engajamento, retenção e receita aplicadas ao contexto.',
        'Diferencio métricas de resultado de métricas de atividade (outcome vs. output).',
        'Entendo o conceito de North Star Metric e métricas de suporte (L1, L2, L3).',
      ]},
      { label: 'Medição e instrumentação', questions: [
        'Sei formular os eventos que precisam ser medidos em um novo fluxo (nome, parâmetros, contexto).',
        'Verifico se o que é importante está de fato instrumentado antes de tomar decisões.',
        'Trabalho com dados e engenharia para garantir qualidade dos dados (consistência, delay, gaps).',
      ]},
      { label: 'Análise e interpretação de dados', questions: [
        'Leio dashboards e respondo perguntas básicas: onde está caindo, onde está melhorando.',
        'Descubro padrões relevantes em cohorts, segmentos e comportamentos de usuários.',
        'Formo hipóteses com base em dados e não apenas em intuição.',
      ]},
      { label: 'Experimentação e aprendizado', questions: [
        'Crio hipóteses testáveis com critérios claros de sucesso e falha.',
        'Defino thresholds claros para experimentos antes de rodá-los.',
        'Conheço diferentes tipos de teste: A/B, smoke test, fake door, concierge.',
        'Registro aprendizados sistematicamente — o que funcionou, o que não funcionou, o que muda.',
      ]},
      { label: 'Conexão com negócio e estratégia', questions: [
        'Sei mapear como uma métrica de produto impacta uma métrica de negócio (LTV, CAC, renovação).',
        'Priorizo iniciativas com base em potencial de impacto mensurável.',
        'Comunico resultados para stakeholders de forma clara, sem jargão técnico, com histórias baseadas em dados.',
      ]},
    ]
  },
  {
    id: 'biz', icon: '📈', title: 'Negócios e Mercado',
    quote: 'Entender profundamente o mercado, o modelo de negócio e tomar decisões alinhadas à estratégia da empresa.',
    subcategories: [
      { label: 'Entendimento da indústria e mercado', questions: [
        'Entendo como funciona o mercado onde atuo: players, segmentos e tendências relevantes.',
        'Conheço os principais concorrentes diretos e indiretos com profundidade.',
        'Acompanho tendências relevantes: mudanças regulatórias, novas tecnologias, novos formatos.',
      ]},
      { label: 'Modelo de negócio da empresa', questions: [
        'Conheço as fontes de receita do produto que gerencio (assinaturas, transações, upsell, B2B, etc.).',
        'Entendo a estrutura básica de custos do produto (tecnologia, marketing, operações, suporte).',
        'Domino as métricas de unidade econômica: LTV, CAC, payback, margem por segmento.',
      ]},
      { label: 'Proposta de valor e posicionamento', questions: [
        'Entendo e consigo articular a proposta de valor do produto versus concorrentes.',
        'Conheço os diferenciais por persona e segmento.',
        'Tenho clareza sobre os JTBDs (Jobs To Be Done) — por que alguém escolheria este produto.',
      ]},
      { label: 'Estratégia de produto e portfólio', questions: [
        'Entendo a visão e os objetivos estratégicos de produto para 1 a 3 anos.',
        'Sei como meu squad contribui para a estratégia maior da empresa (aquisição, engajamento, retenção).',
        'Consigo propor encerramento de features ou produtos que não entregam valor (decisões de kill).',
      ]},
      { label: 'Go-to-market e ciclos comerciais', questions: [
        'Tenho noções básicas de como marketing, vendas e CS operam no contexto do produto.',
        'Colaboro com essas áreas para desenhar lançamentos e narrativas de valor.',
        'Entendo a sazonalidade e ciclos comerciais que afetam o produto.',
      ]},
    ]
  },
  {
    id: 'mgmt', icon: '🤝', title: 'Gestão e Processos',
    quote: 'Liderar sem autoridade formal, colaborar com diferentes áreas e ser guardião da cultura de produto orientada a outcomes.',
    subcategories: [
      { label: 'Trabalho em equipe e colaboração', questions: [
        'Colaboro bem com design, engenharia, dados, marketing, vendas e CS.',
        'Facilito cerimônias (refinamentos, plannings, reviews) com foco em problema e outcome.',
        'Pratico comunicação clara, direta e respeitosa, adaptando a mensagem ao público.',
      ]},
      { label: 'Gestão de stakeholders', questions: [
        'Mapeio stakeholders com clareza: quem influencia, quem é impactado, quem decide.',
        'Entendo os interesses e motivações de cada área relevante ao produto.',
        'Negocio prioridades e expectativas alinhando o que é pedido com o que gera mais resultado.',
        'Educo stakeholders sobre foco em problemas, outcomes e aprendizados (sem Build Trap).',
      ]},
      { label: 'Liderança de produto', questions: [
        'Crio visão, objetivos e narrativa clara para o time sobre por que estamos fazendo isso.',
        'Inspiro o time a propor soluções — não sou "dono das ideias".',
        'Tomo decisões difíceis: digo não, mudo de direção, tiro algo do ar quando necessário.',
      ]},
      { label: 'Desenvolvimento de pessoas e cultura', questions: [
        'Dou e recebo feedback de forma estruturada, regular e respeitosa.',
        'Apoio o crescimento de pares: faço mentoria, suporte a PMs júnior.',
        'Atuo como exemplo da cultura de produto: curiosidade, foco em outcomes, colaboração.',
      ]},
      { label: 'Organização pessoal e execução', questions: [
        'Gerencio bem meu tempo e prioridades — sei dizer não e lidar com urgências sem abandonar o importante.',
        'Mantenho backlog organizado, roadmap claro e expectativas alinhadas.',
        'Garanto cadência de entrega e aprendizado: discovery e acompanhamento de métricas não morrem.',
      ]},
    ]
  },
];

export interface Level {
  id: string;
  label: string;
  group: 'apm' | 'pm' | 'gpm';
  minPct: number;
  maxPct: number;
  title: string;
  desc: string;
  steps: { icon: string; title: string; desc: string }[];
}

export const LEVELS: Level[] = [
  { id: 'apm0', label: 'APM0', group: 'apm', minPct: 0, maxPct: 20,
    title: 'Associate PM — Entrante',
    desc: 'No início da jornada. Conhece alguns conceitos, mas ainda depende de orientação para executar. O foco é aprender os fundamentos, observar PMs experientes e começar a tomar pequenas decisões com suporte.',
    steps: [
      { icon: '📚', title: 'Estude os fundamentos', desc: 'Leia Inspired (Marty Cagan) e Escaping the Build Trap (Melissa Perri). Esses dois livros formam a base de toda a trilha.' },
      { icon: '🔍', title: 'Observe e pergunte', desc: 'Acompanhe PMs sênior em discovery, refinamentos e reviews. Pergunte sobre o raciocínio por trás das decisões.' },
      { icon: '🧪', title: 'Participe de pesquisas', desc: 'Esteja presente em entrevistas com usuários. Comece a sintetizar insights sob supervisão.' },
    ]
  },
  { id: 'apm1', label: 'APM1', group: 'apm', minPct: 20, maxPct: 35,
    title: 'Associate PM — Em desenvolvimento',
    desc: 'Já conhece o vocabulário de produto e consegue contribuir com o time. Ainda precisa de orientação frequente, mas começa a tomar iniciativa em tarefas menores.',
    steps: [
      { icon: '🗣️', title: 'Conduza suas primeiras entrevistas', desc: 'Com apoio de um PM sênior, planeje e conduza entrevistas com usuários. Sintetize os aprendizados sozinho.' },
      { icon: '📊', title: 'Domine as métricas do produto', desc: 'Aprenda quais são as métricas de aquisição, ativação e retenção do seu contexto e acompanhe-as semanalmente.' },
      { icon: '⚙️', title: 'Construa sua parceria com engenharia', desc: 'Participe ativamente de refinamentos. Aprenda a fazer boas perguntas sobre esforço e complexidade.' },
    ]
  },
  { id: 'pm1', label: 'PM1', group: 'pm', minPct: 35, maxPct: 48,
    title: 'Product Manager I — Autônomo com suporte',
    desc: 'Opera com autonomia em tarefas bem definidas. Consegue conduzir discovery, escrever specs e colaborar com o time sem depender de supervisão constante.',
    steps: [
      { icon: '🎯', title: 'Foque em outcomes, não outputs', desc: 'Para cada iniciativa, defina claramente qual problema de usuário ou métrica de negócio você quer mover.' },
      { icon: '🧩', title: 'Amplie seu entendimento de negócio', desc: 'Aprofunde o conhecimento sobre o modelo de negócio: LTV, CAC, fontes de receita. Conecte decisões a essas métricas.' },
      { icon: '🤝', title: 'Desenvolva gestão de stakeholders', desc: 'Mapeie os stakeholders do produto e crie rituais regulares de alinhamento. Pratique dizer não com dados.' },
    ]
  },
  { id: 'pm2', label: 'PM2', group: 'pm', minPct: 48, maxPct: 60,
    title: 'Product Manager II — Impacto consistente',
    desc: 'Entrega valor consistente ao longo do tempo. Tem clareza sobre o problema que está resolvendo, usa dados para tomar decisões e colabora bem com todas as áreas.',
    steps: [
      { icon: '🔬', title: 'Desenvolva cultura de experimentação', desc: 'Implemente um processo sistemático de hipóteses e testes no squad. Documente e compartilhe aprendizados.' },
      { icon: '🏗️', title: 'Pense em plataforma', desc: 'Identifique onde o produto precisa de investimentos de infraestrutura que desbloqueiam ganhos futuros.' },
      { icon: '👥', title: 'Comece a desenvolver pessoas', desc: 'Dê mentoria a APMs. Compartilhe seu processo de raciocínio em decisões. Seja multiplicador da cultura.' },
    ]
  },
  { id: 'pm3', label: 'PM3', group: 'pm', minPct: 60, maxPct: 73,
    title: 'Product Manager III — Referência técnica',
    desc: 'Um PM altamente competente que serve de referência para o time. Toma decisões complexas com confiança, navega bem em ambiguidade e tem impacto além do squad direto.',
    steps: [
      { icon: '🗺️', title: 'Desenvolva visão estratégica', desc: 'Conecte o roadmap à estratégia de 2-3 anos da empresa. Proponha iniciativas que vão além do escopo atual.' },
      { icon: '📣', title: 'Amplifique sua influência', desc: 'Compartilhe frameworks, processos e aprendizados com o time. Contribua para decisões de portfólio.' },
      { icon: '🎓', title: 'Leia Strong Product People', desc: 'Petra Wille descreve exatamente o que é necessário para o próximo salto — desenvolver outros PMs e operar em escala.' },
    ]
  },
  { id: 'pm4', label: 'PM4 / GPM1', group: 'pm', minPct: 73, maxPct: 85,
    title: 'PM IV / Group PM I',
    desc: 'Neste patamar, as competências técnicas são equivalentes entre PM4 e GPM1. A diferença está no escopo: PM4 é um IC de alto impacto individual; GPM1 lidera um grupo de PMs.',
    steps: [
      { icon: '⚡', title: 'Defina seu caminho', desc: 'PM4 e GPM1 estão no mesmo nível técnico. IC de alto impacto individual ou liderança de grupo? Ambos são válidos.' },
      { icon: '🌐', title: 'Pense em company-level', desc: 'As decisões devem considerar impacto além do produto. Participe de discussões de modelo de negócio e estratégia.' },
      { icon: '🏆', title: 'Construa legado', desc: 'Qual framework, processo ou cultura vai deixar para o time? O impacto deve ser multiplicador.' },
    ]
  },
  { id: 'gpm2', label: 'GPM2', group: 'gpm', minPct: 85, maxPct: 101,
    title: 'Group PM II — Liderança estratégica',
    desc: 'Opera em nível de liderança com impacto em toda a organização. Define estratégia, influencia a cultura de produto e é parceiro de negócio para o C-level.',
    steps: [
      { icon: '🎯', title: 'Influencie a estratégia corporativa', desc: 'Suas visões de produto devem alimentar decisões de empresa: novos mercados, pricing, arquitetura de produto.' },
      { icon: '🌱', title: 'Construa a próxima geração', desc: 'Identifique e acelere os próximos PM4s e GPMs. Esse é o maior legado de um líder de produto.' },
      { icon: '📖', title: 'Compartilhe externamente', desc: 'Escreva, fale em eventos, contribua com a comunidade. Isso fortalece a marca da empresa e seu legado.' },
    ]
  },
];

// ---- FLAT QUESTION LIST --------------------------------------------------
export interface Question {
  pillarId: string;
  pillarIdx: number;
  pillarTitle: string;
  subcategory: string;
  text: string;
  globalIdx: number;
}

export const allQuestions: Question[] = [];
(function () {
  let idx = 0;
  PILLARS.forEach((p, pi) => {
    p.subcategories.forEach(sc => {
      sc.questions.forEach(q => {
        allQuestions.push({ pillarId: p.id, pillarIdx: pi, pillarTitle: p.title, subcategory: sc.label, text: q, globalIdx: idx });
        idx++;
      });
    });
  });
})();

// ---- SCORE HELPERS -------------------------------------------------------
export function scoreShort(s: number): string {
  return ['Não conheço', 'Conh. baixo', 'Conh. médio', 'Conh. alto', 'Muito alto'][s];
}
export function scoreLabel(s: number): string {
  return ['Não conheço', 'Conhecimento baixo', 'Conhecimento médio', 'Conhecimento alto', 'Conhecimento muito alto'][s];
}

export function getLevel(pct: number): Level {
  for (const l of LEVELS) {
    if (pct >= l.minPct && pct < l.maxPct) return l;
  }
  return LEVELS[LEVELS.length - 1];
}

export interface PillarResult {
  pillarId: string;
  pillarTitle: string;
  pct: number;
}

export function calcPillarData(scores: Record<number, number>): PillarResult[] {
  return PILLARS.map(p => {
    const qs = allQuestions.filter(q => q.pillarId === p.id);
    const s = qs.reduce((acc, q) => acc + (scores[q.globalIdx] || 0), 0);
    const max = qs.length * 4;
    return { pillarId: p.id, pillarTitle: p.title, pct: Math.round((s / max) * 100) };
  });
}

export function calcTotalPct(scores: Record<number, number>): number {
  const answered = allQuestions.filter(q => scores[q.globalIdx] !== undefined);
  const totalScore = answered.reduce((acc, q) => acc + scores[q.globalIdx], 0);
  const maxScore = allQuestions.length * 4;
  return Math.round((totalScore / maxScore) * 100);
}
