import type {
  Laudo,
  Block,
  IdentificationData,
  TextBlockData,
  ScoreTableData,
  ChartData,
  InfoBoxData,
  ReferencesData,
  ClosingPageData,
} from '@/types'

// =============================================================================
// Mock: Laudo de Avaliação Neuropsicológica — Weverton da Silva Souza
// Baseado no documento original de 18 páginas
// 45 blocos — títulos/seções contêm APENAS o nome; conteúdo em blocos separados
// =============================================================================

// ── Helpers para IDs estáveis ────────────────────────────────────────────────

const blk = (n: number) => `mock-blk-${String(n).padStart(2, '0')}`
const col = (table: number, c: number) => `mock-col-${table}-${c}`
const row = (table: number, r: number) => `mock-row-${table}-${r}`
const ser = (chart: number, s: number = 1) => `mock-ser-${chart}-${s}`
const cat = (chart: number, c: number) => `mock-cat-${chart}-${c}`
const rr = (chart: number, r: number) => `mock-rr-${chart}-${r}`
const rl = (chart: number, r: number) => `mock-rl-${chart}-${r}`
const li = (block: number, i: number) => `mock-li-${block}-${i}`

// ── Regiões de referência reutilizáveis ──────────────────────────────────────

const PERCENTILE_REGIONS = [
  { id: '', label: 'Muito Baixa', yMin: 0, yMax: 10, color: '#E74C3C33', borderColor: '#E74C3C' },
  { id: '', label: 'Baixa', yMin: 10, yMax: 25, color: '#F39C1233', borderColor: '#F39C12' },
  { id: '', label: 'Média', yMin: 25, yMax: 75, color: '#27AE6033', borderColor: '#27AE60' },
  { id: '', label: 'Alta', yMin: 75, yMax: 90, color: '#2980B933', borderColor: '#2980B9' },
  { id: '', label: 'Muito Alta', yMin: 90, yMax: 100, color: '#8E44AD33', borderColor: '#8E44AD' },
]

const SCALED_SCORE_REGIONS = [
  { id: '', label: 'Muito Inferior', yMin: 1, yMax: 4, color: '#E74C3C33', borderColor: '#E74C3C' },
  { id: '', label: 'Inferior', yMin: 4, yMax: 7, color: '#F39C1233', borderColor: '#F39C12' },
  { id: '', label: 'Médio', yMin: 7, yMax: 13, color: '#27AE6033', borderColor: '#27AE60' },
  { id: '', label: 'Superior', yMin: 13, yMax: 16, color: '#2980B933', borderColor: '#2980B9' },
  { id: '', label: 'Muito Superior', yMin: 16, yMax: 19, color: '#8E44AD33', borderColor: '#8E44AD' },
]

function withRegionIds(chartIdx: number, regions: typeof PERCENTILE_REGIONS) {
  return regions.map((r, i) => ({ ...r, id: rr(chartIdx, i + 1) }))
}

// Helper para blocos de texto vazios (apenas título/subtítulo)
function sectionText(title: string, subtitle: string = ''): TextBlockData {
  return { title, subtitle, content: '', labeledItems: [], useLabeledItems: false }
}

// Helper para blocos de conteúdo puro (sem título nem subtítulo)
function contentText(content: string, labeledItems: TextBlockData['labeledItems'] = [], useLabeledItems = false): TextBlockData {
  return { title: '', subtitle: '', content, labeledItems, useLabeledItems }
}

// =============================================================================
// BLOCO 0 — Identificação (Página 1)
// =============================================================================

const identificationData: IdentificationData = {
  professional: {
    name: 'Dênia Ingrid França Santos',
    crp: '04/59907',
    specialization: 'Psicóloga, especialista em Neuropsicologia',
    phone: '(34) 9 9646-6083',
    email: 'deniapsicologa@hotmail.com',
    instagram: 'denianeuropsicologa',
    contactItems: [
      { id: 'ct-1', type: 'phone', value: '(34) 9 9646-6083' },
      { id: 'ct-2', type: 'instagram', value: '@denianeuropsicologa' },
      { id: 'ct-3', type: 'email', value: 'deniapsicologa@hotmail.com' },
    ],
  },
  solicitor: {
    name: 'Dr. Marcos Vinícius Souza',
    crm: 'CRM/MG 000000',
    rqe: '00000',
    specialty: 'Psiquiatria',
  },
  patient: {
    name: 'Weverton da Silva Souza',
    cpf: '000.000.000-00',
    birthDate: '1992-12-05',
    age: '32 anos e 3 meses',
    education: 'Ensino Superior Completo',
    profession: 'Desenvolvedor de Software',
    motherName: 'Nome da Mãe Completo',
    fatherName: 'Nome do Pai Completo',
  },
  date: '2025-03-14',
  location: 'Uberlândia',
}

// =============================================================================
// BLOCOS 1-2 — Descrição da Demanda (Páginas 2-3)
//   1 = título da seção (só nome)
//   2 = conteúdo
// =============================================================================

const demandaTitulo = sectionText('DESCRIÇÃO DA DEMANDA E OBJETIVOS DA AVALIAÇÃO')

const demandaConteudo = contentText(`Weverton da Silva Souza, 32 anos, sexo masculino, foi encaminhado pelo médico psiquiatra Dr. Marcos Vinícius Souza para realização de avaliação neuropsicológica, com o objetivo de investigar o funcionamento cognitivo global e mapear o perfil neuropsicológico do paciente.

A avaliação foi solicitada com base em hipóteses diagnósticas de Altas Habilidades/Superdotação (AH/SD) e Transtorno do Espectro do Autismo (TEA), considerando o histórico de desenvolvimento, queixas comportamentais e sociais relatadas pelo paciente e observadas em acompanhamento psiquiátrico.

A avaliação neuropsicológica consiste em um processo de investigação clínica das funções cognitivas — atenção, memória, linguagem, funções executivas, habilidades visuoespaciais e visuoconstrutivas, entre outras — bem como aspectos emocionais, comportamentais e de personalidade. O processo utiliza instrumentos padronizados e validados cientificamente, entrevistas clínicas e observação comportamental, visando compreender o funcionamento cerebral e suas repercussões na vida cotidiana do indivíduo.

Os objetivos específicos desta avaliação incluem:

• Avaliar o funcionamento intelectual global e as habilidades cognitivas específicas;
• Investigar a presença de indicadores compatíveis com Altas Habilidades/Superdotação;
• Rastrear sinais compatíveis com Transtorno do Espectro do Autismo;
• Avaliar o perfil atencional e de funções executivas;
• Investigar aspectos emocionais, comportamentais e de personalidade;
• Fornecer subsídios para o planejamento de intervenções terapêuticas e orientações.

A avaliação neuropsicológica é um procedimento reconhecido pelo Conselho Federal de Psicologia (CFP) e deve ser realizada por profissional habilitado. Os resultados aqui apresentados refletem o desempenho do avaliando no momento da avaliação, podendo sofrer variações em função de fatores ambientais, emocionais e de saúde. Os dados obtidos devem ser analisados em conjunto com informações clínicas e de outros profissionais envolvidos no acompanhamento do paciente.`)

// =============================================================================
// BLOCOS 3-4 — Procedimentos (Página 3)
//   3 = título da seção (só nome)
//   4 = conteúdo
// =============================================================================

const procedimentosTitulo = sectionText('PROCEDIMENTOS')

