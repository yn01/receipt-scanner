import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: receipt, error } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (error || !receipt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "レシートが見つかりません。",
          },
        },
        { status: 404 }
      );
    }

    const formatted = {
      ...receipt,
      items: (receipt.receipt_items || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
      receipt_items: undefined,
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Receipt GET error:", error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { store_name, date, items, subtotal, tax, total, payment_method } =
      body;

    const { error: updateError } = await supabase
      .from("receipts")
      .update({
        store_name,
        date,
        subtotal,
        tax,
        total,
        payment_method,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (updateError) {
      console.error("Receipt update error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "レシートの更新に失敗しました。",
          },
        },
        { status: 500 }
      );
    }

    if (items) {
      await supabase
        .from("receipt_items")
        .delete()
        .eq("receipt_id", id);

      if (items.length > 0) {
        const receiptItems = items.map(
          (
            item: { name: string; quantity: number; unit_price: number; subtotal: number },
            index: number
          ) => ({
            receipt_id: id,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            sort_order: index,
          })
        );

        await supabase.from("receipt_items").insert(receiptItems);
      }
    }

    return NextResponse.json({
      success: true,
      data: { id, updated_at: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Receipt PUT error:", error);
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { error } = await supabase
      .from("receipts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) {
      console.error("Receipt delete error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "レシートの削除に失敗しました。",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, deleted_at: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Receipt DELETE error:", error);
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
