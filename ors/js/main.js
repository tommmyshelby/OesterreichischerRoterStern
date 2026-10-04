// =========================================================
// ÖRS - MAIN.JS
// Österreichischer Roter Stern
// Zentrale Steuerung der Website
// =========================================================

import {
    getSession,
    getCurrentUser,
    onAuthStateChange
} from './supabase.js';

import {
    signInWithDiscord,
    signOut,
    getUserAccessInfo
} from './auth.js';


// =========================================================
// DOM ELEMENTE
// =========================================================

const elements = {
    discordLogin: document.getElementById('discord-login'),
    discordLogout: document.getElementById('discord-logout'),

    heroLogin: document.getElementById('hero-login'),

    accountSection: document.getElementById('account'),

    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userDiscordId: document.getElementById('user-discord-id'),
    userAccess: document.getElementById('user-access'),

    accountDashboard: document.getElementById('account-dashboard'),

    navLinks: document.querySelectorAll('.nav-link')
};


// =========================================================
// WEBSITE STATUS
// =========================================================

let currentUser = null;
let currentAccess = null;


// =========================================================
// LOG
// =========================================================

function log(...args) {
    console.log('[ÖRS]', ...args);
}

function warn(...args) {
    console.warn('[ÖRS]', ...args);
}

function error(...args) {
    console.error('[ÖRS]', ...args);
}


// =========================================================
// LOGIN / LOGOUT BUTTONS
// =========================================================

function setLoginState(loggedIn) {

    if (elements.discordLogin) {
        elements.discordLogin.classList.toggle(
            'hidden',
            loggedIn
        );
    }

    if (elements.discordLogout) {
        elements.discordLogout.classList.toggle(
            'hidden',
            !loggedIn
        );
    }

    if (elements.heroLogin) {
        elements.heroLogin.classList.toggle(
            'hidden',
            loggedIn
        );
    }
}


// =========================================================
// ACCOUNT SECTION
// =========================================================

function showAccount() {

    if (!elements.accountSection) {
        return;
    }

    elements.accountSection.classList.remove('hidden');
}

function hideAccount() {

    if (!elements.accountSection) {
        return;
    }

    elements.accountSection.classList.add('hidden');
}


// =========================================================
// ACCOUNT DATEN ZURÜCKSETZEN
// =========================================================

function resetAccountUI() {

    if (elements.userAvatar) {
        elements.userAvatar.removeAttribute('src');
        elements.userAvatar.alt = 'Profilbild';
    }

    if (elements.userName) {
        elements.userName.textContent = 'Benutzer';
    }

    if (elements.userDiscordId) {
        elements.userDiscordId.textContent = '–';
    }

    if (elements.userAccess) {
        elements.userAccess.textContent = 'Kein Zugriff';
    }
}


// =========================================================
// DISCORD PROFILBILD
// =========================================================

function getAvatarUrl(user) {

    if (!user) {
        return null;
    }

    // Supabase Discord Provider
    if (user.user_metadata?.avatar_url) {
        return user.user_metadata.avatar_url;
    }

    if (user.user_metadata?.picture) {
        return user.user_metadata.picture;
    }

    if (user.user_metadata?.avatar) {
        return user.user_metadata.avatar;
    }

    return null;
}


// =========================================================
// DISCORD NAME
// =========================================================

function getDisplayName(user, profile) {

    if (profile?.display_name) {
        return profile.display_name;
    }

    if (profile?.username) {
        return profile.username;
    }

    if (user?.user_metadata?.global_name) {
        return user.user_metadata.global_name;
    }

    if (user?.user_metadata?.name) {
        return user.user_metadata.name;
    }

    if (user?.user_metadata?.full_name) {
        return user.user_metadata.full_name;
    }

    if (user?.user_metadata?.preferred_username) {
        return user.user_metadata.preferred_username;
    }

    if (user?.user_metadata?.username) {
        return user.user_metadata.username;
    }

    return 'ÖRS Mitglied';
}


// =========================================================
// DISCORD ID ERMITTELN
// =========================================================

