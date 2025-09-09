// /src/app/not-found.js
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-3xl font-bold">404 — Page not found</h1>
      <p className="opacity-70 max-w-prose">The page you’re looking for doesn’t exist or moved.</p>
      <a href="/" className="mt-2 inline-block rounded-xl px-4 py-2 border transition">
        Go to homepage
      </a>
    </div>
  );
}
