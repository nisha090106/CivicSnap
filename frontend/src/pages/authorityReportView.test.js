import test from 'node:test';
import assert from 'node:assert/strict';

import { selectAuthorityReports } from './authorityReportView.js';
import {
  CATEGORY_FALLBACK_LABEL,
  isCategoryFallbackSeverity,
  isRealAiSeverity
} from '../utils/severityPresentation.js';

test('category fallback is clearly labeled and never treated as AI urgency', () => {
  assert.equal(
    CATEGORY_FALLBACK_LABEL,
    'Estimated from category (AI analysis unavailable)'
  );
  assert.equal(isCategoryFallbackSeverity('category_fallback', 0), true);
  assert.equal(isRealAiSeverity('category_fallback', 0), false);

  const reports = [
    {
      id: 'fallback',
      severity_level: 'High',
      ai_severity_source: 'category_fallback',
      ai_severity_confidence: 0,
      urgency_flagged: false
    },
    {
      id: 'ai-high',
      severity_level: 'High',
      ai_severity_source: 'ai',
      ai_severity_confidence: 0.86,
      urgency_flagged: true
    }
  ];

  assert.deepEqual(
    selectAuthorityReports(reports, 'ai-urgency', 'all', 'recent', 'Municipal Corporation')
      .map((report) => report.id),
    ['ai-high']
  );
});

test('legacy nonzero-confidence AI severity remains eligible for AI urgency', () => {
  assert.equal(isRealAiSeverity(null, 0.75), true);
  assert.equal(isCategoryFallbackSeverity(null, 0), true);
});
