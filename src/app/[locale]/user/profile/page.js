/**
 * User Profile Page Component
 * ---------------------------
 *
 * Routes & Endpoints:
 *   • GET    /api/user/profile                – fetch current user’s profile data
 *   • PATCH  /api/user/profile                – update name, email, username, contact info, and email-notification setting
 *   • PUT    /api/user/profile/password       – change password by providing oldPassword and newPassword
 *
 * Features:
 *   • Displays editable fields: name, email, username, WhatsApp, Telegram
 *   • Allows selection of preferred contact method (Email / WhatsApp / Telegram)
 *   • Opt-in checkbox for receiving important account emails
 *   • Seamless inline form state (no full-page reloads)
 *   • Toggle between “Edit Profile” and “Change Password” views
 *   • Client-side auth guard via NextAuth + custom useAuthGuard hook (only ‘user’ can access)
 *   • Loader indicators and toast messages during fetch and save operations
 *   • Redirects to a unified middle-page on success, preserving “user” role in query params
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useAppHandlers from '@/hooks/useAppHandlers';
import axiosInstance from '@/lib/core/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from '@/lib/language';
import { useT } from '@/lib/i18n/client'; // 🌍 translator

const preferredContactOptions = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' }
];

export default function UserProfile() {
  // 🗣️ Namespace translator
  const t = useT('app.user.profile.page');

  // 🔐 Session/guard
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('user');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 👤 Profile state
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

  // 🔀 Toggle
  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);

  const redirectAfterProfileSave = () => {
    router.replace(`/auth/middlePage?update=profile&success=true&role=user`);
  };
  const redirectAfterPasswordSave = () => {
    router.replace(`/auth/middlePage?passwordUpdate=profile&success=true&role=user`);
  };

  // 📦 Fetch profile
  const fetchUserProfile = async () => {
    showLoader({ text: t('fetching') });
    try {
      const { data } = await axiosInstance.get('/api/user/profile');
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
      displayMessage(error.response?.data?.error || t('error_fetching'), 'error');
    } finally {
      hideLoader();
    }
  };

  // 💾 Update profile
  const handleProfileUpdate = async (request) => {
    request.preventDefault();
    showLoader({ text: t('updating') });
    try {
      await axiosInstance.patch('/api/user/profile', { ...formData });
      displayMessage(t('update_success'), 'success');
      redirectAfterProfileSave();
    } catch (error) {
      displayMessage(error.response?.data?.error || t('error_updating'), 'error');
    } finally {
      hideLoader();
    }
  };

  // 🔑 Change password
  const handlePasswordChangeSubmit = async (request) => {
    request.preventDefault();
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      displayMessage(t('password_mismatch'), 'error');
      return;
    }
    showLoader({ text: t('password_updating') });
    try {
      await axiosInstance.put('/api/user/profile/password', {
        oldPassword: passwordFields.oldPassword,
        newPassword: passwordFields.newPassword
      });
      displayMessage(t('password_update_success'), 'success');
      setPasswordFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordChangeVisible(false);
      redirectAfterPasswordSave();
    } catch (error) {
      displayMessage(error.response?.data?.error || t('error_password_update'), 'error');
    } finally {
      hideLoader();
    }
  };

  // ✍️ handlers
  const handleFormFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };
  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordFields((previous) => ({ ...previous, [name]: value }));
  };

  useEffect(() => {
    if (status === 'authenticated' && isAllowed && session?.user?.user_id) fetchUserProfile();
  }, [status, isAllowed, session?.user?.user_id]);

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="container-style max-w-full lg:max-w-lg mx-auto min-h-[60vh] rounded-2xl shadow-lg p-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        {isPasswordChangeVisible
          ? t('change_password')
          : session?.user?.name
            ? `${session.user.name} ${t('profile')}`
            : t('user_profile')}
      </h1>

      {/* 📝 PROFILE FORM */}
      {!isPasswordChangeVisible ? (
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          {['name', 'email', 'username', 'whatsapp', 'telegram'].map((field) => (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium">
                {t(`field.${field}`)}
              </label>
              <input
                id={field}
                type={field === 'email' ? 'email' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleFormFieldChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
                autoComplete={field === 'email' ? 'email' : field === 'username' ? 'username' : ''}
              />
            </div>
          ))}

          {/* 📬 Preferred contact */}
          <div>
            <label htmlFor="preferredContactWay" className="block text-sm font-medium">
              {t('preferred_contact')}
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
                  {label}
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
              {t('send_emails')}
            </label>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-3 mt-4 w-full">
            <button
              type="button"
              onClick={() => setIsPasswordChangeVisible(true)}
              className="btn-info w-1/2"
            >
              {t('change_password')}
            </button>
            <button type="submit" className="btn-primary w-1/2">
              {t('update_profile')}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium">
              {t('old_password')}
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
              {t('new_password')}
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
              {t('confirm_password')}
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
          <div className="flex flex-col lg:flex-row items-center gap-3 mt-4 w-full">
            <button
              type="button"
              onClick={() => setIsPasswordChangeVisible(false)}
              className="btn-info w-1/2"
            >
              {t('back_to_profile')}
            </button>
            <button type="submit" className="btn-primary w-1/2">
              {t('update_password')}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center justify-center mt-5 w-full">
        <button
          type="button"
          onClick={() => router.push('/user/dashboard')}
          className="btn-secondary w-1/2"
        >
          {t('return_dashboard')}
        </button>
      </div>
    </div>
  );
}
