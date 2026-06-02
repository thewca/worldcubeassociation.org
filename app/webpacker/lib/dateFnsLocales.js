// Maps each WCA locale code to a lazy loader for the corresponding date-fns locale.
// Explicit imports are required so webpack can statically create the right chunks.
// This is because:
// 1. date-fns aliases its exports from folders to files and globbing will fail if those are changed
// 2. We use slightly different locale codes
// 3. We don't support all locales and don't want to create a chunk for each
const loaders = {
  ca: () => import('date-fns/locale/ca'),
  cs: () => import('date-fns/locale/cs'),
  da: () => import('date-fns/locale/da'),
  de: () => import('date-fns/locale/de'),
  eo: () => import('date-fns/locale/eo'),
  es: () => import('date-fns/locale/es'),
  'es-419': () => import('date-fns/locale/es'),
  'es-ES': () => import('date-fns/locale/es'),
  eu: () => import('date-fns/locale/eu'),
  fi: () => import('date-fns/locale/fi'),
  fr: () => import('date-fns/locale/fr'),
  'fr-CA': () => import('date-fns/locale/fr-CA'),
  hr: () => import('date-fns/locale/hr'),
  hu: () => import('date-fns/locale/hu'),
  id: () => import('date-fns/locale/id'),
  it: () => import('date-fns/locale/it'),
  ja: () => import('date-fns/locale/ja'),
  kk: () => import('date-fns/locale/kk'),
  ko: () => import('date-fns/locale/ko'),
  lv: () => import('date-fns/locale/lv'),
  nl: () => import('date-fns/locale/nl'),
  pl: () => import('date-fns/locale/pl'),
  pt: () => import('date-fns/locale/pt'),
  'pt-BR': () => import('date-fns/locale/pt-BR'),
  ro: () => import('date-fns/locale/ro'),
  ru: () => import('date-fns/locale/ru'),
  sk: () => import('date-fns/locale/sk'),
  sl: () => import('date-fns/locale/sl'),
  sv: () => import('date-fns/locale/sv'),
  th: () => import('date-fns/locale/th'),
  uk: () => import('date-fns/locale/uk'),
  vi: () => import('date-fns/locale/vi'),
  'zh-CN': () => import('date-fns/locale/zh-CN'),
  'zh-TW': () => import('date-fns/locale/zh-TW'),
};

export default loaders;
