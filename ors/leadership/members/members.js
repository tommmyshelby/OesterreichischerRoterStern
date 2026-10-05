import {
    getUserAccessInfo,
    signOut
} from '../../js/auth.js';

import {
    supabase
} from '../../js/supabase.js';




const LEADERSHIP_USERS = new Set([
    '881206091009122406',
    '1204084190014865439'
]);




const elements = {

    logoutButton:
        document.getElementById(
            'logout-button'
        ),

    search:
        document.getElementById(
            'member-search'
        ),

    filter:
        document.getElementById(
            'member-filter'
        ),

    list:
        document.getElementById(
            'members-list'
        ),

    loading:
        document.getElementById(
            'members-loading'
        ),

    error:
        document.getElementById(
            'members-error'
        ),

    errorText:
        document.getElementById(
            'members-error-text'
        ),

    empty:
        document.getElementById(
            'members-empty'
        ),

    visibleCount:
        document.getElementById(
            'visible-count'
        ),

    totalMembers:
        document.getElementById(
            'total-members'
        ),

    leadershipMembers:
        document.getElementById(
            'leadership-members'
        ),

    officerMembers:
        document.getElementById(
            'officer-members'
        ),

    medicalMembers:
        document.getElementById(
            'medical-members'
        ),

    modal:
        document.getElementById(
            'member-modal'
        ),

    modalClose:
        document.getElementById(
            'modal-close'
        ),

    modalBackdrop:
        document.querySelector(
            '.modal-backdrop'
        ),

    modalAvatar:
        document.getElementById(
            'modal-avatar'
        ),

    modalStatusDot:
        document.getElementById(
            'modal-status-dot'
        ),

    modalAccess:
        document.getElementById(
            'modal-access'
        ),

    modalName:
        document.getElementById(
            'modal-name'
        ),

    modalUsername:
        document.getElementById(
            'modal-username'
        ),

    modalDiscordId:
        document.getElementById(
            'modal-discord-id'
        ),

    modalDiscordName:
        document.getElementById(
            'modal-discord-name'
        ),

    modalRole:
        document.getElementById(
            'modal-role'
        ),

    modalStatus:
        document.getElementById(
            'modal-member-status'
        ),

    notifications:
        document.getElementById(
            'notification-container'
        )

};



let currentUser = null;

let members = [];

let filteredMembers = [];




function log(...args) {

    console.log(
        '[ÖRS Members]',
        ...args
    );

}


function error(...args) {

    console.error(
        '[ÖRS Members]',
        ...args
    );

}



function createAvatar(
    name = 'ÖRS'
) {

    const safeName =
        String(name || 'ÖRS')
            .trim()
            .slice(0, 2)
            .toUpperCase();

    return (
        'https://ui-avatars.com/api/' +
        `?name=${encodeURIComponent(safeName)}` +
        '&background=171b23' +
        '&color=f2f4f7' +
        '&bold=true'
    );

}



