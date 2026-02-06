"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onError: (error: Error) => void;
}

export default function CameraCapture({
  onCapture,
  onError,
}: CameraCaptureProps) {
  const [hasGetUserMedia, setHasGetUserMedia] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setHasGetUserMedia(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia
    );
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      onError(
        new Error("カメラへのアクセスが拒否されました。設定を確認してください。")
      );
      console.error("Camera error:", err);
    }
  }, [facingMode, onError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 100);

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `receipt-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          stopCamera();
          onCapture(file);
        }
      },
      "image/jpeg",
      0.92
    );
  }, [onCapture, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) =>
      prev === "environment" ? "user" : "environment"
    );
  }, []);

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode, isCameraActive, startCamera]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  if (!hasGetUserMedia) {
    return (
      <div className="space-y-4">
        <label className="block">
          <div className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
            <svg
              className="w-12 h-12 text-gray-400"
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
            <span className="text-gray-600 font-medium">カメラで撮影する</span>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm text-gray-500">または</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        <label className="block">
          <div className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-gray-600">ファイルを選択</span>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  if (!isCameraActive) {
    return (
      <div className="space-y-4">
        <button
          onClick={startCamera}
          className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
        >
          <svg
            className="w-12 h-12 text-gray-400"
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
          <span className="text-gray-600 font-medium">カメラで撮影する</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm text-gray-500">または</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        <label className="block">
          <div className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[44px]">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-gray-600">ファイルを選択</span>
            <span className="text-xs text-gray-400">JPEG, PNG, WebP, HEIC</span>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="relative">
      {showFlash && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none animate-pulse" />
      )}

      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-[3/4] object-cover"
        />
      </div>

      <div className="flex items-center justify-center gap-8 mt-4">
        <button
          onClick={switchCamera}
          className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="カメラ切替"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        <button
          onClick={capturePhoto}
          className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 min-h-[64px] min-w-[64px] flex items-center justify-center shadow-lg"
          aria-label="撮影"
        >
          <div className="w-10 h-10 rounded-full border-4 border-white" />
        </button>

        <button
          onClick={stopCamera}
          className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="閉じる"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
