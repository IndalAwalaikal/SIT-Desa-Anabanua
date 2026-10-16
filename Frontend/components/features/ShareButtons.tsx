'use client';

import React, { useState } from 'react';
import { Share2, Facebook, Send, MessageCircle, Link2, Check } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
}

/** Tombol berbagi sosial yang tersusun secara horizontal, berfungsi di sisi klien. */
export const ShareButtons: React.FC<ShareButtonsProps> = ({ title }) => {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = encodeURIComponent(title);

  const links = [
    {
      key: 'wa',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`,
      Icon: MessageCircle,
      className: 'bg-[#25D366]/10 text-[#128C4A] hover:bg-[#25D366]/20',
    },
    {
      key: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`,
      Icon: Send,
      className: 'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20',
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      Icon: Facebook,
      className: 'bg-primary-600/10 text-primary-700 hover:bg-primary-600/20',
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia (HTTP saja); abaikan.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-neutral-100 dark:border-neutral-800">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 mr-1">
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Bagikan:
      </span>

      {links.map(({ key, label, href, Icon, className }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Bagikan ke ${label}`}
          title={label}
          className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${className}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </a>
      ))}

      <button
        onClick={() => void handleCopy()}
        aria-label="Salin tautan"
        title={copied ? 'Tersalin!' : 'Salin tautan'}
        className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        {copied ? <Check className="h-4 w-4 text-primary-600" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
};