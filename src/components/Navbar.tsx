interface NavbarProps {
  activeCollectionSlug?: string;
  onInquiryClick: () => void;
  variant?: 'dark' | 'light';
}

export default function Navbar({ variant = 'dark' }: NavbarProps) {
  const isLight = variant === 'light';

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transform-gpu [backface-visibility:hidden] ${
        isLight ? 'border-[#E5E2DE] bg-white/[0.94]' : 'border-white/5 bg-[#0A0A0A]/95'
      }`}
    >
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-center px-5 sm:px-8">
          <a
            href="/"
            aria-label="Go to homepage"
            className={`font-display text-xl font-light uppercase tracking-[0.3em] transition-colors sm:text-2xl sm:tracking-[0.42em] ${
              isLight ? 'text-[#1A1A1A]' : 'text-white'
            }`}
          >
            W Studio
          </a>
        </div>
      </div>
    </nav>
  );
}
