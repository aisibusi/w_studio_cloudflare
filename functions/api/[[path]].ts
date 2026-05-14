type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => D1PreparedStatementLike;
    all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
    first: <T = Record<string, unknown>>() => Promise<T | null>;
    run: () => Promise<unknown>;
  };
};

type D1PreparedStatementLike = {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

type R2BucketLike = {
  put: (key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
  delete: (key: string) => Promise<unknown>;
};

type Env = {
  DB: D1DatabaseLike;
  UPLOADS: R2BucketLike;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
};

type Product = {
  id: string;
  name: string;
  description?: string;
  price?: number | null;
  inquireForPricing?: boolean;
  imageUrl: string;
  category?: string;
  collectionId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Inquiry = {
  id: string;
  name?: string;
  contact: string;
  question: string;
  createdAt?: string;
};

type AppSettings = {
  wechatId: string;
  contactMessage: string;
  homeHeroImageUrl: string;
  collectionOrder: string[];
  collectionImageUrls: Record<string, string>;
  productOrder: Record<string, string[]>;
};

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_COLLECTION_ORDER = [
  'supernova',
  'collection-2',
  'collection-5',
  'collection-4',
  'collection-3',
  'collection-7',
  'collection-8',
  'collection-6',
];
const DEFAULT_SETTINGS: AppSettings = {
  wechatId: 'doudou-zhaowenting',
  contactMessage: 'Tell us which piece you love, and we will respond with availability, details, and styling notes.',
  homeHeroImageUrl: '/collections/hero-w-necklace.webp',
  collectionOrder: DEFAULT_COLLECTION_ORDER,
  collectionImageUrls: {},
  productOrder: {},
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function json(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  });
}

function noContent(init: ResponseInit = {}) {
  return new Response(null, { status: 204, ...init });
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function toCamelProduct(row: any): Product {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    description: row.description ? String(row.description) : '',
    price: row.price == null ? null : Number(row.price),
    inquireForPricing: Boolean(row.inquire_for_pricing),
    imageUrl: String(row.image_url || ''),
    category: row.category ? String(row.category) : '',
    collectionId: row.collection_id ? String(row.collection_id) : 'supernova',
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function toCamelInquiry(row: any): Inquiry {
  return {
    id: String(row.id),
    name: row.name ? String(row.name) : '',
    contact: String(row.contact || ''),
    question: String(row.question || ''),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

function normalizeCollectionOrder(value: unknown) {
  const submitted = Array.isArray(value) ? value.map(String) : [];
  const uniqueValid = submitted.filter(
    (id, index) => DEFAULT_COLLECTION_ORDER.includes(id) && submitted.indexOf(id) === index,
  );
  return [...uniqueValid, ...DEFAULT_COLLECTION_ORDER.filter((id) => !uniqueValid.includes(id))];
}

function normalizeCollectionImageUrls(value: unknown) {
  const submitted = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return DEFAULT_COLLECTION_ORDER.reduce<Record<string, string>>((accumulator, collectionId) => {
    const imageUrl = String(submitted[collectionId] || '').trim();
    if (imageUrl) {
      accumulator[collectionId] = imageUrl.slice(0, 2000);
    }
    return accumulator;
  }, {});
}


function normalizeProductOrder(value: unknown) {
  const submitted = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return DEFAULT_COLLECTION_ORDER.reduce<Record<string, string[]>>((accumulator, collectionId) => {
    const rawIds = Array.isArray(submitted[collectionId]) ? (submitted[collectionId] as unknown[]) : [];
    const uniqueIds = rawIds
      .map((id) => String(id || '').trim())
      .filter((id, index, array) => Boolean(id) && array.indexOf(id) === index);
    if (uniqueIds.length) {
      accumulator[collectionId] = uniqueIds;
    }
    return accumulator;
  }, {});
}

function normalizeSettings(value: Partial<AppSettings> = {}): AppSettings {
  const homeHeroImageUrl = String(value.homeHeroImageUrl || DEFAULT_SETTINGS.homeHeroImageUrl).trim();
  const wechatId = String(value.wechatId || DEFAULT_SETTINGS.wechatId).trim();
  const contactMessage = String(value.contactMessage || DEFAULT_SETTINGS.contactMessage).trim();

  return {
    wechatId: wechatId.slice(0, 120),
    contactMessage: contactMessage.slice(0, 500),
    homeHeroImageUrl: homeHeroImageUrl || DEFAULT_SETTINGS.homeHeroImageUrl,
    collectionOrder: normalizeCollectionOrder(value.collectionOrder),
    collectionImageUrls: normalizeCollectionImageUrls(value.collectionImageUrls),
    productOrder: normalizeProductOrder(value.productOrder),
  };
}

async function readSettings(env: Env): Promise<AppSettings> {
  const row = await env.DB.prepare('SELECT value FROM site_settings WHERE key = ?').bind('site_settings').first<{ value: string }>();
  if (!row?.value) {
    return DEFAULT_SETTINGS;
  }

  try {
    return normalizeSettings(JSON.parse(row.value));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeSettings(env: Env, settings: Partial<AppSettings>) {
  const nextSettings = normalizeSettings(settings);
  await env.DB.prepare(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  )
    .bind('site_settings', JSON.stringify(nextSettings), new Date().toISOString())
    .run();
  return nextSettings;
}

async function readProducts(env: Env) {
  const rows = await env.DB.prepare('SELECT * FROM products ORDER BY datetime(created_at) DESC').all();
  return (rows.results || []).map(toCamelProduct);
}

async function readInquiries(env: Env) {
  const rows = await env.DB.prepare('SELECT * FROM inquiries ORDER BY datetime(created_at) DESC LIMIT 500').all();
  return (rows.results || []).map(toCamelInquiry);
}

function cleanProductInput(body: any) {
  const name = String(body?.name || '').trim();
  const imageUrl = String(body?.imageUrl || '').trim();
  const description = String(body?.description || '').trim();
  const category = String(body?.category || 'Supernova Series').trim();
  const collectionId = String(body?.collectionId || 'supernova').trim();
  const inquireForPricing = body?.inquireForPricing === true || String(body?.inquireForPricing || '').toLowerCase() === 'true';
  const rawPrice = body?.price;
  const price = rawPrice === '' || rawPrice == null ? null : Number(rawPrice);

  if (!name) {
    throw new ApiError('Product name is required.');
  }
  if (!imageUrl) {
    throw new ApiError('Product image URL is required.');
  }
  if (!inquireForPricing && (!Number.isFinite(price) || Number(price) < 0)) {
    throw new ApiError('Product price must be a valid number.');
  }
  if (!/^[a-z0-9-]{1,80}$/.test(collectionId)) {
    throw new ApiError('Product collection is invalid.');
  }

  return {
    name,
    price: inquireForPricing ? null : price,
    inquireForPricing,
    imageUrl,
    description,
    category,
    collectionId,
  };
}

function cleanInquiryInput(body: any) {
  const name = String(body?.name || '').trim();
  const contact = String(body?.contact || '').trim();
  const question = String(body?.question || '').trim();

  if (!contact) {
    throw new ApiError('Please leave a contact method.');
  }
  if (!question) {
    throw new ApiError('Please leave your inquiry.');
  }
  if (name.length > 100 || contact.length > 200 || question.length > 2000) {
    throw new ApiError('Inquiry is too long.');
  }

  return { name, contact, question };
}

function parseImageUpload(body: any) {
  const dataUrl = String(body?.dataUrl || '');
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([a-zA-Z0-9+/=]+)$/);

  if (!match) {
    throw new ApiError('Please upload a JPG, PNG, WebP, or GIF image.');
  }

  const mimeType = match[1];
  const base64 = match[2];
  const binary = atob(base64);
  const maxBytes = 8 * 1024 * 1024;

  if (!binary.length || binary.length > maxBytes) {
    throw new ApiError('Image must be smaller than 8 MB.');
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const extensionByMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  return {
    bytes,
    mimeType,
    extension: extensionByMime[mimeType],
  };
}

function getUploadKeyFromImageUrl(imageUrl: string) {
  const prefix = '/uploads/';
  const value = String(imageUrl || '').trim();

  if (!value.startsWith(prefix)) {
    return null;
  }

  const key = value.slice(prefix.length);
  if (!key || key.includes('/') || key.includes('\\')) {
    return null;
  }
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(key)) {
    return null;
  }

  return key;
}

async function isImageUsed(env: Env, imageUrl: string) {
  if (!imageUrl) {
    return false;
  }

  const product = await env.DB.prepare('SELECT id FROM products WHERE image_url = ? LIMIT 1').bind(imageUrl).first();
  if (product) {
    return true;
  }

  const settings = await readSettings(env);
  return (
    settings.homeHeroImageUrl === imageUrl ||
    Object.values(settings.collectionImageUrls || {}).some((value) => value === imageUrl)
  );
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const index = entry.indexOf('=');
        if (index === -1) {
          return [entry, ''];
        }
        return [entry.slice(0, index), decodeURIComponent(entry.slice(index + 1))];
      }),
  );
}

function base64UrlEncode(value: string | ArrayBuffer) {
  let binary = '';
  if (typeof value === 'string') {
    binary = value;
  } else {
    const bytes = new Uint8Array(value);
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return atob(padded);
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64UrlEncode(signature);
}

async function createSessionToken(secret: string) {
  const payload = base64UrlEncode(JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 }));
  return `${payload}.${await sign(payload, secret)}`;
}

async function isSessionValid(token: string | undefined, secret: string) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) {
    return false;
  }
  if ((await sign(payload, secret)) !== signature) {
    return false;
  }

  try {
    const data = JSON.parse(base64UrlDecode(payload));
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

function sessionCookie(request: Request, value: string, maxAgeSeconds: number) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `wstudio_admin=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

async function requireAdmin(request: Request, env: Env) {
  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD || '666';
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const valid = await isSessionValid(cookies.wstudio_admin, secret);
  if (!valid) {
    throw new ApiError('Admin login required.', 401);
  }
}

function pathParts(context: any) {
  const value = context.params?.path;
  if (Array.isArray(value)) {
    return value;
  }
  return String(value || '').split('/').filter(Boolean);
}

async function handleRequest(context: any) {
  const { request, env } = context as { request: Request; env: Env };
  const method = request.method.toUpperCase();
  const parts = pathParts(context);
  const pathname = `/${parts.join('/')}`;

  if (method === 'GET' && pathname === '/health') {
    return json({ ok: true });
  }

  if (method === 'GET' && pathname === '/site-settings') {
    return json(await readSettings(env));
  }

  if (method === 'GET' && pathname === '/products') {
    return json(await readProducts(env));
  }

  if (method === 'POST' && pathname === '/inquiries') {
    const body = await readJson(request);
    const inquiry = {
      id: crypto.randomUUID(),
      ...cleanInquiryInput(body),
      createdAt: new Date().toISOString(),
    };

    await env.DB.prepare(
      `INSERT INTO inquiries (id, name, contact, question, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(inquiry.id, inquiry.name, inquiry.contact, inquiry.question, inquiry.createdAt)
      .run();
    return json({ ok: true }, { status: 201 });
  }

  if (method === 'POST' && pathname === '/admin/login') {
    const body = await readJson(request);
    const adminPassword = env.ADMIN_PASSWORD || '666';
    if (String((body as any)?.password || '') !== adminPassword) {
      return json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const secret = env.SESSION_SECRET || adminPassword;
    const token = await createSessionToken(secret);
    return json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie(request, token, SESSION_MAX_AGE_SECONDS) } });
  }

  if (method === 'GET' && pathname === '/admin/session') {
    await requireAdmin(request, env);
    return json({ ok: true });
  }

  if (method === 'POST' && pathname === '/admin/logout') {
    return json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie(request, '', 0) } });
  }

  if (method === 'GET' && pathname === '/admin/inquiries') {
    await requireAdmin(request, env);
    return json(await readInquiries(env));
  }

  if (method === 'PUT' && pathname === '/admin/site-settings') {
    await requireAdmin(request, env);
    const body = (await readJson(request)) as Partial<AppSettings>;
    const currentSettings = await readSettings(env);
    return json(
      await writeSettings(env, {
        ...currentSettings,
        ...body,
        collectionOrder: body.collectionOrder ?? currentSettings.collectionOrder,
        collectionImageUrls: body.collectionImageUrls ?? currentSettings.collectionImageUrls,
        productOrder: body.productOrder ?? currentSettings.productOrder,
      }),
    );
  }

  if (method === 'POST' && pathname === '/uploads') {
    await requireAdmin(request, env);
    const upload = parseImageUpload(await readJson(request));
    const fileName = `${crypto.randomUUID()}.${upload.extension}`;
    await env.UPLOADS.put(fileName, upload.bytes, { httpMetadata: { contentType: upload.mimeType } });
    return json({ imageUrl: `/uploads/${fileName}` }, { status: 201 });
  }

  if (method === 'DELETE' && pathname === '/uploads') {
    await requireAdmin(request, env);
    const body = await readJson(request);
    const imageUrl = String((body as any)?.imageUrl || '').trim();
    const key = getUploadKeyFromImageUrl(imageUrl);
    if (!key) {
      return json({ error: 'Only uploaded images can be deleted.' }, { status: 400 });
    }
    if (await isImageUsed(env, imageUrl)) {
      return json({ error: 'Image is still used on the website.' }, { status: 409 });
    }
    await env.UPLOADS.delete(key);
    return noContent();
  }

  if (method === 'POST' && pathname === '/products') {
    await requireAdmin(request, env);
    const input = cleanProductInput(await readJson(request));
    const now = new Date().toISOString();
    const product = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    await env.DB.prepare(
      `INSERT INTO products
       (id, name, description, price, inquire_for_pricing, image_url, category, collection_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        product.id,
        product.name,
        product.description,
        product.price,
        product.inquireForPricing ? 1 : 0,
        product.imageUrl,
        product.category,
        product.collectionId,
        product.createdAt,
        product.updatedAt,
      )
      .run();
    return json(product, { status: 201 });
  }

  if (method === 'PUT' && parts[0] === 'products' && parts[1]) {
    await requireAdmin(request, env);
    const id = parts[1];
    const existing = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
    if (!existing) {
      return json({ error: 'Product not found.' }, { status: 404 });
    }

    const input = cleanProductInput(await readJson(request));
    const updatedAt = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE products
       SET name = ?, description = ?, price = ?, inquire_for_pricing = ?, image_url = ?, category = ?, collection_id = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(
        input.name,
        input.description,
        input.price,
        input.inquireForPricing ? 1 : 0,
        input.imageUrl,
        input.category,
        input.collectionId,
        updatedAt,
        id,
      )
      .run();

    const updatedRow = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
    return json(toCamelProduct(updatedRow));
  }

  if (method === 'DELETE' && parts[0] === 'products' && parts[1]) {
    await requireAdmin(request, env);
    const id = parts[1];
    const existing = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<any>();
    if (!existing) {
      return json({ error: 'Product not found.' }, { status: 404 });
    }
    await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

    const imageUrl = String(existing.image_url || '');
    const key = getUploadKeyFromImageUrl(imageUrl);
    if (key && !(await isImageUsed(env, imageUrl))) {
      await env.UPLOADS.delete(key);
    }

    return noContent();
  }

  return json({ error: 'API route not found.' }, { status: 404 });
}

export const onRequest: any = async (context: any) => {
  try {
    return await handleRequest(context);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    if (status >= 500) {
      console.error(error);
    }
    return json({ error: message }, { status });
  }
};