function escapeHtml(value) {

    return String(value ?? '')
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



function getAccessLevel(
    member
) {

    if (
        member.isLeadership
    ) {

        return 'leadership';

    }

    if (
        member.isOfficer
    ) {

        return 'officer';

    }

    if (
        member.isMedical
    ) {

        return 'medical';

    }

    return 'member';

}



function getAccessLabel(
    member
) {

    if (
        member.isLeadership
    ) {

        return 'Leadership';

    }

    if (
        member.isOfficer
    ) {

        return 'Officer';

    }

    if (
        member.isMedical
    ) {

        return 'Medical';

    }

    return 'ÖRS Mitglied';

}




function getProfileName(
    profile,
    row
) {

    return (
        profile?.display_name ||
        profile?.username ||
        row?.display_name ||
        row?.name ||
        row?.username ||
        row?.discord_name ||
        'ÖRS Mitglied'
    );

}



function getUsername(
    profile,
    row
) {

    const username =
        profile?.username ||
        row?.username ||
        row?.discord_username ||
        row?.discord_name ||
        'Nicht verfügbar';

    return username.startsWith('@')
        ? username
        : `@${username}`;

}




function getDiscordId(
    profile,
    row
) {

    return (
        profile?.discord_id ||
        row?.discord_id ||
        row?.discord_user_id ||
        row?.discordId ||
        'Nicht verfügbar'
    );

}




function getAvatar(
    profile,
    row,
    name
) {

    return (
        profile?.avatar_url ||
        row?.avatar_url ||
        row?.avatar ||
        row?.discord_avatar ||
        createAvatar(name)
    );

}


/* =========================================================
   STATUS
   ========================================================= */

function getMemberStatus(
    row
) {

    if (
        row?.active === false ||
        row?.is_active === false ||
        row?.status === 'inactive' ||
        row?.status === 'disabled'
    ) {

        return {
            label: 'Inaktiv',
            active: false
        };

    }

    if (
        row?.status
    ) {

        return {
            label:
                formatStatus(
                    row.status
                ),
            active:
                row.status === 'active'
        };

    }

    return {
        label: 'Aktiv',
        active: true
    };

}


/* =========================================================
   STATUS FORMAT
   ========================================================= */

function formatStatus(
    status
) {

    const values = {

        active:
            'Aktiv',

        inactive:
            'Inaktiv',

        disabled:
            'Deaktiviert',

        pending:
            'Ausstehend',

        suspended:
            'Gesperrt'

    };

    return (
        values[
            String(status)
                .toLowerCase()
        ] ||
        String(status)
    );

}


/* =========================================================
   PROFILES LADEN
   ========================================================= */

async function loadProfiles() {

    const {
        data,
        error: profileError
    } = await supabase
        .from('profiles')
        .select(`
            id,
            discord_id,
            username,
            display_name,
            avatar_url,
            last_login,
            updated_at
        `);

    if (profileError) {

        console.warn(
            '[ÖRS Members] Profile konnten nicht geladen werden:',
            profileError.message
        );

        return [];

    }

    return data || [];

}


/* =========================================================
   ACCESS ROLES LADEN
   ========================================================= */

async function loadAccessRoles() {

    /*
     * WICHTIG:
     * Die alte Version verwendete "user_roles".
     *
     * Diese Tabelle existiert in unserem aktuellen
     * ÖRS-Schema nicht.
     *
     * Die tatsächlichen Rollen stehen in:
     *
     * public.access_roles
     *
     * Spalten:
     * id
     * discord_id
     * role
     * role_id
     * created_at
     */

    const {
        data,
        error: roleError
    } = await supabase
        .from('access_roles')
        .select(`
            id,
            discord_id,
            role,
            role_id,
            created_at
        `);

    if (roleError) {

        console.warn(
            '[ÖRS Members] Access-Rollen konnten nicht geladen werden:',
            roleError.message
        );

        return [];

    }

    return data || [];

}


/* =========================================================
   MEMBERS LADEN
   ========================================================= */

async function loadMemberRows() {

    const {
        data,
        error: memberError
    } = await supabase
        .from('members')
        .select(`
            id,
            discord_id,
            username,
            display_name,
            rank,
            department,
            joined_at,
            active,
            created_at,
            updated_at
        `);

    if (memberError) {

        console.warn(
            '[ÖRS Members] Members-Tabelle konnte nicht geladen werden:',
            memberError.message
        );

        return [];

    }

    return data || [];

}


/* =========================================================
   ROLE MAP
   ========================================================= */

function buildRoleMap(
    accessRoles
) {

    const roleMap = new Map();

    for (
        const roleRow of accessRoles
    ) {

        if (
            !roleRow?.discord_id
        ) {

            continue;

        }

        const discordId =
            String(
                roleRow.discord_id
            );

        const role =
            String(
                roleRow.role || ''
            )
                .trim()
                .toLowerCase();

        if (
            !role
        ) {

            continue;

        }

        if (
            !roleMap.has(
                discordId
            )
        ) {

            roleMap.set(
                discordId,
                new Set()
            );

        }

        roleMap
            .get(discordId)
            .add(role);

    }

    return roleMap;

}


/* =========================================================
   NORMALIZE MEMBERS
   ========================================================= */

function normalizeMembers(
    rows,
    profiles,
    accessRoles
) {

    const profileByDiscord =
        new Map();

    profiles.forEach(
        profile => {

            if (
                !profile?.discord_id
            ) {

                return;

            }

            profileByDiscord.set(
                String(
                    profile.discord_id
                ),
                profile
            );

        }
    );


    const roleMap =
        buildRoleMap(
            accessRoles
        );


    /*
     * Die Members-Tabelle ist die Hauptquelle.
     *
     * Falls dort aus irgendeinem Grund keine
     * Daten vorhanden sind, verwenden wir die
     * Profile als Fallback.
     */

    const sourceRows =
        rows.length
            ? rows
            : profiles;


    return sourceRows.map(
        (
            row,
            index
        ) => {

            const discordId =
                String(
                    row?.discord_id ||
                    row?.discord_user_id ||
                    row?.discordId ||
                    ''
                );


            const profile =
                profileByDiscord.get(
                    discordId
                ) ||
                (
                    row?.discord_id
                        ? null
                        : row
                );


            const profileDiscordId =
                String(
                    profile?.discord_id ||
                    discordId ||
                    ''
                );


            const roles =
                roleMap.get(
                    profileDiscordId
                ) ||
                new Set();


            /*
             * Leadership wird zusätzlich direkt
             * über die fest definierten Discord IDs
             * erkannt.
             *
             * Damit bleibt die Berechtigung korrekt,
             * selbst wenn der Role-Datensatz gerade
             * noch nicht geladen wurde.
             */

            const isLeadership =
                LEADERSHIP_USERS.has(
                    profileDiscordId
                ) ||
                roles.has(
                    'leadership'
                ) ||
                roles.has(
                    'leitung'
                );


            const isOfficer =
                !isLeadership &&
                (
                    roles.has(
                        'officer'
                    ) ||
                    roles.has(
                        'offizier'
                    )
                );


            const isMedical =
                !isLeadership &&
                !isOfficer &&
                (
                    roles.has(
                        'medical'
                    ) ||
                    roles.has(
                        'medizin'
                    ) ||
                    roles.has(
                        'medic'
                    )
                );


            const name =
                getProfileName(
                    profile,
                    row
                );


            const status =
                getMemberStatus(
                    row
                );


            const member = {

                id:
                    row?.id ||
                    profile?.id ||
                    `member-${index}`,

                profileId:
                    profile?.id ||
                    null,

                discordId:
                    profileDiscordId ||
                    'Nicht verfügbar',

                name,

                username:
                    getUsername(
                        profile,
                        row
                    ),

                avatar:
                    getAvatar(
                        profile,
                        row,
                        name
                    ),

                isLeadership,

                isOfficer,

                isMedical,

                accessLevel:
                    getAccessLevel({
                        isLeadership,
                        isOfficer,
                        isMedical
                    }),

                accessLabel:
                    getAccessLabel({
                        isLeadership,
                        isOfficer,
                        isMedical
                    }),

                status:
                    status.label,

                active:
                    status.active,

                rank:
                    row?.rank ||
                    null,

                department:
                    row?.department ||
                    null,

                joinedAt:
                    row?.joined_at ||
                    null,

                raw:
                    row,

                profile

            };


            return member;

        }
    );

}


/* =========================================================
   LOAD MEMBERS
   ========================================================= */

async function loadMembers() {

    showLoading();

    try {

        const [
            rows,
            profiles,
            accessRoles
        ] = await Promise.all([

            loadMemberRows(),

            loadProfiles(),

            loadAccessRoles()

        ]);


        members =
            normalizeMembers(
                rows,
                profiles,
                accessRoles
            );


        /*
         * Nach Namen sortieren.
         */

        members.sort(
            (
                a,
                b
            ) =>
                a.name.localeCompare(
                    b.name,
                    'de',
                    {
                        sensitivity:
                            'base'
                    }
                )
        );


        updateStatistics();

        applyFilters();

        hideLoading();


        log(
            `${members.length} Mitglieder geladen.`
        );


        /*
         * Debug-Ausgabe.
         *
         * Damit kannst du in der
         * Browser-Konsole direkt sehen,
         * welche Rolle erkannt wurde.
         */

        members.forEach(
            member => {

                log(
                    `${member.name} (${member.discordId}) → ${member.accessLabel}`
                );

            }
        );

    } catch (err) {

        error(
            'Mitglieder konnten nicht geladen werden:',
            err
        );

        showError(
            err?.message ||
            'Unbekannter Fehler beim Laden der Mitglieder.'
        );

    }

}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    if (
        elements.totalMembers
    ) {

        elements.totalMembers.textContent =
            members.length;

    }


    if (
        elements.leadershipMembers
    ) {

        elements.leadershipMembers.textContent =
            members.filter(
                member =>
                    member.isLeadership
            ).length;

    }


    if (
        elements.officerMembers
    ) {

        elements.officerMembers.textContent =
            members.filter(
                member =>
                    member.isOfficer
            ).length;

    }


    if (
        elements.medicalMembers
    ) {

        elements.medicalMembers.textContent =
            members.filter(
                member =>
                    member.isMedical
            ).length;

    }

}


