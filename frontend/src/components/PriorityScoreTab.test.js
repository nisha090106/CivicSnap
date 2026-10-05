import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AUTHORITY_DEPARTMENTS } from '../constants/authorityDepartments.js';
import PriorityScoreTab from './PriorityScoreTab.js';
import { selectAuthorityReports } from '../pages/authorityReportView.js';

test('Priority Score tab renders for every authority department', () => {
  assert.equal(AUTHORITY_DEPARTMENTS.length, 7);

  for (const department of AUTHORITY_DEPARTMENTS) {
    const markup = renderToStaticMarkup(
      React.createElement(PriorityScoreTab, {
        active: false,
        onClick: () => {},
        department
      })
    );

    assert.match(markup, /Priority Score/, `${department} dashboard has the tab`);

    const departmentReports = [
      { department, id: 'low', priority_score: 0.3, priority_class: 'low' },
      { department, id: 'high', priority_score: 0.8, priority_class: 'highest' }
    ];
    const sorted = selectAuthorityReports(
      departmentReports,
      'priority-score',
      'all',
      'priority',
      department
    );
    assert.deepEqual(sorted.map((report) => report.id), ['high', 'low']);

    const filtered = selectAuthorityReports(
      departmentReports,
      'priority-score',
      'highest',
      'priority',
      department
    );
    assert.deepEqual(filtered.map((report) => report.id), ['high']);
  }
});
