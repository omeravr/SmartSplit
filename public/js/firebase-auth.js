// Firebase Authentication configuration and functions
const auth = firebase.auth();

// Authentication state
let isAuthenticated = false;
let currentUser = null;

// Initialize Firebase Auth
async function initAuth() {
    try {
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                isAuthenticated = true;
                currentUser = user;
                updateAuthUI();
            } else {
                isAuthenticated = false;
                currentUser = null;
                updateAuthUI();
            }
        });
    } catch (error) {
        console.error('Error initializing Firebase Auth:', error);
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
                element.textContent = currentUser.displayName || currentUser.email || 'User';
            } else if (infoType === 'email') {
                element.textContent = currentUser.email || '';
            }
        });
    }
}

// Sign in with email and password
async function signIn(email, password) {
    try {
        await auth.signInWithEmailAndPassword(email, password);
        return true;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

// Sign up with email and password
async function signUp(email, password, displayName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: displayName
        });
        return true;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
        isAuthenticated = false;
        currentUser = null;
        updateAuthUI();
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

// Send password reset email
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

// Export functions for use in other files
window.firebaseAuth = {
    initAuth,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: () => isAuthenticated,
    getCurrentUser: () => currentUser
}; 