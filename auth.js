/**
 * supabase_auth.js - Standalone Supabase Auth & Profile Sync
 */
(function loadSupabase() {
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
            attachAuthHandlers();
            checkExistingSession();
        }
    } catch (err) {
        console.error("Supabase client init failed:", err);
    }
}

function setStatusMessage(msg, isError = false) {
    const box = document.getElementById('authStatus');
    if (!box) return;
    box.innerText = msg;
    box.className = `text-xs p-3 rounded-xl border font-mono block ${
        isError ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
    }`;
}

async function loadStudentData(user) {
    if (!supabaseClient || !user) return;
    try {
        const { data } = await supabaseClient
            .from('profiles')
            .select('full_name, mobile_number, grade_level')
            .eq('id', user.id)
            .single();

        const name = (data && data.full_name) || user.user_metadata?.full_name || user.email.split('@')[0];
        const phone = (data && data.mobile_number) || user.user_metadata?.mobile || "Not specified";
        const grade = (data && data.grade_level) || user.user_metadata?.grade || "AP Physics 1";

        const welcomeEl = document.getElementById('welcome-name-display');
        const userDisplayEl = document.getElementById('user-display-name');
        const emailEl = document.getElementById('dash-email');
        const phoneEl = document.getElementById('dash-phone');
        const gradeEl = document.getElementById('dash-grade');
        const initialsEl = document.getElementById('user-avatar-initials');

        if (welcomeEl) welcomeEl.textContent = name.split(' ')[0];
        if (userDisplayEl) userDisplayEl.textContent = name;
        if (emailEl) emailEl.textContent = user.email;
        if (phoneEl) phoneEl.textContent = phone;
        if (gradeEl) gradeEl.textContent = grade;
        if (initialsEl) {
            const initials = name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').toUpperCase();
            initialsEl.textContent = initials.slice(0, 2) || 'ST';
        }
    } catch (err) {
        console.warn("Profile fetch skipped:", err.message);
    }
}

async function checkExistingSession() {
    if (!supabaseClient) return;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            await loadStudentData(session.user);
            document.getElementById('auth-overlay')?.classList.add('hidden');
        }
    } catch (e) {
        console.log("No previous session:", e.message);
    }
}

function attachAuthHandlers() {
    // 1. REGISTER
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('regFullName')?.value.trim();
            const mobile = document.getElementById('regMobile')?.value.trim();
            const grade = document.getElementById('regGrade')?.value;
            const email = document.getElementById('regEmail')?.value.trim();
            const password = document.getElementById('regPassword')?.value;
            const submitBtn = document.getElementById('btnRegister');

            if (!supabaseClient) {
                setStatusMessage("Authentication service is connecting. Please retry.", true);
                return;
            }

            setStatusMessage("Creating profile...");
            submitBtn.disabled = true;

            try {
                const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName, mobile, grade } }
                });

                if (authError) {
                    setStatusMessage(`Signup failed: ${authError.message}`, true);
                    submitBtn.disabled = false;
                    return;
                }

                if (authData.user) {
                    registerForm.reset();
                    if (authData.session) {
                        await loadStudentData(authData.user);
                        setTimeout(() => document.getElementById('auth-overlay')?.classList.add('hidden'), 800);
                    } else {
                        setStatusMessage("Registration successful! Check your email to verify your account or sign in.");
                    }
                }
            } catch (err) {
                setStatusMessage(`System error: ${err.message}`, true);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // 2. LOGIN
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim();
            const password = document.getElementById('loginPassword')?.value;
            const submitBtn = document.getElementById('btnLogin');

            if (!supabaseClient) {
                setStatusMessage("Authentication service is connecting. Please retry.", true);
                return;
            }

            setStatusMessage("Verifying credentials...");
            submitBtn.disabled = true;

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) {
                    setStatusMessage(`Login failed: ${error.message}`, true);
                } else if (data && data.user) {
                    setStatusMessage("Authorized. Entering portal...");
                    await loadStudentData(data.user);
                    setTimeout(() => document.getElementById('auth-overlay')?.classList.add('hidden'), 600);
                }
            } catch (err) {
                setStatusMessage(`System error: ${err.message}`, true);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }
}
