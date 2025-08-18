// pages/admin/users.js
/**
 * UsersPage with global loader & messages
 * --------------------------------------
 * • fetches users via Axios
 * • uses showLoader()/hideLoader()
 * • displays errors via displayMessage()
 * - Translated with i18n client via useT()
 */

'use client';

import logger from '@/lib/core/logger';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReusableTable from '@/components/ui/ReusableTable';
import { Link } from '@/lib/language';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useT } from '@/lib/i18n/client'; // 🌐 i18n

export default function UsersPage() {
  const t = useT(); // 🔤

  // 1️⃣ Get global handlers
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 2️⃣ Table columns definition
  const columns = [
    { key: 'name', title: t('components.sampleReusableTable.name'), dataIndex: 'name' },
    { key: 'email', title: t('components.sampleReusableTable.email'), dataIndex: 'email' }
  ];

  // 3️⃣ State for users
  const [users, setUsers] = useState([]);

  // 4️⃣ Actions renderer for each row
  const renderActions = (row) => (
    <Link href={`/admin/users/${row.id}`}>
      <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
        {t('components.sampleReusableTable.view')}
      </button>
    </Link>
  );

  // 5️⃣ Fetch users on mount
  useEffect(() => {
    async function fetchUsers() {
      // 🚨 Show global loader
      showLoader({ text: t('components.sampleReusableTable.loader_loading_users') });
      try {
        const response = await axios.get('/api/admin/users');
        setUsers(response.data);
      } catch (error) {
        logger.error(error);
        // ⚠️ Show error message globally
        displayMessage({
          type: 'error',
          text: t('components.sampleReusableTable.error_could_not_load')
        });
      } finally {
        // ✅ Hide loader
        hideLoader();
      }
    }

    fetchUsers();
  }, [showLoader, hideLoader, displayMessage]);

  return (
    <div className="p-6">
      {/* 🏷️ Page title */}
      <h1 className="text-2xl font-bold mb-4">{t('components.sampleReusableTable.user_list')}</h1>

      {/* 🗂️ ReusableTable: display users */}
      <ReusableTable
        columns={columns}
        data={users}
        actionsRenderer={renderActions}
        enableActionColumn={true}
        enablePagination={false}
      />
    </div>
  );
}
