// Admin Mock Data - Single source of truth for all admin content
// Includes GEO fields for all content types

export type ContentStatus = "draft" | "published" | "warning";

export interface FAQItem {
  question: string;
  answer: string;
}

// ============================================
// LEXICON (Medical Dictionary)
// ============================================
export interface LexiconEntry {
  id: string;
  term: string;
  pinyin: string;
  definition: string;
  say_it_like: string[]; // Natural usage examples
  dont_say: string[]; // Common mistakes to avoid
  collocations: string[]; // Common word pairings
  // GEO fields (required for publish)
  geo_snippet: string;
  key_points: string[]; // 3-5 required
  faq_json: FAQItem[];
  // Meta
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  author: string;
}

// ============================================
// GRAMMAR (Medical Context)
// ============================================
export interface ClinicTemplate {
  scenario: string;
  template: string;
  variables: string;
}

export interface MedicalGrammar {
  id: string;
  title: string;
  pattern: string;
  explanation: string;
  examples: { cn: string; pinyin: string; en: string }[];
  clinic_templates: ClinicTemplate[]; // Medical-specific usage
  common_mistakes: string[];
  // GEO fields (required for publish)
  geo_snippet: string;
  key_points: string[]; // 3-5 required
  faq_json: FAQItem[];
  // Meta
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  author: string;
}

// ============================================
// SCENARIOS (Medical Reader Content)
// ============================================
export interface ConversationLine {
  speaker: string;
  line: string;
  note?: string;
}

export interface ScenarioWarning {
  type: "caution" | "urgent";
  message: string;
}

export interface MedicalScenario {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  // Content
  conversation: ConversationLine[];
  key_phrases: string[];
  checklist: string[];
  warnings: ScenarioWarning[];
  // GEO fields (required for publish)
  geo_intro: string; // Required short paragraph
  key_takeaways: string[]; // 3-5 required
  faq_json: FAQItem[];
  // Meta
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  author: string;
}

// ============================================
// MOCK DATA
// ============================================

export const mockLexicon: LexiconEntry[] = [
  {
    id: "lex1",
    term: "挂号",
    pinyin: "guà hào",
    definition: "Hospital registration; the process of registering to see a doctor",
    say_it_like: [
      "我要挂号 - I want to register",
      "挂号处在哪里？ - Where is the registration desk?",
      "网上挂号 - Online registration",
    ],
    dont_say: [
      "我要登记看医生 ❌ (use 挂号 instead)",
      "签到 ❌ (this means sign in/check in, not medical registration)",
    ],
    collocations: ["挂号处", "挂号费", "预约挂号", "门诊挂号"],
    geo_snippet: "Learn the essential Chinese medical term 挂号 (guà hào) for hospital registration. This vocabulary is crucial for navigating Chinese healthcare facilities and booking doctor appointments.",
    key_points: [
      "挂号 is the standard term for hospital registration in China",
      "Most hospitals require registration before seeing any doctor",
      "Online registration (网上挂号) is increasingly common",
      "Registration fees (挂号费) are typically 5-100 RMB",
    ],
    faq_json: [
      { question: "How do I register at a Chinese hospital?", answer: "Go to the registration desk (挂号处), provide your ID, choose a department, and pay the registration fee." },
    ],
    status: "published",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-15T14:00:00Z",
    author: "Admin User",
  },
  {
    id: "lex2",
    term: "处方",
    pinyin: "chǔ fāng",
    definition: "Prescription; a doctor's written order for medicine",
    say_it_like: [
      "医生给我开了处方 - The doctor wrote me a prescription",
      "这个药需要处方吗？ - Does this medicine require a prescription?",
    ],
    dont_say: [
      "药单 ❌ (informal, use 处方 in medical contexts)",
    ],
    collocations: ["开处方", "处方药", "电子处方"],
    geo_snippet: "",
    key_points: ["处方 is the formal term for medical prescriptions"],
    faq_json: [],
    status: "warning",
    createdAt: "2025-01-12T09:00:00Z",
    updatedAt: "2025-01-14T11:00:00Z",
    author: "Editor User",
  },
  {
    id: "lex3",
    term: "过敏",
    pinyin: "guò mǐn",
    definition: "Allergy; allergic reaction",
    say_it_like: [
      "我对青霉素过敏 - I'm allergic to penicillin",
      "您有什么过敏史吗？ - Do you have any allergy history?",
    ],
    dont_say: [],
    collocations: ["过敏反应", "过敏史", "药物过敏", "食物过敏"],
    geo_snippet: "",
    key_points: [],
    faq_json: [],
    status: "draft",
    createdAt: "2025-01-18T08:00:00Z",
    updatedAt: "2025-01-20T16:00:00Z",
    author: "Admin User",
  },
];

