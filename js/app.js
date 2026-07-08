let allAccounts = [];
let showFavoritesOnly = false;
let compareList = [];

const grid = document.getElementById('accountsGrid');
const countText = document.getElementById('countText');
const searchInput = document.getElementById('searchInput');
const gameFilter = document.getElementById('gameFilter');
const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');
const resetFilters = document.getElementById('resetFilters');
const favoritesFilter = document.getElementById('favoritesFilter');
const compareBar = document.getElementById('compareBar');
const compareCount = document.getElementById('compareCount');
const openCompare = document.getElementById('openCompare');
const clearCompare = document.getElementById('clearCompare');
const compareModal = document.getElementById('compareModal');
const compareContent = document.getElementById('compareContent');
const closeCompare = document.getElementById('closeCompare');

window.addEventListener('DOMContentLoaded', async () => {
  compareList = getCompareList();
  bindFilters();
  bindCompareControls();
  await loadAccounts();
});

function getFavs(){ return JSON.parse(localStorage.getItem('dp_favorites') || '[]'); }
function setFavs(list){ localStorage.setItem('dp_favorites', JSON.stringify([...new Set(list.map(String))])); }
function isFavorite(id){ return getFavs().includes(String(id)); }
function toggleFavorite(id){
  let favs = getFavs();
  const sid = String(id);
  favs = favs.includes(sid) ? favs.filter(x => x !== sid) : [...favs, sid];
  setFavs(favs);
  renderAccounts();
}

function getCompareList(){ return JSON.parse(localStorage.getItem('dp_compare') || '[]'); }
function setCompareList(list){
  compareList = [...new Set(list.map(String))].slice(0, 3);
  localStorage.setItem('dp_compare', JSON.stringify(compareList));
  updateCompareBar();
}
function isCompared(id){ return compareList.includes(String(id)); }
function toggleCompare(id){
  const sid = String(id);
  if (compareList.includes(sid)) setCompareList(compareList.filter(x => x !== sid));
  else {
    if (compareList.length >= 3) { alert('يمكن مقارنة 3 حسابات كحد أقصى'); return; }
    setCompareList([...compareList, sid]);
  }
  renderAccounts();
}

function bindFilters() {
  [searchInput, gameFilter, minPrice, maxPrice].forEach(el => el && el.addEventListener('input', renderAccounts));
  favoritesFilter && favoritesFilter.addEventListener('click', () => {
    showFavoritesOnly = !showFavoritesOnly;
    favoritesFilter.classList.toggle('active-filter', showFavoritesOnly);
    favoritesFilter.textContent = showFavoritesOnly ? '♥ عرض المفضلة' : '♡ المفضلة';
    renderAccounts();
  });
  resetFilters && resetFilters.addEventListener('click', () => {
    searchInput.value = '';
    gameFilter.value = '';
    minPrice.value = '';
    maxPrice.value = '';
    showFavoritesOnly = false;
    favoritesFilter?.classList.remove('active-filter');
    if (favoritesFilter) favoritesFilter.textContent = '♡ المفضلة';
    renderAccounts();
  });
}

function bindCompareControls(){
  updateCompareBar();
  openCompare && openCompare.addEventListener('click', showCompareModal);
  clearCompare && clearCompare.addEventListener('click', () => { setCompareList([]); renderAccounts(); });
  closeCompare && closeCompare.addEventListener('click', () => compareModal.classList.add('hidden'));
  compareModal && compareModal.addEventListener('click', e => { if(e.target === compareModal) compareModal.classList.add('hidden'); });
}

function updateCompareBar(){
  if(!compareBar) return;
  compareBar.classList.toggle('hidden', compareList.length === 0);
  if(compareCount) compareCount.textContent = `${compareList.length} حساب للمقارنة`;
}

async function loadAccounts() {
  grid.innerHTML = skeletonCards();

  const { data, error } = await db
    .from('game_accounts')
    .select('id, code, game, account_name, description, sell_price, price, status, images, video_url, featured, negotiable, created_at')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = `<div class="empty glass">حدث خطأ أثناء تحميل الحسابات: ${safeText(error.message)}</div>`;
    countText.textContent = 'تعذر التحميل';
    return;
  }

  allAccounts = data || [];
  fillGames(allAccounts);
  await renderAccounts();
}

function fillGames(accounts) {
  const games = [...new Set(accounts.map(a => a.game).filter(Boolean))].sort();
  const current = gameFilter.value;
  const lang = localStorage.getItem('dp_lang') || 'ar';
  gameFilter.innerHTML = `<option value="">${lang === 'en' ? 'All games' : 'كل الألعاب'}</option>` +
    games.map(g => `<option value="${safeText(g)}">${safeText(g)}</option>`).join('');
  gameFilter.value = current;
}

function getFilteredAccounts() {
  const q = (searchInput.value || '').trim().toLowerCase();
  const game = gameFilter.value;
  const min = Number(minPrice.value || 0);
  const max = Number(maxPrice.value || 0);
  const favs = getFavs();

  return allAccounts.filter(a => {
    const price = Number(a.sell_price || a.price || 0);
    const hay = `${a.code || ''} ${a.game || ''} ${a.account_name || ''} ${a.description || ''}`.toLowerCase();
    return (!q || hay.includes(q)) &&
      (!game || a.game === game) &&
      (!min || price >= min) &&
      (!max || price <= max) &&
      (!showFavoritesOnly || favs.includes(String(a.id)));
  });
}

