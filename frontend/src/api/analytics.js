import client from './client';

export const fetchTrends = async () => {
  return client.get('/analytics/trends');
};

export const fetchKeywords = async () => {
  return client.get('/analytics/keywords');
};

export const fetchRecurringIssues = async () => {
  return client.get('/analytics/recurring-issues');
};
