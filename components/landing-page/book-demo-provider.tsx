"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import BookDemoModal from "@/components/landing-page/BookDemoModal";

type BookDemoContextValue = {
  openBookDemo: () => void;
  closeBookDemo: () => void;
  isOpen: boolean;
};

const BookDemoContext = createContext<BookDemoContextValue | null>(null);

export function BookDemoProvider({ children }: { readonly children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openBookDemo = useCallback(() => setIsOpen(true), []);
  const closeBookDemo = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ openBookDemo, closeBookDemo, isOpen }),
    [openBookDemo, closeBookDemo, isOpen],
  );

  return (
    <BookDemoContext.Provider value={value}>
      {children}
      <BookDemoModal isOpen={isOpen} onClose={closeBookDemo} />
    </BookDemoContext.Provider>
  );
}

export function useBookDemo() {
  const context = useContext(BookDemoContext);
  if (!context) {
    throw new Error("useBookDemo must be used within BookDemoProvider");
  }
  return context;
}
