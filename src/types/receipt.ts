export interface ReceiptItem {
  id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sort_order?: number;
}

export interface Receipt {
  id: string;
  user_id: string;
  store_name: string | null;
  date: string | null;
  items: ReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  payment_method: string | null;
  image_url: string | null;
  ocr_confidence: number | null;
  ocr_raw_response?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ReceiptFormData {
  store_name: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
}

export interface OcrResult {
  store_name: string | null;
  date: string | null;
  items: ReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  payment_method: string | null;
  confidence: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ReceiptListResponse {
  receipts: Receipt[];
  pagination: PaginationInfo;
}
