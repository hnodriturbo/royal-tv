/**
 * src/lib/utils/sidebarLinks.js
 * --------------------------------
 * 🔗 Role-based sidebar links that map 1:1 to i18n keys under app.navigation.*
 * 🧭 Emojis are visual only; text always comes from translations.
 */
const LOCALES = ['en', 'is']; // keep in sync with your app
const localeRe = new RegExp(`^/(?:${LOCALES.join('|')})(?:/|$)`);

const sidebarLinks = {
  // 🧑‍🤝‍🧑 Guests
  guest: [
    { href: '/', key: 'home', emoji: '🏠' }, // 🌍 app.navigation.home
    { href: '/more-info', key: 'more_info', emoji: 'ℹ️' },
    { href: '/faq', key: 'faq', emoji: '❓' },
    { href: '/auth/signup', key: 'register', emoji: '📝' },
    { href: '/auth/signin', key: 'login', emoji: '🔑' }
  ],

  // 👤 Users
  user: [
    { href: '/', key: 'home', emoji: '🏠' },
    { href: '/user/dashboard', key: 'dashboard', emoji: '📺' },
    { href: '/packages', key: 'buy_package', emoji: '✨' },
    { href: '/user/subscriptions', key: 'subscriptions', emoji: '💳' },
    { href: '/user/notifications', key: 'notifications', emoji: '🔔' },
    { href: '/user/liveChat/main', key: 'live_chats', emoji: '💬' },
    { href: '/user/freeTrials', key: 'free_trial', emoji: '🎁' },
    { href: '/user/profile', key: 'profile', emoji: '⚙️' },
    { href: '/more-info', key: 'more_info', emoji: 'ℹ️' },
    { href: '/faq', key: 'faq', emoji: '❓' },
    { href: '/logout', key: 'logout', emoji: '❌' }
  ],

  // 👑 Admins
  admin: [
    { href: '/', key: 'home', emoji: '🏠' },
    { href: '/admin/dashboard', key: 'dashboard', emoji: '📊' },
    { href: '/admin/notifications', key: 'notifications', emoji: '🔔' },
    { href: '/admin/logs/main', key: 'logs', emoji: '📚' },
    { href: '/admin/users/main', key: 'users', emoji: '👥' },
    { href: '/admin/liveChat/main', key: 'live_chats', emoji: '💬' },
    { href: '/admin/subscriptions/main', key: 'subscriptions', emoji: '💳' },
    { href: '/admin/freeTrials/main', key: 'free_trials', emoji: '🎁' },
    { href: '/admin/profile', key: 'profile', emoji: '⚙️' },
    { href: '/more-info', key: 'more_info', emoji: 'ℹ️' },
    { href: '/faq', key: 'faq', emoji: '❓' },
    { href: '/logout', key: 'logout', emoji: '❌' }
  ]
};

/** Optional helper: returns links with locale-prefixed hrefs (except '/logout'). */
export function getSidebarLinks(locale, role = 'guest') {
  const list = sidebarLinks[role] ?? sidebarLinks.guest;
  const safeLocale = typeof locale === 'string' && locale ? locale : 'en';

  return list.map((item) => {
    // leave "/logout" as-is so you can render a <button> for it
    if (item.href === '/logout') return item;

    // leave external or already-locale-prefixed hrefs alone
    if (!item.href?.startsWith('/') || localeRe.test(item.href)) return item;

    // prefix locale; ensure "/" becomes "/{locale}/"
    const path = item.href === '/' ? '' : item.href;
    return { ...item, href: `/${safeLocale}${path}` };
  });
}

export default sidebarLinks;
