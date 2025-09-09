/**
 * ================== AdminProfilePage.js ==================
 * 👤 Admin Profile
 * - View & edit admin profile fields
 * - Change password form toggle
 * - Translations under app.admin.profile.*
 * =========================================================
 */

'use client';import Link from "next/link";import { useRouter } from "next/navigation";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import useAppHandlers from '@/hooks/useAppHandlers';
import axiosInstance from '@/lib/core/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard';

import { SafeString } from '@/lib/ui/SafeString';

const preferredContactOptions = [
{ value: 'email', label: 'Email' },
{ value: 'whatsapp', label: 'WhatsApp' },
{ value: 'telegram', label: 'Telegram' }];


export default function AdminProfilePage() {const __locale = useLocale();
  const t = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    whatsapp: '',
    telegram: '',
    preferredContactWay: 'email',
    sendEmails: true
  });

  const [passwordFields, setPasswordFields] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);

  const redirectAfterProfileSave = () => {
    router.replace(`/auth/middlePage?update=profile&success=true&role=admin`);
  };
  const redirectAfterPasswordSave = () => {
    router.replace(`/auth/middlePage?passwordUpdate=profile&success=true&role=admin`);
  };

  const fetchAdminProfile = async () => {
    showLoader({ text: t('app.admin.profile.loading') });
    try {
      const { data } = await axiosInstance.get('/api/admin/profile');
      setFormData({
        name: data.name || '',
        email: data.email || '',
        username: data.username || '',
        whatsapp: data.whatsapp || '',
        telegram: data.telegram || '',
        preferredContactWay: data.preferredContactWay || 'email',
        sendEmails: typeof data.sendEmails === 'boolean' ? data.sendEmails : true
      });
    } catch {
      displayMessage(t('app.admin.profile.fetch_error'), 'error');
    } finally {
      hideLoader();
    }
  };

  const handleProfileUpdate = async (request) => {
    request.preventDefault();
    showLoader({ text: t('app.admin.profile.updating') });
    try {
      await axiosInstance.patch('/api/admin/profile', { ...formData });
      displayMessage(t('app.admin.profile.updated'), 'success');
      redirectAfterProfileSave();
    } catch {
      displayMessage(t('app.admin.profile.update_error'), 'error');
    } finally {
      hideLoader();
    }
  };

  const handlePasswordChangeSubmit = async (request) => {
    request.preventDefault();
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      displayMessage(t('app.admin.profile.password_mismatch'), 'error');
      return;
    }
    showLoader({ text: t('app.admin.profile.updating_password') });
    try {
      await axiosInstance.put('/api/admin/profile/password', {
        oldPassword: passwordFields.oldPassword,
        newPassword: passwordFields.newPassword
      });
      displayMessage(t('app.admin.profile.password_updated'), 'success');
      setPasswordFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordChangeVisible(false);
      redirectAfterPasswordSave();
    } catch {
      displayMessage(t('app.admin.profile.password_update_error'), 'error');
    } finally {
      hideLoader();
    }
  };

  const handleFormFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordFields((previous) => ({ ...previous, [name]: value }));
  };

  useEffect(() => {
    if (status === 'authenticated' && isAllowed && session?.user?.user_id) {
      fetchAdminProfile();
    }
  }, [status, isAllowed, session?.user?.user_id]);

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="container-style max-w-full lg:max-w-lg mx-auto min-h-[60vh] rounded-2xl shadow-lg p-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        {isPasswordChangeVisible ?
        t('app.admin.profile.change_password') :
        session?.user?.name ?
        t('app.admin.profile.profile_of', { name: session.user.name }) :
        t('app.admin.profile.title')}
      </h1>

      {!isPasswordChangeVisible ?
      <form onSubmit={handleProfileUpdate} className="space-y-4">
          {['name', 'email', 'username', 'whatsapp', 'telegram'].map((field) =>
        <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium">
                {t(`app.admin.profile.field_${field}`)}:
              </label>
              <input
            id={field}
            type={field === 'email' ? 'email' : 'text'}
            name={field}
            value={formData[field]}
            onChange={handleFormFieldChange}
            className="w-full px-4 py-2 border rounded-lg text-black" />
          
            </div>
        )}

          <div>
            <label htmlFor="preferredContactWay" className="block text-sm font-medium">
              {t('app.admin.profile.preferred_contact')}
            </label>
            <select
            id="preferredContactWay"
            name="preferredContactWay"
            value={formData.preferredContactWay}
            onChange={handleFormFieldChange}
            className="w-full px-4 py-2 border rounded-lg text-black">
            
              {preferredContactOptions.map(({ value, label }) =>
            <option key={value} value={value}>
                  {label}
                </option>
            )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
            id="sendEmails"
            name="sendEmails"
            type="checkbox"
            checked={formData.sendEmails}
            onChange={handleFormFieldChange}
            className="h-4 w-4" />
          
            <label htmlFor="sendEmails" className="block text-sm font-medium">
              {t('app.admin.profile.receive_emails')}
            </label>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-3 mt-4 w-full">
            <button
            type="button"
            onClick={() => setIsPasswordChangeVisible(true)}
            className="btn-info w-1/2">
            
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">🔐</span>
                <span>{SafeString(t('app.admin.profile.change_password'))}</span>
              </span>
            </button>
            <button type="submit" className="btn-primary w-1/2">
              {t('app.admin.profile.update_profile')}
            </button>
          </div>
        </form> :

      <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
          {['oldPassword', 'newPassword', 'confirmPassword'].map((field) =>
        <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium">
                {t(`app.admin.profile.field_${field}`)}:
              </label>
              <input
            id={field}
            type="password"
            name={field}
            value={passwordFields[field]}
            onChange={handlePasswordFieldChange}
            className="w-full px-4 py-2 border rounded-lg text-black" />
          
            </div>
        )}
          <div className="flex flex-col lg:flex-row items-center gap-3 mt-4 w-full">
            <button
            type="button"
            onClick={() => setIsPasswordChangeVisible(false)}
            className="btn-info w-1/2">
            
              {t('app.admin.profile.back_to_profile')}
            </button>
            <button type="submit" className="btn-primary w-1/2">
              {t('app.admin.profile.update_password')}
            </button>
          </div>
        </form>
      }

      <div className="flex items-center justify-center mt-5 w-full">
        <Link
          href={`/${__locale}/admin/dashboard`}
          className="btn-secondary w-1/2 inline-flex items-center gap-2">
          
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true">🏠</span>
            <span>{SafeString(t('app.admin.profile.return_dashboard'))}</span>
          </span>
        </Link>
      </div>
    </div>);

}