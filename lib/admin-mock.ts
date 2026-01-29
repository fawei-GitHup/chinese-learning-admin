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

// ============================================
// MEDICAL SCENARIOS (content_items type='medical_scenario')
// Local storage for when Supabase is not configured
// ============================================
export interface MedicalScenarioEntry {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  conversation: ConversationLine[];
  key_phrases: string[];
  checklist: string[];
  warnings: ScenarioWarning[];
  // GEO/SEO publishing fields
  geo_intro: string;
  key_takeaways: string[];
  faq_json: FAQItem[];
  seo_title: string;
  seo_description: string;
  // Meta
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
}

export const mockMedicalScenarioItems: MedicalScenarioEntry[] = [];

const STORAGE_KEY_MEDICAL_SCENARIOS = "admin_medical_scenarios";

export function getMedicalScenarioItems(): MedicalScenarioEntry[] {
  if (typeof window === "undefined") return mockMedicalScenarioItems;
  const stored = localStorage.getItem(STORAGE_KEY_MEDICAL_SCENARIOS);
  return stored ? JSON.parse(stored) : mockMedicalScenarioItems;
}

export function saveMedicalScenarioEntry(entry: MedicalScenarioEntry) {
  const entries = getMedicalScenarioItems();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  localStorage.setItem(STORAGE_KEY_MEDICAL_SCENARIOS, JSON.stringify(entries));
}

export function deleteMedicalScenarioEntry(id: string) {
  const entries = getMedicalScenarioItems().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY_MEDICAL_SCENARIOS, JSON.stringify(entries));
}

export function exportMedicalScenarioJSON(): string {
  const data = getMedicalScenarioItems().filter(e => e.status === "published");
  return JSON.stringify(data, null, 2);
}

// ============================================
// MEDICAL DIALOGS (content_items type='medical_dialog')
// Local storage for when Supabase is not configured
// ============================================
export interface MedicalDialogExchange {
  speaker: string;
  text: string;
  pinyin?: string;
}

export interface MedicalDialogParticipant {
  name: string;
  role: string;
}

export interface MedicalDialogVocabulary {
  term: string;
  definition: string;
  pinyin?: string;
}

export interface MedicalDialogEntry {
  id: string;
  title: string;
  slug: string;
  dialog_type: "conversation" | "article";
  participants: MedicalDialogParticipant[];
  exchanges: MedicalDialogExchange[];
  article_body?: string;
  vocabulary: MedicalDialogVocabulary[];
  medical_context?: string;
  // GEO/SEO publishing fields
  geo_snippet: string;
  key_points: string[];
  faq_json: FAQItem[];
  seo_title: string;
  seo_description: string;
  // Meta
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
}

