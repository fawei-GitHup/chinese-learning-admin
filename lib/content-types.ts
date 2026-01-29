export const CONTENT_TYPES = ['grammar', 'lessons', 'lexicon', 'medical-dialogs', 'medical-lexicon', 'medical-scenario', 'readings', 'scenarios'] as const;

export const VALID_CONTENT_TYPES = CONTENT_TYPES;

export type ContentType = typeof CONTENT_TYPES[number];

// Content type discriminator for content_items table
export type ContentItemType = 'lexicon' | 'grammar' | 'scenarios' | 'medical_lexicon' | 'medical_scenario' | 'medical_dialog';

import { z } from 'zod';

export const contentTypeSchema = z.enum(CONTENT_TYPES);

export const contentItemTypeSchema = z.enum(['lexicon', 'grammar', 'scenarios', 'medical_lexicon', 'medical_scenario', 'medical_dialog']);