import AdminSidebar from 'backup_files/layout_backups/main/AdminSidebar';
/* import Footer from '@/components/Footer';  */ // If you want Footer always visible

export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-transparent">
      <div className="flex flex-1 w-full">
        <AdminSidebar />
        <main className="flex-1 min-h-screen lg:ml-64 flex flex-col p-2">{children}</main>
      </div>
    </div>
  );
}
