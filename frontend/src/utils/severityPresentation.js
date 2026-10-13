export const CATEGORY_FALLBACK_LABEL =
  'Estimated from issue category';

export function isCategoryFallbackSeverity(source, confidence) {
  return source === 'category_fallback'
    || (source == null && confidence === 0);
}

export function isRealAiSeverity(source, confidence) {
  if (source === 'category_fallback') return false;
  return source === 'ai' || (source == null && confidence > 0);
}
