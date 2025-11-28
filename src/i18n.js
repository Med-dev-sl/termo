const dictionaries = {
  en: {
    back: 'Back',
    vocabularyCategories: 'Vocabulary Categories',
    loadingCategories: 'Loading categories…',
    noCategories: 'No categories yet.',
    loadingTerms: 'Loading terms…',
    noTermsForCategory: 'No terms found for this category.',
    photos: 'Photos',
    videos: 'Videos',
    show: 'Show',
    hide: 'Hide',
    searchLabel: 'Search',
    clear: 'Clear',
    logout: 'Logout',
    save: 'Save',
    uploadAvatar: 'Upload avatar (URL or file)',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    language: 'Language',
    readAloud: 'Read aloud',
  },
  ru: {
    back: 'Назад',
    vocabularyCategories: 'Категории словарного запаса',
    loadingCategories: 'Загрузка категорий…',
    noCategories: 'Пока нет категорий.',
    loadingTerms: 'Загрузка терминов…',
    noTermsForCategory: 'Термины для этой категории не найдены.',
    photos: 'Фотографии',
    videos: 'Видео',
    show: 'Показать',
    hide: 'Скрыть',
    searchLabel: 'Поиск',
    clear: 'Очистить',
    logout: 'Выйти',
    save: 'Сохранить',
    uploadAvatar: 'Загрузить аватар (URL или файл)',
    email: 'Эл. почта',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    language: 'Язык',
    readAloud: 'Озвучить',
  }
};

export function getLang() {
  try {
    const v = localStorage.getItem('lang');
    return v === 'ru' ? 'ru' : 'en';
  } catch (e) {
    return 'en';
  }
}

export function t(key) {
  const lang = getLang();
  return (dictionaries[lang] && dictionaries[lang][key]) || dictionaries.en[key] || key;
}

export function setLang(lang) {
  try {
    localStorage.setItem('lang', lang === 'ru' ? 'ru' : 'en');
  } catch (e) {}
}

export function localize(obj, field) {
  try {
    const lang = getLang();
    if (!obj) return '';
    if (lang === 'ru') {
      const ruKey = `${field}_ru`;
      if (obj[ruKey]) return obj[ruKey];
    }
    return obj[field] || '';
  } catch (e) {
    return obj && obj[field] ? obj[field] : '';
  }
}

export default { t, getLang, setLang, localize };
