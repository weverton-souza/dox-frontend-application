# CLAUDE.md — Regras do Projeto Dox Frontend

## Idioma

- UI, labels, mensagens de erro e placeholders: **sempre em português brasileiro**
- Nomes de variáveis, funções, interfaces e tipos: **sempre em inglês**
- Commits: **português brasileiro**, usando conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`)
- Nunca incluir `Co-Authored-By` nos commits

## Stack e Versões

- React 19 + TypeScript + Vite
- Tailwind CSS **v3** (não v4)
- Chart.js 4 direto com canvas refs (nunca usar `react-chartjs-2`)
- Plate.js (platejs) para rich text WYSIWYG (bold, itálico, sublinhado, riscado, listas, alinhamento)
- `docx` 9 para geração de .docx in-browser

## Features do Projeto

### Relatórios (Reports)
- Editor de blocos com drag-and-drop (dnd-kit) e auto-save via API
- 9 tipos de bloco: identification, section, text, score-table, info-box, chart, references, closing-page, cover
- Bloco de Capa (`cover`) como bloco-raiz singleton opcional — título editorial centralizado + subtítulo (default: nome do cliente) + metadados do profissional no pé. Primeira página do `.docx`
- Blocos-raiz singletons (cover, identification, closing-page) podem ser removidos e re-adicionados livremente via modal `AddRootBlockModal` que aparece ao clicar "+ Adicionar Seção" no sumário
- Hierarquia explícita com `parentId` — blocos section podem conter outros blocos (multinível)
- DnD com projeção de profundidade: arrastar horizontal muda nível (esquerda=subir, direita=descer)
- Blocos não-section impedidos de ir para raiz (apenas sections no depth 0)
- Ícones coloridos por tipo nos cards: cinza (estrutura), azul (texto), âmbar (tabela), rose (gráfico), roxo (info-box)
- Seções com fundo zebra alternado e pill combinado contagem/adicionar
- Sidebar com árvore de navegação (OutlineTree) e IntersectionObserver para destaque ativo
- Criação a partir de templates (2 padrões: Adulto e Breve) ou do zero
- Versionamento com snapshots manuais e automáticos (máx. 20 por relatório)
- Status com transições: rascunho → em_revisão → finalizado
- Exportação .docx in-browser com header profissional, logo, rodapé com ícones sociais e paginação
- Gráficos Chart.js (bar/line) com modos grouped/separated, linhas e regiões de referência, exportados como PNG no .docx
- Templates de gráfico pré-configurados (10 padrões): WAIS-III Subtestes, WAIS-III Índices, RAVLT Curva, FDT, BDI-II, BAI, SRS-2, ToL-BR, Perfil Cognitivo, TMT
- Seleção de template ao criar gráfico via BlockSelector (flow em 2 steps)
- Salvar gráfico como template customizado com nome, instrumento e categoria
- Editor layout único (modo Documento): `ReportSummary` à esquerda com árvore mestre (bolinhas, L-curves, trunks, colapsar seções) + `SectionEditor` à direita renderizando apenas blocos da seção ativa
- Identificação e Encerramento participam da árvore no root como itens do sumário
- Blocos editáveis inline (`InlineBlock`) para todos os 7 tipos — iniciam colapsados ao trocar de seção, expansíveis via chevron; botão "Expandir em modal" abre o `BlockEditModal` tradicional em tela cheia
- Mover blocos entre seções via `MoveBlocksModal` (checkbox por bloco + árvore de destino com opção "Raiz do documento")
- Excluir seção via `SectionDeleteModal` (opção de mover filhos ou excluir tudo)
- Título de seção editável inline no header do `SectionEditor`
- Numeração ABNT automática (toggle na toolbar lateral via `section-numbering.ts`): 1, 2.1, 2.2, 3.1.1... sem ponto, renumera em add/remove/reorder
- Header Figma-style do editor: sticky, backdrop blur, center = template · cliente · status pill; direita = Assistente (secondary) + Finalizar (verde) ou Baixar (azul)
- Finalizar pede digitar "finalizar" no `AiFinalizationModal` para confirmar; uma vez finalizado, não há UI de reabrir
- Preview do `.docx` acionado pelo ícone na toolbar lateral, abrindo em `PreviewModal` redimensionável
- Hierarquia tipográfica gradativa no `.docx`: 28pt bold (primária) → 22pt bold (secundária) → 20pt bold itálico (terciária) → 20pt itálico com indent (quaternária+)
- Títulos no `.docx` respeitam o case digitado (não força uppercase)
- Terminologia unificada na UI: sempre "relatório" (nunca "laudo")
- Rich text WYSIWYG (Plate.js) com bold, itálico, sublinhado, riscado, listas (bullet/numerada), alinhamento (L/C/R/J) nos blocos de texto
- Conteúdo armazenado em Slate JSON (array de nós), com backward compat para HTML legado (auto-conversão no load)
- Itens rotulados (key-value) nos blocos de texto
- Tabelas dinâmicas com colunas nomeadas pelo usuário (score-table)
- Engine de fórmulas v2: classificação por faixa, operações matemáticas (soma, subtração, média), agregações por coluna e linha
- Fórmulas digitáveis nas células (prefixo `=`) com autocomplete de funções, auto-uppercase, e barra de fórmulas
- Referências de célula (A1, B23) e ranges de coluna (A:A) — referências standalone de coluna (A, B) não aceitas
- Cores em fórmulas via sintaxe `@#RRGGBB` — color picker visual com presets, input hex, e slider de intensidade com marcadores (10-90)
- Aplicação em lote de intensidade (lightness) a todas as cores da tabela, mantendo hue de cada uma
- Replicação de fórmulas: ao confirmar com Enter, popup oferece replicar para mesma linha ou coluna com ajuste automático de referências (como Excel)
- Detecção de conflitos: ao replicar sobre células que já possuem fórmula, popup pergunta se quer sobrepor ou manter existentes
- Alinhamento por coluna (esquerda/centro/direita) com toggle no header — headers sempre centralizados
- Salvar tabela como template customizado com nome, instrumento e categoria
- Templates de tabela de escores com fórmulas embutidas: WAIS-III, RAVLT, FDT, BDI-II, BAI, SRS-2, ToL-BR
- FormulaEditor visual para configurar fórmulas por coluna ou célula (sem digitação de expressões)
- Seleção de template ao criar tabela de escores via BlockSelector (flow em 2 steps)
- Valores calculados automaticamente no editor e no export .docx
- `adjustFormulaRefs()` em formula-parser.ts: ajusta referências de célula ao replicar (deltaCol/deltaRow)
- `remapFormulaRefs()` em formula-parser.ts: remapeia referências ao reordenar linhas/colunas (permutação)
- Cell ranges nas fórmulas: sintaxe `A1:A4` e `A1:B3` para intervalos de células (single e multi-coluna)
- Funções SOMA, MEDIA, MIN, MAX, CONT aceitam ranges como argumento (ex: `=SOMA(A1:A4;B1:B4)`)
- Reordenar linhas com drag-and-drop (grip handle no número da linha)
- Reordenar colunas com drag-and-drop (grip handle no header da coluna)
- Fórmulas com referências posicionais (A1, B2, A1:A4, A:A) são remapeadas automaticamente ao reordenar
- Página de encerramento com assinaturas configuráveis (profissional, cliente, mãe, pai, responsável)

