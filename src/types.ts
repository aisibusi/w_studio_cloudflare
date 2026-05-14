export interface Product {
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
}

export interface ProductInput {
  name: string;
  description?: string;
  price?: number | null;
  inquireForPricing?: boolean;
  imageUrl: string;
  category?: string;
  collectionId?: string;
}

export interface Inquiry {
  id: string;
  name?: string;
  contact: string;
  question: string;
  createdAt?: string;
}

export interface InquiryInput {
  name?: string;
  contact: string;
  question: string;
}

export interface AppSettings {
  wechatId: string;
  contactMessage: string;
  homeHeroImageUrl: string;
  collectionOrder: string[];
  collectionImageUrls: Record<string, string>;
  productOrder: Record<string, string[]>;
}
