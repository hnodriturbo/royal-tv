import UserSidebar from 'backup_files/layout_backups/main/UserSidebar';

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-transparent">
      <UserSidebar />
      <main className="flex-1 min-h-screen p-2 lg:ml-64 flex flex-col items-center justify-center">
        {children}
      </main>
    </div>
  );
}