export const mockMedicalGrammar: MedicalGrammar[] = [
  {
    id: "mg1",
    title: "Describing Symptoms with 有点儿",
    pattern: "我 + 有点儿 + Adjective/Verb",
    explanation: "Use 有点儿 to describe mild symptoms or feelings. It softens the statement and is commonly used in medical consultations.",
    examples: [
      { cn: "我有点儿头疼", pinyin: "Wǒ yǒudiǎnr tóuténg", en: "I have a bit of a headache" },
      { cn: "我有点儿发烧", pinyin: "Wǒ yǒudiǎnr fāshāo", en: "I have a slight fever" },
      { cn: "这里有点儿疼", pinyin: "Zhèlǐ yǒudiǎnr téng", en: "It hurts a little here" },
    ],
    clinic_templates: [
      { scenario: "Describing pain", template: "我{部位}有点儿疼", variables: "部位: 头/胃/腰/腿" },
      { scenario: "Feeling unwell", template: "我有点儿{症状}", variables: "症状: 头晕/恶心/累" },
    ],
    common_mistakes: [
      "我很有点儿累 ❌ (don't combine 很 and 有点儿)",
      "我有点儿累 ✓",
    ],
    geo_snippet: "Master the Chinese pattern 有点儿 for describing mild symptoms to doctors. This grammar point is essential for medical consultations and accurately communicating how you feel.",
    key_points: [
      "有点儿 is used for mild or slight conditions",
      "It comes before adjectives or verbs",
      "Don't combine with 很 (very)",
      "Common in medical consultations for describing symptoms",
    ],
    faq_json: [
      { question: "When should I use 有点儿 vs 一点儿?", answer: "有点儿 goes before adjectives/verbs (我有点儿累), while 一点儿 goes after adjectives (好一点儿 - a bit better)." },
    ],
    status: "published",
    createdAt: "2025-01-05T10:00:00Z",
    updatedAt: "2025-01-10T14:00:00Z",
    author: "Admin User",
  },
  {
    id: "mg2",
    title: "Duration with 了...了",
    pattern: "Verb + 了 + Duration + 了",
    explanation: "This pattern indicates an action has been happening for a specific duration and is still ongoing.",
    examples: [
      { cn: "我咳嗽了三天了", pinyin: "Wǒ késou le sān tiān le", en: "I've been coughing for three days" },
      { cn: "他发烧了两天了", pinyin: "Tā fāshāo le liǎng tiān le", en: "He's had a fever for two days" },
    ],
    clinic_templates: [
      { scenario: "Symptom duration", template: "我{症状}了{时间}了", variables: "症状: 头疼/失眠/没胃口, 时间: 两天/一周/一个月" },
    ],
    common_mistakes: [
      "我咳嗽三天 ❌ (missing 了)",
      "我咳嗽了三天了 ✓",
    ],
    geo_snippet: "",
    key_points: ["Used to indicate ongoing duration of symptoms"],
    faq_json: [],
    status: "warning",
    createdAt: "2025-01-08T09:00:00Z",
    updatedAt: "2025-01-12T11:00:00Z",
    author: "Editor User",
  },
];

