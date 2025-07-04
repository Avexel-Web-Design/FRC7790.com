// Utility functions for handling recurring events

export interface RecurrenceConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // every X days/weeks/months/years
  daysOfWeek?: string[]; // for weekly: ["monday", "tuesday", etc]
  dayOfMonth?: number; // for monthly: specific day (1-31)
  weekOfMonth?: number; // for monthly: 1st, 2nd, 3rd, 4th, -1 (last)
  dayOfWeek?: string; // for monthly by weekday: "monday", "tuesday", etc
  months?: number[]; // for yearly: [1,2,3] (January, February, March)
  endType: 'never' | 'after_occurrences' | 'end_date';
  endDate?: string; // YYYY-MM-DD format
  occurrences?: number; // number of occurrences
  exceptions?: string[]; // dates to skip: ["2025-07-15", "2025-07-22"]
}

export interface CalendarEventWithRecurrence {
  id?: number;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  event_end_time?: string;
  location?: string;
  created_by?: number;
  is_recurring: boolean;
  recurrence?: RecurrenceConfig;
  parent_event_id?: number;
}

// Days of the week mapping
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Generate all occurrences of a recurring event within a date range
 */
export function generateRecurringEvents(
  baseEvent: CalendarEventWithRecurrence,
  startDate: Date,
  endDate: Date
): CalendarEventWithRecurrence[] {
  if (!baseEvent.is_recurring || !baseEvent.recurrence) {
    return [baseEvent];
  }

  const events: CalendarEventWithRecurrence[] = [];
  const config = baseEvent.recurrence;
  const eventStartDate = new Date(baseEvent.event_date);
  let currentDate = new Date(Math.max(eventStartDate.getTime(), startDate.getTime()));
  let occurrenceCount = 0;
  const maxOccurrences = config.occurrences || 1000; // Safety limit

  // Adjust start date to the first valid occurrence
  if (currentDate < eventStartDate) {
    currentDate = new Date(eventStartDate);
  }

  while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
    // Check if we've reached the end condition
    if (config.endType === 'end_date' && config.endDate) {
      const endDateObj = new Date(config.endDate);
      if (currentDate > endDateObj) break;
    }
    
    if (config.endType === 'after_occurrences' && occurrenceCount >= maxOccurrences) {
      break;
    }

    // Check if this date should be skipped
    const dateStr = currentDate.toISOString().split('T')[0];
    if (config.exceptions?.includes(dateStr)) {
      currentDate = getNextOccurrence(currentDate, config);
      continue;
    }

    // Check if this occurrence matches the recurrence pattern
    if (isValidOccurrence(currentDate, eventStartDate, config)) {
      events.push({
        ...baseEvent,
        id: undefined, // Will be set by database
        event_date: dateStr,
        parent_event_id: baseEvent.id
      });
      occurrenceCount++;
    }

    currentDate = getNextOccurrence(currentDate, config);
  }

  return events;
}

/**
 * Check if a date is a valid occurrence based on recurrence rules
 */
function isValidOccurrence(date: Date, startDate: Date, config: RecurrenceConfig): boolean {
  const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  switch (config.type) {
    case 'daily':
      return daysDiff >= 0 && daysDiff % config.interval === 0;

    case 'weekly':
      if (daysDiff < 0) return false;
      const weeksDiff = Math.floor(daysDiff / 7);
      if (weeksDiff % config.interval !== 0) return false;
      
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const dayName = DAY_NAMES[date.getDay()];
        return config.daysOfWeek.includes(dayName);
      }
      return date.getDay() === startDate.getDay();

    case 'monthly':
      if (daysDiff < 0) return false;
      
      if (config.dayOfMonth) {
        // Specific day of month (e.g., 15th of every month)
        const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + 
                          (date.getMonth() - startDate.getMonth());
        if (monthsDiff % config.interval !== 0) return false;
        return date.getDate() === config.dayOfMonth;
      } else if (config.weekOfMonth && config.dayOfWeek) {
        // Specific weekday of month (e.g., 2nd Tuesday of every month)
        const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + 
                          (date.getMonth() - startDate.getMonth());
        if (monthsDiff % config.interval !== 0) return false;
        
        const dayName = DAY_NAMES[date.getDay()];
        if (dayName !== config.dayOfWeek) return false;
        
        const weekOfMonth = getWeekOfMonth(date);
        return weekOfMonth === config.weekOfMonth;
      }
      return false;

    case 'yearly':
      if (daysDiff < 0) return false;
      const yearsDiff = date.getFullYear() - startDate.getFullYear();
      if (yearsDiff % config.interval !== 0) return false;
      
      if (config.months && config.months.length > 0) {
        return config.months.includes(date.getMonth() + 1) && 
               date.getDate() === startDate.getDate();
      }
      return date.getMonth() === startDate.getMonth() && 
             date.getDate() === startDate.getDate();

    default:
      return false;
  }
}