const procedimentosConteudo = contentText(`A avaliação neuropsicológica foi conduzida em sessões individuais, realizadas no consultório da psicóloga responsável, na cidade de Uberlândia - MG. Foram utilizados os seguintes instrumentos e procedimentos:

• Entrevista Clínica e Anamnese detalhada;
• Escala de Inteligência Wechsler para Adultos – 3ª Edição (WAIS-III);
• Teste de Aprendizagem Auditivo-Verbal de Rey (RAVLT);
• Teste de Cópia e de Reprodução de Memória de Figuras Geométricas Complexas (Figuras Complexas de Rey);
• Five Digit Test – FDT;
• Torre de Londres – ToL-BR;
• Escala de Avaliação de Transtorno de Déficit de Atenção e Hiperatividade – Versão Adolescentes e Adultos (ETDAH-AD);
• Escala de Responsividade Social – 2ª Edição (SRS-2);
• Inventário Fatorial de Personalidade (IFP-II);
• Escalas Beck: Inventário de Ansiedade de Beck (BAI), Inventário de Depressão de Beck (BDI) e Escala de Desesperança de Beck (BHS);
• Avaliação qualitativa e observação comportamental.

Os instrumentos foram selecionados de acordo com a demanda clínica, as hipóteses diagnósticas e as características do avaliando, visando abranger os principais domínios cognitivos, comportamentais e emocionais.`)

// =============================================================================
// BLOCOS 5-11 — Anamnese (Páginas 4-6)
//   5  = título "ANAMNESE" (só nome)
//   6  = subtítulo "Dados Pessoais" (só nome)
//   7  = conteúdo Dados Pessoais
//   8  = subtítulo "Histórico Clínico" (só nome)
//   9  = conteúdo Histórico Clínico
//   10 = subtítulo "Histórico Escolar/Acadêmico" (só nome)
//   11 = conteúdo Histórico Escolar/Acadêmico
// =============================================================================

const anamneseTitulo = sectionText('ANAMNESE')
const anamneseDadosPessoaisTitulo = sectionText('', 'Dados Pessoais')

const anamneseDadosPessoaisConteudo = contentText(`Weverton da Silva Souza, 32 anos, natural e residente em Uberlândia - MG. Solteiro, mora com os pais e uma irmã. É graduado em Sistemas de Informação e atua como Desenvolvedor de Software.

O paciente compareceu às sessões de avaliação de forma pontual e colaborativa. Apresentou-se orientado no tempo e espaço, com higiene e vestimenta adequadas. Demonstrou boa capacidade de comunicação verbal, embora com tendência a respostas diretas e objetivas, com pouca elaboração espontânea sobre temas emocionais ou sociais.

Durante a entrevista, relatou que sempre se sentiu "diferente" em relação aos pares, com dificuldade para compreender regras sociais implícitas e para estabelecer e manter vínculos de amizade. Refere preferência por atividades solitárias e interesses restritos, com foco intenso em temas de tecnologia e programação desde a adolescência.`)

const anamnaseHistoricoClinicoTitulo = sectionText('', 'Histórico Clínico')

const anamnaseHistoricoClinicoConteudo = contentText(`O paciente relata acompanhamento psiquiátrico há aproximadamente 2 anos, com diagnóstico prévio de Transtorno Depressivo e Transtorno de Ansiedade Generalizada. Faz uso de medicação psicotrópica (escitalopram) sob acompanhamento médico, com relato de melhora parcial dos sintomas ansiosos e depressivos.

Refere dificuldades sensoriais, incluindo hipersensibilidade a sons altos, texturas específicas de tecidos e ambientes com muitos estímulos simultâneos. Relata desconforto significativo em situações sociais com grande número de pessoas, como festas e eventos, preferindo ambientes controlados e previsíveis.

No âmbito social, descreve dificuldade crônica para iniciar e manter conversas informais, compreender ironias e sarcasmo, e interpretar expressões faciais e linguagem corporal. Relata que frequentemente é percebido como "frio" ou "desinteressado" pelos outros, embora internamente sinta desejo de conexão social.

O paciente nega histórico de uso de substâncias psicoativas, episódios psicóticos, tentativas de autolesão ou ideação suicida. Refere padrão de sono irregular, com dificuldade para adormecer devido a pensamentos ruminativos, especialmente sobre interações sociais vividas durante o dia.`)

const anamnaseHistoricoEscolarTitulo = sectionText('', 'Histórico Escolar/Acadêmico')

const anamnaseHistoricoEscolarConteudo = contentText(`O paciente relata ter aprendido a ler de forma precoce, por volta dos 4 anos de idade, de maneira autodidata, demonstrando interesse precoce por letras e números. Na escola, apresentou bom desempenho acadêmico de forma geral, com destaque nas áreas de matemática e ciências, porém com dificuldades recorrentes em atividades que envolviam trabalho em grupo e apresentações orais.

Refere que durante a infância e adolescência era frequentemente descrito pelos professores como "aluno inteligente, mas que não participa" e "quieto demais". Relata ter sido alvo de bullying em alguns momentos da trajetória escolar, principalmente por suas características comportamentais e interesses divergentes dos colegas.

No Ensino Superior, graduou-se em Sistemas de Informação, área escolhida por afinidade com lógica e tecnologia. Relata que o ambiente universitário foi mais confortável por permitir maior autonomia e interação com pessoas de interesses semelhantes. Destaca que grande parte de seus conhecimentos técnicos em programação e desenvolvimento de software foram adquiridos de forma autodidata, por meio de cursos online, documentação técnica e projetos pessoais.

Atualmente, trabalha como Desenvolvedor de Software, com bom desempenho profissional. Refere preferência por trabalho remoto e comunicação assíncrona (mensagens de texto), apresentando desconforto em reuniões presenciais e chamadas de vídeo, especialmente quando não há pauta definida.`)

// =============================================================================
// BLOCOS 12-14 — Resultados / Inteligência — Intro (Página 7)
//   12 = título "RESULTADOS" (só nome)
//   13 = subtítulo "Inteligência" (só nome)
//   14 = conteúdo intro
// =============================================================================

const resultadosTitulo = sectionText('RESULTADOS')
const resultadosInteligenciaTitulo = sectionText('', 'Inteligência')

const resultadosInteligenciaConteudo = contentText(`Para avaliação da capacidade intelectual, foi aplicada a Escala de Inteligência Wechsler para Adultos – 3ª Edição (WAIS-III). Os resultados dos índices fatoriais e subtestes são apresentados a seguir.`)

// =============================================================================
// BLOCO 15 — Tabela WAIS-III Índices Fatoriais (Página 7)
// =============================================================================

const waisIndicesData: ScoreTableData = {
  title: 'WAIS-III — Índices Fatoriais',
  columns: [
    { id: col(1, 1), label: 'Índice' },
    { id: col(1, 2), label: 'QI Obtido' },
    { id: col(1, 3), label: 'Percentil' },
    { id: col(1, 4), label: 'Classificação' },
  ],
  rows: [
    { id: row(1, 1), values: { [col(1, 1)]: 'QI Total', [col(1, 2)]: '131', [col(1, 3)]: '98', [col(1, 4)]: 'Superior' } },
    { id: row(1, 2), values: { [col(1, 1)]: 'Compreensão Verbal (ICV)', [col(1, 2)]: '128', [col(1, 3)]: '97', [col(1, 4)]: 'Superior' } },
    { id: row(1, 3), values: { [col(1, 1)]: 'Organização Perceptual (IOP)', [col(1, 2)]: '123', [col(1, 3)]: '94', [col(1, 4)]: 'Superior' } },
    { id: row(1, 4), values: { [col(1, 1)]: 'Memória Operacional (IMO)', [col(1, 2)]: '117', [col(1, 3)]: '87', [col(1, 4)]: 'Médio Superior' } },
    { id: row(1, 5), values: { [col(1, 1)]: 'Velocidade de Processamento (IVP)', [col(1, 2)]: '108', [col(1, 3)]: '70', [col(1, 4)]: 'Médio' } },
  ],
  footnote: 'WAIS-III: Escala de Inteligência Wechsler para Adultos – 3ª Edição. QI médio = 100 (DP = 15).',
}