export const mockScenarios: MedicalScenario[] = [
  {
    id: "sc1",
    title: "Emergency Room Visit",
    slug: "emergency-room-visit",
    category: "急诊",
    difficulty: "Intermediate",
    conversation: [
      { speaker: "Patient", line: "救命！我朋友受伤了！", note: "Urgent tone" },
      { speaker: "Nurse", line: "请冷静，发生了什么事？" },
      { speaker: "Patient", line: "他摔倒了，头在流血。" },
      { speaker: "Nurse", line: "好的，我们马上处理。请跟我来。" },
      { speaker: "Doctor", line: "让我看看伤口。头晕吗？" },
      { speaker: "Patient's Friend", line: "有点头晕。" },
      { speaker: "Doctor", line: "需要做CT检查。护士，准备一下。" },
    ],
    key_phrases: ["救命", "受伤", "流血", "急诊室", "CT检查"],
    checklist: [
      "Locate emergency room (急诊室)",
      "Describe injury clearly",
      "Provide patient history if known",
      "Stay calm and follow instructions",
    ],
    warnings: [
      { type: "urgent", message: "如遇紧急情况，请拨打120急救电话" },
      { type: "caution", message: "头部受伤后24小时内需密切观察" },
    ],
    geo_intro: "This scenario covers essential Chinese vocabulary and phrases for emergency room visits. Learn how to describe injuries, understand medical staff instructions, and navigate urgent care situations in Chinese hospitals.",
    key_takeaways: [
      "救命 (jiùmìng) is used to call for help in emergencies",
      "Describe injuries using 受伤 (injured) and specific body parts",
      "Stay calm (冷静) when speaking to medical staff",
      "120 is the emergency number in China",
      "CT检查 (CT scan) is commonly ordered for head injuries",
    ],
    faq_json: [
      { question: "What is the emergency number in China?", answer: "120 is the medical emergency number. 110 is police, 119 is fire." },
      { question: "How do I find the emergency room?", answer: "Ask for 急诊室 (jízhěn shì) or follow signs marked 急诊." },
    ],
    status: "published",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-15T14:00:00Z",
    author: "Admin User",
  },
  {
    id: "sc2",
    title: "Pharmacy Consultation",
    slug: "pharmacy-consultation",
    category: "药房",
    difficulty: "Beginner",
    conversation: [
      { speaker: "Customer", line: "你好，我想买感冒药。" },
      { speaker: "Pharmacist", line: "您有什么症状？" },
      { speaker: "Customer", line: "流鼻涕，有点咳嗽。" },
      { speaker: "Pharmacist", line: "发烧吗？" },
      { speaker: "Customer", line: "不发烧。" },
      { speaker: "Pharmacist", line: "我推荐这个，一天三次，饭后服用。" },
    ],
    key_phrases: ["感冒药", "症状", "流鼻涕", "饭后服用"],
    checklist: [
      "Describe symptoms clearly",
      "Mention any allergies",
      "Ask about dosage instructions",
      "Check if prescription needed",
    ],
    warnings: [
      { type: "caution", message: "部分药物需要处方才能购买" },
    ],
    geo_intro: "",
    key_takeaways: ["Common cold medicine is 感冒药"],
    faq_json: [],
    status: "warning",
    createdAt: "2025-01-12T09:00:00Z",
    updatedAt: "2025-01-14T11:00:00Z",
    author: "Editor User",
  },
  {
    id: "sc3",
    title: "Blood Test Procedure",
    slug: "blood-test-procedure",
    category: "检查",
    difficulty: "Intermediate",
    conversation: [
      { speaker: "Nurse", line: "请坐下，把袖子卷起来。" },
      { speaker: "Patient", line: "好的。" },
      { speaker: "Nurse", line: "握紧拳头。" },
    ],
    key_phrases: ["验血", "抽血", "握紧拳头"],
    checklist: [],
    warnings: [],
    geo_intro: "",
    key_takeaways: [],
    faq_json: [],
    status: "draft",
    createdAt: "2025-01-18T08:00:00Z",
    updatedAt: "2025-01-20T16:00:00Z",
    author: "Admin User",
  },
];