/* =========================================================
   FILTER
   ========================================================= */

function applyFilters() {

    const search =
        String(
            elements.search?.value ||
            ''
        )
            .trim()
            .toLowerCase();


    const filter =
        elements.filter?.value ||
        'all';


    filteredMembers =
        members.filter(
            member => {

                const matchesSearch =
                    !search ||
                    member.name
                        .toLowerCase()
                        .includes(search) ||
                    member.username
                        .toLowerCase()
                        .includes(search) ||
                    String(
                        member.discordId
                    )
                        .toLowerCase()
                        .includes(search);


                if (
                    !matchesSearch
                ) {

                    return false;

                }


                if (
                    filter === 'all'
                ) {

                    return true;

                }


                return (
                    member.accessLevel ===
                    filter
                );

            }
        );


    renderMembers();

}


/* =========================================================
   RENDER
   ========================================================= */

function renderMembers() {

    if (
        !elements.list
    ) {

        return;

    }


    elements.list.innerHTML =
        '';


    if (
        elements.visibleCount
    ) {

        elements.visibleCount.textContent =
            filteredMembers.length;

    }


    if (
        !filteredMembers.length
    ) {

        elements.empty?.classList.remove(
            'hidden'
        );

        return;

    }


    elements.empty?.classList.add(
        'hidden'
    );


    filteredMembers.forEach(
        member => {

            elements.list.appendChild(
                createMemberRow(
                    member
                )
            );

        }
    );

}


