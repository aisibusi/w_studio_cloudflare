import { useState } from 'react';
import Navbar from './components/Navbar';
import ContactChat from './components/ContactChat';
import AdminPage from './components/AdminPage';
import HomePage from './components/HomePage';
import CollectionPage from './components/CollectionPage';
import { DEFAULT_COLLECTION_ID, getCollectionBySlug } from './collections';

function Storefront() {
  const [inquiryState, setInquiryState] = useState<{ isOpen: boolean; productName?: string }>({
    isOpen: false,
  });
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const collectionMatch = pathname.match(/^\/collections\/([^/]+)$/);
  const collection = collectionMatch ? getCollectionBySlug(collectionMatch[1]) : null;
  const activeCollectionSlug = collection?.slug;
  const isHome = !collection;
  const isSupernova = collection?.id === DEFAULT_COLLECTION_ID;

  const openInquiry = (productName?: string) => {
    setInquiryState({ isOpen: true, productName });
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-[#D4AF37] selection:text-black ${isSupernova ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      <Navbar
        activeCollectionSlug={activeCollectionSlug}
        onInquiryClick={() => openInquiry()}
        variant={isHome ? 'light' : isSupernova ? 'dark' : 'light'}
      />

      {collection ? (
        <CollectionPage collection={collection} onInquiryClick={openInquiry} />
      ) : (
        <HomePage />
      )}

      <footer className={`${isSupernova ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-[#E5E2DE]'} border-t px-6 py-12 text-center`}>
        <p className={`text-[10px] uppercase tracking-[0.35em] font-bold ${isSupernova ? 'text-white/25' : 'text-[#1A1A1A]/[0.35]'}`}>
          Copyright &copy; 2026 w studio. All rights reserved.
        </p>
      </footer>

      <ContactChat
        isOpen={inquiryState.isOpen}
        onOpenChange={(isOpen) => setInquiryState((current) => ({ ...current, isOpen }))}
        productName={inquiryState.productName}
      />
    </div>
  );
}

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '');
  return pathname === '/admin' ? <AdminPage /> : <Storefront />;
}