function getDiscordId(user, profile) {

    if (profile?.discord_id) {
        return profile.discord_id;
    }

    if (user?.user_metadata?.provider_id) {
        return user.user_metadata.provider_id;
    }

    if (user?.user_metadata?.sub) {
        return user.user_metadata.sub;
    }

    if (user?.app_metadata?.provider_id) {
        return user.app_metadata.provider_id;
    }

    return 'Nicht verfügbar';
}


// =========================================================
// ZUGRIFFSSTUFE
// =========================================================

function getAccessLabel(access) {

    if (!access) {
        return 'Kein Zugriff';
    }

    if (access.isLeadership) {
        return 'Leadership';
    }

    if (access.isOfficer) {
        return 'Officer';
    }

    if (access.isMedical) {
        return 'Medical';
    }

    if (access.hasAccess) {
        return 'ÖRS Mitglied';
    }

    return 'Kein ÖRS Zugriff';
}


// =========================================================
// ACCOUNT UI AKTUALISIEREN
// =========================================================

async function updateAccountUI(user) {

    if (!user) {
        resetAccountUI();
        hideAccount();

        return;
    }

    try {

        log('Lade ÖRS Benutzerinformationen...');

        const accessInfo = await getUserAccessInfo();

        if (!accessInfo) {
            warn('Keine Benutzerinformationen erhalten.');

            resetAccountUI();

            if (elements.userName) {
                elements.userName.textContent =
                    getDisplayName(user, null);
            }

            if (elements.userDiscordId) {
                elements.userDiscordId.textContent =
                    getDiscordId(user, null);
            }

            if (elements.userAccess) {
                elements.userAccess.textContent =
                    'Zugriff wird geprüft...';
            }

            showAccount();

            return;
        }


        currentAccess = accessInfo;


        const profile =
            accessInfo.profile || null;


        // -----------------------------------------
        // NAME
        // -----------------------------------------

        if (elements.userName) {

            elements.userName.textContent =
                getDisplayName(
                    user,
                    profile
                );
        }


        // -----------------------------------------
        // DISCORD ID
        // -----------------------------------------

        if (elements.userDiscordId) {

            elements.userDiscordId.textContent =
                getDiscordId(
                    user,
                    profile
                );
        }


        // -----------------------------------------
        // AVATAR
        // -----------------------------------------

        if (elements.userAvatar) {

            const avatarUrl =
                getAvatarUrl(user);

            if (avatarUrl) {

                elements.userAvatar.src =
                    avatarUrl;

                elements.userAvatar.alt =
                    `${getDisplayName(user, profile)} Profilbild`;

            } else {

                elements.userAvatar.removeAttribute('src');

                elements.userAvatar.alt =
                    'Kein Profilbild verfügbar';
            }
        }


        // -----------------------------------------
        // ZUGRIFF
        // -----------------------------------------

        if (elements.userAccess) {

            elements.userAccess.textContent =
                getAccessLabel(accessInfo);
        }


        showAccount();

        log(
            'Benutzer geladen:',
            getDisplayName(user, profile)
        );

        log(
            'ÖRS Zugriff:',
            getAccessLabel(accessInfo)
        );

    } catch (err) {

        error(
            'Fehler beim Aktualisieren des Accounts:',
            err
        );

        if (elements.userAccess) {
            elements.userAccess.textContent =
                'Zugriff konnte nicht geprüft werden';
        }

        showAccount();
    }
}


// =========================================================
// LOGIN
// =========================================================

async function login() {

    try {

        log('Starte Discord Login...');

        if (elements.discordLogin) {
            elements.discordLogin.disabled = true;
        }

        if (elements.heroLogin) {
            elements.heroLogin.disabled = true;
        }

        await signInWithDiscord();

    } catch (err) {

        error(
            'Discord Login fehlgeschlagen:',
            err
        );

        showNotification(
            'Der Discord Login konnte nicht gestartet werden.',
            'error'
        );

        if (elements.discordLogin) {
            elements.discordLogin.disabled = false;
        }

        if (elements.heroLogin) {
            elements.heroLogin.disabled = false;
        }
    }
}


// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    try {

        log('Melde Benutzer ab...');

        await signOut();

        currentUser = null;
        currentAccess = null;

        setLoginState(false);

        hideAccount();

        resetAccountUI();

        log('Logout erfolgreich.');

    } catch (err) {

        error(
            'Logout fehlgeschlagen:',
            err
        );

        showNotification(
            'Das Abmelden ist fehlgeschlagen.',
            'error'
        );
    }
}


