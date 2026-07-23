import client from './client';

export const fetchDashboardStats = async () => {
  const res = await client.get('/dashboard');
  return res.data;
};

export const fetchActivity = async () => {
  const res = await client.get('/activity');
  return res.data;
};

export const backfillActivity = async () => {
  const res = await client.post('/activity/backfill');
  return res.data;
};

export const fetchDashboardOverview = async () => {
  const res = await client.get('/analytics/overview');
  return res.data;
};
