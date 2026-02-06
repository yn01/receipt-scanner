-- receipts テーブル
CREATE TABLE receipts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name    text,
  date          date,
  subtotal      integer,
  tax           integer,
  total         integer,
  payment_method text,
  image_url     text,
  ocr_confidence real,
  ocr_raw_response jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- receipt_items テーブル
CREATE TABLE receipt_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id  uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name        text NOT NULL,
  quantity    integer NOT NULL DEFAULT 1,
  unit_price  integer NOT NULL,
  subtotal    integer NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(user_id, date DESC);
CREATE INDEX idx_receipts_deleted_at ON receipts(deleted_at);
CREATE INDEX idx_receipts_store_name ON receipts USING gin(to_tsvector('simple', coalesce(store_name, '')));
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_name ON receipt_items USING gin(to_tsvector('simple', name));

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS: receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_select" ON receipts
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "receipts_insert" ON receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "receipts_update" ON receipts
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "receipts_soft_delete" ON receipts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS: receipt_items
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipt_items_select" ON receipt_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
        AND receipts.deleted_at IS NULL
    )
  );

CREATE POLICY "receipt_items_insert" ON receipt_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "receipt_items_update" ON receipt_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "receipt_items_delete" ON receipt_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );
