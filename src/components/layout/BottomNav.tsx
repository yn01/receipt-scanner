"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      key: "home",
      label: "一覧",
      href: "/",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "text-blue-600" : "text-gray-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      isActive: pathname === "/",
    },
    {
      key: "scan",
      label: "スキャン",
      href: "/scan",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "text-blue-600" : "text-gray-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      isActive: pathname.startsWith("/scan"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-center justify-around h-16 pb-safe">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] ${
              tab.isActive ? "text-blue-600" : "text-gray-400"
            }`}
          >
            {tab.icon(tab.isActive)}
            <span className="text-xs">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
