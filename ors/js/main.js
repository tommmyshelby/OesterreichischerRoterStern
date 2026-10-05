// =========================================================
// ÖRS MAIN.JS
// Österreichischer Roter Stern
// =========================================================

import {
    getSession,
    onAuthStateChange
} from './supabase.js';

import {
    signInWithDiscord,
    signOut,
    getUserAccessInfo
} from './auth.js';




const elements = {

    discordLogin:
        document.getElementById('discord-login'),

    discordLogout:
        document.getElementById('discord-logout'),

    heroLogin:
        document.getElementById('hero-login'),

    accountSection:
        document.getElementById('account'),

    userAvatar:
        document.getElementById('user-avatar'),

    userName:
        document.getElementById('user-name'),

    userDiscordId:
        document.getElementById('user-discord-id'),

    userAccess:
        document.getElementById('user-access'),

    accountProfile:
        document.getElementById('account-profile'),

    navLinks:
        document.querySelectorAll('.nav-link'),




    profileMenu:
        document.getElementById('profile-menu'),

    profileTrigger:
        document.getElementById('profile-trigger'),

    profileDropdown:
        document.getElementById('profile-dropdown'),

    profileChevron:
        document.getElementById('profile-chevron'),

    headerUserAvatar:
        document.getElementById('header-user-avatar'),

    headerUserName:
        document.getElementById('header-user-name'),

    headerUserAccess:
        document.getElementById('header-user-access'),

    dropdownUserAvatar:
        document.getElementById('dropdown-user-avatar'),

    dropdownUserName:
        document.getElementById('dropdown-user-name'),

    dropdownUserId:
        document.getElementById('dropdown-user-id'),

    profileRoleSection:
        document.getElementById('profile-role-section'),

    profileRoleLinks:
        document.getElementById('profile-role-links')

};




let currentUser = null;
let currentAccess = null;




function log(...args) {

    console.log(
        '[ÖRS]',
        ...args
    );

}


function error(...args) {

    console.error(
        '[ÖRS]',
        ...args
    );

}



