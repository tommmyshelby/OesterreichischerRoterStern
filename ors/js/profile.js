import {
    getUserAccessInfo,
    signOut
} from './auth.js';


/* =========================================================
   DOM
========================================================= */

const elements = {
    loading: document.getElementById('profile-loading'),

    profileAvatar: document.getElementById('profile-avatar'),
    profileStatusDot: document.getElementById('profile-status-dot'),

    profileName: document.getElementById('profile-name'),
    profileUsername: document.getElementById('profile-username'),
    profileRank: document.getElementById('profile-rank'),
    profileStatus: document.getElementById('profile-status'),

    profileDiscordId: document.getElementById('profile-discord-id'),
    profileDisplayName: document.getElementById('profile-display-name'),
    profileAccess: document.getElementById('profile-access'),
    profileLastLogin: document.getElementById('profile-last-login'),

    accountStatus: document.getElementById('account-status'),
    discordStatus: document.getElementById('discord-status'),
    orsAccessStatus: document.getElementById('ors-access-status'),

    officerPermission: document.getElementById('officer-permission'),
    medicalPermission: document.getElementById('medical-permission'),
    leadershipPermission: document.getElementById('leadership-permission'),

    logoutButton: document.getElementById('logout-button'),

    notification: document.getElementById('notification'),
    notificationTitle: document.getElementById('notification-title'),
    notificationMessage: document.getElementById('notification-message'),
    notificationClose: document.getElementById('notification-close')
};


/* =========================================================
   AVATAR
========================================================= */

function createAvatar(name = 'ÖRS') {

    const safeName = String(name || 'ÖRS')
        .trim()
        .slice(0, 2)
        .toUpperCase();

    return (
        'https://ui-avatars.com/api/?name=' +
        encodeURIComponent(safeName) +
        '&background=171b23&color=f2f4f7&bold=true'
    );
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return 'Nicht verfügbar';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Nicht verfügbar';
    }

    return new Intl.DateTimeFormat(
        'de-DE',
        {
            dateStyle: 'medium',
            timeStyle: 'short'
        }
    ).format(date);
}


/* =========================================================
   ACCESS LEVEL
========================================================= */

function getAccessLabel(accessInfo) {

    if (accessInfo?.isLeadership) {
        return 'Leadership';
    }

    if (accessInfo?.isOfficer) {
        return 'Officer';
    }

    if (accessInfo?.isMedical) {
        return 'Medical';
    }

    /*
     * Jeder eingeloggte Nutzer darf sein eigenes
     * Profil sehen.
     */
    return 'Mitglied';
}


/* =========================================================
   PROFILE DATA
========================================================= */

function getProfileData(accessInfo) {

    const profile = accessInfo?.profile;
    const user = accessInfo?.user;

    const metadata = user?.user_metadata || {};

    const name =
        profile?.display_name ||
        profile?.username ||
        metadata.full_name ||
        metadata.global_name ||
        metadata.name ||
        metadata.preferred_username ||
        'ÖRS Mitglied';

    const username =
        profile?.username ||
        metadata.preferred_username ||
        metadata.username ||
        metadata.name ||
        name;

    const discordId =
        profile?.discord_id ||
        metadata.provider_id ||
        metadata.sub ||
        user?.identities?.[0]?.identity_data?.provider_id ||
        'Nicht verfügbar';

    const avatar =
        profile?.avatar_url ||
        metadata.avatar_url ||
        metadata.picture ||
        createAvatar(name);

    const lastLogin =
        profile?.last_login ||
        user?.last_sign_in_at ||
        null;

    return {
        name,
        username,
        discordId,
        avatar,
        lastLogin
    };
}


/* =========================================================
   UPDATE PROFILE
========================================================= */

