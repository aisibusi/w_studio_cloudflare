import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, MessageSquare, Send, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { createInquiry } from '../lib/api';

interface ContactChatProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productName?: string;
}

const emptyInquiry = {
  name: '',
  contact: '',
  question: '',
};

const inquirySeenKey = 'wstudio-inquiry-seen';
const wechatId = 'doudou-zhaowenting';

function getInquirySeenState() {
  try {
    return window.localStorage.getItem(inquirySeenKey) === 'true';
  } catch {
    return false;
  }
}

function saveInquirySeenState() {
  try {
    window.localStorage.setItem(inquirySeenKey, 'true');
  } catch {
    // Visual state still updates if browser storage is unavailable.
  }
}

export default function ContactChat({ isOpen, onOpenChange, productName }: ContactChatProps) {
  const [form, setForm] = useState(emptyInquiry);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [hasSeenInquiry, setHasSeenInquiry] = useState(getInquirySeenState);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }

    if (!hasSeenInquiry) {
      setHasSeenInquiry(true);
      saveInquirySeenState();
    }

    if (productName) {
      setForm((current) => ({
        ...current,
        question: current.question || `I am interested in ${productName}.`,
      }));
    }
  }, [hasSeenInquiry, isOpen, productName]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      await createInquiry(form);
      setForm(emptyInquiry);
      setMessage('Inquiry received. We will contact you soon.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyWechat() {
    try {
      await navigator.clipboard.writeText(wechatId);
      setCopied(true);
      setMessage('WeChat copied.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage('Copy failed. Please copy the WeChat ID manually.');
    }
  }

  return (
    <>
      <button
        onClick={() => onOpenChange(!isOpen)}
        className="fixed bottom-8 right-8 z-[150] flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.12] bg-[#1A1A1A] text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-[#C5A059]"
        aria-label="Open inquiry"
      >
        {isOpen ? <X size={22} strokeWidth={1.6} /> : <MessageSquare size={22} strokeWidth={1.6} />}
        {!isOpen && !hasSeenInquiry ? (
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-[#1A1A1A] bg-[#C5A059]" />
        ) : null}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <div className="fixed inset-0 z-[140]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/[0.42] backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 220 }}
              className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[#E5E2DE] bg-white text-[#1A1A1A] shadow-2xl"
            >
              <header className="flex items-center justify-between border-b border-[#E5E2DE] px-8 py-8 md:px-10">
                <div>
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.36em] text-[#C5A059]">
                    Service
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-light leading-none">Inquiry</h2>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex h-10 w-10 items-center justify-center border border-[#E5E2DE] text-[#1A1A1A]/[0.45] transition-colors hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                  aria-label="Close inquiry"
                >
                  <X size={17} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-8 py-8 md:px-10">
                <div className="mb-10 border border-[#E5E2DE] bg-[#FAFAF9] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8E887E]">
                      Direct Contact
                    </p>
                    <div className="h-px flex-1 bg-[#E5E2DE]" />
                  </div>
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8E887E]">
                        WeChat ID
                      </p>
                      <p className="mt-2 font-accent text-sm font-medium tracking-[0.08em] text-[#1A1A1A]">
                        {wechatId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={copyWechat}
                      className="flex h-11 w-11 items-center justify-center bg-white text-[#C5A059] transition-colors hover:bg-[#C5A059] hover:text-white"
                      aria-label="Copy WeChat"
                    >
                      {copied ? <Check size={17} /> : <Copy size={17} />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7">
                  <label className="block space-y-3">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8E887E]">
                      Name
                    </span>
                    <input
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      className="w-full border-b border-[#E5E2DE] bg-transparent py-3 font-sans text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#1A1A1A]/[0.28] focus:border-[#C5A059]"
                      placeholder="Your preferred name"
                    />
                  </label>

                  <label className="block space-y-3">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C5A059]">
                      Contact *
                    </span>
                    <input
                      required
                      value={form.contact}
                      onChange={(event) => setForm({ ...form, contact: event.target.value })}
                      className="w-full border-b border-[#E5E2DE] bg-transparent py-3 font-sans text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#1A1A1A]/[0.28] focus:border-[#C5A059]"
                      placeholder="WeChat / phone / email"
                    />
                  </label>

                  <label className="block space-y-3">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C5A059]">
                      Question *
                    </span>
                    <textarea
                      required
                      rows={5}
                      value={form.question}
                      onChange={(event) => setForm({ ...form, question: event.target.value })}
                      className="w-full resize-none border border-[#E5E2DE] bg-transparent p-4 font-sans text-sm leading-relaxed text-[#1A1A1A] outline-none transition-colors placeholder:text-[#1A1A1A]/[0.28] focus:border-[#C5A059]"
                      placeholder="Which piece are you interested in?"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-3 bg-[#1A1A1A] py-5 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition-colors hover:bg-[#C5A059] disabled:opacity-55"
                  >
                    <Send size={14} />
                    {isSubmitting ? 'Sending Request' : 'Send Inquiry'}
                  </button>

                  {message ? <p className="text-sm leading-relaxed text-[#6D6861]">{message}</p> : null}
                </form>
              </div>

              <footer className="border-t border-[#E5E2DE] px-8 py-6 text-center md:px-10">
                <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9C927F]">
                  w studio will respond through your preferred contact method.
                </p>
              </footer>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
