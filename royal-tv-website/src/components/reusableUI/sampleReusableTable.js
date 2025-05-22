// pages/admin/users.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReusableTable from '@/components/ui/ReusableTable';
import Link from 'next/link';
import useAppHandlers from '@/hooks/useAppHandlers'; // Import custom loading/message handlers

/**
 * UsersPage with global loader & messages
 * --------------------------------------
 * • fetches users via Axios
 * • uses showLoader()/hideLoader()
 * • displays errors via displayMessage()
 */
export default function UsersPage() {
  // 1️⃣ Get global handlers
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 2️⃣ Table columns definition
  const columns = [
    { key: 'name', title: 'Name', dataIndex: 'name' },
    { key: 'email', title: 'Email', dataIndex: 'email' },
  ];

  // 3️⃣ State for users
  const [users, setUsers] = useState([]);

  // 4️⃣ Actions renderer for each row
  const renderActions = (row) => (
    <Link href={`/admin/users/${row.id}`}>
      <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
        View
      </button>
    </Link>
  );

  // 5️⃣ Fetch users on mount
  useEffect(() => {
    async function fetchUsers() {
      // 🚨 Show global loader
      showLoader({ text: 'Loading users...' });
      try {
        const response = await axios.get('/api/admin/users');
        setUsers(response.data);
      } catch (err) {
        console.error(err);
        // ⚠️ Show error message globally
        displayMessage({ type: 'error', text: 'Could not load users.' });
      } finally {
        // ✅ Hide loader
        hideLoader();
      }
    }

    fetchUsers();
  }, [showLoader, hideLoader, displayMessage]);

  return (
    <div className="p-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold mb-4">User List</h1>

      {/* ReusableTable: display users */}
      <ReusableTable
        columns={columns} // headers
        data={users} // fetched data
        actionsRenderer={renderActions} // view button
        enableActionColumn={true} // show Actions
        enablePagination={false} // no pagination
      />
    </div>
  );
}
