'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { motion } from 'framer-motion';
import { Sprout, Truck, ShoppingBag, Users } from 'lucide-react';

const profileIcons = {
  farmer: Sprout,
  transporter: Truck,
  seller: ShoppingBag,
  buyer: Users,
};

const profileColors = {
  farmer:      { color: '#2D6A4F', bg: '#f0faf4' },
  transporter: { color: '#FBB03B', bg: '#fffbf0' },
  seller:      { color: '#374151', bg: '#f3f4f6' },
  buyer:       { color: '#1d4ed8', bg: '#eff6ff' },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function HomePage() {
  const t = useTranslations('common');

  const profiles = (Object.keys(profileIcons) as Array<keyof typeof profileIcons>);

  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden gradient-wamini flex flex-col items-center justify-center text-center px-6 py-24 md:py-36">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-black opacity-5 blur-3xl pointer-events-none" />

        <motion.h1
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-7xl md:text-9xl font-black logo-wamini mb-4 leading-none"
        >
          Wamini
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg md:text-2xl font-semibold text-gray-800 max-w-xl mb-10"
        >
          {t('landing.tagline')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/auth/register" className="btn-gradient text-base py-4 px-8 inline-block text-center rounded-3xl font-black text-lg shadow-md">
            {t('landing.cta_start')}
          </Link>
          <Link href="/auth/login" className="btn-outline text-base py-4 px-8 inline-block text-center rounded-3xl font-black text-lg">
            {t('login')}
          </Link>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase gradient-wamini mb-4">
            {t('landing.how_it_works')}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
            {t('landing.how_subtitle')}
          </h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">
            {t('landing.how_description')}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {profiles.map((key) => {
            const Icon = profileIcons[key];
            const { color, bg } = profileColors[key];
            return (
              <motion.div
                key={key}
                variants={itemVariants}
                className="flex flex-col items-center text-center p-6 rounded-3xl border-2 border-gray-100 hover:border-yellow-300 hover:shadow-lg transition-all duration-300"
                style={{ background: bg }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                  style={{ background: color }}
                >
                  <Icon size={32} color="#fff" strokeWidth={1.8} />
                </div>
                <h3 className="font-black text-lg text-gray-900 mb-2">
                  {t(`landing.profiles.${key}_title`)}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t(`landing.profiles.${key}_desc`)}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── TRUST BANNER ── */}
      <section className="bg-gray-950 text-white px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-4xl md:text-5xl font-black max-w-2xl mx-auto leading-tight">
            {t('landing.trust_title').split('justos').length > 1
              ? <>
                  {t('landing.trust_title').split(/(justos|fair|nzuri)/i)[0]}
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #D8FF12, #FBB03B)' }}>
                    {t('landing.trust_title').match(/(justos|fair|nzuri)/i)?.[0]}
                  </span>
                  {t('landing.trust_title').split(/(justos|fair|nzuri)/i)[2]}
                </>
              : t('landing.trust_title')
            }
          </p>
          <p className="text-gray-400 mt-4 max-w-md mx-auto text-lg">
            {t('landing.trust_subtitle')}
          </p>
          <Link
            href="/auth/register"
            className="btn-gradient mt-8 inline-block py-4 px-10 rounded-3xl text-lg font-black"
          >
            {t('landing.cta_register')}
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-400">
        <p className="font-black logo-wamini text-2xl text-gray-700 mb-1">Wamini</p>
        <p>© 2024 Wamini — Nampula, Moçambique</p>
      </footer>
    </main>
  );
}
