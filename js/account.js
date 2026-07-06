const detailsBox = document.getElementById('detailsBox');
const id = new URLSearchParams(location.search).get('id');

window.addEventListener('DOMContentLoaded', loadAccountDetails);

async function loadAccountDetails() {
  if (!id) {
    detailsBox.innerHTML = '<div class="empty">لم يتم تحديد الحساب.</div>';
    return;
  }

  const { data, error } = await db
    .from('game_accounts')
    .select('id, code, game, account_name, description, sell_price, price, status, images, created_at')
    .eq('id', id)
    .eq('status', 'available')
    .single();

  if (error || !data) {
    detailsBox.innerHTML = '<div class="empty">لم يتم العثور على الحساب أو لم يعد متاحًا.</div>';
    return;
  }

  const imageUrls = await Promise.all((data.images || []).map(getAccountImageUrl));
  const mainImg = imageUrls[0] || fallbackImage();
  const price = data.sell_price || data.price || 0;
  const lang = localStorage.getItem('dp_lang') || 'ar';

  detailsBox.innerHTML = `
    <section class="details-grid">
      <div class="gallery">
        <img id="mainImage" class="main-image" src="${mainImg}" onerror="this.onerror=null;this.src='${fallbackImage()}'" alt="${safeText(data.game)}" />
        <div class="thumbs">
          ${imageUrls.map(u => `
            <button type="button" onclick="document.getElementById('mainImage').src='${u}'">
              <img src="${u}" onerror="this.onerror=null;this.src='${fallbackImage()}'" />
            </button>
          `).join('')}
        </div>
      </div>
      <div class="details-info">
        <span class="status-badge inline">${statusText(data.status)}</span>
        <h1>${safeText(data.account_name || data.game)}</h1>
        <p class="game-name">${safeText(data.game || '')}</p>
        <div class="big-price">${money(price)}</div>
        <div class="code-box big">
          <small>${lang === 'en' ? 'Account code' : 'كود الحساب'}</small>
          <b>${safeText(data.code || '')}</b>
          <button type="button" onclick="navigator.clipboard.writeText('${safeText(data.code || '')}')">${lang === 'en' ? 'Copy' : 'نسخ'}</button>
        </div>
        <div class="description-box">
          <h3>${lang === 'en' ? 'Description' : 'الوصف'}</h3>
          <p>${safeText(data.description || (lang === 'en' ? 'No description.' : 'لا يوجد وصف.'))}</p>
        </div>
        <a class="btn primary wide" target="_blank" href="${whatsappOrderUrl(data)}">${lang === 'en' ? 'Order via WhatsApp' : 'طلب الحساب عبر واتساب'}</a>
      </div>
    </section>
  `;
}
