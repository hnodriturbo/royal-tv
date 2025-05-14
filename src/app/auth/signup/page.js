'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';

const SignupPage = () => {
  const router = useRouter();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    whatsapp: '',
    telegram: '',
    preferredContactWay: 'email',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      displayMessage('Passwords do not match.', 'error');
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
      };

      await axiosInstance.post('/api/auth/signup', payload);

      displayMessage(
        'Account created successfully! Check your email.',
        'success',
      );
      router.push('/auth/signin?signup=true');
    } catch (error) {
      displayMessage(
        error.response?.data?.error || 'Failed to create account',
        'error',
      );
    } finally {
      hideLoader();
    }
  };

  return (
    // Center wrapper + responsive width
    <div className="w-full flex justify-center">
      <div className="container-style pc:w-2/3 mobile:w-full px-6">
        {/* Page title: left-aligned, white with thick shadow */}
        <h2 className="text-4xl mobile:text-2xl font-bold text-center text-white drop-shadow-xl mb-6">
          Create Your Account And Get Your Free Trial
        </h2>
        <div className="flex pc:flex-row mobile:flex-col items-center justify-center gap-2 w-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start gap-4 w-full"
          >
            {/* Name */}
            <div className="flex pc:flex-row mobile:flex-col items-center gap-2 w-full">
              <label className="pc:w-1/4 mobile:hidden text-white font-medium">
                Name
              </label>
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
            <div className="flex pc:flex-row mobile:flex-col items-center gap-2 w-full">
              <label className="pc:w-1/4 mobile:hidden text-white font-medium">
                Username
              </label>
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
            <div className="flex pc:flex-row mobile:flex-col items-center gap-2 w-full">
              <label className="pc:w-1/4 mobile:hidden text-white font-medium items-start">
                Email
              </label>
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
            <div className="flex pc:flex-row mobile:flex-col items-center gap-2 w-full">
              <label className="pc:w-1/4 mobile:hidden text-white font-medium">
                WhatsApp
              </label>
              <input
                name="whatsapp"
                placeholder="WhatsApp (optional)"
                value={formData.whatsapp}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
              />
            </div>

            {/* Telegram */}
            <div className="flex pc:flex-row mobile:flex-col items-center gap-2 w-full">
              <label className="pc:w-1/4 mobile:hidden text-white font-medium">
                Telegram
              </label>
              <input
                name="telegram"
                placeholder="Telegram (optional)"
                value={formData.telegram}
                onChange={handleChange}
                className="border p-2 rounded-lg text-black w-11/12"
              />
            </div>

            {/* Preferred Contact Way */}
            <div className="flex pc:flex-row mobile:flex-col items-center w-full gap-2">
              {/* Label */}
              <label className="ms-10 pc:w-1/4 mobile:w-full text-white font-medium mb-1 mobile:mb-0 text-left">
                Preferred Contact Way
              </label>

              {/* Select */}
              <div className="flex justify-center items-center w-11/12">
                <select
                  name="preferredContactWay"
                  value={formData.preferredContactWay}
                  onChange={handleChange}
                  className="border p-2 rounded-lg text-black w-full"
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="flex pc:flex-row mobile:flex-col items-center gap-2 w-full">
              <label className="pc:w-1/4 mobile:hidden text-white font-medium">
                Password
              </label>
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
            <div className="flex pc:flex-row mobile:flex-col items-center gap-2 w-full">
              <label className="pc:w-1/4 mobile:hidden text-white font-medium items-start">
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