### Clientes (Customers)
- Cadastro completo: dados pessoais, contato, dados clínicos
- Busca por nome ou CPF com paginação
- Perfil com 6 abas: Dados Pessoais, Contato, Dados Clínicos, Relatórios, Notas, Histórico
- Notas clínicas com timestamp
- Timeline de eventos (consulta, retorno, avaliação, relatório, observação) agrupados por mês/ano
- Vínculo com relatórios via customerId — criar relatório a partir do cliente pré-preenche o bloco de identificação
- Dados do cliente são copiados para o relatório (não vinculados — edição no relatório não altera o cadastro)

### Formulários (Forms)
- Construtor de formulários com 11 tipos de campo: short-text, long-text, single-choice, multiple-choice, scale, yes-no, date, section-header, inventory-item, likert-matrix, address
- 3 formulários padrão: Adulto (32 campos), Infantil (29 campos), Breve (7 campos)
- Drag-and-drop para reordenação de campos
- Preview do formulário como o usuário final vê
- Modo manual de salvamento via `useFormBuilderDraft` (rascunho em localStorage por form, pill de status no header `Salvo` / `Não salvo · Cancelar · Salvar` / `Salvando…`, toast pós-save com a versão criada)
- Versionamento SemVer (`current_major`/`current_minor` no domain): in-place enquanto sem respostas; após a primeira, classifica diff em cosmetic (minor++) ou structural (major++ minor=0) ou no-op
- Validações inline em short-text via dropdown: CPF, Telefone (BR), Email, CEP. Máscaras em tempo real e mensagens específicas no submit
- Tipo `address`: bloco com 7 subcampos (zipCode/street/number/complement/neighborhood/city/state); cada subcampo com checkbox `enabled` e `required` (analogia da Matriz Likert). Auto-preenchimento via `GET /public/address/lookup/{cep}` (Spring Cloud OpenFeign + ViaCEP no backend) ao 8º dígito do CEP. Labels exibidas em PT-BR; chaves internas em inglês
- Likert-matrix: enunciado opcional, rótulos contextuais no editor (`Enunciado` em vez de `Pergunta`, `Opções` em vez de `Perguntas (linhas)`)
- Duplicação de formulários

