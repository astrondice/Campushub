/* CampusHub front-end (ready for backend later) */
const DBKEY = 'campushub_v1';
const store = {
  read(){ try{return JSON.parse(localStorage.getItem(DBKEY))||{} }catch{return{}} },
  write(d){ localStorage.setItem(DBKEY, JSON.stringify(d)) },
  get(k, f){ const d=this.read(); return d[k]===undefined?f:d[k] },
  set(k,v){ const d=this.read(); d[k]=v; this.write(d) }
};

// initialize if needed
if(!store.get('init')){
  store.set('init', true);
  store.set('students',[{u:'s',p:'123',name:'Student'}]);
  store.set('admins',[{u:'a',p:'123',name:'Admin'}]);
  store.set('owner',{u:'o',p:'123',name:'Owner'});
  store.set('brand',{name:'CampusHub',primary:'#ff6600'});
  store.set('news',[{t:'Welcome to CampusHub',at:Date.now()-86400000}]);
  store.set('gallery',[]);
  store.set('competitions',[]);
  store.set('appeals',[]);
}

// simple helpers
const $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const routeLinks = $$('.nav a'), routes = $$('.route');
const wallpaper = $('#wallpaper'), brandLogo = $('#brandLogo'), brandName = $('#brandName');
const loginBtn = $('#loginBtn'), userMenu = $('#userMenu'), menuBtn = $('#menuBtn'), menuSheet = $('#menuSheet');
const loginModal = $('#loginModal'), ownerModal = $('#ownerModal'), loginForm = $('#loginForm');
let currentRole = store.get('sessionRole', null), currentUser = store.get('sessionUser', null);

// apply branding
function applyBrand(){
  const b = store.get('brand',{});
  brandName.textContent = b.name||'CampusHub';
  document.documentElement.style.setProperty('--primary', b.primary||'#ff6600');
  wallpaper.style.backgroundImage = b.wallpaper?`url(${b.wallpaper})`:`url(assets/wallpaper.jpg)`;
  if(b.logo) brandLogo.src = b.logo;
}
applyBrand();

// navigation
routeLinks.forEach(a=>a.addEventListener('click', e=>{ e.preventDefault(); go(a.dataset.route); }));
function go(route){ routes.forEach(r=>r.classList.remove('active')); $('#'+route).classList.add('active'); routeLinks.forEach(a=> a.classList.toggle('active', a.dataset.route===route)); window.scrollTo({top:0,behavior:'smooth'}); }

// login modal open
$('#openStudent').addEventListener('click', ()=> openLogin('student'));
$('#openAdmin').addEventListener('click', ()=> openLogin('admin'));
$('#openOwner').addEventListener('click', ()=> openLogin('owner'));
function openLogin(role){ loginModal.hidden=false; loginForm.dataset.role=role; $('#loginUser').value=''; $('#loginPass').value=''; }

