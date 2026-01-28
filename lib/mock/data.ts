export type ContentStatus = "draft" | "in_review" | "published" | "archived";
export type UserRole = "admin" | "editor" | "viewer";
export type HSKLevel = "HSK1" | "HSK2" | "HSK3" | "HSK4" | "HSK5" | "HSK6";
export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";
export type MedicalCategory = "挂号" | "分诊" | "问诊" | "检查" | "用药" | "缴费";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Quiz question types
export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "tone" | "listening";
  question: string;
  options?: string[];
  answer: string;
}

// Lesson with all required fields
export interface Lesson {
  id: string;
  title: string;
  slug: string;
  level: HSKLevel;
  tags: string[];
  summary: string;
  lesson_content: string;
  key_vocab: string[];
  quiz_bank: QuizQuestion[];
  seo_title: string;
  seo_description: string;
  geo_snippet: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
}

// Glossary item for readings
export interface GlossaryItem {
  word: string;
  pinyin: string;
  meaning: string;
}

// FAQ item
export interface FAQItem {
  question: string;
  answer: string;
}

// Reading with all required fields
export interface Reading {
  id: string;
  title: string;
  slug: string;
  level: HSKLevel;
  tags: string[];
  summary: string;
  reading_body: string;
  audio_url: string;
  glossary: GlossaryItem[];
  seo_title: string;
  seo_description: string;
  faq: FAQItem[];
  geo_snippet: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
}

// Patient template for medical dialogs
export interface PatientTemplate {
  template: string;
  variables: string;
}

// Dialog line for full dialogue
export interface DialogLine {
  speaker: string;
  line: string;
}

// Medical Dialog with all required fields
export interface MedicalDialog {
  id: string;
  title: string;
  slug: string;
  category: MedicalCategory;
  difficulty: DifficultyLevel;
  key_phrases: string[];
  doctor_questions: string[];
  patient_templates: PatientTemplate[];
  full_dialogue: DialogLine[];
  safety_note: string;
  seo_title: string;
  seo_description: string;
  faq: FAQItem[];
  geo_snippet: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
}

// Grammar example with cn/pinyin/en
export interface GrammarExample {
  cn: string;
  pinyin: string;
  en: string;
}

// Grammar Rule with all required fields
export interface GrammarRule {
  id: string;
  title: string;
  slug: string;
  pattern: string;
  explanation: string;
  examples: GrammarExample[];
  common_errors: string[];
  seo_title: string;
  seo_description: string;
  geo_snippet: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
}

// Review Record for audit trail
export interface ReviewRecord {
  id: string;
  action: "created" | "submitted_for_review" | "approved" | "rejected" | "published" | "archived" | "edited";
  fromStatus: ContentStatus | null;
  toStatus: ContentStatus;
  user: string;
  comment?: string;
  timestamp: string;
}

// Team Member
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  joinedAt: string;
  lastActive: string;
}

// Workflow Rule
export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: string;
  action: string;
}

export interface Asset {
  id: string;
  name: string;
  type: "image" | "audio" | "video" | "document";
  url: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SEOPage {
  id: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  updatedAt: string;
}

// Mock Users
export const mockUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@example.com", role: "admin", avatar: "" },
  { id: "2", name: "Editor User", email: "editor@example.com", role: "editor", avatar: "" },
  { id: "3", name: "Viewer User", email: "viewer@example.com", role: "viewer", avatar: "" },
];