// =============================================================================
// BLOCO 16 — Tabela WAIS-III Subtestes (Páginas 7-8)
// =============================================================================

const waisSubtestesData: ScoreTableData = {
  title: 'WAIS-III — Subtestes',
  columns: [
    { id: col(2, 1), label: 'Subteste' },
    { id: col(2, 2), label: 'Pontuação Ponderada' },
    { id: col(2, 3), label: 'Classificação' },
  ],
  rows: [
    { id: row(2, 1), values: { [col(2, 1)]: 'Vocabulário', [col(2, 2)]: '16', [col(2, 3)]: 'Superior' } },
    { id: row(2, 2), values: { [col(2, 1)]: 'Semelhanças', [col(2, 2)]: '15', [col(2, 3)]: 'Superior' } },
    { id: row(2, 3), values: { [col(2, 1)]: 'Informação', [col(2, 2)]: '15', [col(2, 3)]: 'Superior' } },
    { id: row(2, 4), values: { [col(2, 1)]: 'Compreensão', [col(2, 2)]: '14', [col(2, 3)]: 'Médio Superior' } },
    { id: row(2, 5), values: { [col(2, 1)]: 'Cubos', [col(2, 2)]: '14', [col(2, 3)]: 'Médio Superior' } },
    { id: row(2, 6), values: { [col(2, 1)]: 'Raciocínio Matricial', [col(2, 2)]: '14', [col(2, 3)]: 'Médio Superior' } },
    { id: row(2, 7), values: { [col(2, 1)]: 'Completar Figuras', [col(2, 2)]: '13', [col(2, 3)]: 'Médio Superior' } },
    { id: row(2, 8), values: { [col(2, 1)]: 'Aritmética', [col(2, 2)]: '13', [col(2, 3)]: 'Médio Superior' } },
    { id: row(2, 9), values: { [col(2, 1)]: 'Dígitos', [col(2, 2)]: '13', [col(2, 3)]: 'Médio Superior' } },
    { id: row(2, 10), values: { [col(2, 1)]: 'Sequência Números-Letras', [col(2, 2)]: '12', [col(2, 3)]: 'Médio' } },
    { id: row(2, 11), values: { [col(2, 1)]: 'Códigos', [col(2, 2)]: '12', [col(2, 3)]: 'Médio' } },
    { id: row(2, 12), values: { [col(2, 1)]: 'Procurar Símbolos', [col(2, 2)]: '11', [col(2, 3)]: 'Médio' } },
  ],
  footnote: 'Pontuação Ponderada: Média = 10, Desvio Padrão = 3.',
}

// =============================================================================
// BLOCO 17 — Gráfico WAIS-III Subtestes (Página 8)
// =============================================================================

const s15 = ser(1)
const waisChartData: ChartData = {
  title: 'Desempenho nos Subtestes do WAIS-III',
  chartType: 'bar',
  displayMode: 'grouped',
  series: [{ id: s15, label: 'Pontuação Ponderada', color: '#2E86C1' }],
  categories: [
    { id: cat(1, 1), label: 'Vocabulário', values: { [s15]: 16 } },
    { id: cat(1, 2), label: 'Semelhanças', values: { [s15]: 15 } },
    { id: cat(1, 3), label: 'Informação', values: { [s15]: 15 } },
    { id: cat(1, 4), label: 'Compreensão', values: { [s15]: 14 } },
    { id: cat(1, 5), label: 'Cubos', values: { [s15]: 14 } },
    { id: cat(1, 6), label: 'Rac. Matricial', values: { [s15]: 14 } },
    { id: cat(1, 7), label: 'Compl. Figuras', values: { [s15]: 13 } },
    { id: cat(1, 8), label: 'Aritmética', values: { [s15]: 13 } },
    { id: cat(1, 9), label: 'Dígitos', values: { [s15]: 13 } },
    { id: cat(1, 10), label: 'Seq. Núm-Let', values: { [s15]: 12 } },
    { id: cat(1, 11), label: 'Códigos', values: { [s15]: 12 } },
    { id: cat(1, 12), label: 'Proc. Símbolos', values: { [s15]: 11 } },
  ],
  referenceLines: [
    { id: rl(1, 1), label: 'Média (10)', value: 10, color: '#E74C3C' },
  ],
  referenceRegions: withRegionIds(1, SCALED_SCORE_REGIONS),
  yAxisLabel: 'Pontuação Ponderada',
  showValues: true,
  showLegend: false,
  showRegionLegend: true,
  description: 'Desempenho do avaliando nos subtestes do WAIS-III, com regiões de classificação ao fundo.',
}

// =============================================================================
// BLOCOS 18-19 — Resultados / Atenção (Página 9)
//   16 = subtítulo "Atenção" (só nome)
//   17 = conteúdo intro
// =============================================================================

const resultadosAtencaoTitulo = sectionText('', 'Atenção')

const resultadosAtencaoConteudo = contentText(`Para avaliação dos processos atencionais, foi aplicado o Five Digit Test (FDT), que avalia velocidade de processamento, atenção sustentada, atenção seletiva, atenção alternada, flexibilidade cognitiva e controle inibitório.`)

// =============================================================================
// BLOCO 20 — Tabela FDT (Página 9)
// =============================================================================

const fdtData: ScoreTableData = {
  title: 'Five Digit Test — FDT',
  columns: [
    { id: col(3, 1), label: 'Etapa' },
    { id: col(3, 2), label: 'Percentil' },
    { id: col(3, 3), label: 'Classificação' },
  ],
  rows: [
    { id: row(3, 1), values: { [col(3, 1)]: 'Leitura', [col(3, 2)]: '95', [col(3, 3)]: 'Muito Alta' } },
    { id: row(3, 2), values: { [col(3, 1)]: 'Contagem', [col(3, 2)]: '80', [col(3, 3)]: 'Alta' } },
    { id: row(3, 3), values: { [col(3, 1)]: 'Escolha', [col(3, 2)]: '90', [col(3, 3)]: 'Muito Alta' } },
    { id: row(3, 4), values: { [col(3, 1)]: 'Alternância', [col(3, 2)]: '85', [col(3, 3)]: 'Alta' } },
    { id: row(3, 5), values: { [col(3, 1)]: 'Flexibilidade', [col(3, 2)]: '90', [col(3, 3)]: 'Muito Alta' } },
    { id: row(3, 6), values: { [col(3, 1)]: 'Inibição', [col(3, 2)]: '85', [col(3, 3)]: 'Alta' } },
  ],
  footnote: 'FDT: Five Digit Test. Percentis acima de 75 indicam desempenho acima da média.',
}

// =============================================================================
// BLOCO 21 — Gráfico FDT (Página 9)
// =============================================================================

