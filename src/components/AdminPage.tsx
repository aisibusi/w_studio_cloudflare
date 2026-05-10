import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Edit3,
  GripVertical,
  Home,
  ImagePlus,
  Lock,
  LogIn,
  LogOut,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  createProduct,
  deleteUploadedImage,
  deleteProduct,
  getAdminSession,
  getInquiries,
  getSiteSettings,
  getProducts,
  loginAdmin,
  logoutAdmin,
  updateProduct,
  updateSiteSettings,
  uploadImage,
} from '../lib/api';
import { COLLECTIONS, DEFAULT_COLLECTION_ID, getCollectionById, getProductCollectionId } from '../collections';
import type { AppSettings, Inquiry, Product, ProductInput } from '../types';

type FormState = {
  name: string;
  price: string;
  inquireForPricing: boolean;
  imageUrl: string;
  description: string;
  collectionId: string;
};

const emptyForm: FormState = {
  name: '',
  price: '',
  inquireForPricing: false,
  imageUrl: '',
  description: '',
  collectionId: DEFAULT_COLLECTION_ID,
};

function toInput(form: FormState): ProductInput {
  const collection = getCollectionById(form.collectionId);
  return {
    name: form.name,
    price: form.inquireForPricing ? null : Number(form.price),
    inquireForPricing: form.inquireForPricing,
    imageUrl: form.imageUrl,
    description: form.description,
    category: collection.name,
    collectionId: form.collectionId,
  };
}

