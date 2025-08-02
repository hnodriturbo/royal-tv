/**
 *   ========================== SignupPage.js ==========================
 * 📝
 * User Registration Page
 * - Collects user info, handles form state, and submits registration via Axios.
 * - Uses custom app handlers for showing messages and loaders.
 * - Redirects to sign-in after success.
 * =====================================================================
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance'; // ✅ Custom Axios instance
import useAppHandlers from '@/hooks/useAppHandlers'; // ✅ Custom message/loader hooks
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications'; // ✅ Custom Create Notifications hook

const SignupPage = () => {
  const { createUserRegistrationNotification } = useCreateNotifications();
  // 🧭 For navigation after signup
  const router = useRouter();

  // 🎛️ Custom global handlers for loader and messages
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 📝 Local form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    whatsapp: '',
    telegram: '',
    preferredContactWay: '',
    password: '',
    confirmPassword: '',
    sendEmails: true // <-- add this
  });

  // 🟦 Handle input changes
  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  // 🟨 Handle form submit
  const handleSubmit = async (event) => {
    event.preventDefault();

    // ⚠️ Must select preferred contact
    if (!formData.preferredContactWay) {
      displayMessage('Please select your preferred contact method.', 'info');
      return;
    }

    // ⚠️ Passwords must match
    if (formData.password !== formData.confirmPassword) {
      displayMessage('Passwords do not match.', 'info');
      return;
    }

    try {
      showLoader({ text: 'Creating your account...' });

      const payload = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        whatsapp: formData.whatsapp,
        telegram: formData.telegram,
        preferredContactWay: formData.preferredContactWay,
        password: formData.password,
        role: 'user',
        sendEmails: formData.sendEmails
      };

      // ✅ Post the request and put the answer into variable response
      const response = await axiosInstance.post('/api/auth/signup', payload);

      // ✅ GET createdUser from response
      const { user: createdUser } = response.data;

      // ✅ Trigger notification via socket (let notificationEvents.js do DB/write/etc)
      if (createdUser) {
        createUserRegistrationNotification(createdUser);
      }
      // ✅ Display the success message
      displayMessage('Account created successfully! Check your email.', 'success');

      router.push(`/auth/signin?signup=true&username=${formData.username}`);
    } catch (error) {
      // 1️⃣ Extract message and status from Axios error object
      const msg = error.response?.data?.message || 'Failed to create account';
      const status = error.response?.status;

      // 2️⃣ Decide the message type
      let messageType = 'error'; // default: real error
      if (status === 400) messageType = 'info'; // user input problem (not a bug!)
      if (status === 409) messageType = 'info'; // conflict (also user problem)
      // Add more as needed

      displayMessage(msg, messageType);
    } finally {
      hideLoader();
    }
  };

  return (
    // Center wrapper + responsive width
    <div className="w-full flex justify-center">
      <div className="container-style lg:w-2/3 w-10/12 px-6 items-center justify-center">
        {/* Page title: left-aligned, white with thick shadow */}
        <h2 className="lg:text-4xl text-2xl font-bold text-center text-white drop-shadow-xl mb-6">
          Create Your Account And Get Your Free Trial
        </h2>
        <hr className="border border-gray-400 w-8/12 my-4" />
        <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
          <form onSubmit={handleSubmit} className="flex flex-col items-start gap-4 w-full">
            {/* Name */}
            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">Name</label>
              <input
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>

            {/* Username */}
            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">Username</label>
              <input
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>

            {/* Email */}
            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium items-start">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>

            {/* WhatsApp */}
            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">WhatsApp</label>
              <input
                name="whatsapp"
                placeholder="WhatsApp (optional)"
                value={formData.whatsapp}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
              />
            </div>

            {/* Telegram */}
            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">Telegram</label>
              <input
                name="telegram"
                placeholder="Telegram (optional)"
                value={formData.telegram}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
              />
            </div>

            {/* Preferred Contact Way as dropdown with title inside */}
            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">Contact</label>
              <select
                name="preferredContactWay"
                value={formData.preferredContactWay}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              >
                <option value="" disabled>
                  Preferred Contact Way
                </option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="website">From the Website</option>
              </select>
            </div>

            {/* Password */}
            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full">
              <label className="lg:w-1/4 hidden text-white font-medium items-start">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
                required
              />
            </div>
            <div className="flex flex-col lg:flex-row items-center w-full gap-2">
              {/* Label - full width on mobile, right on desktop */}
              <div className="w-full lg:w-1/2 flex lg:justify-end justify-center pr-0 lg:pr-2">
                <label
                  htmlFor="sendEmails"
                  className="text-white font-medium whitespace-nowrap text-2xl"
                >
                  Receive e-mails ?
                </label>
              </div>
              {/* Checkbox - full width on mobile, left on desktop */}
              <div className="w-full lg:w-1/2 flex lg:justify-start justify-center pl-0 lg:pl-2">
                <input
                  type="checkbox"
                  name="sendEmails"
                  checked={formData.sendEmails}
                  onChange={(e) => setFormData({ ...formData, sendEmails: e.target.checked })}
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
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
