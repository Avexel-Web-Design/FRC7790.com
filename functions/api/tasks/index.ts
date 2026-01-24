import { Hono } from 'hono';
import { Effect } from 'effect';
import { sendPushToUsers } from '../utils/push';
import { authMiddleware } from '../auth/middleware';
import {
  effectHandler,
  authEffectHandler,
  parseBody,
  type Env,
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

interface Task {
  id: number;
  title: string;
  description: string | null;
  assigned_to: number | null;
  created_by: number;
  due_date: string | null;
  priority: string;
  completed: number;
  created_at: string;
  updated_at: string;
  creator_username: string;
  assignee_username: string | null;
}

interface TaskPrev {
  assigned_to: number | null;
  title: string;
}

interface CreateTaskBody {
  title: string;
  description?: string;
  assigned_to?: number;
  due_date?: string;
  priority?: string;
}

interface UpdateTaskBody {
  title: string;
  description?: string;
  completed?: boolean;
  assigned_to?: number;
  due_date?: string;
  priority?: string;
}

interface CompleteBody {
  completed: boolean;
}

const tasks = new Hono<{ 
  Bindings: Env;
  Variables: { user: AuthUser };
}>();

tasks.use('*', authMiddleware);

// Get all tasks
tasks.get('/', effectHandler((c) =>
  Effect.gen(function* () {
    const results = yield* query<Task>(`
      SELECT t.*, 
             u1.username as creator_username,
             u2.username as assignee_username
      FROM tasks t 
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      ORDER BY t.due_date ASC, t.created_at DESC
    `);
    return results;
  })
));

// Create a task
tasks.post('/', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    const body = yield* parseBody<CreateTaskBody>(c);
    const { title, description, assigned_to, due_date, priority } = body;

    if (!title) {
      return yield* Effect.fail(ValidationError.single('Title is required'));
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

    // Validate due_date format if provided (YYYY-MM-DD)
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return yield* Effect.fail(ValidationError.single('Invalid due date format. Use YYYY-MM-DD'));
    }

    yield* execute(
      'INSERT INTO tasks (title, description, assigned_to, created_by, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)',
      title,
      description || null,
      assigned_to || null,
      user.id,
      due_date || null,
      taskPriority
    );

    // Push to assignee if present (best-effort)
    if (assigned_to) {
      yield* Effect.promise(async () => {
        try {
          await sendPushToUsers(c as any, [Number(assigned_to)], 'New Task Assigned', title, { type: 'task', action: 'created' });
        } catch (e) {
          console.warn('tasks.create push failed', e);
        }
      });
    }

    return { message: 'Task created successfully' };
  })
));

// Update a task
tasks.put('/:id', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();
    const body = yield* parseBody<UpdateTaskBody>(c);
    const { title, description, completed, assigned_to, due_date, priority } = body;

    if (!title) {
      return yield* Effect.fail(ValidationError.single('Title is required'));
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high'];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

    // Validate due_date format if provided (YYYY-MM-DD)
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return yield* Effect.fail(ValidationError.single('Invalid due date format. Use YYYY-MM-DD'));
    }

    // Fetch previous assignee to detect changes
    const prev = yield* queryOne<TaskPrev>('SELECT assigned_to, title FROM tasks WHERE id = ?', id);
    const prevAssigned = prev ? prev.assigned_to : null;
    const prevTitle = prev ? prev.title : title;

    yield* execute(
      'UPDATE tasks SET title = ?, description = ?, completed = ?, assigned_to = ?, due_date = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      title,
      description || null,
      completed ? 1 : 0,
      assigned_to || null,
      due_date || null,
      taskPriority,
      id
    );

    // If assignment changed, notify the new assignee (best-effort)
    if (assigned_to && Number(assigned_to) !== Number(prevAssigned)) {
      yield* Effect.promise(async () => {
        try {
          await sendPushToUsers(c as any, [Number(assigned_to)], 'Task Assigned', title || prevTitle, { type: 'task', action: 'updated' });
        } catch (e) {
          console.warn('tasks.update push failed', e);
        }
      });
    }

    return { message: 'Task updated successfully' };
  })
));

// Toggle task completion
tasks.patch('/:id/complete', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();
    const body = yield* parseBody<CompleteBody>(c);
    const { completed } = body;

    if (typeof completed !== 'boolean') {
      return yield* Effect.fail(ValidationError.single('Invalid completed status'));
    }

    yield* execute(
      'UPDATE tasks SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      completed ? 1 : 0,
      id
    );

    return { message: 'Task completion status updated' };
  })
));

// Delete a task
tasks.delete('/:id', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();

    yield* execute('DELETE FROM tasks WHERE id = ?', id);

    return { message: 'Task deleted successfully' };
  })
));

export default tasks;
