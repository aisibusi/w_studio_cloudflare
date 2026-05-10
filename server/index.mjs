import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import fsSync from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const dataDir = process.env.DATA_DIR || path.join(rootDir, 'data');
const dataFile = path.join(dataDir, 'products.json');
const inquiriesFile = path.join(dataDir, 'inquiries.json');
const settingsFile = path.join(dataDir, 'site-settings.json');
const uploadDir = path.join(dataDir, 'uploads');
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || '666';
const sessionSecret = process.env.SESSION_SECRET || adminPassword;
const sessionMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
const defaultHomeHeroImageUrl = '/collections/hero-w-necklace.webp';
const defaultCollectionOrder = [
  'supernova',
  'collection-2',
  'collection-5',
  'collection-4',
  'collection-3',
  'collection-7',
  'collection-8',
  'collection-6',
];
const defaultSettings = {
  wechatId: 'doudou-zhaowenting',
  contactMessage: 'Tell us which piece you love, and we will respond with availability, details, and styling notes.',
  homeHeroImageUrl: defaultHomeHeroImageUrl,
  collectionOrder: defaultCollectionOrder,
  collectionImageUrls: {},
};

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '15mb' }));

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });
  if (!fsSync.existsSync(dataFile)) {
    await fs.writeFile(dataFile, '[]\n', 'utf8');
  }
  if (!fsSync.existsSync(inquiriesFile)) {
    await fs.writeFile(inquiriesFile, '[]\n', 'utf8');
  }
  if (!fsSync.existsSync(settingsFile)) {
    await fs.writeFile(settingsFile, `${JSON.stringify(defaultSettings, null, 2)}\n`, 'utf8');
  }
}

async function readProducts() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf8');
  const products = JSON.parse(raw);
  return Array.isArray(products) ? products : [];
}

