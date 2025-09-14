"use client";

import { useEffect, useRef, ReactNode, useState } from "react";
import { FiX } from "react-icons/fi";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  disableOutsideClick?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  isOpen,
  onClose,
  children,
  size = "md",
  disableOutsideClick = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
      const timeout = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!disableOutsideClick && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onMouseDown={handleOverlayClick}>
      <div className={clsx(
        "fixed inset-0 bg-black/70 backdrop-blur-sm transition-all duration-200",
        closing ? "opacity-0" : "opacity-100"
      )} />
      
      <div
        ref={modalRef}
        className={clsx(
          "relative z-10 w-full mx-auto rounded-2xl bg-black/80 border-2 border-[#ff5c1a] shadow-2xl shadow-[#ff5c1a44] p-4 md:p-8 flex flex-col my-4",
          sizeClasses[size],
          "transition-all duration-200",
          closing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}
      >
        <button
          className="absolute top-2 right-2 md:top-4 md:right-4 text-white hover:text-[#ff5c1a] text-2xl"
          onClick={onClose}
        >
          <FiX />
        </button>
        {children}
      </div>
    </div>
  );
}