export const mockMedicalDialogItems: MedicalDialogEntry[] = [
  {
    id: "md1",
    title: "看医生 - Seeing a Doctor",
    slug: "kan-yisheng-seeing-doctor",
    dialog_type: "conversation",
    participants: [
      { name: "李明", role: "Patient" },
      { name: "王医生", role: "Doctor" },
    ],
    exchanges: [
      { speaker: "王医生", text: "你好，今天哪里不舒服？", pinyin: "Nǐ hǎo, jīntiān nǎlǐ bù shūfú?" },
      { speaker: "李明", text: "医生，我头疼，而且有点儿发烧。", pinyin: "Yīshēng, wǒ tóuténg, érqiě yǒudiǎnr fāshāo." },
      { speaker: "王医生", text: "头疼多长时间了？", pinyin: "Tóuténg duō cháng shíjiān le?" },
      { speaker: "李明", text: "已经两天了。", pinyin: "Yǐjīng liǎng tiān le." },
      { speaker: "王医生", text: "让我检查一下。请张开嘴。", pinyin: "Ràng wǒ jiǎnchá yīxià. Qǐng zhāngkāi zuǐ." },
    ],
    vocabulary: [
      { term: "头疼", definition: "headache", pinyin: "tóuténg" },
      { term: "发烧", definition: "fever", pinyin: "fāshāo" },
      { term: "检查", definition: "to examine", pinyin: "jiǎnchá" },
    ],
    medical_context: "This conversation demonstrates a typical doctor-patient interaction at a Chinese hospital or clinic.",
    geo_snippet: "Learn essential Chinese medical dialogue for visiting a doctor. This conversation covers describing symptoms like headache and fever to healthcare professionals.",
    key_points: [
      "哪里不舒服 is the standard question for 'what's bothering you'",
      "Use 有点儿 to describe mild symptoms",
      "Duration of symptoms uses 多长时间了",
      "张开嘴 means 'open your mouth' for examination",
    ],
    faq_json: [
      { question: "How do I describe a headache in Chinese?", answer: "我头疼 (wǒ tóuténg) means 'I have a headache'." },
    ],
    seo_title: "Chinese Medical Dialogue - Visiting the Doctor",
    seo_description: "Learn Chinese phrases for seeing a doctor, describing symptoms, and understanding medical examinations.",
    status: "published",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-15T14:00:00Z",
    publishedAt: "2025-01-15T14:00:00Z",
    author: "Admin User",
  },
  {
    id: "md2",
    title: "取药 - Picking Up Medicine",
    slug: "qu-yao-picking-up-medicine",
    dialog_type: "conversation",
    participants: [
      { name: "患者", role: "Patient" },
      { name: "药剂师", role: "Pharmacist" },
    ],
    exchanges: [
      { speaker: "药剂师", text: "您好，请出示您的处方。", pinyin: "Nín hǎo, qǐng chūshì nín de chǔfāng." },
      { speaker: "患者", text: "好的，给您。", pinyin: "Hǎo de, gěi nín." },
      { speaker: "药剂师", text: "这个药一天吃三次，饭后服用。", pinyin: "Zhège yào yī tiān chī sān cì, fàn hòu fúyòng." },
    ],
    vocabulary: [
      { term: "处方", definition: "prescription", pinyin: "chǔfāng" },
      { term: "服用", definition: "to take (medicine)", pinyin: "fúyòng" },
    ],
    medical_context: "Dialogue at a hospital pharmacy when picking up prescribed medication.",
    geo_snippet: "",
    key_points: ["处方 is required for certain medications"],
    faq_json: [],
    seo_title: "",
    seo_description: "",
    status: "draft",
    createdAt: "2025-01-18T08:00:00Z",
    updatedAt: "2025-01-20T16:00:00Z",
    author: "Editor User",
  },
];

const STORAGE_KEY_MEDICAL_DIALOGS = "admin_medical_dialogs";

export function getMedicalDialogItems(): MedicalDialogEntry[] {
  if (typeof window === "undefined") return mockMedicalDialogItems;
  const stored = localStorage.getItem(STORAGE_KEY_MEDICAL_DIALOGS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_MEDICAL_DIALOGS, JSON.stringify(mockMedicalDialogItems));
    return mockMedicalDialogItems;
  }
  return JSON.parse(stored);
}

export function saveMedicalDialogEntry(entry: MedicalDialogEntry) {
  const entries = getMedicalDialogItems();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  localStorage.setItem(STORAGE_KEY_MEDICAL_DIALOGS, JSON.stringify(entries));
}

export function deleteMedicalDialogEntry(id: string) {
  const entries = getMedicalDialogItems().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY_MEDICAL_DIALOGS, JSON.stringify(entries));
}

export function exportMedicalDialogJSON(): string {
  const data = getMedicalDialogItems().filter(e => e.status === "published");
  return JSON.stringify(data, null, 2);
}

// ============================================
// CONTENT VERSIONS (Mock for when Supabase is not configured)
// ============================================

export interface MockContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  seo_json?: Record<string, unknown>;
  geo_json?: Record<string, unknown>;
  status: string;
  created_at: string;
  created_by?: string;
  change_summary?: string;
}

const STORAGE_KEY_CONTENT_VERSIONS = "admin_content_versions";

// In-memory store for versions (localStorage backed)
function getVersionsStore(): Map<string, MockContentVersion[]> {
  if (typeof window === "undefined") return new Map();
  
  const stored = localStorage.getItem(STORAGE_KEY_CONTENT_VERSIONS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    } catch {
      return new Map();
    }
  }
  return new Map();
}

function saveVersionsStore(store: Map<string, MockContentVersion[]>) {
  if (typeof window === "undefined") return;
  const obj: Record<string, MockContentVersion[]> = {};
  store.forEach((value, key) => {
    obj[key] = value;
  });
  localStorage.setItem(STORAGE_KEY_CONTENT_VERSIONS, JSON.stringify(obj));
}

/**
 * Create a mock version snapshot for a content item
 */