// Mock Lessons
export const mockLessons: Lesson[] = [
  {
    id: "l1",
    title: "Basic Greetings in Chinese",
    slug: "basic-greetings-in-chinese",
    level: "HSK1",
    tags: ["greetings", "beginner", "conversation"],
    summary: "Learn essential greetings and introductions for everyday conversations in Mandarin Chinese.",
    lesson_content: "# Basic Greetings\n\nIn this lesson, you will learn the most common greetings used in everyday Chinese conversations.\n\n## 你好 (Nǐ hǎo)\n\nThe most basic greeting meaning 'Hello'.\n\n## 早上好 (Zǎoshang hǎo)\n\nMeaning 'Good morning', used before noon.",
    key_vocab: ["你好", "早上好", "晚上好", "再见", "谢谢"],
    quiz_bank: [
      { id: "q1", type: "multiple_choice", question: "How do you say 'Hello' in Chinese?", options: ["你好", "再见", "谢谢", "对不起"], answer: "你好" },
      { id: "q2", type: "tone", question: "What tone is used for 好 in 你好?", answer: "3rd tone" },
    ],
    seo_title: "Learn Basic Chinese Greetings - HSK1 Lesson",
    seo_description: "Master essential Mandarin greetings with our beginner-friendly lesson. Learn 你好, 早上好, and more.",
    geo_snippet: "This lesson covers the fundamental Chinese greetings including 你好 (hello), 早上好 (good morning), and 再见 (goodbye). Perfect for HSK1 learners starting their Mandarin journey.",
    status: "published",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-15T14:30:00Z",
    publishedAt: "2025-01-15T14:30:00Z",
    author: "Admin User",
  },
  {
    id: "l2",
    title: "Numbers and Counting",
    slug: "numbers-and-counting",
    level: "HSK1",
    tags: ["numbers", "beginner", "basics"],
    summary: "Master Chinese numbers from 1 to 1000 and learn counting patterns.",
    lesson_content: "# Numbers in Chinese\n\n## Basic Numbers 1-10\n\n一 (yī) - 1\n二 (èr) - 2\n三 (sān) - 3\n...",
    key_vocab: ["一", "二", "三", "四", "五", "十", "百", "千"],
    quiz_bank: [
      { id: "q1", type: "multiple_choice", question: "What is 五 in English?", options: ["Three", "Five", "Seven", "Nine"], answer: "Five" },
    ],
    seo_title: "Chinese Numbers 1-1000 - Learn to Count in Mandarin",
    seo_description: "Learn Chinese numbers and counting patterns. From basic 1-10 to hundreds and thousands.",
    geo_snippet: "",
    status: "published",
    createdAt: "2025-01-12T09:00:00Z",
    updatedAt: "2025-01-14T11:00:00Z",
    publishedAt: "2025-01-14T11:00:00Z",
    author: "Editor User",
  },
  {
    id: "l3",
    title: "Ordering Food at Restaurants",
    slug: "ordering-food-at-restaurants",
    level: "HSK3",
    tags: ["food", "restaurant", "conversation"],
    summary: "Learn vocabulary and phrases for dining out in China.",
    lesson_content: "# Restaurant Chinese\n\nLearn how to order food, ask for recommendations, and handle payment at Chinese restaurants.",
    key_vocab: ["菜单", "点菜", "服务员", "买单", "好吃"],
    quiz_bank: [],
    seo_title: "",
    seo_description: "",
    geo_snippet: "",
    status: "draft",
    createdAt: "2025-01-18T08:00:00Z",
    updatedAt: "2025-01-20T16:00:00Z",
    author: "Admin User",
  },
  {
    id: "l4",
    title: "Business Meeting Etiquette",
    slug: "business-meeting-etiquette",
    level: "HSK5",
    tags: ["business", "formal", "professional"],
    summary: "Professional Chinese for business meetings and negotiations.",
    lesson_content: "# Business Chinese\n\nMaster the language of Chinese business meetings.",
    key_vocab: ["会议", "合作", "签约", "谈判", "协议"],
    quiz_bank: [],
    seo_title: "Business Chinese - Meeting Etiquette and Vocabulary",
    seo_description: "Learn professional Mandarin for business meetings, negotiations, and formal settings.",
    geo_snippet: "",
    status: "archived",
    createdAt: "2024-12-01T10:00:00Z",
    updatedAt: "2025-01-05T09:00:00Z",
    author: "Editor User",
  },
];

