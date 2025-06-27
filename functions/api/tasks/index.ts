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
    const { results } = await c.env.DB.prepare(`
      SELECT t.*, 
             u1.username as creator_username,
             u2.username as assignee_username
      FROM tasks t 
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      ORDER BY t.due_date ASC, t.created_at DESC
    `).all();
    return c.json(results);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

tasks.post('/', async (c) => {
  try {
    const user = c.get('user');
    const { title, description, assigned_to, due_date, priority } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

    // Validate due_date format if provided (YYYY-MM-DD)
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return c.json({ error: 'Invalid due date format. Use YYYY-MM-DD' }, 400);
    }

    const { success } = await c.env.DB.prepare(
      'INSERT INTO tasks (title, description, assigned_to, created_by, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(title, description || null, assigned_to || null, user.id, due_date || null, taskPriority)
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
    const { title, description, completed, assigned_to, due_date, priority } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high'];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

    // Validate due_date format if provided (YYYY-MM-DD)
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return c.json({ error: 'Invalid due date format. Use YYYY-MM-DD' }, 400);
    }

    const { success } = await c.env.DB.prepare(
      'UPDATE tasks SET title = ?, description = ?, completed = ?, assigned_to = ?, due_date = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(
        title, 
        description || null, 
        completed ? 1 : 0, 
        assigned_to || null, 
        due_date || null, 
        taskPriority,
        id
      )
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

tasks.patch('/:id/complete', async (c) => {
  try {
    const { id } = c.req.param();
    const { completed } = await c.req.json();

    if (typeof completed !== 'boolean') {
      return c.json({ error: 'Invalid completed status' }, 400);
    }

    const { success } = await c.env.DB.prepare(
      'UPDATE tasks SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(completed ? 1 : 0, id)
      .run();

    if (success) {
      return c.json({ message: 'Task completion status updated' });
    }

    return c.json({ error: 'Failed to update task' }, 500);
  } catch (error) {
    console.error('Error updating task completion:', error);
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
