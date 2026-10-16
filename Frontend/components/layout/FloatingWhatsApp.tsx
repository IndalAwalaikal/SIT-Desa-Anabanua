'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * Tombol WhatsApp melayang sebagai kanal bantuan warga.
 * Nomor diambil dariNEXT_PUBLIC_WHATSAPP_NUMBER di .env.local.
 * Jika nomor kosong atau meng mengandung 'x', tombol tidak ditampilkan.
 */
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

const WA_LINK = WA_NUMBER
  ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      'Halo Admin Desa Anabanua, saya ingin bertanya tentang layanan desa.'
    )}`
  : '';

export const FloatingWhatsApp: React.FC = () => {
  if (!WA_NUMBER || WA_NUMBER.includes('x')) {
    return null;
  }

  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp perangkat desa"
      className="fixed bottom-20 right-6 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,211,102,0.4)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden md:inline">Bantuan Desa</span>
    </a>
  );
};