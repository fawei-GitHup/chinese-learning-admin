/**
 * Structured Data Templates for SEO
 * 结构化数据模板定义
 */

import type { ContentItemType } from './content-types';

// 扩展的内容类型，包含工单中定义的所有类型
export type ExtendedContentType = ContentItemType | 'lesson' | 'reading';

export interface StructuredDataTemplate {
  id: string;
  name: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  contentTypes: ExtendedContentType[];
  schema: object;
  requiredFields: string[];
}

/**
 * 结构化数据模板库
 */
export const structuredDataTemplates: StructuredDataTemplate[] = [
  // DefinedTermSet - 词汇/术语定义
  {
    id: 'defined-term-set',
    name: {
      zh: 'DefinedTermSet Schema',
      en: 'DefinedTermSet Schema',
    },
    description: {
      zh: '适用于词汇和术语定义类内容，如词典条目、医学术语等',
      en: 'Suitable for vocabulary and terminology content, such as dictionary entries and medical terms',
    },
    contentTypes: ['lexicon', 'medical_lexicon'],
    schema: {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      "name": "",
      "description": "",
      "inLanguage": "zh-CN",
      "hasDefinedTerm": [
        {
          "@type": "DefinedTerm",
          "name": "",
          "description": "",
          "inDefinedTermSet": ""
        }
      ]
    },
    requiredFields: ['name', 'description', 'hasDefinedTerm'],
  },

  // Article - 阅读类内容
  {
    id: 'article',
    name: {
      zh: 'Article Schema',
      en: 'Article Schema',
    },
    description: {
      zh: '适用于阅读文章、博客帖子、新闻报道等内容',
      en: 'Suitable for reading articles, blog posts, and news content',
    },
    contentTypes: ['reading'],
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "",
      "author": {
        "@type": "Person",
        "name": ""
      },
      "datePublished": "",
      "dateModified": "",
      "description": "",
      "inLanguage": "zh-CN",
      "publisher": {
        "@type": "Organization",
        "name": "",
        "logo": {
          "@type": "ImageObject",
          "url": ""
        }
      }
    },
    requiredFields: ['headline', 'author', 'datePublished', 'description'],
  },

  // Course - 课程类内容
  {
    id: 'course',
    name: {
      zh: 'Course Schema',
      en: 'Course Schema',
    },
    description: {
      zh: '适用于课程、学习模块、语法教程等教育内容',
      en: 'Suitable for courses, learning modules, and grammar tutorials',
    },
    contentTypes: ['lesson', 'grammar'],
    schema: {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "",
      "description": "",
      "provider": {
        "@type": "Organization",
        "name": "",
        "sameAs": ""
      },
      "inLanguage": "zh-CN",
      "teaches": "",
      "educationalLevel": "",
      "coursePrerequisites": ""
    },
    requiredFields: ['name', 'description', 'provider'],
  },

  // LearningResource - 学习资源
  {
    id: 'learning-resource',
    name: {
      zh: 'LearningResource Schema',
      en: 'LearningResource Schema',
    },
    description: {
      zh: '适用于教学资源、学习材料、练习等内容',
      en: 'Suitable for teaching resources, learning materials, and exercises',
    },
    contentTypes: ['lesson', 'grammar'],
    schema: {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "name": "",
      "description": "",
      "learningResourceType": "lesson",
      "educationalLevel": "",
      "inLanguage": "zh-CN",
      "teaches": "",
      "assesses": "",
      "competencyRequired": ""
    },
    requiredFields: ['name', 'description', 'learningResourceType'],
  },

  // FAQPage - 常见问题页面
  {
    id: 'faq-page',
    name: {
      zh: 'FAQPage Schema',
      en: 'FAQPage Schema',
    },
    description: {
      zh: '适用于情景对话、问答内容、常见问题等',
      en: 'Suitable for scenario dialogues, Q&A content, and FAQ pages',
    },
    contentTypes: ['scenarios', 'medical_scenario', 'medical_dialog'],
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": ""
          }
        }
      ]
    },
    requiredFields: ['mainEntity'],
  },

  // HowTo - 操作指南
  {
    id: 'how-to',
    name: {
      zh: 'HowTo Schema',
      en: 'HowTo Schema',
    },
    description: {
      zh: '适用于步骤指南、医学流程、语法使用说明等',
      en: 'Suitable for step-by-step guides, medical procedures, and grammar usage instructions',
    },
    contentTypes: ['medical_scenario', 'medical_dialog', 'grammar'],
    schema: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "",
      "description": "",
      "step": [
        {
          "@type": "HowToStep",
          "name": "",
          "text": "",
          "position": 1
        }
      ],
      "totalTime": "",
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "currency": "CNY",
        "value": ""
      }
    },
    requiredFields: ['name', 'description', 'step'],
  },

  // MedicalWebPage - 医学网页（医学内容专用）
  {
    id: 'medical-web-page',
    name: {
      zh: 'MedicalWebPage Schema',
      en: 'MedicalWebPage Schema',
    },
    description: {
      zh: '适用于医学相关内容，标注医学信息的专业性',
      en: 'Suitable for medical content, marking the professionalism of medical information',
    },
    contentTypes: ['medical_lexicon', 'medical_scenario', 'medical_dialog'],
    schema: {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      "name": "",
      "description": "",
      "specialty": {
        "@type": "MedicalSpecialty",
        "name": ""
      },
      "audience": {
        "@type": "MedicalAudience",
        "audienceType": "Patient"
      },
      "medicalAudience": "Patient",
      "lastReviewed": "",
      "reviewedBy": {
        "@type": "Person",
        "name": ""
      }
    },
    requiredFields: ['name', 'description', 'specialty'],
  },

  // NewsArticle - 新闻文章
  {
    id: 'news-article',
    name: {
      zh: 'NewsArticle Schema',
      en: 'NewsArticle Schema',
    },
    description: {
      zh: '适用于新闻报道、时事阅读等内容',
      en: 'Suitable for news reports and current events reading',
    },
    contentTypes: ['reading'],
    schema: {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "",
      "author": {
        "@type": "Person",
        "name": ""
      },
      "datePublished": "",
      "dateModified": "",
      "description": "",
      "inLanguage": "zh-CN",
      "articleBody": "",
      "publisher": {
        "@type": "Organization",
        "name": "",
        "logo": {
          "@type": "ImageObject",
          "url": ""
        }
      }
    },
    requiredFields: ['headline', 'author', 'datePublished', 'publisher'],
  },
];

