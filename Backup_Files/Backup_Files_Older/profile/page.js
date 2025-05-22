'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useAppHandlers from '@hooks/useAppHandlers';
import axiosInstance from '@lib/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

const UserProfile = () => {
  // ✅ Get session info
  const { data: session, status } = useSession();
  const authenticated = status === 'authenticated';

  // ✅ Router for redirection
  const router = useRouter();

  // ✅ Check authentication
  const { isAllowed, redirect } = useAuthGuard('user');

  // ✅ Get loader and message handlers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // ✅ State for profile data and password change form
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    email: '',
    username: '',
    role: '',
    whatsapp: '',
    telegram: '',
  });

  const [passwordFields, setPasswordFields] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);

  // ✅ Fetch user profile
  const fetchProfileDetails = async () => {
    if (!session?.user?.user_id) return;
    try {
      showLoader({ text: 'Loading profile...' });

      const response = await axiosInstance.get(
        `/api/dashboard/user/profile?user_id=${session.user.user_id}`,
      );

      console.log('[UserProfile] API response:', response.data);

      setFormData({
        user_id: response.data?.user_id || '',
        name: response.data?.name || '',
        email: response.data?.email || '',
        username: response.data?.username || '',
        role: response.data?.role || '',
        whatsapp: response.data?.whatsapp || 'Not Set',
        telegram: response.data?.telegram || 'Not Set',
      });
    } catch (error) {
      console.error('[UserProfile] Error fetching profile:', error);
      displayMessage(
        error.response?.data?.error || 'Failed to fetch profile',
        'error',
      );
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchProfileDetails();
    }
  }, [authenticated]);

  // ✅ Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      showLoader({ text: 'Updating profile...' });

      const response = await axiosInstance.patch(
        '/api/dashboard/user/profile',
        {
          user_id: session.user.user_id,
          ...formData,
        },
      );

      if (response.status === 200) {
        displayMessage('Profile updated successfully', 'success');
      } else {
        displayMessage(
          response.data?.error || 'Failed to update profile',
          'error',
        );
      }
    } catch (error) {
      console.error('[UserProfile] Error updating profile:', error);
      displayMessage(
        error.response?.data?.error || 'Error updating profile',
        'error',
      );
    } finally {
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

      const response = await axiosInstance.put(
        `/api/dashboard/admin/profile/password?user_id=${session.user.user_id}`,
        passwordFields,
      );

      if (response.status === 200) {
        displayMessage('Password updated successfully', 'success');
        setPasswordFields({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        displayMessage(
          response.data?.error || 'Failed to update password',
          'error',
        );
      }
    } catch (error) {
      console.error('[UserProfile] Error updating password:', error);
      displayMessage(
        error.response?.data?.error || 'Error updating password',
        'error',
      );
    } finally {
      hideLoader();
    }
  };

  // ✅ Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // ✅ Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFields((prevFields) => ({ ...prevFields, [name]: value }));
  };

  // ✅ Prevent rendering if user is NOT allowed (avoid UI flickering)
  if (!isAllowed) {
    console.log(`🔄 Redirecting to: ${redirect}`);
    if (redirect) {
      router.replace(redirect);
    }
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center mt-16">
      <div className="w-11/12 md:w-6/12 lg:w-4/12 container-style shadow-lg rounded-lg p-8 bg-white">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isPasswordChangeVisible ? 'Change Password' : 'User Profile'}
        </h1>

        {!isPasswordChangeVisible ? (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {['name', 'email', 'username', 'role', 'whatsapp', 'telegram'].map(
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none"
                  />
                </div>
              ),
            )}
            <div className="flex items-center space-x-2">
              <input
                id="passwordCheckbox"
                type="checkbox"
                checked={isPasswordChangeVisible}
                onChange={() =>
                  setIsPasswordChangeVisible(!isPasswordChangeVisible)
                }
                className="w-4 h-4"
              />
              <label
                htmlFor="passwordCheckbox"
                className="block text-sm font-medium"
              >
                Change Password
              </label>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
            >
              Update Profile
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
            {['oldPassword', 'newPassword', 'confirmPassword'].map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.split(/(?=[A-Z])/).join(' ')}:
                </label>
                <input
                  id={field}
                  type="password"
                  name={field}
                  value={passwordFields[field]}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none"
                />
              </div>
            ))}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
            >
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
