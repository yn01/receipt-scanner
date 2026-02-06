"use client";

import { useState } from "react";
import Image from "next/image";

interface ImagePreviewProps {
  src: string;
  alt: string;
  compressedSize?: string;
  onRemove?: () => void;
  expandable?: boolean;
}

export default function ImagePreview({
  src,
  alt,
  compressedSize,
  onRemove,
  expandable = true,
}: ImagePreviewProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="relative">
        <div
          className={`relative overflow-hidden rounded-lg bg-gray-100 ${
            expandable ? "cursor-pointer" : ""
          }`}
          onClick={expandable ? () => setExpanded(true) : undefined}
        >
          <Image
            src={src}
            alt={alt}
            width={400}
            height={300}
            className="w-full h-auto max-h-64 object-contain"
            unoptimized
          />
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
            aria-label="画像を削除"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {compressedSize && (
          <p className="mt-1 text-xs text-gray-500">
            圧縮済み: {compressedSize}
          </p>
        )}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 p-2 text-white"
            aria-label="閉じる"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Image
            src={src}
            alt={alt}
            width={1920}
            height={1080}
            className="max-w-full max-h-full object-contain"
            unoptimized
          />
        </div>
      )}
    </>
  );
}