### Preenchimento de Formulários
- Interface de preenchimento com renderização por tipo de campo (FormFieldRenderer)
- Validação de campos obrigatórios via `useFormValidation` com `Map<id, mensagem>`; `getFieldError` retorna mensagem específica por tipo
- Asterisco vermelho ao lado do label nos required; asterisco solto na posição do label quando label vazio (likert sem enunciado); no `address`, só os subcampos required exibem asterisco (label principal sem)
- Auto-save com debounce
- Status: em_andamento → concluído
- Suporte a pré-preenchimento via cliente

### Geração de Relatório a partir de Respostas
- Pipeline de geração via IA: buildPrompt → generateReportFromResponse → parseAIResponse
- Suporte a múltiplos formulários por geração (formResponseIds)
- Fontes de dados expandíveis por seção no checklist de geração (Apple-style)
- Rastreamento de fontes usadas em cada geração (ai_generation_sources)
- Sistema de variáveis com sintaxe {{chave}} resolvidas de dados do cliente e respostas do formulário
- Mapeamento campo→seção com hints para a IA
- Resolução de variáveis (variable-service) em blocos text e info-box
- Preview do relatório atualiza automaticamente após geração
- Status "requer mais informações" para seções com dados insuficientes

### Configurações (rota `/settings`)
- Sidebar de Configurações com 7 abas: **Geral** (default), **Conta**, Privacidade, Cobrança, Uso, Notificações, Segurança
- Layout em `src/routes/Settings.tsx` (wrapper com `<Outlet />`) + `src/components/settings/SettingsSidebar.tsx`
- `SettingsPlaceholder.tsx` para abas ainda não implementadas (Em breve)
- Avatar dropdown no `GlobalTopBar` linka para `/settings` (default redireciona para `/settings/account`)
- Modal `ProfessionalModal` removido — conteúdo migrado para páginas de Settings