// =========================================================
// AUTH STATE
// =========================================================

async function handleAuthState(session) {

    if (!session?.user) {

        currentUser = null;
        currentAccess = null;

        setLoginState(false);

        hideAccount();

        resetAccountUI();

        log('Kein Benutzer angemeldet.');

        return;
    }


    currentUser = session.user;

    setLoginState(true);

    await updateAccountUI(
        session.user
    );
}


// =========================================================
// SESSION INITIALISIEREN
// =========================================================

async function initializeAuthentication() {

    try {

        log('Prüfe aktuelle Session...');

        const session =
            await getSession();

        await handleAuthState(
            session
        );

    } catch (err) {

        error(
            'Fehler beim Initialisieren der Authentifizierung:',
            err
        );

        setLoginState(false);

        hideAccount();
    }
}


// =========================================================
// AUTH LISTENER
// =========================================================

function initializeAuthListener() {

    try {

        onAuthStateChange(
            async (event, session) => {

                log(
                    'Auth Event:',
                    event
                );

                switch (event) {

                    case 'SIGNED_IN':

                    case 'INITIAL_SESSION':

                    case 'TOKEN_REFRESHED':

                    case 'USER_UPDATED':

                        await handleAuthState(
                            session
                        );

                        break;


                    case 'SIGNED_OUT':

                        currentUser = null;
                        currentAccess = null;

                        setLoginState(false);

                        hideAccount();

                        resetAccountUI();

                        break;


                    default:

                        if (session) {
                            await handleAuthState(
                                session
                            );
                        }

                        break;
                }
            }
        );

        log(
            'Auth Listener aktiviert.'
        );

    } catch (err) {

        error(
            'Auth Listener konnte nicht aktiviert werden:',
            err
        );
    }
}


// =========================================================
// NAVIGATION
// =========================================================

function initializeNavigation() {

    if (!elements.navLinks?.length) {
        return;
    }

    elements.navLinks.forEach(link => {

        link.addEventListener(
            'click',
            () => {

                elements.navLinks.forEach(
                    otherLink => {
                        otherLink.classList.remove(
                            'active'
                        );
                    }
                );

                link.classList.add(
                    'active'
                );
            }
        );

    });

    // Aktiven Bereich beim Scrollen erkennen
    const sections =
        document.querySelectorAll(
            'main section[id]'
        );

    if (!sections.length) {
        return;
    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (!entry.isIntersecting) {
                            return;
                        }

                        const id =
                            entry.target.id;

                        elements.navLinks.forEach(
                            link => {

                                const href =
                                    link.getAttribute('href');

                                link.classList.toggle(
                                    'active',
                                    href === `#${id}`
                                );
                            }
                        );
                    }
                );
            },
            {
                rootMargin:
                    '-35% 0px -55% 0px'
            }
        );


    sections.forEach(
        section => observer.observe(section)
    );
}


// =========================================================
// DASHBOARD BUTTON
// =========================================================

function initializeDashboardButton() {

    if (!elements.accountDashboard) {
        return;
    }

    elements.accountDashboard.addEventListener(
        'click',
        () => {

            if (!currentUser) {

                showNotification(
                    'Bitte zuerst mit Discord anmelden.',
                    'error'
                );

                return;
            }


            if (!currentAccess) {

                showNotification(
                    'Deine Zugriffsrechte werden noch geprüft.',
                    'error'
                );

                return;
            }


            if (!currentAccess.hasAccess) {

                showNotification(
                    'Du hast aktuell keinen ÖRS Dashboard-Zugriff.',
                    'error'
                );

                return;
            }


            /*
             * DASHBOARD
             *
             * Die eigentliche Dashboard-Seite
             * wird später hier eingebunden.
             */

            showNotification(
                'Das Dashboard befindet sich noch in Entwicklung.',
                'info'
            );

            log(
                'Dashboard-Aufruf:',
                currentAccess
            );
        }
    );
}


// =========================================================
// LOGIN BUTTONS
// =========================================================

