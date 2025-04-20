// Clerk configuration and authentication setup
const CLERK_PUBLISHABLE_KEY = 'pk_test_d29uZHJvdXMtbWl0ZS03My5jbGVyay5hY2NvdW50cy5kZXYk';

// Initialize Clerk
const clerk = window.Clerk;

// Authentication state
let isAuthenticated = false;
let currentUser = null;

// Initialize Clerk
async function initClerk() {
    try {
        await clerk.load({
            publishableKey: CLERK_PUBLISHABLE_KEY
        });

        // Check if user is signed in
        if (clerk.user) {
            isAuthenticated = true;
            currentUser = clerk.user;
            updateAuthUI();
        }
    } catch (error) {
        console.error('Error initializing Clerk:', error);
    }
}

// Update UI based on authentication state
function updateAuthUI() {
    const authElements = document.querySelectorAll('[data-auth]');
    
    authElements.forEach(element => {
        const authState = element.getAttribute('data-auth');
        if (authState === 'authenticated') {
            element.style.display = isAuthenticated ? 'block' : 'none';
        } else if (authState === 'unauthenticated') {
            element.style.display = isAuthenticated ? 'none' : 'block';
        }
    });

    // Update user info if authenticated
    if (isAuthenticated && currentUser) {
        const userInfoElements = document.querySelectorAll('[data-user-info]');
        userInfoElements.forEach(element => {
            const infoType = element.getAttribute('data-user-info');
            if (infoType === 'name') {
                element.textContent = currentUser.fullName || currentUser.firstName || 'User';
            } else if (infoType === 'email') {
                element.textContent = currentUser.primaryEmailAddress?.emailAddress || '';
            }
        });
    }
}

// Sign in handler
async function handleSignIn() {
    try {
        await clerk.openSignIn();
    } catch (error) {
        console.error('Error during sign in:', error);
    }
}

// Sign out handler
async function handleSignOut() {
    try {
        await clerk.signOut();
        isAuthenticated = false;
        currentUser = null;
        updateAuthUI();
    } catch (error) {
        console.error('Error during sign out:', error);
    }
}

// Listen for authentication state changes
clerk.addListener(({ user }) => {
    isAuthenticated = !!user;
    currentUser = user;
    updateAuthUI();
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initClerk);

// Export functions for use in other files
window.clerkAuth = {
    initClerk,
    handleSignIn,
    handleSignOut,
    isAuthenticated: () => isAuthenticated,
    getCurrentUser: () => currentUser
}; 