// js/auth-check.js - Authentication Check for Dashboard Pages
// REPLACE ENTIRE FILE WITH THIS CODE

// ✅ Check User Authentication (for dashboard.html and user-analysis.html)
function checkUserAuth() {
    // ✅ CORRECT KEYS: 'token' and 'user' (NOT 'ssnai_user')
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    
    if (!token || !user) {
        console.log('❌ No user token found - redirecting to signin');
        alert('Please sign in to access the dashboard.');
        window.location.href = 'signup.html';
        return false;
    }
    
    console.log('✅ User authenticated:', JSON.parse(user).username);
    return true;
}

// ✅ Check Admin Authentication (for admin-dashboard.html)
function checkAdminAuth() {
    // ✅ CORRECT KEYS: 'adminToken' and 'admin'
    const adminToken = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
    const admin = sessionStorage.getItem('admin') || localStorage.getItem('admin');
    
    if (!adminToken || !admin) {
        console.log('❌ No admin token found - redirecting to login');
        alert('Admin access required. Redirecting to login.');
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('✅ Admin authenticated:', JSON.parse(admin).username);
    return true;
}

// ✅ Logout function for User
function logoutUser() {
    // Clear all user auth data
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('current_analysis_id');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    console.log('✅ User logged out');
    window.location.href = 'signup.html';
}

// ✅ Logout function for Admin
function logoutAdmin() {
    // Clear all admin auth data
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    
    console.log('✅ Admin logged out');
    window.location.href = 'login.html';
}

// Make functions globally available
window.checkUserAuth = checkUserAuth;
window.checkAdminAuth = checkAdminAuth;
window.logoutUser = logoutUser;
window.logoutAdmin = logoutAdmin;

console.log('✅ Auth check functions loaded');