// ============================================
// MEDICAL LEXICON (content_items type='medical_lexicon')
// Must be defined before initAdminData which references it
// ============================================
export interface MedicalLexiconEntry {
  id: string;
  term: string;
  pinyin: string;
  definition: string;
  say_it_like: string[];
  dont_say: string[];
  collocations: string[];
  // GEO/SEO publishing fields
  geo_snippet: string;
  key_points: string[];
  faq_json: FAQItem[];
  seo_title: string;
  seo_description: string;
  slug: string;
  // Meta
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
}

export const mockMedicalLexicon: MedicalLexiconEntry[] = [
  {
    id: "ml1",
    term: "血压",
    pinyin: "xuè yā",
    definition: "Blood pressure; the force exerted by circulating blood on the walls of blood vessels",
    say_it_like: [
      "您的血压正常吗？ - Is your blood pressure normal?",
      "我需要量一下血压 - I need to measure blood pressure",
    ],
    dont_say: [
      "血的压力 ❌ (use 血压 as the compound term)",
    ],
    collocations: ["高血压", "低血压", "量血压", "血压计"],
    geo_snippet: "Learn the essential Chinese medical term 血压 (xuè yā) for blood pressure. This vocabulary is crucial for understanding medical consultations about cardiovascular health.",
    key_points: [
      "血压 is the standard term for blood pressure in Chinese",
      "高血压 (gāo xuèyā) means hypertension/high blood pressure",
      "低血压 (dī xuèyā) means hypotension/low blood pressure",
      "量血压 (liáng xuèyā) means to measure blood pressure",
    ],
    faq_json: [
      { question: "How do I say 'high blood pressure' in Chinese?", answer: "高血压 (gāo xuèyā) is the term for high blood pressure or hypertension." },
    ],
    seo_title: "Blood Pressure in Chinese - Medical Vocabulary",
    seo_description: "Learn the Chinese medical term 血压 (blood pressure) with examples and related vocabulary.",
    slug: "xue-ya-blood-pressure",
    status: "published",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-15T14:00:00Z",
    publishedAt: "2025-01-15T14:00:00Z",
    author: "Admin User",
  },
  {
    id: "ml2",
    term: "心电图",
    pinyin: "xīn diàn tú",
    definition: "Electrocardiogram (ECG/EKG); a test that records the electrical activity of the heart",
    say_it_like: [
      "医生建议做心电图检查 - The doctor recommends an ECG",
      "心电图显示正常 - The ECG shows normal",
    ],
    dont_say: [],
    collocations: ["做心电图", "心电图检查", "心电图报告"],
    geo_snippet: "",
    key_points: ["心电图 is the medical term for ECG in Chinese"],
    faq_json: [],
    seo_title: "",
    seo_description: "",
    slug: "xin-dian-tu-ecg",
    status: "draft",
    createdAt: "2025-01-18T08:00:00Z",
    updatedAt: "2025-01-20T16:00:00Z",
    author: "Editor User",
  },
];

// ============================================
// STORAGE HELPERS
// ============================================

const STORAGE_KEYS = {
  lexicon: "admin_lexicon",
  medicalGrammar: "admin_medical_grammar",
  scenarios: "admin_scenarios",
};

export function initAdminData() {
  if (typeof window === "undefined") return;
  
  if (!localStorage.getItem(STORAGE_KEYS.lexicon)) {
    localStorage.setItem(STORAGE_KEYS.lexicon, JSON.stringify(mockLexicon));
  }
  if (!localStorage.getItem(STORAGE_KEYS.medicalGrammar)) {
    localStorage.setItem(STORAGE_KEYS.medicalGrammar, JSON.stringify(mockMedicalGrammar));
  }
  if (!localStorage.getItem(STORAGE_KEYS.scenarios)) {
    localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(mockScenarios));
  }
  if (!localStorage.getItem("admin_medical_lexicon")) {
    localStorage.setItem("admin_medical_lexicon", JSON.stringify(mockMedicalLexicon));
  }
}

export function getLexicon(): LexiconEntry[] {
  if (typeof window === "undefined") return mockLexicon;
  initAdminData();
  const stored = localStorage.getItem(STORAGE_KEYS.lexicon);
  return stored ? JSON.parse(stored) : mockLexicon;
}