### Conta (`/settings/account`)
- Hero card com avatar gradient (`getAvatarColor` + `getInitials`), nome, email e badges "Conta ativa" + vertical formatado
- `AccountForm.tsx` com 4 sections: Identidade pessoal, Identidade profissional, Endereço de atendimento, Sobre você
- Identidade pessoal: Nome, Nome social, Gênero (Select: Prefiro não informar / Feminino / Masculino / Não-binário / Outro)
- Identidade profissional: Conselho generalizado (CRP/CREA/OAB/CRM/CRO/CRN/CFFa/Psicopedagogia/Outro) + Número + UF, Especialização
- Endereço de atendimento: Cidade + UF (aparece no rodapé do .docx)
- Sobre você: Bio em textarea (até 500 chars com contador)
- Helper `lib/professional-format.ts` com `formatCouncil(prof)` e `formatCouncilWithFallback` — prioriza novo formato (`councilType + councilNumber + councilState`), cai para `crp` legado
- Tipo `Professional` ganha 8 campos opcionais: `socialName`, `gender`, `councilType`, `councilNumber`, `councilState`, `addressCity`, `addressState`, `bio`
- `lib/docx-engine/generator.ts` atualizado em 5 lugares para usar `formatCouncil` (header docx, profRows identification, metaLines, signature subtitle)
- Badge "vertical formatado" usa `formatVertical(user.vertical)` de `lib/vertical-format.ts` — mapeia as verticals do backend em lowercase (`health` → "Saúde", `nutrition` → "Nutrição", `social_work` → "Serviço Social", etc.)

### Customer label dinâmico (Maio 2026)
- `useCustomerLabel()` em `lib/hooks/` retorna `{ singular, plural }` lendo do `AuthContext.user.customerLabel` (vem resolvido do backend), com fallback pro localStorage (`dox_customer_label`) pra carregamento instantâneo, e por último `'Cliente'`
- Cache em **localStorage** (`getStoredCustomerLabel` / `setStoredCustomerLabel` em `api-client`) sobrevive ao fechar tab — UI carrega com label correta antes do AuthContext hidratar
- `AuthResponse` + `AuthUser` ganham `customerLabel: string`. `Professional` ganha `customerLabelOverride?: string | null`
- Label vem da vertical do tenant (definida no cadastro) — sem UI pra editar. Backend mantém capacidade via `customer_label_override` mas o frontend não expõe
- Strings "Cliente"/"Clientes" hardcoded substituídas em todos os pontos de UI: Sidebar, CustomerList, CustomerProfile, NewReportModal, GenerateReportModal, AiFinalizationModal, VersionHistoryModal, CreateEventModal, ReportList, FormResponseList, MultiRespondentSendModal, FormComparisonView, IdentificationBlock
- `.docx` gerado também usa label dinâmica: header do relatório ("DADOS DO(A) PACIENTE"), assinatura de paciente em closing page, header de form impresso ("Paciente: …"), rodapé do paradata. Resolução via `prof.customerLabel` (vem do `getProfessional()` quando o docx é gerado) com fallback localStorage
- Backend permanece com `customer*` em todos os endpoints — só a label exibida muda

### Geral (`/settings/general`)
- `SettingsGeneral.tsx` renderiza `ThemeSelector` + `DocumentBrandingForm`
- `DocumentBrandingForm.tsx` (`src/components/settings/`): Logo (cabeçalho do .docx) + Contatos e Redes Sociais (rodapé do .docx)
- `ThemeSelector` mantém os 4 cards: Clássico, Terroso, Grave, Suave