// tabs in modal
$$('.tabs button').forEach(b=> b.addEventListener('click', ()=> { $$('.tabs button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); loginForm.dataset.role=b.dataset.tab; }));
$('#closeLogin').addEventListener('click', ()=> loginModal.hidden=true);

// login processing (client-side demo)
loginForm.addEventListener('submit', e=>{
  e.preventDefault();
  const role=loginForm.dataset.role, u=$('#loginUser').value.trim(), p=$('#loginPass').value;
  let ok=false;
  if(role==='student'){ ok = store.get('students',[]).some(x=> (x.u===u||x.email===u)&&x.p===p); }
  if(role==='admin'){ ok = store.get('admins',[]).some(x=> x.u===u && x.p===p); }
  if(role==='owner'){ const o=store.get('owner',{}); ok = (o.u===u||o.email===u) && o.p===p; }
  if(!ok){ $('#loginError').textContent='Invalid credentials'; return; }
  currentRole=role; currentUser=u; store.set('sessionRole',currentRole); store.set('sessionUser',currentUser);
  $('#userAvatar').src = store.get('brand',{}).logo || 'assets/profile.png';
  loginModal.hidden=true; applyRoleUI();
});

function applyRoleUI(){
  $$('.role-student').forEach(el=> el.style.display = currentRole==='student'? '': 'none');
  $$('.role-admin').forEach(el=> el.style.display = currentRole==='admin'? '': 'none');
  $$('.role-owner').forEach(el=> el.style.display = currentRole==='owner'? '': 'none');
  if(currentRole){ loginBtn.hidden=true; userMenu.hidden=false; } else { loginBtn.hidden=false; userMenu.hidden=true; }
  $$('.owner-only').forEach(el=> el.style.display = currentRole==='owner'? '': 'none');
}
applyRoleUI();

// menu
menuBtn.addEventListener('click', e=>{ e.stopPropagation(); menuSheet.classList.toggle('open'); });
document.addEventListener('click', ()=> menuSheet.classList.remove('open'));
menuSheet.addEventListener('click', e=>{ const btn=e.target.closest('button'); if(!btn) return; const action=btn.dataset.action; if(action==='logout'){ currentRole=null; currentUser=null; store.set('sessionRole',null); store.set('sessionUser',null); applyRoleUI(); } if(action==='settings'){ ownerModal.hidden=false; } });

// owner settings handlers
$('#setLogo').addEventListener('change', async e=>{ const f=e.target.files[0]; if(!f) return; const data=await fileToDataURL(f); const b=store.get('brand',{}); b.logo=data; store.set('brand',b); applyBrand(); });
$('#setWallpaper').addEventListener('change', async e=>{ const f=e.target.files[0]; if(!f) return; const data=await fileToDataURL(f); const b=store.get('brand',{}); b.wallpaper=data; store.set('brand',b); applyBrand(); });
$('#setPrimary').addEventListener('input', e=>{ const b=store.get('brand',{}); b.primary=e.target.value; store.set('brand',b); applyBrand(); });
$('#resetBrand').addEventListener('click', ()=>{ store.set('brand',{name:'CampusHub',primary:'#ff6600'}); applyBrand(); });

// admin management
function renderAdmins(){ const list=store.get('admins',[]); const out=$('#adminList'); out.innerHTML=''; list.forEach((a,i)=>{ const li=document.createElement('li'); li.innerHTML=`<span>@${a.u}</span><button data-i="${i}" class="icon danger"><i class="fa-solid fa-user-xmark"></i></button>`; out.appendChild(li); }); $$('#adminList button').forEach(b=> b.addEventListener('click', ()=>{ const i=+b.dataset.i; const l=store.get('admins',[]); l.splice(i,1); store.set('admins',l); renderAdmins(); })); }
renderAdmins(); $('#addAdminForm').addEventListener('submit', e=>{ e.preventDefault(); const u=$('#newAdminUser').value.trim(), p=$('#newAdminPass').value; if(!u||!p) return; const list=store.get('admins',[]); if(list.find(x=>x.u===u)){ alert('exists'); return; } list.push({u,p,name:u}); store.set('admins',list); renderAdmins(); e.target.reset(); });

// dynamic content renderers
function renderNews(){ const ul=$('#newsList'); ul.innerHTML=''; store.get('news',[]).sort((a,b)=>b.at-a.at).slice(0,6).forEach(n=>{ const li=document.createElement('li'); li.innerHTML=`<span>${n.t}</span><span class="small">${timeAgo(n.at)}</span>`; ul.appendChild(li); }); }
function renderCompSummary(){ const wrap=$('#compSummary'); wrap.innerHTML=''; store.get('competitions',[]).forEach(c=>{ const el=document.createElement('span'); el.className='pill'; el.textContent=(c.open?'🟢 ':'🔒 ')+c.title; wrap.appendChild(el); }); }
function renderTrending(){ const row=$('#trendingRow'); row.innerHTML=''; const items=store.get('gallery',[]).filter(g=>g.approved).sort((a,b)=> (b.votes||0)-(a.votes||0)).slice(0,10); items.forEach(i=>{ const img=document.createElement('img'); img.className='thumb'; img.src=i.url; row.appendChild(img); }); }
renderNews(); renderCompSummary(); renderTrending();

// gallery render & interactions
function renderGallery(){ const sort=$('#gallerySort').value; let items=store.get('gallery',[]).filter(g=>g.approved); if(sort==='top') items=items.sort((a,b)=> (b.votes||0)-(a.votes||0)); if(sort==='new') items=items.sort((a,b)=> (b.at||0)-(a.at||0)); const grid=$('#galleryGrid'); grid.innerHTML=''; items.forEach(i=>{ const div=document.createElement('div'); div.className='item card'; div.innerHTML=`<img src="${i.url}" alt="upload"><div class="meta"><span class="small">@${i.by||'student'}</span><div class="actions-row"><button class="icon" data-like="${i.id}"><i class="fa-solid fa-heart"></i></button><span class="badge">${i.votes||0}</span></div></div>`; grid.appendChild(div); }); grid.querySelectorAll('[data-like]').forEach(b=> b.addEventListener('click', ()=>{ if(!currentRole){ alert('Login as student to vote'); return; } const id=b.dataset.like; const items=store.get('gallery',[]); const it=items.find(x=>x.id===id); const voted=store.get('voted',{}); if(voted[id]){ alert('You already voted this item'); return; } it.votes=(it.votes||0)+1; store.set('gallery',items); voted[id]=true; store.set('voted',voted); renderGallery(); renderTrending(); })); }
$('#gallerySort').addEventListener('change', renderGallery);
renderGallery();

// upload handling (student => approval queue)
$('#uploadInput').addEventListener('change', async e=>{ const f=e.target.files[0]; if(!f) return; const url=await fileToDataURL(f); const items=store.get('gallery',[]); items.push({id:uid(),url,by:currentUser||'guest',at:Date.now(),approved:(currentRole!=='student')}); store.set('gallery',items); alert(currentRole==='student'? 'Submitted for approval' : 'Uploaded'); renderGallery(); renderTrending(); });

// competitions management
function renderCompetitions(){ const comps=store.get('competitions',[]); const out=$('#compList'); out.innerHTML=''; comps.forEach(c=>{ const div=document.createElement('div'); div.className='card'; div.innerHTML=`<div class="card-head"><h3>${c.title}</h3><span class="badge">${c.open?'Open':'Closed'}</span></div><div class="actions-row"><button class="btn" data-view="${c.id}">View</button><button class="btn" data-toggle="${c.id}">${c.open?'Close':'Open'}</button><button class="btn danger role-owner" data-del="${c.id}">Delete</button></div>`; out.appendChild(div); }); out.querySelectorAll('[data-toggle]').forEach(b=> b.addEventListener('click', ()=>{ if(currentRole!=='admin' && currentRole!=='owner') return alert('Admins only'); const id=b.dataset.toggle; const comps=store.get('competitions',[]); const c=comps.find(x=>x.id===id); c.open=!c.open; store.set('competitions',comps); renderCompetitions(); renderCompSummary(); })); out.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', ()=>{ if(currentRole!=='owner') return alert('Owner only'); const id=b.dataset.del; store.set('competitions', store.get('competitions',[]).filter(x=>x.id!==id)); renderCompetitions(); renderCompSummary(); })); }
renderCompetitions();
$('#btnNewComp').addEventListener('click', ()=>{ if(currentRole!=='admin' && currentRole!=='owner') return alert('Admins/Owner only'); const t=prompt('Competition title'); if(!t) return; const comps=store.get('competitions',[]); comps.push({id:uid(),title:t,open:true,createdAt:Date.now()}); store.set('competitions',comps); renderCompetitions(); renderCompSummary(); });

// appeals
$('#appealForm').addEventListener('submit', e=>{ e.preventDefault(); const name=$('#appealName').value.trim(), roll=$('#appealRoll').value.trim(), text=$('#appealText').value.trim(); if(!name||!text) return; const list=store.get('appeals',[]); list.push({name,roll,text,at:Date.now()}); store.set('appeals',list); e.target.reset(); renderAppeals(); alert('Sent'); });
function renderAppeals(){ const ul=$('#appealList'); ul.innerHTML=''; store.get('appeals',[]).sort((a,b)=>b.at-a.at).forEach(a=>{ const li=document.createElement('li'); li.innerHTML=`<div><div><strong>${a.name}</strong> <span class="small">(${a.roll||'n/a'})</span></div><div class="small">${a.text}</div></div><span class="small">${timeAgo(a.at)}</span>`; ul.appendChild(li); }); }
renderAppeals();

// helpers
function fileToDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
function uid(){ return Math.random().toString(36).slice(2,9); }
function timeAgo(t){ const s=Math.max(1,Math.floor((Date.now()-t)/1000)); const m=Math.floor(s/60), h=Math.floor(m/60), d=Math.floor(h/24); if(d>0) return d+'d ago'; if(h>0) return h+'h ago'; if(m>0) return m+'m ago'; return s+'s ago'; }
console.log('%c CampusHub • Built by Astron Dice Ansh', 'background:#ff6600;color:#fff;padding:4px 8px;border-radius:6px');