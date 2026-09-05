import { authApi } from './auth';
import { journalsApi } from './journals';
import { tagsApi } from './tags';
import { achievementsApi } from './achievements';
import { searchApi } from './search';
import { teamsApi } from './teams';
import { dashboardApi } from './dashboard';
import { aiApi } from './ai';
import { kpiPeriodsApi } from './kpiPeriods';

export const api = {
  ...authApi,
  ...journalsApi,
  ...tagsApi,
  ...achievementsApi,
  ...searchApi,
  ...teamsApi,
  ...dashboardApi,
  ...aiApi,
  ...kpiPeriodsApi,
};