export function saveLexiconEntry(entry: LexiconEntry) {
  const entries = getLexicon();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  localStorage.setItem(STORAGE_KEYS.lexicon, JSON.stringify(entries));
}

export function deleteLexiconEntry(id: string) {
  const entries = getLexicon().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.lexicon, JSON.stringify(entries));
}

export function getMedicalGrammar(): MedicalGrammar[] {
  if (typeof window === "undefined") return mockMedicalGrammar;
  initAdminData();
  const stored = localStorage.getItem(STORAGE_KEYS.medicalGrammar);
  return stored ? JSON.parse(stored) : mockMedicalGrammar;
}

export function saveMedicalGrammar(entry: MedicalGrammar) {
  const entries = getMedicalGrammar();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  localStorage.setItem(STORAGE_KEYS.medicalGrammar, JSON.stringify(entries));
}

export function deleteMedicalGrammar(id: string) {
  const entries = getMedicalGrammar().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.medicalGrammar, JSON.stringify(entries));
}

export function getScenarios(): MedicalScenario[] {
  if (typeof window === "undefined") return mockScenarios;
  initAdminData();
  const stored = localStorage.getItem(STORAGE_KEYS.scenarios);
  return stored ? JSON.parse(stored) : mockScenarios;
}

export function saveScenario(entry: MedicalScenario) {
  const entries = getScenarios();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(entries));
}

export function deleteScenario(id: string) {
  const entries = getScenarios().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(entries));
}

// ============================================
// GEO VALIDATION HELPERS
// ============================================

export function validateGeoFields(item: { geo_snippet?: string; key_points?: string[]; geo_intro?: string; key_takeaways?: string[] }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for geo_snippet or geo_intro
  if (!item.geo_snippet && !item.geo_intro) {
    errors.push("GEO 片段必填 (GEO snippet is required)");
  }
  
  // Check key_points or key_takeaways
  const points = item.key_points || item.key_takeaways || [];
  if (points.length < 3) {
    errors.push("至少需要3个关键要点 (At least 3 key points required)");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getGeoStatus(item: { geo_snippet?: string; key_points?: string[]; geo_intro?: string; key_takeaways?: string[] }): "complete" | "partial" | "missing" {
  const hasSnippet = Boolean(item.geo_snippet || item.geo_intro);
  const points = item.key_points || item.key_takeaways || [];
  const hasEnoughPoints = points.length >= 3;
  
  if (hasSnippet && hasEnoughPoints) return "complete";
  if (hasSnippet || points.length > 0) return "partial";
  return "missing";
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

export function exportLexiconJSON(): string {
  const data = getLexicon().filter(e => e.status === "published");
  return JSON.stringify(data, null, 2);
}

export function exportMedicalGrammarJSON(): string {
  const data = getMedicalGrammar().filter(e => e.status === "published");
  return JSON.stringify(data, null, 2);
}

export function exportScenariosJSON(): string {
  const data = getScenarios().filter(e => e.status === "published");
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// MEDICAL LEXICON CRUD (uses data defined above)
// ============================================

const STORAGE_KEY_MEDICAL_LEXICON = "admin_medical_lexicon";

export function getMedicalLexicon(): MedicalLexiconEntry[] {
  if (typeof window === "undefined") return mockMedicalLexicon;
  initAdminData();
  const stored = localStorage.getItem(STORAGE_KEY_MEDICAL_LEXICON);
  return stored ? JSON.parse(stored) : mockMedicalLexicon;
}

export function saveMedicalLexiconEntry(entry: MedicalLexiconEntry) {
  const entries = getMedicalLexicon();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  localStorage.setItem(STORAGE_KEY_MEDICAL_LEXICON, JSON.stringify(entries));
}

export function deleteMedicalLexiconEntry(id: string) {
  const entries = getMedicalLexicon().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY_MEDICAL_LEXICON, JSON.stringify(entries));
}

export function exportMedicalLexiconJSON(): string {
  const data = getMedicalLexicon().filter(e => e.status === "published");
  return JSON.stringify(data, null, 2);
}