export function mockCreateVersion(
  contentId: string,
  content: Record<string, unknown>,
  options: {
    title?: string;
    slug?: string;
    seo_json?: Record<string, unknown>;
    geo_json?: Record<string, unknown>;
    status?: string;
    changeSummary?: string;
    createdBy?: string;
  } = {}
): MockContentVersion {
  const store = getVersionsStore();
  const contentVersions = store.get(contentId) || [];
  
  const maxVersion = contentVersions.reduce((max, v) => Math.max(max, v.version_number), 0);
  const newVersionNumber = maxVersion + 1;

  const newVersion: MockContentVersion = {
    id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content_id: contentId,
    version_number: newVersionNumber,
    title: options.title || (content.title as string) || (content.term as string) || "Untitled",
    slug: options.slug || `item-${contentId.substring(0, 8)}`,
    content,
    seo_json: options.seo_json,
    geo_json: options.geo_json,
    status: options.status || "draft",
    created_at: new Date().toISOString(),
    created_by: options.createdBy,
    change_summary: options.changeSummary,
  };

  contentVersions.unshift(newVersion);
  store.set(contentId, contentVersions);
  saveVersionsStore(store);

  return newVersion;
}

/**
 * Get version history for a content item (mock)
 */
export function mockGetVersionHistory(contentId: string): MockContentVersion[] {
  const store = getVersionsStore();
  return store.get(contentId) || [];
}

/**
 * Get a specific version by ID (mock)
 */
export function mockGetVersionById(versionId: string): MockContentVersion | null {
  const store = getVersionsStore();
  for (const versions of store.values()) {
    const found = versions.find(v => v.id === versionId);
    if (found) return found;
  }
  return null;
}

/**
 * Rollback content to a specific version (mock)
 * Returns the version data to be applied to the content
 */
export function mockRollbackToVersion(
  contentId: string,
  versionId: string
): MockContentVersion | null {
  const store = getVersionsStore();
  const contentVersions = store.get(contentId);
  
  if (!contentVersions) return null;
  
  const targetVersion = contentVersions.find(v => v.id === versionId);
  if (!targetVersion) return null;

  return targetVersion;
}

/**
 * Get the current version number (mock)
 */
export function mockGetCurrentVersionNumber(contentId: string): number {
  const versions = mockGetVersionHistory(contentId);
  if (versions.length === 0) return 0;
  return Math.max(...versions.map(v => v.version_number));
}

/**
 * Compare two mock versions
 */
export interface MockVersionDiff {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
  hasChanges: boolean;
}

export function mockCompareVersions(
  oldVersion: MockContentVersion,
  newVersion: MockContentVersion
): MockVersionDiff[] {
  const diffs: MockVersionDiff[] = [];

  // Compare title
  diffs.push({
    field: "title",
    label: "标题 / Title",
    oldValue: oldVersion.title,
    newValue: newVersion.title,
    hasChanges: oldVersion.title !== newVersion.title,
  });

  // Compare slug
  diffs.push({
    field: "slug",
    label: "URL 别名 / Slug",
    oldValue: oldVersion.slug,
    newValue: newVersion.slug,
    hasChanges: oldVersion.slug !== newVersion.slug,
  });

  // Compare status
  diffs.push({
    field: "status",
    label: "状态 / Status",
    oldValue: oldVersion.status,
    newValue: newVersion.status,
    hasChanges: oldVersion.status !== newVersion.status,
  });

  // Compare content
  const contentChanged = JSON.stringify(oldVersion.content) !== JSON.stringify(newVersion.content);
  diffs.push({
    field: "content",
    label: "内容 / Content",
    oldValue: oldVersion.content,
    newValue: newVersion.content,
    hasChanges: contentChanged,
  });

  // Compare SEO
  const seoChanged = JSON.stringify(oldVersion.seo_json) !== JSON.stringify(newVersion.seo_json);
  diffs.push({
    field: "seo_json",
    label: "SEO 元数据 / SEO Metadata",
    oldValue: oldVersion.seo_json,
    newValue: newVersion.seo_json,
    hasChanges: seoChanged,
  });

  // Compare GEO
  const geoChanged = JSON.stringify(oldVersion.geo_json) !== JSON.stringify(newVersion.geo_json);
  diffs.push({
    field: "geo_json",
    label: "GEO 数据 / GEO Data",
    oldValue: oldVersion.geo_json,
    newValue: newVersion.geo_json,
    hasChanges: geoChanged,
  });

  return diffs;
}

/**
 * Clear all versions for a content item (useful for testing)
 */
export function mockClearVersions(contentId: string): void {
  const store = getVersionsStore();
  store.delete(contentId);
  saveVersionsStore(store);
}

// ============================================
// USER PROFILES (Mock for when Supabase is not configured)
// ============================================

