let allAccounts = [];

const grid = document.getElementById('accountsGrid');
const countText = document.getElementById('countText');
const searchInput = document.getElementById('searchInput');
const gameFilter = document.getElementById('gameFilter');
const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');
const resetFilters = document.getElementById('resetFilters');

window.addEventListener('DOMContentLoaded', async () => {
  bindFilters();
  await loadAccounts();
});

function bindFilters() {
  [searchInput, gameFilter, minPrice, maxPrice].forEach(el => el && el.addEventListener('input', renderAccounts));
  resetFilters && resetFilters.addEventListener('click', () => {
    searchInput.value = '';
    gameFilter.value = '';
    minPrice.value = '';
    maxPrice.value = '';
    renderAccounts();
  });
}

async function loadAccounts() {
  grid.innerHTML = skeletonCards();

  const { data, error } = await db
    .from('game_accounts')
    .select('id, code, game, account_name, description, sell_price, price, status, images, created_at')
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

  return allAccounts.filter(a => {
    const price = Number(a.sell_price || a.price || 0);
    const hay = `${a.code || ''} ${a.game || ''} ${a.account_name || ''} ${a.description || ''}`.toLowerCase();
    return (!q || hay.includes(q)) &&
      (!game || a.game === game) &&
      (!min || price >= min) &&
      (!max || price <= max);
  });
}

async function renderAccounts() {
  const list = getFilteredAccounts();
  const lang = localStorage.getItem('dp_lang') || 'ar';

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

  return `
    <article class="account-card glass">
      <a class="card-image" href="account.html?id=${a.id}">
        <img src="${imageUrl}" alt="${safeText(a.game)}" onerror="this.onerror=null;this.src='${fallbackImage()}'" />
        <span class="status-badge">${statusText(a.status)}</span>
      </a>
      <div class="card-body">
        <div class="game-row">
          <h3>${safeText(a.account_name || a.game)}</h3>
          <span>${safeText(a.game)}</span>
        </div>
        <p class="desc">${safeText((a.description || '').slice(0, 115))}${(a.description || '').length > 115 ? '...' : ''}</p>
        <div class="price-row"><strong>${money(price)}</strong></div>
        <div class="code-box">
          <small>${lang === 'en' ? 'Account code' : 'كود الحساب'}</small>
          <b>${safeText(a.code || '')}</b>
          <button type="button" onclick="navigator.clipboard.writeText('${safeText(a.code || '')}')">${lang === 'en' ? 'Copy' : 'نسخ'}</button>
        </div>
        <div class="card-actions">
          <a class="btn ghost" href="account.html?id=${a.id}">${lang === 'en' ? 'Details' : 'التفاصيل'}</a>
          <a class="btn primary" target="_blank" href="${whatsappOrderUrl(a)}">${lang === 'en' ? 'Order WhatsApp' : 'طلب عبر واتساب'}</a>
        </div>
      </div>
    </article>
  `;
}

function skeletonCards() {
  return Array.from({ length: 6 }).map(() => `<div class="account-card glass skeleton"><div></div><p></p><p></p></div>`).join('');
}