### Sistema de Temas (Paletas)
- 4 paletas visuais definidas em `src/lib/theme/palettes.ts`: `classico` (Flat UI 2 baseline), `terroso` (outono warm dessaturado), `grave` (inverno profundo saturado), `suave` (verão cool muted)
- Cada `ThemePalette` tem: `colors` (20 hex no grid 5×4 semântico) + `chrome` (primary, secondary, surface, border, headerText para o .docx)
- Grid 5×4 semântico: colunas = matizes (verde, teal, azul, roxo, gray / amarelo, laranja, vermelho, pink, dark), linhas = valor (L1/L2 frios, L3/L4 quentes)
- Preferência global em localStorage via `src/lib/theme/preference.ts` (chave `dox-preferred-palette`) + evento custom `dox-palette-changed` para reatividade na mesma aba
- Hook reativo `useActivePalette()` em `src/lib/hooks/` — `useSyncExternalStore` escutando storage + evento custom
- `ColorPicker` aceita prop opcional `palette?: readonly string[]`; se omitida, usa `useActivePalette()` — swatches mudam quando usuária troca tema
- Morph automático de cores entre paletas via `morphHex(hex, targetPalette)` em `src/lib/theme/palette-morph.ts` — acha o slot da cor em alguma paleta conhecida e retorna o hex equivalente no tema ativo. Cores custom (off-grid) ficam literais. Preserva alpha (`#RRGGBBAA`)
- Aplicado no `.docx` generator (`generateDocx(report, { themeId? })`) — chrome vem de `_activePalette.chrome`, cores de gráfico (séries, regiões, linhas de ref) e dots da tabela passam por morph
- Aplicado no `ChartBlock` ao vivo — `useMemo` gera `morphedData` que alimenta o Chart.js; re-renderiza quando tema muda
- `EventTagModal` usa paleta ativa para default color de novas tags; tags existentes mantêm a cor salva (canonical)

