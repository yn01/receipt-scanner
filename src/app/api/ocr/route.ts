import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callWithRetry, OcrError } from "@/lib/claude/ocr";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BASE64_SIZE = 5 * 1024 * 1024; // ~3.75MB actual file

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "認証が必要です。" },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "画像データとMIMEタイプは必須です。",
          },
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "対応していない画像形式です。JPEG、PNG、WebPに対応しています。",
          },
        },
        { status: 400 }
      );
    }

    if (image.length > MAX_BASE64_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "画像サイズが大きすぎます。",
          },
        },
        { status: 400 }
      );
    }

    const result = await callWithRetry(image, mimeType);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof OcrError) {
      const status = error.code === "RATE_LIMITED" ? 429 : 500;
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status }
      );
    }

    console.error("OCR API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバーエラーが発生しました。",
        },
      },
      { status: 500 }
    );
  }
}
