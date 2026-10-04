"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Boxes, ChevronDown, Clock3, LayoutDashboard, LogOut, Menu,
  Package, Plus, Receipt, Search, Settings, ShoppingCart, Store, Users, Wallet, X
} from "lucide-react";
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
  const [connected] = useState(true);

  const loadCatalog = () => {
    try {
      const savedProducts = localStorage.getItem("berkah-sumbing-products");
      const savedMembers = localStorage.getItem("berkah-sumbing-members");
      setProducts(savedProducts ? JSON.parse(savedProducts) : demoProducts);
      setMembers(savedMembers ? JSON.parse(savedMembers) : demoMembers);
      if (!savedProducts) localStorage.setItem("berkah-sumbing-products", JSON.stringify(demoProducts));
      if (!savedMembers) localStorage.setItem("berkah-sumbing-members", JSON.stringify(demoMembers));
      setNotice("Mode lokal aktif. Data tersimpan di perangkat ini.");
    } catch {
      setProducts(demoProducts);
      setMembers(demoMembers);
      setNotice("Penyimpanan lokal bermasalah. Data demo digunakan.");
    }
    setLoading(false);
  };

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Boxes, ChevronDown, Clock3, LayoutDashboard, LogOut, Menu,
  Package, Plus, Receipt, Search, Settings, ShoppingCart, Store, Users, Wallet, X
} from "lucide-react";
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
  const [connected] = useState(true);

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

  useEffect(() => { loadCatalog(); }, []);

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

  const findMember = () => {
    const phone = memberQuery.trim();
    if (!phone) return;
    const m = members.find(x => x.phone === phone) ?? null;
    setMember(m);
    setNotice(m ? "Member ditemukan: " + m.name : "Member tidak ditemukan");
  };  const pay = () => {
    if (!cart.length) return setNotice("Keranjang masih kosong");
    if (payment === "Tunai" && Number(cash) < total) return setNotice("Nominal tunai kurang");
    if (payment === "Poin" && !member) return setNotice("Pilih member untuk pembayaran poin");

    setProcessing(true);
    const sales = JSON.parse(localStorage.getItem("berkah-sumbing-sales") || "[]");
    const invoiceNo = "BS-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const sale = {
      id: crypto.randomUUID(),
      invoice_no: invoiceNo,
      created_at: new Date().toISOString(),
      items: cart.map(i => ({ product_id: i.id, name: i.name, qty: i.qty, price: i.price })),
      subtotal,
      discount,
      total,
      payment_method: payment,
      member_id: member?.id ?? null
    };
    localStorage.setItem("berkah-sumbing-sales", JSON.stringify([sale, ...sales]));

    const nextProducts = products.map(p => {
      const item = cart.find(i => i.id === p.id);
      return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
    });
    setProducts(nextProducts);
    localStorage.setItem("berkah-sumbing-products", JSON.stringify(nextProducts));

    if (member) {
      const nextMembers = members.map(m => m.id === member.id ? { ...m, points: m.points + Math.floor(total / 10000) } : m);
      setMembers(nextMembers);
      localStorage.setItem("berkah-sumbing-members", JSON.stringify(nextMembers));
    }

    const change = payment === "Tunai" ? Math.max(0, Number(cash) - total) : 0;
    setProcessing(false);
    setNotice("Transaksi berhasil • " + invoiceNo + " • " + money(total) + (change ? " • Kembalian " + money(change) : ""));
    setCart([]);
    setCash("");
    setMember(null);
  };
