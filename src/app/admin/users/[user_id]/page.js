'use client';

import logger from '@/lib/logger';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import Link from 'next/link';

export default function AdminUserDetailPage() {
  // Use NextAuth to get session info.
  const { data: session, status } = useSession();
  // Use the Router
  const router = useRouter();
  // Extract user_id from dynamic route parameters.
  const { user_id } = useParams();

  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal } = useModal();

  // Protect page: only admins allowed.
  const { isAllowed, redirect } = useAuthGuard('admin');

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form data for editing the user (excluding sensitive fields).
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: '',
    whatsapp: '',
    telegram: '',
  });

  // Fetch user details from the API.
  const fetchUser = async () => {
    try {
      logger.log('[fetchUser] Starting fetch for user details...');
      showLoader({ text: 'Fetching user details...' });
      const response = await axiosInstance.get(`/api/admin/users/${user_id}`);
      logger.log('[fetchUser] API response:', response.data);

      const fetchedUser = response.data;
      setUser(fetchedUser);

      // Prepopulate the form fields with the fetched data.
      setFormData({
        name: fetchedUser?.name || '',
        username: fetchedUser?.username || '',
        email: fetchedUser?.email || '',
        role: fetchedUser?.role || '',
        whatsapp: fetchedUser?.whatsapp || '',
        telegram: fetchedUser?.telegram || '',
      });
      logger.log('[fetchUser] User details set in state.');
    } catch (error) {
      logger.error('[fetchUser] Error fetching user:', error);
      displayMessage('Error fetching user details', 'error');
    } finally {
      hideLoader();
      logger.log('[fetchUser] Loader hidden.');
    }
  };

  // Update user via PATCH request.
  const handleUpdateUser = async () => {
    try {
      logger.log('[handleUpdateUser] Updating user with formData:', formData);
      showLoader({ text: 'Updating user details...' });
      const response = await axiosInstance.patch(
        `/api/admin/users/${user_id}`,
        formData,
      );
      logger.log('[handleUpdateUser] Update response:', response.data);

      const updatedUser = response.data;
      setUser(updatedUser);
      setIsEditing(false);
      displayMessage('User updated successfully', 'success');
    } catch (error) {
      logger.error('[handleUpdateUser] Error updating user:', error);
      displayMessage('Failed to update user', 'error');
    } finally {
      hideLoader();
      logger.log('[handleUpdateUser] Loader hidden after update attempt.');
    }
  };

  // Delete the user using our modal for confirmation.
  const handleDeleteUser = async () => {
    openModal('confirmDelete', {
      title: 'Delete User',
      description:
        'Are you sure you want to permanently delete this user? This action cannot be undone.',
      confirmButtonText: 'Delete User',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          logger.log(
            '[handleDeleteUser] Deleting user with user_id:',
            user_id,
          );
          showLoader({ text: 'Deleting user...' });
          await axiosInstance.delete(`/api/admin/users/${user_id}`);
          displayMessage('User deleted successfully', 'success');
          logger.log(
            '[handleDeleteUser] User deleted, redirecting to users list.',
          );
          router.replace('/admin/users/main');
        } catch (error) {
          logger.error('[handleDeleteUser] Error deleting user:', error);
          displayMessage('Failed to delete user', 'error');
        } finally {
          hideLoader();
          logger.log('[handleDeleteUser] Loader hidden after delete attempt.');
        }
      },
      onCancel: () => {
        logger.log('[handleDeleteUser] Deletion cancelled via modal.');
      },
    });
  };

  // Handle form input changes during editing.
  const handleChange = (e) => {
    const { name, value } = e.target;
    logger.log(`[handleChange] Field changed: ${name} = ${value}`);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch user details when component mounts or when user_id/session changes.
  useEffect(() => {
    if (user_id && status === 'authenticated' && isAllowed) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id, status, isAllowed]);

  /* ➡️ Redirect if not authorised once state is known */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect)
      router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <div className="shadow-md p-8 mt-6">
          {isEditing ? (
            // Edit Form.
            <form
              onSubmit={(e) => {
                e.preventDefault();
                logger.log(
                  '[EditForm] Form submitted. Calling handleUpdateUser...',
                );
                handleUpdateUser();
              }}
              className="space-y-6"
            >
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-lg font-medium capitalize mb-1">
                    {key}
                  </label>
                  {key === 'role' ? (
                    <select
                      name={key}
                      value={value}
                      onChange={handleChange}
                      className="w-full text-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      <option value="admin">admin</option>
                      <option value="user">user</option>
                    </select>
                  ) : (
                    <input
                      type={key === 'email' ? 'email' : 'text'}
                      name={key}
                      value={value}
                      onChange={handleChange}
                      className="w-full text-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logger.log('[EditForm] Cancel editing.');
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            // View Mode – display user details in a professional layout.
            <>
              <div className="container-style space-y-4 w-full">
                <h1 className="text-3xl font-bold mb-4 text-center mt-5 text-outline-glow-dark-1">
                  {user?.name} Details
                </h1>
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium">User ID</span>
                  <span className="font-medium">{user?.user_id}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium">Name</span>
                  <span className="font-mediumk">{user?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium">Username</span>
                  <span className="font-medium">{user?.username}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium">Email</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium">Role</span>
                  <span className="font-medium">{user?.role}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium">WhatsApp</span>
                  <span className="font-medium">{user?.whatsapp || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium">Telegram</span>
                  <span className="font-medium">{user?.telegram || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Created At</span>
                  <span className="font-medium">
                    {user?.createdAt
                      ? new Date(user?.createdAt).toLocaleString()
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-4 justify-between">
                <button
                  onClick={() => {
                    logger.log('[ViewMode] Switching to edit mode.');
                    setIsEditing(true);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                  Edit User
                </button>
                <Link href="/admin/users/main">
                  <button className="px-6 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition">
                    Back to Users
                  </button>
                </Link>
              </div>

              {/* Danger Zone Section */}
              <div className="container-style mt-10 border-t border-red-500 flex items-center justify-center flex-col w-full">
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                  Danger Zone
                </h2>
                <button
                  onClick={handleDeleteUser}
                  className="px-6 py-3 bg-red-700 text-white rounded-lg shadow hover:bg-red-800 transition"
                >
                  Delete User
                </button>
                <p className="text-red-600 mb-6 mt-6 text-xl font-bold">
                  Deleting a user is permanent and cannot be undone.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
