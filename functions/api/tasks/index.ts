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

const tasks = new Hono<{ 
  Bindings: CloudflareEnv;
  Variables: { user: AuthUser };
}>();

tasks.use('*', authMiddleware);

tasks.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM tasks ORDER BY due_date ASC').all();
    return c.json(results);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

tasks.post('/', async (c) => {
  try {
    const { title, description, due_date } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Validate due_date if provided
    if (due_date && isNaN(Date.parse(due_date))) {
      return c.json({ error: 'Invalid due date format' }, 400);
    }

    const { success } = await c.env.DB.prepare(
      'INSERT INTO tasks (title, description, due_date) VALUES (?, ?, ?)'
    )
      .bind(title, description || null, due_date || null)
      .run();

    if (success) {
      return c.json({ message: 'Task created successfully' });
    }

    return c.json({ error: 'Failed to create task' }, 500);
  } catch (error) {
    console.error('Error creating task:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

tasks.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const { title, description, is_completed, due_date } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Validate due_date if provided
    if (due_date && isNaN(Date.parse(due_date))) {
      return c.json({ error: 'Invalid due date format' }, 400);
    }

    const { success } = await c.env.DB.prepare(
      'UPDATE tasks SET title = ?, description = ?, is_completed = ?, due_date = ? WHERE id = ?'
    )
      .bind(title, description || null, is_completed ? 1 : 0, due_date || null, id)
      .run();

    if (success) {
      return c.json({ message: 'Task updated successfully' });
    }

    return c.json({ error: 'Failed to update task' }, 500);
  } catch (error) {
    console.error('Error updating task:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

tasks.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const { success } = await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?')
      .bind(id)
      .run();

    if (success) {
      return c.json({ message: 'Task deleted successfully' });
    }

    return c.json({ error: 'Failed to delete task' }, 500);
  } catch (error) {
    console.error('Error deleting task:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default tasks;
