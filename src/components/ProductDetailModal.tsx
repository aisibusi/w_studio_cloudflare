import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';
import type { Product } from '../types';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInquiryClick: () => void;
  product: null | Product;
}

export default function ProductDetailModal({ isOpen, onClose, onInquiryClick, product }: ProductDetailModalProps) {
  if (!product) {
    return null;
  }

  const description = product.description?.trim() || 'A handcrafted one-of-one piece from the w studio collection.';
  const priceLabel = product.inquireForPricing ? 'Inquire for pricing' : `USD ${(product.price ?? 0).toLocaleString()}`;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-black/82 backdrop-blur-sm px-4 md:px-8 py-8 md:py-12"
          onClick={onClose}
        >
          <div className="h-full overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.28 }}
              className="mx-auto max-w-6xl border border-white/10 bg-[#111] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-8 md:py-5">
                <div className="text-[10px] uppercase tracking-[0.38em] text-[#D4AF37] font-bold">
                  Piece Details
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 w-10 border border-white/10 flex items-center justify-center text-[#E0D8D0]/55 hover:text-white hover:border-white/30 transition-colors"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="border-b lg:border-b-0 lg:border-r border-white/10 bg-black/35">
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover aspect-[4/5]" />
                </div>

                <div className="px-5 py-6 md:px-8 md:py-8 flex flex-col">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-px w-10 bg-[#D4AF37]" />
                    <span className="text-[10px] uppercase tracking-[0.38em] text-[#D4AF37] font-bold">
                      {product.category || 'Supernova Series'}
                    </span>
                  </div>

                  <h3 className="text-4xl md:text-6xl font-display italic leading-[0.92] text-[#E0D8D0]">
                    {product.name}
                  </h3>

                  <div className="mt-7 inline-flex w-fit max-w-full flex-col border-l-2 border-[#D4AF37] bg-black/35 px-5 py-4">
                    <span className="text-[10px] uppercase tracking-[0.32em] text-[#D4AF37] font-bold">
                      Price
                    </span>
                    <span className="mt-2 font-accent text-2xl md:text-3xl leading-tight text-[#E0D8D0]">
                      {priceLabel}
                    </span>
                  </div>

                  <div className="mt-8 space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.36em] text-[#E0D8D0]/35 font-bold">
                      Description
                    </p>
                    <p className="font-sans text-sm md:text-base leading-[1.85] text-[#E0D8D0]/78">
                      {description}
                    </p>
                  </div>

                  <div className="mt-10 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={onInquiryClick}
                      className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] px-6 py-4 text-[10px] uppercase tracking-[0.34em] font-bold text-black hover:brightness-110 transition-all"
                    >
                      Ask About This Piece
                      <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center justify-center border border-white/10 px-6 py-4 text-[10px] uppercase tracking-[0.34em] font-bold text-[#E0D8D0]/70 hover:text-white hover:border-white/30 transition-colors"
                    >
                      Continue Browsing
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
