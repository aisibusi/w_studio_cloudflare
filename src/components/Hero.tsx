import { motion } from 'motion/react';

interface HeroProps {
  description?: string;
  imageUrl?: string;
  isReady?: boolean;
  onImageReady?: () => void;
  tagline?: string;
  title?: string;
}

export default function Hero({
  description = 'Born from the depths of water and time, each pearl carries an organic radiance shaped by nature. Handcrafted into fluid forms, Nova Lumina captures the quiet brilliance of light in motion - subtle, rare, and eternally evolving.',
  imageUrl = '/hero.png?v=supernova-still',
  isReady = true,
  onImageReady,
  tagline = 'Light in Motion',
  title = 'SUPERNOVA',
}: HeroProps) {
  const isLongTitle = title.length > 12;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        onLoad={onImageReady}
        onError={onImageReady}
        className={`absolute inset-0 h-full w-full object-cover object-[62%_56%] transition-opacity duration-1000 ease-out ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 opacity-15 mix-blend-screen">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] border border-[#D4AF37]/30 rounded-full scale-110" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] border border-[#D4AF37]/20 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-28 pb-20 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-9 lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="h-[1px] w-12 bg-[#D4AF37]"></div>
            <span className="text-xs uppercase tracking-[0.4em] text-[#D4AF37]">{tagline}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`mb-10 select-none font-display leading-[0.85] text-[#E0D8D0] ${
              isLongTitle ? 'text-[15vw] sm:text-[72px] md:text-[96px] lg:text-[118px]' : 'text-[18vw] sm:text-[100px] md:text-[140px]'
            }`}
          >
            <span className="block">{title}</span>
            <span className="block italic">Collection</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="max-w-xl space-y-8"
          >
            <p className="font-display italic text-xl md:text-2xl font-light text-[#E0D8D0]/80 leading-[1.45]">
              {description}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