const s19 = ser(2)
const fdtChartData: ChartData = {
  title: 'Desempenho no Five Digit Test (FDT)',
  chartType: 'bar',
  displayMode: 'grouped',
  series: [{ id: s19, label: 'Percentil', color: '#2E86C1' }],
  categories: [
    { id: cat(2, 1), label: 'Leitura', values: { [s19]: 95 } },
    { id: cat(2, 2), label: 'Contagem', values: { [s19]: 80 } },
    { id: cat(2, 3), label: 'Escolha', values: { [s19]: 90 } },
    { id: cat(2, 4), label: 'Alternância', values: { [s19]: 85 } },
    { id: cat(2, 5), label: 'Flexibilidade', values: { [s19]: 90 } },
    { id: cat(2, 6), label: 'Inibição', values: { [s19]: 85 } },
  ],
  referenceLines: [
    { id: rl(2, 1), label: 'Média (50)', value: 50, color: '#E74C3C' },
  ],
  referenceRegions: withRegionIds(2, PERCENTILE_REGIONS),
  yAxisLabel: 'Percentil',
  showValues: true,
  showLegend: false,
  showRegionLegend: true,
  description: 'Desempenho do avaliando nas etapas do FDT, com classificação por faixas de percentil.',
}

// =============================================================================
// BLOCOS 22-23 — Resultados / Memória (Página 10)
//   20 = subtítulo "Memória" (só nome)
//   21 = conteúdo intro
// =============================================================================

const resultadosMemoriaTitulo = sectionText('', 'Memória')

const resultadosMemoriaConteudo = contentText(`Para avaliação das funções mnésticas, foram utilizados o Teste de Aprendizagem Auditivo-Verbal de Rey (RAVLT), que avalia memória episódica verbal, curva de aprendizagem e reconhecimento, e o Teste de Cópia e Reprodução de Memória de Figuras Geométricas Complexas (Figuras Complexas de Rey), que avalia memória visual e habilidades visuoconstrutivas.`)

// =============================================================================
// BLOCO 24 — Tabela RAVLT (Página 10)
// =============================================================================

const ravltData: ScoreTableData = {
  title: 'Teste de Aprendizagem Auditivo-Verbal de Rey — RAVLT',
  columns: [
    { id: col(4, 1), label: 'Tentativa' },
    { id: col(4, 2), label: 'Escore Bruto' },
    { id: col(4, 3), label: 'Percentil' },
    { id: col(4, 4), label: 'Classificação' },
  ],
  rows: [
    { id: row(4, 1), values: { [col(4, 1)]: 'A1', [col(4, 2)]: '8', [col(4, 3)]: '75', [col(4, 4)]: 'Média Superior' } },
    { id: row(4, 2), values: { [col(4, 1)]: 'A2', [col(4, 2)]: '12', [col(4, 3)]: '80', [col(4, 4)]: 'Alta' } },
    { id: row(4, 3), values: { [col(4, 1)]: 'A3', [col(4, 2)]: '13', [col(4, 3)]: '75', [col(4, 4)]: 'Média Superior' } },
    { id: row(4, 4), values: { [col(4, 1)]: 'A4', [col(4, 2)]: '14', [col(4, 3)]: '80', [col(4, 4)]: 'Alta' } },
    { id: row(4, 5), values: { [col(4, 1)]: 'A5', [col(4, 2)]: '15', [col(4, 3)]: '90', [col(4, 4)]: 'Muito Alta' } },
    { id: row(4, 6), values: { [col(4, 1)]: 'Total (A1-A5)', [col(4, 2)]: '62', [col(4, 3)]: '85', [col(4, 4)]: 'Alta' } },
    { id: row(4, 7), values: { [col(4, 1)]: 'B1', [col(4, 2)]: '8', [col(4, 3)]: '75', [col(4, 4)]: 'Média Superior' } },
    { id: row(4, 8), values: { [col(4, 1)]: 'A6', [col(4, 2)]: '13', [col(4, 3)]: '80', [col(4, 4)]: 'Alta' } },
    { id: row(4, 9), values: { [col(4, 1)]: 'A7', [col(4, 2)]: '14', [col(4, 3)]: '90', [col(4, 4)]: 'Muito Alta' } },
    { id: row(4, 10), values: { [col(4, 1)]: 'Reconhecimento', [col(4, 2)]: '15', [col(4, 3)]: '95', [col(4, 4)]: 'Muito Alta' } },
  ],
  footnote: 'RAVLT: Teste de Aprendizagem Auditivo-Verbal de Rey.',
}

// =============================================================================
// BLOCO 25 — Tabela Figuras Complexas de Rey (Página 10)
// =============================================================================

const reyData: ScoreTableData = {
  title: 'Figuras Complexas de Rey',
  columns: [
    { id: col(5, 1), label: 'Etapa' },
    { id: col(5, 2), label: 'Escore Bruto' },
    { id: col(5, 3), label: 'Percentil' },
    { id: col(5, 4), label: 'Classificação' },
  ],
  rows: [
    { id: row(5, 1), values: { [col(5, 1)]: 'Cópia', [col(5, 2)]: '35', [col(5, 3)]: '85', [col(5, 4)]: 'Alta' } },
    { id: row(5, 2), values: { [col(5, 1)]: 'Memória', [col(5, 2)]: '28', [col(5, 3)]: '75', [col(5, 4)]: 'Média Superior' } },
  ],
  footnote: 'Figuras Complexas de Rey: avalia habilidades visuoconstrutivas (cópia) e memória visual (reprodução de memória).',
}

// =============================================================================
// BLOCO 26 — Gráfico Curva de Aprendizagem RAVLT (Página 11)
// =============================================================================

const s24 = ser(3)
const ravltChartData: ChartData = {
  title: 'Curva de Aprendizagem — RAVLT',
  chartType: 'line',
  displayMode: 'grouped',
  series: [{ id: s24, label: 'Palavras Recordadas', color: '#2E86C1' }],
  categories: [
    { id: cat(3, 1), label: 'A1', values: { [s24]: 8 } },
    { id: cat(3, 2), label: 'A2', values: { [s24]: 12 } },
    { id: cat(3, 3), label: 'A3', values: { [s24]: 13 } },
    { id: cat(3, 4), label: 'A4', values: { [s24]: 14 } },
    { id: cat(3, 5), label: 'A5', values: { [s24]: 15 } },
    { id: cat(3, 6), label: 'B1', values: { [s24]: 8 } },
    { id: cat(3, 7), label: 'A6', values: { [s24]: 13 } },
    { id: cat(3, 8), label: 'A7', values: { [s24]: 14 } },
  ],
  referenceLines: [],
  referenceRegions: [],
  yAxisLabel: 'Palavras Recordadas',
  showValues: true,
  showLegend: false,
  showRegionLegend: false,
  description: 'Curva de aprendizagem do RAVLT mostrando a evolução da recordação ao longo das tentativas (A1-A5), interferência (B1) e recordação tardia (A6-A7).',
}

// =============================================================================
// BLOCO 27 — Gráfico Figuras Complexas de Rey (Página 11)
// =============================================================================

