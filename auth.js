/**
 * auth.js - Dedicated Supabase Auth & Profile Handler
 * Handles authentication state, real-time session subscriptions,
 * registration, login, logout, and cross-page profile hydration.
 */

(function loadSupabaseScript() {
    if (!window.supabase) {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.async = true;
        script.onload = () => initSupabaseAuth();
        document.head.appendChild(script);
    } else {
        initSupabaseAuth();
    }
})();

const SUPABASE_URL = "https://czsryegesatkwdobomrc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6c3J5ZWdlc2F0a3dkb2JvbXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMTIxMTgsImV4cCI6MjEwOTc4ODExOH0.soKMmRLoNUoadMgyqqNl7vVDTNuUzbauRVqXHdtNwS8";

let supabaseClient = null;

function initSupabaseAuth() {
    try {
        if (window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            bindAuthEvents();
            setupAuthSubscription();
        }
    } catch (e) {
        console.error("Supabase init error:", e);
    }
}

/**
 * Listens for auth state changes (login, logout, token refresh, initial session)
 * across both the index dashboard and decoupled domain pages.
 */
function setupAuthSubscription() {
    if (!supabaseClient) return;

    // Initial session check
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
            hydrateProfile(session.user);
            hideAuthOverlay();
        }
    }).catch(err => {
        console.log("No existing session:", err.message);
    });

    // Real-time auth state listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            hydrateProfile(session.user);
            hideAuthOverlay();
        } else if (event === 'SIGNED_OUT') {
            resetProfileUI();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            hydrateProfile(session.user);
        }
    });
}

function hideAuthOverlay() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showAuthOverlay() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function displayStatus(msg, isError = false) {
    const authStatus = document.getElementById('authStatus');
    if (!authStatus) return;
    authStatus.innerText = msg;
    authStatus.className = `text-xs p-3 rounded-xl border font-mono block ${
        isError ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
    }`;
}

function clearStatus() {
    const authStatus = document.getElementById('authStatus');
    if (!authStatus) return;
    authStatus.innerText = '';
    authStatus.className = 'hidden';
}

/**
 * Hydrates UI elements across pages (header initials, display names, and dashboard labels).
 * Gracefully ignores elements that don't exist on the current page.
 */
async function hydrateProfile(user) {
    if (!user) return;

    try {
        let profile = null;
        if (supabaseClient) {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            if (!error && data) {
                profile = data;
            }
        }

        const name = profile?.full_name || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Student');
        const phone = profile?.mobile_number || user.user_metadata?.mobile || "Not specified";
        const grade = profile?.grade_level || user.user_metadata?.grade || "AP Physics 1";

        const nameDisp = document.getElementById('welcome-name-display');
        const userDisp = document.getElementById('user-display-name');
        const emailDisp = document.getElementById('dash-email');
        const phoneDisp = document.getElementById('dash-phone');
        const gradeDisp = document.getElementById('dash-grade');
        const initialsEl = document.getElementById('user-avatar-initials');

        if (nameDisp) nameDisp.textContent = name.split(' ')[0];
        if (userDisp) userDisp.textContent = name;
        if (emailDisp) emailDisp.textContent = user.email || '';
        if (phoneDisp) phoneDisp.textContent = phone;
        if (gradeDisp) gradeDisp.textContent = grade;

        if (initialsEl) {
            const initials = name
                .split(' ')
                .filter(n => n.length > 0)
                .map(n => n[0])
                .join('')
                .toUpperCase();
            initialsEl.textContent = initials.slice(0, 2) || 'ST';
        }
    } catch (err) {
        console.warn("Hydration notice:", err);
    }
}

function resetProfileUI() {
    const userDisp = document.getElementById('user-display-name');
    const initialsEl = document.getElementById('user-avatar-initials');
    if (userDisp) userDisp.textContent = "Guest Student";
    if (initialsEl) initialsEl.textContent = "GS";
}

function bindAuthEvents() {
    // 1. REGISTRATION FORM
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail')?.value.trim();
            const password = document.getElementById('regPassword')?.value;
            const fullName = document.getElementById('regFullName')?.value.trim();
            const mobile = document.getElementById('regMobile')?.value.trim();
            const grade = document.getElementById('regGrade')?.value;
            const btn = document.getElementById('btnRegister');

            if (!supabaseClient) {
                displayStatus("Supabase client is initializing. Please wait a moment.", true);
                return;
            }

            displayStatus("Creating account, please wait...");
            if (btn) btn.disabled = true;

            try {
                // SignUp with metadata — on_auth_user_created database trigger handles profile creation
                const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            mobile: mobile,
                            grade: grade
                        }
                    }
                });

                if (authError) {
                    displayStatus(`Registration Error: ${authError.message}`, true);
                    if (btn) btn.disabled = false;
                    return;
                }

                if (authData?.user) {
                    // Fallback profile sync in case DB triggers are not active
                    try {
                        await supabaseClient
                            .from('profiles')
                            .upsert([{
                                id: authData.user.id,
                                full_name: fullName,
                                mobile_number: mobile,
                                grade_level: grade
                            }]);
                    } catch (dbErr) {
                        console.warn("Trigger handled profile or upsert skipped:", dbErr);
                    }

                    regForm.reset();

                    if (authData.session) {
                        displayStatus("Profile created successfully! Entering portal...");
                        hydrateProfile(authData.user);
                        setTimeout(() => {
                            hideAuthOverlay();
                            clearStatus();
                        }, 700);
                    } else {
                        displayStatus("Registration successful! Check your email to confirm registration or sign in.");
                    }
                }
            } catch (err) {
                displayStatus(`Unexpected error: ${err.message}`, true);
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }

    // 2. LOGIN FORM
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim();
            const password = document.getElementById('loginPassword')?.value;
            const btn = document.getElementById('btnLogin');

            if (!supabaseClient) {
                displayStatus("Supabase client is initializing. Please wait.", true);
                return;
            }

            displayStatus("Verifying credentials...");
            if (btn) btn.disabled = true;

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    displayStatus(`Login Failed: ${error.message}`, true);
                } else if (data?.user) {
                    displayStatus("Login successful! Loading portal...");
                    await hydrateProfile(data.user);
                    setTimeout(() => {
                        hideAuthOverlay();
                        clearStatus();
                    }, 500);
                }
            } catch (err) {
                displayStatus(`System error: ${err.message}`, true);
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }
}

// Global logout hook accessible across all pages
window.handleSupabaseLogout = async function() {
    clearStatus();
    if (supabaseClient) {
        try {
            await supabaseClient.auth.signOut();
        } catch (e) {
            console.warn("Signout error:", e);
        }
    }

    // Clear typed credentials from both forms
    document.getElementById('loginForm')?.reset();
    document.getElementById('registerForm')?.reset();

    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    if (emailInput) emailInput.value = '';
    if (passInput) passInput.value = '';
    
    resetProfileUI();
    showAuthOverlay();
};
