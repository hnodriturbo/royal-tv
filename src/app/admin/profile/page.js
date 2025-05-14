'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useAppHandlers from '@/hooks/useAppHandlers';
import axiosInstance from '@/lib/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

const UserProfile = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    whatsapp: 'Not Set',
    telegram: 'Not Set',
  });

  const [passwordFields, setPasswordFields] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);

  // ✅ Fetch user profile when session is available
  const fetchUserProfile = async (user_id) => {
    if (!user_id) return; // Prevent unnecessary API calls

    showLoader({ text: 'Fetching user profile...' });

    try {
      const { data } = await axiosInstance.get('/api/admin/profile', {
        /* headers: { 'User-ID': user_id }, */
      });

      setUser(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        username: data.username || '',
        whatsapp: data.whatsapp || 'Not Set',
        telegram: data.telegram || 'Not Set',
      });
    } catch (error) {
      console.error('[UserProfile] Error fetching profile:', error);
      displayMessage(
        error.response?.data?.error || 'Error fetching profile',
        'error',
      );
    } finally {
      hideLoader();
    }
  };

  // ✅ Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      showLoader({ text: 'Updating profile...' });

      await axiosInstance.patch('/api/admin/profile', {
        user_id: session?.user?.user_id,
        ...formData,
      });

      displayMessage('Profile updated successfully', 'success');
    } catch (error) {
      console.error('[UserProfile] Error updating profile:', error);
      displayMessage(
        error.response?.data?.error || 'Error updating profile',
        'error',
      );
    } finally {
      router.push('/admin/dashboard');
      hideLoader();
    }
  };

  // ✅ Handle password update
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();

    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      displayMessage('New password and confirmation do not match', 'error');
      return;
    }

    try {
      showLoader({ text: 'Updating password...' });

      await axiosInstance.put('/api/admin/profile/password', {
        user_id: session?.user?.user_id,
        ...passwordFields,
      });

      displayMessage('Password updated successfully', 'success');
      setPasswordFields({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('[UserProfile] Error updating password:', error);
      displayMessage(
        error.response?.data?.error || 'Error updating password',
        'error',
      );
    } finally {
      router.push('/admin/dashboard');
      hideLoader();
    }
  };

  // ✅ Handle form input change (e.g. name, email, username, etc.)
  const handleFormFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  // ✅ Handle password input change (old password, new password, confirmation)
  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;

    setPasswordFields((currentPasswordFields) => ({
      ...currentPasswordFields,
      [name]: value,
    }));
  };

  // Fetch the user profile with the user id from session
  useEffect(() => {
    const user_id = session?.user?.user_id;
    if (user_id && status === 'authenticated' && isAllowed) {
      fetchUserProfile(user_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, isAllowed]); // ✅ Runs only when session changes

  /* ➡️ Redirect if not authorised once state is known */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect)
      router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="container-style w-11/12 pc:w-4/12">
        <h1 className="text-2xl font-bold text-center mb-2">
          {isPasswordChangeVisible ? 'Change Password' : 'User Profile'}
        </h1>
        <div className="flex items-center justify-center">
          <hr className="border border-white w-10/12 text-center items-center justify-center m-2" />
        </div>
        {!isPasswordChangeVisible ? (
          // ✅ Profile Update Form
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {['name', 'email', 'username', 'whatsapp', 'telegram'].map(
              (field) => (
                <div key={field}>
                  <label htmlFor={field} className="block text-sm font-medium">
                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                  </label>
                  <input
                    id={field}
                    type="text"
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
                  />
                </div>
              ),
            )}

            {/* ✅ Switch to Password Change */}
            <div className="flex flex-col items-center">
              <button
                type="submit"
                className="w-72 py-2 px-4 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
              >
                Update Profile
              </button>
              <hr className="border border-white w-8/12 text-center items-center justify-center m-6" />
              <div className="flex flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setIsPasswordChangeVisible(true)}
                  className="w-50 py-2 px-4 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
                >
                  Change Password
                </button>
                <Link href="/admin/dashboard">
                  <button
                    type="button"
                    onClick={() => setIsPasswordChangeVisible(true)}
                    className="w-50 py-2 px-4 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition"
                  >
                    Go Back To Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </form>
        ) : (
          // ✅ Password Change Form
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
            {['oldPassword', 'newPassword', 'confirmPassword'].map((field) => (
              <div key={field}>
                <label htmlFor={field} className="block text-lg font-medium">
                  {field.split(/(?=[A-Z])/).join(' ')}:
                </label>
                <input
                  id={field}
                  type="password"
                  name={field}
                  value={passwordFields[field]}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
                />
              </div>
            ))}

            {/* ✅ Switch back to Profile */}
            <div className="flex flex-col items-center">
              <button
                type="submit"
                className="w-72 py-2 px-4 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
              >
                Update Password
              </button>

              <hr className="border border-white w-8/12 text-center items-center justify-center m-6" />

              <button
                type="button"
                onClick={() => setIsPasswordChangeVisible(false)}
                className="w-50 py-2 px-4 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition"
              >
                Back to Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