### Design System
- Tokens centralizados em `src/styles/design-tokens.css` com CSS custom properties
- Duas camadas: primitivas (cores raw) e semânticas (surface, border, text, brand)
- Paleta azul Apple (#007AFF) + cinzas quentes Apple (#F5F5F7)
- Sombras multi-layer estilo Apple (xs, sm, md, lg, xl, card, dropdown, modal)
- Tailwind config consome os tokens via `var()` — alterações no CSS propagam automaticamente
- Navegação: GlobalTopBar (avatar, settings, logout) + PageHeader (toolbar contextual por página)
- Font stack: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui

### Persistência (Backend REST API)
- Backend: dox-backend-application (Spring Boot + Kotlin + PostgreSQL)
- HTTP client: axios com interceptors JWT (auto-refresh em TOKEN_EXPIRED)
- Autenticação: JWT (accessToken em memória, refreshToken em localStorage)
- Error handling: RFC 7807 ProblemDetail → ErrorModal global (PT-BR)
- API services em `src/lib/api/`: customer-api, report-api, form-api, template-api, professional-api, workspace-api
- Contextos: AuthContext (auth state + session), ErrorContext (error modal global)
- Rotas protegidas via ProtectedRoute (redirect para /login se não autenticado)

## Nomenclatura Frontend ↔ Backend

| Frontend | Backend | Nota |
|----------|---------|------|
| Customer | Customer | `data` field é JSONB no backend |
| Report | Report | `customerName`, `customerId` |
| Form | Form | Estrutura similar |
| FormResponse | FormResponse | `customerId`, `customerName`, `generatedReportId` |
| ReportTemplate | ReportTemplate | - |
| ReportVersion | ReportVersion | `reportId`, `customerName` |
| Professional | ProfessionalSettings | Campos top-level (não nested) |

## Próximas Features

### Revisão de Texto por IA
- Botão "Revisar com Assistente" no menu de ações do bloco de texto
- Opções: correção gramatical, melhoria técnica, resumir, expandir
- Modal com texto original + opções → IA processa → diff antes/depois → aceitar ou descartar

### Upload de Arquivos do Cliente
- Tabela `customer_files` já criada (S3 key, tipo, categoria)
- Upload de exames, laudos anteriores, encaminhamentos
- Integração como fonte de dados na geração por IA (extração de texto via PDFBox)

### Templates Locked/Unlocked
- Modo template (locked): estrutura fixa, profissional só preenche dados
- Modo livre (unlocked): edição completa como hoje

### Download em PDF
- Conversão .docx → PDF via LibreOffice headless no backend

### Acompanhamento do Cliente
- Perguntas configuráveis por cliente (profissional define quais perguntas acompanhar)
- Tela PWA/webview para o cliente: formulário diário com layout limpo
- Rota separada para o cliente (`/p/:id`) com layout sem sidebar/menu do profissional
- Painel da profissional: timeline de respostas + gráficos de evolução
- Resumo pelo Assistente: sintetizar dados de acompanhamento

### Tabelas de Escores — Melhorias
- Redimensionar largura das colunas (arrastar borda do header)

## Organização de Arquivos

```
src/
  types/index.ts           → todas as interfaces, tipos, constantes e factory functions
  lib/                     → lógica de negócio, utilitários, serviços
  lib/api/                 → API services (api-client, auth-service, error-handler, *-api.ts)
  lib/block-constants.tsx  → labels, cores, ícones e getBlockTitle()
  lib/report-utils.ts      → criação de relatórios (createEmptyReport, createReportFromCustomer)
  lib/theme/               → sistema de paletas (palettes, registry, preference, palette-morph)
  lib/hooks/               → custom hooks reutilizáveis (useAutoSave, useFormBuilderDraft, useConfirmDelete, usePagination, useClickOutside, useActivePalette)
  components/blocks/       → um componente por tipo de bloco
  components/editor/       → componentes do editor (BlockList, BlockSelector, OutlineTree, AddRootBlockModal)
  components/ui/           → componentes reutilizáveis (Button, Input, Modal, Select, ColorPicker, ThemeSelector)
  components/layout/       → AppLayout, Sidebar, GlobalTopBar, PageHeader
  components/form-builder/ → componentes do construtor de formulários
  components/form-fill/    → componentes de preenchimento de formulários
  routes/                  → páginas (uma por rota)
```

## Regras de Código

### Imports
- Sempre usar alias `@/` para imports (nunca `../` entre diretórios diferentes)
- Ordem: bibliotecas externas > `@/types` > `@/lib/*` > `@/components/*`

### Tipos
- Todas as interfaces e tipos ficam em `src/types/index.ts`
- Nunca definir a mesma interface em dois arquivos — centralizar em `types/`
- Usar `type` para imports de tipos quando possível (`import type { ... }`)

### Funções utilitárias
- Nunca duplicar lógica — se uma função existe em `lib/`, importar de lá
- `getBlockTitle()` fica em `block-constants.tsx` — nunca recriar localmente
- `resolveAnswerDisplay()` fica em `variable-service.ts` — fonte única para exibição de respostas
- API calls: usar os serviços em `lib/api/*-api.ts` — nunca chamar axios diretamente
- Criação de relatórios: usar `createEmptyReport()` e `createReportFromCustomer()` de `report-utils.ts` (async)
- Custom hooks reutilizáveis em `lib/hooks/`: `useAutoSave`, `useFormBuilderDraft` (rascunho local + publish manual no FormBuilder), `useConfirmDelete`, `usePagination`, `useClickOutside`
- Error handling: usar `useError()` de `ErrorContext` — nunca `alert()` para erros de API

### Componentes React
- Componentes funcionais com export default
- Props interface definida no mesmo arquivo, acima do componente
- Sem `React.FC` — usar `function NomeDoComponente(props: Props)`
- Custom `Select` component: `onChange` recebe `(value: string)`, não um event

### Estilo
- Tailwind v3 utility classes (nunca CSS inline ou modules)
- Design tokens centralizados em `src/styles/design-tokens.css` (CSS custom properties)
- Cores da marca (azul Apple): `brand-*` via `--color-blue-*` (ex: brand-500 = `#007AFF`)
- Cinzas quentes Apple: `gray-*` via `--color-gray-*` (ex: gray-100 = `#F5F5F7`)
- Aliases semânticos: `surface`, `surface-card`, `surface-hover`
- Sombras customizadas: `shadow-xs`, `shadow-card`, `shadow-dropdown`, `shadow-modal`
- Cores do docx: lidas do tema ativo via `_activePalette.chrome` (primary, secondary, surface, border, headerText). Constantes DARK_BLUE/MEDIUM_BLUE/LIGHT_BLUE em `docx-engine/shared/constants.ts` servem apenas de fallback histórico do Clássico (não são importadas pelo generator)
- Cores de status: success `#34C759`, warning `#FF9500`, danger `#FF3B30`
- Font stack: Inter → -apple-system → Segoe UI → system-ui

## Antes de Commitar

1. Rodar `npx tsc --noEmit` — zero erros obrigatório
2. Rodar `npx vite build` — build deve passar
3. Nunca commitar `tsconfig.tsbuildinfo`, `.env`, ou `node_modules`
4. Atualizar o CLAUDE.md: adicionar novas features implementadas em `## Features do Projeto` e remover da `## Próximas Features` o que já foi concluído

## Padrões de Commit

```
feat: descrição curta em português
fix: descrição curta em português
refactor: descrição curta em português
chore: descrição curta em português
```

- Mensagem descritiva no corpo quando necessário
- Branch naming: `feat/nome-curto`, `fix/nome-curto`, `refactor/nome-curto`

## Fluxo Git

- **Nunca usar git worktree** — editar sempre no repo principal
- Antes de começar: `git pull origin main`
- Criar branch local: `git checkout -b feat/nome-curto`
- Trabalhar, commitar, push, PR, merge
- O dev server roda no repo principal — worktrees causam descompasso entre código editado e código servido

## Mudanças fora do escopo da feature alvo

Antes de modificar regra de negócio, contrato ou comportamento de uma feature **diferente** da feature alvo da conversa atual:

1. Listar exatamente o que mudaria e em qual feature
2. Explicar por que essa mudança apareceu (efeito colateral, dependência, cleanup oportunista)
3. Pedir confirmação explícita antes de aplicar
4. Oferecer alternativa que não toque a outra feature, se possível

**Não precisa avisar:** mudanças dentro da feature alvo. Trabalhando em forms, mexer em FormBuilder, form-api, FormFieldRenderer é óbvio.

**Precisa avisar:**
- Trabalhando em forms e precisar mexer em customer-api, billing, ou qualquer outra área
- Refatoração de helper compartilhado por várias features (`lib/`, `lib/hooks/`, `components/ui/`)
- Mudança de tipo central em `types/index.ts` que outras features consomem
- Cleanup oportunista em código que não tem relação com o pedido atual

**Critério prático:** se a mudança aparece num diff e o usuário pode pensar "por que mexeu nisso?", devia ter sido avisado.

## Coisas para Nunca Fazer

- Nunca usar git worktree
- Nunca usar `react-chartjs-2`
- Nunca registrar plugins do Chart.js globalmente no ChartBlock (usar array `plugins` inline)
- Nunca esquecer `columnWidths` ao criar `new Table()` no docx
- Nunca adicionar botão de criação na Sidebar — ela é só navegação
- Nunca usar dark mode (foi experimentado e revertido)
- Nunca adicionar dependências sem perguntar primeiro
- Nunca criar arquivos de documentação (.md) sem ser solicitado
- Nunca usar `<input type="date">` direto (nem via `<Input type="date">`) — usar `DatePicker` de `@/components/ui/DatePicker` (ou `DateFilter` para range start/end). Vale para todos os contextos, incluindo o `FormFieldRenderer` (que e usado tanto em form publico quanto em preview do FormBuilder)
- Nunca usar dropdown/popover com `position: absolute` direto dentro de `Modal` ou container com `overflow: hidden`/`overflow-y-auto` — fica cortado. Renderizar em portal (`createPortal(dropdown, document.body)`) com `position: fixed` calculado via `getBoundingClientRect()` do trigger, reposicionando em scroll/resize. Ver `DatePicker.tsx` como referência