function updateProfile(accessInfo) {

    const profileData = getProfileData(accessInfo);

    const accessLabel =
        getAccessLabel(accessInfo);


    /* NAME */

    if (elements.profileName) {
        elements.profileName.textContent =
            profileData.name;
    }


    /* USERNAME */

    if (elements.profileUsername) {
        elements.profileUsername.textContent =
            profileData.username;
    }


    /* RANK */

    if (elements.profileRank) {
        elements.profileRank.textContent =
            accessLabel;
    }


    /* DISCORD ID */

    if (elements.profileDiscordId) {
        elements.profileDiscordId.textContent =
            profileData.discordId;
    }


    /* DISPLAY NAME */

    if (elements.profileDisplayName) {
        elements.profileDisplayName.textContent =
            profileData.name;
    }


    /* ACCESS */

    if (elements.profileAccess) {
        elements.profileAccess.textContent =
            accessLabel;
    }


    /* LAST LOGIN */

    if (elements.profileLastLogin) {
        elements.profileLastLogin.textContent =
            formatDate(profileData.lastLogin);
    }


    /* STATUS */

    if (elements.profileStatus) {
        elements.profileStatus.textContent =
            'Aktiv';
    }


    /* ACCOUNT */

    if (elements.accountStatus) {
        elements.accountStatus.textContent =
            'Aktiv';
    }


    if (elements.discordStatus) {
        elements.discordStatus.textContent =
            'Verbunden';
    }


    if (elements.orsAccessStatus) {
        elements.orsAccessStatus.textContent =
            'Aktiv';
    }


    /* AVATAR */

    if (elements.profileAvatar) {

        elements.profileAvatar.src =
            profileData.avatar;

        elements.profileAvatar.alt =
            `Profilbild von ${profileData.name}`;

        elements.profileAvatar.onerror = () => {

            elements.profileAvatar.src =
                createAvatar(profileData.name);

        };
    }
}


/* =========================================================
   PERMISSIONS
========================================================= */

function updatePermissionState(
    element,
    allowed
) {

    if (!element) {
        return;
    }

    if (allowed) {

        element.textContent =
            'Verfügbar';

        element.classList.add('active');

    } else {

        element.textContent =
            'Nicht verfügbar';

        element.classList.remove('active');
    }
}


function updatePermissions(accessInfo) {

    updatePermissionState(
        elements.officerPermission,
        Boolean(accessInfo?.isOfficer)
    );

    updatePermissionState(
        elements.medicalPermission,
        Boolean(accessInfo?.isMedical)
    );

    updatePermissionState(
        elements.leadershipPermission,
        Boolean(accessInfo?.isLeadership)
    );
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function showNotification(
    title,
    message
) {

    if (
        !elements.notification ||
        !elements.notificationTitle ||
        !elements.notificationMessage
    ) {
        return;
    }

    elements.notificationTitle.textContent =
        title;

    elements.notificationMessage.textContent =
        message;

    elements.notification.hidden =
        false;
}


function hideNotification() {

    if (!elements.notification) {
        return;
    }

    elements.notification.hidden =
        true;
}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    if (!elements.logoutButton) {
        return;
    }

    elements.logoutButton.addEventListener(
        'click',
        async () => {

            elements.logoutButton.disabled =
                true;

            try {

                await signOut();

                window.location.replace(
                    '../../index.html'
                );

            } catch (error) {

                console.error(
                    '[ÖRS Profil] Abmeldung fehlgeschlagen:',
                    error
                );

                elements.logoutButton.disabled =
                    false;

                showNotification(
                    'Abmeldung fehlgeschlagen',
                    'Die Abmeldung konnte nicht durchgeführt werden.'
                );
            }
        }
    );
}


/* =========================================================
   NOTIFICATION CLOSE
========================================================= */

function setupNotification() {

    if (!elements.notificationClose) {
        return;
    }

    elements.notificationClose.addEventListener(
        'click',
        hideNotification
    );
}


/* =========================================================
   ACCESS CHECK
========================================================= */

async function checkProfileAccess() {

    try {

        const accessInfo =
            await getUserAccessInfo();


        /*
         * Wichtig:
         *
         * Hier wird NUR geprüft, ob der Nutzer
         * eingeloggt ist.
         *
         * Kein Leadership-Check.
         * Kein Officer-Check.
         * Kein Medical-Check.
         */

        if (!accessInfo?.authenticated) {

            window.location.replace(
                '../../index.html?access=login-required'
            );

            return null;
        }


        return accessInfo;

    } catch (error) {

        console.error(
            '[ÖRS Profil] Zugriff konnte nicht geprüft werden:',
            error
        );

        window.location.replace(
            '../../index.html?access=error'
        );

        return null;
    }
}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    if (!elements.loading) {
        return;
    }

    elements.loading.classList.add(
        'hidden'
    );

    setTimeout(() => {

        if (elements.loading) {
            elements.loading.remove();
        }

    }, 300);
}


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeProfile() {

    console.log(
        '[ÖRS Profil] Persönliches Profil wird geladen...'
    );


    const accessInfo =
        await checkProfileAccess();


    if (!accessInfo) {
        return;
    }


    updateProfile(
        accessInfo
    );


    updatePermissions(
        accessInfo
    );


    setupLogout();
    setupNotification();


    hideLoading();


    console.log(
        '[ÖRS Profil] Eigenes Profil erfolgreich geladen.'
    );
}


/* =========================================================
   START
========================================================= */

if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initializeProfile
    );

} else {

    initializeProfile();

}