/* =========================================================
   MEMBER ROW
   ========================================================= */

function createMemberRow(
    member
) {

    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.className =
        'member-row';


    const statusClass =
        member.active
            ? 'active'
            : 'inactive';


    button.innerHTML = `

        <div class="member-identity">

            <img
                class="member-avatar"
                src="${escapeHtml(member.avatar)}"
                alt="${escapeHtml(member.name)}"
                loading="lazy"
            >

            <div class="member-identity-text">

                <strong class="member-name">
                    ${escapeHtml(member.name)}
                </strong>

                <span class="member-username">
                    ${escapeHtml(member.username)}
                </span>

            </div>

        </div>


        <span
            class="member-access ${escapeHtml(member.accessLevel)}"
        >
            ${escapeHtml(member.accessLabel)}
        </span>


        <span
            class="member-status ${statusClass}"
        >

            <span class="member-status-dot"></span>

            ${escapeHtml(member.status)}

        </span>


        <span class="member-arrow">

            <iconify-icon
                icon="iconoir:arrow-right"
            ></iconify-icon>

        </span>

    `;


    const image =
        button.querySelector(
            '.member-avatar'
        );


    if (
        image
    ) {

        image.addEventListener(
            'error',
            () => {

                image.src =
                    createAvatar(
                        member.name
                    );

            }
        );

    }


    button.addEventListener(
        'click',
        () => {

            openMemberModal(
                member
            );

        }
    );


    return button;

}


/* =========================================================
   MODAL
   ========================================================= */

