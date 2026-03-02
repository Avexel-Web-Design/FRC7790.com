import { Hono } from 'hono';
import { Effect } from 'effect';
import { authMiddleware } from '../auth/middleware';
import {
  authEffectHandler,
  type Env,
  ValidationError
} from '../lib/effect-hono';

const uploads = new Hono<{ Bindings: Env; Variables: { user: { id: number; isAdmin: boolean } } }>();

uploads.use('*', authMiddleware);

uploads.post('/pit-image', authEffectHandler((c) =>
  Effect.gen(function* () {
    const bucket = c.env.R2;
    const baseUrl = c.env.R2_PUBLIC_URL;
    if (!bucket || !baseUrl) {
      return yield* Effect.fail(ValidationError.single('R2 not configured'));
    }

    const { file, arrayBuffer, contentType, extension } = yield* Effect.promise(async () => {
      const form = await c.req.formData();
      const formFile = form.get('file');
      if (!formFile || typeof formFile !== 'object' || !('arrayBuffer' in formFile)) {
        return { file: null, arrayBuffer: null, contentType: 'image/jpeg', extension: 'jpg' };
      }
      const typedFile = formFile as File;
      const buffer = await typedFile.arrayBuffer();
      const ext = typedFile.name.split('.').pop() || 'jpg';
      return { file: typedFile, arrayBuffer: buffer, contentType: typedFile.type || 'image/jpeg', extension: ext };
    });

    if (!file || !arrayBuffer) {
      return yield* Effect.fail(ValidationError.single('file is required'));
    }

    const key = `scouting/pit/${crypto.randomUUID()}.${extension}`;

    yield* Effect.promise(async () => {
      await bucket.put(key, arrayBuffer, {
        httpMetadata: { contentType }
      });
    });

    return { url: `${baseUrl.replace(/\/$/, '')}/${key}` };
  })
));

export default uploads;