const s25 = ser(4)
const reyChartData: ChartData = {
  title: 'Figuras Complexas de Rey',
  chartType: 'bar',
  displayMode: 'grouped',
  series: [{ id: s25, label: 'Percentil', color: '#2E86C1' }],
  categories: [
    { id: cat(4, 1), label: 'Cópia', values: { [s25]: 85 } },
    { id: cat(4, 2), label: 'Memória', values: { [s25]: 75 } },
  ],
  referenceLines: [
    { id: rl(4, 1), label: 'Média (50)', value: 50, color: '#E74C3C' },
  ],
  referenceRegions: withRegionIds(4, PERCENTILE_REGIONS),
  yAxisLabel: 'Percentil',
  showValues: true,
  showLegend: false,
  showRegionLegend: true,
  description: 'Desempenho nas Figuras Complexas de Rey: cópia (habilidade visuoconstrutiva) e memória (memória visual).',
}

// =============================================================================
// BLOCOS 28-29 — Resultados / Funções Executivas (Página 12)
//   26 = subtítulo "Funções Executivas" (só nome)
//   27 = conteúdo intro
// =============================================================================

const resultadosFuncoesExecTitulo = sectionText('', 'Funções Executivas')

const resultadosFuncoesExecConteudo = contentText(`Para avaliação das funções executivas, foi utilizada a Torre de Londres (ToL-BR), que avalia planejamento, resolução de problemas e controle inibitório. Aspectos de flexibilidade cognitiva e controle inibitório também foram avaliados pelo FDT (resultados apresentados na seção Atenção).`)

// =============================================================================
// BLOCO 30 — Tabela Torre de Londres (Página 12)
// =============================================================================

const tolData: ScoreTableData = {
  title: 'Torre de Londres — ToL-BR',
  columns: [
    { id: col(6, 1), label: 'Medida' },
    { id: col(6, 2), label: 'Escore Bruto' },
    { id: col(6, 3), label: 'Percentil' },
    { id: col(6, 4), label: 'Classificação' },
  ],
  rows: [
    { id: row(6, 1), values: { [col(6, 1)]: 'Pontuação Total', [col(6, 2)]: '32', [col(6, 3)]: '85', [col(6, 4)]: 'Alta' } },
    { id: row(6, 2), values: { [col(6, 1)]: 'Tempo Total de Execução', [col(6, 2)]: '—', [col(6, 3)]: '70', [col(6, 4)]: 'Médio' } },
    { id: row(6, 3), values: { [col(6, 1)]: 'Violações de Regras', [col(6, 2)]: '0', [col(6, 3)]: '95', [col(6, 4)]: 'Muito Alta' } },
  ],
  footnote: 'ToL-BR: Torre de Londres – versão brasileira. Avalia planejamento e resolução de problemas.',
}

// =============================================================================
// BLOCO 31 — Gráfico Torre de Londres (Página 12)
// =============================================================================

const s29 = ser(5)
const tolChartData: ChartData = {
  title: 'Torre de Londres — ToL-BR',
  chartType: 'bar',
  displayMode: 'grouped',
  series: [{ id: s29, label: 'Percentil', color: '#2E86C1' }],
  categories: [
    { id: cat(5, 1), label: 'Pontuação Total', values: { [s29]: 85 } },
    { id: cat(5, 2), label: 'Tempo de Execução', values: { [s29]: 70 } },
    { id: cat(5, 3), label: 'Violações de Regras', values: { [s29]: 95 } },
  ],
  referenceLines: [
    { id: rl(5, 1), label: 'Média (50)', value: 50, color: '#E74C3C' },
  ],
  referenceRegions: withRegionIds(5, PERCENTILE_REGIONS),
  yAxisLabel: 'Percentil',
  showValues: true,
  showLegend: false,
  showRegionLegend: true,
  description: 'Desempenho na Torre de Londres com pontuação total, tempo de execução e violações de regras.',
}

// =============================================================================
// BLOCOS 32-33 — Resultados / Comportamento, Humor e Personalidade (Página 13)
//   30 = subtítulo (só nome)
//   31 = conteúdo intro
// =============================================================================

const resultadosComportamentoTitulo = sectionText('', 'Comportamento, Humor e Personalidade')

const resultadosComportamentoConteudo = contentText(`Para investigação de aspectos comportamentais, foi aplicada a Escala de Avaliação de Transtorno de Déficit de Atenção e Hiperatividade – Versão Adolescentes e Adultos (ETDAH-AD) e a Escala de Responsividade Social – 2ª Edição (SRS-2). Para avaliação de personalidade, utilizou-se o Inventário Fatorial de Personalidade (IFP-II). Os aspectos emocionais foram avaliados pelas Escalas Beck (BAI, BDI, BHS).`)

// =============================================================================
// BLOCO 34 — Tabela ETDAH-AD (Página 13)
// =============================================================================

const etdahData: ScoreTableData = {
  title: 'ETDAH-AD — Escala de TDAH para Adolescentes e Adultos',
  columns: [
    { id: col(7, 1), label: 'Subescala' },
    { id: col(7, 2), label: 'Escore' },
    { id: col(7, 3), label: 'Classificação' },
  ],
  rows: [
    { id: row(7, 1), values: { [col(7, 1)]: 'Desatenção', [col(7, 2)]: '18', [col(7, 3)]: 'Limítrofe' } },
    { id: row(7, 2), values: { [col(7, 1)]: 'Hiperatividade/Impulsividade', [col(7, 2)]: '8', [col(7, 3)]: 'Normal' } },
    { id: row(7, 3), values: { [col(7, 1)]: 'Déficit em Funções Executivas', [col(7, 2)]: '12', [col(7, 3)]: 'Normal' } },
    { id: row(7, 4), values: { [col(7, 1)]: 'Problemas Emocionais', [col(7, 2)]: '15', [col(7, 3)]: 'Limítrofe' } },
    { id: row(7, 5), values: { [col(7, 1)]: 'Total', [col(7, 2)]: '53', [col(7, 3)]: 'Normal' } },
  ],
  footnote: 'ETDAH-AD: Escala de Avaliação de Transtorno de Déficit de Atenção e Hiperatividade – Versão Adolescentes e Adultos.',
}

// =============================================================================
// BLOCO 35 — Tabela SRS-2 (Página 13)
// =============================================================================

const srs2Data: ScoreTableData = {
  title: 'SRS-2 — Escala de Responsividade Social',
  columns: [
    { id: col(8, 1), label: 'Escala' },
    { id: col(8, 2), label: 'T-Score' },
    { id: col(8, 3), label: 'Classificação' },
  ],
  rows: [
    { id: row(8, 1), values: { [col(8, 1)]: 'Consciência Social', [col(8, 2)]: '68', [col(8, 3)]: 'Moderado' } },
    { id: row(8, 2), values: { [col(8, 1)]: 'Cognição Social', [col(8, 2)]: '72', [col(8, 3)]: 'Moderado' } },
    { id: row(8, 3), values: { [col(8, 1)]: 'Comunicação Social', [col(8, 2)]: '70', [col(8, 3)]: 'Moderado' } },
    { id: row(8, 4), values: { [col(8, 1)]: 'Motivação Social', [col(8, 2)]: '65', [col(8, 3)]: 'Leve' } },
    { id: row(8, 5), values: { [col(8, 1)]: 'Comportamentos Restritos e Repetitivos', [col(8, 2)]: '74', [col(8, 3)]: 'Moderado' } },
    { id: row(8, 6), values: { [col(8, 1)]: 'Total SRS-2', [col(8, 2)]: '71', [col(8, 3)]: 'Moderado' } },
  ],
  footnote: 'SRS-2: Escala de Responsividade Social – 2ª Edição. T-Scores: ≤59 Normal, 60-65 Leve, 66-75 Moderado, ≥76 Grave.',
}

