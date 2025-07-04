import { Hono } from 'hono';
import { authMiddleware } from '../auth/middleware';

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

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

const calendar = new Hono<{ 
  Bindings: CloudflareEnv;
  Variables: { user: AuthUser };
}>();

calendar.use('*', authMiddleware);

// Utility function to generate recurring event instances
function generateRecurringInstances(baseEvent: any, startDate: Date, endDate: Date): any[] {
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

calendar.get('/', async (c) => {
  try {
    const startDate = c.req.query('start');
    const endDate = c.req.query('end');
    
    // Get base recurring events and non-recurring events
    let query = `
      SELECT * FROM calendar_events 
      WHERE (parent_event_id IS NULL OR parent_event_id = 0)
    `;
    
    if (startDate && endDate) {
      query += ` AND (
        (is_recurring = 0 AND event_date BETWEEN ? AND ?) OR
        (is_recurring = 1 AND (
          recurrence_end_date IS NULL OR 
          recurrence_end_date >= ? OR
          event_date <= ?
        ))
      )`;
    }
    
    query += ` ORDER BY event_date ASC, event_time ASC`;
    
    const params = startDate && endDate ? [startDate, endDate, startDate, endDate] : [];
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    // Also get standalone instances (modified recurring instances) in the date range
    let standaloneInstances = [];
    if (startDate && endDate) {
      const { results: standalone } = await c.env.DB.prepare(`
        SELECT * FROM calendar_events 
        WHERE parent_event_id IS NOT NULL AND parent_event_id != 0 
        AND event_date BETWEEN ? AND ?
        ORDER BY event_date ASC, event_time ASC
      `).bind(startDate, endDate).all();
      standaloneInstances = standalone;
    }
    
    // Generate recurring event instances if date range is provided
    if (startDate && endDate) {
      const expandedEvents = [];
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
      
      return c.json(expandedEvents.sort((a, b) => {
        const dateA = new Date(a.event_date + ' ' + (a.event_time || '00:00'));
        const dateB = new Date(b.event_date + ' ' + (b.event_time || '00:00'));
        return dateA.getTime() - dateB.getTime();
      }));
    }
    
    return c.json(results);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

calendar.post('/', async (c) => {
  try {
    const user = c.get('user');
    const { 
      title, 
      description, 
      event_date, 
      event_time, 
      event_end_time,
      location, 
      is_recurring, 
      recurrence 
    } = await c.req.json();

    if (!title || !event_date) {
      return c.json({ error: 'Missing required fields: title, event_date' }, 400);
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400);
    }

    // Validate time format if provided (HH:MM)
    if (event_time && !/^\d{2}:\d{2}$/.test(event_time)) {
      return c.json({ error: 'Invalid time format. Use HH:MM' }, 400);
    }

    if (event_end_time && !/^\d{2}:\d{2}$/.test(event_end_time)) {
      return c.json({ error: 'Invalid end time format. Use HH:MM' }, 400);
    }

    // Validate recurrence config if recurring
    if (is_recurring && recurrence) {
      const validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
      if (!validTypes.includes(recurrence.type)) {
        return c.json({ error: 'Invalid recurrence type' }, 400);
      }

      if (recurrence.endType === 'end_date' && recurrence.endDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(recurrence.endDate)) {
          return c.json({ error: 'Invalid recurrence end date format. Use YYYY-MM-DD' }, 400);
        }
      }
    }

    // Prepare recurring event fields
    const recurrenceFields = is_recurring && recurrence ? {
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
    } : {
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

    const { success } = await c.env.DB.prepare(`
      INSERT INTO calendar_events (
        title, description, event_date, event_time, event_end_time, location, created_by,
        is_recurring, recurrence_type, recurrence_interval, recurrence_days_of_week,
        recurrence_day_of_month, recurrence_week_of_month, recurrence_day_of_week,
        recurrence_months, recurrence_end_type, recurrence_end_date, 
        recurrence_occurrences, recurrence_exceptions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
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
      )
      .run();

    if (success) {
      return c.json({ message: 'Event created successfully' });
    }

    return c.json({ error: 'Failed to create event' }, 500);
  } catch (error) {
    console.error('Error creating event:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get individual event by ID
calendar.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM calendar_events WHERE id = ?'
    ).bind(id).all();
    
    if (results.length === 0) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    return c.json(results[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

calendar.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
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
    } = await c.req.json();

    if (!title || !event_date) {
      return c.json({ error: 'Missing required fields: title, event_date' }, 400);
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400);
    }

    // Validate time format if provided (HH:MM)
    if (event_time && !/^\d{2}:\d{2}$/.test(event_time)) {
      return c.json({ error: 'Invalid time format. Use HH:MM' }, 400);
    }

    if (event_end_time && !/^\d{2}:\d{2}$/.test(event_end_time)) {
      return c.json({ error: 'Invalid end time format. Use HH:MM' }, 400);
    }

    // Check if this is a recurring event instance
    const { results: existingEvents } = await c.env.DB.prepare(
      'SELECT * FROM calendar_events WHERE id = ?'
    ).bind(id).all();

    if (existingEvents.length === 0) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const existingEvent = existingEvents[0];
    
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
      const { results: existingStandalone } = await c.env.DB.prepare(
        'SELECT * FROM calendar_events WHERE parent_event_id = ? AND event_date = ?'
      ).bind(id, original_instance_date).all();
      
      if (existingStandalone.length > 0) {
        // Update the existing standalone event instead of creating a new one
        const { success } = await c.env.DB.prepare(`
          UPDATE calendar_events SET 
            title = ?, description = ?, event_date = ?, event_time = ?, 
            event_end_time = ?, location = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          title,
          description || null,
          event_date,
          event_time || null,
          event_end_time || null,
          location || null,
          existingStandalone[0].id
        ).run();
        
        if (success) {
          return c.json({ message: 'Recurring instance updated successfully' });
        }
        return c.json({ error: 'Failed to update recurring instance' }, 500);
      } else {
        // Add the original instance date to exceptions and create new standalone event
        const currentExceptions = parentEvent.recurrence_exceptions ? 
          JSON.parse(parentEvent.recurrence_exceptions as string) : [];
        const updatedExceptions = [...currentExceptions];
        
        if (!updatedExceptions.includes(original_instance_date)) {
          updatedExceptions.push(original_instance_date);
        }
        
        // Update the parent event to include the new exception
        await c.env.DB.prepare(`
          UPDATE calendar_events SET 
            recurrence_exceptions = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(JSON.stringify(updatedExceptions), id).run();
        
        // Create a new standalone event for the modified instance
        const { success } = await c.env.DB.prepare(`
          INSERT INTO calendar_events (
            title, description, event_date, event_time, event_end_time, location, 
            created_by, is_recurring, parent_event_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        `).bind(
          title,
          description || null,
          event_date,
          event_time || null,
          event_end_time || null,
          location || null,
          parentEvent.created_by,
          id // Reference to parent for tracking
        ).run();
        
        if (success) {
          return c.json({ message: 'Recurring instance updated successfully' });
        }
        return c.json({ error: 'Failed to update recurring instance' }, 500);
      }
      
    } else {
      // Either updating the entire series or a regular event
      // If we have original_instance_date, it means we're editing from a recurring instance
      // and the ID is already the parent event ID
      const targetId = id;
      
      console.log('Updating series/regular event:');
      console.log('targetId:', targetId);
      console.log('is_recurring:', is_recurring);
      console.log('recurrence provided:', !!recurrence);

      // Prepare recurring event fields
      const recurrenceFields = is_recurring && recurrence ? {
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
        // Always preserve existing exceptions when updating a series
        recurrence_exceptions: existingEvent.recurrence_exceptions
      } : {
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
      
      console.log('recurrenceFields.recurrence_exceptions:', recurrenceFields.recurrence_exceptions);
      console.log('About to update event with targetId:', targetId);

      const { success } = await c.env.DB.prepare(`
        UPDATE calendar_events SET 
          title = ?, description = ?, event_time = ?, event_end_time = ?, 
          location = ?, updated_at = CURRENT_TIMESTAMP,
          is_recurring = ?, recurrence_type = ?, recurrence_interval = ?, 
          recurrence_days_of_week = ?, recurrence_day_of_month = ?, 
          recurrence_week_of_month = ?, recurrence_day_of_week = ?, 
          recurrence_months = ?, recurrence_end_type = ?, recurrence_end_date = ?, 
          recurrence_occurrences = ?, recurrence_exceptions = ?
        WHERE id = ?
      `)
        .bind(
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
        )
        .run();

      if (success) {
        return c.json({ message: 'Event updated successfully' });
      }
      return c.json({ error: 'Failed to update event' }, 500);
    }
  } catch (error) {
    console.error('Error updating event:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

calendar.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const { delete_series, exception_date } = await c.req.json().catch(() => ({}));

    // Check if this is a recurring event instance
    const { results: existingEvents } = await c.env.DB.prepare(
      'SELECT * FROM calendar_events WHERE id = ?'
    ).bind(id).all();

    if (existingEvents.length === 0) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const existingEvent = existingEvents[0];

    // Handle recurring event instance deletion
    if (exception_date && !delete_series) {
      // This is deleting a single instance from a recurring series
      let parentEventId = existingEvent.parent_event_id || id;
      
      // Get the parent event
      const { results: parentEvents } = await c.env.DB.prepare(
        'SELECT * FROM calendar_events WHERE id = ?'
      ).bind(parentEventId).all();

      if (parentEvents.length > 0) {
        const parentEvent = parentEvents[0];
        const exceptions = parentEvent.recurrence_exceptions ? 
          JSON.parse(parentEvent.recurrence_exceptions as string) : [];
        
        if (!exceptions.includes(exception_date)) {
          exceptions.push(exception_date);
          
          await c.env.DB.prepare(
            'UPDATE calendar_events SET recurrence_exceptions = ? WHERE id = ?'
          ).bind(JSON.stringify(exceptions), parentEventId).run();
        }

        return c.json({ message: 'Event occurrence deleted successfully' });
      }
    }

    // Handle series deletion or regular event deletion
    if (delete_series) {
      // Delete the entire recurring series - the ID should already be the parent event ID
      const { success } = await c.env.DB.prepare('DELETE FROM calendar_events WHERE id = ?')
        .bind(id)
        .run();

      if (success) {
        // Also delete any standalone instances that were created from this series
        await c.env.DB.prepare('DELETE FROM calendar_events WHERE parent_event_id = ?')
          .bind(id)
          .run();
        
        return c.json({ message: 'Event series deleted successfully' });
      }
    } else {
      // Delete just this single event (could be a regular event or standalone instance)
      const { success } = await c.env.DB.prepare('DELETE FROM calendar_events WHERE id = ?')
        .bind(id)
        .run();

      if (success) {
        return c.json({ message: 'Event deleted successfully' });
      }
    }

    return c.json({ error: 'Failed to delete event' }, 500);
  } catch (error) {
    console.error('Error deleting event:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add exception to recurring event
calendar.post('/:id/exception', async (c) => {
  try {
    const { id } = c.req.param();
    const { exception_date } = await c.req.json();

    if (!exception_date) {
      return c.json({ error: 'Missing required field: exception_date' }, 400);
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exception_date)) {
      return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400);
    }

    const { results: events } = await c.env.DB.prepare(
      'SELECT * FROM calendar_events WHERE id = ?'
    ).bind(id).all();

    if (events.length === 0) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const event = events[0];
    if (!event.is_recurring) {
      return c.json({ error: 'Event is not recurring' }, 400);
    }

    const exceptions = event.recurrence_exceptions ? 
      JSON.parse(event.recurrence_exceptions as string) : [];
    
    if (!exceptions.includes(exception_date)) {
      exceptions.push(exception_date);
      
      const { success } = await c.env.DB.prepare(
        'UPDATE calendar_events SET recurrence_exceptions = ? WHERE id = ?'
      ).bind(JSON.stringify(exceptions), id).run();

      if (success) {
        return c.json({ message: 'Exception added successfully' });
      }
    }

    return c.json({ message: 'Exception already exists or failed to add' });
  } catch (error) {
    console.error('Error adding exception:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Remove exception from recurring event
calendar.delete('/:id/exception', async (c) => {
  try {
    const { id } = c.req.param();
    const { exception_date } = await c.req.json();

    if (!exception_date) {
      return c.json({ error: 'Missing required field: exception_date' }, 400);
    }

    const { results: events } = await c.env.DB.prepare(
      'SELECT * FROM calendar_events WHERE id = ?'
    ).bind(id).all();

    if (events.length === 0) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const event = events[0];
    if (!event.is_recurring) {
      return c.json({ error: 'Event is not recurring' }, 400);
    }

    const exceptions = event.recurrence_exceptions ? 
      JSON.parse(event.recurrence_exceptions as string) : [];
    
    const updatedExceptions = exceptions.filter((date: string) => date !== exception_date);
    
    const { success } = await c.env.DB.prepare(
      'UPDATE calendar_events SET recurrence_exceptions = ? WHERE id = ?'
    ).bind(JSON.stringify(updatedExceptions), id).run();

    if (success) {
      return c.json({ message: 'Exception removed successfully' });
    }

    return c.json({ error: 'Failed to remove exception' }, 500);
  } catch (error) {
    console.error('Error removing exception:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Test endpoint to check recurring event generation
calendar.get('/test/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // 3 months ahead

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM calendar_events WHERE id = ?'
    ).bind(id).all();

    if (results.length === 0) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const event = results[0];
    const instances = generateRecurringInstances(event, startDate, endDate);

    return c.json({
      baseEvent: event,
      generatedInstances: instances,
      count: instances.length
    });
  } catch (error) {
    console.error('Error testing recurring event:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default calendar;