// Mock Readings
export const mockReadings: Reading[] = [
  {
    id: "r1",
    title: "The Legend of the Dragon Boat Festival",
    slug: "legend-of-dragon-boat-festival",
    level: "HSK3",
    tags: ["culture", "festival", "history"],
    summary: "Discover the ancient legend behind one of China's most important traditional festivals.",
    reading_body: "# 端午节的传说\n\n很久以前，中国有一位诗人叫屈原...\n\nLong ago in ancient China, there lived a poet named Qu Yuan. He was known for his patriotism and wisdom...",
    audio_url: "/audio/dragon-boat-festival.mp3",
    glossary: [
      { word: "端午节", pinyin: "Duānwǔ jié", meaning: "Dragon Boat Festival" },
      { word: "诗人", pinyin: "shīrén", meaning: "poet" },
      { word: "传说", pinyin: "chuánshuō", meaning: "legend" },
    ],
    seo_title: "Dragon Boat Festival Legend - Chinese Reading Practice",
    seo_description: "Read and learn about the legend of Qu Yuan and the Dragon Boat Festival in Mandarin Chinese.",
    faq: [
      { question: "When is the Dragon Boat Festival?", answer: "The Dragon Boat Festival falls on the 5th day of the 5th month of the Chinese lunar calendar." },
      { question: "Why do people eat zongzi?", answer: "People eat zongzi (rice dumplings) to commemorate Qu Yuan. Legend says villagers threw rice into the river to prevent fish from eating his body." },
    ],
    geo_snippet: "Learn about the Dragon Boat Festival (端午节) through this intermediate Chinese reading. Discover the legend of Qu Yuan and traditional customs including dragon boat racing and eating zongzi.",
    status: "published",
    createdAt: "2025-01-05T10:00:00Z",
    updatedAt: "2025-01-10T14:00:00Z",
    publishedAt: "2025-01-10T14:00:00Z",
    author: "Editor User",
  },
  {
    id: "r2",
    title: "A Day in Beijing",
    slug: "a-day-in-beijing",
    level: "HSK2",
    tags: ["travel", "beijing", "daily life"],
    summary: "Follow a traveler's journey through the historic capital of China.",
    reading_body: "# 北京的一天\n\n今天我去了长城...\n\nToday I visited the Great Wall of China. It was an incredible experience...",
    audio_url: "",
    glossary: [
      { word: "长城", pinyin: "Chángchéng", meaning: "Great Wall" },
      { word: "故宫", pinyin: "Gùgōng", meaning: "Forbidden City" },
    ],
    seo_title: "A Day in Beijing - Chinese Travel Reading",
    seo_description: "Practice your Chinese reading skills with this travel story about visiting Beijing's famous landmarks.",
    faq: [],
    geo_snippet: "",
    status: "published",
    createdAt: "2025-01-08T09:00:00Z",
    updatedAt: "2025-01-12T11:00:00Z",
    publishedAt: "2025-01-12T11:00:00Z",
    author: "Admin User",
  },
  {
    id: "r3",
    title: "Traditional Chinese Medicine",
    slug: "traditional-chinese-medicine",
    level: "HSK5",
    tags: ["health", "medicine", "culture"],
    summary: "An introduction to the principles and practices of traditional Chinese medicine.",
    reading_body: "# 中医\n\n中医有几千年的历史...\n\nTraditional Chinese Medicine has a history spanning thousands of years...",
    audio_url: "/audio/tcm-intro.mp3",
    glossary: [
      { word: "中医", pinyin: "zhōngyī", meaning: "Traditional Chinese Medicine" },
      { word: "针灸", pinyin: "zhēnjiǔ", meaning: "acupuncture" },
      { word: "草药", pinyin: "cǎoyào", meaning: "herbal medicine" },
    ],
    seo_title: "",
    seo_description: "",
    faq: [],
    geo_snippet: "",
    status: "draft",
    createdAt: "2025-01-15T08:00:00Z",
    updatedAt: "2025-01-18T16:00:00Z",
    author: "Editor User",
  },
];

