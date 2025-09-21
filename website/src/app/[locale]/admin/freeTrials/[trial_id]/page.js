'use client';
/**
 * ========== /app/[locale]/admin/freeTrials/[trial_id]/page.js ==========
 * 🎁 ADMIN → EDIT FREE TRIAL (Client Component)
 * ----------------------------------------------------------------------
 * • Loads one free trial by trial_id and allows editing safe fields.
 * • 🚫 Notification logic removed: activation/disable + notifications are
 *   now handled automatically by backend services.
 * • Locale-aware navigation via `useLocale()` (prefix all internal links).
 * • Translations via next-intl `useTranslations()`.
 * • ✅ Keeps your custom Tailwind classes untouched.
 * ======================================================================
 */

import Link from 'next/link';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl'; // 🌍 i18n

import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useSession } from 'next-auth/react';
import useModal from '@/hooks/useModal';
import { SafeString } from '@/lib/ui/SafeString';
import { formatErrorSuffix } from '@/lib/utils/errorMessage'; // 🧰 error helper (see snippet above)

export default function AdminEditFreeTrialPage() {
  // 🌐 translator + locale
  const t = useTranslations();
  const locale = useLocale();

  // 🔐 admin guard & session
  const { data: _session, status } = useSession(); // underscore to avoid no-unused-vars
  const { isAllowed, redirect } = useAuthGuard('admin');

  // 🧭 routing & modal
  const router = useRouter();
  const { openModal, hideModal } = useModal();

  // 🧰 UI helpers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 🗂️ state
  const [isSaving, setIsSaving] = useState(false);
  const [freeTrial, setFreeTrial] = useState(null);
  const [formData, setFormData] = useState({});

  // 🔎 read params
  const { trial_id } = useParams();

  // 🔁 fetch this trial
  const fetchFreeTrial = async () => {
    try {
      showLoader({ text: t('app.admin.freeTrials.edit.loadingTrial') });
      const response = await axiosInstance.get(`/api/admin/freeTrials/${trial_id}`);
      setFreeTrial(response.data.freeTrial);
      setFormData(response.data.freeTrial);
    } catch (e) {
      displayMessage(
        t('app.admin.freeTrials.edit.loadFailed', { error: formatErrorSuffix(e) }),
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  // ✍️ generic change handler
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  // ⏱️ Date/ISO → datetime-local
  function toDatetimeLocalString(dateInput) {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }

  // 💾 update process (🚫 no notification logic here anymore)
  const handleUpdate = async () => {
    showLoader({ text: t('app.admin.freeTrials.edit.updatingTrial') });
    setIsSaving(true);
    try {
      const { user, ...patchData } = formData;
      if (patchData.startDate) patchData.startDate = new Date(patchData.startDate).toISOString();
      if (patchData.endDate) patchData.endDate = new Date(patchData.endDate).toISOString();

      await axiosInstance.patch(`/api/admin/freeTrials/${trial_id}`, patchData);

      displayMessage(t('app.admin.freeTrials.edit.updateSuccess'), 'success');

      // 🚀 Back to list after a short pause
      setTimeout(() => {
        router.push(`/${locale}/admin/freeTrials/main`);
      }, 1200);
    } catch (e) {
      displayMessage(
        t('app.admin.freeTrials.edit.updateFailed', { error: formatErrorSuffix(e) }),
        'error'
      );
    } finally {
      hideLoader();
      setIsSaving(false);
    }
  };

  // 🗑️ delete with modal
  const handleDelete = () => {
    openModal('deleteFreeTrial', {
      title: t('app.admin.freeTrials.edit.deleteModal.title'),
      description: t('app.admin.freeTrials.edit.deleteModal.description'),
      confirmButtonText: t('app.admin.freeTrials.edit.deleteModal.confirm'),
      confirmButtonType: 'Danger',
      cancelButtonText: t('app.admin.freeTrials.edit.deleteModal.cancel'),
      onConfirm: async () => {
        try {
          showLoader({ text: t('app.admin.freeTrials.edit.deletingTrial') });
          await axiosInstance.delete(`/api/admin/freeTrials/${trial_id}`);
          displayMessage(t('app.admin.freeTrials.edit.deletedSuccess'), 'success');
          hideModal();
          router.replace(`/${locale}/admin/freeTrials/main`);
        } catch (e) {
          displayMessage(
            t('app.admin.freeTrials.edit.deleteFailed', { error: formatErrorSuffix(e) }),
            'error'
          );
        } finally {
          hideLoader();
        }
      },
      onCancel: () => {
        displayMessage(t('app.admin.freeTrials.edit.deletionCancelled'), 'info');
        hideModal();
      }
    });
  };

  // 🗓️ keep endDate = startDate + 1 day
  useEffect(() => {
    if (formData.startDate) {
      setFormData((current) => ({
        ...current,
        endDate: new Date(new Date(current.startDate).getTime() + 86400000).toISOString()
      }));
    }
  }, [formData.startDate]);

  // 🚦 initial load
  useEffect(() => {
    if (trial_id && status === 'authenticated' && isAllowed) {
      fetchFreeTrial();
    }
  }, [trial_id, status, isAllowed]); // (no need to depend on locale/t)

  // 🔒 redirect if forbidden
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🛡️ block pre-render
  if (!isAllowed || !freeTrial) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* 🏷️ title */}
        <h1 className="text-2xl font-bold mb-4">
          {t('app.admin.freeTrials.edit.title', {
            name: freeTrial.user?.name || t('app.admin.freeTrials.edit.unknownUser')
          })}
        </h1>

        {/* 👤 user info */}
        {freeTrial.user && (
          <div className="flex justify-center">
            <div className="container-style border rounded-xl shadow-md p-6 mb-6 w-1/2">
              <h2 className="text-lg font-bold mb-2">
                👤 {t('app.admin.freeTrials.edit.userInfo')}
              </h2>
              <p>
                <strong>{t('app.admin.freeTrials.edit.field.name')}:</strong>{' '}
                {freeTrial.user.name || 'N/A'}
              </p>
              <p>
                <strong>{t('app.admin.freeTrials.edit.field.email')}:</strong>{' '}
                {freeTrial.user.email || 'N/A'}
              </p>
              <p>
                <strong>{t('app.admin.freeTrials.edit.field.whatsapp')}:</strong>{' '}
                {freeTrial.user.whatsapp || 'N/A'}
              </p>
              <p>
                <strong>{t('app.admin.freeTrials.edit.field.telegram')}:</strong>{' '}
                {freeTrial.user.telegram || 'N/A'}
              </p>
              <p>
                <strong>{t('app.admin.freeTrials.edit.field.userId')}:</strong>{' '}
                {freeTrial.user.user_id}
              </p>
            </div>
          </div>
        )}

        {/* 🧱 edit form */}
        <div className="flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-2xl bg-gray-900/90 border border-gray-700 rounded-2xl shadow-md p-4 sm:p-6 md:p-8 mb-8">
            {/* 🏷️ status badge */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                {t('app.admin.freeTrials.edit.field.currentStatus')}
              </label>
              <div>
                <span
                  className={`text-white text-center px-4 py-2 rounded text-sm ${
                    formData.status === 'active'
                      ? 'bg-green-600'
                      : formData.status === 'pending'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                  }`}
                >
                  {t(`app.admin.freeTrials.status.${formData.status || 'disabled'}`)}
                </span>
              </div>
            </div>

            {/* 🧾 username */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                {t('app.admin.freeTrials.edit.field.freeTrialUsername')}
              </label>
              <input
                className="input w/full lg:max-w-md"
                name="free_trial_username"
                placeholder={t('app.admin.freeTrials.edit.placeholder.username')}
                value={formData.free_trial_username || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* 🔐 password */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                {t('app.admin.freeTrials.edit.field.freeTrialPassword')}
              </label>
              <input
                className="input w/full lg:max-w-md"
                name="free_trial_password"
                placeholder={t('app.admin.freeTrials.edit.placeholder.password')}
                value={formData.free_trial_password || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* 🌐 portal URL */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                {t('app.admin.freeTrials.edit.field.portalUrl')}
              </label>
              <input
                className="input w/full lg:max-w-md"
                name="free_trial_url"
                placeholder={t('app.admin.freeTrials.edit.placeholder.portalUrl')}
                value={formData.free_trial_url || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* 📝 other short info */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                {t('app.admin.freeTrials.edit.field.otherShortInfo')}
              </label>
              <input
                className="input w/full lg:max-w-md"
                name="free_trial_other"
                placeholder={t('app.admin.freeTrials.edit.placeholder.otherShortInfo')}
                value={formData.free_trial_other || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* 📄 additional details */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                {t('app.admin.freeTrials.edit.field.additionalDetails')}
              </label>
              <textarea
                className="input w/full lg:max-w-md"
                name="additional_info"
                placeholder={t('app.admin.freeTrials.edit.placeholder.additionalDetails')}
                value={formData.additional_info || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* 🔄 status select */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                {t('app.admin.freeTrials.edit.field.status')}
              </label>
              <select
                className="input w/full lg:max-w-md"
                name="status"
                value={formData.status || ''}
                onChange={handleInputChange}
              >
                <option value="">{t('app.admin.freeTrials.edit.selectStatus')}</option>
                <option value="active">✅ {t('app.admin.freeTrials.status.active')}</option>
                <option value="pending">🕓 {t('app.admin.freeTrials.status.pending')}</option>
                <option value="disabled">🚫 {t('app.admin.freeTrials.status.disabled')}</option>
              </select>
            </div>

            {/* 🗓️ start date */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                {t('app.admin.freeTrials.edit.field.startDate')}
              </label>
              <input
                type="datetime-local"
                className="input w/full"
                name="startDate"
                value={toDatetimeLocalString(formData.startDate)}
                onChange={handleInputChange}
              />
            </div>

            {/* ⏲️ end date (auto) */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0 text-gray-400">
                {t('app.admin.freeTrials.edit.field.endDateAuto')}
              </label>
              <input
                type="datetime-local"
                className="input w/full lg:max-w-md bg-gray-800 text-gray-400 cursor-not-allowed"
                name="endDate"
                value={
                  formData.startDate
                    ? toDatetimeLocalString(
                        new Date(new Date(formData.startDate).getTime() + 86400000)
                      )
                    : ''
                }
                disabled
                readOnly
                tabIndex={-1}
              />
            </div>

            {/* 🔘 buttons */}
            <div className="flex flex-row gap-2 mt-6 w-full justify-between">
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-1/4"
              >
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">🗑️</span>
                  <span>{SafeString(t('app.admin.freeTrials.edit.deleteTrial'))}</span>
                </span>
              </button>
              <button
                onClick={handleUpdate}
                className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-1/4 transition-all duration-200 ${
                  isSaving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                type="button"
                disabled={isSaving}
              >
                <span className="inline-flex items-center gap-2">
                  {isSaving && <span className="loader mr-2" aria-hidden="true"></span>}
                  <span>
                    {SafeString(
                      isSaving
                        ? t('app.admin.freeTrials.edit.saving')
                        : t('app.admin.freeTrials.edit.saveChanges')
                    )}
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* 🔙 back to list */}
          <div className="w-full flex justify-center">
            <Link
              href={`/${locale}/admin/freeTrials/main`}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">←</span>
                <span>{SafeString(t('app.admin.freeTrials.edit.returnToList'))}</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
