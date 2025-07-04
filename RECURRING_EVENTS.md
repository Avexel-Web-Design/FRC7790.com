# Recurring Events Documentation

## Overview

The calendar system now supports sophisticated recurring events with extensive customization options. Users can create events that repeat on various schedules and manage exceptions.

## Features

### Recurrence Types

1. **Daily**
   - Repeat every N days
   - Example: Every day, every 3 days, etc.

2. **Weekly**
   - Repeat every N weeks
   - Select specific days of the week
   - Example: Every Monday and Wednesday, every 2 weeks on Friday

3. **Monthly**
   - **By Date**: Repeat on a specific day of the month (e.g., 15th of every month)
   - **By Position**: Repeat on a specific weekday position (e.g., 2nd Tuesday of every month, last Friday)

4. **Yearly**
   - Repeat annually
   - Select specific months
   - Example: Every January and June, every 2 years in March

### End Conditions

1. **Never**: Event continues indefinitely
2. **After N occurrences**: Event stops after a specific number of instances
3. **End date**: Event stops after a specific date

### Advanced Features

#### Exceptions
- Skip specific dates in a recurring series
- Useful for holidays or one-off cancellations
- Add/remove exceptions via API

#### Instance Management
- Edit individual instances vs. entire series
- Delete single instances or entire series
- Visual indicators for recurring events

## API Endpoints

### Create Recurring Event
```http
POST /api/calendar
Content-Type: application/json

{
  "title": "Team Meeting",
  "description": "Weekly team standup",
  "event_date": "2025-07-07",
  "event_time": "10:00",
  "event_end_time": "11:00",
  "location": "Conference Room A",
  "is_recurring": true,
  "recurrence": {
    "type": "weekly",
    "interval": 1,
    "daysOfWeek": ["monday", "wednesday"],
    "endType": "after_occurrences",
    "occurrences": 20
  }
}
```

### Get Events (with recurring expansion)
```http
GET /api/calendar?start=2025-07-01&end=2025-07-31
```

### Add Exception
```http
POST /api/calendar/:id/exception
Content-Type: application/json

{
  "exception_date": "2025-07-15"
}
```

### Remove Exception
```http
DELETE /api/calendar/:id/exception
Content-Type: application/json

{
  "exception_date": "2025-07-15"
}
```

## Database Schema

### New Columns Added to `calendar_events`

```sql
-- Recurring event flags
is_recurring INTEGER DEFAULT 0
parent_event_id INTEGER -- NULL for parent, ID for generated instances

-- Recurrence pattern
recurrence_type TEXT -- 'daily', 'weekly', 'monthly', 'yearly', 'custom'
recurrence_interval INTEGER DEFAULT 1 -- every X days/weeks/months/years

-- Weekly options
recurrence_days_of_week TEXT -- JSON array: ["monday", "tuesday", etc]

-- Monthly options
recurrence_day_of_month INTEGER -- specific day (1-31)
recurrence_week_of_month INTEGER -- 1st, 2nd, 3rd, 4th, -1 (last)
recurrence_day_of_week TEXT -- "monday", "tuesday", etc

-- Yearly options
recurrence_months TEXT -- JSON array: [1,2,3] for January, February, March

-- End conditions
recurrence_end_type TEXT -- 'never', 'after_occurrences', 'end_date'
recurrence_end_date TEXT -- YYYY-MM-DD format
recurrence_occurrences INTEGER -- number of occurrences

-- Exceptions and timing
recurrence_exceptions TEXT -- JSON array of dates to skip
recurrence_end_time TEXT -- HH:MM format for duration calculation
```

## Frontend Components

### RecurrenceForm Component
- Comprehensive UI for configuring recurring events
- Real-time preview of recurrence pattern
- Handles all recurrence types and options

### Calendar Component Updates
- Displays recurring events with visual indicators
- Supports editing individual instances vs. series
- Shows time ranges for events with end times

## Usage Examples

### Daily Meeting
```typescript
{
  type: 'daily',
  interval: 1,
  endType: 'after_occurrences',
  occurrences: 30
}
```

### Weekly Team Meeting (Mon/Wed/Fri)
```typescript
{
  type: 'weekly',
  interval: 1,
  daysOfWeek: ['monday', 'wednesday', 'friday'],
  endType: 'end_date',
  endDate: '2025-12-31'
}
```

### Monthly Board Meeting (First Tuesday)
```typescript
{
  type: 'monthly',
  interval: 1,
  weekOfMonth: 1,
  dayOfWeek: 'tuesday',
  endType: 'never'
}
```

### Quarterly Review (15th of Mar/Jun/Sep/Dec)
```typescript
{
  type: 'yearly',
  interval: 1,
  months: [3, 6, 9, 12],
  dayOfMonth: 15,
  endType: 'never'
}
```

### Holiday Exceptions
```typescript
{
  // ... other recurrence config
  exceptions: ['2025-07-04', '2025-12-25', '2026-01-01']
}
```

## Visual Indicators

- **Recurring Icon**: ↻ symbol for recurring events
- **Color Coding**: Blue for recurring events, orange for regular events
- **Instance Badge**: "Instance" badge for recurring event instances
- **Time Display**: Shows start and end times when available

## Performance Considerations

- Recurring events are generated on-demand when fetching calendar data
- Date range queries limit the number of instances generated
- Maximum 1000 occurrences safety limit prevents infinite loops
- Indexed database columns for efficient querying

## Future Enhancements

1. **Custom Recurrence Patterns**: More complex patterns like "every other Tuesday"
2. **Bulk Exception Management**: UI for managing multiple exceptions
3. **Recurrence Templates**: Save and reuse common recurrence patterns
4. **Conflict Detection**: Warn about overlapping events
5. **Timezone Support**: Handle recurring events across time zones
6. **iCal Export**: Export recurring events in standard format
