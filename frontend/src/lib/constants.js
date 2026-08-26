export const CATEGORIES = {
  general: 'General',
  development: 'Development',
  maintenance: 'Maintenance',
  request: 'Request',
  meeting: 'Meeting',
  business_trip: 'Business Trip',
  other: 'Other',
};

export const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'development', label: 'Development' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'request', label: 'Request' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'business_trip', label: 'Business Trip' },
  { value: 'other', label: 'Other' },
];

export const CATEGORY_OPTIONS_NO_ALL = CATEGORY_OPTIONS.filter(o => o.value !== '');

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private — Only you' },
  { value: 'team', label: 'Team — Your team members' },
  { value: 'manager_only', label: 'Manager Only' },
  { value: 'public', label: 'Public — Everyone' },
];

export const IMPORTANCE_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];
