import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

export async function compressImage(file: File): Promise<{
  compressed: File;
  base64: string;
  preview: string;
}> {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "対応していない画像形式です。JPEG、PNG、WebP、HEICに対応しています。"
    );
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("ファイルサイズが10MBを超えています。");
  }

  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  const base64 = await fileToBase64(compressed);
  const preview = URL.createObjectURL(compressed);

  return { compressed, base64, preview };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