export interface MockProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockUserStats {
  total_users: number;
  admin_count: number;
  editor_count: number;
  viewer_count: number;
  active_count: number;
  inactive_count: number;
}

export const mockProfiles: MockProfile[] = [
  {
    id: 'mock-admin-1',
    email: 'admin@example.com',
    name: '管理员',
    avatar_url: null,
    role: 'admin',
    is_active: true,
    last_login_at: '2026-01-29T10:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-01-29T10:00:00Z',
  },
  {
    id: 'mock-admin-2',
    email: 'superadmin@example.com',
    name: '超级管理员',
    avatar_url: null,
    role: 'admin',
    is_active: true,
    last_login_at: '2026-01-28T15:30:00Z',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2026-01-28T15:30:00Z',
  },
  {
    id: 'mock-editor-1',
    email: 'editor1@example.com',
    name: '编辑员 A',
    avatar_url: null,
    role: 'editor',
    is_active: true,
    last_login_at: '2026-01-28T09:00:00Z',
    created_at: '2025-02-15T00:00:00Z',
    updated_at: '2026-01-28T09:00:00Z',
  },
  {
    id: 'mock-editor-2',
    email: 'editor2@example.com',
    name: '编辑员 B',
    avatar_url: null,
    role: 'editor',
    is_active: true,
    last_login_at: '2026-01-27T14:00:00Z',
    created_at: '2025-03-10T00:00:00Z',
    updated_at: '2026-01-27T14:00:00Z',
  },
  {
    id: 'mock-editor-3',
    email: 'editor3@example.com',
    name: '编辑员 C',
    avatar_url: null,
    role: 'editor',
    is_active: false,
    last_login_at: '2026-01-01T08:00:00Z',
    created_at: '2025-04-01T00:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'mock-viewer-1',
    email: 'viewer1@example.com',
    name: '查看者 A',
    avatar_url: null,
    role: 'viewer',
    is_active: true,
    last_login_at: '2026-01-26T11:00:00Z',
    created_at: '2025-05-01T00:00:00Z',
    updated_at: '2026-01-26T11:00:00Z',
  },
  {
    id: 'mock-viewer-2',
    email: 'viewer2@example.com',
    name: '查看者 B',
    avatar_url: null,
    role: 'viewer',
    is_active: true,
    last_login_at: '2026-01-25T16:00:00Z',
    created_at: '2025-06-15T00:00:00Z',
    updated_at: '2026-01-25T16:00:00Z',
  },
  {
    id: 'mock-viewer-3',
    email: 'viewer3@example.com',
    name: null,
    avatar_url: null,
    role: 'viewer',
    is_active: true,
    last_login_at: null,
    created_at: '2025-07-20T00:00:00Z',
    updated_at: '2025-07-20T00:00:00Z',
  },
  {
    id: 'mock-viewer-4',
    email: 'inactive.user@example.com',
    name: '已禁用用户',
    avatar_url: null,
    role: 'viewer',
    is_active: false,
    last_login_at: '2025-10-01T00:00:00Z',
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2025-12-01T00:00:00Z',
  },
];

const STORAGE_KEY_PROFILES = "admin_profiles";

/**
 * Get all mock profiles
 */
export function mockFetchAllProfiles(): MockProfile[] {
  if (typeof window === "undefined") return mockProfiles;
  
  const stored = localStorage.getItem(STORAGE_KEY_PROFILES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(mockProfiles));
      return mockProfiles;
    }
  }
  
  localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(mockProfiles));
  return mockProfiles;
}

/**
 * Get mock profile by ID
 */
export function mockFetchProfileById(id: string): MockProfile | null {
  const profiles = mockFetchAllProfiles();
  return profiles.find(p => p.id === id) || null;
}

/**
 * Update mock profile role
 */
export function mockUpdateProfileRole(
  id: string, 
  role: 'admin' | 'editor' | 'viewer'
): { success: boolean; error?: string } {
  const profiles = mockFetchAllProfiles();
  const profile = profiles.find(p => p.id === id);
  
  if (!profile) {
    return { success: false, error: 'User not found' };
  }
  
  // Check if demoting the last admin
  if (profile.role === 'admin' && role !== 'admin') {
    const activeAdmins = profiles.filter(p => p.role === 'admin' && p.is_active);
    if (activeAdmins.length <= 1) {
      return { success: false, error: 'Cannot demote: at least one active admin is required' };
    }
  }
  
  profile.role = role;
  profile.updated_at = new Date().toISOString();
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }
  
  return { success: true };
}

