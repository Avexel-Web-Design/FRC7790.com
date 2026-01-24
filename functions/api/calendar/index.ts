import { Hono } from 'hono';
import { Effect } from 'effect';
import { authMiddleware } from '../auth/middleware';
import {
  effectHandler,
  authEffectHandler,
  parseBody,
  type Env,
  type ApiError,
  query,
  queryOne,
  execute,
  ValidationError,
  NotFoundError
} from '../lib/effect-hono';

interface AuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface RecurrenceConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  dayOfWeek?: string;
  months?: number[];
  endType: 'never' | 'after_occurrences' | 'end_date';
  endDate?: string;
  occurrences?: number;
  exceptions?: string[];
}

interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_end_time: string | null;
  location: string | null;
  created_by: number;
  is_recurring: number;
  recurrence_type: string | null;
  recurrence_interval: number | null;
  recurrence_days_of_week: string | null;
  recurrence_day_of_month: number | null;
  recurrence_week_of_month: number | null;
  recurrence_day_of_week: string | null;
  recurrence_months: string | null;
  recurrence_end_type: string | null;
  recurrence_end_date: string | null;
  recurrence_occurrences: number | null;
  recurrence_exceptions: string | null;
  parent_event_id: number | null;
}

interface CreateEventBody {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  event_end_time?: string;
  location?: string;
  is_recurring?: boolean;
  recurrence?: RecurrenceConfig;
}

interface UpdateEventBody extends CreateEventBody {
  update_series?: boolean;
  original_instance_date?: string;
}

interface DeleteEventBody {
  delete_series?: boolean;
  exception_date?: string;
}

interface ExceptionBody {
  exception_date: string;
}

const calendar = new Hono<{ 
  Bindings: Env;
  Variables: { user: AuthUser };
}>();

calendar.use('*', authMiddleware);

// Utility function to generate recurring event instances
function generateRecurringInstances(baseEvent: CalendarEvent, startDate: Date, endDate: Date): any[] {
  if (!baseEvent.is_recurring) {
    return [baseEvent];
  }

  const instances = [];
  // Fix timezone issue by parsing date as local date instead of UTC
  const eventStartDate = new Date(baseEvent.event_date + 'T00:00:00');
  let currentDate = new Date(Math.max(eventStartDate.getTime(), startDate.getTime()));
  let occurrenceCount = 0;
  const maxOccurrences = baseEvent.recurrence_occurrences || 1000;

  const config = {
    type: baseEvent.recurrence_type,
    interval: baseEvent.recurrence_interval || 1,
    daysOfWeek: baseEvent.recurrence_days_of_week ? JSON.parse(baseEvent.recurrence_days_of_week) : undefined,
    dayOfMonth: baseEvent.recurrence_day_of_month,
    weekOfMonth: baseEvent.recurrence_week_of_month,
    dayOfWeek: baseEvent.recurrence_day_of_week,
    months: baseEvent.recurrence_months ? JSON.parse(baseEvent.recurrence_months) : undefined,
    endType: baseEvent.recurrence_end_type || 'never',
    endDate: baseEvent.recurrence_end_date,
    occurrences: baseEvent.recurrence_occurrences,
    exceptions: baseEvent.recurrence_exceptions ? JSON.parse(baseEvent.recurrence_exceptions) : []
  };

  while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
    if (config.endType === 'end_date' && config.endDate) {
      const endDateObj = new Date(config.endDate + 'T00:00:00');
      if (currentDate > endDateObj) break;
    }
    
    if (config.endType === 'after_occurrences' && occurrenceCount >= maxOccurrences) {
      break;
    }

    const dateStr = currentDate.getFullYear() + '-' + 
                    String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(currentDate.getDate()).padStart(2, '0');
    if (config.exceptions?.includes(dateStr)) {
      currentDate = getNextOccurrence(currentDate, config);
      continue;
    }

    if (isValidOccurrence(currentDate, eventStartDate, config)) {
      instances.push({
        ...baseEvent,
        id: `${baseEvent.id}_${dateStr}`, // Unique ID for recurring instance
        event_date: dateStr,
        parent_event_id: baseEvent.id,
        is_recurring_instance: true,
        is_recurring: false // Instances themselves are not recurring
      });
      occurrenceCount++;
    }

    currentDate = getNextOccurrence(currentDate, config);
  }

  return instances;
}