// =============================================================================
// BLOCO 36 — Tabela IFP-II (Página 14)
// =============================================================================

const ifpData: ScoreTableData = {
  title: 'IFP-II — Inventário Fatorial de Personalidade',
  columns: [
    { id: col(9, 1), label: 'Fator' },
    { id: col(9, 2), label: 'Percentil' },
    { id: col(9, 3), label: 'Classificação' },
  ],
  rows: [
    { id: row(9, 1), values: { [col(9, 1)]: 'Assistência', [col(9, 2)]: '45', [col(9, 3)]: 'Médio' } },
    { id: row(9, 2), values: { [col(9, 1)]: 'Intracepção', [col(9, 2)]: '85', [col(9, 3)]: 'Alto' } },
    { id: row(9, 3), values: { [col(9, 1)]: 'Afago', [col(9, 2)]: '35', [col(9, 3)]: 'Médio' } },
    { id: row(9, 4), values: { [col(9, 1)]: 'Deferência', [col(9, 2)]: '40', [col(9, 3)]: 'Médio' } },
    { id: row(9, 5), values: { [col(9, 1)]: 'Afiliação', [col(9, 2)]: '20', [col(9, 3)]: 'Baixo' } },
    { id: row(9, 6), values: { [col(9, 1)]: 'Dominância', [col(9, 2)]: '55', [col(9, 3)]: 'Médio' } },
    { id: row(9, 7), values: { [col(9, 1)]: 'Desempenho', [col(9, 2)]: '80', [col(9, 3)]: 'Alto' } },
    { id: row(9, 8), values: { [col(9, 1)]: 'Exibição', [col(9, 2)]: '15', [col(9, 3)]: 'Baixo' } },
    { id: row(9, 9), values: { [col(9, 1)]: 'Agressão', [col(9, 2)]: '10', [col(9, 3)]: 'Muito Baixo' } },
    { id: row(9, 10), values: { [col(9, 1)]: 'Ordem', [col(9, 2)]: '75', [col(9, 3)]: 'Médio Superior' } },
    { id: row(9, 11), values: { [col(9, 1)]: 'Persistência', [col(9, 2)]: '90', [col(9, 3)]: 'Muito Alto' } },
    { id: row(9, 12), values: { [col(9, 1)]: 'Mudança', [col(9, 2)]: '30', [col(9, 3)]: 'Médio Inferior' } },
    { id: row(9, 13), values: { [col(9, 1)]: 'Autonomia', [col(9, 2)]: '70', [col(9, 3)]: 'Médio Superior' } },
  ],
  footnote: 'IFP-II: Inventário Fatorial de Personalidade – 2ª Edição.',
}

// =============================================================================
// BLOCO 37 — Tabela Escalas Beck (Página 14)
// =============================================================================

const beckData: ScoreTableData = {
  title: 'Escalas Beck',
  columns: [
    { id: col(10, 1), label: 'Escala' },
    { id: col(10, 2), label: 'Escore' },
    { id: col(10, 3), label: 'Classificação' },
  ],
  rows: [
    { id: row(10, 1), values: { [col(10, 1)]: 'BAI — Inventário de Ansiedade', [col(10, 2)]: '22', [col(10, 3)]: 'Ansiedade moderada' } },
    { id: row(10, 2), values: { [col(10, 1)]: 'BDI — Inventário de Depressão', [col(10, 2)]: '14', [col(10, 3)]: 'Depressão leve' } },
    { id: row(10, 3), values: { [col(10, 1)]: 'BHS — Escala de Desesperança', [col(10, 2)]: '4', [col(10, 3)]: 'Desesperança leve' } },
  ],
  footnote: 'BAI: 0-10 Mínimo, 11-19 Leve, 20-30 Moderado, 31-63 Grave. BDI: 0-11 Mínimo, 12-19 Leve, 20-35 Moderado, 36-63 Grave. BHS: 0-3 Mínimo, 4-8 Leve, 9-14 Moderado, ≥15 Grave.',
}

// =============================================================================
// BLOCOS 38-39 — Análise dos Resultados (Páginas 14-16)
//   36 = título da seção (só nome)
//   37 = conteúdo
// =============================================================================

const analiseTitulo = sectionText('ANÁLISE DOS RESULTADOS, OBSERVAÇÕES CLÍNICAS E COMPORTAMENTAIS')

const analiseConteudo = contentText(`O avaliando Weverton da Silva Souza, 32 anos, apresentou funcionamento intelectual na faixa Superior, com QI Total de 131 (percentil 98), indicando que seu desempenho se situa acima de aproximadamente 98% da população de sua faixa etária. Destaca-se a homogeneidade relativa entre os índices fatoriais, com desempenho Superior em Compreensão Verbal (ICV = 128) e Organização Perceptual (IOP = 123), Médio Superior em Memória Operacional (IMO = 117) e Médio em Velocidade de Processamento (IVP = 108).

O perfil cognitivo evidencia forças significativas nas habilidades verbais — vocabulário amplo, raciocínio verbal abstrato e conhecimento geral consolidado — e nas habilidades perceptuais não-verbais — raciocínio lógico-abstrato, análise e síntese visuoespacial. A Velocidade de Processamento, embora na faixa Média, representa um ponto relativamente mais baixo no perfil, o que é um achado frequente em indivíduos com altas habilidades intelectuais e/ou condições do neurodesenvolvimento como o TEA.

No domínio atencional, avaliado pelo Five Digit Test (FDT), o avaliando demonstrou desempenho globalmente Alto a Muito Alto em todas as etapas, indicando boa velocidade de processamento automático (Leitura, percentil 95), atenção sustentada (Contagem, percentil 80), atenção seletiva e controle inibitório (Escolha, percentil 90; Inibição, percentil 85), atenção alternada (Alternância, percentil 85) e flexibilidade cognitiva (Flexibilidade, percentil 90). Os resultados descartam comprometimento atencional primário.

As funções mnésticas foram avaliadas pelo RAVLT e pelas Figuras Complexas de Rey. No RAVLT, o avaliando apresentou curva de aprendizagem ascendente e consistente (A1 = 8 → A5 = 15), com total de aprendizagem de 62 palavras (percentil 85, Alta). A recordação após interferência (A6 = 13) e a recordação tardia (A7 = 14) mantiveram-se elevadas, indicando boa consolidação e resistência à interferência. O reconhecimento foi excelente (15/15, percentil 95). Nas Figuras Complexas de Rey, a cópia foi classificada como Alta (percentil 85), demonstrando boa organização visuoespacial e planejamento. A memória visual foi classificada como Média Superior (percentil 75), indicando boa capacidade de retenção visual.

As funções executivas, avaliadas pela Torre de Londres, revelaram desempenho Alto na pontuação total (percentil 85), indicando boa capacidade de planejamento e resolução de problemas. Não foram observadas violações de regras (percentil 95), demonstrando excelente controle inibitório e respeito às restrições da tarefa. O tempo de execução situou-se na faixa Média (percentil 70), sugerindo um estilo de resolução mais reflexivo e cauteloso.

Na investigação de sintomas de TDAH (ETDAH-AD), os escores não atingiram ponto de corte para diagnóstico. A subescala de Desatenção apresentou escore limítrofe, o que pode estar relacionado a fatores atencionais secundários (ansiedade, sobrecarga sensorial) e não a um déficit atencional primário, uma vez que o desempenho no FDT foi consistentemente alto.

Na Escala de Responsividade Social (SRS-2), o avaliando apresentou T-Score total de 71, classificado como Moderado, com elevações em todas as subescalas — Consciência Social (68), Cognição Social (72), Comunicação Social (70), Motivação Social (65) e Comportamentos Restritos e Repetitivos (74). Este perfil é compatível com dificuldades significativas na cognição social, na leitura de pistas sociais e na adaptação comportamental a contextos sociais, características frequentemente observadas no Transtorno do Espectro do Autismo.

O perfil de personalidade avaliado pelo IFP-II revelou traços característicos: elevada Persistência (percentil 90), indicando alta motivação para concluir tarefas; elevada Intracepção (percentil 85), sugerindo tendência à reflexão e valorização de experiências internas; elevado Desempenho (percentil 80), indicando busca por excelência; e elevada Autonomia (percentil 70) e Ordem (percentil 75). Por outro lado, apresentou baixa Afiliação (percentil 20), baixa Exibição (percentil 15) e muito baixa Agressão (percentil 10), configurando um perfil de indivíduo introspectivo, independente, pouco competitivo e com baixa necessidade de exposição social. O fator Mudança baixo (percentil 30) sugere preferência por rotinas e previsibilidade.

Nos indicadores emocionais (Escalas Beck), o avaliando apresentou ansiedade moderada (BAI = 22), depressão leve (BDI = 14) e desesperança leve (BHS = 4). A ansiedade moderada merece atenção clínica e pode estar associada às dificuldades sociais e à sobrecarga sensorial relatadas, sendo frequente a comorbidade entre TEA e transtornos de ansiedade.

Do ponto de vista qualitativo e comportamental, durante as sessões de avaliação observou-se: comunicação verbal adequada em conteúdo, porém com pouca modulação prosódica; contato visual presente mas breve e intermitente; postura corporal rígida; pouca gesticulação durante a fala; dificuldade em elaborar espontaneamente sobre temas emocionais; respostas diretas e objetivas; boa tolerância à frustração em tarefas difíceis; e alto nível de engajamento em atividades que envolviam lógica e raciocínio.

Os resultados devem ser compreendidos como um retrato do funcionamento cognitivo, comportamental e emocional do avaliando no momento da avaliação, considerando seu histórico de vida e contexto clínico atual.`)

