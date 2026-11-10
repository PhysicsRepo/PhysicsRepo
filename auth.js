/**
 * supabase_auth.js - Dedicated Supabase Auth & Profile Handler
 */

// 1. Dynamic CDN Injection so HTML doesn't depend on external network at load time
(function loadSupabaseScript() {
    if (!window.supabase) {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.async = true;
        script.onload = () => {
            initSupabaseAuth();
        };
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
            checkSession();
        }
    } catch (e) {
        console.error("Supabase init error:", e);
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

async function checkSession() {
    if (!supabaseClient) return;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            hydrateProfile(session.user);
            document.getElementById('auth-overlay')?.classList.add('hidden');
        }
    } catch (e) {
        console.log("No active session:", e.message);
    }
}

async function hydrateProfile(user) {
    try {
        const { data } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        const name = (data && data.full_name) || user.user_metadata?.full_name || user.email.split('@')[0];
        const phone = (data && data.mobile_number) || user.user_metadata?.mobile || "Not specified";
        const grade = (data && data.grade_level) || user.user_metadata?.grade || "AP Physics 1";

        const nameDisp = document.getElementById('welcome-name-display');
        const userDisp = document.getElementById('user-display-name');
        const emailDisp = document.getElementById('dash-email');
        const phoneDisp = document.getElementById('dash-phone');
        const gradeDisp = document.getElementById('dash-grade');

        if (nameDisp) nameDisp.textContent = name.split(' ')[0];
        if (userDisp) userDisp.textContent = name;
        if (emailDisp) emailDisp.textContent = user.email;
        if (phoneDisp) phoneDisp.textContent = phone;
        if (gradeDisp) gradeDisp.textContent = grade;
    } catch (err) {
        console.warn("Hydrate error:", err);
    }
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
                displayStatus("Supabase client is not ready. Please refresh.", true);
                return;
            }

            displayStatus("Creating account, please wait...");
            btn.disabled = true;

            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, mobile, grade }
                }
            });

            if (authError) {
                displayStatus(`Registration Error: ${authError.message}`, true);
                btn.disabled = false;
                return;
            }

            if (authData.user) {
                const { error: dbError } = await supabaseClient
                    .from('profiles')
                    .insert([{
                        id: authData.user.id,
                        full_name: fullName,
                        mobile_number: mobile,
                        grade_level: grade
                    }]);

                if (dbError) {
                    displayStatus(`Account created, but database record failed: ${dbError.message}`, true);
                } else {
                    displayStatus("Profile created successfully! Please check your email or log in.");
                    regForm.reset();
                }

                if (authData.session) {
                    hydrateProfile(authData.user);
                    setTimeout(() => {
                        document.getElementById('auth-overlay')?.classList.add('hidden');
                    }, 1000);
                }
            }
            btn.disabled = false;
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
                displayStatus("Supabase client is not ready. Please refresh.", true);
                return;
            }

            displayStatus("Verifying credentials...");
            btn.disabled = true;

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                displayStatus(`Login Failed: ${error.message}`, true);
            } else if (data && data.user) {
                displayStatus("Login successful! Loading student portal...");
                await hydrateProfile(data.user);
                setTimeout(() => {
                    document.getElementById('auth-overlay')?.classList.add('hidden');
                }, 800);
            }
            btn.disabled = false;
        });
    }
}
