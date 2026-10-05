export const CATEGORY_FALLBACK_LABEL =
  'Estimated from category (AI analysis unavailable)';

export function isCategoryFallbackSeverity(source, confidence) {
  return source === 'category_fallback'
    || (source == null && confidence === 0);
}

export function isRealAiSeverity(source, confidence) {
  if (source === 'category_fallback') return false;
  return source === 'ai' || (source == null && confidence > 0);
}
