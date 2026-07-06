const translations = {
  ar: {
    tagline: 'حسابات ألعاب موثوقة', navAccounts: 'الحسابات', navStore: 'المتجر', navContact: 'تواصل معنا', backAccounts: 'رجوع للحسابات',
    heroPill: 'وسيط آمن بين البائع والمشتري', heroTitle: 'حسابات ألعاب موثوقة وآمنة', heroText: 'اختار الحساب المناسب، شوف الكود والسعر والوصف، واطلبه مباشرة عبر واتساب مع DevPlay Studio.',
    featurePrivacy: 'خصوصية كاملة', featureSecure: 'تسليم آمن', featureSupport: 'دعم مباشر', filtersTitle: 'تصفية الحسابات', reset: 'إعادة ضبط',
    whyTitle: 'لماذا DevPlay Studio؟', whyPrivacyTitle: 'خصوصية تامة', whyPrivacyText: 'لا نشارك بيانات البائع أو المشتري.', whyGuaranteeTitle: 'ضمان للطرفين', whyGuaranteeText: 'التحويل للبائع بعد تأكيد المشتري.', whyAccountsTitle: 'حسابات مختارة', whyAccountsText: 'نعرض فقط الحسابات المتاحة لدينا.',
    detailsTitle: 'تفاصيل الحساب', detailsText: 'البيانات المعروضة آمنة ولا تحتوي على أي معلومات حساسة.'
  },
  en: {
    tagline: 'Trusted gaming accounts', navAccounts: 'Accounts', navStore: 'Store', navContact: 'Contact', backAccounts: 'Back to accounts',
    heroPill: 'Secure broker between buyer and seller', heroTitle: 'Trusted and secure gaming accounts', heroText: 'Choose an account, check its code, price and description, then order directly via WhatsApp with DevPlay Studio.',
    featurePrivacy: 'Full privacy', featureSecure: 'Secure delivery', featureSupport: 'Direct support', filtersTitle: 'Filter accounts', reset: 'Reset',
    whyTitle: 'Why DevPlay Studio?', whyPrivacyTitle: 'Full privacy', whyPrivacyText: 'We do not share seller or buyer data.', whyGuaranteeTitle: 'Protected deal', whyGuaranteeText: 'Seller gets paid after buyer confirmation.', whyAccountsTitle: 'Selected accounts', whyAccountsText: 'We show only currently available accounts.',
    detailsTitle: 'Account details', detailsText: 'Displayed data is safe and contains no sensitive information.'
  }
};

function applyLanguage() {
  const lang = localStorage.getItem('dp_lang') || 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const map = {
      ar: { searchPlaceholder: 'بحث بالكود أو اللعبة أو الاسم', minPrice: 'أقل سعر', maxPrice: 'أعلى سعر' },
      en: { searchPlaceholder: 'Search by code, game or name', minPrice: 'Min price', maxPrice: 'Max price' }
    };
    if (map[lang][key]) el.placeholder = map[lang][key];
  });
  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = lang === 'ar' ? 'EN' : 'AR';
}

window.addEventListener('DOMContentLoaded', () => {
  applyLanguage();
  const btn = document.getElementById('langToggle');
  if (btn) btn.addEventListener('click', () => {
    const current = localStorage.getItem('dp_lang') || 'ar';
    localStorage.setItem('dp_lang', current === 'ar' ? 'en' : 'ar');
    location.reload();
  });
});
