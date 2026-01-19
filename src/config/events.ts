// 2026 FRC Season Event Schedule
export const SEASON_EVENTS = {
  LAKE_CITY: {
    code: '2026milac',
    name: 'Lake City District Event',
    startDate: '2026-03-13T09:00:00',
    endDate: '2026-03-15T17:00:00',
    location: '251 Russell Rd, Lake City, MI',
  },
  TRAVERSE_CITY: {
    code: '2026mitvc',
    name: 'Traverse City District Event',
    startDate: '2026-03-19T09:00:00',
    endDate: '2026-03-21T17:00:00',
    location: '5376 N Long Lake Rd, Traverse City, MI',
  },
  FIM_DISTRICT_CHAMPIONSHIP: {
    code: '2026micmp',
    name: 'FIM District Championship',
    startDate: '2026-04-15T09:00:00',
    endDate: '2026-04-17T17:00:00',
    location: '7400 Bay Road, Saginaw, MI',
    qualificationPending: true,
  },
  FIRST_CHAMPIONSHIP: {
    code: '2026cmptx',
    name: 'FIRST Championship',
    startDate: '2026-04-28T09:00:00',
    endDate: '2026-05-01T17:00:00',
    location: '1001 Avenida De Las Americas, Houston, TX',
    qualificationPending: true,
  },
} as const;
