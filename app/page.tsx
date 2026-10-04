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
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(n);

const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

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
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    category: "",
    price: "",
    stock: "",
    sku: "",
    barcode: ""
  });
  const [productEditing, setProductEditing] = useState(false);
  const [stockForm, setStockForm] = useState({ productId: "", type: "Masuk", qty: "", note: "" });

  const loadCatalog = () => {
    try {
      const savedProducts = localStorage.getItem("berkah-sumbing-products");
      const savedMembers = localStorage.getItem("berkah-sumbing-members");

      const nextProducts = readLocal<Product[]>("berkah-sumbing-products", demoProducts);
      const nextMembers = readLocal<Member[]>("berkah-sumbing-members", demoMembers);

      setProducts(nextProducts);
      setMembers(nextMembers);

      if (!savedProducts) {
        localStorage.setItem("berkah-sumbing-products", JSON.stringify(demoProducts));
      }
      if (!savedMembers) {
        localStorage.setItem("berkah-sumbing-members", JSON.stringify(demoMembers));
      }

      setNotice("Mode lokal aktif. Data tersimpan di perangkat ini.");
    } catch {
      setProducts(demoProducts);
      setMembers(demoMembers);
      setNotice("Penyimpanan lokal bermasalah. Data demo digunakan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const cats = ["Semua", ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = useMemo(
    () =>
      products.filter(p =>
        (category === "Semua" || p.category === category) &&
        (p.name + " " + p.sku + " " + (p.barcode ?? ""))
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [products, query, category]
  );

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const rate = member
    ? member.tier === "Gold" ? 0.10
      : member.tier === "Silver" ? 0.05
      : 0.02
    : 0;
  const discount = Math.round(subtotal * rate);
  const total = Math.max(0, subtotal - discount);

  const add = (p: Product) => {
    if (p.stock <= 0) return;

    setCart(c => {
      const existing = c.find(i => i.id === p.id);
      return existing
        ? c.map(i =>
            i.id === p.id
              ? { ...i, qty: Math.min(p.stock, i.qty + 1) }
              : i
          )
        : [{ ...p, qty: 1 }, ...c];
    });
  };

  const qty = (id: string, delta: number) => {
    setCart(c =>
      c
        .map(i =>
          i.id === id
            ? { ...i, qty: Math.min(i.stock, Math.max(0, i.qty + delta)) }
            : i
        )
        .filter(i => i.qty > 0)
    );
  };

  const findMember = () => {
    const phone = memberQuery.trim();
    if (!phone) return;

    const found = members.find(x => x.phone === phone) ?? null;
    setMember(found);
    setNotice(found ? "Member ditemukan: " + found.name : "Member tidak ditemukan");
  };

  const pay = () => {
    if (!cart.length) {
      setNotice("Keranjang masih kosong");
      return;
    }

    if (payment === "Tunai" && Number(cash) < total) {
      setNotice("Nominal tunai kurang");
      return;
    }

    if (payment === "Poin") {
      if (!member) {
        setNotice("Pilih member untuk pembayaran poin");
        return;
      }
      if (member.points < total) {
        setNotice("Poin member tidak mencukupi");
        return;
      }
    }

    setProcessing(true);

    try {
      const sales = readLocal<unknown[]>("berkah-sumbing-sales", []);
      const latestProducts = readLocal<Product[]>("berkah-sumbing-products", products);

      for (const item of cart) {
        const current = latestProducts.find(p => p.id === item.id);
        if (!current || current.stock < item.qty) {
          setNotice("Stok berubah. Silakan cek keranjang lalu coba lagi.");
          return;
        }
      }

      const latestMembers = readLocal<Member[]>("berkah-sumbing-members", members);
      const currentMember = member
        ? latestMembers.find(m => m.id === member.id)
        : null;

      if (member && (!currentMember || currentMember.points < (payment === "Poin" ? total : 0))) {
        setNotice("Data member berubah. Silakan cari member lagi.");
        return;
      }

      const invoiceNo =
        "BS-" +
        new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

      const sale = {
        id: crypto.randomUUID(),
        invoice_no: invoiceNo,
        created_at: new Date().toISOString(),
        items: cart.map(i => ({
          product_id: i.id,
          name: i.name,
          qty: i.qty,
          price: i.price
        })),
        subtotal,
        discount,
        total,
        payment_method: payment,
        member_id: member?.id ?? null
      };

      localStorage.setItem(
        "berkah-sumbing-sales",
        JSON.stringify([sale, ...sales])
      );

      const nextProducts = latestProducts.map(p => {
        const item = cart.find(i => i.id === p.id);
        return item
          ? { ...p, stock: Math.max(0, p.stock - item.qty) }
          : p;
      });

      setProducts(nextProducts);
      localStorage.setItem(
        "berkah-sumbing-products",
        JSON.stringify(nextProducts)
      );

      if (member) {
        const pointsEarned = Math.floor(total / 10000);
        const pointsUsed = payment === "Poin" ? total : 0;

        const nextMembers = latestMembers.map(m =>
          m.id === member.id
            ? {
                ...m,
                points: Math.max(
                  0,
                  m.points - pointsUsed + pointsEarned
                )
              }
            : m
        );

        setMembers(nextMembers);
        localStorage.setItem(
          "berkah-sumbing-members",
          JSON.stringify(nextMembers)
        );
      }

      const change =
        payment === "Tunai"
          ? Math.max(0, Number(cash) - total)
          : 0;

      setNotice(
        "Transaksi berhasil • " +
          invoiceNo +
          " • " +
          money(total) +
          (change ? " • Kembalian " + money(change) : "")
      );

      setCart([]);
      setCash("");
      setMember(null);
      setMemberQuery("");
      setPayment("Tunai");
    } catch {
      setNotice("Transaksi gagal disimpan ke penyimpanan perangkat.");
    } finally {
      setProcessing(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      id: "",
      name: "",
      category: "",
      price: "",
      stock: "",
      sku: "",
      barcode: ""
    });
    setProductEditing(false);
  };

  const saveProduct = () => {
    const name = productForm.name.trim();
    const category = productForm.category.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    const sku = productForm.sku.trim();
    const barcode = productForm.barcode.trim();

    if (!name || !category || !sku || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setNotice("Lengkapi nama, kategori, harga, stok, dan SKU dengan benar.");
      return;
    }

    try {
      const latest = readLocal<Product[]>("berkah-sumbing-products", products);
      const duplicateSku = latest.some(p => p.sku === sku && p.id !== productForm.id);
      if (duplicateSku) {
        setNotice("SKU sudah digunakan produk lain.");
        return;
      }

      const duplicateBarcode = barcode && latest.some(p => p.barcode === barcode && p.id !== productForm.id);
      if (duplicateBarcode) {
        setNotice("Barcode sudah digunakan produk lain.");
        return;
      }

      const product: Product = {
        id: productForm.id || crypto.randomUUID(),
        name,
        category,
        price,
        stock,
        sku,
        barcode: barcode || null
      };

      const next = productForm.id
        ? latest.map(p => p.id === productForm.id ? product : p)
        : [product, ...latest];

      localStorage.setItem("berkah-sumbing-products", JSON.stringify(next));
      setProducts(next);
      resetProductForm();
      setNotice(productForm.id ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
    } catch {
      setNotice("Produk gagal disimpan ke perangkat.");
    }
  };

  const editProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      sku: product.sku,
      barcode: product.barcode ?? ""
    });
    setProductEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;

    try {
      const latest = readLocal<Product[]>("berkah-sumbing-products", products);
      const next = latest.filter(p => p.id !== id);
      localStorage.setItem("berkah-sumbing-products", JSON.stringify(next));
      setProducts(next);
      if (productForm.id === id) resetProductForm();
      setNotice("Produk berhasil dihapus.");
    } catch {
      setNotice("Produk gagal dihapus.");
    }
  };

  const productCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const saveStockMovement = () => {
    const qty = Number(stockForm.qty);
    const product = products.find(p => p.id === stockForm.productId);
    if (!product || !Number.isInteger(qty) || qty <= 0) {
      setNotice("Pilih produk dan masukkan jumlah stok yang valid.");
      return;
    }
    if (stockForm.type === "Keluar" && qty > product.stock) {
      setNotice("Stok keluar melebihi stok tersedia.");
      return;
    }

    try {
      const latest = readLocal<Product[]>("berkah-sumbing-products", products);
      const current = latest.find(p => p.id === product.id);
      if (!current) {
        setNotice("Produk tidak ditemukan. Muat ulang data.");
        return;
      }
      const nextStock = stockForm.type === "Masuk" ? current.stock + qty : current.stock - qty;
      const nextProducts = latest.map(p => p.id === current.id ? { ...p, stock: nextStock } : p);
      localStorage.setItem("berkah-sumbing-products", JSON.stringify(nextProducts));

      const latestMovements = readLocal<Array<{id:string; productId:string; type:"Masuk"|"Keluar"; qty:number; note:string; createdAt:string}>>(
        "berkah-sumbing-stock-movements", []
      );
      const movement = {
        id: crypto.randomUUID(),
        productId: current.id,
        type: stockForm.type as "Masuk"|"Keluar",
        qty,
        note: stockForm.note.trim(),
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("berkah-sumbing-stock-movements", JSON.stringify([movement, ...latestMovements].slice(0, 500)));
      setProducts(nextProducts);
      setStockForm({ productId: "", type: "Masuk", qty: "", note: "" });
      setNotice(`Stok ${stockForm.type.toLowerCase()} berhasil dicatat untuk ${current.name}.`);
    } catch {
      setNotice("Perubahan stok gagal disimpan.");
    }
  };

  const stockSummary = useMemo(() => {
    const low = products.filter(p => p.stock <= 10);
    const out = products.filter(p => p.stock <= 0);
    const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
    return { low, out, totalUnits };
  }, [products]);

  return (
    <main className="shell">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <div className="brand">
          <div className="logo">BS</div>
          <div>
            <b>Berkah Sumbing</b>
            <small>POS • Pusat</small>
          </div>
          <button className="close" onClick={() => setMenu(false)}>
            <X size={19} />
          </button>
        </div>

        <nav>
          {nav.map(([name, Icon]) => (
            <button
              className={active === name ? "nav active" : "nav"}
              key={name}
              onClick={() => {
                setActive(name);
                setMenu(false);
              }}
            >
              <Icon size={18} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebottom">
          <div className="branch">
            <Store size={17} />
            <div>
              <b>Penyimpanan</b>
              <small>Perangkat ini</small>
            </div>
          </div>
          <button className="nav">
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="hamb" onClick={() => setMenu(true)}>
            <Menu />
          </button>
          <div className="crumb">
            {active}
            <ChevronDown size={14} />
          </div>
          <div className="topright">
            <span className="shift">
              <Clock3 size={15} />
              Lokal
            </span>
            <span className="avatar">IA</span>
          </div>
        </header>

        {active === "Kasir" ? (
          <div className="pos">
            <section className="catalog">
              <div className="head">
                <div>
                  <h1>Kasir</h1>
                  <p>Transaksi cepat dengan stok yang tersimpan di perangkat.</p>
                </div>
                <button className="secondary">
                  <Receipt size={16} />
                  Riwayat
                </button>
              </div>

              <div className="searchrow">
                <div className="search">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Cari produk atau barcode..."
                  />
                </div>
                <button className="scan">Scan</button>
              </div>

              <div className="chips">
                {cats.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={category === c ? "chip active" : "chip"}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="products">
                {loading ? (
                  <div className="empty">
                    <Package size={30} />
                    <b>Memuat produk...</b>
                  </div>
                ) : filtered.length ? (
                  filtered.map(p => (
                    <button
                      className="product"
                      key={p.id}
                      disabled={!p.stock}
                      onClick={() => add(p)}
                    >
                      <div className="pic">
                        <Package size={24} />
                      </div>
                      <b>{p.name}</b>
                      <small>
                        {p.category} • {p.sku}
                      </small>
                      <strong>{money(p.price)}</strong>
                      <em>{p.stock} stok</em>
                    </button>
                  ))
                ) : (
                  <div className="empty">
                    <Search size={30} />
                    <b>Produk tidak ditemukan</b>
                    <span>Coba kata kunci atau kategori lain.</span>
                  </div>
                )}
              </div>
            </section>

            <aside className="checkout">
              <div className="checkouthead">
                <div>
                  <h2>Keranjang</h2>
                  <small>
                    {cart.reduce((s, i) => s + i.qty, 0)} item
                  </small>
                </div>
                <button onClick={() => setCart([])} className="clear">
                  Kosongkan
                </button>
              </div>

              <div className="memberbox">
                <div className="membertitle">
                  <Users size={16} />
                  <b>Member</b>
                  {member && <span>{member.tier}</span>}
                </div>
                <div className="membersearch">
                  <input
                    value={memberQuery}
                    onChange={e => setMemberQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && findMember()}
                    placeholder="Nomor WhatsApp member"
                  />
                  <button onClick={findMember}>Cari</button>
                </div>
                {member && (
                  <div className="memberfound">
                    <b>{member.name}</b>
                    <small>{member.points.toLocaleString("id-ID")} poin</small>
                  </div>
                )}
              </div>

              <div className="cart">
                {cart.length ? (
                  cart.map(i => (
                    <div className="item" key={i.id}>
                      <div>
                        <b>{i.name}</b>
                        <small>
                          {money(i.price)} × {i.qty}
                        </small>
                      </div>
                      <strong>{money(i.price * i.qty)}</strong>
                      <div className="qty">
                        <button onClick={() => qty(i.id, -1)}>−</button>
                        <span>{i.qty}</span>
                        <button
                          onClick={() => qty(i.id, 1)}
                          disabled={i.qty >= i.stock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <ShoppingCart size={30} />
                    <b>Belum ada produk</b>
                    <span>Pilih produk untuk memulai.</span>
                  </div>
                )}
              </div>

              <div className="summary">
                <div>
                  <span>Subtotal</span>
                  <b>{money(subtotal)}</b>
                </div>
                <div>
                  <span>Diskon member</span>
                  <b className="green">− {money(discount)}</b>
                </div>
                <div className="grand">
                  <span>Total</span>
                  <strong>{money(total)}</strong>
                </div>
              </div>

              <div className="payments">
                <b>Metode pembayaran</b>
                <div className="paygrid">
                  {["Tunai", "QRIS", "Transfer", "Poin"].map(x => (
                    <button
                      key={x}
                      onClick={() => setPayment(x)}
                      className={payment === x ? "pay active" : "pay"}
                    >
                      {x}
                    </button>
                  ))}
                </div>

                {payment === "Tunai" && (
                  <input
                    className="cash"
                    type="number"
                    min="0"
                    value={cash}
                    onChange={e => setCash(e.target.value)}
                    placeholder="Nominal uang diterima"
                  />
                )}

                {payment === "Tunai" && Number(cash) > total && (
                  <div className="change">
                    Kembalian <b>{money(Number(cash) - total)}</b>
                  </div>
                )}
              </div>

              <button
                className="paybutton"
                disabled={processing}
                onClick={pay}
              >
                <Wallet size={18} />
                {processing ? "Memproses..." : "Bayar " + money(total)}
              </button>

              {notice && <div className="notice">{notice}</div>}
            </aside>
          </div>
        ) : active === "Produk" ? (
          <div className="dashboard">
            <div className="head">
              <div>
                <h1>Produk</h1>
                <p>Kelola katalog produk yang tersimpan di perangkat ini.</p>
              </div>
              <button className="primary" onClick={resetProductForm}>
                <Plus size={16} /> Produk Baru
              </button>
            </div>

            <div className="productmanager">
              <section className="formcard">
                <div className="formtitle">
                  <div>
                    <b>{productEditing ? "Edit Produk" : "Tambah Produk"}</b>
                    <small>{productEditing ? "Perbarui data produk." : "Masukkan produk baru."}</small>
                  </div>
                  {productEditing && <button className="clear" onClick={resetProductForm}>Batal</button>}
                </div>
                <div className="formgrid">
                  <label>Nama Produk<input value={productForm.name} onChange={e => setProductForm(f => ({...f, name: e.target.value}))} placeholder="Contoh: Beras Premium 5kg" /></label>
                  <label>Kategori<input value={productForm.category} onChange={e => setProductForm(f => ({...f, category: e.target.value}))} placeholder="Contoh: Sembako" /></label>
                  <label>Harga<input type="number" min="1" value={productForm.price} onChange={e => setProductForm(f => ({...f, price: e.target.value}))} placeholder="72000" /></label>
                  <label>Stok<input type="number" min="0" step="1" value={productForm.stock} onChange={e => setProductForm(f => ({...f, stock: e.target.value}))} placeholder="0" /></label>
                  <label>SKU<input value={productForm.sku} onChange={e => setProductForm(f => ({...f, sku: e.target.value}))} placeholder="SKU-001" /></label>
                  <label>Barcode <span>(opsional)</span><input value={productForm.barcode} onChange={e => setProductForm(f => ({...f, barcode: e.target.value}))} placeholder="89910001" /></label>
                </div>
                <button className="primary wide" onClick={saveProduct}>
                  <Plus size={16} /> {productEditing ? "Simpan Perubahan" : "Simpan Produk"}
                </button>
              </section>

              <section className="tablecard">
                <div className="tabletools">
                  <div className="search">
                    <Search size={17} />
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nama, SKU, barcode..." />
                  </div>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Semua">Semua kategori</option>
                    {productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="producttable">
                  <div className="tr th"><span>Produk</span><span>Kategori</span><span>Harga</span><span>Stok</span><span>Aksi</span></div>
                  {filtered.length ? filtered.map(p => (
                    <div className="tr" key={p.id}>
                      <div><b>{p.name}</b><small>SKU: {p.sku}{p.barcode ? ` • ${p.barcode}` : ""}</small></div>
                      <span>{p.category}</span>
                      <span>{money(p.price)}</span>
                      <span>{p.stock}</span>
                      <div className="actions">
                        <button className="secondary small" onClick={() => editProduct(p)}>Edit</button>
                        <button className="danger small" onClick={() => deleteProduct(p.id)}>Hapus</button>
                      </div>
                    </div>
                  )) : (
                    <div className="empty"><Package size={28} /><b>Produk tidak ditemukan</b><span>Tambahkan produk baru atau ubah pencarian.</span></div>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : active === "Stok" ? (
          <div className="dashboard">
            <div className="head">
              <div>
                <h1>Stok</h1>
                <p>Kelola stok masuk, stok keluar, dan pantau produk menipis.</p>
              </div>
            </div>

            <div className="stockstats">
              <div className="statcard"><span>Total Unit</span><b>{stockSummary.totalUnits}</b><small>stok seluruh produk</small></div>
              <div className="statcard"><span>Stok Menipis</span><b>{stockSummary.low.length}</b><small>≤ 10 unit</small></div>
              <div className="statcard"><span>Stok Habis</span><b>{stockSummary.out.length}</b><small>0 unit</small></div>
            </div>

            <div className="stockgrid">
              <section className="formcard">
                <div className="formtitle"><div><b>Penyesuaian Stok</b><small>Catat stok masuk atau keluar.</small></div></div>
                <div className="formgrid">
                  <label>Produk
                    <select value={stockForm.productId} onChange={e => setStockForm(f => ({...f, productId:e.target.value}))}>
                      <option value="">Pilih produk</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} • stok {p.stock}</option>)}
                    </select>
                  </label>
                  <label>Jenis
                    <select value={stockForm.type} onChange={e => setStockForm(f => ({...f, type:e.target.value}))}>
                      <option value="Masuk">Stok Masuk</option>
                      <option value="Keluar">Stok Keluar</option>
                    </select>
                  </label>
                  <label>Jumlah<input type="number" min="1" step="1" value={stockForm.qty} onChange={e => setStockForm(f => ({...f, qty:e.target.value}))} placeholder="10" /></label>
                  <label>Catatan <span>(opsional)</span><input value={stockForm.note} onChange={e => setStockForm(f => ({...f, note:e.target.value}))} placeholder="Pembelian dari supplier" /></label>
                </div>
                <button className="primary wide" onClick={saveStockMovement}><Boxes size={16}/> Simpan Perubahan Stok</button>
              </section>

              <section className="tablecard">
                <div className="formtitle"><div><b>Produk Menipis</b><small>Prioritas pengadaan stok.</small></div></div>
                <div className="stocklist">
                  {stockSummary.low.length ? stockSummary.low.map(p => (
                    <div className="stockrow" key={p.id}>
                      <div><b>{p.name}</b><small>{p.sku} • {p.category}</small></div>
                      <strong className={p.stock === 0 ? "stockout" : "stocklow"}>{p.stock} unit</strong>
                    </div>
                  )) : <div className="empty"><Boxes size={28}/><b>Semua stok aman</b><span>Belum ada produk dengan stok ≤ 10.</span></div>}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <Dashboard name={active} products={products} />
        )}
      </section>
    </main>
  );
}

function Dashboard({
  name,
  products
}: {
  name: string;
  products: Product[];
}) {
  const lowStock = products.filter(p => p.stock <= 5).length;

  const data = [
    ["Produk", String(products.length), "tersimpan", Package],
    ["Stok Menipis", String(lowStock), "perlu dicek", Boxes],
    ["Penyimpanan", "Lokal", "perangkat ini", Store],
    ["Status", "Aktif", "offline-ready", Wallet]
  ] as const;

  return (
    <div className="dashboard">
      <div className="head">
        <div>
          <h1>{name}</h1>
          <p>Data POS tersimpan secara lokal di perangkat ini.</p>
        </div>
        <button className="primary">
          <Plus size={16} />
          Tambah
        </button>
      </div>

      <div className="stats">
        {data.map(([label, value, note, Icon]) => (
          <div className="stat" key={label}>
            <div className="staticon">
              <Icon size={18} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>

      <div className="note">
        Modul <b>{name}</b> saat ini menggunakan penyimpanan lokal browser.
        Data tidak tersinkron otomatis ke perangkat lain.
      </div>
    </div>
  );
}
