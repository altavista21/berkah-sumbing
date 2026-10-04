"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Boxes, ChevronDown, Clock3, LayoutDashboard, LogOut, Menu,
  Package, Plus, Receipt, Search, Settings, ShoppingCart, Store, Users, Wallet, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import "./pos.css";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  barcode?: string | null;
};
type CartItem = Product & { qty: number };
type Member = {
  id: string;
  name: string;
  phone: string;
  tier: "Bronze" | "Silver" | "Gold";
  points: number;
};

const demoProducts: Product[] = [
  { id: "demo-1", name: "Beras Premium 5kg", category: "Sembako", price: 72000, stock: 38, sku: "89910001" },
  { id: "demo-2", name: "Minyak Goreng 1L", category: "Sembako", price: 18500, stock: 64, sku: "89910002" },
  { id: "demo-3", name: "Gula Pasir 1kg", category: "Sembako", price: 17000, stock: 42, sku: "89910003" },
  { id: "demo-4", name: "Kopi Bubuk 200g", category: "Minuman", price: 26500, stock: 24, sku: "89910004" },
  { id: "demo-5", name: "Teh Celup 25s", category: "Minuman", price: 11500, stock: 31, sku: "89910005" },
  { id: "demo-6", name: "Sabun Mandi", category: "Perawatan", price: 8500, stock: 55, sku: "89910006" },
  { id: "demo-7", name: "Deterjen 800g", category: "Rumah Tangga", price: 21000, stock: 19, sku: "89910007" },
  { id: "demo-8", name: "Mie Instan", category: "Sembako", price: 3500, stock: 120, sku: "89910008" }
];
const demoMembers: Member[] = [
  { id: "demo-member-1", name: "Andi Pratama", phone: "081234567890", tier: "Gold", points: 1240 },
  { id: "demo-member-2", name: "Siti Aminah", phone: "081298765432", tier: "Silver", points: 680 },
  { id: "demo-member-3", name: "Budi Santoso", phone: "081300112233", tier: "Bronze", points: 210 }
];

const money = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const nav = [
  ["Kasir", ShoppingCart], ["Dashboard", LayoutDashboard], ["Produk", Package],
  ["Stok", Boxes], ["Member", Users], ["Laporan", BarChart3], ["Pengaturan", Settings]
] as const;

