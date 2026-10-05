import {
    getUserAccessInfo,
    signOut
} from '../js/auth.js';

import { supabase } from '../js/supabase.js';



const elements = {
    /* =====================================================
       PROFILE
    ===================================================== */

    profileButton:
        document.getElementById('profile-button'),

    profileDropdown:
        document.getElementById('profile-dropdown'),

    profileAvatar:
        document.getElementById('profile-avatar'),

    profileName:
        document.getElementById('profile-name'),

    profileRole:
        document.getElementById('profile-role'),

    dropdownAvatar:
        document.getElementById('dropdown-avatar'),

    dropdownName:
        document.getElementById('dropdown-name'),

    dropdownDiscord:
        document.getElementById('dropdown-discord'),

    logoutButton:
        document.getElementById('logout-button'),


    /* =====================================================
       SYSTEM
    ===================================================== */

    systemDiscordId:
        document.getElementById('system-discord-id'),


    /* =====================================================
       STATISTICS
    ===================================================== */

    membersCount:
        document.getElementById('members-count'),

    medicalCount:
        document.getElementById('medical-count'),

    operationsCount:
        document.getElementById('operations-count'),

    activityCount:
        document.getElementById('activity-count')
};



/* =========================================================
   AVATAR FALLBACK
   ========================================================= */

function createAvatar(name = 'ÖRS') {

    const safeName =
        String(name || 'ÖRS')
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

    const profile =
        accessInfo?.profile;

    const user =
        accessInfo?.user;


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


    /* =====================================================
       HEADER
    ===================================================== */

    if (elements.profileName) {

        elements.profileName.textContent =
            name;
    }


    if (elements.profileRole) {

        elements.profileRole.textContent =
            'Leadership';
    }


    if (elements.profileAvatar) {

        elements.profileAvatar.src =
            avatar;


        elements.profileAvatar.onerror = () => {

            elements.profileAvatar.src =
                createAvatar(name);
        };
    }



    /* =====================================================
       DROPDOWN
    ===================================================== */

    if (elements.dropdownName) {

        elements.dropdownName.textContent =
            name;
    }


    if (elements.dropdownDiscord) {

        elements.dropdownDiscord.textContent =
            `Discord: ${discordId}`;
    }


    if (elements.dropdownAvatar) {

        elements.dropdownAvatar.src =
            avatar;


        elements.dropdownAvatar.onerror = () => {

            elements.dropdownAvatar.src =
                createAvatar(name);
        };
    }



    /* =====================================================
       SYSTEM INFORMATION
    ===================================================== */

    if (elements.systemDiscordId) {

        elements.systemDiscordId.textContent =
            discordId;
    }
}



/* =========================================================
   PROFILE DROPDOWN
   ========================================================= */

function setupProfileDropdown() {

    if (
        !elements.profileButton ||
        !elements.profileDropdown
    ) {
        return;
    }



    /* =====================================================
       ÖFFNEN / SCHLIESSEN
    ===================================================== */

    elements.profileButton.addEventListener(
        'click',
        (event) => {

            event.stopPropagation();


            const isOpen =
                elements.profileButton.getAttribute(
                    'aria-expanded'
                ) === 'true';


            elements.profileButton.setAttribute(
                'aria-expanded',
                String(!isOpen)
            );


            elements.profileDropdown.hidden =
                isOpen;
        }
    );



    /* =====================================================
       KLICK AUSSERHALB
    ===================================================== */

    document.addEventListener(
        'click',
        (event) => {

            if (
                !elements.profileDropdown.contains(
                    event.target
                ) &&
                !elements.profileButton.contains(
                    event.target
                )
            ) {

                closeProfileDropdown();
            }
        }
    );



    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(
        'keydown',
        (event) => {

            if (event.key === 'Escape') {

                closeProfileDropdown();
            }
        }
    );
}



/* =========================================================
   PROFILE DROPDOWN SCHLIESSEN
   ========================================================= */

function closeProfileDropdown() {

    if (
        !elements.profileButton ||
        !elements.profileDropdown
    ) {
        return;
    }


    elements.profileButton.setAttribute(
        'aria-expanded',
        'false'
    );


    elements.profileDropdown.hidden =
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


                window.location.href =
                    '../../index.html';


            } catch (error) {

                console.error(
                    '[ÖRS Leadership] Abmeldung fehlgeschlagen:',
                    error
                );


                elements.logoutButton.disabled =
                    false;
            }
        }
    );
}



/* =========================================================
   SUPABASE TABLE COUNT
   ========================================================= */