/**
 * Get the next potential occurrence date
 */
function getNextOccurrence(currentDate: Date, config: RecurrenceConfig): Date {
  const nextDate = new Date(currentDate);

  switch (config.type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + config.interval);
      break;

    case 'weekly':
      if (config.daysOfWeek && config.daysOfWeek.length > 1) {
        // Find next day in the week
        let found = false;
        for (let i = 1; i <= 7; i++) {
          const testDate = new Date(currentDate);
          testDate.setDate(testDate.getDate() + i);
          const dayName = DAY_NAMES[testDate.getDay()];
          if (config.daysOfWeek.includes(dayName)) {
            nextDate.setTime(testDate.getTime());
            found = true;
            break;
          }
        }
        if (!found) {
          nextDate.setDate(nextDate.getDate() + 7 * config.interval);
        }
      } else {
        nextDate.setDate(nextDate.getDate() + 7 * config.interval);
      }
      break;

    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + config.interval);
      break;

    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + config.interval);
      break;

    default:
      nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
}

/**
 * Get the week of the month for a given date (1-4, or -1 for last week)
 */
function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekday = firstDay.getDay();
  const offsetDate = date.getDate() + firstWeekday - 1;
  const weekOfMonth = Math.floor(offsetDate / 7) + 1;
  
  // Check if it's the last week of the month
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const daysFromEnd = lastDay.getDate() - date.getDate();
  if (daysFromEnd < 7) {
    return -1; // Last week
  }
  
  return weekOfMonth;
}

/**
 * Parse recurrence config from database fields
 */
export function parseRecurrenceFromDB(event: any): RecurrenceConfig | null {
  if (!event.is_recurring) return null;

  return {
    type: event.recurrence_type,
    interval: event.recurrence_interval || 1,
    daysOfWeek: event.recurrence_days_of_week ? JSON.parse(event.recurrence_days_of_week) : undefined,
    dayOfMonth: event.recurrence_day_of_month || undefined,
    weekOfMonth: event.recurrence_week_of_month || undefined,
    dayOfWeek: event.recurrence_day_of_week || undefined,
    months: event.recurrence_months ? JSON.parse(event.recurrence_months) : undefined,
    endType: event.recurrence_end_type || 'never',
    endDate: event.recurrence_end_date || undefined,
    occurrences: event.recurrence_occurrences || undefined,
    exceptions: event.recurrence_exceptions ? JSON.parse(event.recurrence_exceptions) : []
  };
}

/**
 * Convert recurrence config to database fields
 */
export function recurrenceToDBFields(config: RecurrenceConfig) {
  return {
    recurrence_type: config.type,
    recurrence_interval: config.interval,
    recurrence_days_of_week: config.daysOfWeek ? JSON.stringify(config.daysOfWeek) : null,
    recurrence_day_of_month: config.dayOfMonth || null,
    recurrence_week_of_month: config.weekOfMonth || null,
    recurrence_day_of_week: config.dayOfWeek || null,
    recurrence_months: config.months ? JSON.stringify(config.months) : null,
    recurrence_end_type: config.endType,
    recurrence_end_date: config.endDate || null,
    recurrence_occurrences: config.occurrences || null,
    recurrence_exceptions: config.exceptions ? JSON.stringify(config.exceptions) : null
  };
}

/**
 * Format recurrence description for display
 */
export function formatRecurrenceDescription(config: RecurrenceConfig): string {
  const { type, interval, daysOfWeek, endType, endDate, occurrences } = config;

  let description = '';

  // Base pattern
  switch (type) {
    case 'daily':
      description = interval === 1 ? 'Daily' : `Every ${interval} days`;
      break;
    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        const dayList = daysOfWeek.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
        description = interval === 1 ? 
          `Weekly on ${dayList}` : 
          `Every ${interval} weeks on ${dayList}`;
      } else {
        description = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      }
      break;
    case 'monthly':
      description = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      break;
    case 'yearly':
      description = interval === 1 ? 'Annually' : `Every ${interval} years`;
      break;
  }

  // End condition
  switch (endType) {
    case 'after_occurrences':
      description += `, ${occurrences} times`;
      break;
    case 'end_date':
      if (endDate) {
        const date = new Date(endDate);
        description += `, until ${date.toLocaleDateString()}`;
      }
      break;
  }

  return description;
}
