import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiEye, FiTrash2, FiUserCheck } from 'react-icons/fi';

interface ActionMenuProps {
  anchorRect: DOMRect | null;
  onView: () => void;
  onRemove: () => void;
  onPromoteCaptain?: () => void;
  canPromoteCaptain?: boolean;
  onInvite?: () => void;
  inviteLabel?: string;
  onClose: () => void;
}

const MENU_WIDTH = 192; // w-48

export default function ActionMenu({ anchorRect, onView, onRemove, onPromoteCaptain, canPromoteCaptain, onInvite, inviteLabel, onClose }: ActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRect) {
      // Position relative to viewport; avoid double counting scroll offsets
      const menuHeight = 132; // ~3 rows
      const padding = 8;
      let top = anchorRect.bottom + 8;
      let left = anchorRect.right - MENU_WIDTH;
      if (top + menuHeight > window.innerHeight) {
        top = anchorRect.top - menuHeight - padding;
      }
      if (left + MENU_WIDTH > window.innerWidth) left = window.innerWidth - MENU_WIDTH - padding;
      if (left < padding) left = padding;
      setCoords({ top, left });
    }
  }, [anchorRect]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!anchorRect) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="absolute z-[1000] w-48 bg-[#002b6b] rounded-lg shadow-lg border border-[#ff5c1a]"
      style={{ top: coords.top, left: coords.left, position: 'fixed' }}
    >
      <div className="py-1">
        <button
          onClick={onView}
          className="w-full px-4 py-2 text-left text-white hover:bg-[#ff5c1a]/10 flex items-center gap-2"
        >
          <FiEye className="w-4 h-4" />
          Megtekintés
        </button>
        {onInvite && (
          <button
            onClick={onInvite}
            className="w-full px-4 py-2 text-left text-white hover:bg-[#ff5c1a]/10 flex items-center gap-2"
          >
            {inviteLabel || 'Meghívó kiküldése'}
          </button>
        )}
        {canPromoteCaptain && onPromoteCaptain && (
          <button
            onClick={onPromoteCaptain}
            className="w-full px-4 py-2 text-left text-white hover:bg-[#ff5c1a]/10 flex items-center gap-2"
          >
            <FiUserCheck className="w-4 h-4" />
            Kinevezés kapitánynak
          </button>
        )}
        <button
          onClick={onRemove}
          className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#ff5c1a]/10 flex items-center gap-2"
        >
          <FiTrash2 className="w-4 h-4" />
          Eltávolítás
        </button>
      </div>
    </div>,
    document.body
  );
} 