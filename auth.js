// Initialization Configuration
// Replace placeholders with strings from: Settings -> API in your Supabase Dashboard
const SUPABASE_URL = "https://czsryegesatkwdobomrc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6c3J5ZWdlc2F0a3dkb2JvbXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMTIxMTgsImV4cCI6MjEwOTc4ODExOH0.soKMmRLoNUoadMgyqqNl7vVDTNuUzbauRVqXHdtNwS8";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginCard = document.getElementById('loginCard');
const registerCard = document.getElementById('registerCard');
const authStatus = document.getElementById('authStatus');

// Form Toggles
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginCard.classList.add('hidden');
    registerCard.classList.remove('hidden');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    registerCard.classList.add('hidden');
    loginCard.classList.remove('hidden');
});

function displayStatus(msg, isError = false) {
    authStatus.innerText = msg;
    authStatus.className = `auth-notification ${isError ? 'error-ui' : 'success-ui'}`;
    authStatus.classList.remove('hidden');
}

// 1. REGISTRATION HANDLER (Creates Auth User + Inserts into SQL Profile Table)
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const fullName = document.getElementById('regFullName').value;
    const mobile = document.getElementById('regMobile').value;
    const grade = document.getElementById('regGrade').value;

    displayStatus("Creating account, please wait...");

    // Step A: Sign up user inside Supabase Auth Engine
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (authError) {
        displayStatus(`Registration Error: ${authError.message}`, true);
        return;
    }

    if (authData.user) {
        // Step B: Map structural relational record into the profiles SQL table
        const { error: dbError } = await supabase
            .from('profiles')
            .insert([
                { 
                    id: authData.user.id, 
                    full_name: fullName, 
                    mobile_number: mobile, 
                    grade_level: grade 
                }
            ]);

        if (dbError) {
            displayStatus(`Profile Saved, but SQL record failed: ${dbError.message}`, true);
        } else {
            displayStatus("Profile created successfully! Please check your email for a validation link.");
            document.getElementById('registerForm').reset();
        }
    }
});

// 2. LOGIN HANDLER
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    displayStatus("Verifying credentials...");

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        displayStatus(`Login Failed: ${error.message}`, true);
    } else {
        displayStatus(`Welcome back! Session authorized. UID: ${data.user.id}`);
        // Optional: Redirect user to simulation sandbox dashboard space here
        // window.location.href = "/dashboard.html";
    }
});
