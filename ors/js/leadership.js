import {
    getUserAccessInfo,
    signOut
} from '../js/auth.js';

import { supabase } from '../js/supabase.js';




const elements = {
    profileButton: document.getElementById('profile-button'),
    profileDropdown: document.getElementById('profile-dropdown'),

    profileAvatar: document.getElementById('profile-avatar'),
    profileName: document.getElementById('profile-name'),
    profileRole: document.getElementById('profile-role'),

    dropdownAvatar: document.getElementById('dropdown-avatar'),
    dropdownName: document.getElementById('dropdown-name'),
    dropdownDiscord: document.getElementById('dropdown-discord'),

    logoutButton: document.getElementById('logout-button'),

    systemDiscordId: document.getElementById('system-discord-id'),

    membersCount: document.getElementById('members-count'),
    medicalCount: document.getElementById('medical-count'),
    operationsCount: document.getElementById('operations-count'),
    activityCount: document.getElementById('activity-count')
};



function createAvatar(name = 'ÖRS') {
    const safeName = String(name || 'ÖRS')
        .trim()
        .slice(0, 2)
        .toUpperCase();

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        safeName
    )}&background=171b23&color=f2f4f7&bold=true`;
}


/* =========================================================
   PROFILE
   ========================================================= */

function updateProfile(accessInfo) {

    const profile = accessInfo?.profile;
    const user = accessInfo?.user;

    const name =
        profile?.display_name ||
        profile?.username ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        'Leadership';

    const discordId =
        profile?.discord_id ||
        user?.user_metadata?.provider_id ||
        user?.user_metadata?.sub ||
        'Nicht verfügbar';

    const avatar =
        profile?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        createAvatar(name);


    if (elements.profileName) {
        elements.profileName.textContent = name;
    }

    if (elements.profileRole) {
        elements.profileRole.textContent = 'Leadership';
    }

    if (elements.profileAvatar) {
        elements.profileAvatar.src = avatar;
        elements.profileAvatar.onerror = () => {
            elements.profileAvatar.src = createAvatar(name);
        };
    }


    if (elements.dropdownName) {
        elements.dropdownName.textContent = name;
    }

    if (elements.dropdownDiscord) {
        elements.dropdownDiscord.textContent =
            `Discord: ${discordId}`;
    }

    if (elements.dropdownAvatar) {
        elements.dropdownAvatar.src = avatar;

        elements.dropdownAvatar.onerror = () => {
            elements.dropdownAvatar.src = createAvatar(name);
        };
    }


    if (elements.systemDiscordId) {
        elements.systemDiscordId.textContent = discordId;
    }
}




function setupProfileDropdown() {

    if (!elements.profileButton || !elements.profileDropdown) {
        return;
    }


    elements.profileButton.addEventListener('click', (event) => {

        event.stopPropagation();

        const isOpen =
            elements.profileButton.getAttribute(
                'aria-expanded'
            ) === 'true';

        elements.profileButton.setAttribute(
            'aria-expanded',
            String(!isOpen)
        );

        elements.profileDropdown.hidden = isOpen;
    });


    document.addEventListener('click', (event) => {

        if (
            !elements.profileDropdown.contains(event.target) &&
            !elements.profileButton.contains(event.target)
        ) {
            closeProfileDropdown();
        }
    });


    document.addEventListener('keydown', (event) => {

        if (event.key === 'Escape') {
            closeProfileDropdown();
        }
    });
}


function closeProfileDropdown() {

    if (!elements.profileButton || !elements.profileDropdown) {
        return;
    }

    elements.profileButton.setAttribute(
        'aria-expanded',
        'false'
    );

    elements.profileDropdown.hidden = true;
}


function setupLogout() {

    if (!elements.logoutButton) {
        return;
    }


    elements.logoutButton.addEventListener('click', async () => {

        elements.logoutButton.disabled = true;

        try {

            await signOut();

            window.location.href = '../../index.html';

        } catch (error) {

            console.error(
                '[ÖRS Leadership] Abmeldung fehlgeschlagen:',
                error
            );

            elements.logoutButton.disabled = false;
        }
    });
}




async function getTableCount(tableName) {

    try {

        const { count, error } = await supabase
            .from(tableName)
            .select('*', {
                count: 'exact',
                head: true
            });


        if (error) {

            console.warn(
                `[ÖRS Leadership] ${tableName} konnte nicht geladen werden:`,
                error.message
            );

            return null;
        }

        return count ?? 0;

    } catch (error) {

        console.warn(
            `[ÖRS Leadership] Fehler bei ${tableName}:`,
            error
        );

        return null;
    }
}




async function loadStatistics() {

    const [
        members,
        medical,
        operations,
        activity
    ] = await Promise.all([

        getTableCount('members'),

        getTableCount('medical_records'),

        getTableCount('operations'),

        getTableCount('audit_logs')
    ]);


    if (elements.membersCount) {
        elements.membersCount.textContent =
            members === null ? '–' : members;
    }


    if (elements.medicalCount) {
        elements.medicalCount.textContent =
            medical === null ? '–' : medical;
    }


    if (elements.operationsCount) {
        elements.operationsCount.textContent =
            operations === null ? '–' : operations;
    }


    if (elements.activityCount) {
        elements.activityCount.textContent =
            activity === null ? '–' : activity;
    }
}


async function checkLeadershipAccess() {

    try {

        const accessInfo = await getUserAccessInfo();


        /*
         * Nicht eingeloggt
         */
        if (!accessInfo?.authenticated) {

            window.location.replace(
                '../../index.html?access=login-required'
            );

            return null;
        }


     
        if (!accessInfo.isLeadership) {

            window.location.replace(
                '../../index.html?access=denied'
            );

            return null;
        }


        return accessInfo;

    } catch (error) {

        console.error(
            '[ÖRS Leadership] Zugriff konnte nicht geprüft werden:',
            error
        );

        window.location.replace(
            '../../index.html?access=error'
        );

        return null;
    }
}



function setupQuickActions() {

    const buttons = document.querySelectorAll(
        '.management-item'
    );


    buttons.forEach((button) => {

        button.addEventListener('click', () => {

       

            button.classList.add('loading');

            setTimeout(() => {
                button.classList.remove('loading');
            }, 250);

        });
    });
}




async function initializeLeadership() {

    console.log(
        '[ÖRS Leadership] Leadership-Bereich wird geladen...'
    );


    const accessInfo =
        await checkLeadershipAccess();


    if (!accessInfo) {
        return;
    }


    updateProfile(accessInfo);

    setupProfileDropdown();

    setupLogout();

    setupQuickActions();

    await loadStatistics();


    console.log(
        '[ÖRS Leadership] Zugriff bestätigt.'
    );
}




document.addEventListener(
    'DOMContentLoaded',
    initializeLeadership
);
