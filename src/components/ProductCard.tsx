import { motion, type Variants } from 'motion/react';
import type { Key } from 'react';
import type { Product } from '../types';

interface ProductCardProps {
  key?: Key;
  animationMode?: 'stagger' | 'scroll';
  onClick: () => void;
  product: Product;
  tone?: 'dark' | 'light';
  collectionLabel?: string;
}

const productCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 80,
    scale: 0.96,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.9,
      ease: [0.215, 0.61, 0.355, 1],
    },
  },
};

export default function ProductCard({
  animationMode = 'stagger',
  collectionLabel = 'Supernova Spec',
  onClick,
  product,
  tone = 'dark',
}: ProductCardProps) {
  const isDark = tone === 'dark';
  const scrollAnimationProps =
    animationMode === 'scroll'
      ? {
          initial: 'hidden' as const,
          whileInView: 'visible' as const,
          viewport: { once: true, amount: 0.08, margin: '0px 0px 32% 0px' },
        }
      : {};

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={productCardVariants}
      {...scrollAnimationProps}
      className="group cursor-pointer text-left w-full bg-transparent border-0 p-0"
    >
      <div className={`relative aspect-[3/4] overflow-hidden mb-6 rounded-sm ${isDark ? 'bg-[#111]' : 'bg-white'}`}>
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className={`absolute inset-0 pointer-events-none ${isDark ? 'border border-white/5' : 'border border-[#E5E2DE]'}`} />
      </div>

      <div className="flex justify-between items-start pt-2">
        <div className="space-y-1">
          <h3
            className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
              isDark ? 'text-[#E0D8D0]/80 group-hover:text-white' : 'text-[#1A1A1A]/[0.78] group-hover:text-[#1A1A1A]'
            }`}
          >
            {product.name}
          </h3>
          <p className="font-sans text-[10px] uppercase tracking-widest text-[#D4AF37]/60">
            {collectionLabel}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-accent text-xl ${isDark ? 'text-[#E0D8D0]' : 'text-[#1A1A1A]'}`}>
            {product.inquireForPricing ? 'Inquire for pricing' : `USD ${(product.price ?? 0).toLocaleString()}`}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
