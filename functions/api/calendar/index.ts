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

const calendar = new Hono<{ 
  Bindings: CloudflareEnv;
  Variables: { user: AuthUser };
}>();

calendar.use('*', authMiddleware);

calendar.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM calendar_events ORDER BY event_date ASC, event_time ASC').all();
    return c.json(results);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

calendar.post('/', async (c) => {
  try {
    const user = c.get('user');
    const { title, description, event_date, event_time, location } = await c.req.json();

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

    const { success } = await c.env.DB.prepare(
      'INSERT INTO calendar_events (title, description, event_date, event_time, location, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(title, description || null, event_date, event_time || null, location || null, user.id)
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

calendar.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const { title, description, event_date, event_time, location } = await c.req.json();

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

    const { success } = await c.env.DB.prepare(
      'UPDATE calendar_events SET title = ?, description = ?, event_date = ?, event_time = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(title, description || null, event_date, event_time || null, location || null, id)
      .run();

    if (success) {
      return c.json({ message: 'Event updated successfully' });
    }

    return c.json({ error: 'Failed to update event' }, 500);
  } catch (error) {
    console.error('Error updating event:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

calendar.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const { success } = await c.env.DB.prepare('DELETE FROM calendar_events WHERE id = ?')
      .bind(id)
      .run();

    if (success) {
      return c.json({ message: 'Event deleted successfully' });
    }

    return c.json({ error: 'Failed to delete event' }, 500);
  } catch (error) {
    console.error('Error deleting event:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default calendar;
