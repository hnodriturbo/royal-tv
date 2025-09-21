/**
 * ============================ UserProfile.js ============================
 * 👤 User Profile Page (edit profile + change password, guarded for 'user')
 * - Uses full-path translations: t('app.user.profile.page.*')
 * - Inline loaders/toasts via useAppHandlers
 * - Client guard + redirects via useAuthGuard + useRouter
 * - 🧼 Button hygiene: navigation uses <Link>, action buttons have type="button",
 *   children wrapped in <span className="inline-flex items-center gap-2">,
 *   emoji in <span aria-hidden="true">, and String(t(...)) guards.
 * =======================================================================
 */

'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useAppHandlers from '@/hooks/useAppHandlers';
import axiosInstance from '@/lib/core/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard';

import { useTranslations, useLocale } from 'next-intl'; // 🌍 root translator (no namespace)
import { SafeString } from '@/lib/ui/SafeString';

// 📬 Preferred contact options (labels can stay brand names or be translated if you add keys)
const preferredContactOptions = [
  { value: 'email', label: 'Email' }, // ✉️
  { value: 'whatsapp', label: 'WhatsApp' }, // 💬
  { value: 'telegram', label: 'Telegram' } // 📡
];

export default function UserProfile() {
  // 🌍 Translator root — always use full paths
  const locale = useLocale();
  const t = useTranslations();

  // 🔐 Session/guard/router
  const { data: session, status } = useSession(); // 🔑
  const router = useRouter(); // 🧭
  const { isAllowed, redirect } = useAuthGuard('user'); // 🛡️
  const { displayMessage, showLoader, hideLoader } = useAppHandlers(); // 🧰

  // 👤 Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    whatsapp: '',
    telegram: '',
    preferredContactWay: 'email',
    sendEmails: true
  });

  // 🔑 Password state
  const [passwordFields, setPasswordFields] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 🔀 Toggle view
  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false); // 🔁

  // 🔁 Redirect helpers
  const redirectAfterProfileSave = () => {
    router.replace(`/auth/middlePage?update=profile&success=true&role=user`); // 🚀
  };
  const redirectAfterPasswordSave = () => {
    router.replace(`/auth/middlePage?passwordUpdate=profile&success=true&role=user`); // 🚀
  };

  // 📦 Fetch profile from API
  const fetchUserProfile = async () => {
    showLoader({ text: t('app.user.profile.page.fetching') }); // 🌀
    try {
      const { data } = await axiosInstance.get('/api/user/profile'); // 📥
      setFormData({
        name: data.name || '',
        email: data.email || '',
        username: data.username || '',
        whatsapp: data.whatsapp || '',
        telegram: data.telegram || '',
        preferredContactWay: data.preferredContactWay || 'email',
        sendEmails: typeof data.sendEmails === 'boolean' ? data.sendEmails : true
      });
    } catch (error) {
      displayMessage(
        error?.response?.data?.error || t('app.user.profile.page.error_fetching'),
        'error'
      ); // ❌
    } finally {
      hideLoader(); // 🧽
    }
  };

  // 🚀 Fetch on auth ready (moved out of render into effect)
  useEffect(() => {
    if (status === 'authenticated' && isAllowed && session?.user?.user_id) {
      fetchUserProfile();
    }
  }, [status, isAllowed, session?.user?.user_id]); // 🔁 safe deps

  // 🧭 Redirect if blocked
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]); // 🚫 do not include t

  // ✍️ Form handlers
  const handleFormFieldChange = (event) => {
    const { name, value, type, checked } = event.target; // 🧷
    setFormData((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value })); // 🧩
  };
  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target; // 🔤
    setPasswordFields((previous) => ({ ...previous, [name]: value })); // 🧩
  };

  // 💾 Submit: update profile
  const handleProfileUpdate = async (request) => {
    request.preventDefault(); // 🛑
    showLoader({ text: t('app.user.profile.page.updating') }); // 🌀
    try {
      await axiosInstance.patch('/api/user/profile', { ...formData }); // ✍️
      displayMessage(t('app.user.profile.page.update_success'), 'success'); // ✅
      redirectAfterProfileSave(); // 🔁
    } catch (error) {
      displayMessage(
        error?.response?.data?.error || t('app.user.profile.page.error_updating'),
        'error'
      ); // ❌
    } finally {
      hideLoader(); // 🧽
    }
  };

  // 🔐 Submit: change password
  const handlePasswordChangeSubmit = async (request) => {
    request.preventDefault(); // 🛑
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      displayMessage(t('app.user.profile.page.password_mismatch'), 'error'); // 🚨
      return;
    }
    showLoader({ text: t('app.user.profile.page.password_updating') }); // 🌀
    try {
      await axiosInstance.put('/api/user/profile/password', {
        oldPassword: passwordFields.oldPassword,
        newPassword: passwordFields.newPassword
      }); // 🔏
      displayMessage(t('app.user.profile.page.password_update_success'), 'success'); // ✅
      setPasswordFields({ oldPassword: '', newPassword: '', confirmPassword: '' }); // 🧹
      setIsPasswordChangeVisible(false); // ↩️
      redirectAfterPasswordSave(); // 🔁
    } catch (error) {
      displayMessage(
        error?.response?.data?.error || t('app.user.profile.page.error_password_update'),
        'error'
      ); // ❌
    } finally {
      hideLoader(); // 🧽
    }
  };

  // 🛡️ Guard rendering
  if (!isAllowed) return null;

  // 🧱 UI
  return (
    <div className="container-style max-w-full lg:max-w-lg mx-auto min-h-[60vh] rounded-2xl shadow-lg p-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        {isPasswordChangeVisible
          ? SafeString(t('app.user.profile.page.change_password'))
          : session?.user?.name
            ? `${session.user.name} ${SafeString(t('app.user.profile.page.profile'))}`
            : SafeString(t('app.user.profile.page.user_profile'))}
      </h1>

      {/* 📝 PROFILE FORM */}
      {!isPasswordChangeVisible ? (
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          {['name', 'email', 'username', 'whatsapp', 'telegram'].map((fieldKey) => (
            <div key={fieldKey}>
              <label htmlFor={fieldKey} className="block text-sm font-medium">
                {SafeString(t(`app.user.profile.page.field.${fieldKey}`))}
              </label>
              <input
                id={fieldKey}
                type={fieldKey === 'email' ? 'email' : 'text'}
                name={fieldKey}
                value={formData[fieldKey]}
                onChange={handleFormFieldChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
                autoComplete={
                  fieldKey === 'email' ? 'email' : fieldKey === 'username' ? 'username' : ''
                }
              />
            </div>
          ))}

          {/* 📬 Preferred contact */}
          <div>
            <label htmlFor="preferredContactWay" className="block text-sm font-medium">
              {SafeString(t('app.user.profile.page.preferred_contact'))}
            </label>
            <select
              id="preferredContactWay"
              name="preferredContactWay"
              value={formData.preferredContactWay}
              onChange={handleFormFieldChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
            >
              {preferredContactOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label /* 🔤 keep brands as-is; can translate if you add keys */}
                </option>
              ))}
            </select>
          </div>

          {/* 📧 Send emails */}
          <div className="flex items-center gap-2">
            <input
              id="sendEmails"
              name="sendEmails"
              type="checkbox"
              checked={formData.sendEmails}
              onChange={handleFormFieldChange}
              className="h-4 w-4"
            />

            <label htmlFor="sendEmails" className="block text-sm font-medium">
              {SafeString(t('app.user.profile.page.send_emails'))}
            </label>
          </div>

          {/* 💾 Actions */}
          <div className="flex flex-col lg:flex-row items-center gap-3 mt-4 w-full">
            {/* 🔐 Show password change */}
            <button
              type="button"
              onClick={() => setIsPasswordChangeVisible(true)}
              className="btn-info w-1/2"
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">🔐</span>
                <span>{SafeString(t('app.user.profile.page.change_password'))}</span>
              </span>
            </button>

            {/* 💾 Save profile */}
            <button type="submit" className="btn-primary w-1/2">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">💾</span>
                <span>{SafeString(t('app.user.profile.page.update_profile'))}</span>
              </span>
            </button>
          </div>
        </form>
      ) : (
        /* 🔐 CHANGE PASSWORD FORM */
        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium">
              {SafeString(t('app.user.profile.page.old_password'))}
            </label>
            <input
              id="oldPassword"
              type="password"
              name="oldPassword"
              value={passwordFields.oldPassword}
              onChange={handlePasswordFieldChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium">
              {SafeString(t('app.user.profile.page.new_password'))}
            </label>
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              value={passwordFields.newPassword}
              onChange={handlePasswordFieldChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              {SafeString(t('app.user.profile.page.confirm_password'))}
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={passwordFields.confirmPassword}
              onChange={handlePasswordFieldChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
              autoComplete="new-password"
            />
          </div>

          {/* 💾 Actions */}
          <div className="flex flex-col lg:flex-row items-center gap-3 mt-4 w-full">
            {/* ↩️ Back to profile (hide password form) */}
            <button
              type="button"
              onClick={() => setIsPasswordChangeVisible(false)}
              className="btn-info w-1/2"
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">↩️</span>
                <span>{SafeString(t('app.user.profile.page.back_to_profile'))}</span>
              </span>
            </button>

            {/* 🔐 Save password */}
            <button type="submit" className="btn-primary w-1/2">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">💾</span>
                <span>{SafeString(t('app.user.profile.page.update_password'))}</span>
              </span>
            </button>
          </div>
        </form>
      )}

      {/* ↩️ Return (navigation uses Link) */}
      <div className="flex items-center justify-center mt-5 w-full">
        <Link
          href={`/${locale}/user/dashboard`}
          className="btn-secondary w-1/2 inline-flex items-center gap-2"
        >
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true">🏠</span>
            <span>{SafeString(t('app.user.profile.page.return_dashboard'))}</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