/**
 * 根据内容类型获取适用的模板列表
 * @param type 内容类型
 * @returns 适用的模板数组
 */
export function getTemplatesForContentType(type: ExtendedContentType): StructuredDataTemplate[] {
  return structuredDataTemplates.filter(template => 
    template.contentTypes.includes(type)
  );
}

/**
 * 根据模板 ID 获取模板
 * @param id 模板 ID
 * @returns 模板对象或 undefined
 */
export function getTemplateById(id: string): StructuredDataTemplate | undefined {
  return structuredDataTemplates.find(template => template.id === id);
}

/**
 * 将模板与数据合并，生成填充后的 JSON-LD
 * @param template 模板对象
 * @param data 要填充的数据
 * @returns 填充后的 JSON-LD 对象
 */
export function applyTemplateWithData(
  template: StructuredDataTemplate, 
  data: Record<string, unknown>
): object {
  const filledSchema = JSON.parse(JSON.stringify(template.schema));
  
  // 递归填充数据
  function fillData(obj: Record<string, unknown>, dataObj: Record<string, unknown>): void {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // 如果 data 中有对应的值，则填充
        if (dataObj && key in dataObj && dataObj[key] !== undefined && dataObj[key] !== null) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // 如果是对象，递归填充
            if (typeof dataObj[key] === 'object' && dataObj[key] !== null) {
              fillData(value as Record<string, unknown>, dataObj[key] as Record<string, unknown>);
            } else {
              // 直接覆盖
              obj[key] = dataObj[key];
            }
          } else if (Array.isArray(value) && Array.isArray(dataObj[key])) {
            // 如果是数组，用 data 中的数组替换
            obj[key] = dataObj[key];
          } else {
            obj[key] = dataObj[key];
          }
        }
      }
    }
  }
  
  fillData(filledSchema as Record<string, unknown>, data);
  return filledSchema;
}

/**
 * 格式化 JSON-LD 为字符串
 * @param schema JSON-LD 对象
 * @returns 格式化的 JSON 字符串
 */
export function formatJsonLd(schema: object): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * 验证 JSON-LD 模板的必填字段是否已填写
 * @param template 模板对象
 * @param data 填充的数据
 * @returns 验证结果
 */
export function validateTemplateData(
  template: StructuredDataTemplate,
  data: Record<string, unknown>
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of template.requiredFields) {
    // 检查顶层字段
    if (!(field in data) || data[field] === '' || data[field] === null || data[field] === undefined) {
      missingFields.push(field);
    } else if (Array.isArray(data[field]) && (data[field] as unknown[]).length === 0) {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * 生成 script 标签形式的 JSON-LD
 * @param schema JSON-LD 对象
 * @returns HTML script 标签字符串
 */
export function generateScriptTag(schema: object): string {
  return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

/**
 * 内容类型到扩展类型的映射
 */
export const contentTypeMapping: Record<string, ExtendedContentType> = {
  'lessons': 'lesson',
  'lesson': 'lesson',
  'readings': 'reading',
  'reading': 'reading',
  'grammar': 'grammar',
  'lexicon': 'lexicon',
  'medical-lexicon': 'medical_lexicon',
  'medical_lexicon': 'medical_lexicon',
  'medical-scenario': 'medical_scenario',
  'medical_scenario': 'medical_scenario',
  'medical-dialogs': 'medical_dialog',
  'medical_dialog': 'medical_dialog',
  'scenarios': 'scenarios',
};

/**
 * 获取标准化的内容类型
 * @param type 原始类型字符串
 * @returns 标准化的内容类型
 */
export function normalizeContentType(type: string): ExtendedContentType {
  return contentTypeMapping[type] || (type as ExtendedContentType);
}
