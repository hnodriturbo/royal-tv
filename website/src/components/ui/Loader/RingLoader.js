'use client';

import { RingLoader as Spinner } from 'react-spinners'; // 🔄 third-party spinner
import { useTranslations } from 'next-intl'; // 🌐 components.ringLoader.*
import { SafeString } from '@/lib/ui/SafeString';
/**
 * 🟢 CustomRingLoader
 * -------------------
 * • Renders a ring spinner with optional text underneath.
 * • Keeps visual behavior unchanged (no default visible text).
 * • Adds a translated tooltip/title for accessibility.
 */
const CustomRingLoader = ({ size = 'medium', color = 'blue', text = '', textClassName = '' }) => {
  const t = useTranslations(); // 🗣️ translator bound to current language

  const sizeMap = {
    small: 30,
    medium: 60,
    large: 90
  };

  return (
    <div
      className="flex flex-col items-center justify-center"
      title={t('components.ringLoader.loading_tooltip')} // 🏷️ translated hover tooltip
    >
      {/* 🎯 spinner core */}
      <Spinner size={sizeMap[size]} color={color} />

      {/* 🏷️ optional visible caption provided by parent */}
      {text && <p className={`mt-4 ${textClassName}`}>{SafeString(text, 'Loader.text')}</p>}
    </div>
  );
};

export default CustomRingLoader;