// =============================================================================
// BLOCO 40 — Impressão Diagnóstica (Página 16)
// =============================================================================

const impressaoDiagnosticaData: InfoBoxData = {
  label: 'IMPRESSÃO DIAGNÓSTICA',
  content: `Com base nos resultados quantitativos e qualitativos obtidos na avaliação neuropsicológica, na história clínica e de desenvolvimento e nas observações comportamentais realizadas, conclui-se:

1. ALTAS HABILIDADES/SUPERDOTAÇÃO (AH/SD) — O perfil intelectual do avaliando é compatível com Altas Habilidades/Superdotação na área intelectual, com QI Total de 131 (Superior, percentil 98), desempenho consistentemente elevado em múltiplos domínios cognitivos e histórico de aprendizagem precoce e autodidata.

2. TRANSTORNO DO ESPECTRO DO AUTISMO (TEA) — O quadro clínico é compatível com Transtorno do Espectro do Autismo sem deficiência intelectual (CID-11: 6A02.0 / CID-10: F84.0), com necessidade de suporte Nível 1. O diagnóstico fundamenta-se nas dificuldades persistentes de comunicação e interação social, padrão de interesses restritos e comportamentos repetitivos, preferência por rotinas, dificuldades sensoriais e perfil de personalidade compatível.

3. DUPLA EXCEPCIONALIDADE (2e) — O avaliando apresenta um quadro de Dupla Excepcionalidade, caracterizado pela coexistência de Altas Habilidades/Superdotação e Transtorno do Espectro do Autismo. Este perfil demanda atenção especializada tanto para o desenvolvimento do potencial intelectual quanto para o suporte às dificuldades sociais e comportamentais.`,
}

// =============================================================================
// BLOCOS 41-42 — Sugestões e Encaminhamentos (Página 16)
//   39 = título da seção (só nome)
//   40 = conteúdo com labeled items
// =============================================================================

const sugestoesTitulo = sectionText('SUGESTÕES E ENCAMINHAMENTOS')

const sugestoesConteudo = contentText(
  'Com base nos resultados da avaliação, sugere-se os seguintes encaminhamentos e intervenções:',
  [
    {
      id: li(40, 1),
      label: 'Psiquiatra',
      text: 'Manter acompanhamento psiquiátrico para manejo farmacológico da ansiedade e demais demandas emocionais do paciente. Compartilhar os resultados desta avaliação para orientação diagnóstica e ajuste terapêutico.',
    },
    {
      id: li(40, 2),
      label: 'Psicólogo (TCC)',
      text: 'Psicoterapia na abordagem cognitivo-comportamental (TCC), com foco em: desenvolvimento de habilidades sociais e treinamento em cognição social; regulação emocional e manejo da ansiedade; psicoeducação sobre TEA e Dupla Excepcionalidade; reestruturação de crenças disfuncionais sobre si mesmo e relações sociais; estratégias de enfrentamento para situações de sobrecarga sensorial.',
    },
    {
      id: li(40, 3),
      label: 'Terapeuta Ocupacional',
      text: 'Avaliação e intervenção em integração sensorial, com foco no perfil sensorial do paciente (hipersensibilidade auditiva e tátil), desenvolvimento de estratégias adaptativas para ambientes com sobrecarga sensorial e orientações para adequação do ambiente de trabalho e vida cotidiana.',
    },
  ],
  true,
)

// =============================================================================
// BLOCO 43 — Referências Bibliográficas (Página 17)
// =============================================================================

