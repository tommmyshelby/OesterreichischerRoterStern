import {
    signOut,
    getDisplayName,
    getDiscordId,
    getAvatarUrl,
    getAccessLevel
} from './auth.js';

import {
    loadPermissions,
    getPermissions,
    canAccessLeadership,
    canAccessOfficer,
    canAccessMedical
} from './permissions.js';


const elements = {

    name:
        document.querySelector('[data-user-name]'),

    discordId:
        document.querySelector('[data-user-discord-id]'),

    access:
        document.querySelector('[data-user-access]'),

    avatar:
        document.querySelector('[data-user-avatar]'),

    logout:
        document.querySelector('[data-action="logout"]'),

    nav:
        document.querySelector('[data-dashboard-nav]')
};


function setText(element, value) {

    if (element) {
        element.textContent = value;
    }
}


function setupUser() {

    const access =
        getPermissions();

    if (!access?.user) {
        return;
    }


    setText(
        elements.name,
        getDisplayName(
            access.user,
            access.profile
        )
    );


    setText(
        elements.discordId,
        getDiscordId(
            access.user,
            access.profile
        )
    );


    setText(
        elements.access,
        getAccessLevel(access)
    );


    const avatar =
        getAvatarUrl(
            access.user,
            access.profile
        );


    if (
        avatar &&
        elements.avatar
    ) {

        elements.avatar.src =
            avatar;
    }
}


function setupNavigation() {

    if (!elements.nav) {
        return;
    }


    elements.nav
        .querySelectorAll('[data-permission]')
        .forEach(item => {

            const permission =
                item.dataset.permission;

            let allowed = false;


            switch (permission) {

                case 'officer':
                    allowed =
                        canAccessOfficer();
                    break;

                case 'medical':
                    allowed =
                        canAccessMedical();
                    break;

                case 'leadership':
                    allowed =
                        canAccessLeadership();
                    break;

                default:
                    allowed = true;
            }


            if (!allowed) {

                item.remove();
            }
        });
}


function setupLogout() {

    if (!elements.logout) {
        return;
    }


    elements.logout.addEventListener(
        'click',
        async () => {

            try {

                await signOut();

                window.location.href =
                    '../../index.html';

            } catch (err) {

                console.error(
                    '[ÖRS] Logout:',
                    err
                );
            }
        }
    );
}


async function initialize() {

    const allowed =
        await loadPermissions();


    if (!allowed?.user) {

        window.location.href =
            '../../index.html';

        return;
    }


    if (!allowed.hasAccess) {

        window.location.href =
            '../../index.html';

        return;
    }


    setupUser();
    setupNavigation();
    setupLogout();
}


if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initialize,
        { once: true }
    );

} else {

    initialize();
}