// Mock Medical Dialogs
export const mockMedicalDialogs: MedicalDialog[] = [
  {
    id: "md1",
    title: "挂号 - Hospital Registration",
    slug: "hospital-registration",
    category: "挂号",
    difficulty: "Beginner",
    key_phrases: ["挂号", "请问", "哪个科", "内科", "外科"],
    doctor_questions: [
      "请问您哪里不舒服？",
      "您有医保吗？",
      "您要挂哪个科？",
    ],
    patient_templates: [
      { template: "我想挂{科室}的号", variables: "科室: 内科/外科/眼科/牙科" },
      { template: "请问{科室}怎么走？", variables: "科室: 内科/外科/眼科" },
    ],
    full_dialogue: [
      { speaker: "Patient", line: "你好，我想挂号。" },
      { speaker: "Receptionist", line: "好的，请问您要挂哪个科？" },
      { speaker: "Patient", line: "我头疼，应该挂什么科？" },
      { speaker: "Receptionist", line: "头疼可以挂内科。请出示您的身份证和医保卡。" },
      { speaker: "Patient", line: "好的，给您。" },
      { speaker: "Receptionist", line: "挂号费是20元，请到二楼内科候诊。" },
    ],
    safety_note: "如有急症请直接前往急诊室或拨打120急救电话",
    seo_title: "Chinese Hospital Registration Dialogue - Medical Chinese",
    seo_description: "Learn how to register at a Chinese hospital with this practical dialogue. Essential medical Chinese for beginners.",
    faq: [
      { question: "What documents do I need for hospital registration?", answer: "You typically need your ID card (身份证) and health insurance card (医保卡) if applicable." },
    ],
    geo_snippet: "Learn essential Chinese phrases for hospital registration (挂号). This beginner dialogue covers how to register, ask about departments, and navigate a Chinese hospital.",
    status: "published",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-15T14:00:00Z",
    publishedAt: "2025-01-15T14:00:00Z",
    author: "Admin User",
  },
  {
    id: "md2",
    title: "问诊 - Doctor Consultation",
    slug: "doctor-consultation",
    category: "问诊",
    difficulty: "Intermediate",
    key_phrases: ["症状", "多长时间", "发烧", "咳嗽", "过敏"],
    doctor_questions: [
      "您哪里不舒服？",
      "症状持续多长时间了？",
      "有没有发烧？",
      "对什么药物过敏吗？",
    ],
    patient_templates: [
      { template: "我{症状}已经{时间}了", variables: "症状: 头疼/发烧/咳嗽, 时间: 两天/一周" },
      { template: "我对{药物}过敏", variables: "药物: 青霉素/阿司匹林" },
    ],
    full_dialogue: [
      { speaker: "Doctor", line: "请坐，您哪里不舒服？" },
      { speaker: "Patient", line: "医生您好，我头疼，还有点发烧。" },
      { speaker: "Doctor", line: "症状持续多长时间了？" },
      { speaker: "Patient", line: "大概两天了。" },
      { speaker: "Doctor", line: "有没有咳嗽或者流鼻涕？" },
      { speaker: "Patient", line: "有一点咳嗽。" },
      { speaker: "Doctor", line: "我先给您量一下体温。" },
    ],
    safety_note: "",
    seo_title: "Doctor Consultation in Chinese - Medical Dialogue",
    seo_description: "Practice describing symptoms to a doctor in Mandarin Chinese with this intermediate dialogue.",
    faq: [],
    geo_snippet: "",
    status: "published",
    createdAt: "2025-01-12T09:00:00Z",
    updatedAt: "2025-01-14T11:00:00Z",
    publishedAt: "2025-01-14T11:00:00Z",
    author: "Editor User",
  },
  {
    id: "md3",
    title: "用药 - Taking Medication",
    slug: "taking-medication",
    category: "用药",
    difficulty: "Intermediate",
    key_phrases: ["处方", "药房", "服用", "饭前", "饭后"],
    doctor_questions: [],
    patient_templates: [],
    full_dialogue: [
      { speaker: "Pharmacist", line: "请出示您的处方。" },
      { speaker: "Patient", line: "给您。" },
      { speaker: "Pharmacist", line: "这是您的药，一共三种。" },
    ],
    safety_note: "请严格按照医嘱服药，如有不适立即就医",
    seo_title: "",
    seo_description: "",
    faq: [],
    geo_snippet: "",
    status: "draft",
    createdAt: "2025-01-18T08:00:00Z",
    updatedAt: "2025-01-20T16:00:00Z",
    author: "Admin User",
  },
];

