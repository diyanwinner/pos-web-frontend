const state = { items: [] };

function rupiah(n){ return (n||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function apiBase(){ return document.getElementById('apiBase').value.trim(); }
function saleId(){ return 'S-' + Date.now(); }

async function fetchJSON(url, opts={}){
  const res = await fetch(url, { ...opts, headers: { 'Content-Type':'application/json', ...(opts.headers||{}) } });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

function renderResults(list){
  const wrap = document.getElementById('results');
  wrap.innerHTML = '';
  list.forEach(p => {
    const row = document.createElement('div');
    row.className = 'product';
    row.innerHTML = `<div>
        <div style="font-weight:700">${p.name}</div>
        <div style="color:#8fa1b3">${p.sku||''} ${p.barcode||''}</div>
      </div>
      <button class="btn" data-id="${p.id}">+ Tambah</button>`;
    row.querySelector('button').onclick = () => {
      const exist = state.items.find(x => x.product_id === p.id);
      if (exist) exist.qty += 1; else state.items.push({ product_id:p.id, name:p.name, price:p.price, qty:1 });
      renderTicket();
    };
    wrap.appendChild(row);
  });
}

function total(){
  return Math.round(state.items.reduce((s,it)=> s + it.qty*it.price - (it.discount||0), 0));
}

function renderTicket(){
  const el = document.getElementById('ticket');
  el.innerHTML = '';
  state.items.forEach((it, idx) => {
    const div = document.createElement('div');
    div.className = 'line';
    div.innerHTML = `
      <div>${it.name}</div>
      <input class="qty" type="number" min="1" value="${it.qty}" data-idx="${idx}">
      <div class="sum">Rp ${rupiah(it.qty*it.price)}</div>
      <button class="btn" data-del="${idx}">×</button>`;
    el.appendChild(div);
  });
  const sum = document.createElement('div');
  sum.style = 'margin-top:10px;text-align:right;font-weight:700;font-size:16px;';
  sum.textContent = `TOTAL: Rp ${rupiah(total())}`;
  el.appendChild(sum);
}

async function search(){
  const q = document.getElementById('q').value;
  try{
    const list = await fetchJSON(apiBase()+"/products?q="+encodeURIComponent(q));
    renderResults(list);
  }catch(e){ alert("Gagal cari produk: "+e.message); }
}

async function pay(){
  if(!state.items.length) return alert('Belum ada item');
  const payload = {
    id: saleId(),
    items: state.items.map(it => ({ product_id: it.product_id, qty: it.qty, price: it.price })),
    discount: +document.getElementById('discount').value || 0,
    pay_cash: +document.getElementById('pay_cash').value || 0
  };
  try{
    const res = await fetchJSON(apiBase()+"/sales", { method:'POST', body: JSON.stringify(payload) });
    alert("Lunas! Total: Rp "+res.total.toLocaleString('id-ID')+" | Kembali: Rp "+res.change.toLocaleString('id-ID'));
    state.items = [];
    renderTicket();
  }catch(e){ alert("Gagal bayar: "+e.message); }
}

function bootstrap(){
  document.getElementById('apiBase').value = "https://pos-online-api.onrender.com";
  document.getElementById('btnSearch').onclick = search;
  document.getElementById('q').addEventListener('keydown', (e)=>{ if(e.key==='Enter') search(); });
  document.getElementById('ticket').addEventListener('input', (e)=>{
    if(e.target.classList.contains('qty')){
      const idx = +e.target.dataset.idx;
      state.items[idx].qty = Math.max(1, +e.target.value);
      renderTicket();
    }
  });
  document.getElementById('ticket').addEventListener('click', (e)=>{
    const idx = e.target.dataset.del;
    if(idx !== undefined){ state.items.splice(+idx,1); renderTicket(); }
  });
  document.getElementById('pay').onclick = pay;
  renderTicket();
}

bootstrap();