function formatDate(value?: string) {
  if (!value) {
    return 'New inquiry';
  }

  return new Date(value).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatProductPrice(product: Product) {
  return product.inquireForPricing ? 'Inquire for pricing' : `USD ${(product.price ?? 0).toLocaleString()}`;
}

function defaultSiteSettings(): AppSettings {
  return {
    wechatId: 'doudou-zhaowenting',
    contactMessage: 'Tell us which piece you love, and we will respond with availability, details, and styling notes.',
    homeHeroImageUrl: '/collections/hero-w-necklace.webp',
    collectionOrder: COLLECTIONS.map((collection) => collection.id),
    collectionImageUrls: {},
  };
}

function normalizeCollectionOrder(order?: string[]) {
  const submitted = Array.isArray(order) ? order : [];
  const uniqueValid = submitted.filter(
    (id, index) => COLLECTIONS.some((collection) => collection.id === id) && submitted.indexOf(id) === index,
  );
  return [...uniqueValid, ...COLLECTIONS.map((collection) => collection.id).filter((id) => !uniqueValid.includes(id))];
}

function normalizeCollectionImageUrls(value?: Record<string, string>) {
  const submitted = value && typeof value === 'object' ? value : {};
  return COLLECTIONS.reduce<Record<string, string>>((accumulator, collection) => {
    const imageUrl = String(submitted[collection.id] || '').trim();
    if (imageUrl) {
      accumulator[collection.id] = imageUrl;
    }
    return accumulator;
  }, {});
}

function getCollectionCoverPreview(collectionId: string, settings: AppSettings) {
  return settings.collectionImageUrls?.[collectionId] || getCollectionById(collectionId).coverImageUrl || '';
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'homepage' | 'inquiries'>('products');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [siteSettings, setSiteSettings] = useState<AppSettings>(defaultSiteSettings());
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [uploadingCollectionImageId, setUploadingCollectionImageId] = useState<string | null>(null);
  const [savingHomepage, setSavingHomepage] = useState(false);
  const [draggingCollectionId, setDraggingCollectionId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const archiveLabel = useMemo(() => `${products.length} piece${products.length === 1 ? '' : 's'}`, [products.length]);
  const selectedCollection = useMemo(() => getCollectionById(form.collectionId), [form.collectionId]);
  const selectedCollectionUrl = `/collections/${selectedCollection.slug}`;
  const selectedCollectionTheme = selectedCollection.theme === 'dark' ? 'dark Supernova-style archive' : 'light editorial archive';
  const orderedCollections = useMemo(
    () => normalizeCollectionOrder(siteSettings.collectionOrder).map((id) => getCollectionById(id)),
    [siteSettings.collectionOrder],
  );
  const sortedInquiries = useMemo(
    () =>
      [...inquiries].sort(
        (left, right) =>
          new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
      ),
    [inquiries],
  );

  async function loadDashboard() {
    setProductsLoading(true);
    setMessage('');
    try {
      const [nextProducts, nextInquiries, nextSettings] = await Promise.all([
        getProducts(),
        getInquiries(),
        getSiteSettings(),
      ]);
      setProducts(nextProducts);
      setInquiries(nextInquiries);
      setSiteSettings({
        ...nextSettings,
        collectionOrder: normalizeCollectionOrder(nextSettings.collectionOrder),
        collectionImageUrls: normalizeCollectionImageUrls(nextSettings.collectionImageUrls),
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load dashboard.');
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    getAdminSession()
      .then(() => {
        if (isMounted) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError('');

    try {
      await loginAdmin(password);
      setPassword('');
      setIsAuthenticated(true);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed.');
    }
  }

  function getEditingProduct() {
    return editingId ? products.find((product) => product.id === editingId) : undefined;
  }

  function isSavedProductImage(imageUrl: string) {
    const editingProduct = getEditingProduct();
    return Boolean(editingProduct && editingProduct.imageUrl === imageUrl);
  }

  async function deleteDraftImage(imageUrl: string) {
    if (!imageUrl || isSavedProductImage(imageUrl)) {
      return;
    }

    try {
      await deleteUploadedImage(imageUrl);
    } catch {
      // The server keeps images that are already attached to products.
    }
  }

  function closeEditor() {
    setForm(emptyForm);
    setEditingId(null);
    setIsEditorOpen(false);
    setMessage('');
  }

  async function discardForm() {
    await deleteDraftImage(form.imageUrl);
    closeEditor();
  }

  async function handleLogout() {
    await deleteDraftImage(form.imageUrl);
    await logoutAdmin();
    setIsAuthenticated(false);
    setProducts([]);
    setInquiries([]);
    setSiteSettings(defaultSiteSettings());
    closeEditor();
  }

  function startNew() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage('');
    setIsEditorOpen(true);
  }

  function startEdit(product: Product) {
    setForm({
      name: product.name,
      price: product.price == null ? '' : String(product.price),
      inquireForPricing: Boolean(product.inquireForPricing),
      imageUrl: product.imageUrl,
      description: product.description || '',
      collectionId: getProductCollectionId(product),
    });
    setEditingId(product.id);
    setMessage('');
    setIsEditorOpen(true);
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Unable to read this image.'));
      reader.readAsDataURL(file);
    });
  }

  async function handleImageFile(file?: File) {
    if (!file) {
      return;
    }

    const previousImageUrl = form.imageUrl;
    setUploadingImage(true);
    setMessage('');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploaded = await uploadImage(dataUrl);
      setForm((current) => ({ ...current, imageUrl: uploaded.imageUrl }));
      if (previousImageUrl && previousImageUrl !== uploaded.imageUrl) {
        await deleteDraftImage(previousImageUrl);
      }
      setMessage(`Image uploaded. It will appear in ${getCollectionById(form.collectionId).name} on the collection product grid, product card, product detail modal, inquiry context, and admin archive thumbnail after you save this piece.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to upload image.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage() {
    const imageUrl = form.imageUrl;
    setForm((current) => ({ ...current, imageUrl: '' }));
    await deleteDraftImage(imageUrl);
    setMessage('Image removed. Upload a new one before saving.');
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      if (!form.imageUrl) {
        throw new Error('Please upload a product image.');
      }

      if (!form.inquireForPricing && !form.price.trim()) {
        throw new Error('Please enter a price or select Inquire for pricing.');
      }

      const successMessage = editingId ? 'Piece updated.' : 'Piece added.';

      if (editingId) {
        await updateProduct(editingId, toInput(form));
      } else {
        await createProduct(toInput(form));
      }
      closeEditor();
      await loadDashboard();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this piece from the archive?')) {
      return;
    }

    try {
      await deleteProduct(id);
      await loadDashboard();
      setMessage('Piece deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete product.');
    }
  }


  async function handleHeroImageFile(file?: File) {
    if (!file) {
      return;
    }

    setUploadingHeroImage(true);
    setMessage('');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploaded = await uploadImage(dataUrl);
      setSiteSettings((current) => ({ ...current, homeHeroImageUrl: uploaded.imageUrl }));
      setMessage('Homepage hero image uploaded. Click Save Homepage Changes to publish it on the live homepage.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to upload homepage image.');
    } finally {
      setUploadingHeroImage(false);
    }
  }

  async function handleCollectionImageFile(collectionId: string, file?: File) {
    if (!file) {
      return;
    }

    const collection = getCollectionById(collectionId);
    setUploadingCollectionImageId(collectionId);
    setMessage('');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploaded = await uploadImage(dataUrl);
      setSiteSettings((current) => ({
        ...current,
        collectionImageUrls: {
          ...normalizeCollectionImageUrls(current.collectionImageUrls),
          [collectionId]: uploaded.imageUrl,
        },
      }));
      setMessage(`${collection.name} category cover image uploaded. Click Save Homepage Changes to publish it on the homepage collection card.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to upload category image.');
    } finally {
      setUploadingCollectionImageId(null);
    }
  }

  function resetCollectionImage(collectionId: string) {
    setSiteSettings((current) => {
      const nextImages = normalizeCollectionImageUrls(current.collectionImageUrls);
      delete nextImages[collectionId];
      return { ...current, collectionImageUrls: nextImages };
    });
    setMessage('Category cover reset to the original built-in image. Click Save Homepage Changes to publish it.');
  }

  function moveCollection(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      return;
    }

    setSiteSettings((current) => {
      const order = normalizeCollectionOrder(current.collectionOrder);
      const sourceIndex = order.indexOf(sourceId);
      const targetIndex = order.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }
      const nextOrder = [...order];
      const [moved] = nextOrder.splice(sourceIndex, 1);
      nextOrder.splice(targetIndex, 0, moved);
      return { ...current, collectionOrder: nextOrder };
    });
  }

  function moveCollectionByStep(collectionId: string, direction: -1 | 1) {
    setSiteSettings((current) => {
      const order = normalizeCollectionOrder(current.collectionOrder);
      const index = order.indexOf(collectionId);
      const nextIndex = index + direction;
      if (index === -1 || nextIndex < 0 || nextIndex >= order.length) {
        return current;
      }
      const nextOrder = [...order];
      const [moved] = nextOrder.splice(index, 1);
      nextOrder.splice(nextIndex, 0, moved);
      return { ...current, collectionOrder: nextOrder };
    });
  }

  async function handleSaveHomepage() {
    setSavingHomepage(true);
    setMessage('');

    try {
      const saved = await updateSiteSettings({
        homeHeroImageUrl: siteSettings.homeHeroImageUrl,
        collectionOrder: normalizeCollectionOrder(siteSettings.collectionOrder),
        collectionImageUrls: normalizeCollectionImageUrls(siteSettings.collectionImageUrls),
      });
      setSiteSettings({
        ...saved,
        collectionOrder: normalizeCollectionOrder(saved.collectionOrder),
        collectionImageUrls: normalizeCollectionImageUrls(saved.collectionImageUrls),
      });
      setMessage('Homepage updated. The main photo, category cover images, and collection order are now live.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save homepage changes.');
    } finally {
      setSavingHomepage(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDFCFB] text-[#1A1A1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-12 animate-pulse bg-[#C5A059]" />
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-gray-400">
            Loading Bureau
          </span>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDFCFB] px-6 text-[#1A1A1A]">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md border border-[#E5E2DE] bg-white p-8 shadow-sm md:p-10"
        >
          <a
            href="/"
            className="mb-10 inline-flex items-center gap-3 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 transition-colors hover:text-[#C5A059]"
          >
            <ArrowLeft size={14} />
            Storefront
          </a>

          <div className="mb-10">
            <span className="mb-3 block font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-[#C5A059]">
              Terminal Access
            </span>
            <h1 className="font-display text-5xl font-light tracking-tight text-[#1A1A1A]">
              Studio Command
            </h1>
          </div>

          <label className="block space-y-3">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
              Password
            </span>
            <div className="flex items-center border border-[#E5E2DE] bg-[#FDFCFB]">
              <Lock className="ml-4 text-[#C5A059]" size={16} strokeWidth={1.6} />
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent px-4 py-4 text-sm text-[#1A1A1A] outline-none"
                placeholder="Enter studio password"
              />
            </div>
          </label>

          {loginError ? <p className="mt-4 text-xs text-red-500">{loginError}</p> : null}

          <button className="mt-8 flex w-full items-center justify-center gap-3 bg-[#1A1A1A] py-4 font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-[#C5A059]">
            <LogIn size={14} />
            Enter Archive
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFCFB] px-6 py-14 text-[#1A1A1A] md:px-12 md:py-20">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex flex-col items-start justify-between gap-10 border-b border-[#E5E2DE] pb-12 md:flex-row md:items-end">
          <div>
            <a
              href="/"
              className="mb-6 inline-flex items-center gap-3 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 transition-colors hover:text-[#C5A059]"
            >
              <ArrowLeft size={14} />
              Storefront
            </a>
            <span className="mb-3 block font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-[#C5A059]">
              Terminal Access
            </span>
            <h1 className="font-display text-4xl font-light tracking-tight text-[#1A1A1A] md:text-5xl">
              Studio Command Bureau
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-gray-500">
              Manage archive pieces, collection assignment, uploaded visuals, and client inquiries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-full border border-[#E5E2DE] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-3 rounded-full px-6 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'products' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-[#1A1A1A]/50 hover:bg-[#FDFCFB]'
                }`}
              >
                <Package size={14} />
                Pieces
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('homepage')}
                className={`flex items-center gap-3 rounded-full px-6 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'homepage' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-[#1A1A1A]/50 hover:bg-[#FDFCFB]'
                }`}
              >
                <Home size={14} />
                Homepage
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inquiries')}
                className={`flex items-center gap-3 rounded-full px-6 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'inquiries' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-[#1A1A1A]/50 hover:bg-[#FDFCFB]'
                }`}
              >
                <MessageSquare size={14} />
                Inquiries
                {inquiries.length > 0 ? <span className="h-2 w-2 rounded-full bg-[#C5A059]" /> : null}
              </button>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="flex h-11 w-11 items-center justify-center border border-[#E5E2DE] bg-white text-[#1A1A1A]/45 transition-colors hover:border-[#C5A059] hover:text-[#C5A059]"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center border border-[#E5E2DE] bg-white text-[#1A1A1A]/45 transition-colors hover:border-[#C5A059] hover:text-[#C5A059]"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {message ? (
          <div className="mb-8 border-l-2 border-[#C5A059] bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
            {message}
          </div>
        ) : null}

        {activeTab === 'products' ? (
          <section className="space-y-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">
                Archive Items ({archiveLabel})
              </h2>
              <button
                type="button"
                onClick={startNew}
                className="flex w-fit items-center gap-3 bg-[#C5A059] px-6 py-3 font-sans text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-[#1A1A1A]"
              >
                <Plus size={16} />
                New Entry
              </button>
            </div>

            <div className="overflow-x-auto border border-[#E5E2DE] bg-white shadow-sm">
              <table className="w-full min-w-[880px] border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E2DE] bg-[#FDFCFB]">
                    <th className="px-8 py-5 text-left font-sans text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                      Visual
                    </th>
                    <th className="px-8 py-5 text-left font-sans text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                      Piece Narrative
                    </th>
                    <th className="px-8 py-5 text-left font-sans text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                      Collection
                    </th>
                    <th className="px-8 py-5 text-left font-sans text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                      Valuation
                    </th>
                    <th className="px-8 py-5 text-right font-sans text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DE]">
                  {productsLoading ? (
                    [1, 2, 3].map((item) => (
                      <tr key={item}>
                        <td colSpan={5} className="px-8 py-8">
                          <div className="h-16 animate-pulse bg-[#F3F0EA]" />
                        </td>
                      </tr>
                    ))
                  ) : products.length ? (
                    products.map((product) => (
                      <tr key={product.id} className="group transition-colors hover:bg-[#FDFCFB]">
                        <td className="px-8 py-6">
                          <div className="h-20 w-16 overflow-hidden border border-[#E5E2DE] bg-zinc-100 shadow-sm">
                            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                          </div>
                        </td>
                        <td className="max-w-sm px-8 py-6">
                          <p className="mb-1 text-sm font-semibold text-[#1A1A1A]">{product.name}</p>
                          <p className="line-clamp-2 text-[11px] leading-relaxed text-gray-400">
                            {product.description || 'No narrative recorded.'}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="border border-[#E5E2DE] bg-[#FDFCFB] px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
                            {getCollectionById(getProductCollectionId(product)).name || product.category || 'Collection'}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-accent text-sm font-semibold text-[#C5A059]">
                          {formatProductPrice(product)}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-6 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => startEdit(product)}
                              className="p-2 transition-all hover:bg-[#1A1A1A] hover:text-white"
                              title="Edit"
                            >
                              <Edit3 size={16} strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-500 transition-all hover:bg-red-500 hover:text-white"
                              title="Delete"
                            >
                              <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <p className="font-display text-2xl italic text-[#1A1A1A]/35">Archive is empty</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : activeTab === 'homepage' ? (
          <section className="space-y-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">
                  Homepage Controls
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
                  Upload the main homepage photo, change each collection/category cover image, and drag collection/category cards into the order you want visitors to see.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSaveHomepage()}
                disabled={savingHomepage || uploadingHeroImage || Boolean(uploadingCollectionImageId)}
                className="flex w-fit items-center gap-3 bg-[#C5A059] px-6 py-3 font-sans text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-[#1A1A1A] disabled:opacity-60"
              >
                <Save size={14} />
                {savingHomepage ? 'Saving' : 'Save Homepage Changes'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <section className="border border-[#E5E2DE] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-light text-[#1A1A1A]">Homepage Main Photo</h3>
                    <p className="mt-2 text-xs leading-6 text-gray-500">
                      This image appears at the very top of the homepage, behind the “Formed by Nature. Refined by Time.” headline.
                    </p>
                  </div>
                  <span className="font-sans text-[9px] font-bold uppercase tracking-[0.24em] text-[#C5A059]">
                    Homepage Hero
                  </span>
                </div>

                <div className="group relative aspect-[16/11] overflow-hidden border border-[#E5E2DE] bg-[#FDFCFB]">
                  <img src={siteSettings.homeHeroImageUrl} alt="Homepage hero preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 p-8 opacity-0 transition-opacity group-hover:opacity-100">
                    <label className="flex cursor-pointer items-center justify-center gap-3 bg-white px-8 py-4 font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] shadow-xl transition-all hover:bg-[#C5A059] hover:text-white">
                      <Upload size={16} />
                      {uploadingHeroImage ? 'Processing...' : 'Upload Homepage Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => void handleHeroImageFile(event.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-5 rounded-sm border border-[#E5E2DE] bg-[#FDFCFB] p-4">
                  <p className="font-sans text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A1A1A]/40">
                    Where this photo appears
                  </p>
                  <p className="mt-2 text-xs leading-6 text-gray-500">
                    It is the full-screen homepage opening image on <span className="font-semibold text-[#1A1A1A]">/</span>. Uploading only prepares the image; click Save Homepage Changes to publish it.
                  </p>
                </div>
              </section>

              <section className="border border-[#E5E2DE] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-light text-[#1A1A1A]">Collection / Category Cards</h3>
                    <p className="mt-2 text-xs leading-6 text-gray-500">
                      Drag each row to reorder homepage cards, and upload a separate cover image for each category card.
                    </p>
                  </div>
                  <span className="font-sans text-[9px] font-bold uppercase tracking-[0.24em] text-[#C5A059]">
                    Drag + upload covers
                  </span>
                </div>

                <div className="space-y-3">
                  {orderedCollections.map((collection, index) => (
                    <div
                      key={collection.id}
                      draggable
                      onDragStart={() => setDraggingCollectionId(collection.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggingCollectionId) {
                          moveCollection(draggingCollectionId, collection.id);
                        }
                        setDraggingCollectionId(null);
                      }}
                      onDragEnd={() => setDraggingCollectionId(null)}
                      className={`flex items-center gap-4 border p-4 transition-all ${
                        draggingCollectionId === collection.id
                          ? 'border-[#C5A059] bg-[#FDFCFB] opacity-60'
                          : 'border-[#E5E2DE] bg-white hover:border-[#C5A059]'
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#E5E2DE] bg-[#FDFCFB] font-accent text-xs text-[#C5A059]">
                        {index + 1}
                      </div>
                      <GripVertical className="shrink-0 text-[#1A1A1A]/30" size={18} />
                      <div className="h-16 w-16 shrink-0 overflow-hidden bg-zinc-100">
                        {getCollectionCoverPreview(collection.id, siteSettings) ? (
                          <img
                            src={getCollectionCoverPreview(collection.id, siteSettings)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1A1A1A]">{collection.name}</p>
                        <p className="truncate text-xs text-gray-400">/{collection.slug} · {collection.tagline}</p>
                        <p className="mt-1 text-[11px] leading-5 text-gray-400">
                          This cover appears on the homepage collection/category card. Product images are managed separately in Pieces.
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 md:flex-row">
                        <label className="flex cursor-pointer items-center justify-center gap-2 border border-[#E5E2DE] px-3 py-2 font-sans text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/55 transition-colors hover:border-[#C5A059] hover:text-[#C5A059]">
                          <Upload size={13} />
                          {uploadingCollectionImageId === collection.id ? 'Uploading' : 'Cover'}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => void handleCollectionImageFile(collection.id, event.target.files?.[0])}
                          />
                        </label>
                        {siteSettings.collectionImageUrls?.[collection.id] ? (
                          <button
                            type="button"
                            onClick={() => resetCollectionImage(collection.id)}
                            className="border border-[#E5E2DE] px-3 py-2 text-xs text-[#1A1A1A]/50 transition-colors hover:border-[#C5A059] hover:text-[#C5A059]"
                            title="Reset to built-in cover"
                          >
                            Reset
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => moveCollectionByStep(collection.id, -1)}
                          disabled={index === 0}
                          className="border border-[#E5E2DE] px-3 py-2 text-xs disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCollectionByStep(collection.id, 1)}
                          disabled={index === orderedCollections.length - 1}
                          className="border border-[#E5E2DE] px-3 py-2 text-xs disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        ) : (
          <section className="space-y-8">
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">
              Incoming Inquiries ({inquiries.length})
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {productsLoading ? (
                [1, 2].map((item) => <div key={item} className="h-36 animate-pulse border border-[#E5E2DE] bg-white" />)
              ) : sortedInquiries.length ? (
                sortedInquiries.map((inquiry) => (
                  <article
                    key={inquiry.id}
                    className="group flex flex-col gap-10 border border-[#E5E2DE] bg-white p-8 transition-colors duration-500 hover:border-[#C5A059] md:flex-row md:p-10"
                  >
                    <div className="flex flex-col gap-6 md:w-64">
                      <div className="space-y-1">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                          Client
                        </p>
                        <p className="font-display text-lg text-[#1A1A1A]">{inquiry.name || 'Anonymous Client'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                          Contact Method
                        </p>
                        <p className="font-accent text-sm font-medium text-[#C5A059]">{inquiry.contact}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                          Communication Date
                        </p>
                        <p className="font-accent text-[11px] text-[#1A1A1A]/60">{formatDate(inquiry.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#C5A059]" />
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                          Message Bureau
                        </span>
                      </div>
                      <p className="text-base font-light italic leading-relaxed text-gray-600">
                        &quot;{inquiry.question}&quot;
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="border border-dashed border-[#E5E2DE] bg-white py-20 text-center">
                  <p className="font-display text-2xl italic text-[#1A1A1A]/35">No communications received.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#0F0F0F]/80 backdrop-blur-md"
            onClick={() => void discardForm()}
            aria-label="Close editor"
          />

          <form
            onSubmit={handleSave}
            className="relative flex h-full max-h-[88vh] w-full max-w-4xl flex-col border border-[#E5E2DE] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E5E2DE] bg-[#FDFCFB] p-6 md:p-8">
              <h3 className="font-display text-2xl font-light">
                {editingId ? 'Refine Piece Data' : 'Archive New Piece'}
              </h3>
              <button
                type="button"
                onClick={() => void discardForm()}
                className="text-[#1A1A1A]/35 transition-opacity hover:text-[#1A1A1A]"
                aria-label="Close editor"
              >
                <X size={20} strokeWidth={1.2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12">
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
                <div className="space-y-7">
                  <label className="block space-y-3">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                      Piece Title
                    </span>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      className="w-full border border-[#E5E2DE] bg-[#FDFCFB] px-5 py-4 text-sm outline-none transition-colors focus:border-[#C5A059]"
                      placeholder="Supernova No. 01"
                    />
                  </label>

                  <label className="block space-y-3">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                      Series Archive
                    </span>
                    <select
                      required
                      value={form.collectionId}
                      onChange={(event) => setForm({ ...form, collectionId: event.target.value })}
                      className="w-full border border-[#E5E2DE] bg-[#FDFCFB] px-5 py-4 text-sm outline-none transition-colors focus:border-[#C5A059]"
                    >
                      {COLLECTIONS.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs leading-6 text-gray-500">
                      Uploaded product images for this entry will show under{' '}
                      <a href={selectedCollectionUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#C5A059] underline-offset-4 hover:underline">
                        {selectedCollection.name}
                      </a>{' '}
                      on the public collection page.
                    </p>
                  </label>

                  <div className="space-y-3">
                    <label className="block space-y-3">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                        Current Valuation
                      </span>
                      <input
                        required={!form.inquireForPricing}
                        min="0"
                        step="0.01"
                        type="number"
                        value={form.price}
                        disabled={form.inquireForPricing}
                        onChange={(event) => setForm({ ...form, price: event.target.value })}
                        className="w-full border border-[#E5E2DE] bg-[#FDFCFB] px-5 py-4 font-accent text-sm outline-none transition-colors focus:border-[#C5A059] disabled:opacity-45"
                        placeholder="2800"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 border border-[#E5E2DE] bg-[#FDFCFB] px-5 py-4">
                      <input
                        type="checkbox"
                        checked={form.inquireForPricing}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            inquireForPricing: event.target.checked,
                            price: event.target.checked ? '' : form.price,
                          })
                        }
                        className="h-4 w-4 accent-[#C5A059]"
                      />
                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A1A1A]/60">
                        Inquire for pricing
                      </span>
                    </label>
                  </div>

                  <label className="block space-y-3">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                      Narrative Description
                    </span>
                    <textarea
                      rows={6}
                      value={form.description}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                      className="w-full resize-none border border-[#E5E2DE] bg-[#FDFCFB] px-5 py-4 text-sm leading-relaxed outline-none transition-colors focus:border-[#C5A059]"
                      placeholder="Handcrafted sterling silver with sapphire setting..."
                    />
                  </label>
                </div>

                <div className="space-y-7">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
                        Product Image
                      </span>
                      <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                        Shows in {selectedCollection.name}
                      </span>
                    </div>

                  <div className="group relative aspect-[4/5] overflow-hidden border border-[#E5E2DE] bg-[#FDFCFB]">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-300">
                        <ImagePlus size={34} strokeWidth={1.2} />
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em]">
                          No Image Data
                        </span>
                      </div>
                    )}

                    <div
                      className={`absolute inset-0 flex items-center justify-center p-8 transition-opacity ${
                        form.imageUrl ? 'bg-black/40 opacity-0 group-hover:opacity-100' : 'bg-transparent opacity-100'
                      }`}
                    >
                      <label className="flex w-full cursor-pointer items-center justify-center gap-3 bg-white py-4 font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] shadow-xl transition-all hover:bg-[#C5A059] hover:text-white">
                        <Upload size={16} />
                        {uploadingImage ? 'Processing...' : 'Upload Master Asset'}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) => handleImageFile(event.target.files?.[0])}
                        />
                      </label>
                    </div>

                    {form.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveImage()}
                        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center bg-white/90 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                        title="Remove image"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>

                    <div className="rounded-sm border border-[#E5E2DE] bg-white p-4">
                      <p className="mb-3 font-sans text-[9px] font-bold uppercase tracking-[0.24em] text-[#1A1A1A]/40">
                        Where this image appears after saving
                      </p>
                      <ul className="space-y-2 text-xs leading-6 text-gray-500">
                        <li>• Public collection page: <span className="font-semibold text-[#1A1A1A]">{selectedCollection.name}</span> product archive grid.</li>
                        <li>• Product card thumbnail and hover/click presentation.</li>
                        <li>• Product detail modal large image.</li>
                        <li>• Inquiry drawer product context when a client asks about this piece.</li>
                        <li>• Admin product list thumbnail.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-l-2 border-[#C5A059] bg-[#FDFCFB] p-6">
                    <p className="font-sans text-[9px] uppercase leading-relaxed tracking-[0.2em] text-gray-500">
                      Upload one main product visual for this piece. It will be saved to the Railway volume and displayed in the {selectedCollectionTheme}. Recommended: square or vertical image, clean background, clear jewelry details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-4 border-t border-[#E5E2DE] bg-[#FDFCFB] p-6 sm:flex-row md:p-8">
              <button
                type="button"
                onClick={() => void discardForm()}
                className="border border-[#E5E2DE] px-8 py-4 font-sans text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="flex items-center justify-center gap-3 bg-[#1A1A1A] px-10 py-4 font-sans text-[10px] font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:bg-[#C5A059] disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? 'Committing' : 'Commit to Archive'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