export default function Page() {
  const [active, setActive] = useState("Kasir");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [payment, setPayment] = useState("Tunai");
  const [cash, setCash] = useState("");
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [branchId, setBranchId] = useState<string | null>(null);

  const loadCatalog = async () => {
    if (!supabase) {
      setProducts(demoProducts);
      setMembers(demoMembers);
      setNotice("Supabase belum dikonfigurasi. Mode demo aktif.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: branches, error: branchError } = await supabase
      .from("branches").select("id").eq("active", true).order("created_at").limit(1);

    if (branchError || !branches?.[0]) {
      setProducts([]);
      setMembers([]);
      setConnected(false);
      setNotice(branchError?.message || "Belum ada cabang aktif di Supabase.");
      setLoading(false);
      return;
    }

    const activeBranchId = branches[0].id as string;
    setBranchId(activeBranchId);

    const [productResult, memberResult] = await Promise.all([
      supabase.from("products")
        .select("id,name,category,sell_price,sku,barcode,branch_stock(quantity,branch_id)")
        .eq("active", true).order("name"),
      supabase.from("members")
        .select("id,name,phone,tier,points").eq("active", true).order("name")
    ]);

    if (productResult.error) {
      setNotice("Gagal memuat produk: " + productResult.error.message);
      setProducts([]);
    } else {
      setProducts((productResult.data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: Number(p.sell_price),
        stock: Number((p.branch_stock ?? []).find((s: any) => s.branch_id === activeBranchId)?.quantity ?? 0),
        sku: p.sku,
        barcode: p.barcode
      })));
    }

    if (memberResult.error) {
      setNotice("Gagal memuat member: " + memberResult.error.message);
      setMembers([]);
    } else {
      setMembers((memberResult.data ?? []).map((m: any) => ({
        id: m.id, name: m.name, phone: m.phone, tier: m.tier, points: Number(m.points)
      })));
    }

    setConnected(true);
    setLoading(false);
  };

  useEffect(() => { void loadCatalog(); }, []);

  const cats = ["Semua", ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = useMemo(() =>
    products.filter(p =>
      (category === "Semua" || p.category === category) &&
      (p.name + " " + p.sku + " " + (p.barcode ?? "")).toLowerCase().includes(query.toLowerCase())
    ), [products, query, category]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  // Rates below preserve the existing demo behavior. The PRD defines tiers but does not specify percentages.
  const rate = member ? (member.tier === "Gold" ? .10 : member.tier === "Silver" ? .05 : .02) : 0;
  const discount = Math.round(subtotal * rate);
  const total = Math.max(0, subtotal - discount);

  const add = (p: Product) => setCart(c => {
    const x = c.find(i => i.id === p.id);
    return x
      ? c.map(i => i.id === p.id ? { ...i, qty: Math.min(p.stock, i.qty + 1) } : i)
      : [{ ...p, qty: 1 }, ...c];
  });

  const qty = (id: string, d: number) =>
    setCart(c => c.map(i => i.id === id ? { ...i, qty: Math.min(i.stock, i.qty + d) } : i).filter(i => i.qty > 0));

  const findMember = async () => {
    const phone = memberQuery.trim();
    if (!phone) return;
    if (!supabase) {
      const m = members.find(x => x.phone === phone) ?? null;
      setMember(m);
      setNotice(m ? "Member ditemukan: " + m.name : "Member tidak ditemukan");
      return;
    }
    const { data, error } = await supabase.from("members")
      .select("id,name,phone,tier,points").eq("phone", phone).eq("active", true).maybeSingle();
    if (error) {
      setNotice("Gagal mencari member: " + error.message);
      return;
    }
    const m = data ? { id: data.id, name: data.name, phone: data.phone, tier: data.tier, points: Number(data.points) } as Member : null;
    setMember(m);
    setNotice(m ? "Member ditemukan: " + m.name : "Member tidak ditemukan");
  };

  const pay = async () => {
    if (!cart.length) return setNotice("Keranjang masih kosong");
    if (payment === "Tunai" && Number(cash) < total) return setNotice("Nominal tunai kurang");
    if (payment === "Poin" && !member) return setNotice("Pilih member untuk pembayaran poin");
    if (!supabase || !connected || !branchId || cart.some(i => i.id.startsWith("demo-"))) {
      setNotice("Mode demo: transaksi belum disimpan ke server.");
      setCart([]);
      setCash("");
      return;
    }

    setProcessing(true);
    setNotice("");
    const paymentMap: Record<string, string> = {
      Tunai: "cash", QRIS: "qris", Transfer: "bank_transfer", Poin: "membership_points"
    };
    const paidAmount = payment === "Tunai" ? Number(cash) : total;
    const { data, error } = await supabase.rpc("checkout_sale", {
      p_branch_id: branchId,
      p_shift_id: null,
      p_member_id: member?.id ?? null,
      p_payment_method: paymentMap[payment],
      p_paid_amount: paidAmount,
      p_discount: discount,
      p_items: cart.map(i => ({
        product_id: i.id,
        product_name: i.name,
        quantity: i.qty,
        unit_price: i.price,
        item_discount: 0
      }))
    });

    setProcessing(false);
    if (error) {
      setNotice("Checkout gagal: " + error.message);
      return;
    }

    setNotice("Transaksi berhasil • " + data.invoice_no + " • " + money(Number(data.total)));
    setCart([]);
    setCash("");
    setMember(null);
    await loadCatalog();
  };

  return <main className="shell">
    <aside className={"sidebar " + (menu ? "open" : "")}>
      <div className="brand"><div className="logo">BS</div><div><b>Berkah Sumbing</b><small>POS • Pusat</small></div><button className="close" onClick={() => setMenu(false)}><X size={19}/></button></div>
      <nav>{nav.map(([n, I]) => <button className={active === n ? "nav active" : "nav"} key={n} onClick={() => { setActive(n); setMenu(false); }}><I size={18}/><span>{n}</span></button>)}</nav>
      <div className="sidebottom"><div className="branch"><Store size={17}/><div><b>Cabang Aktif</b><small>{connected ? "Supabase" : "Mode demo"}</small></div></div><button className="nav"><LogOut size={18}/><span>Keluar</span></button></div>
    </aside>

    <section className="workspace">
      <header className="topbar"><button className="hamb" onClick={() => setMenu(true)}><Menu/></button><div className="crumb">{active}<ChevronDown size={14}/></div><div className="topright"><span className="shift"><Clock3 size={15}/>{connected ? "Terhubung" : "Demo"}</span><span className="avatar">IA</span></div></header>

      {active === "Kasir" ? <div className="pos">
        <section className="catalog">
          <div className="head"><div><h1>Kasir</h1><p>Transaksi cepat dengan stok cabang terpantau.</p></div><button className="secondary"><Receipt size={16}/>Riwayat</button></div>
          <div className="searchrow"><div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari produk atau barcode..."/></div><button className="scan">Scan</button></div>
          <div className="chips">{cats.map(c => <button key={c} onClick={() => setCategory(c)} className={category === c ? "chip active" : "chip"}>{c}</button>)}</div>
          <div className="products">{loading ? <div className="empty"><Package size={30}/><b>Memuat produk...</b></div> : filtered.map(p =>
            <button className="product" key={p.id} disabled={!p.stock} onClick={() => add(p)}>
              <div className="pic"><Package size={24}/></div><b>{p.name}</b><small>{p.category} • {p.sku}</small><strong>{money(p.price)}</strong><em>{p.stock} stok</em>
            </button>
          )}</div>
        </section>

        <aside className="checkout">
          <div className="checkouthead"><div><h2>Keranjang</h2><small>{cart.reduce((s, i) => s + i.qty, 0)} item</small></div><button onClick={() => setCart([])} className="clear">Kosongkan</button></div>
          <div className="memberbox">
            <div className="membertitle"><Users size={16}/><b>Member</b>{member && <span>{member.tier}</span>}</div>
            <div className="membersearch"><input value={memberQuery} onChange={e => setMemberQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && findMember()} placeholder="Nomor WhatsApp member"/><button onClick={findMember}>Cari</button></div>
            {member && <div className="memberfound"><b>{member.name}</b><small>{member.points.toLocaleString("id-ID")} poin</small></div>}
          </div>
          <div className="cart">{cart.length ? cart.map(i =>
            <div className="item" key={i.id}><div><b>{i.name}</b><small>{money(i.price)} × {i.qty}</small></div><strong>{money(i.price * i.qty)}</strong><div className="qty"><button onClick={() => qty(i.id, -1)}>−</button><span>{i.qty}</span><button onClick={() => qty(i.id, 1)}>+</button></div></div>
          ) : <div className="empty"><ShoppingCart size={30}/><b>Belum ada produk</b><span>Pilih produk untuk memulai.</span></div>}</div>
          <div className="summary"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Diskon member</span><b className="green">− {money(discount)}</b></div><div className="grand"><span>Total</span><strong>{money(total)}</strong></div></div>
          <div className="payments"><b>Metode pembayaran</b><div className="paygrid">{["Tunai","QRIS","Transfer","Poin"].map(x => <button key={x} onClick={() => setPayment(x)} className={payment === x ? "pay active" : "pay"}>{x}</button>)}</div>{payment === "Tunai" && <input className="cash" type="number" value={cash} onChange={e => setCash(e.target.value)} placeholder="Nominal uang diterima"/>}{payment === "Tunai" && Number(cash) > total && <div className="change">Kembalian <b>{money(Number(cash) - total)}</b></div>}</div>
          <button className="paybutton" disabled={processing} onClick={pay}><Wallet size={18}/>{processing ? "Memproses..." : "Bayar " + money(total)}</button>
          {notice && <div className="notice">{notice}</div>}
        </aside>
      </div> : <Dashboard name={active}/>}
    </section>
  </main>;
}

function Dashboard({ name }: { name: string }) {
  const data = [["Omzet Hari Ini", "Belum terhubung", "", Wallet], ["Transaksi", "Belum terhubung", "", Receipt], ["Member Aktif", "Belum terhubung", "", Users], ["Stok Menipis", "Belum terhubung", "", Boxes]] as const;
  return <div className="dashboard"><div className="head"><div><h1>{name}</h1><p>Pantauan operasional Berkah Sumbing secara terpusat.</p></div><button className="primary"><Plus size={16}/>Tambah</button></div><div className="stats">{data.map(([a,b,c,I]) => <div className="stat" key={a}><div className="staticon"><I size={18}/></div><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div><div className="note">Modul <b>{name}</b> akan memakai sumber data Supabase yang sama dengan terminal kasir.</div></div>;
}
