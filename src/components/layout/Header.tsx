"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function Header({
  title,
  showBackButton = false,
  onBack,
  rightAction,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center px-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="戻る"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {title}
        </h1>
      </div>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </header>
  );
}