function setLoginState(loggedIn) {

    if (elements.discordLogin) {

        elements.discordLogin.classList.toggle(
            'hidden',
            loggedIn
        );

    }


    if (elements.profileMenu) {

        elements.profileMenu.classList.toggle(
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




function showAccount() {

    if (!elements.accountSection) {
        return;
    }

    elements.accountSection.classList.remove(
        'hidden'
    );

}


function hideAccount() {

    if (!elements.accountSection) {
        return;
    }

    elements.accountSection.classList.add(
        'hidden'
    );

}




function resetAccountUI() {

    if (elements.userAvatar) {

        elements.userAvatar.removeAttribute(
            'src'
        );

        elements.userAvatar.alt =
            'Profilbild';

    }


    if (elements.userName) {

        elements.userName.textContent =
            'Benutzer';

    }


    if (elements.userDiscordId) {

        elements.userDiscordId.textContent =
            '–';

    }


    if (elements.userAccess) {

        elements.userAccess.textContent =
            'Kein Zugriff';

    }


    resetProfileMenu();

}



function getAvatarUrl(user) {

    if (!user) {
        return null;
    }

    return (
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        user.user_metadata?.avatar ||
        null
    );

}




function getDisplayName(
    user,
    profile
) {

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
// DISCORD ID
// =========================================================

function getDiscordId(
    user,
    profile
) {

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
// ACCESS LABEL
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
// PROFIL-DROPDOWN ÖFFNEN
// =========================================================

function openProfileMenu() {

    if (!elements.profileMenu) {
        return;
    }


    elements.profileMenu.classList.add(
        'open'
    );


    if (elements.profileTrigger) {

        elements.profileTrigger.setAttribute(
            'aria-expanded',
            'true'
        );

    }


    if (elements.profileChevron) {

        elements.profileChevron.style.transform =
            'rotate(180deg)';

    }

}


// =========================================================
// PROFIL-DROPDOWN SCHLIESSEN
// =========================================================

function closeProfileMenu() {

    if (!elements.profileMenu) {
        return;
    }


    elements.profileMenu.classList.remove(
        'open'
    );


    if (elements.profileTrigger) {

        elements.profileTrigger.setAttribute(
            'aria-expanded',
            'false'
        );

    }


    if (elements.profileChevron) {

        elements.profileChevron.style.transform =
            'rotate(0deg)';

    }

}


// =========================================================
// PROFIL-DROPDOWN TOGGLE
// =========================================================

function toggleProfileMenu() {

    if (!elements.profileMenu) {
        return;
    }


    if (
        elements.profileMenu.classList.contains(
            'open'
        )
    ) {

        closeProfileMenu();

    } else {

        openProfileMenu();

    }

}


// =========================================================
// PROFILE MENU RESET
// =========================================================

function resetProfileMenu() {

    clearRoleMenu();

    if (elements.profileRoleSection) {

        elements.profileRoleSection.classList.add(
            'hidden'
        );

    }

    closeProfileMenu();

}


// =========================================================
// ROLE MENÜ LEEREN
// =========================================================

function clearRoleMenu() {

    if (!elements.profileRoleLinks) {
        return;
    }

    elements.profileRoleLinks.innerHTML = '';

}


// =========================================================
// ROLE LINK
// =========================================================

function createRoleLink(
    icon,
    label,
    action
) {

    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.className =
        'profile-dropdown-link';


    button.dataset.roleAction =
        action;


    button.innerHTML = `

        <iconify-icon
            icon="${icon}"
        ></iconify-icon>

        <span>
            ${escapeHtml(label)}
        </span>

    `;


    button.addEventListener(
        'click',
        () => {

            handleRoleAction(
                action
            );

        }
    );


    return button;

}


// =========================================================
// ROLE GRUPPE
// =========================================================

function createRoleGroup(
    title,
    items
) {

    const group =
        document.createElement(
            'div'
        );


    group.className =
        'profile-role-group';


    const titleElement =
        document.createElement(
            'div'
        );


    titleElement.className =
        'profile-role-group-title';


    titleElement.textContent =
        title;


    group.appendChild(
        titleElement
    );


    const links =
        document.createElement(
            'div'
        );


    links.className =
        'profile-role-group-links';


    items.forEach(
        item => {

            links.appendChild(
                createRoleLink(
                    item.icon,
                    item.label,
                    item.action
                )
            );

        }
    );


    group.appendChild(
        links
    );


    return group;

}


// =========================================================
// ROLE MENÜ AUFBAUEN
// =========================================================

function updateRoleMenu(access) {

    clearRoleMenu();


    if (
        !elements.profileRoleSection ||
        !elements.profileRoleLinks
    ) {
        return;
    }


    const groups = [];


    // =====================================================
    // LEADERSHIP
    // =====================================================

    if (access?.isLeadership) {

        groups.push(
            createRoleGroup(
                'FÜHRUNG',
                [
                    {
                        icon:
                            'iconoir:community',

                        label:
                            'Führungsebene',

                        action:
                            'leadership'
                    }
                ]
            )
        );


        groups.push(
            createRoleGroup(
                'VERWALTUNG',
                [
                    {
                        icon:
                            'iconoir:group',

                        label:
                            'Mitgliederverwaltung',

                        action:
                            'members'
                    },

                    {
                        icon:
                            'iconoir:map',

                        label:
                            'Einsatzverwaltung',

                        action:
                            'operations'
                    },

                    {
                        icon:
                            'iconoir:settings',

                        label:
                            'Systemverwaltung',

                        action:
                            'settings'
                    }
                ]
            )
        );

    }


    // =====================================================
    // OFFICER
    // =====================================================

    else if (access?.isOfficer) {

        groups.push(
            createRoleGroup(
                'OFFICER',
                [
                    {
                        icon:
                            'iconoir:community',

                        label:
                            'Officer-Bereich',

                        action:
                            'officer'
                    }
                ]
            )
        );


        groups.push(
            createRoleGroup(
                'VERWALTUNG',
                [
                    {
                        icon:
                            'iconoir:group',

                        label:
                            'Mitglieder',

                        action:
                            'members'
                    },

                    {
                        icon:
                            'iconoir:map',

                        label:
                            'Einsätze',

                        action:
                            'operations'
                    }
                ]
            )
        );

    }


    // =====================================================
    // MEDICAL
    // =====================================================

    if (
        access?.isMedical ||
        access?.isLeadership
    ) {

        groups.push(
            createRoleGroup(
                'MEDIZIN',
                [
                    {
                        icon:
                            'iconoir:health-shield',

                        label:
                            'Medizin',

                        action:
                            'medical'
                    },

                    {
                        icon:
                            'iconoir:medical-case',

                        label:
                            'Behandlungen',

                        action:
                            'treatments'
                    },

                    {
                        icon:
                            'iconoir:activity',

                        label:
                            'Reanimation',

                        action:
                            'reanimation'
                    },

                    {
                        icon:
                            'iconoir:box',

                        label:
                            'Ausrüstung',

                        action:
                            'equipment'
                    }
                ]
            )
        );

    }


    // =====================================================
    // KEINE BEREICHE
    // =====================================================

    if (!groups.length) {

        elements.profileRoleSection.classList.add(
            'hidden'
        );

        return;
    }


    // =====================================================
    // GRUPPEN EINFÜGEN
    // =====================================================

    groups.forEach(
        group => {

            elements.profileRoleLinks.appendChild(
                group
            );

        }
    );


    elements.profileRoleSection.classList.remove(
        'hidden'
    );

}


// =========================================================
// ROLE ACTION
// =========================================================

function handleRoleAction(action) {

    closeProfileMenu();


    if (action === 'leadership') {

        if (!currentAccess?.isLeadership) {

            showNotification(
                'Du hast keinen Zugriff auf die Führungsebene.',
                'error'
            );

            return;
        }


        window.location.href =
            './ors/leadership/';

        return;
    }


    const messages = {

        officer:
            'Der Officer-Bereich wird später eingebunden.',

        medical:
            'Der medizinische Bereich wird später eingebunden.',

        members:
            'Die Mitgliederverwaltung wird später eingebunden.',

        operations:
            'Die Einsatzverwaltung wird später eingebunden.',

        treatments:
            'Die Behandlungsverwaltung wird später eingebunden.',

        reanimation:
            'Der Reanimationsbereich wird später eingebunden.',

        equipment:
            'Die Ausrüstungsverwaltung wird später eingebunden.',

        settings:
            'Die Systemverwaltung wird später eingebunden.'

    };


    showNotification(
        messages[action] ||
        'Dieser Bereich wird später eingebunden.',
        'info'
    );


    log(
        'Bereich:',
        action
    );

}


// =========================================================
// HEADER PROFIL AKTUALISIEREN
// =========================================================

function updateHeaderProfile(
    user,
    profile,
    access
) {

    const name =
        getDisplayName(
            user,
            profile
        );


    const discordId =
        getDiscordId(
            user,
            profile
        );


    const avatar =
        getAvatarUrl(
            user
        );


    const accessLabel =
        getAccessLabel(
            access
        );


    if (elements.headerUserName) {

        elements.headerUserName.textContent =
            name;

    }


    if (elements.headerUserAccess) {

        elements.headerUserAccess.textContent =
            accessLabel;

    }


    if (elements.dropdownUserName) {

        elements.dropdownUserName.textContent =
            name;

    }


    if (elements.dropdownUserId) {

        elements.dropdownUserId.textContent =
            `Discord ID: ${discordId}`;

    }


    if (elements.headerUserAvatar) {

        if (avatar) {

            elements.headerUserAvatar.src =
                avatar;

        } else {

            elements.headerUserAvatar.removeAttribute(
                'src'
            );

        }


        elements.headerUserAvatar.alt =
            `${name} Profilbild`;

    }


    if (elements.dropdownUserAvatar) {

        if (avatar) {

            elements.dropdownUserAvatar.src =
                avatar;

        } else {

            elements.dropdownUserAvatar.removeAttribute(
                'src'
            );

        }


        elements.dropdownUserAvatar.alt =
            `${name} Profilbild`;

    }


    updateRoleMenu(
        access
    );

}


// =========================================================
// ACCOUNT UI
// =========================================================

async function updateAccountUI(user) {

    if (!user) {

        resetAccountUI();

        hideAccount();

        return;
    }


    try {

        log(
            'Lade Benutzerinformationen...'
        );


        const accessInfo =
            await getUserAccessInfo();


        if (!accessInfo) {

            resetAccountUI();

            showAccount();

            return;
        }


        currentAccess =
            accessInfo;


        const profile =
            accessInfo.profile || null;


        const name =
            getDisplayName(
                user,
                profile
            );


        const discordId =
            getDiscordId(
                user,
                profile
            );


        const avatar =
            getAvatarUrl(
                user
            );


        const accessLabel =
            getAccessLabel(
                accessInfo
            );


        if (elements.userName) {

            elements.userName.textContent =
                name;

        }


        if (elements.userDiscordId) {

            elements.userDiscordId.textContent =
                discordId;

        }


        if (elements.userAvatar) {

            if (avatar) {

                elements.userAvatar.src =
                    avatar;

                elements.userAvatar.alt =
                    `${name} Profilbild`;

            } else {

                elements.userAvatar.removeAttribute(
                    'src'
                );

            }

        }


        if (elements.userAccess) {

            elements.userAccess.textContent =
                accessLabel;

        }


        updateHeaderProfile(
            user,
            profile,
            accessInfo
        );


        // Die Profilkarte wird für jeden
        // angemeldeten Benutzer angezeigt.
        if (elements.accountProfile) {

            elements.accountProfile.classList.remove(
                'hidden'
            );

        }


        showAccount();


        log(
            'Benutzer:',
            name
        );


        log(
            'Zugriff:',
            accessLabel
        );


    } catch (err) {

        error(
            'Fehler beim Laden des Accounts:',
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

        if (elements.discordLogin) {

            elements.discordLogin.disabled =
                true;

        }


        if (elements.heroLogin) {

            elements.heroLogin.disabled =
                true;

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

            elements.discordLogin.disabled =
                false;

        }


        if (elements.heroLogin) {

            elements.heroLogin.disabled =
                false;

        }

    }

}


// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    try {

        closeProfileMenu();


        await signOut();


        currentUser =
            null;


        currentAccess =
            null;


        setLoginState(
            false
        );


        hideAccount();


        resetAccountUI();


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

        currentUser =
            null;


        currentAccess =
            null;


        setLoginState(
            false
        );


        hideAccount();


        resetAccountUI();


        return;

    }


    currentUser =
        session.user;


    setLoginState(
        true
    );


    await updateAccountUI(
        session.user
    );

}


// =========================================================
// AUTH LISTENER
// =========================================================

function initializeAuthListener() {

    try {

        onAuthStateChange(
            async (
                event,
                session
            ) => {

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

                        await handleAuthState(
                            null
                        );

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

    } catch (err) {

        error(
            'Auth Listener Fehler:',
            err
        );

    }

}


// =========================================================
// PROFIL MENU
// =========================================================

function initializeProfileMenu() {

    if (!elements.profileTrigger) {
        return;
    }


    elements.profileTrigger.addEventListener(
        'click',
        event => {

            event.stopPropagation();

            toggleProfileMenu();

        }
    );


    document.addEventListener(
        'click',
        event => {

            if (
                elements.profileMenu &&
                !elements.profileMenu.contains(
                    event.target
                )
            ) {

                closeProfileMenu();

            }

        }
    );


    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key === 'Escape'
            ) {

                closeProfileMenu();

            }

        }
    );


    document.querySelectorAll(
        '[data-profile-action]'
    ).forEach(
        button => {

            button.addEventListener(
                'click',
                () => {

                    const action =
                        button.dataset.profileAction;


                    if (
                        action === 'profile'
                    ) {

                        closeProfileMenu();


                        window.location.href =
                            './ors/profile/';

                    }

                }
            );

        }
    );

}


// =========================================================
// LOGIN BUTTONS
// =========================================================

function initializeLoginButtons() {

    elements.discordLogin?.addEventListener(
        'click',
        login
    );


    elements.heroLogin?.addEventListener(
        'click',
        login
    );


    elements.discordLogout?.addEventListener(
        'click',
        logout
    );

}


// =========================================================
// PROFIL BUTTON UNTEN
// =========================================================

function initializeAccountProfileButton() {

    if (!elements.accountProfile) {
        return;
    }


    elements.accountProfile.addEventListener(
        'click',
        () => {

            if (!currentUser) {

                showNotification(
                    'Bitte zuerst mit Discord anmelden.',
                    'error'
                );

                return;
            }


            window.location.href =
                './ors/profile/';

        }
    );

}


// =========================================================
// NAVIGATION
// =========================================================

function initializeNavigation() {

    const links =
        Array.from(
            elements.navLinks
        );


    if (!links.length) {
        return;
    }


    links.forEach(
        link => {

            link.addEventListener(
                'click',
                () => {

                    links.forEach(
                        item =>
                            item.classList.remove(
                                'active'
                            )
                    );


                    link.classList.add(
                        'active'
                    );

                }
            );

        }
    );


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

                        if (
                            !entry.isIntersecting
                        ) {
                            return;
                        }


                        const id =
                            entry.target.id;


                        links.forEach(
                            link => {

                                link.classList.toggle(
                                    'active',
                                    link.getAttribute(
                                        'href'
                                    ) === `#${id}`
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
        section =>
            observer.observe(
                section
            )
    );

}


// =========================================================
// AVATAR FALLBACK
// =========================================================

function initializeAvatarFallback() {

    const avatars = [

        elements.userAvatar,

        elements.headerUserAvatar,

        elements.dropdownUserAvatar

    ];


    avatars.forEach(
        avatar => {

            avatar?.addEventListener(
                'error',
                () => {

                    avatar.removeAttribute(
                        'src'
                    );

                }
            );

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
        .forEach(
            link => {

                link.setAttribute(
                    'rel',
                    'noopener noreferrer'
                );

            }
        );

}


// =========================================================
// NOTIFICATIONS
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
            document.createElement(
                'div'
            );


        container.className =
            'ors-notifications';


        document.body.appendChild(
            container
        );

    }


    const notification =
        document.createElement(
            'div'
        );


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

            <iconify-icon
                icon="${icon}"
            ></iconify-icon>

        </div>

        <div class="ors-notification-text">

            ${escapeHtml(message)}

        </div>

    `;


    container.appendChild(
        notification
    );


    requestAnimationFrame(
        () => {

            notification.classList.add(
                'visible'
            );

        }
    );


    setTimeout(
        () => {

            notification.classList.remove(
                'visible'
            );


            setTimeout(
                () => {

                    notification.remove();

                },
                220
            );

        },
        3500
    );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            '&',
            '&amp;'
        )

        .replaceAll(
            '<',
            '&lt;'
        )

        .replaceAll(
            '>',
            '&gt;'
        )

        .replaceAll(
            '"',
            '&quot;'
        )

        .replaceAll(
            "'",
            '&#039;'
        );

}


// =========================================================
// INITIALIZE
// =========================================================

async function initialize() {

    log(
        'ÖRS Website wird initialisiert.'
    );


    initializeLoginButtons();

    initializeProfileMenu();

    initializeNavigation();

    initializeAccountProfileButton();

    initializeAvatarFallback();

    initializeExternalLinks();

    initializeAuthListener();


    await initializeAuthentication();


    log(
        'ÖRS Website bereit.'
    );

}


// =========================================================
// AUTHENTICATION
// =========================================================

async function initializeAuthentication() {

    try {

        const session =
            await getSession();


        await handleAuthState(
            session
        );


    } catch (err) {

        error(
            'Session konnte nicht geladen werden:',
            err
        );


        setLoginState(
            false
        );

    }

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
