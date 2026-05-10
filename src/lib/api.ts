import type { AppSettings, Inquiry, InquiryInput, Product, ProductInput } from '../types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = 'Request failed.';
    try {
      const payload = await response.json();
      message = payload.error || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getProducts() {
  return request<Product[]>('/api/products');
}

export function getSiteSettings() {
  return request<AppSettings>('/api/site-settings');
}

export function updateSiteSettings(settings: Partial<AppSettings>) {
  return request<AppSettings>('/api/admin/site-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export function loginAdmin(password: string) {
  return request<{ ok: true }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function getAdminSession() {
  return request<{ ok: true }>('/api/admin/session');
}

export function getInquiries() {
  return request<Inquiry[]>('/api/admin/inquiries');
}

export function logoutAdmin() {
  return request<{ ok: true }>('/api/admin/logout', {
    method: 'POST',
  });
}

export function uploadImage(dataUrl: string) {
  return request<{ imageUrl: string }>('/api/uploads', {
    method: 'POST',
    body: JSON.stringify({ dataUrl }),
  });
}

export function deleteUploadedImage(imageUrl: string) {
  return request<void>('/api/uploads', {
    method: 'DELETE',
    body: JSON.stringify({ imageUrl }),
  });
}

export function createInquiry(inquiry: InquiryInput) {
  return request<{ ok: true }>('/api/inquiries', {
    method: 'POST',
    body: JSON.stringify(inquiry),
  });
}

export function createProduct(product: ProductInput) {
  return request<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export function updateProduct(id: string, product: ProductInput) {
  return request<Product>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export function deleteProduct(id: string) {
  return request<void>(`/api/products/${id}`, {
    method: 'DELETE',
  });
}
