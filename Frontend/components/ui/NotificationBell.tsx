"use client";

import React, { useState } from "react";
import { Bell, Check, CheckSquare } from "lucide-react";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { cn } from "@/lib/utils/cn";

export const NotificationBell: React.FC = () => {
  const { notifs, count, markRead, markAllRead } = useNotificationStream();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
        aria-label="Notifikasi"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white p-4 shadow-xl z-50 dark:bg-neutral-950">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2">
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100">Notifikasi</h3>
            {count > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Tandai semua dibaca
              </button>
            )}
          </div>
          {notifs.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-4">Tidak ada notifikasi</p>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 pr-1">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) void markRead(n.id);
                  }}
                  className={cn(
                    "py-2.5 px-2 text-xs transition-colors rounded-lg cursor-pointer group flex gap-2 items-start justify-between",
                    n.isRead 
                      ? "hover:bg-neutral-50 dark:hover:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400" 
                      : "bg-primary-50/50 hover:bg-primary-50/80 dark:bg-primary-950/20 dark:hover:bg-primary-950/30 text-neutral-900 dark:text-neutral-100"
                  )}
                >
                  <div className="flex-1 space-y-0.5">
                    <p className={cn("font-bold", !n.isRead && "text-primary-900 dark:text-primary-200")}>{n.title}</p>
                    <p className="leading-relaxed text-[11px]">{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void markRead(n.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-md text-primary-600 dark:text-primary-400"
                      title="Tandai dibaca"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
