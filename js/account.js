const detailsBox = document.getElementById('detailsBox');
const id = new URLSearchParams(location.search).get('id');

let galleryImages = [];
let currentImageIndex = 0;
let startX = 0;
let isSwiping = false;

window.addEventListener('DOMContentLoaded', loadAccountDetails);

function setMainImage(index) {
  if (!galleryImages.length) return;

  if (index < 0) index = galleryImages.length - 1;
  if (index >= galleryImages.length) index = 0;

  currentImageIndex = index;

  const mainImage = document.getElementById('mainImage');
  const counter = document.getElementById('galleryCounter');
  const thumbs = document.querySelectorAll('.thumbs button');

  if (!mainImage) return;

  mainImage.classList.remove('image-fade');
  void mainImage.offsetWidth;
  mainImage.src = galleryImages[currentImageIndex];
  mainImage.classList.add('image-fade');

  if (counter) counter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;

  thumbs.forEach((btn, i) => {
    btn.classList.toggle('active-thumb', i === currentImageIndex);
  });
}

function nextImage() {
  setMainImage(currentImageIndex + 1);
}

function prevImage() {
  setMainImage(currentImageIndex - 1);
}

function openImageFullscreen() {
  const mainImage = document.getElementById('mainImage');
  if (!mainImage) return;

  const overlay = document.createElement('div');
  overlay.className = 'image-lightbox';
  overlay.innerHTML = `
    <button class="lightbox-close" type="button">×</button>
    <button class="lightbox-arrow lightbox-prev" type="button">‹</button>
    <img src="${mainImage.src}" alt="صورة الحساب" />
    <button class="lightbox-arrow lightbox-next" type="button">›</button>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const img = overlay.querySelector('img');

  function refreshLightbox() {
    img.src = galleryImages[currentImageIndex] || mainImage.src;
  }

  overlay.querySelector('.lightbox-close').onclick = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };

  overlay.querySelector('.lightbox-next').onclick = () => {
    nextImage();
    refreshLightbox();
  };

  overlay.querySelector('.lightbox-prev').onclick = () => {
    prevImage();
    refreshLightbox();
  };

  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  });
}

async function loadAccountDetails() {
  if (!id) {
    detailsBox.innerHTML = '<div class="empty">لم يتم تحديد الحساب.</div>';
    return;
  }

  const { data, error } = await db
    .from('game_accounts')
    .select('id, code, game, account_name, description, sell_price, price, status, images, video_url, featured, negotiable, created_at')
    .eq('id', id)
    .eq('status', 'available')
    .single();

  if (error || !data) {
    detailsBox.innerHTML = '<div class="empty">لم يتم العثور على الحساب أو لم يعد متاحًا.</div>';
    return;
  }

  const videoUrl = data.video_url ? await getAccountVideoUrl(data.video_url) : '';
  const imageUrls = await Promise.all((data.images || []).map(getAccountImageUrl));
  galleryImages = imageUrls.length ? imageUrls : [fallbackImage()];
  currentImageIndex = 0;

  const price = data.sell_price || data.price || 0;
  const lang = localStorage.getItem('dp_lang') || 'ar';

  detailsBox.innerHTML = `
    <section class="details-grid">
      <div class="gallery smooth-gallery">
        ${videoUrl ? `<div class="account-video-box"><video controls preload="metadata" src="${videoUrl}"></video></div>` : ``}
        <div class="gallery-main-box" id="gallerySwipeArea">
          <img id="mainImage" class="main-image image-fade" src="${galleryImages[0]}" onerror="this.onerror=null;this.src='${fallbackImage()}'" alt="${safeText(data.game)}" />
          <button class="gallery-arrow gallery-prev" type="button" aria-label="السابق">‹</button>
          <button class="gallery-arrow gallery-next" type="button" aria-label="التالي">›</button>
          <button class="gallery-full" type="button">⛶</button>
          <span id="galleryCounter" class="gallery-counter">1 / ${galleryImages.length}</span>
        </div>

        <div class="thumbs">
          ${galleryImages.map((u, i) => `
            <button type="button" class="${i === 0 ? 'active-thumb' : ''}" data-index="${i}">
              <img src="${u}" onerror="this.onerror=null;this.src='${fallbackImage()}'" />
            </button>
          `).join('')}
        </div>
      </div>

      <div class="details-info">
        <div class="detail-badges"><span class="status-badge inline">${statusText(data.status)}</span>${data.featured ? '<span class="featured-chip inline-chip">⭐ مميز</span>' : ''}${data.negotiable ? '<span class="nego-chip">قابل للتفاوض</span>' : ''}</div>
        <h1>${safeText(data.account_name || data.game)}</h1>
        <p class="game-name">${safeText(data.game || '')}</p>
        <div class="big-price">${money(price)}</div>${data.negotiable ? '<p class="negotiable-text">السعر قابل للتفاوض</p>' : ''}
        <div class="code-box big">
          <small>${lang === 'en' ? 'Account code' : 'كود الحساب'}</small>
          <b>${safeText(data.code || '')}</b>
          <button type="button" onclick="navigator.clipboard.writeText('${safeText(data.code || '')}')">${lang === 'en' ? 'Copy' : 'نسخ'}</button>
        </div>
        <div class="description-box">
          <h3>${lang === 'en' ? 'Description' : 'الوصف'}</h3>
          <p>${safeText(data.description || (lang === 'en' ? 'No description.' : 'لا يوجد وصف.'))}</p>
        </div>
        <div class="details-mini-actions"><button class="mini-btn" type="button" onclick="toggleDetailFavorite('${data.id}')" id="detailFavBtn">♡ إضافة للمفضلة</button><a class="mini-btn" href="index.html">⇄ المقارنة من صفحة الحسابات</a></div><a class="btn primary wide" target="_blank" href="${whatsappOrderUrl(data)}">${lang === 'en' ? 'Order via WhatsApp' : 'طلب الحساب عبر واتساب'}</a>
      </div>
    </section>
  `;

  document.querySelector('.gallery-next')?.addEventListener('click', nextImage);
  document.querySelector('.gallery-prev')?.addEventListener('click', prevImage);
  document.querySelector('.gallery-full')?.addEventListener('click', openImageFullscreen);

  document.querySelectorAll('.thumbs button').forEach(btn => {
    btn.addEventListener('click', () => setMainImage(Number(btn.dataset.index)));
  });

  const swipeArea = document.getElementById('gallerySwipeArea');
  swipeArea?.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    isSwiping = true;
  }, { passive: true });

  swipeArea?.addEventListener('touchend', e => {
    if (!isSwiping) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) prevImage();
      else nextImage();
    }
    isSwiping = false;
  }, { passive: true });
}


function detailFavs(){ return JSON.parse(localStorage.getItem('dp_favorites') || '[]'); }
function setDetailFavs(list){ localStorage.setItem('dp_favorites', JSON.stringify([...new Set(list.map(String))])); }
function toggleDetailFavorite(id){
  let favs = detailFavs();
  const sid = String(id);
  favs = favs.includes(sid) ? favs.filter(x => x !== sid) : [...favs, sid];
  setDetailFavs(favs);
  const btn = document.getElementById('detailFavBtn');
  if(btn) btn.textContent = favs.includes(sid) ? '♥ في المفضلة' : '♡ إضافة للمفضلة';
}
setTimeout(() => {
  const btn = document.getElementById('detailFavBtn');
  if(btn && id) btn.textContent = detailFavs().includes(String(id)) ? '♥ في المفضلة' : '♡ إضافة للمفضلة';
}, 800);