async function renderAccounts() {
  const list = getFilteredAccounts();
  const lang = localStorage.getItem('dp_lang') || 'ar';
  updateCompareBar();

  countText.textContent = lang === 'en'
    ? `Showing ${list.length} accounts`
    : `عرض ${list.length} حساب`;

  if (!list.length) {
    grid.innerHTML = `<div class="empty glass">${lang === 'en' ? 'No matching accounts currently.' : 'لا توجد حسابات مطابقة حاليًا.'}</div>`;
    return;
  }

  const cards = await Promise.all(list.map(accountCard));
  grid.innerHTML = cards.join('');
}

async function accountCard(a) {
  const firstImage = Array.isArray(a.images) && a.images.length ? a.images[0] : '';
  const imageUrl = await getAccountImageUrl(firstImage);
  const price = a.sell_price || a.price || 0;
  const lang = localStorage.getItem('dp_lang') || 'ar';
  const fav = isFavorite(a.id);
  const cmp = isCompared(a.id);

  return `
    <article class="account-card glass ${a.featured ? 'featured-card' : ''}">
      <a class="card-image" href="account.html?id=${a.id}">
        <img src="${imageUrl}" alt="${safeText(a.game)}" onerror="this.onerror=null;this.src='${fallbackImage()}'" />
        <span class="status-badge">${statusText(a.status)}</span>
        ${a.featured ? `<span class="featured-chip">⭐ مميز</span>` : ``}
        ${a.video_url ? `<span class="video-chip">▶ فيديو</span>` : ``}
      </a>
      <div class="card-body">
        <div class="game-row">
          <h3>${safeText(a.account_name || a.game)}</h3>
          <span>${safeText(a.game)}</span>
        </div>
        <p class="desc">${safeText((a.description || '').slice(0, 115))}${(a.description || '').length > 115 ? '...' : ''}</p>
        <div class="price-row"><strong>${money(price)}</strong>${a.negotiable ? `<em>قابل للتفاوض</em>` : ``}</div>
        <div class="code-box">
          <small>${lang === 'en' ? 'Account code' : 'كود الحساب'}</small>
          <b>${safeText(a.code || '')}</b>
          <button type="button" onclick="navigator.clipboard.writeText('${safeText(a.code || '')}')">${lang === 'en' ? 'Copy' : 'نسخ'}</button>
        </div>
        <div class="mini-actions">
          <button type="button" class="mini-btn ${fav ? 'is-on' : ''}" onclick="toggleFavorite(${a.id})">${fav ? '♥ في المفضلة' : '♡ إضافة للمفضلة'}</button>
          <button type="button" class="mini-btn ${cmp ? 'is-on' : ''}" onclick="toggleCompare(${a.id})">${cmp ? '✓ في المقارنة' : '⇄ قارن'}</button>
        </div>
        <div class="card-actions">
          <a class="btn ghost" href="account.html?id=${a.id}">${lang === 'en' ? 'Details' : 'التفاصيل'}</a>
          <a class="btn primary" target="_blank" href="${whatsappOrderUrl(a)}">${lang === 'en' ? 'Order WhatsApp' : 'طلب عبر واتساب'}</a>
        </div>
      </div>
    </article>
  `;
}

function showCompareModal(){
  const items = compareList.map(id => allAccounts.find(a => String(a.id) === String(id))).filter(Boolean);
  if(!items.length){ alert('اختاري حسابين أو أكثر للمقارنة'); return; }
  compareContent.innerHTML = `
    <div class="compare-table-wrap">
      <table class="compare-table">
        <tr><th>البند</th>${items.map(a => `<th>${safeText(a.code || '')}</th>`).join('')}</tr>
        <tr><td>اللعبة</td>${items.map(a => `<td>${safeText(a.game || '')}</td>`).join('')}</tr>
        <tr><td>اسم الحساب</td>${items.map(a => `<td>${safeText(a.account_name || '')}</td>`).join('')}</tr>
        <tr><td>السعر</td>${items.map(a => `<td>${money(a.sell_price || a.price || 0)}${a.negotiable ? '<br><small>قابل للتفاوض</small>' : ''}</td>`).join('')}</tr>
        <tr><td>مميز</td>${items.map(a => `<td>${a.featured ? '⭐ نعم' : '—'}</td>`).join('')}</tr>
        <tr><td>فيديو</td>${items.map(a => `<td>${a.video_url ? '▶ موجود' : '—'}</td>`).join('')}</tr>
        <tr><td>الوصف</td>${items.map(a => `<td>${safeText((a.description || '').slice(0, 140))}</td>`).join('')}</tr>
        <tr><td>طلب</td>${items.map(a => `<td><a class="btn primary" target="_blank" href="${whatsappOrderUrl(a)}">واتساب</a></td>`).join('')}</tr>
      </table>
    </div>
  `;
  compareModal.classList.remove('hidden');
}

function skeletonCards() {
  return Array.from({ length: 6 }).map(() => `<div class="account-card glass skeleton"><div></div><p></p><p></p></div>`).join('');
}