// Mock Grammar Rules
export const mockGrammarRules: GrammarRule[] = [
  {
    id: "g1",
    title: "Using 是 (shì) - The Verb 'To Be'",
    slug: "using-shi-verb-to-be",
    pattern: "Subject + 是 + Noun",
    explanation: "# 是 (shì) - The Verb 'To Be'\n\n是 is used to link a subject with a noun or noun phrase. Unlike English 'is/am/are', 是 is only used with nouns, NOT with adjectives.\n\n## Key Points:\n- Used to identify or classify\n- NOT used with adjectives (use 很 instead)\n- Can be negated with 不是",
    examples: [
      { cn: "我是学生", pinyin: "Wǒ shì xuéshēng", en: "I am a student" },
      { cn: "她是老师", pinyin: "Tā shì lǎoshī", en: "She is a teacher" },
      { cn: "这不是我的书", pinyin: "Zhè bù shì wǒ de shū", en: "This is not my book" },
    ],
    common_errors: [
      "我是高 ❌ (incorrect - don't use 是 with adjectives)",
      "我很高 ✓ (correct - use 很 with adjectives)",
      "他是很好 ❌ (incorrect - don't combine 是 and 很 with adjectives)",
    ],
    seo_title: "Chinese Grammar: 是 (shì) - The Verb To Be",
    seo_description: "Learn how to use 是 (shì) in Mandarin Chinese. Understand when to use and when not to use this essential verb.",
    geo_snippet: "Master the Chinese verb 是 (shì) with this comprehensive grammar guide. Learn the pattern Subject + 是 + Noun, see examples, and avoid common mistakes.",
    status: "published",
    createdAt: "2025-01-05T10:00:00Z",
    updatedAt: "2025-01-10T14:00:00Z",
    publishedAt: "2025-01-10T14:00:00Z",
    author: "Admin User",
  },
  {
    id: "g2",
    title: "Measure Words (量词)",
    slug: "measure-words-liangci",
    pattern: "Number + Measure Word + Noun",
    explanation: "# Measure Words (量词)\n\nChinese uses measure words (also called classifiers) between numbers/demonstratives and nouns. Different nouns require different measure words.\n\n## Common Measure Words:\n- 个 (gè) - general, most common\n- 本 (běn) - books\n- 只 (zhī) - animals\n- 件 (jiàn) - clothes, matters",
    examples: [
      { cn: "一个人", pinyin: "yí gè rén", en: "one person" },
      { cn: "两本书", pinyin: "liǎng běn shū", en: "two books" },
      { cn: "三只猫", pinyin: "sān zhī māo", en: "three cats" },
    ],
    common_errors: [
      "一人 ❌ (missing measure word)",
      "一个人 ✓ (correct with measure word)",
      "两个书 ❌ (wrong measure word for books)",
      "两本书 ✓ (correct measure word for books)",
    ],
    seo_title: "Chinese Measure Words (量词) - Complete Guide",
    seo_description: "Learn Chinese measure words (classifiers) with examples. Essential grammar for counting and describing objects in Mandarin.",
    geo_snippet: "",
    status: "published",
    createdAt: "2025-01-08T09:00:00Z",
    updatedAt: "2025-01-12T11:00:00Z",
    publishedAt: "2025-01-12T11:00:00Z",
    author: "Editor User",
  },
  {
    id: "g3",
    title: "了 (le) - Completed Action",
    slug: "le-completed-action",
    pattern: "Verb + 了 (+ Object)",
    explanation: "# 了 (le) - Completed Action\n\n了 indicates that an action has been completed or that a change of state has occurred.\n\n## Two main uses:\n1. After a verb to show completion\n2. At the end of a sentence to show change of state",
    examples: [
      { cn: "我吃了饭", pinyin: "Wǒ chī le fàn", en: "I ate / I have eaten" },
      { cn: "他走了", pinyin: "Tā zǒu le", en: "He left / He has left" },
      { cn: "下雨了", pinyin: "Xià yǔ le", en: "It started raining" },
    ],
    common_errors: [
      "我昨天吃饭了 (position can vary based on meaning)",
      "我吃了三碗饭 (了 comes right after the verb when there's an amount)",
    ],
    seo_title: "",
    seo_description: "",
    geo_snippet: "",
    status: "draft",
    createdAt: "2025-01-15T08:00:00Z",
    updatedAt: "2025-01-18T16:00:00Z",
    author: "Admin User",
  },
  {
    id: "g4",
    title: "一边...一边... - Doing Two Things Simultaneously",
    slug: "yibian-yibian-simultaneously",
    pattern: "一边 + Verb1 + 一边 + Verb2",
    explanation: "# 一边...一边...\n\nThis pattern is used to describe doing two actions at the same time.\n\n## Structure:\n一边 (yìbiān) + Action 1 + 一边 (yìbiān) + Action 2",
    examples: [
      { cn: "他一边吃饭一边看电视", pinyin: "Tā yìbiān chīfàn yìbiān kàn diànshì", en: "He eats while watching TV" },
      { cn: "我一边走一边想", pinyin: "Wǒ yìbiān zǒu yìbiān xiǎng", en: "I think while walking" },
      { cn: "她一边唱歌一边跳舞", pinyin: "Tā yìbiān chànggē yìbiān tiàowǔ", en: "She sings while dancing" },
    ],
    common_errors: [
      "一边看书，看电视 ❌ (need both 一边)",
      "一边看书一边看电视 ✓ (correct pattern)",
    ],
    seo_title: "一边...一边... - Chinese Grammar for Simultaneous Actions",
    seo_description: "Learn the Chinese pattern 一边...一边... for describing doing two things at the same time.",
    geo_snippet: "Master the 一边...一边... pattern to describe simultaneous actions in Chinese. Learn with examples and avoid common errors.",
    status: "published",
    createdAt: "2025-01-02T10:00:00Z",
    updatedAt: "2025-01-06T09:00:00Z",
    publishedAt: "2025-01-06T09:00:00Z",
    author: "Editor User",
  },
];

