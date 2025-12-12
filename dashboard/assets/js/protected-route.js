/**
 * Protected route utility
 * Include this script in any page that requires authentication
 */

(async () => {
    // Wait for auth to be available
    if (typeof auth === 'undefined') {
        // Wait a bit for scripts to load
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (typeof auth === 'undefined') {
        console.error('Auth manager not found');
        window.location.href = '/dashboard/login.html';
        return;
    }

    // Check authentication
    const isAuthenticated = await auth.requireAuth();
    
    if (!isAuthenticated) {
        // Redirect handled by requireAuth
        return;
    }

    // Expose user info globally for use in page scripts
    window.currentUser = auth.getCurrentUser();
    window.isAdmin = auth.isAdmin();
})();


