-- Berkah Sumbing POS database foundation
create extension if not exists pgcrypto;

create table if not exists branches (
  id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
  address text, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists products (
  id uuid primary key default gen_random_uuid(), sku text unique not null, barcode text unique,
  name text not null, category text not null, sell_price numeric(14,2) not null default 0,
  cost_price numeric(14,2) not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists branch_stock (
  branch_id uuid references branches(id) on delete cascade, product_id uuid references products(id) on delete cascade,
  quantity numeric(14,3) not null default 0, minimum_stock numeric(14,3) not null default 0,
  updated_at timestamptz not null default now(), primary key(branch_id,product_id)
);
create table if not exists price_rules (
  id uuid primary key default gen_random_uuid(), product_id uuid references products(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade, price numeric(14,2) not null,
  starts_at timestamptz, ends_at timestamptz, active boolean not null default true
);
create table if not exists cash_shifts (
  id uuid primary key default gen_random_uuid(), branch_id uuid references branches(id) not null,
  cashier_name text not null, opened_at timestamptz not null default now(), opening_cash numeric(14,2) not null default 0,
  closed_at timestamptz, closing_cash numeric(14,2), status text not null default 'open' check(status in ('open','closed'))
);
create table if not exists members (
  id uuid primary key default gen_random_uuid(), member_code text unique, phone text unique not null,
  name text not null, tier text not null default 'Bronze' check(tier in ('Bronze','Silver','Gold')),
  points numeric(14,2) not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists sales (
  id uuid primary key default gen_random_uuid(), invoice_no text unique not null,
  branch_id uuid references branches(id) not null, shift_id uuid references cash_shifts(id), member_id uuid references members(id),
  subtotal numeric(14,2) not null default 0, discount numeric(14,2) not null default 0, tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0, payment_method text not null check(payment_method in ('cash','qris','bank_transfer','membership_points')),
  paid_amount numeric(14,2) not null default 0, change_amount numeric(14,2) not null default 0,
  points_earned numeric(14,2) not null default 0, points_redeemed numeric(14,2) not null default 0, created_at timestamptz not null default now()
);
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(), sale_id uuid references sales(id) on delete cascade not null,
  product_id uuid references products(id) not null, product_name text not null, quantity numeric(14,3) not null,
  unit_price numeric(14,2) not null, item_discount numeric(14,2) not null default 0, line_total numeric(14,2) not null
);
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(), branch_id uuid references branches(id) not null,
  product_id uuid references products(id) not null,
  movement_type text not null check(movement_type in ('sale','purchase','adjustment','transfer_out','transfer_in','return')),
  quantity numeric(14,3) not null, reference_id uuid, note text, created_at timestamptz not null default now()
);
create table if not exists stock_transfers (
  id uuid primary key default gen_random_uuid(), transfer_no text unique not null,
  from_branch_id uuid references branches(id) not null, to_branch_id uuid references branches(id) not null,
  status text not null default 'requested' check(status in ('requested','approved','shipped','received','cancelled')),
  requested_at timestamptz not null default now(), shipped_at timestamptz, received_at timestamptz, note text
);
create table if not exists stock_transfer_items (
  id uuid primary key default gen_random_uuid(), transfer_id uuid references stock_transfers(id) on delete cascade not null,
  product_id uuid references products(id) not null, quantity numeric(14,3) not null
);

create index if not exists idx_products_barcode on products(barcode);
create index if not exists idx_stock_branch on branch_stock(branch_id);
create index if not exists idx_sales_branch_date on sales(branch_id,created_at);
create index if not exists idx_sales_member on sales(member_id);
create index if not exists idx_movements_branch_product on stock_movements(branch_id,product_id,created_at);

-- Atomic checkout: sale, line items, stock decrement, movement log, and member points
-- are committed together. Run this after the tables above are created.
create or replace function checkout_sale(
  p_branch_id uuid,
  p_shift_id uuid,
  p_member_id uuid,
  p_payment_method text,
  p_paid_amount numeric,
  p_discount numeric,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid := gen_random_uuid();
  v_invoice text := 'BS-' || to_char(now(),'YYYYMMDDHH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_change numeric := 0;
  v_points numeric := 0;
  item jsonb;
  v_stock numeric;
  v_line numeric;
begin
  if p_payment_method not in ('cash','qris','bank_transfer','membership_points') then
    raise exception 'Metode pembayaran tidak valid';
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    select quantity into v_stock from branch_stock
      where branch_id=p_branch_id and product_id=(item->>'product_id')::uuid for update;
    if v_stock is null then raise exception 'Produk tidak tersedia di cabang'; end if;
    if v_stock < (item->>'quantity')::numeric then raise exception 'Stok tidak cukup untuk produk %', item->>'product_id'; end if;
    v_line := (item->>'unit_price')::numeric * (item->>'quantity')::numeric - coalesce((item->>'item_discount')::numeric,0);
    v_subtotal := v_subtotal + v_line;
  end loop;

  v_total := greatest(0, v_subtotal - coalesce(p_discount,0));
  if p_payment_method='cash' and p_paid_amount < v_total then raise exception 'Pembayaran tunai kurang'; end if;
  if p_payment_method='membership_points' then
    if p_member_id is null then raise exception 'Member wajib dipilih untuk pembayaran poin'; end if;
    if (select points from members where id=p_member_id for update) < v_total then raise exception 'Poin member tidak mencukupi'; end if;
    v_points := v_total;
  end if;
  if p_payment_method='cash' then v_change := p_paid_amount-v_total; end if;

  insert into sales(id,invoice_no,branch_id,shift_id,member_id,subtotal,discount,total,payment_method,paid_amount,change_amount,points_redeemed)
  values(v_sale_id,v_invoice,p_branch_id,p_shift_id,p_member_id,v_subtotal,coalesce(p_discount,0),v_total,p_payment_method,p_paid_amount,v_change,v_points);

  for item in select * from jsonb_array_elements(p_items) loop
    v_line := (item->>'unit_price')::numeric * (item->>'quantity')::numeric - coalesce((item->>'item_discount')::numeric,0);
    insert into sale_items(sale_id,product_id,product_name,quantity,unit_price,item_discount,line_total)
    values(v_sale_id,(item->>'product_id')::uuid,item->>'product_name',(item->>'quantity')::numeric,(item->>'unit_price')::numeric,coalesce((item->>'item_discount')::numeric,0),v_line);
    update branch_stock set quantity=quantity-(item->>'quantity')::numeric, updated_at=now()
      where branch_id=p_branch_id and product_id=(item->>'product_id')::uuid;
    insert into stock_movements(branch_id,product_id,movement_type,quantity,reference_id,note)
    values(p_branch_id,(item->>'product_id')::uuid,'sale',-(item->>'quantity')::numeric,v_sale_id,'Penjualan '||v_invoice);
  end loop;

  if p_member_id is not null then
    update members set points=greatest(0,points-v_points)+floor(v_total/10000), updated_at=now() where id=p_member_id;
  end if;

  update sales set points_earned=case when p_member_id is not null then floor(v_total/10000) else 0 end where id=v_sale_id;
  return jsonb_build_object('sale_id',v_sale_id,'invoice_no',v_invoice,'total',v_total,'change_amount',v_change);
end;
$$;