function initializeLoginButtons() {

    if (elements.discordLogin) {

        elements.discordLogin.addEventListener(
            'click',
            login
        );
    }


    if (elements.heroLogin) {

        elements.heroLogin.addEventListener(
            'click',
            login
        );
    }


    if (elements.discordLogout) {

        elements.discordLogout.addEventListener(
            'click',
            logout
        );
    }
}


// =========================================================
// NOTIFICATION SYSTEM
// =========================================================

function showNotification(
    message,
    type = 'info'
) {

    let container =
        document.querySelector(
            '.ors-notifications'
        );


    if (!container) {

        container =
            document.createElement('div');

        container.className =
            'ors-notifications';

        Object.assign(
            container.style,
            {
                position: 'fixed',
                right: '20px',
                bottom: '20px',
                zIndex: '9999',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: 'min(360px, calc(100vw - 40px))'
            }
        );

        document.body.appendChild(
            container
        );
    }


    const notification =
        document.createElement('div');


    notification.className =
        `ors-notification ors-notification-${type}`;


    const icon =
        type === 'error'
            ? 'iconoir:warning-triangle'
            : type === 'success'
                ? 'iconoir:check'
                : 'iconoir:info-circle';


    notification.innerHTML = `
        <div class="ors-notification-icon">
            <iconify-icon icon="${icon}"></iconify-icon>
        </div>

        <div class="ors-notification-text">
            ${escapeHtml(message)}
        </div>
    `;


    Object.assign(
        notification.style,
        {
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            padding: '13px 15px',
            borderRadius: '13px',
            background: 'rgba(16, 21, 29, 0.94)',
            border: '1px solid rgba(255,255,255,.08)',
            boxShadow: '0 18px 50px rgba(0,0,0,.4)',
            backdropFilter: 'blur(18px)',
            color: '#f4f6f8',
            fontSize: '11px',
            fontWeight: '600',
            opacity: '0',
            transform: 'translateY(10px)',
            transition: 'all .2s ease'
        }
    );


    const iconElement =
        notification.querySelector(
            '.ors-notification-icon'
        );


    if (iconElement) {

        Object.assign(
            iconElement.style,
            {
                width: '32px',
                height: '32px',
                display: 'grid',
                placeItems: 'center',
                flexShrink: '0',
                borderRadius: '9px',
                background:
                    type === 'error'
                        ? 'rgba(201,33,48,.12)'
                        : 'rgba(255,255,255,.05)'
            }
        );
    }


    container.appendChild(
        notification
    );


    requestAnimationFrame(
        () => {

            notification.style.opacity =
                '1';

            notification.style.transform =
                'translateY(0)';
        }
    );


    setTimeout(
        () => {

            notification.style.opacity =
                '0';

            notification.style.transform =
                'translateY(10px)';


            setTimeout(
                () => {
                    notification.remove();
                },
                220
            );

        },
        4000
    );
}


// =========================================================
// HTML ESCAPING
// =========================================================

function escapeHtml(value) {

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


// =========================================================
// AVATAR ERROR
// =========================================================

function initializeAvatarFallback() {

    if (!elements.userAvatar) {
        return;
    }

    elements.userAvatar.addEventListener(
        'error',
        () => {

            elements.userAvatar.removeAttribute(
                'src'
            );

            elements.userAvatar.alt =
                'Profilbild nicht verfügbar';
        }
    );
}


// =========================================================
// EXTERNE LINKS
// =========================================================

function initializeExternalLinks() {

    document
        .querySelectorAll(
            'a[target="_blank"]'
        )
        .forEach(link => {

            link.setAttribute(
                'rel',
                'noopener noreferrer'
            );
        });
}


// =========================================================
// INITIALISIERUNG
// =========================================================

async function initialize() {

    log(
        'ÖRS Website wird initialisiert...'
    );


    // Login / Logout
    initializeLoginButtons();


    // Navigation
    initializeNavigation();


    // Dashboard
    initializeDashboardButton();


    // Avatar
    initializeAvatarFallback();


    // externe Links
    initializeExternalLinks();


    // Auth Listener
    initializeAuthListener();


    // aktuelle Session
    await initializeAuthentication();


    log(
        'ÖRS Website erfolgreich initialisiert.'
    );
}




if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initialize,
        {
            once: true
        }
    );

} else {

    initialize();
}