async function writeProducts(products) {
  await ensureStore();
  const tempFile = `${dataFile}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
  await fs.rename(tempFile, dataFile);
}

async function readInquiries() {
  await ensureStore();
  const raw = await fs.readFile(inquiriesFile, 'utf8');
  const inquiries = JSON.parse(raw);
  return Array.isArray(inquiries) ? inquiries : [];
}

async function writeInquiries(inquiries) {
  await ensureStore();
  const tempFile = `${inquiriesFile}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(inquiries, null, 2)}\n`, 'utf8');
  await fs.rename(tempFile, inquiriesFile);
}

function normalizeCollectionOrder(value) {
  const submitted = Array.isArray(value) ? value : [];
  const uniqueValid = submitted.filter((id, index) => defaultCollectionOrder.includes(id) && submitted.indexOf(id) === index);
  return [...uniqueValid, ...defaultCollectionOrder.filter((id) => !uniqueValid.includes(id))];
}

function normalizeCollectionImageUrls(value) {
  const submitted = value && typeof value === 'object' ? value : {};
  return defaultCollectionOrder.reduce((accumulator, collectionId) => {
    const imageUrl = String(submitted[collectionId] || '').trim();
    if (imageUrl) {
      accumulator[collectionId] = imageUrl.slice(0, 2000);
    }
    return accumulator;
  }, {});
}

function normalizeSettings(value = {}) {
  const homeHeroImageUrl = String(value.homeHeroImageUrl || defaultSettings.homeHeroImageUrl).trim();
  const wechatId = String(value.wechatId || defaultSettings.wechatId).trim();
  const contactMessage = String(value.contactMessage || defaultSettings.contactMessage).trim();

  return {
    wechatId: wechatId.slice(0, 120),
    contactMessage: contactMessage.slice(0, 500),
    homeHeroImageUrl: homeHeroImageUrl || defaultSettings.homeHeroImageUrl,
    collectionOrder: normalizeCollectionOrder(value.collectionOrder),
    collectionImageUrls: normalizeCollectionImageUrls(value.collectionImageUrls),
  };
}

async function readSettings() {
  await ensureStore();
  try {
    const raw = await fs.readFile(settingsFile, 'utf8');
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

async function writeSettings(settings) {
  await ensureStore();
  const nextSettings = normalizeSettings(settings);
  const tempFile = `${settingsFile}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(nextSettings, null, 2)}\n`, 'utf8');
  await fs.rename(tempFile, settingsFile);
  return nextSettings;
}

function sortProducts(products) {
  return [...products].sort((a, b) => {
    const left = Date.parse(a.createdAt || '');
    const right = Date.parse(b.createdAt || '');
    return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
  });
}

function sortByCreatedAt(items) {
  return [...items].sort((a, b) => {
    const left = Date.parse(a.createdAt || '');
    const right = Date.parse(b.createdAt || '');
    return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
  });
}

function cleanProductInput(body) {
  const name = String(body?.name || '').trim();
  const imageUrl = String(body?.imageUrl || '').trim();
  const description = String(body?.description || '').trim();
  const category = String(body?.category || 'Supernova Series').trim();
  const collectionId = String(body?.collectionId || 'supernova').trim();
  const inquireForPricing = body?.inquireForPricing === true || String(body?.inquireForPricing || '').toLowerCase() === 'true';
  const rawPrice = body?.price;
  const price = rawPrice === '' || rawPrice == null ? null : Number(rawPrice);

  if (!name) {
    throw Object.assign(new Error('Product name is required.'), { status: 400 });
  }

  if (!imageUrl) {
    throw Object.assign(new Error('Product image URL is required.'), { status: 400 });
  }

  if (!inquireForPricing && (!Number.isFinite(price) || price < 0)) {
    throw Object.assign(new Error('Product price must be a valid number.'), { status: 400 });
  }

  if (!/^[a-z0-9-]{1,80}$/.test(collectionId)) {
    throw Object.assign(new Error('Product collection is invalid.'), { status: 400 });
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

function cleanInquiryInput(body) {
  const name = String(body?.name || '').trim();
  const contact = String(body?.contact || '').trim();
  const question = String(body?.question || '').trim();

  if (!contact) {
    throw Object.assign(new Error('Please leave a contact method.'), { status: 400 });
  }

  if (!question) {
    throw Object.assign(new Error('Please leave your inquiry.'), { status: 400 });
  }

  if (name.length > 100 || contact.length > 200 || question.length > 2000) {
    throw Object.assign(new Error('Inquiry is too long.'), { status: 400 });
  }

  return {
    name,
    contact,
    question,
  };
}

function parseImageUpload(body) {
  const dataUrl = String(body?.dataUrl || '');
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([a-zA-Z0-9+/=]+)$/);

  if (!match) {
    throw Object.assign(new Error('Please upload a JPG, PNG, WebP, or GIF image.'), { status: 400 });
  }

  const mimeType = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  const maxBytes = 8 * 1024 * 1024;

  if (!bytes.length || bytes.length > maxBytes) {
    throw Object.assign(new Error('Image must be smaller than 8 MB.'), { status: 400 });
  }

  const extensionByMime = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  return {
    bytes,
    extension: extensionByMime[mimeType],
  };
}

function resolveUploadedImagePath(imageUrl) {
  const prefix = '/uploads/';
  const value = String(imageUrl || '').trim();

  if (!value.startsWith(prefix)) {
    return null;
  }

  const fileName = value.slice(prefix.length);

  if (!fileName || fileName.includes('/') || fileName.includes('\\')) {
    return null;
  }

  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(fileName)) {
    return null;
  }

  const uploadRoot = path.resolve(uploadDir);
  const filePath = path.resolve(uploadRoot, fileName);
  const relativePath = path.relative(uploadRoot, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}

function isImageUsedByProducts(products, imageUrl, exceptProductId = null) {
  if (!imageUrl) {
    return false;
  }

  return products.some((product) => product.id !== exceptProductId && product.imageUrl === imageUrl);
}

function isImageUsedBySettings(settings, imageUrl) {
  if (!imageUrl) {
    return false;
  }

  return (
    settings.homeHeroImageUrl === imageUrl ||
    Object.values(settings.collectionImageUrls || {}).some((value) => value === imageUrl)
  );
}

async function deleteUploadedImageFile(imageUrl) {
  const filePath = resolveUploadedImagePath(imageUrl);

  if (!filePath) {
    return false;
  }

  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function deleteUploadedImageIfUnused(products, imageUrl, exceptProductId = null) {
  if (!imageUrl || isImageUsedByProducts(products, imageUrl, exceptProductId)) {
    return;
  }

  try {
    await deleteUploadedImageFile(imageUrl);
  } catch (error) {
    console.warn(`Unable to delete unused upload ${imageUrl}:`, error);
  }
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret).update(value).digest('hex');
}

function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + sessionMaxAgeMs })).toString('base64url');
  return `${payload}.${sign(payload)}`;
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

function isSessionValid(token) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature || sign(payload) !== signature) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

function sessionCookie(value, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `wstudio_admin=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

