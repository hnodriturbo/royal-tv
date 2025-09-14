// src/app/[locale]/auth/signup/SignupClient.js
'use client';

/**
 * SignupClient.js — client component extracted from page.js
 * Handles the interactive signup form, i18n, socket notify and redirects.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafeString } from '@/lib/ui/SafeString';

import { useState } from 'react';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications';
import { useTranslations, useLocale } from 'next-intl';

export default function SignupClient() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { createUserRegistrationNotification } = useCreateNotifications();

  const [formState, setFormState] = useState({
    name: '',
    username: '',
    email: '',
    whatsapp: '',
    telegram: '',
    preferredContactWay: '',
    password: '',
    confirmPassword: '',
    sendEmails: true
  });

  const handleChange = (event) => {
    setFormState({ ...formState, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formState.preferredContactWay) {
      displayMessage(
        t('app.signup.selectPreferred', {}, 'Please select your preferred contact method.'),
        'info'
      );
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      displayMessage(t('app.signup.passwordsDontMatch', {}, 'Passwords do not match.'), 'info');
      return;
    }

    try {
      showLoader({ text: t('app.signup.creatingAccount', {}, 'Creating your account...') });

      const payload = {
        name: formState.name,
        username: formState.username,
        email: formState.email,
        whatsapp: formState.whatsapp,
        telegram: formState.telegram,
        preferredContactWay: formState.preferredContactWay,
        password: formState.password,
        role: 'user',
        sendEmails: formState.sendEmails
      };

      const response = await axiosInstance.post('/api/auth/signup', payload);
      const { user: createdUser } = response.data;

      if (createdUser) {
        createUserRegistrationNotification(createdUser);
      }

      displayMessage(
        t('app.signup.accountCreated', {}, 'Account created successfully! Check your email.'),
        'success'
      );

      router.push(
        `/${locale}/auth/signin?signup=true&username=${encodeURIComponent(formState.username)}`
      );
    } catch (error) {
      const messageFromServer = error?.response?.data?.message;
      const statusCode = error?.response?.status;

      let messageType = 'error';
      if (statusCode === 400 || statusCode === 409) messageType = 'info';

      displayMessage(
        messageFromServer || t('app.signup.failedCreate', {}, 'Failed to create account'),
        messageType
      );
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="container-style lg:w-2/3 w-10/12 px-6 items-center justify-center">
        <h2 className="lg:text-4xl text-2xl font-bold text-center text-white drop-shadow-xl mb-6">
          {t('app.signup.title', {}, 'Create Your Account And Get Your Free Trial')}
        </h2>

        <hr className="border border-gray-400 w-8/12 my-4" />

        <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
          <form onSubmit={handleSubmit} className="flex flex-col items-start gap-4 w-full">
            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">
                {t('app.signup.labels.name', {}, 'Name')}
              </label>
              <input
                name="name"
                placeholder={t('app.signup.placeholders.fullName', {}, 'Full Name')}
                value={formState.name}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>

            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">
                {t('app.signup.labels.username', {}, 'Username')}
              </label>
              <input
                name="username"
                placeholder={t('app.signup.placeholders.username', {}, 'Username')}
                value={formState.username}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>

            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium items-start">
                {t('app.signup.labels.email', {}, 'Email')}
              </label>
              <input
                type="email"
                name="email"
                placeholder={t('app.signup.placeholders.email', {}, 'Email Address')}
                value={formState.email}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>

            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">
                {t('app.signup.labels.whatsapp', {}, 'WhatsApp')}
              </label>
              <input
                name="whatsapp"
                placeholder={t('app.signup.placeholders.whatsapp', {}, 'WhatsApp (optional)')}
                value={formState.whatsapp}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
              />
            </div>

            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">
                {t('app.signup.labels.telegram', {}, 'Telegram')}
              </label>
              <input
                name="telegram"
                placeholder={t('app.signup.placeholders.telegram', {}, 'Telegram (optional)')}
                value={formState.telegram}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
              />
            </div>

            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">
                {t('app.signup.labels.preferredContact', {}, 'Contact')}
              </label>
              <select
                name="preferredContactWay"
                value={formState.preferredContactWay}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              >
                <option value="" disabled>
                  {t('app.signup.placeholders.preferredContact', {}, 'Preferred Contact Way')}
                </option>
                <option value="email">{t('app.signup.contact.email', {}, 'Email')}</option>
                <option value="whatsapp">{t('app.signup.contact.whatsapp', {}, 'WhatsApp')}</option>
                <option value="telegram">{t('app.signup.contact.telegram', {}, 'Telegram')}</option>
                <option value="website">
                  {t('app.signup.contact.website', {}, 'From the Website')}
                </option>
              </select>
            </div>

            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">
                {t('app.signup.labels.password', {}, 'Password')}
              </label>
              <input
                type="password"
                name="password"
                placeholder={t('app.signup.placeholders.password', {}, 'Password')}
                value={formState.password}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>

            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium items-start">
                {t('app.signup.labels.confirmPassword', {}, 'Confirm Password')}
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder={t('app.signup.placeholders.confirmPassword', {}, 'Confirm Password')}
                value={formState.confirmPassword}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>

            <div className="flex flex-col lg:flex-row items-center w-full gap-2">
              <div className="w-full lg:w-1/2 flex lg:justify-end justify-center pr-0 lg:pr-2">
                <label
                  htmlFor="sendEmails"
                  className="text-white font-medium whitespace-nowrap text-2xl"
                >
                  {t('app.signup.labels.receiveEmails', {}, 'Receive e-mails ?')}
                </label>
              </div>
              <div className="w-full lg:w-1/2 flex lg:justify-start justify-center pl-0 lg:pl-2">
                <input
                  type="checkbox"
                  name="sendEmails"
                  checked={formState.sendEmails}
                  onChange={(event) =>
                    setFormState({ ...formState, sendEmails: event.target.checked })
                  }
                  className="accent-blue-500 h-5 w-5"
                  id="sendEmails"
                />
              </div>
            </div>

            <div className="flex w-full items-center justify-center">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-800 transition text-white font-bold p-2 rounded-lg w-6/12"
              >
                {SafeString(t('app.signup.submitButton', {}, 'Sign Up'), '')}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-4">
          {t('app.signup.haveAccountPrompt', {}, 'Already have an account?')}{' '}
          <Link href={`/${locale}/auth/signin`} className="underline">
            {t('app.signup.signInLink', {}, 'Sign in')}
          </Link>
        </p>
      </div>
    </div>
  );
}