async function getTableCount(tableName) {

    try {

        const {
            count,
            error
        } = await supabase
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



/* =========================================================
   STATISTIKEN LADEN
   ========================================================= */

async function loadStatistics() {

    /*
     * Alle Statistiken parallel laden.
     */

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



    /* =====================================================
       MITGLIEDER
    ===================================================== */

    if (elements.membersCount) {

        elements.membersCount.textContent =
            members === null
                ? '–'
                : members;
    }



    /* =====================================================
       MEDIZIN
    ===================================================== */

    if (elements.medicalCount) {

        elements.medicalCount.textContent =
            medical === null
                ? '–'
                : medical;
    }



    /* =====================================================
       EINSÄTZE
    ===================================================== */

    if (elements.operationsCount) {

        elements.operationsCount.textContent =
            operations === null
                ? '–'
                : operations;
    }



    /* =====================================================
       AKTIVITÄT
    ===================================================== */

    if (elements.activityCount) {

        elements.activityCount.textContent =
            activity === null
                ? '–'
                : activity;
    }
}



/* =========================================================
   LEADERSHIP ZUGRIFF PRÜFEN
   ========================================================= */

async function checkLeadershipAccess() {

    try {

        console.log(
            '[ÖRS Leadership] Prüfe Benutzerzugriff...'
        );


        const accessInfo =
            await getUserAccessInfo();



        /* =================================================
           NICHT EINGELOGGT
        ================================================= */

        if (!accessInfo?.authenticated) {

            console.warn(
                '[ÖRS Leadership] Benutzer ist nicht eingeloggt.'
            );


            window.location.replace(
                '../../index.html?access=login-required'
            );


            return null;
        }



        /* =================================================
           LEADERSHIP ZUGRIFF
        ================================================= */

        if (!accessInfo.isLeadership) {

            console.warn(
                '[ÖRS Leadership] Kein Leadership-Zugriff.'
            );


            window.location.replace(
                '../../index.html?access=denied'
            );


            return null;
        }


        console.log(
            '[ÖRS Leadership] Leadership-Zugriff bestätigt.'
        );


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



/* =========================================================
   SCHNELLZUGRIFF
   ========================================================= */

function setupQuickActions() {

    const buttons =
        document.querySelectorAll(
            '.management-item'
        );


    if (!buttons.length) {
        return;
    }


    buttons.forEach((button) => {

        button.addEventListener(
            'click',
            () => {

                const section =
                    button.dataset.section;


                if (!section) {
                    return;
                }



                /* =================================================
                   MITGLIEDERVERWALTUNG
                   
                   Dieser Bereich ist jetzt aktiv.
                   ================================================= */

                if (section === 'members') {

                    window.location.href =
                        './members/';

                    return;
                }



                /* =================================================
                   ALLE ANDEREN BEREICHE
                   
                   Bleiben vorerst Platzhalter.
                   ================================================= */

                const titles = {

                    operations:
                        'Einsatzverwaltung',

                    medical:
                        'Medizin',

                    settings:
                        'Systemverwaltung'
                };


                const title =
                    titles[section] ||
                    'Bereich';


                showComingSoon(title);
            }
        );
    });
}



/* =========================================================
   COMING SOON
   ========================================================= */

function showComingSoon(title) {

    /*
     * Bereits vorhandenes Fenster entfernen.
     */

    const existing =
        document.querySelector(
            '.leadership-coming-soon'
        );


    if (existing) {
        existing.remove();
    }



    /*
     * Overlay erstellen.
     */

    const overlay =
        document.createElement('div');


    overlay.className =
        'leadership-coming-soon';


    overlay.innerHTML = `

        <div class="coming-soon-box">

            <button
                class="coming-soon-close"
                type="button"
                aria-label="Schließen"
            >

                <iconify-icon
                    icon="iconoir:xmark"
                ></iconify-icon>

            </button>


            <div class="coming-soon-icon">

                <iconify-icon
                    icon="iconoir:hammer"
                ></iconify-icon>

            </div>


            <span class="panel-kicker">
                Leadership
            </span>


            <h2>
                ${escapeHtml(title)}
            </h2>


            <p>
                Dieser Bereich wird gerade vorbereitet
                und später als eigene Unterseite verfügbar sein.
            </p>


            <button
                class="coming-soon-confirm"
                type="button"
            >
                Verstanden
            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );



    /* =====================================================
       SCHLIESSEN
    ===================================================== */

    const close = () => {

        overlay.classList.add(
            'closing'
        );


        setTimeout(() => {

            if (overlay.isConnected) {

                overlay.remove();
            }

        }, 180);
    };



    /* =====================================================
       X BUTTON
    ===================================================== */

    overlay
        .querySelector(
            '.coming-soon-close'
        )
        ?.addEventListener(
            'click',
            close
        );



    /* =====================================================
       VERSTANDEN
    ===================================================== */

    overlay
        .querySelector(
            '.coming-soon-confirm'
        )
        ?.addEventListener(
            'click',
            close
        );



    /* =====================================================
       KLICK AUSSERHALB
    ===================================================== */

    overlay.addEventListener(
        'click',
        (event) => {

            if (
                event.target === overlay
            ) {

                close();
            }
        }
    );



    /* =====================================================
       ESC
    ===================================================== */

    const escapeHandler =
        (event) => {

            if (
                event.key !== 'Escape'
            ) {
                return;
            }


            close();


            document.removeEventListener(
                'keydown',
                escapeHandler
            );
        };


    document.addEventListener(
        'keydown',
        escapeHandler
    );



    /* =====================================================
       ANIMATION STARTEN
    ===================================================== */

    requestAnimationFrame(() => {

        overlay.classList.add(
            'visible'
        );
    });
}



/* =========================================================
   HTML ESCAPING
   ========================================================= */

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





async function initializeLeadership() {

    console.log(
        '[ÖRS Leadership] Leadership-Bereich wird geladen...'
    );



  

    const accessInfo =
        await checkLeadershipAccess();




    if (!accessInfo) {
        return;
    }





    updateProfile(
        accessInfo
    );



 

    setupProfileDropdown();





    setupLogout();



   

    setupQuickActions();



 

    await loadStatistics();



    console.log(
        '[ÖRS Leadership] Initialisierung abgeschlossen.'
    );
}




if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initializeLeadership
    );

} else {

    initializeLeadership();
}
