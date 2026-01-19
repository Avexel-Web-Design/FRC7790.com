// 2026 FRC Season Event Schedule
export const SEASON_EVENTS = {
  LAKE_CITY: {
    code: '2026milac',
    name: 'Lake City District Event',
    startDate: '2026-03-13T09:00:00',
    endDate: '2026-03-15',
    location: '251 Russell Rd, Lake City, MI',
  },
  TRAVERSE_CITY: {
    code: '2026mitvc',
    name: 'Traverse City District Event',
    startDate: '2026-03-19T09:00:00',
    endDate: '2026-03-21',
    location: '1150 Milliken Drive, Traverse City, MI',
  },
  FIM_DISTRICT_CHAMPIONSHIP: {
    code: '2026micmp',
    name: 'FIM District Championship',
    startDate: '2026-04-15T09:00:00',
    endDate: '2026-04-17',
    location: '7400 Bay Road, Saginaw, MI',
    qualificationPending: true,
  },
  FIRST_CHAMPIONSHIP: {
    code: '2026cmptx',
    name: 'FIRST Championship',
    startDate: '2026-04-28T09:00:00',
    endDate: '2026-05-01',
    location: '1001 Avenida De Las Americas, Houston, TX',
    qualificationPending: true,
  },
} as const;