const referenciasData: ReferencesData = {
  title: 'REFERÊNCIAS BIBLIOGRÁFICAS',
  references: [
    'Alves, I. C. B., Lemes, R. B., & Rabelo, I. S. (2019). Inventário Fatorial de Personalidade – IFP-II. São Paulo: Pearson.',
    'Benczik, E. B. P. (2013). Escala de Avaliação de Transtorno de Déficit de Atenção e Hiperatividade – Versão Adolescentes e Adultos – ETDAH-AD. 1ª ed. São Paulo: Vetor.',
    'Brião, J. C., & Campanholo, K. R. (2018). Funções executivas. In E. C. Miotto, K. R. Campanholo, V. T. Serrão & B. T. Trevisan (Orgs.), Manual de Avaliação Neuropsicológica (Vol. 1). São Paulo: Memnon.',
    'Cardoso, C. O., Pureza, J. R., Gonçalves, H. A., Jacobsen, G., Senger, J., Colling, A. P. C., & Fonseca, R. P. (2015). Funções executivas e regulação emocional. In N. M. Dias & T. Mecca (Orgs.), Contribuições da neuropsicologia e da psicologia para intervenção no contexto educacional. São Paulo: Memnon.',
    "D'Paula, J. J., & Malloy-Diniz, L. F. (2018). Teste de Aprendizagem Auditivo-Verbal de Rey – RAVLT. São Paulo: Vetor.",
    'Diamond, A. (2013). Executive functions. Annual Review of Psychology, 64, 135-168.',
    'Gruber, C. P., & Constantino, J. N. (2021). Escala de Responsividade Social – SRS-2. São Paulo: Hogrefe CETEPP.',
    'Hu, W., & Adey, P. (2002). A scientific creativity test for secondary school students. International Journal of Science Education, 24(4), 389-403.',
    'Malloy-Diniz, L. F., Fuentes, D., Mattos, P., & Abreu, N. (2010). Avaliação neuropsicológica. Porto Alegre: Artmed.',
    'Malloy-Diniz, L. F., De Paula, J. J., Sedó, M., Fuentes, D., & Leite, W. B. (2014). Neuropsicologia das funções executivas e da atenção. In D. Fuentes, L. F. Malloy-Diniz, C. H. P. Camargo & R. M. Cosenza (Orgs.), Neuropsicologia: Teoria e Prática (2ª ed.). Porto Alegre: Artmed.',
    'Pessotto, F., & Bartholomeu, D. (2019). Guia prático das Escalas Wechsler: uso e análise das escalas WISC-IV, WAIS-III e WASI. São Paulo: Pearson Clinical Brasil.',
    'Rey, A. (2014). Figuras Complexas de Rey – Teste de Cópia e de Reprodução de Memória de Figuras Geométricas Complexas (2ª ed.). São Paulo: Pearson.',
    'Sedó, M., Paula, J. J., & Malloy-Diniz, L. F. (2015). O Teste dos Cinco Dígitos – FDT – Five Digit Test. São Paulo: Hogrefe CETEPP.',
    'Serpa, A., Timóteo, A., Oliveira, R., Querino, E., & Malloy-Diniz, L. F. (2023). Torre de Londres – ToL-BR. São Paulo: Vetor.',
    'Wechsler, D. (2017). Escala de Inteligência Wechsler para Adultos – 3ª Edição (WAIS-III). São Paulo: Pearson.',
  ],
}

// =============================================================================
// BLOCO 44 — Termo de Entrega (Página 18)
// =============================================================================

const termoData: ClosingPageData = {
  title: 'TERMO DE ENTREGA E CIÊNCIA',
  bodyText: `Eu, Weverton da Silva Souza, confirmo que o laudo de avaliação neuropsicológica foi entregue. Afirmo que a profissional responsável explicou o conteúdo do documento durante a sessão de devolutiva, entregando 1 (uma) via do laudo impresso e uma cópia em arquivo PDF.

Coloco-me à disposição para esclarecimentos.`,
  showPatientSignature: true,
  showMotherSignature: false,
  showFatherSignature: false,
  showGuardianSignature: false,
  footerNote: `Importante ressaltar que este documento:
1. Não pode ser utilizado para fins diferentes do apontado no item de identificação do documento.
2. Tem caráter sigiloso, extrajudicial, não cabendo à psicóloga responsabilizar-se por seu uso após a entrega do laudo.
3. A análise isolada deste laudo não tem valor diagnóstico se não for avaliado em conjunto com os dados clínicos, epistemológicos, exames de neuroimagem e laboratoriais adicionais ao paciente.`,
}

// =============================================================================
// Montagem final — 43 blocos
// =============================================================================

function block(id: string, type: Block['type'], order: number, data: Block['data']): Block {
  return { id, type, order, data, collapsed: false }
}

export const MOCK_LAUDO_WEVERTON: Laudo = {
  id: 'mock-laudo-weverton',
  createdAt: '2025-03-14T10:00:00.000Z',
  updatedAt: '2025-03-14T18:00:00.000Z',
  status: 'finalizado',
  patientName: 'Weverton da Silva Souza',
  patientId: 'patient-weverton',
  blocks: [
    // ── Identificação ──────────────────────────────────────────────
    block(blk(0), 'identification', 0, identificationData),

    // ── Descrição da Demanda ───────────────────────────────────────
    block(blk(1), 'text', 1, demandaTitulo),
    block(blk(2), 'text', 2, demandaConteudo),

    // ── Procedimentos ─────────────────────────────────────────────
    block(blk(3), 'text', 3, procedimentosTitulo),
    block(blk(4), 'text', 4, procedimentosConteudo),

    // ── Anamnese ──────────────────────────────────────────────────
    block(blk(5), 'text', 5, anamneseTitulo),
    block(blk(6), 'text', 6, anamneseDadosPessoaisTitulo),
    block(blk(7), 'text', 7, anamneseDadosPessoaisConteudo),
    block(blk(8), 'text', 8, anamnaseHistoricoClinicoTitulo),
    block(blk(9), 'text', 9, anamnaseHistoricoClinicoConteudo),
    block(blk(10), 'text', 10, anamnaseHistoricoEscolarTitulo),
    block(blk(11), 'text', 11, anamnaseHistoricoEscolarConteudo),

    // ── Resultados / Inteligência ─────────────────────────────────
    block(blk(12), 'text', 12, resultadosTitulo),
    block(blk(13), 'text', 13, resultadosInteligenciaTitulo),
    block(blk(14), 'text', 14, resultadosInteligenciaConteudo),
    block(blk(15), 'score-table', 15, waisIndicesData),
    block(blk(16), 'score-table', 16, waisSubtestesData),
    block(blk(17), 'chart', 17, waisChartData),

    // ── Resultados / Atenção ──────────────────────────────────────
    block(blk(18), 'text', 18, resultadosAtencaoTitulo),
    block(blk(19), 'text', 19, resultadosAtencaoConteudo),
    block(blk(20), 'score-table', 20, fdtData),
    block(blk(21), 'chart', 21, fdtChartData),

    // ── Resultados / Memória ──────────────────────────────────────
    block(blk(22), 'text', 22, resultadosMemoriaTitulo),
    block(blk(23), 'text', 23, resultadosMemoriaConteudo),
    block(blk(24), 'score-table', 24, ravltData),
    block(blk(25), 'score-table', 25, reyData),
    block(blk(26), 'chart', 26, ravltChartData),
    block(blk(27), 'chart', 27, reyChartData),

    // ── Resultados / Funções Executivas ───────────────────────────
    block(blk(28), 'text', 28, resultadosFuncoesExecTitulo),
    block(blk(29), 'text', 29, resultadosFuncoesExecConteudo),
    block(blk(30), 'score-table', 30, tolData),
    block(blk(31), 'chart', 31, tolChartData),

    // ── Resultados / Comportamento, Humor e Personalidade ─────────
    block(blk(32), 'text', 32, resultadosComportamentoTitulo),
    block(blk(33), 'text', 33, resultadosComportamentoConteudo),
    block(blk(34), 'score-table', 34, etdahData),
    block(blk(35), 'score-table', 35, srs2Data),
    block(blk(36), 'score-table', 36, ifpData),
    block(blk(37), 'score-table', 37, beckData),

    // ── Análise dos Resultados ────────────────────────────────────
    block(blk(38), 'text', 38, analiseTitulo),
    block(blk(39), 'text', 39, analiseConteudo),

    // ── Impressão Diagnóstica ─────────────────────────────────────
    block(blk(40), 'info-box', 40, impressaoDiagnosticaData),

    // ── Sugestões e Encaminhamentos ───────────────────────────────
    block(blk(41), 'text', 41, sugestoesTitulo),
    block(blk(42), 'text', 42, sugestoesConteudo),

    // ── Referências ───────────────────────────────────────────────
    block(blk(43), 'references', 43, referenciasData),

    // ── Termo de Entrega ──────────────────────────────────────────
    block(blk(44), 'closing-page', 44, termoData),
  ],
}
