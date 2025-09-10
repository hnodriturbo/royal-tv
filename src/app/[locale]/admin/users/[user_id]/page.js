'use client';

/**
 * ========== /app/[locale]/admin/users/[user_id]/page.js ==========
 * 🪪 ADMIN USER PROFILE (Client)
 * ---------------------------------------------------------------
 * - Loads a single user's public profile (admin-only).
 * - Lets admin edit safe fields: name, username, email, role, whatsapp, telegram.
 * - Buttons are hygienic: never render raw objects/fragments inside <button>.
 * - Uses next-intl for all UI text (all keys under app.admin.userId.*).
 * - Uses axiosInstance + app handlers for loader/toasts.
 * - Navigation relies on locale-aware <Link/> and useRouter() from @/i18n.
 * =================================================================
 */ import Link from 'next/link';

import { useEffect, useMemo, useState, useCallback } from 'react';
// 🌍 locale-aware nav
import { useTranslations, useLocale } from 'next-intl'; // 🌐 i18n
import { useParams, useRouter } from 'next/navigation'; // 🧭 read [user_id] from URL
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { SafeString } from '@/lib/ui/SafeString';

export default function AdminUserProfilePage() {
  // 🌐 translator (scoped to page namespace)
  const locale = useLocale();
  const t = useTranslations(); // 🧠 using project’s next-intl pattern

  // 🔐 admin guard
  const { isAllowed, redirect } = useAuthGuard('admin');
  const router = useRouter();

  // 🧭 params
  const { user_id } = useParams(); // { user_id: 'uuid' }

  // 🧰 app handlers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 🗂️ local form state
  const [formValues, setFormValues] = useState({
    username: '',
    name: '',
    email: '',
    role: 'user',
    whatsapp: '',
    telegram: '',
    createdAt: null
  });

  const [isLoading, setIsLoading] = useState(false);

  // 🔄 controlled change handler
  const onChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({ ...previous, [name]: value }));
  }, []);

  // 📥 fetch user profile
  const fetchUser = useCallback(async () => {
    if (!user_id) return;
    try {
      showLoader({ text: t('app.admin.userId.loading') }); // ⏳
      setIsLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${user_id}`);
      const loaded = response?.data ?? {};
      setFormValues({
        username: SafeString(loaded.username, ''),
        name: SafeString(loaded.name, ''),
        email: SafeString(loaded.email, ''),
        role: SafeString(loaded.role, 'user'),
        whatsapp: SafeString(loaded.whatsapp, ''),
        telegram: SafeString(loaded.telegram, ''),
        createdAt: loaded.createdAt ?? null
      });
      displayMessage(t('app.admin.userId.loadSuccess'), 'success'); // ✅
    } catch (error) {
      displayMessage(
        t('app.admin.userId.loadFailed', {
          error: error?.response?.data?.error ? `: ${String(error.response.data.error)}` : ''
        }),
        'error'
      ); // ❌
    } finally {
      hideLoader();
      setIsLoading(false);
    }
    // ⚠️ per project rule, do not put t in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoader, hideLoader, displayMessage]);

  // 🗑️ delete action
  const onDelete = async () => {
    const locale = useLocale();
    if (!user_id) return;
    const confirmation = window.confirm(t('app.admin.userId.confirmDelete'));
    if (!confirmation) return;

    try {
      showLoader({ text: t('app.admin.userId.deleting') }); // 🗑️
      await axiosInstance.delete(`/api/admin/users/${user_id}`);
      displayMessage(t('app.admin.userId.deleteSuccess'), 'success'); // 🎉
      router.push(`/${locale}/admin/users/main`);
    } catch (error) {
      displayMessage(
        t('app.admin.userId.deleteFailed', {
          error: error?.response?.data?.error ? `: ${String(error.response.data.error)}` : ''
        }),
        'error'
      ); // 💥
    } finally {
      hideLoader();
    }
  };

  // 💾 save action (PATCH)
  const onSave = async (event) => {
    event.preventDefault(); // 🛑 stop default submit
    if (!user_id) return;

    try {
      showLoader({ text: t('app.admin.userId.saving') }); // 💾
      const payload = {
        username: formValues.username,
        name: formValues.name,
        email: formValues.email,
        role: formValues.role,
        whatsapp: formValues.whatsapp,
        telegram: formValues.telegram
      };
      await axiosInstance.patch(`/api/admin/users/${user_id}`, payload);
      displayMessage(t('app.admin.userId.saveSuccess'), 'success'); // ✅
      fetchUser(); // 🔁 refresh fields from server
    } catch (error) {
      displayMessage(
        t('app.admin.userId.saveFailed', {
          error: error?.response?.data?.error ? `: ${String(error.response.data.error)}` : ''
        }),
        'error'
      ); // 🚨
    } finally {
      hideLoader();
    }
  };

  // 🗓️ pretty created date
  const createdDateText = useMemo(() => {
    if (!formValues.createdAt) return '';
    try {
      return new Date(formValues.createdAt).toLocaleString();
    } catch {
      return '';
    }
  }, [formValues.createdAt]);

  // 🚦 fetch when allowed
  useEffect(() => {
    if (!isAllowed && redirect) {
      router.replace(redirect); // 🔁
      return;
    }
    if (isAllowed) fetchUser();
  }, [isAllowed, redirect, router]);

  // 🛡️ block render if not allowed
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style max-w-3xl w-full">
        {/* 🏷️ title */}
        <div className="flex flex-col items-center text-center justify-center w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">
            {SafeString(t('app.admin.userId.title'))}
          </h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🔙 back */}
        <div className="mb-4">
          <Link
            href={`/${locale}/admin/users/main`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <span aria-hidden="true">↩️</span>
            <span>{SafeString(t('app.admin.userId.back'))}</span>
          </Link>
        </div>

        {/* 📝 edit form */}
        <form className="bg-gray-600 text-base-100 p-5 rounded-2xl shadow-md" onSubmit={onSave}>
          {/* 🧩 username */}
          <div className="mb-4">
            <label className="block mb-1">{SafeString(t('app.admin.userId.username'))}</label>
            <input
              name="username"
              value={formValues.username}
              onChange={onChange}
              className="input-style w-full"
              placeholder={SafeString(t('app.admin.userId.username_placeholder'))}
            />
          </div>

          {/* 🧍 name */}
          <div className="mb-4">
            <label className="block mb-1">{SafeString(t('app.admin.userId.name'))}</label>
            <input
              name="name"
              value={formValues.name}
              onChange={onChange}
              className="input-style w-full"
              placeholder={SafeString(t('app.admin.userId.name_placeholder'))}
            />
          </div>

          {/* ✉️ email */}
          <div className="mb-4">
            <label className="block mb-1">{SafeString(t('app.admin.userId.email'))}</label>
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={onChange}
              className="input-style w-full"
              placeholder={SafeString(t('app.admin.userId.email_placeholder'))}
            />
          </div>

          {/* 🏷️ role */}
          <div className="mb-4">
            <label className="block mb-1">{SafeString(t('app.admin.userId.role'))}</label>
            <select
              name="role"
              value={formValues.role}
              onChange={onChange}
              className="select-style w-full"
            >
              <option value="user">{SafeString(t('app.admin.userId.role_user'))}</option>
              <option value="admin">{SafeString(t('app.admin.userId.role_admin'))}</option>
            </select>
          </div>

          {/* 💬 contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">{SafeString(t('app.admin.userId.whatsapp'))}</label>
              <input
                name="whatsapp"
                value={formValues.whatsapp}
                onChange={onChange}
                className="input-style w-full"
                placeholder="+354 6xx xxxx"
              />
            </div>
            <div>
              <label className="block mb-1">{SafeString(t('app.admin.userId.telegram'))}</label>
              <input
                name="telegram"
                value={formValues.telegram}
                onChange={onChange}
                className="input-style w-full"
                placeholder="@username"
              />
            </div>
          </div>

          {/* 🗓️ created at */}
          <div className="mt-4 text-sm text-gray-300">
            <span className="font-bold">{SafeString(t('app.admin.userId.created'))}:</span>{' '}
            <span>{SafeString(createdDateText)}</span>
          </div>

          {/* ☑️ actions */}
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <button
              type="submit"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <span aria-hidden="true">💾</span>
              <span>
                {
                  SafeString(
                    t('app.admin.userId.save') /* label chosen from same namespace? */
                  ) /* 📝 If you prefer distinct label key, add "save": "Save" and use that instead. */
                }
              </span>
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="btn-danger inline-flex items-center justify-center gap-2"
              disabled={isLoading}
              aria-disabled={isLoading ? 'true' : 'false'}
            >
              <span aria-hidden="true">🗑️</span>
              <span>{SafeString(t('app.admin.userId.delete') /* see note above */)}</span>
            </button>

            <Link
              href={`/admin/liveChat/user/${user_id}`}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <span aria-hidden="true">💬</span>
              <span>{SafeString(t('app.admin.userId.openLiveChat'))}</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
