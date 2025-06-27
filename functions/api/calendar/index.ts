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
    const { results } = await c.env.DB.prepare('SELECT * FROM calendar_events ORDER BY start_time ASC').all();
    return c.json(results);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

calendar.post('/', async (c) => {
  try {
    const { title, start_time, end_time } = await c.req.json();

    if (!title || !start_time || !end_time) {
      return c.json({ error: 'Missing required fields: title, start_time, end_time' }, 400);
    }

    // Validate date format
    if (isNaN(Date.parse(start_time)) || isNaN(Date.parse(end_time))) {
      return c.json({ error: 'Invalid date format' }, 400);
    }

    const { success } = await c.env.DB.prepare(
      'INSERT INTO calendar_events (title, start_time, end_time) VALUES (?, ?, ?)'
    )
      .bind(title, start_time, end_time)
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
    const { title, start_time, end_time } = await c.req.json();

    if (!title || !start_time || !end_time) {
      return c.json({ error: 'Missing required fields: title, start_time, end_time' }, 400);
    }

    // Validate date format
    if (isNaN(Date.parse(start_time)) || isNaN(Date.parse(end_time))) {
      return c.json({ error: 'Invalid date format' }, 400);
    }

    const { success } = await c.env.DB.prepare(
      'UPDATE calendar_events SET title = ?, start_time = ?, end_time = ? WHERE id = ?'
    )
      .bind(title, start_time, end_time, id)
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