// Mock Assets
export const mockAssets: Asset[] = [
  {
    id: "a1",
    name: "lesson-banner-1.jpg",
    type: "image",
    url: "/assets/lesson-banner-1.jpg",
    size: 245000,
    uploadedAt: "2025-01-10T10:00:00Z",
    uploadedBy: "Admin User",
  },
  {
    id: "a2",
    name: "greeting-audio.mp3",
    type: "audio",
    url: "/assets/greeting-audio.mp3",
    size: 1200000,
    uploadedAt: "2025-01-12T09:00:00Z",
    uploadedBy: "Editor User",
  },
  {
    id: "a3",
    name: "lesson-intro.mp4",
    type: "video",
    url: "/assets/lesson-intro.mp4",
    size: 15000000,
    uploadedAt: "2025-01-15T08:00:00Z",
    uploadedBy: "Admin User",
  },
  {
    id: "a4",
    name: "vocabulary-list.pdf",
    type: "document",
    url: "/assets/vocabulary-list.pdf",
    size: 89000,
    uploadedAt: "2025-01-08T12:00:00Z",
    uploadedBy: "Editor User",
  },
];

// Mock SEO Pages
export const mockSEOPages: SEOPage[] = [
  {
    id: "seo1",
    path: "/",
    title: "Learn Chinese Online - Best Language Learning Platform",
    description: "Master Mandarin Chinese with our comprehensive lessons, readings, and interactive exercises.",
    keywords: ["learn Chinese", "Mandarin lessons", "Chinese language"],
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "seo2",
    path: "/lessons",
    title: "Chinese Lessons - From Beginner to Advanced",
    description: "Structured Chinese lessons for all levels with audio, video, and interactive exercises.",
    keywords: ["Chinese lessons", "Mandarin courses", "HSK preparation"],
    updatedAt: "2025-01-12T09:00:00Z",
  },
  {
    id: "seo3",
    path: "/readings",
    title: "Chinese Reading Practice - Stories and Articles",
    description: "Improve your Chinese reading skills with graded texts and cultural stories.",
    keywords: ["Chinese reading", "Mandarin stories", "Chinese articles"],
    updatedAt: "2025-01-10T14:00:00Z",
  },
];

