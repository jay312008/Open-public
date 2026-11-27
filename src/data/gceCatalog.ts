import { SubjectItem } from '@/types/models';

interface GceSeed {
  id: string;
  code: string;
  name: string;
  level: 'O-Level' | 'A-Level' | 'University';
  icon: string;
  color: string;
  bgTint: string;
  topics: { title: string; desc: string; formula?: string; points: string[] }[];
}

function buildSubject(seed: GceSeed): SubjectItem {
  return {
    id: seed.id,
    code: seed.code,
    name: seed.name,
    level: seed.level,
    icon: seed.icon,
    color: seed.color,
    bgTint: seed.bgTint,
    topics: seed.topics.map((t, tIdx) => {
      const topicId = `${seed.id}-t${tIdx + 1}`;
      return {
        id: topicId,
        subjectId: seed.id,
        title: t.title,
        description: t.desc,
        estimatedMinutes: 45,
        difficulty: tIdx === 0 ? 'Easy' : tIdx === 1 ? 'Medium' : 'Hard',
        lessons: [
          {
            id: `${topicId}-l1`,
            topicId,
            subjectId: seed.id,
            title: `Foundations of ${t.title}`,
            durationMinutes: 15,
            summary: t.desc,
            keyPoints: t.points,
            exampleEquation: t.formula,
            practiceQuestion: {
              prompt: `Which statement best summarizes a core concept in ${t.title} (${seed.name})?`,
              options: [
                t.points[0] ?? `Core principle of ${t.title}`,
                'Unrelated memorization without applying definitions',
                'Skipping units and structured reasoning in exams',
                'Ignoring syllabus objectives',
              ],
              correctIndex: 0,
              explanation: `In ${seed.code} ${seed.name}, mastering "${t.points[0]}" is essential for structured GCE/exam responses.`,
            },
          },
          {
            id: `${topicId}-l2`,
            topicId,
            subjectId: seed.id,
            title: `Worked Examples & Exam Practice: ${t.title}`,
            durationMinutes: 15,
            summary: `Apply ${t.title} principles to structured ${seed.level} exam questions with clear marking steps.`,
            keyPoints: [
              `Read ${seed.level} command words carefully (Define, State, Explain, Calculate)`,
              t.points[1] ?? `Show clear intermediate working for ${t.title}`,
              'Review common examiner pitfalls and check units/diagrams',
            ],
            exampleEquation: t.formula,
          },
        ],
      };
    }),
  };
}

/**
 * Official Cameroon GCE O-Level Subjects (21 Subjects, Appendix C.2)
 * Note: Mathematics (0570), Chemistry (0515), Physics (0580), and English Language (0530)
 * are enriched in catalog.ts with deep multi-lesson content and official codes.
 */
