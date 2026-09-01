"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";

type SlideOverProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  theme?: "dark" | "light";
};

export default function SlideOver({ isOpen, onClose, title, children, theme = "dark" }: SlideOverProps) {
  const isLight = theme === "light";
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 h-full w-full md:w-[500px] z-50 p-8 shadow-2xl overflow-y-auto ${isLight ? 'bg-[#fbf9f6] border-l border-stone-200' : 'bg-[#050505] border-l border-neutral-800'}`}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-lg font-bold uppercase tracking-widest ${isLight ? 'text-stone-900' : 'text-white'}`}>{title}</h2>
              <button type="button" onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-stone-200 text-stone-500' : 'hover:bg-neutral-900 text-neutral-400'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}