/**
 * Update mock profile status
 */
export function mockUpdateProfileStatus(
  id: string, 
  isActive: boolean
): { success: boolean; error?: string } {
  const profiles = mockFetchAllProfiles();
  const profile = profiles.find(p => p.id === id);
  
  if (!profile) {
    return { success: false, error: 'User not found' };
  }
  
  // Check if disabling the last admin
  if (profile.role === 'admin' && !isActive) {
    const activeAdmins = profiles.filter(p => p.role === 'admin' && p.is_active);
    if (activeAdmins.length <= 1) {
      return { success: false, error: 'Cannot disable: at least one active admin is required' };
    }
  }
  
  profile.is_active = isActive;
  profile.updated_at = new Date().toISOString();
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }
  
  return { success: true };
}

/**
 * Search mock profiles
 */
export function mockSearchProfiles(query: string): MockProfile[] {
  const profiles = mockFetchAllProfiles();
  const lowerQuery = query.toLowerCase();
  
  return profiles.filter(p => 
    p.email.toLowerCase().includes(lowerQuery) ||
    (p.name && p.name.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get mock user stats
 */
export function mockFetchUserStats(): MockUserStats {
  const profiles = mockFetchAllProfiles();
  
  return {
    total_users: profiles.length,
    admin_count: profiles.filter(p => p.role === 'admin').length,
    editor_count: profiles.filter(p => p.role === 'editor').length,
    viewer_count: profiles.filter(p => p.role === 'viewer').length,
    active_count: profiles.filter(p => p.is_active).length,
    inactive_count: profiles.filter(p => !p.is_active).length,
  };
}

/**
 * Reset mock profiles to initial state
 */
export function mockResetProfiles(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(mockProfiles));
  }
}

// ============================================
// ALLOWED EMAILS (Login Whitelist) Mock Data
// ============================================

export interface MockAllowedEmail {
  id: string;
  email: string;
  is_domain_pattern: boolean;
  default_role: 'admin' | 'editor' | 'viewer';
  notes: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockAllowlistStats {
  total: number;
  domainPatterns: number;
  adminDefaults: number;
  editorDefaults: number;
  viewerDefaults: number;
}

export const mockAllowedEmails: MockAllowedEmail[] = [
  {
    id: 'ae-1',
    email: 'admin@example.com',
    is_domain_pattern: false,
    default_role: 'admin',
    notes: '系统管理员 / System administrator',
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ae-2',
    email: '*@company.com',
    is_domain_pattern: true,
    default_role: 'editor',
    notes: '公司域名 / Company domain',
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ae-3',
    email: 'editor1@example.com',
    is_domain_pattern: false,
    default_role: 'editor',
    notes: '编辑员 / Editor',
    added_by: null,
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
  },
  {
    id: 'ae-4',
    email: 'guest@external.com',
    is_domain_pattern: false,
    default_role: 'viewer',
    notes: '外部顾问 / External consultant',
    added_by: null,
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 'ae-5',
    email: '*@partner.org',
    is_domain_pattern: true,
    default_role: 'viewer',
    notes: '合作伙伴组织 / Partner organization',
    added_by: null,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  },
];

const STORAGE_KEY_ALLOWED_EMAILS = "admin_allowed_emails";

/**
 * Helper: Detect if email is a domain pattern
 */
function isDomainPattern(email: string): boolean {
  return email.startsWith('*@');
}

/**
 * Helper: Validate email format
 */
function isValidEmailFormat(email: string): boolean {
  if (isDomainPattern(email)) {
    const domain = email.substring(2);
    return domain.includes('.') && domain.length > 3;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get all mock allowed emails
 */
export function mockFetchAllowedEmails(): MockAllowedEmail[] {
  if (typeof window === "undefined") return mockAllowedEmails;
  
  const stored = localStorage.getItem(STORAGE_KEY_ALLOWED_EMAILS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(mockAllowedEmails));
      return mockAllowedEmails;
    }
  }
  
  localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(mockAllowedEmails));
  return mockAllowedEmails;
}

/**
 * Add email to mock allowlist
 */
export function mockAddAllowedEmail(
  email: string,
  defaultRole: 'admin' | 'editor' | 'viewer' = 'viewer',
  notes?: string
): { success: boolean; data?: MockAllowedEmail; error?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!isValidEmailFormat(normalizedEmail)) {
    return { success: false, error: 'Invalid email format / 无效的邮箱格式' };
  }

  const entries = mockFetchAllowedEmails();
  
  // Check for duplicates
  if (entries.some(e => e.email === normalizedEmail)) {
    return { success: false, error: 'Email already exists / 邮箱已存在' };
  }

  const now = new Date().toISOString();
  const newEntry: MockAllowedEmail = {
    id: `ae-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: normalizedEmail,
    is_domain_pattern: isDomainPattern(normalizedEmail),
    default_role: defaultRole,
    notes: notes || null,
    added_by: null,
    created_at: now,
    updated_at: now,
  };

  entries.unshift(newEntry);
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(entries));
  }

  return { success: true, data: newEntry };
}

/**
 * Remove email from mock allowlist
 */
export function mockRemoveAllowedEmail(id: string): { success: boolean; error?: string } {
  const entries = mockFetchAllowedEmails();
  const index = entries.findIndex(e => e.id === id);
  
  if (index === -1) {
    return { success: false, error: 'Entry not found / 条目未找到' };
  }

  entries.splice(index, 1);
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(entries));
  }

  return { success: true };
}

/**
 * Update mock allowlist entry
 */
export function mockUpdateAllowedEmail(
  id: string,
  updates: Partial<Pick<MockAllowedEmail, 'default_role' | 'notes'>>
): { success: boolean; error?: string } {
  const entries = mockFetchAllowedEmails();
  const entry = entries.find(e => e.id === id);
  
  if (!entry) {
    return { success: false, error: 'Entry not found / 条目未找到' };
  }

  if (updates.default_role) {
    entry.default_role = updates.default_role;
  }
  if (updates.notes !== undefined) {
    entry.notes = updates.notes;
  }
  entry.updated_at = new Date().toISOString();
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(entries));
  }

  return { success: true };
}

/**
 * Check if email is allowed (mock version)
 */
export function mockCheckEmailAllowed(email: string): { allowed: boolean; defaultRole: 'admin' | 'editor' | 'viewer' } {
  const normalizedEmail = email.toLowerCase().trim();
  const entries = mockFetchAllowedEmails();

  // Check exact match first
  const exactMatch = entries.find(e => e.email === normalizedEmail && !e.is_domain_pattern);
  if (exactMatch) {
    return { allowed: true, defaultRole: exactMatch.default_role };
  }

  // Check domain patterns (prefer longer/more specific patterns)
  const domainPatterns = entries
    .filter(e => e.is_domain_pattern)
    .sort((a, b) => b.email.length - a.email.length);

  for (const pattern of domainPatterns) {
    const regex = new RegExp('^' + pattern.email.replace('*', '.*') + '$', 'i');
    if (regex.test(normalizedEmail)) {
      return { allowed: true, defaultRole: pattern.default_role };
    }
  }

  // If no entries exist, allow by default (backward compatibility)
  if (entries.length === 0) {
    return { allowed: true, defaultRole: 'viewer' };
  }

  return { allowed: false, defaultRole: 'viewer' };
}

/**
 * Get mock allowlist statistics
 */
export function mockGetAllowlistStats(): MockAllowlistStats {
  const entries = mockFetchAllowedEmails();
  
  return {
    total: entries.length,
    domainPatterns: entries.filter(e => e.is_domain_pattern).length,
    adminDefaults: entries.filter(e => e.default_role === 'admin').length,
    editorDefaults: entries.filter(e => e.default_role === 'editor').length,
    viewerDefaults: entries.filter(e => e.default_role === 'viewer').length,
  };
}

/**
 * Search mock allowed emails
 */
export function mockSearchAllowedEmails(query: string): MockAllowedEmail[] {
  const entries = mockFetchAllowedEmails();
  const lowerQuery = query.toLowerCase();
  
  return entries.filter(e => 
    e.email.toLowerCase().includes(lowerQuery) ||
    (e.notes && e.notes.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Bulk import mock emails
 */
export function mockBulkImportEmails(
  emails: Array<{ email: string; default_role?: 'admin' | 'editor' | 'viewer'; notes?: string }>
): { success: number; failed: number; errors: Array<{ email: string; error: string }> } {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  for (const item of emails) {
    const { success, error } = mockAddAllowedEmail(
      item.email,
      item.default_role || 'viewer',
      item.notes
    );

    if (success) {
      result.success++;
    } else {
      result.failed++;
      result.errors.push({
        email: item.email,
        error: error || 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Reset mock allowed emails to initial state
 */
export function mockResetAllowedEmails(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(mockAllowedEmails));
  }
}
