import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("date_from") || "";
    const dateTo = searchParams.get("date_to") || "";
    const amountMin = searchParams.get("amount_min") || "";
    const amountMax = searchParams.get("amount_max") || "";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("receipts")
      .select("*, receipt_items(*)", { count: "exact" })
      .is("deleted_at", null)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `store_name.ilike.%${search}%`
      );
    }

    if (dateFrom) {
      query = query.gte("date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("date", dateTo);
    }
    if (amountMin) {
      query = query.gte("total", parseInt(amountMin));
    }
    if (amountMax) {
      query = query.lte("total", parseInt(amountMax));
    }

    query = query.range(offset, offset + limit - 1);

    const { data: receipts, count, error } = await query;

    if (error) {
      console.error("Receipts fetch error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "レシート一覧の取得に失敗しました。",
          },
        },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const formattedReceipts = (receipts || []).map((r) => ({
      ...r,
      items: r.receipt_items || [],
      receipt_items: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        receipts: formattedReceipts,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Receipts API error:", error);
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
    const {
      store_name,
      date,
      items,
      subtotal,
      tax,
      total,
      payment_method,
      image_url,
      ocr_confidence,
      ocr_raw_response,
    } = body;

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        store_name,
        date,
        subtotal,
        tax,
        total,
        payment_method,
        image_url,
        ocr_confidence,
        ocr_raw_response,
      })
      .select()
      .single();

    if (receiptError) {
      console.error("Receipt insert error:", receiptError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "レシートの保存に失敗しました。",
          },
        },
        { status: 500 }
      );
    }

    if (items && items.length > 0) {
      const receiptItems = items.map(
        (
          item: { name: string; quantity: number; unit_price: number; subtotal: number },
          index: number
        ) => ({
          receipt_id: receipt.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          sort_order: index,
        })
      );

      const { error: itemsError } = await supabase
        .from("receipt_items")
        .insert(receiptItems);

      if (itemsError) {
        console.error("Receipt items insert error:", itemsError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: receipt.id, created_at: receipt.created_at },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Receipts POST error:", error);
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
