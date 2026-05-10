import { motion, type Variants } from 'motion/react';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import { getProducts } from '../lib/api';
import { DEFAULT_COLLECTION_ID, getProductCollectionId } from '../collections';
import type { Product } from '../types';

interface ProductGridProps {
  collectionId?: string;
  collectionName?: string;
  onInquiryClick: (productName?: string) => void;
}

const productGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

function getIsMultiColumnViewport() {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.matchMedia('(min-width: 768px)').matches;
}

export default function ProductGrid({
  collectionId = DEFAULT_COLLECTION_ID,
  collectionName = 'Supernova Collection',
  onInquiryClick,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<null | Product>(null);
  const [isMultiColumnViewport, setIsMultiColumnViewport] = useState(getIsMultiColumnViewport);
  const isSupernova = collectionId === DEFAULT_COLLECTION_ID;

  useEffect(() => {
    let isMounted = true;

    getProducts()
      .then((items) => {
        if (isMounted) {
          setProducts(items);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load collection.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncViewport = () => setIsMultiColumnViewport(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);

    return () => {
      mediaQuery.removeEventListener('change', syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto px-4 py-24 ${isSupernova ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className={`aspect-[4/5] mb-6 ${isSupernova ? 'bg-white/5' : 'bg-[#E5E2DE]'}`} />
            <div className={`h-4 w-1/2 mb-2 ${isSupernova ? 'bg-white/5' : 'bg-[#E5E2DE]'}`} />
            <div className={`h-3 w-1/4 ${isSupernova ? 'bg-white/5' : 'bg-[#E5E2DE]'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24 text-red-300 font-light uppercase tracking-widest">
        {error}
      </div>
    );
  }

  const collectionProducts = products.filter((product) => getProductCollectionId(product) === collectionId);
  return (
    <>
      <section
        id="collection-pieces"
        className={`max-w-7xl mx-auto px-6 py-32 ${isSupernova ? 'bg-[#0A0A0A]' : 'bg-white'}`}
      >
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-4 mb-4"
            >
              <div className="h-[1px] w-8 bg-[#D4AF37]"></div>
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37] font-bold">Archives</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 1, delay: 0.12 }}
              className={`text-5xl md:text-7xl font-display leading-none ${isSupernova ? 'text-[#E0D8D0]' : 'text-[#1A1A1A]'}`}
            >
              {isSupernova ? (
                <>
                  Supernova <br /><span className="italic">Archive</span>
                </>
              ) : (
                <>
                  {collectionName} <br /><span className="italic">Archive</span>
                </>
              )}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 1, delay: 0.45 }}
              className={`mt-8 text-sm font-light tracking-wide uppercase ${
                isSupernova ? 'text-[#E0D8D0]/40' : 'text-[#1A1A1A]/[0.45]'
              }`}
            >
              Handcrafted Masterpieces / Limited Inventory
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="max-w-xs text-left md:text-right md:self-end"
          >
            <div className={`text-[10px] uppercase tracking-widest mb-3 ${isSupernova ? 'text-[#E0D8D0]/40' : 'text-[#1A1A1A]/[0.42]'}`}>
              Private Archive
            </div>
            <p className={`font-display italic text-2xl leading-tight ${isSupernova ? 'text-[#E0D8D0]' : 'text-[#1A1A1A]'}`}>
              {isSupernova ? 'Released in limited studio editions.' : 'Awaiting its first archive pieces.'}
            </p>
          </motion.div>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-32"
          initial={isMultiColumnViewport ? 'hidden' : false}
          whileInView={isMultiColumnViewport ? 'visible' : undefined}
          viewport={isMultiColumnViewport ? { once: true, amount: 0.18 } : undefined}
          variants={isMultiColumnViewport ? productGridVariants : undefined}
        >
          {collectionProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              animationMode={isMultiColumnViewport ? 'stagger' : 'scroll'}
              tone={isSupernova ? 'dark' : 'light'}
              collectionLabel={collectionName}
              onClick={() => setSelectedProduct(product)}
            />
          ))}
          {collectionProducts.length === 0 && (
            <div
              className={`col-span-full text-center py-48 border rounded-sm ${
                isSupernova ? 'border-white/5 bg-[#111]' : 'border-[#E5E2DE] bg-[#F8F8F6]'
              }`}
            >
              <p
                className={`text-[11px] uppercase tracking-[0.4em] italic ${
                  isSupernova ? 'text-[#E0D8D0]/20' : 'text-[#1A1A1A]/[0.35]'
                }`}
              >
                Awaiting Pieces
              </p>
            </div>
          )}
        </motion.div>
      </section>

      <ProductDetailModal
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onInquiryClick={() => {
          const productName = selectedProduct?.name;
          setSelectedProduct(null);
          onInquiryClick(productName);
        }}
        product={selectedProduct}
      />
    </>
  );
}
