useEffect(() => {
  if (status === 'unauthenticated') {
    router.push('/middlePage?notLoggedIn=true');
  }
}, [status, router]);



return status === 'authenticated' && user ? (
  // Render your protected content here.
) : null;