function requireAdmin(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  if (!isSessionValid(cookies.wstudio_admin)) {
    res.status(401).json({ error: 'Admin login required.' });
    return;
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/site-settings', async (_req, res, next) => {
  try {
    res.json(await readSettings());
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', async (_req, res, next) => {
  try {
    res.json(sortProducts(await readProducts()));
  } catch (error) {
    next(error);
  }
});

app.post('/api/inquiries', async (req, res, next) => {
  try {
    const inquiry = {
      id: crypto.randomUUID(),
      ...cleanInquiryInput(req.body),
      createdAt: new Date().toISOString(),
    };
    const inquiries = await readInquiries();
    inquiries.push(inquiry);
    await writeInquiries(sortByCreatedAt(inquiries).slice(0, 500));
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/login', (req, res) => {
  if (String(req.body?.password || '') !== adminPassword) {
    res.status(401).json({ error: 'Incorrect password.' });
    return;
  }

  res.setHeader('Set-Cookie', sessionCookie(createSessionToken(), sessionMaxAgeMs / 1000));
  res.json({ ok: true });
});

app.get('/api/admin/session', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/admin/logout', (_req, res) => {
  res.setHeader('Set-Cookie', sessionCookie('', 0));
  res.json({ ok: true });
});

app.get('/api/admin/inquiries', requireAdmin, async (_req, res, next) => {
  try {
    res.json(sortByCreatedAt(await readInquiries()));
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/site-settings', requireAdmin, async (req, res, next) => {
  try {
    const currentSettings = await readSettings();
    const nextSettings = await writeSettings({
      ...currentSettings,
      ...req.body,
      collectionOrder: req.body?.collectionOrder ?? currentSettings.collectionOrder,
    });
    res.json(nextSettings);
  } catch (error) {
    next(error);
  }
});

app.post('/api/uploads', requireAdmin, async (req, res, next) => {
  try {
    await ensureStore();
    const upload = parseImageUpload(req.body);
    const fileName = `${crypto.randomUUID()}.${upload.extension}`;
    await fs.writeFile(path.join(uploadDir, fileName), upload.bytes);
    res.status(201).json({ imageUrl: `/uploads/${fileName}` });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/uploads', requireAdmin, async (req, res, next) => {
  try {
    const imageUrl = String(req.body?.imageUrl || '').trim();

    if (!resolveUploadedImagePath(imageUrl)) {
      res.status(400).json({ error: 'Only uploaded product images can be deleted.' });
      return;
    }

    const [products, settings] = await Promise.all([readProducts(), readSettings()]);

    if (isImageUsedByProducts(products, imageUrl) || isImageUsedBySettings(settings, imageUrl)) {
      res.status(409).json({ error: 'Image is still used on the website.' });
      return;
    }

    await deleteUploadedImageFile(imageUrl);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/products', requireAdmin, async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const product = {
      id: crypto.randomUUID(),
      ...cleanProductInput(req.body),
      createdAt: now,
      updatedAt: now,
    };
    const products = await readProducts();
    products.push(product);
    await writeProducts(products);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

app.put('/api/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const products = await readProducts();
    const index = products.findIndex((product) => product.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const previousProduct = products[index];
    const updatedProduct = {
      ...previousProduct,
      ...cleanProductInput(req.body),
      updatedAt: new Date().toISOString(),
    };
    products[index] = updatedProduct;
    await writeProducts(products);

    if (previousProduct.imageUrl !== updatedProduct.imageUrl) {
      await deleteUploadedImageIfUnused(products, previousProduct.imageUrl, req.params.id);
    }

    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const products = await readProducts();
    const productToDelete = products.find((product) => product.id === req.params.id);
    const nextProducts = products.filter((product) => product.id !== req.params.id);
    if (!productToDelete) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    await writeProducts(nextProducts);
    await deleteUploadedImageIfUnused(nextProducts, productToDelete.imageUrl);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

await ensureStore();
app.use('/uploads', express.static(uploadDir));

const distIndex = path.join(distDir, 'index.html');
const hasBuiltClient = fsSync.existsSync(distIndex);

if (hasBuiltClient || process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(distIndex);
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root: rootDir,
    appType: 'custom',
    server: { middlewareMode: true },
  });

  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    try {
      const template = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
}

app.use((error, _req, res, _next) => {
  const status = Number(error?.status || 500);
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({ error: message });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`wstudio is running on port ${port}`);
  console.log(`Product data path: ${dataFile}`);
});