const O_LEVEL_SEEDS: GceSeed[] = [
  {
    id: 'ol-accounting',
    code: 'GCE 0505',
    name: 'Accounting',
    level: 'O-Level',
    icon: 'cash',
    color: '#0D9488',
    bgTint: '#CCFBF1',
    topics: [
      { title: 'Double-Entry Bookkeeping', desc: 'Debits, credits, ledgers, and trial balance preparation.', formula: 'Assets = Capital + Liabilities', points: ['Every transaction affects at least two accounts equally', 'Trial balance checks arithmetical accuracy of double entry'] },
      { title: 'Final Accounts & Adjustments', desc: 'Trading, Profit & Loss accounts, and Balance Sheets.', points: ['Distinguish gross profit from net profit', 'Adjust for accruals, prepayments, and depreciation'] },
    ],
  },
  {
    id: 'ol-biology',
    code: 'GCE 0510',
    name: 'Biology',
    level: 'O-Level',
    icon: 'leaf',
    color: '#16A34A',
    bgTint: '#DCFCE7',
    topics: [
      { title: 'Cell Structure & Diffusion', desc: 'Plant vs animal cells, osmosis, diffusion, and active transport.', points: ['Chloroplasts and cell walls distinguish plant cells', 'Osmosis moves water across a selectively permeable membrane'] },
      { title: 'Photosynthesis & Nutrition', desc: 'Light reactions, leaf adaptations, and mineral nutrition.', formula: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', points: ['Chlorophyll absorbs light energy in palisade cells', 'Limiting factors include light intensity, CO₂, and temperature'] },
    ],
  },
  {
    id: 'ol-commerce',
    code: 'GCE 0520',
    name: 'Commerce',
    level: 'O-Level',
    icon: 'briefcase',
    color: '#EA580C',
    bgTint: '#FFEDD5',
    topics: [
      { title: 'Trade & Aids to Trade', desc: 'Home trade, foreign trade, banking, insurance, and warehousing.', points: ['Aids to trade remove barriers of time, place, finance, and risk', 'Distinguish wholesale from retail channels'] },
    ],
  },
  {
    id: 'ol-economics',
    code: 'GCE 0525',
    name: 'Economics',
    level: 'O-Level',
    icon: 'trending-up',
    color: '#2563EB',
    bgTint: '#DBEAFE',
    topics: [
      { title: 'Demand, Supply & Equilibrium', desc: 'Price determination, shifts vs movements, and elasticity.', formula: 'PED = %ΔQd / %ΔP', points: ['Market equilibrium occurs where quantity demanded equals quantity supplied', 'Price elasticity measures responsiveness of demand to price changes'] },
    ],
  },
  {
    id: 'ol-lit-eng',
    code: 'GCE 0535',
    name: 'Literature in English',
    level: 'O-Level',
    icon: 'book',
    color: '#9333EA',
    bgTint: '#F3E8FF',
    topics: [
      { title: 'Prose, Drama & Poetry Analysis', desc: 'Themes, characterization, literary devices, and unseen appreciation.', points: ['Support every thematic claim with direct textual evidence', 'Analyze imagery, tone, irony, and dramatic structure'] },
    ],
  },
  {
    id: 'ol-food-nut',
    code: 'GCE 0540',
    name: 'Food and Nutrition',
    level: 'O-Level',
    icon: 'nutrition',
    color: '#E11D48',
    bgTint: '#FFE4E6',
    topics: [
      { title: 'Nutrients & Balanced Diets', desc: 'Carbohydrates, proteins, lipids, vitamins, and deficiency diseases.', points: ['Balanced meals match age, activity level, and physiological state', 'Food hygiene prevents microbial contamination'] },
    ],
  },
  {
    id: 'ol-french',
    code: 'GCE 0545',
    name: 'French',
    level: 'O-Level',
    icon: 'language',
    color: '#3B82F6',
    bgTint: '#DBEAFE',
    topics: [
      { title: 'Grammaire & Compréhension', desc: 'Verb tenses, agreements, translation, and guided essay writing.', points: ['Master présent, passé composé, imparfait, and futur simple', 'Check gender and number agreement on adjectives and participles'] },
    ],
  },
  {
    id: 'ol-sbe-french',
    code: 'GCE 0546',
    name: 'Special Bilingual Education French',
    level: 'O-Level',
    icon: 'chatbubbles',
    color: '#6366F1',
    bgTint: '#E0E7FF',
    topics: [
      { title: 'Expression Écrite & Synthèse', desc: 'Bilingual comprehension, summary writing, and structured argumentation.', points: ['Use cohesive connectors (cependant, en revanche, par conséquent)', 'Maintain formal register in academic summaries'] },
    ],
  },
  {
    id: 'ol-geography',
    code: 'GCE 0550',
    name: 'Geography',
    level: 'O-Level',
    icon: 'earth',
    color: '#15803D',
    bgTint: '#DCFCE7',
    topics: [
      { title: 'Physical & Human Geography of Cameroon', desc: 'Relief, climate, drainage, population, and map reading skills.', points: ['Read 4-figure and 6-figure grid references accurately', 'Link climate zones to vegetation and economic activity'] },
    ],
  },
  {
    id: 'ol-geology',
    code: 'GCE 0555',
    name: 'Geology',
    level: 'O-Level',
    icon: 'layers',
    color: '#B45309',
    bgTint: '#FEF3C7',
    topics: [
      { title: 'Rocks, Minerals & Plate Tectonics', desc: 'Igneous, sedimentary, and metamorphic rock cycles.', points: ['Identify rocks by texture, mineral composition, and origin', 'Plate boundaries explain volcanism and earthquakes along the Cameroon Volcanic Line'] },
    ],
  },
  {
    id: 'ol-history',
    code: 'GCE 0560',
    name: 'History',
    level: 'O-Level',
    icon: 'time',
    color: '#9A3412',
    bgTint: '#FFEDD5',
    topics: [
      { title: 'Cameroon & African History', desc: 'Pre-colonial states, colonization, independence, and reunification.', points: ['Structure essays with introduction, chronological evidence, and balanced conclusion', 'Distinguish causes, course, and consequences of historical events'] },
    ],
  },
  {
    id: 'ol-citizenship',
    code: 'GCE 0562',
    name: 'Citizenship Education',
    level: 'O-Level',
    icon: 'people-circle',
    color: '#0284C7',
    bgTint: '#E0F2FE',
    topics: [
      { title: 'Civic Rights, Duties & Institutions', desc: 'Constitution, national integration, human rights, and governance.', points: ['Every citizen holds both fundamental rights and civic duties', 'Understand legislative, executive, and judicial roles'] },
    ],
  },
  {
    id: 'ol-human-bio',
    code: 'GCE 0565',
    name: 'Human Biology',
    level: 'O-Level',
    icon: 'heart',
    color: '#DC2626',
    bgTint: '#FEE2E2',
    topics: [
      { title: 'Human Organ Systems & Health', desc: 'Circulatory, respiratory, digestive, nervous systems, and immunity.', points: ['Double circulation separates oxygenated and deoxygenated blood', 'Vaccination stimulates active artificial immunity'] },
    ],
  },
  {
    id: 'ol-add-math',
    code: 'GCE 0575',
    name: 'Additional Mathematics',
    level: 'O-Level',
    icon: 'stats-chart',
    color: '#7C3AED',
    bgTint: '#F3E8FF',
    topics: [
      { title: 'Matrices, Vectors & Calculus Intro', desc: '2×2 matrices, differentiation of polynomials, and trigonometry.', formula: 'd/dx (xⁿ) = n·xⁿ⁻¹', points: ['Matrix multiplication is not commutative (AB ≠ BA)', 'Derivative gives the gradient function of a curve'] },
    ],
  },
  {
    id: 'ol-rel-studies',
    code: 'GCE 0585',
    name: 'Religious Studies',
    level: 'O-Level',
    icon: 'sparkles',
    color: '#D97706',
    bgTint: '#FEF3C7',
    topics: [
      { title: 'Scriptural Texts & Ethics', desc: 'Core teachings, parables, moral responsibility, and community values.', points: ['Connect scriptural passages to contemporary ethical questions', 'Explain context clearly before drawing moral lessons'] },
    ],
  },
  {
    id: 'ol-logic',
    code: 'GCE 0590',
    name: 'Logic',
    level: 'O-Level',
    icon: 'git-branch',
    color: '#4F46E5',
    bgTint: '#E0E7FF',
    topics: [
      { title: 'Syllogisms, Fallacies & Truth Tables', desc: 'Propositional logic, validity vs soundness, and informal fallacies.', formula: 'p → q ≡ ¬p ∨ q', points: ['Valid arguments cannot have true premises and a false conclusion', 'Identify ad hominem, straw man, and hasty generalization fallacies'] },
    ],
  },
  {
    id: 'ol-cs',
    code: 'GCE 0595',
    name: 'Computer Science',
    level: 'O-Level',
    icon: 'hardware-chip',
    color: '#0EA5E9',
    bgTint: '#E0F2FE',
    topics: [
      { title: 'Algorithms, Logic Gates & Binary', desc: 'Number systems, AND/OR/NOT gates, flowcharts, and pseudocode.', points: ['Convert cleanly between binary, denary, and hexadecimal', 'Trace loops and selection statements step by step'] },
    ],
  },
];

/**
 * Official Cameroon GCE A-Level Subjects (20 Subjects, Appendix C.2)
 */
const A_LEVEL_SEEDS: GceSeed[] = [
  { id: 'al-accounting', code: 'GCE 0705', name: 'Accounting (A-Level)', level: 'A-Level', icon: 'cash', color: '#0D9488', bgTint: '#CCFBF1', topics: [{ title: 'Company Accounts & Ratio Analysis', desc: 'Financial statements, liquidity, profitability, and costing.', points: ['Interpret current ratio, acid-test, and ROCE accurately', 'Distinguish marginal costing from absorption costing'] }] },
  { id: 'al-biology', code: 'GCE 0710', name: 'Biology (A-Level)', level: 'A-Level', icon: 'leaf', color: '#16A34A', bgTint: '#DCFCE7', topics: [{ title: 'Biochemistry, Genetics & Respiration', desc: 'ATP synthesis, DNA replication, Mendelian & dihybrid crosses.', formula: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP', points: ['Glycolysis occurs in cytoplasm; Krebs cycle in mitochondrial matrix', 'Use Punnett squares to show phenotypic ratios clearly'] }] },
  { id: 'al-chemistry', code: 'GCE 0715', name: 'Chemistry (A-Level)', level: 'A-Level', icon: 'flask', color: '#9333EA', bgTint: '#F3E8FF', topics: [{ title: 'Chemical Energetics & Kinetics', desc: 'Hess’s Law, enthalpy cycles, rate equations, and equilibrium.', formula: 'ΔH = ΣΔHf(products) - ΣΔHf(reactants)', points: ['Catalysts lower activation energy without shifting equilibrium position', 'Determine reaction orders from initial-rate experimental data'] }] },
  { id: 'al-economics', code: 'GCE 0725', name: 'Economics (A-Level)', level: 'A-Level', icon: 'trending-up', color: '#2563EB', bgTint: '#DBEAFE', topics: [{ title: 'Macroeconomics & Market Structures', desc: 'GDP, inflation, monetary/fiscal policy, monopoly vs perfect competition.', formula: 'AD = C + I + G + (X - M)', points: ['Profit maximization occurs where MC = MR', 'Evaluate trade-offs between inflation and unemployment'] }] },
  { id: 'al-english', code: 'GCE 0730', name: 'English Language (A-Level)', level: 'A-Level', icon: 'book', color: '#EA580C', bgTint: '#FFEDD5', topics: [{ title: 'Advanced Composition & Summary', desc: 'Critical reading, stylistic analysis, and persuasive essays.', points: ['Synthesize ideas concisely in your own words for summary tasks', 'Balance thesis, counter-arguments, and concrete examples'] }] },
  { id: 'al-lit-eng', code: 'GCE 0735', name: 'Literature in English (A-Level)', level: 'A-Level', icon: 'library', color: '#A855F7', bgTint: '#F3E8FF', topics: [{ title: 'Shakespeare, African & World Texts', desc: 'Close textual criticism, tragedy, satire, and poetic form.', points: ['Integrate short quotations smoothly into analytical paragraphs', 'Contrast narrative voice and socio-historical context'] }] },
  { id: 'al-food-sci', code: 'GCE 0740', name: 'Food Science and Nutrition (A-Level)', level: 'A-Level', icon: 'nutrition', color: '#E11D48', bgTint: '#FFE4E6', topics: [{ title: 'Food Chemistry & Preservation', desc: 'Enzymatic browning, fermentation, nutritional biochemistry.', points: ['Control pH, temperature, and water activity to inhibit spoilage', 'Connect macronutrient metabolism to clinical nutrition'] }] },
  { id: 'al-french', code: 'GCE 0745', name: 'French (A-Level)', level: 'A-Level', icon: 'language', color: '#3B82F6', bgTint: '#DBEAFE', topics: [{ title: 'Dissertation & Traduction', desc: 'Literary essays, subjonctif mastery, and advanced translation.', points: ['Use subjonctif after expressions of doubt, emotion, and necessity', 'Avoid literal word-for-word calques in translation'] }] },
  { id: 'al-sbe-french', code: 'GCE 0746', name: 'Special Bilingual Education French (A-Level)', level: 'A-Level', icon: 'chatbubbles', color: '#6366F1', bgTint: '#E0E7FF', topics: [{ title: 'Synthèse de Documents & Culture', desc: 'Advanced bilingual synthesis and Francophone literary analysis.', points: ['Cross-reference multiple source documents objectively', 'Maintain academic precision across both languages'] }] },
  { id: 'al-geography', code: 'GCE 0750', name: 'Geography (A-Level)', level: 'A-Level', icon: 'earth', color: '#15803D', bgTint: '#DCFCE7', topics: [{ title: 'Geomorphology, Climatology & Development', desc: 'Hydrological cycles, atmospheric circulation, and urban systems.', points: ['Support essays with named case studies from Cameroon and globally', 'Draw clearly labeled cross-sections and process diagrams'] }] },
  { id: 'al-geology', code: 'GCE 0755', name: 'Geology (A-Level)', level: 'A-Level', icon: 'layers', color: '#B45309', bgTint: '#FEF3C7', topics: [{ title: 'Stratigraphy, Structural Geology & Petrology', desc: 'Folds, faults, geological maps, and paleontology.', points: ['Apply principles of superposition and cross-cutting relationships', 'Interpret strike, dip, and outcrop patterns on geological maps'] }] },
  { id: 'al-history', code: 'GCE 0760', name: 'History (A-Level)', level: 'A-Level', icon: 'time', color: '#9A3412', bgTint: '#FFEDD5', topics: [{ title: 'Cameroon, Africa & World Affairs', desc: 'Decolonization, Cold War diplomacy, and nation-building.', points: ['Evaluate historiographical perspectives with primary evidence', 'Weigh short-term triggers against long-term structural causes'] }] },
  { id: 'al-pure-mech', code: 'GCE 0765', name: 'Pure Mathematics with Mechanics', level: 'A-Level', icon: 'calculator', color: '#7C3AED', bgTint: '#F3E8FF', topics: [{ title: 'Calculus, Vectors & Kinematics', desc: 'Integration, differential equations, projectiles, and dynamics.', formula: 's = ut + ½at²   |   F = ma', points: ['Resolve forces into perpendicular components on inclined planes', 'Apply integration by parts and substitution accurately'] }] },
  { id: 'al-pure-stat', code: 'GCE 0770', name: 'Pure Mathematics with Statistics', level: 'A-Level', icon: 'bar-chart', color: '#8B5CF6', bgTint: '#EDE9FE', topics: [{ title: 'Probability Distributions & Hypothesis Testing', desc: 'Binomial, Poisson, Normal distributions, and correlation.', formula: 'Z = (X - μ) / σ', points: ['Standardize normal variables using Z-scores before table lookup', 'State null and alternative hypotheses clearly before testing'] }] },
  { id: 'al-further-math', code: 'GCE 0775', name: 'Further Mathematics', level: 'A-Level', icon: 'infinite', color: '#6D28D9', bgTint: '#EDE9FE', topics: [{ title: 'Complex Numbers, Proof by Induction & Polar Curves', desc: 'De Moivre’s Theorem, hyperbolic functions, and 3D vectors.', formula: '(cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ)', points: ['Verify base case, inductive hypothesis, and inductive step rigorously', 'Represent complex roots geometrically on an Argand diagram'] }] },
  { id: 'al-physics', code: 'GCE 0780', name: 'Physics (A-Level)', level: 'A-Level', icon: 'planet', color: '#2563EB', bgTint: '#DBEAFE', topics: [{ title: 'Fields, Waves & Quantum Physics', desc: 'Gravitational/electric fields, SHM, photoelectric effect, and nuclear physics.', formula: 'hf = φ + ½mv²max', points: ['Threshold frequency proves the particle nature of light', 'Simple harmonic acceleration is proportional and opposite to displacement'] }] },
  { id: 'al-rel-studies', code: 'GCE 0785', name: 'Religious Studies (A-Level)', level: 'A-Level', icon: 'sparkles', color: '#D97706', bgTint: '#FEF3C7', topics: [{ title: 'Theology, Ethics & Comparative Religion', desc: 'Critical exegesis, moral philosophy, and religious traditions.', points: ['Compare theological arguments with balanced scholarly evidence', 'Define key doctrinal terms precisely'] }] },
  { id: 'al-philosophy', code: 'GCE 0790', name: 'Philosophy', level: 'A-Level', icon: 'bulb', color: '#4338CA', bgTint: '#E0E7FF', topics: [{ title: 'Epistemology, Logic & African Philosophy', desc: 'Rationalism vs empiricism, ethics, and critical reasoning.', points: ['Distinguish deductive validity from inductive strength', 'Analyze classical and contemporary African philosophical traditions'] }] },
  { id: 'al-cs', code: 'GCE 0795', name: 'Computer Science (A-Level)', level: 'A-Level', icon: 'code-slash', color: '#0284C7', bgTint: '#E0F2FE', topics: [{ title: 'Data Structures, Architecture & Databases', desc: 'Stacks, queues, trees, normalization (1NF–3NF), and SQL.', points: ['Normalize relational schemas to eliminate update anomalies', 'Compare time complexity of linear vs binary search'] }] },
  { id: 'al-ict', code: 'GCE 0796', name: 'Information and Communication Technology', level: 'A-Level', icon: 'globe', color: '#0891B2', bgTint: '#CFFAFE', topics: [{ title: 'Networks, Systems Analysis & Digital Security', desc: 'OSI/TCP-IP layers, SDLC, encryption, and database systems.', points: ['Match network topologies and protocols to real organizational needs', 'Apply authentication, encryption, and backup best practices'] }] },
];

/**
 * University Core Courses
 */
const UNIVERSITY_SEEDS: GceSeed[] = [
  { id: 'uni-calc', code: 'MTH 101', name: 'University Calculus & Linear Algebra', level: 'University', icon: 'calculator', color: '#7C3AED', bgTint: '#F3E8FF', topics: [{ title: 'Multivariable Calculus & Eigenvalues', desc: 'Partial derivatives, vector spaces, determinants, and eigenvalues.', formula: 'det(A - λI) = 0', points: ['Eigenvalues reveal invariant scaling directions of linear transforms', 'Chain rule extends naturally to partial derivatives'] }] },
  { id: 'uni-dsa', code: 'CSC 201', name: 'Data Structures & Algorithms', level: 'University', icon: 'terminal', color: '#0284C7', bgTint: '#E0F2FE', topics: [{ title: 'Graphs, Trees & Dynamic Programming', desc: 'BFS/DFS, Dijkstra, Big-O complexity, and memoization.', formula: 'T(n) = O(n log n)', points: ['Analyze both time and space complexity for every algorithm', 'Break overlapping subproblems into recurrence relations'] }] },
  { id: 'uni-org-chem', code: 'CHM 202', name: 'University Organic Chemistry', level: 'University', icon: 'flask', color: '#9333EA', bgTint: '#F3E8FF', topics: [{ title: 'Reaction Mechanisms (SN1, SN2, E1, E2)', desc: 'Stereochemistry, nucleophiles, and synthesis pathways.', points: ['SN2 proceeds via backside attack with Walden inversion', 'Carbocation stability governs SN1 and E1 rates'] }] },
];

export const GCE_AND_UNI_SUBJECTS: SubjectItem[] = [
  ...O_LEVEL_SEEDS,
  ...A_LEVEL_SEEDS,
  ...UNIVERSITY_SEEDS,
].map(buildSubject);