function isValidOccurrence(date: Date, startDate: Date, config: any): boolean {
  const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
        const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + 
                          (date.getMonth() - startDate.getMonth());
        if (monthsDiff % config.interval !== 0) return false;
        return date.getDate() === config.dayOfMonth;
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

function getNextOccurrence(currentDate: Date, config: any): Date {
  const nextDate = new Date(currentDate);
  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  switch (config.type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + config.interval);
      break;

    case 'weekly':
      if (config.daysOfWeek && config.daysOfWeek.length > 1) {
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

function buildRecurrenceFields(is_recurring: boolean | undefined, recurrence: RecurrenceConfig | undefined) {
  if (is_recurring && recurrence) {
    return {
      is_recurring: 1,
      recurrence_type: recurrence.type,
      recurrence_interval: recurrence.interval || 1,
      recurrence_days_of_week: recurrence.daysOfWeek ? JSON.stringify(recurrence.daysOfWeek) : null,
      recurrence_day_of_month: recurrence.dayOfMonth || null,
      recurrence_week_of_month: recurrence.weekOfMonth || null,
      recurrence_day_of_week: recurrence.dayOfWeek || null,
      recurrence_months: recurrence.months ? JSON.stringify(recurrence.months) : null,
      recurrence_end_type: recurrence.endType || 'never',
      recurrence_end_date: recurrence.endDate || null,
      recurrence_occurrences: recurrence.occurrences || null,
      recurrence_exceptions: recurrence.exceptions ? JSON.stringify(recurrence.exceptions) : null
    };
  }
  return {
    is_recurring: 0,
    recurrence_type: null,
    recurrence_interval: null,
    recurrence_days_of_week: null,
    recurrence_day_of_month: null,
    recurrence_week_of_month: null,
    recurrence_day_of_week: null,
    recurrence_months: null,
    recurrence_end_type: null,
    recurrence_end_date: null,
    recurrence_occurrences: null,
    recurrence_exceptions: null
  };
}

// Get all calendar events
calendar.get('/', effectHandler((c) =>
  Effect.gen(function* () {
    const startDate = c.req.query('start');
    const endDate = c.req.query('end');
    
    let results: CalendarEvent[];
    
    if (startDate && endDate) {
      results = yield* query<CalendarEvent>(`
        SELECT * FROM calendar_events 
        WHERE (parent_event_id IS NULL OR parent_event_id = 0)
        AND (
          (is_recurring = 0 AND event_date BETWEEN ? AND ?) OR
          (is_recurring = 1 AND (
            recurrence_end_date IS NULL OR 
            recurrence_end_date >= ? OR
            event_date <= ?
          ))
        )
        ORDER BY event_date ASC, event_time ASC
      `, startDate, endDate, startDate, endDate);
    } else {
      results = yield* query<CalendarEvent>(`
        SELECT * FROM calendar_events 
        WHERE (parent_event_id IS NULL OR parent_event_id = 0)
        ORDER BY event_date ASC, event_time ASC
      `);
    }
    
    // Also get standalone instances (modified recurring instances) in the date range
    let standaloneInstances: CalendarEvent[] = [];
    if (startDate && endDate) {
      standaloneInstances = yield* query<CalendarEvent>(`
        SELECT * FROM calendar_events 
        WHERE parent_event_id IS NOT NULL AND parent_event_id != 0 
        AND event_date BETWEEN ? AND ?
        ORDER BY event_date ASC, event_time ASC
      `, startDate, endDate);
    }
    
    // Generate recurring event instances if date range is provided
    if (startDate && endDate) {
      const expandedEvents: any[] = [];
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      
      for (const event of results) {
        if (event.is_recurring) {
          const instances = generateRecurringInstances(event, start, end);
          expandedEvents.push(...instances);
        } else {
          expandedEvents.push(event);
        }
      }
      
      // Add standalone instances (these are modified recurring instances)
      expandedEvents.push(...standaloneInstances);
      
      return expandedEvents.sort((a: any, b: any) => {
        const dateA = new Date(a.event_date + ' ' + (a.event_time || '00:00'));
        const dateB = new Date(b.event_date + ' ' + (b.event_time || '00:00'));
        return dateA.getTime() - dateB.getTime();
      });
    }
    
    return results;
  })
));

// Create a calendar event
calendar.post('/', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    const body = yield* parseBody<CreateEventBody>(c);
    const { 
      title, 
      description, 
      event_date, 
      event_time, 
      event_end_time,
      location, 
      is_recurring, 
      recurrence 
    } = body;

    if (!title || !event_date) {
      return yield* Effect.fail(ValidationError.single('Missing required fields: title, event_date'));
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return yield* Effect.fail(ValidationError.single('Invalid date format. Use YYYY-MM-DD'));
    }

    // Validate time format if provided (HH:MM)
    if (event_time && !/^\d{2}:\d{2}$/.test(event_time)) {
      return yield* Effect.fail(ValidationError.single('Invalid time format. Use HH:MM'));
    }

    if (event_end_time && !/^\d{2}:\d{2}$/.test(event_end_time)) {
      return yield* Effect.fail(ValidationError.single('Invalid end time format. Use HH:MM'));
    }

    // Validate recurrence config if recurring
    if (is_recurring && recurrence) {
      const validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
      if (!validTypes.includes(recurrence.type)) {
        return yield* Effect.fail(ValidationError.single('Invalid recurrence type'));
      }

      if (recurrence.endType === 'end_date' && recurrence.endDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(recurrence.endDate)) {
          return yield* Effect.fail(ValidationError.single('Invalid recurrence end date format. Use YYYY-MM-DD'));
        }
      }
    }

    const recurrenceFields = buildRecurrenceFields(is_recurring, recurrence);

    yield* execute(`
      INSERT INTO calendar_events (
        title, description, event_date, event_time, event_end_time, location, created_by,
        is_recurring, recurrence_type, recurrence_interval, recurrence_days_of_week,
        recurrence_day_of_month, recurrence_week_of_month, recurrence_day_of_week,
        recurrence_months, recurrence_end_type, recurrence_end_date, 
        recurrence_occurrences, recurrence_exceptions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      title, 
      description || null, 
      event_date, 
      event_time || null, 
      event_end_time || null,
      location || null, 
      user.id,
      recurrenceFields.is_recurring,
      recurrenceFields.recurrence_type,
      recurrenceFields.recurrence_interval,
      recurrenceFields.recurrence_days_of_week,
      recurrenceFields.recurrence_day_of_month,
      recurrenceFields.recurrence_week_of_month,
      recurrenceFields.recurrence_day_of_week,
      recurrenceFields.recurrence_months,
      recurrenceFields.recurrence_end_type,
      recurrenceFields.recurrence_end_date,
      recurrenceFields.recurrence_occurrences,
      recurrenceFields.recurrence_exceptions
    );

    return { message: 'Event created successfully' };
  })
));

// Get individual event by ID
calendar.get('/:id', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();
    
    const event = yield* queryOne<CalendarEvent>(
      'SELECT * FROM calendar_events WHERE id = ?',
      id
    );
    
    if (!event) {
      return yield* Effect.fail(NotFoundError.resource('Event'));
    }
    
    return event;
  })
));

// Update a calendar event
calendar.put('/:id', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();
    const body = yield* parseBody<UpdateEventBody>(c);
    const { 
      title, 
      description, 
      event_date, 
      event_time, 
      event_end_time,
      location, 
      is_recurring, 
      recurrence,
      update_series,
      original_instance_date
    } = body;

    if (!title || !event_date) {
      return yield* Effect.fail(ValidationError.single('Missing required fields: title, event_date'));
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return yield* Effect.fail(ValidationError.single('Invalid date format. Use YYYY-MM-DD'));
    }

    // Validate time format if provided (HH:MM)
    if (event_time && !/^\d{2}:\d{2}$/.test(event_time)) {
      return yield* Effect.fail(ValidationError.single('Invalid time format. Use HH:MM'));
    }

    if (event_end_time && !/^\d{2}:\d{2}$/.test(event_end_time)) {
      return yield* Effect.fail(ValidationError.single('Invalid end time format. Use HH:MM'));
    }

    // Check if this is a recurring event instance
    const existingEvent = yield* queryOne<CalendarEvent>(
      'SELECT * FROM calendar_events WHERE id = ?',
      id
    );

    if (!existingEvent) {
      return yield* Effect.fail(NotFoundError.resource('Event'));
    }
    
    // Debug logging
    console.log('PUT /calendar/:id Debug Info:');
    console.log('ID:', id);
    console.log('original_instance_date:', original_instance_date);
    console.log('update_series:', update_series);
    console.log('existingEvent.is_recurring:', existingEvent.is_recurring);
    console.log('existingEvent.parent_event_id:', existingEvent.parent_event_id);
    console.log('existingEvent.recurrence_exceptions:', existingEvent.recurrence_exceptions);
    
    // Handle different update scenarios
    if (original_instance_date && !update_series) {
      // Editing a single recurring instance - create a new standalone event
      // and add the original date to the parent's exceptions
      
      const parentEvent = existingEvent;
      
      // Check if this specific date already has an exception or standalone event
      const existingStandalone = yield* queryOne<CalendarEvent>(
        'SELECT * FROM calendar_events WHERE parent_event_id = ? AND event_date = ?',
        id,
        original_instance_date
      );
      
      if (existingStandalone) {
        // Update the existing standalone event instead of creating a new one
        yield* execute(`
          UPDATE calendar_events SET 
            title = ?, description = ?, event_date = ?, event_time = ?, 
            event_end_time = ?, location = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
          title,
          description || null,
          event_date,
          event_time || null,
          event_end_time || null,
          location || null,
          existingStandalone.id
        );
        
        return { message: 'Recurring instance updated successfully' };
      } else {
        // Add the original instance date to exceptions and create new standalone event
        const currentExceptions = parentEvent.recurrence_exceptions ? 
          JSON.parse(parentEvent.recurrence_exceptions) : [];
        const updatedExceptions = [...currentExceptions];
        
        if (!updatedExceptions.includes(original_instance_date)) {
          updatedExceptions.push(original_instance_date);
        }
        
        // Update the parent event to include the new exception
        yield* execute(`
          UPDATE calendar_events SET 
            recurrence_exceptions = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, JSON.stringify(updatedExceptions), id);
        
        // Create a new standalone event for the modified instance
        yield* execute(`
          INSERT INTO calendar_events (
            title, description, event_date, event_time, event_end_time, location, 
            created_by, is_recurring, parent_event_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        `,
          title,
          description || null,
          event_date,
          event_time || null,
          event_end_time || null,
          location || null,
          parentEvent.created_by,
          id // Reference to parent for tracking
        );
        
        return { message: 'Recurring instance updated successfully' };
      }
      
    } else {
      // Either updating the entire series or a regular event
      const targetId = id;
      
      console.log('Updating series/regular event:');
      console.log('targetId:', targetId);
      console.log('is_recurring:', is_recurring);
      console.log('recurrence provided:', !!recurrence);

      // Prepare recurring event fields - preserve existing exceptions when updating a series
      const baseRecurrenceFields = buildRecurrenceFields(is_recurring, recurrence);
      const recurrenceFields = is_recurring ? {
        ...baseRecurrenceFields,
        recurrence_exceptions: existingEvent.recurrence_exceptions
      } : baseRecurrenceFields;
      
      console.log('recurrenceFields.recurrence_exceptions:', recurrenceFields.recurrence_exceptions);
      console.log('About to update event with targetId:', targetId);

      yield* execute(`
        UPDATE calendar_events SET 
          title = ?, description = ?, event_time = ?, event_end_time = ?, 
          location = ?, updated_at = CURRENT_TIMESTAMP,
          is_recurring = ?, recurrence_type = ?, recurrence_interval = ?, 
          recurrence_days_of_week = ?, recurrence_day_of_month = ?, 
          recurrence_week_of_month = ?, recurrence_day_of_week = ?, 
          recurrence_months = ?, recurrence_end_type = ?, recurrence_end_date = ?, 
          recurrence_occurrences = ?, recurrence_exceptions = ?
        WHERE id = ?
      `,
        title, 
        description || null, 
        event_time || null, 
        event_end_time || null,
        location || null,
        recurrenceFields.is_recurring,
        recurrenceFields.recurrence_type,
        recurrenceFields.recurrence_interval,
        recurrenceFields.recurrence_days_of_week,
        recurrenceFields.recurrence_day_of_month,
        recurrenceFields.recurrence_week_of_month,
        recurrenceFields.recurrence_day_of_week,
        recurrenceFields.recurrence_months,
        recurrenceFields.recurrence_end_type,
        recurrenceFields.recurrence_end_date,
        recurrenceFields.recurrence_occurrences,
        recurrenceFields.recurrence_exceptions,
        targetId
      );

      return { message: 'Event updated successfully' };
    }
  })
));

// Delete a calendar event
calendar.delete('/:id', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();
    
    // Try to parse body, but don't fail if empty - use Effect.catchAll to handle errors
    const deleteBody = yield* Effect.tryPromise({
      try: () => c.req.json<DeleteEventBody>(),
      catch: (): ApiError => ValidationError.single('Invalid body')
    }).pipe(
      Effect.catchAll(() => Effect.succeed({} as DeleteEventBody))
    );
    
    const { delete_series, exception_date } = deleteBody;

    // Check if this is a recurring event instance
    const existingEvent = yield* queryOne<CalendarEvent>(
      'SELECT * FROM calendar_events WHERE id = ?',
      id
    );

    if (!existingEvent) {
      return yield* Effect.fail(NotFoundError.resource('Event'));
    }

    // Handle recurring event instance deletion
    if (exception_date && !delete_series) {
      // This is deleting a single instance from a recurring series
      const parentEventId = existingEvent.parent_event_id || Number(id);
      
      // Get the parent event
      const parentEvent = yield* queryOne<CalendarEvent>(
        'SELECT * FROM calendar_events WHERE id = ?',
        parentEventId
      );

      if (parentEvent) {
        const exceptions = parentEvent.recurrence_exceptions ? 
          JSON.parse(parentEvent.recurrence_exceptions) : [];
        
        if (!exceptions.includes(exception_date)) {
          exceptions.push(exception_date);
          
          yield* execute(
            'UPDATE calendar_events SET recurrence_exceptions = ? WHERE id = ?',
            JSON.stringify(exceptions),
            parentEventId
          );
        }

        return { message: 'Event occurrence deleted successfully' };
      }
    }

    // Handle series deletion or regular event deletion
    if (delete_series) {
      // Delete the entire recurring series
      yield* execute('DELETE FROM calendar_events WHERE id = ?', id);
      
      // Also delete any standalone instances that were created from this series
      yield* execute('DELETE FROM calendar_events WHERE parent_event_id = ?', id);
      
      return { message: 'Event series deleted successfully' };
    } else {
      // Delete just this single event (could be a regular event or standalone instance)
      yield* execute('DELETE FROM calendar_events WHERE id = ?', id);

      return { message: 'Event deleted successfully' };
    }
  })
));

// Add exception to recurring event
calendar.post('/:id/exception', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();
    const body = yield* parseBody<ExceptionBody>(c);
    const { exception_date } = body;

    if (!exception_date) {
      return yield* Effect.fail(ValidationError.single('Missing required field: exception_date'));
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exception_date)) {
      return yield* Effect.fail(ValidationError.single('Invalid date format. Use YYYY-MM-DD'));
    }

    const event = yield* queryOne<CalendarEvent>(
      'SELECT * FROM calendar_events WHERE id = ?',
      id
    );

    if (!event) {
      return yield* Effect.fail(NotFoundError.resource('Event'));
    }

    if (!event.is_recurring) {
      return yield* Effect.fail(ValidationError.single('Event is not recurring'));
    }

    const exceptions = event.recurrence_exceptions ? 
      JSON.parse(event.recurrence_exceptions) : [];
    
    if (!exceptions.includes(exception_date)) {
      exceptions.push(exception_date);
      
      yield* execute(
        'UPDATE calendar_events SET recurrence_exceptions = ? WHERE id = ?',
        JSON.stringify(exceptions),
        id
      );

      return { message: 'Exception added successfully' };
    }

    return { message: 'Exception already exists or failed to add' };
  })
));

// Remove exception from recurring event
calendar.delete('/:id/exception', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();
    const body = yield* parseBody<ExceptionBody>(c);
    const { exception_date } = body;

    if (!exception_date) {
      return yield* Effect.fail(ValidationError.single('Missing required field: exception_date'));
    }

    const event = yield* queryOne<CalendarEvent>(
      'SELECT * FROM calendar_events WHERE id = ?',
      id
    );

    if (!event) {
      return yield* Effect.fail(NotFoundError.resource('Event'));
    }

    if (!event.is_recurring) {
      return yield* Effect.fail(ValidationError.single('Event is not recurring'));
    }

    const exceptions = event.recurrence_exceptions ? 
      JSON.parse(event.recurrence_exceptions) : [];
    
    const updatedExceptions = exceptions.filter((date: string) => date !== exception_date);
    
    yield* execute(
      'UPDATE calendar_events SET recurrence_exceptions = ? WHERE id = ?',
      JSON.stringify(updatedExceptions),
      id
    );

    return { message: 'Exception removed successfully' };
  })
));

// Test endpoint to check recurring event generation
calendar.get('/test/:id', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // 3 months ahead

    const event = yield* queryOne<CalendarEvent>(
      'SELECT * FROM calendar_events WHERE id = ?',
      id
    );

    if (!event) {
      return yield* Effect.fail(NotFoundError.resource('Event'));
    }

    const instances = generateRecurringInstances(event, startDate, endDate);

    return {
      baseEvent: event,
      generatedInstances: instances,
      count: instances.length
    };
  })
));

export default calendar;
