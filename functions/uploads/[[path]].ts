type R2ObjectBodyLike = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  uploaded?: Date;
  writeHttpMetadata?: (headers: Headers) => void;
};

type Env = {
  UPLOADS: {
    get: (key: string) => Promise<R2ObjectBodyLike | null>;
  };
};

function pathParts(context: any) {
  const value = context.params?.path;
  if (Array.isArray(value)) {
    return value;
  }
  return String(value || '').split('/').filter(Boolean);
}

export const onRequestGet: any = async (context: any) => {
  const { env } = context as { env: Env };
  const key = pathParts(context).join('/');

  if (!key || key.includes('..') || key.includes('\\') || !/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(key)) {
    return new Response('Not found', { status: 404 });
  }

  const object = await env.UPLOADS.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  if (object.writeHttpMetadata) {
    object.writeHttpMetadata(headers);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  }
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
};
