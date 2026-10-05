import { isRealAiSeverity } from '../utils/severityPresentation.js';

export function selectAuthorityReports(
  reports,
  activeTab,
  priorityClassFilter,
  reportSort,
  activeDepartment
) {
  return reports.filter((report) => {
    if (activeTab === 'assigned') {
      const reportDepartment = (report.department || '').toLowerCase();
      const selectedDepartment = (activeDepartment || '').toLowerCase();
      return reportDepartment.includes(selectedDepartment)
        || selectedDepartment.includes(reportDepartment);
    }
    if (activeTab === 'ai-urgency') {
      const severity = (report.severity_level || '').toLowerCase();
      return isRealAiSeverity(
        report.ai_severity_source,
        report.ai_severity_confidence
      ) && (
        report.urgency_flagged === true
        || severity === 'high'
        || severity === 'critical'
      );
    }
    if (activeTab === 'priority-score') {
      return priorityClassFilter === 'all'
        || report.priority_class === priorityClassFilter;
    }
    return true;
  }).sort((reportA, reportB) => {
    if (reportSort === 'priority') {
      return (reportB.priority_score ?? -1) - (reportA.priority_score ?? -1);
    }
    if (reportSort === 'status') {
      const statusOrder = { pending: 0, 'in progress': 1, resolved: 2 };
      return (statusOrder[(reportA.status || '').toLowerCase()] ?? 3)
        - (statusOrder[(reportB.status || '').toLowerCase()] ?? 3);
    }
    return new Date(reportB.created_at || 0) - new Date(reportA.created_at || 0);
  });
}
