import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { COLLECTIONS } from '../collections';
import { getSiteSettings } from '../lib/api';
import type { AppSettings } from '../types';

const defaultHeroImage = '/collections/hero-w-necklace.webp';

function roman(index: number) {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][index] || String(index + 1);
}

function orderCollections(collectionOrder?: string[]) {
  const order = Array.isArray(collectionOrder) ? collectionOrder : [];
  const ordered = order
    .map((id) => COLLECTIONS.find((collection) => collection.id === id))
    .filter(Boolean) as typeof COLLECTIONS;
  const missing = COLLECTIONS.filter((collection) => !order.includes(collection.id));
  return [...ordered, ...missing];
}

export default function HomePage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    let isMounted = true;

    getSiteSettings()
      .then((nextSettings) => {
        if (isMounted) {
          setSettings(nextSettings);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSettings(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const heroImage = settings?.homeHeroImageUrl || defaultHeroImage;
  const collections = useMemo(() => orderCollections(settings?.collectionOrder), [settings?.collectionOrder]);

  function getCollectionCoverImage(collectionId: string, fallback?: string) {
    return settings?.collectionImageUrls?.[collectionId] || fallback;
  }

  return (
    <main className="min-h-screen bg-white text-[#1A1A1A]">
      <section className="relative min-h-[100svh] overflow-hidden bg-[#0F0F0F] pt-20">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bottom-0 top-20 flex items-center justify-center"
        >
          <div className="absolute inset-0 z-10 bg-black/20" />
          <img
            src={heroImage}
            alt="w studio jewelry"
            className="h-full w-full object-cover object-center brightness-[1.08] contrast-[1.04]"
          />
        </motion.div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-5xl -translate-y-12 flex-col items-center justify-center px-6 text-center text-white md:-translate-y-16">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 font-sans text-[10px] font-semibold uppercase tracking-[0.42em] text-white/85 drop-shadow-[0_1px_12px_rgba(0,0,0,0.25)]"
          >
            Beijing &middot; Austin &middot; New York
          </motion.p>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl font-display text-3xl font-light leading-[1.12] tracking-normal drop-shadow-[0_2px_20px_rgba(0,0,0,0.22)] sm:text-4xl md:text-5xl lg:text-6xl"
          >
            Formed by Nature.
            <br />
            <span className="italic">Refined by Time.</span>
          </motion.h1>

          <motion.a
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            href="#collection"
            className="mt-10 inline-flex min-w-[260px] items-center justify-center gap-4 border border-white/35 bg-white/20 px-8 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-white backdrop-blur-sm transition-all duration-500 hover:bg-white hover:text-[#1A1A1A] sm:min-w-[300px]"
          >
            Explore Collections
            <ArrowRight size={14} />
          </motion.a>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2"
        >
          <div className="relative h-12 w-px overflow-hidden bg-white/35">
            <motion.div
              animate={{ y: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="absolute inset-0 bg-white"
            />
          </div>
        </motion.div>
      </section>

      <section id="collection" className="scroll-mt-20 bg-[#FDFCFB] px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-4 block font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-[#C5A059]">
                Collection Index
              </span>
              <h2 className="font-display text-4xl font-light tracking-tight text-[#1A1A1A] md:text-6xl">
                Curated Archive
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-gray-500">
              Eight distinct expressions of jewelry, material memory, and quiet celestial movement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {collections.map((collection, index) => (
              <motion.a
                key={collection.id}
                href={`/collections/${collection.slug}`}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="group relative min-h-[380px] overflow-hidden border border-[#E5E2DE] bg-[#111] p-6 text-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
              >
                {getCollectionCoverImage(collection.id, collection.coverImageUrl) ? (
                  <img
                    src={getCollectionCoverImage(collection.id, collection.coverImageUrl)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-90 brightness-[1.12] contrast-[1.06] saturate-[1.04] transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                <div className="relative z-10 flex h-full min-h-[332px] flex-col justify-between">
                  <span className="font-accent text-xs font-semibold tracking-[0.3em] text-white/60">
                    {roman(index)}
                  </span>
                  <div>
                    <h3 className="mb-4 font-display text-3xl font-light leading-tight tracking-tight">
                      {collection.shortName}
                    </h3>
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-[#C5A059]">
                      {collection.tagline}
                    </p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