// Mock Team Members
export const mockTeamMembers: TeamMember[] = [
  {
    id: "tm1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    joinedAt: "2024-01-15T10:00:00Z",
    lastActive: "2025-01-25T09:30:00Z",
  },
  {
    id: "tm2",
    name: "Editor User",
    email: "editor@example.com",
    role: "editor",
    joinedAt: "2024-03-20T14:00:00Z",
    lastActive: "2025-01-24T16:45:00Z",
  },
  {
    id: "tm3",
    name: "Viewer User",
    email: "viewer@example.com",
    role: "viewer",
    joinedAt: "2024-06-10T09:00:00Z",
    lastActive: "2025-01-23T11:20:00Z",
  },
  {
    id: "tm4",
    name: "Sarah Chen",
    email: "sarah@example.com",
    role: "editor",
    joinedAt: "2024-08-05T10:00:00Z",
    lastActive: "2025-01-22T14:00:00Z",
  },
  {
    id: "tm5",
    name: "Mike Wang",
    email: "mike@example.com",
    role: "viewer",
    joinedAt: "2024-11-01T09:00:00Z",
    lastActive: "2025-01-20T10:30:00Z",
  },
];

// Mock Workflow Rules
export const mockWorkflowRules: WorkflowRule[] = [
  {
    id: "wf1",
    name: "Editor Review Required",
    description: "All content must be submitted for review before publishing",
    enabled: true,
    condition: "status === 'draft' && action === 'publish'",
    action: "Require admin approval",
  },
  {
    id: "wf2",
    name: "SEO Check",
    description: "Warn if SEO title or description is missing before publishing",
    enabled: true,
    condition: "!seo_title || !seo_description",
    action: "Show warning notification",
  },
  {
    id: "wf3",
    name: "Auto-archive Old Content",
    description: "Automatically archive content older than 1 year without updates",
    enabled: false,
    condition: "updatedAt < 1 year ago && status === 'published'",
    action: "Move to archived status",
  },
  {
    id: "wf4",
    name: "Notify on Publish",
    description: "Send notification to team when content is published",
    enabled: true,
    condition: "status changed to 'published'",
    action: "Send email notification",
  },
];

// Helper function to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Helper function to generate geo snippet
export function generateGeoSnippet(summary: string, keyTerms: string[]): string {
  const terms = keyTerms.slice(0, 5).join(", ");
  const base = summary.slice(0, 150);
  return `${base}${base.length >= 150 ? "..." : ""} Key terms: ${terms}`.slice(0, 200);
}
