const app = document.querySelector("#app");
let seed;
let state;
let activeCat = "all";
let query = "";

const money = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (match) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[match],
  );
async function boot() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    seed = await response.json();
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("rasaSenjaData") || "null");
    } catch (_) {
      localStorage.removeItem("rasaSenjaData");
    }
    state =
      stored &&
      stored.restaurant &&
      Array.isArray(stored.items) &&
      Array.isArray(stored.categories)
        ? stored
        : seed;
    document.querySelector("#year").textContent = new Date().getFullYear();
    render();
  } catch (error) {
    console.error(error);
    app.innerHTML =
      '<div class="wrap"><div class="panel login"><h1 class="section-title">Menu tidak dapat dimuat</h1><p class="notice">Periksa koneksi atau jalankan aplikasi melalui server lokal, lalu muat ulang halaman.</p></div></div>';
  }
}
function save() {
  try {
    localStorage.setItem("rasaSenjaData", JSON.stringify(state));
  } catch (error) {
    console.error(error);
    toast("Perubahan tidak dapat disimpan");
  }
}
function header() {
  document.querySelector("#headerName").textContent = state.restaurant.name;
  const isAdmin = location.hash.slice(2) === "admin";
  document
    .querySelectorAll("[data-nav]")
    .forEach((a) =>
      a.classList.toggle(
        "active",
        a.dataset.nav === (isAdmin ? "admin" : "catalog"),
      ),
    );
}
function card(i, index = 0) {
  return `<article class="card" style="--card-index:${index}"><img class="card-img" src="${esc(i.image)}" alt="${esc(i.name)}" loading="lazy"><div class="card-body"><h3>${esc(i.name)}</h3><p>${esc(i.description)}</p><span class="price">${money(i.price)}</span><span class="available ${i.available ? "" : "unavailable"}">${i.available ? "Tersedia" : "Habis"}</span><button class="btn" style="width:100%;margin-top:14px" data-detail="${i.id}">Lihat detail</button></div></article>`;
}
function catalog() {
  const r = state.restaurant;
  let items = state.items.filter(
    (i) =>
      (activeCat === "all" || i.category === activeCat) &&
      `${i.name} ${i.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return `<div class="wrap"><section class="hero"><div><span class="eyebrow">Selamat datang di</span><h1>${esc(r.name)}</h1><p>${esc(r.description)}</p><span class="pill">${esc(r.hours)}</span></div><div class="hero-image"><span class="pill hours">${esc(r.address)}</span></div></section><section id="menu"><div class="toolbar"><h2 class="section-title">Daftar menu</h2><input class="search" id="search" placeholder="Cari menu..." value="${esc(query)}" aria-label="Cari menu"></div><div class="categories">${state.categories.map((c) => `<button class="cat-btn ${c.id === activeCat ? "active" : ""}" data-cat="${c.id}">${esc(c.name)}</button>`).join("")}</div><div class="menu-grid" style="margin-top:22px">${items.length ? items.map(card).join("") : '<div class="empty">Menu tidak ditemukan.</div>'}</div></section></div>`;
}
function detailModal(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  const category = state.categories.find((entry) => entry.id === item.category)?.name || "Menu";
  app.insertAdjacentHTML("beforeend", `<div class="modal-backdrop detail-backdrop" id="detailModal"><article class="modal detail-modal"><button class="modal-close" id="closeDetail" aria-label="Tutup detail">&times;</button><img class="detail-modal-image" src="${esc(item.image)}" alt="${esc(item.name)}"><div class="detail-modal-content"><span class="eyebrow">${esc(category)}</span><h2 class="section-title">${esc(item.name)}</h2><p>${esc(item.description)}</p><strong class="price">${money(item.price)}</strong><p class="notice">${item.available ? "Menu ini tersedia hari ini." : "Menu ini sedang habis, silakan cek kembali nanti."}</p></div></article></div>`);
  const close = () => document.querySelector("#detailModal")?.remove();
  document.querySelector("#closeDetail").onclick = close;
  document.querySelector("#detailModal").onclick = (event) => {
    if (event.target.id === "detailModal") close();
  };
}
function login() {
  return `<div class="wrap"><div class="login panel"><span class="eyebrow">Area demo</span><h1 class="section-title">Masuk admin</h1><p style="color:var(--muted)">Demo ini tidak mengirim data ke server.</p><div class="form-row"><label>Email</label><input id="email" value="admin@rasasenja.test"></div><div class="form-row"><label>Password</label><input id="password" type="password" value="demo123"></div><button class="btn primary" id="loginBtn">Masuk ke dashboard</button><p class="notice" style="margin-bottom:0;margin-top:15px">Gunakan kredensial apa saja untuk mencoba simulasi login.</p></div></div>`;
}
function admin() {
  return `<div class="wrap"><div class="admin-head"><div><span class="eyebrow">Demo admin</span><h1 class="section-title">Dashboard menu</h1></div><button class="btn" id="logout">Keluar</button></div><div class="admin-grid"><div class="stat"><small>Total menu</small><strong>${state.items.length}</strong></div><div class="stat"><small>Menu tersedia</small><strong>${state.items.filter((i) => i.available).length}</strong></div><div class="stat"><small>Kategori</small><strong>${state.categories.length - 1}</strong></div></div><div class="panel"><div class="panel-head"><h2 class="section-title" style="font-size:23px">Menu items</h2><button class="btn primary" id="addItem">+ Tambah menu</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Kategori</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${state.items.map((i) => `<tr><td><b>${esc(i.name)}</b><br><small style="color:var(--muted)">${esc(i.description)}</small></td><td>${esc(state.categories.find((c) => c.id === i.category)?.name || "-")}</td><td>${money(i.price)}</td><td>${i.available ? "Tersedia" : "Habis"}</td><td><button class="icon-btn" data-edit="${i.id}">Edit</button><button class="icon-btn" data-delete="${i.id}">Hapus</button></td></tr>`).join("")}</tbody></table></div></div><div class="panel"><div class="panel-head"><h2 class="section-title" style="font-size:23px">Profil restoran</h2><button class="btn primary" id="saveProfile">Simpan profil</button></div><div class="form-row"><label>Nama restoran</label><input id="profileName" value="${esc(state.restaurant.name)}"></div><div class="form-row"><label>Deskripsi</label><textarea id="profileDesc">${esc(state.restaurant.description)}</textarea></div><div class="form-row"><label>Jam buka</label><input id="profileHours" value="${esc(state.restaurant.hours)}"></div></div><div class="panel"><div class="panel-head"><h2 class="section-title" style="font-size:23px">QR katalog publik</h2><button class="btn primary" id="makeQr">Buat QR</button></div><p style="color:var(--muted)">QR akan mengarah ke URL katalog ini:</p><code style="word-break:break-all">${location.href.split("#")[0]}#/</code><div id="qrArea"></div></div></div>`;
}
function modal(item) {
  let i = item || {
    name: "",
    description: "",
    price: 0,
    category: "mains",
    available: true,
    image: "",
  };
  return `<div class="modal-backdrop" id="modal"><form class="modal" id="itemForm"><h2>${item ? "Edit menu" : "Tambah menu"}</h2><div class="form-row"><label>Nama</label><input name="name" required value="${esc(i.name)}"></div><div class="form-row"><label>Deskripsi</label><textarea name="description" required>${esc(i.description)}</textarea></div><div class="form-row"><label>Harga (Rp)</label><input name="price" type="number" min="0" required value="${i.price}"></div><div class="form-row"><label>Kategori</label><select name="category">${state.categories
    .filter((c) => c.id !== "all")
    .map(
      (c) =>
        `<option value="${c.id}" ${c.id === i.category ? "selected" : ""}>${esc(c.name)}</option>`,
    )
    .join(
      "",
    )}</select></div><div class="form-row image-source"><label>Sumber foto</label><div class="source-options"><label><input type="radio" name="imageSource" value="url" checked> URL foto</label><label><input type="radio" name="imageSource" value="upload"> Upload foto</label></div><input name="imageUrl" value="${esc(i.image)}" placeholder="https://contoh.com/foto.jpg" type="url"><input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp"><small class="file-help">Maksimal 2 MB. Foto upload tersimpan di browser demo.</small><img id="imagePreview" class="image-preview" src="${esc(i.image)}" alt="Preview foto" ${i.image ? "" : "hidden"}></div><label><input name="available" type="checkbox" ${i.available ? "checked" : ""}> Tersedia</label><div style="display:flex;gap:10px;justify-content:end;margin-top:20px"><button type="button" class="btn" id="closeModal">Batal</button><button class="btn primary">Simpan</button></div></form></div>`;
}
function render() {
  header();
  let path = location.hash.slice(2);
  if (path === "admin") {
    if (sessionStorage.getItem("rasaAdmin")) {
      app.innerHTML = admin();
      bindAdmin();
    } else {
      app.innerHTML = login();
      document.querySelector("#loginBtn").onclick = () => {
        sessionStorage.setItem("rasaAdmin", "1");
        render();
      };
    }
  } else {
    app.innerHTML = catalog();
    bindCatalog();
  }
}
function bindCatalog() {
  setupScrollEffects();
  const search = document.querySelector("#search");
  search.oninput = (e) => {
    query = e.target.value;
    render();
    const next = document.querySelector("#search");
    next.focus();
    next.setSelectionRange(query.length, query.length);
  };
  document.querySelectorAll("[data-cat]").forEach(
    (b) =>
      (b.onclick = () => {
        activeCat = b.dataset.cat;
        render();
      }),
  );
  document.querySelectorAll("[data-detail]").forEach(
    (button) => (button.onclick = () => detailModal(button.dataset.detail)),
  );
}
function bindAdmin() {
  setupScrollEffects();
  document.querySelector("#logout").onclick = () => {
    sessionStorage.removeItem("rasaAdmin");
    render();
  };
  document.querySelector("#addItem").onclick = () => {
    app.insertAdjacentHTML("beforeend", modal());
    bindModal();
  };
  document.querySelectorAll("[data-edit]").forEach(
    (b) =>
      (b.onclick = () => {
        app.insertAdjacentHTML(
          "beforeend",
          modal(state.items.find((i) => i.id === b.dataset.edit)),
        );
        bindModal(b.dataset.edit);
      }),
  );
  document.querySelectorAll("[data-delete]").forEach(
    (b) =>
      (b.onclick = () => {
        if (confirm("Hapus menu ini?")) {
          state.items = state.items.filter((i) => i.id !== b.dataset.delete);
          save();
          render();
          toast("Menu dihapus");
        }
      }),
  );
  document.querySelector("#saveProfile").onclick = () => {
    state.restaurant.name = document.querySelector("#profileName").value;
    state.restaurant.description = document.querySelector("#profileDesc").value;
    state.restaurant.hours = document.querySelector("#profileHours").value;
    save();
    render();
    toast("Profil disimpan");
  };
  document.querySelector("#makeQr").onclick = () => {
    let area = document.querySelector("#qrArea");
    area.innerHTML = `<img style="width:180px;margin-top:18px;border-radius:10px" alt="QR katalog" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(location.href.split("#")[0] + "#/")}"/><p><small>QR demo dibuat melalui layanan publik.</small></p>`;
  };
}
function setupScrollEffects() {
  const elements = document.querySelectorAll(
    ".hero, #menu, .card, .panel, .stat",
  );
  elements.forEach((element, index) => {
    element.classList.add("scroll-reveal");
    if (element.classList.contains("card")) {
      element.style.setProperty("--reveal-delay", `${(index % 6) * 55}ms`);
    }
  });
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -45px" },
  );
  elements.forEach((element) => observer.observe(element));
  if (!window.__scrollHeaderEffect) {
    window.__scrollHeaderEffect = true;
    const header = document.querySelector(".site-header");
    window.addEventListener("scroll", () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 24);
    }, { passive: true });
  }
}
function bindModal(id) {
  document.querySelector("#closeModal").onclick = () =>
    document.querySelector("#modal").remove();
  const form = document.querySelector("#itemForm");
  const sourceInputs = form.querySelectorAll('input[name="imageSource"]');
  const imageUrl = form.querySelector('input[name="imageUrl"]');
  const imageFile = form.querySelector('input[name="imageFile"]');
  const preview = form.querySelector("#imagePreview");
  const updateSource = () => {
    const upload = form.querySelector('input[name="imageSource"]:checked').value === "upload";
    imageUrl.hidden = upload;
    imageFile.hidden = !upload;
    if (!upload) {
      preview.src = imageUrl.value;
      preview.hidden = !imageUrl.value;
    }
  };
  sourceInputs.forEach((input) => (input.onchange = updateSource));
  imageUrl.oninput = () => {
    preview.src = imageUrl.value;
    preview.hidden = !imageUrl.value;
  };
  imageFile.onchange = () => {
    const file = imageFile.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      imageFile.value = "";
      toast("Ukuran foto maksimal 2 MB");
      return;
    }
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
  };
  updateSource();
  form.onsubmit = async (e) => {
    e.preventDefault();
    let f = new FormData(e.target),
      name = String(f.get("name")).trim(),
      description = String(f.get("description")).trim(),
      base =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `menu-${Date.now()}`,
      newId =
        id ||
        (!state.items.some((i) => i.id === base)
          ? base
          : `${base}-${Date.now()}`),
      image = String(f.get("imageUrl") || "").trim(),
      obj = {
        id: newId,
        name,
        description,
        price: Number(f.get("price")),
        category: f.get("category"),
        image,
        available: f.get("available") === "on",
      };
    const file = imageFile.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return;
      obj.image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    if (!obj.name || !Number.isFinite(obj.price) || obj.price < 0 || !obj.image) {
      toast("Lengkapi foto menu terlebih dahulu");
      return;
    }
    if (id) state.items = state.items.map((i) => (i.id === id ? obj : i));
    else state.items.push(obj);
    save();
    render();
    toast("Menu disimpan");
  };
}
function toast(t) {
  let x = document.createElement("div");
  x.className = "toast";
  x.textContent = t;
  document.body.append(x);
  setTimeout(() => x.remove(), 2200);
}
window.onhashchange = render;
boot();
