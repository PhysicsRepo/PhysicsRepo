/**
 * js/header.js
 * Shared Navigation Header across all PhysicsRepo pages.
 * Update this single file to change the logo, navigation, or header across every page.
 */

(function renderSharedHeader() {
    const placeholder = document.getElementById('shared-header');
    if (!placeholder) return;

    // Detect current filename to highlight the active navigation link
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    const navItems = [
        { href: 'index.html', label: 'Dashboard', icon: 'fa-house', activeClass: 'text-physics-cyan bg-physics-cyan/10 border border-physics-cyan/30', badge: '15 Simulations', badgeColor: 'text-physics-cyan' },
        { href: 'mechanics.html', label: 'Mechanics', icon: 'fa-plane-launch', activeClass: 'text-physics-cyan bg-physics-cyan/10 border border-physics-cyan/30', badge: 'Mechanics Lab', badgeColor: 'text-physics-cyan' },
        { href: 'fluids.html', label: 'Fluids', icon: 'fa-droplet', activeClass: 'text-physics-purple bg-physics-purple/10 border border-physics-purple/30', badge: 'Fluids Lab', badgeColor: 'text-physics-purple' },
        { href: 'optics.html', label: 'Optics', icon: 'fa-glasses', activeClass: 'text-amber-400 bg-amber-500/10 border border-amber-500/30', badge: 'Optics Lab', badgeColor: 'text-amber-400' },
        { href: 'electrostatics.html', label: 'Electrostatics', icon: 'fa-bolt', activeClass: 'text-physics-pink bg-physics-pink/10 border border-physics-pink/30', badge: 'Electrostatics Lab', badgeColor: 'text-physics-pink' },
        { href: 'modern.html', label: 'Modern', icon: 'fa-sun', activeClass: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30', badge: 'Modern Physics Lab', badgeColor: 'text-emerald-400' }
    ];

    const currentNav = navItems.find(item => item.href === page) || navItems[0];

    const navLinksHTML = navItems.map(item => {
        const isActive = item.href === page;
        const classes = isActive
            ? `px-3 py-2 rounded-lg text-xs font-medium ${item.activeClass} flex items-center gap-1.5`
            : `px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all flex items-center gap-1.5`;
        return `<a href="${item.href}" class="${classes}"><i class="fa-solid ${item.icon}"></i> ${item.label}</a>`;
    }).join('');

    // Show Logout button on index.html, and Dashboard home button on sub-pages
    const actionButtonHTML = (page === 'index.html' || page === '')
        ? `<button onclick="logout()" title="Log out" class="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-rose-400 border border-gray-800 transition-colors">
               <i class="fa-solid fa-right-from-bracket"></i>
           </button>`
        : `<a href="index.html" title="Dashboard" class="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-physics-cyan border border-gray-800 transition-colors">
               <i class="fa-solid fa-house"></i>
           </a>`;

    placeholder.outerHTML = `
    <header class="sticky top-0 z-40 bg-physics-dark/95 backdrop-blur-md border-b border-physics-border px-4 lg:px-8 py-3">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
            <a href="index.html" class="flex items-center space-x-3 cursor-pointer">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-physics-cyan to-physics-purple p-0.5 flex items-center justify-center shadow-lg shadow-physics-cyan/20 overflow-hidden">
                    <div class="w-full h-full bg-physics-dark rounded-[10px] flex items-center justify-center overflow-hidden">
                        <img src="logo.png" alt="PhysicsRepo Logo" class="w-full h-full object-contain p-0.5">
                    </div>
                </div>
                <div>
                    <span class="text-lg font-extrabold tracking-wider bg-gradient-to-r from-physics-cyan via-white to-physics-purple bg-clip-text text-transparent">PHYSICS<span class="text-physics-cyan">REPO</span></span>
                    <span class="hidden sm:inline-block text-[10px] text-gray-400 font-mono ml-2 border-l border-gray-800 pl-2">The Physics Academy</span>
                </div>
            </a>

            <nav class="hidden lg:flex items-center space-x-1">
                ${navLinksHTML}
            </nav>

            <div class="flex items-center space-x-3">
                <div class="flex items-center gap-2 bg-physics-card border border-physics-border px-3 py-1.5 rounded-xl">
                    <div class="w-7 h-7 rounded-full bg-gradient-to-r from-physics-cyan to-physics-purple text-slate-950 font-bold text-xs flex items-center justify-center" id="user-avatar-initials">GS</div>
                    <div class="hidden sm:block text-left">
                        <div class="text-xs font-semibold text-white leading-tight" id="user-display-name">Guest Student</div>
                        <div class="text-[10px] font-mono ${currentNav.badgeColor}" id="user-progress-badge">${currentNav.badge}</div>
                    </div>
                </div>
                ${actionButtonHTML}
            </div>
        </div>
    </header>
    `;
})();