export interface CollectionConfig {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  tagline: string;
  description: string;
  coverImageUrl?: string;
  theme: 'dark' | 'light';
}

export const DEFAULT_COLLECTION_ID = 'supernova';

export const COLLECTIONS: CollectionConfig[] = [
  {
    id: DEFAULT_COLLECTION_ID,
    name: 'SUPERNOVA',
    slug: 'supernova',
    shortName: 'SUPERNOVA',
    tagline: 'Light in Motion',
    description:
      'Born from the depths of water and time, each pearl carries an organic radiance shaped by nature. Handcrafted into fluid forms, Supernova captures the quiet brilliance of light in motion - subtle, rare, and eternally evolving.',
    coverImageUrl: '/collections/supernova.webp',
    theme: 'dark',
  },
  {
    id: 'collection-2',
    name: 'ETERNA PRISM',
    slug: 'eterna-prism',
    shortName: 'ETERNA PRISM',
    tagline: 'Pure Light, Eternal Form',
    description:
      'A study of light at its purest form. Through precise cuts and restrained design, diamonds reveal their eternal geometry - brilliance distilled into clarity, strength, and permanence.',
    coverImageUrl: '/collections/eterna-prism.webp',
    theme: 'light',
  },
  {
    id: 'collection-5',
    name: 'SINGULARITY ATELIER',
    slug: 'singularity-atelier',
    shortName: 'SINGULARITY ATELIER',
    tagline: 'One and Only',
    description:
      'An intimate creation process where each piece begins with a singular vision. Designed and crafted exclusively, every work is a convergence of personal narrative, material, and form - irreproducible, and entirely its own.',
    coverImageUrl: '/collections/singularity-atelier.webp',
    theme: 'light',
  },
  {
    id: 'collection-4',
    name: 'DAO ORIGINS',
    slug: 'dao-origins',
    shortName: 'DAO ORIGINS',
    tagline: 'The Flow of All Things',
    description:
      'Rooted in the philosophy of Dao, this collection reflects the unseen force that flows through all things. Natural jade and elemental materials are shaped with restraint, honoring balance, movement, and becoming.',
    coverImageUrl: '/collections/dao-origins.webp',
    theme: 'light',
  },
  {
    id: 'collection-3',
    name: 'ZODIAC ORBIT',
    slug: 'zodiac-orbit',
    shortName: 'ZODIAC ORBIT',
    tagline: 'Symbols of the Cosmos',
    description:
      'Inspired by celestial patterns and symbolic systems across cultures, this collection explores identity through the language of the cosmos. Each piece serves as a personal emblem - a reflection of destiny, rhythm, and alignment.',
    coverImageUrl: '/collections/zodiac-orbit.webp',
    theme: 'light',
  },
  {
    id: 'collection-7',
    name: 'WOVEN SOUL',
    slug: 'woven-soul',
    shortName: 'WOVEN SOUL',
    tagline: 'Woven Connections',
    description:
      'Threads intertwine as a metaphor for connection, time, and continuity. Handwoven with precision and intuition, each piece reflects the invisible ties that shape our lives.',
    coverImageUrl: '/collections/woven-soul.webp',
    theme: 'light',
  },
  {
    id: 'collection-8',
    name: 'LUXE ACCESSORIES',
    slug: 'luxe-accessories',
    shortName: 'LUXE ACCESSORIES',
    tagline: 'Refined Everyday Objects',
    description:
      'Everyday objects, reimagined through a lens of refinement. These pieces extend the language of jewelry into daily rituals - subtle accents that move with you, carrying intention in motion.',
    coverImageUrl: '/collections/luxe-accessories.webp',
    theme: 'light',
  },
  {
    id: 'collection-6',
    name: 'ATELIER HERITAGE',
    slug: 'atelier-heritage',
    shortName: 'ATELIER HERITAGE',
    tagline: 'Crafted Through Time',
    description:
      'A tribute to time-honored craftsmanship, where traditional techniques are preserved and reinterpreted. Each piece carries the imprint of human touch, memory, and cultural continuity - a quiet luxury shaped across generations.',
    coverImageUrl: '/collections/atelier-heritage.webp',
    theme: 'light',
  },
];

export function getCollectionBySlug(slug: string) {
  return COLLECTIONS.find((collection) => collection.slug === slug);
}

export function getCollectionById(id?: string) {
  return COLLECTIONS.find((collection) => collection.id === id) || COLLECTIONS[0];
}

export function getProductCollectionId(product: { collectionId?: string | null }) {
  return product.collectionId || DEFAULT_COLLECTION_ID;
}