function openMemberModal(
    member
) {

    if (
        !elements.modal
    ) {

        return;

    }


    if (
        elements.modalAvatar
    ) {

        elements.modalAvatar.src =
            member.avatar;

        elements.modalAvatar.onerror =
            () => {

                elements.modalAvatar.src =
                    createAvatar(
                        member.name
                    );

            };

    }


    if (
        elements.modalStatusDot
    ) {

        elements.modalStatusDot.style.background =
            member.active
                ? 'var(--green)'
                : 'var(--text-muted)';

    }


    if (
        elements.modalAccess
    ) {

        elements.modalAccess.textContent =
            member.accessLabel;

    }


    if (
        elements.modalName
    ) {

        elements.modalName.textContent =
            member.name;

    }


    if (
        elements.modalUsername
    ) {

        elements.modalUsername.textContent =
            member.username;

    }


    if (
        elements.modalDiscordId
    ) {

        elements.modalDiscordId.textContent =
            member.discordId;

    }


    if (
        elements.modalDiscordName
    ) {

        elements.modalDiscordName.textContent =
            member.username;

    }


    if (
        elements.modalRole
    ) {

        elements.modalRole.textContent =
            member.accessLabel;

    }


    if (
        elements.modalStatus
    ) {

        elements.modalStatus.textContent =
            member.status;

    }


    elements.modal.classList.remove(
        'hidden'
    );


    document.body.style.overflow =
        'hidden';

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeMemberModal() {

    if (
        !elements.modal
    ) {

        return;

    }


    elements.modal.classList.add(
        'hidden'
    );


    document.body.style.overflow =
        '';

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading() {

    elements.loading?.classList.remove(
        'hidden'
    );

    elements.error?.classList.add(
        'hidden'
    );

    elements.empty?.classList.add(
        'hidden'
    );

    elements.list?.classList.add(
        'hidden'
    );

}


function hideLoading() {

    elements.loading?.classList.add(
        'hidden'
    );

    elements.error?.classList.add(
        'hidden'
    );

    elements.list?.classList.remove(
        'hidden'
    );

}


/* =========================================================
   ERROR
   ========================================================= */

function showError(
    message
) {

    elements.loading?.classList.add(
        'hidden'
    );

    elements.list?.classList.add(
        'hidden'
    );

    elements.empty?.classList.add(
        'hidden'
    );

    elements.error?.classList.remove(
        'hidden'
    );


    if (
        elements.errorText
    ) {

        elements.errorText.textContent =
            message;

    }

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification(
    message,
    type = 'info'
) {

    if (
        !elements.notifications
    ) {

        return;

    }


    const notification =
        document.createElement(
            'div'
        );


    notification.className =
        'notification';


    const icon =
        type === 'error'
            ? 'iconoir:warning-triangle'
            : type === 'success'
                ? 'iconoir:check'
                : 'iconoir:info-circle';


    notification.innerHTML = `

        <div class="notification-icon">

            <iconify-icon
                icon="${icon}"
            ></iconify-icon>

        </div>

        <span>
            ${escapeHtml(message)}
        </span>

    `;


    elements.notifications.appendChild(
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
                180
            );

        },
        3500
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    if (
        !elements.logoutButton
    ) {

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
                    '../../../index.html';


            } catch (err) {

                error(
                    'Logout fehlgeschlagen:',
                    err
                );


                elements.logoutButton.disabled =
                    false;


                showNotification(
                    'Abmeldung fehlgeschlagen.',
                    'error'
                );

            }

        }
    );

}


/* =========================================================
   FILTER EVENTS
   ========================================================= */

function setupFilters() {

    elements.search?.addEventListener(
        'input',
        applyFilters
    );


    elements.filter?.addEventListener(
        'change',
        applyFilters
    );

}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModal() {

    elements.modalClose?.addEventListener(
        'click',
        closeMemberModal
    );


    elements.modalBackdrop?.addEventListener(
        'click',
        closeMemberModal
    );


    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key === 'Escape'
            ) {

                closeMemberModal();

            }

        }
    );

}


/* =========================================================
   ACCESS CHECK
   ========================================================= */

async function checkLeadershipAccess() {

    try {

        log(
            'Prüfe Leadership-Zugriff...'
        );


        const accessInfo =
            await getUserAccessInfo();


        if (
            !accessInfo?.authenticated
        ) {

            window.location.replace(
                '../../../index.html?access=login-required'
            );

            return null;

        }


        if (
            !accessInfo.isLeadership
        ) {

            window.location.replace(
                '../../../index.html?access=denied'
            );

            return null;

        }


        currentUser =
            accessInfo.user;


        log(
            'Leadership-Zugriff bestätigt.'
        );


        return accessInfo;


    } catch (err) {

        error(
            'Zugriff konnte nicht geprüft werden:',
            err
        );


        window.location.replace(
            '../../../index.html?access=error'
        );


        return null;

    }

}



async function initializeMembers() {

    log(
        'Mitgliederverwaltung wird geladen...'
    );


    const accessInfo =
        await checkLeadershipAccess();


    if (
        !accessInfo
    ) {

        return;

    }


    setupLogout();

    setupFilters();

    setupModal();

    await loadMembers();


    log(
        'Mitgliederverwaltung initialisiert.'
    );

}




if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initializeMembers
    );

} else {

    initializeMembers();

}
