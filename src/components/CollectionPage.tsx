import Hero from './Hero';
import ProductGrid from './ProductGrid';
import type { CollectionConfig } from '../collections';
import { DEFAULT_COLLECTION_ID } from '../collections';

interface CollectionPageProps {
  collection: CollectionConfig;
  onInquiryClick: (productName?: string) => void;
}

export default function CollectionPage({ collection, onInquiryClick }: CollectionPageProps) {
  const isSupernova = collection.id === DEFAULT_COLLECTION_ID;

  if (isSupernova) {
    return (
      <main className="min-h-screen bg-[#0A0A0A]">
        <Hero
          description={collection.description}
          imageUrl={collection.coverImageUrl || '/hero.png?v=collection-fallback'}
          tagline={collection.tagline}
          title={collection.shortName}
        />
        <ProductGrid
          collectionId={collection.id}
          collectionName={collection.name}
          onInquiryClick={onInquiryClick}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-20 text-[#1A1A1A]">
      <section className="mx-auto flex min-h-[68vh] max-w-7xl flex-col justify-center px-6 py-24 md:px-12">
        <div className="max-w-3xl border-t border-[#E5E2DE] pt-12">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.34em] text-[#C5A059]">
            {collection.tagline}
          </p>
          <h1 className="mt-8 font-display text-6xl font-light leading-[0.95] md:text-8xl">
            {collection.shortName}
          </h1>
          <p className="mt-10 max-w-xl text-sm leading-8 text-[#5F5A55]">{collection.description}</p>
        </div>
      </section>

      <ProductGrid
        collectionId={collection.id}
        collectionName={collection.name}
        onInquiryClick={onInquiryClick}
      />
    </main>
  );
}
