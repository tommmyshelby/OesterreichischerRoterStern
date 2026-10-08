import {
    getUserAccessInfo,
    signOut
} from '../../js/auth.js';

import {
    supabase
} from '../../js/supabase.js';

import {
    ORS_CONFIG
} from '../../js/config.js';


/* =========================================================
   ÖRS SYSTEMVERWALTUNG
   ========================================================= */

const TABLES = [
    'profiles',
    'members',
    'access_roles',
    'operations',
    'medical_records',
    'audit_logs'
];


const elements = {

    refreshButton:
        document.getElementById('refresh-button'),

    overallStatus:
        document.getElementById('overall-status'),

    overallStatusTitle:
        document.getElementById('overall-status-title'),

    overallStatusText:
        document.getElementById('overall-status-text'),

    supabaseStatus:
        document.getElementById('supabase-status'),

    supabaseStatusDetail:
        document.getElementById('supabase-status-detail'),

    databaseStatus:
        document.getElementById('database-status'),

    databaseStatusDetail:
        document.getElementById('database-status-detail'),

    membersStatus:
        document.getElementById('members-status'),

    rolesStatus:
        document.getElementById('roles-status'),

    profilesCount:
        document.getElementById('profiles-count'),

    membersCount:
        document.getElementById('members-count'),

    accessRolesCount:
        document.getElementById('access-roles-count'),

    operationsCount:
        document.getElementById('operations-count'),

    medicalCount:
        document.getElementById('medical-count'),

    auditCount:
        document.getElementById('audit-count'),

    profilesState:
        document.getElementById('profiles-state'),

    membersState:
        document.getElementById('members-state'),

    accessRolesState:
        document.getElementById('access-roles-state'),

    operationsState:
        document.getElementById('operations-state'),

    medicalState:
        document.getElementById('medical-state'),

    auditState:
        document.getElementById('audit-state'),

    leadershipCount:
        document.getElementById('leadership-count'),

    officerCount:
        document.getElementById('officer-count'),

    medicalRoleCount:
        document.getElementById('medical-role-count'),

    configSupabaseUrl:
        document.getElementById('config-supabase-url'),

    configGuildId:
        document.getElementById('config-guild-id'),

    configClientId:
        document.getElementById('config-client-id'),

    configLeadership:
        document.getElementById('config-leadership'),

    configOfficer:
        document.getElementById('config-officer'),

    configMedical:
        document.getElementById('config-medical'),

    botGuildId:
        document.getElementById('bot-guild-id'),

    auditSummary:
        document.getElementById('audit-summary'),

    auditPanelState:
        document.getElementById('audit-panel-state'),

    lastCheck:
        document.getElementById('last-check'),

    footerStatus:
        document.getElementById('footer-status')
};


/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */

function setText(element, value) {

    if (!element) {
        return;
    }

    element.textContent =
        value ?? '–';
}


function formatNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return '–';
    }

    return Number(value).toLocaleString(
        'de-DE'
    );
}


function formatDate(date) {

    if (!date) {
        return '–';
    }

    try {

        return new Intl.DateTimeFormat(
            'de-DE',
            {
                dateStyle: 'medium',
                timeStyle: 'medium'
            }
        ).format(date);

    } catch {

        return '–';
    }
}


function setDatabaseState(
    element,
    state
) {

    if (!element) {
        return;
    }

    element.classList.remove(
        'loading',
        'success',
        'error'
    );

    element.classList.add(
        state
    );

    const labels = {
        loading: 'Prüfe',
        success: 'OK',
        error: 'Fehler'
    };

    element.textContent =
        labels[state] || '–';
}


/* =========================================================
   LEADERSHIP ZUGRIFF
   ========================================================= */

async function checkLeadershipAccess() {

    try {

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


        return accessInfo;

    } catch (error) {

        console.error(
            '[ÖRS System] Zugriff konnte nicht geprüft werden:',
            error
        );

        window.location.replace(
            '../../../index.html?access=error'
        );

        return null;
    }
}


/* =========================================================
   TABELLENCOUNT
   ========================================================= */

async function getTableCount(
    tableName
) {

    try {

        const {
            count,
            error
        } = await supabase
            .from(tableName)
            .select(
                '*',
                {
                    count: 'exact',
                    head: true
                }
            );


        if (error) {

            console.warn(
                `[ÖRS System] ${tableName}:`,
                error.message
            );

            return {
                count: null,
                error
            };
        }


        return {
            count: count ?? 0,
            error: null
        };

    } catch (error) {

        console.warn(
            `[ÖRS System] ${tableName}:`,
            error
        );

        return {
            count: null,
            error
        };
    }
}


/* =========================================================
   DATENBANK PRÜFEN
   ========================================================= */

async function loadDatabase() {

    const results =
        await Promise.all(
            TABLES.map(
                table =>
                    getTableCount(table)
            )
        );


    const data = {};


    TABLES.forEach(
        (table, index) => {

            data[table] =
                results[index];
        }
    );


    const stateElements = {
        profiles:
            elements.profilesState,

        members:
            elements.membersState,

        access_roles:
            elements.accessRolesState,

        operations:
            elements.operationsState,

        medical_records:
            elements.medicalState,

        audit_logs:
            elements.auditState
    };


    const countElements = {
        profiles:
            elements.profilesCount,

        members:
            elements.membersCount,

        access_roles:
            elements.accessRolesCount,

        operations:
            elements.operationsCount,

        medical_records:
            elements.medicalCount,

        audit_logs:
            elements.auditCount
    };


    let successCount = 0;


    for (const table of TABLES) {

        const result =
            data[table];


        if (
            result &&
            !result.error
        ) {

            successCount++;

            setDatabaseState(
                stateElements[table],
                'success'
            );

            setText(
                countElements[table],
                formatNumber(
                    result.count
                )
            );

        } else {

            setDatabaseState(
                stateElements[table],
                'error'
            );

            setText(
                countElements[table],
                '–'
            );
        }
    }


    const databaseAvailable =
        successCount > 0;


    const databaseComplete =
        successCount === TABLES.length;


    if (databaseComplete) {

        setText(
            elements.databaseStatus,
            'Verbunden'
        );

        elements.databaseStatus
            ?.classList.remove(
                'status-loading'
            );

        setText(
            elements.databaseStatusDetail,
            'Alle geprüften Tabellen erreichbar.'
        );

    } else if (databaseAvailable) {

        setText(
            elements.databaseStatus,
            'Teilweise'
        );

        elements.databaseStatus
            ?.classList.remove(
                'status-loading'
            );

        setText(
            elements.databaseStatusDetail,
            `${successCount} von ${TABLES.length} Tabellen erreichbar.`
        );

    } else {

        setText(
            elements.databaseStatus,
            'Fehler'
        );

        elements.databaseStatus
            ?.classList.remove(
                'status-loading'
            );

        setText(
            elements.databaseStatusDetail,
            'Keine geprüfte Tabelle erreichbar.'
        );
    }


    setText(
        elements.membersStatus,
        data.members?.count ?? '–'
    );


    setText(
        elements.rolesStatus,
        data.access_roles?.count ?? '–'
    );


    setText(
        elements.auditSummary,
        formatNumber(
            data.audit_logs?.count
        )
    );


    if (
        data.audit_logs &&
        !data.audit_logs.error
    ) {

        setDatabaseState(
            elements.auditPanelState,
            'success'
        );

    } else {

        setDatabaseState(
            elements.auditPanelState,
            'error'
        );
    }


    return {
        data,
        databaseComplete
    };
}


/* =========================================================
   ROLLEN ZÄHLEN
   ========================================================= */

async function loadRoles() {

    try {

        const {
            data,
            error
        } = await supabase
            .from('access_roles')
            .select(
                'discord_id, role'
            );


        if (error) {

            console.warn(
                '[ÖRS System] Rollen konnten nicht geladen werden:',
                error.message
            );

            setText(
                elements.leadershipCount,
                '–'
            );

            setText(
                elements.officerCount,
                '–'
            );

            setText(
                elements.medicalRoleCount,
                '–'
            );

            return;
        }


        const rows =
            Array.isArray(data)
                ? data
                : [];


        const leadership =
            new Set();


        const officer =
            new Set();


        const medical =
            new Set();


        /*
         * Die beiden festen Leadership-Konten
         * werden zusätzlich berücksichtigt.
         */

        const configuredLeadership =
            ORS_CONFIG?.access
                ?.leadershipUsers || [];


        configuredLeadership.forEach(
            id => leadership.add(
                String(id)
            )
        );


        rows.forEach(
            row => {

                const discordId =
                    String(
                        row?.discord_id ?? ''
                    );

                const role =
                    String(
                        row?.role ?? ''
                    )
                    .trim()
                    .toLowerCase();


                if (!discordId) {
                    return;
                }


                if (
                    role === 'leadership' ||
                    role === 'leitung'
                ) {

                    leadership.add(
                        discordId
                    );
                }


                if (
                    role === 'officer' ||
                    role === 'offizier'
                ) {

                    officer.add(
                        discordId
                    );
                }


                if (
                    role === 'medical' ||
                    role === 'medizin' ||
                    role === 'medic'
                ) {

                    medical.add(
                        discordId
                    );
                }
            }
        );


        setText(
            elements.leadershipCount,
            leadership.size
        );


        setText(
            elements.officerCount,
            officer.size
        );


        setText(
            elements.medicalRoleCount,
            medical.size
        );

    } catch (error) {

        console.error(
            '[ÖRS System] Rollenfehler:',
            error
        );
    }
}


/* =========================================================
   KONFIGURATION
   ========================================================= */

function loadConfiguration() {

    const supabaseUrl =
        ORS_CONFIG?.supabase?.url ||
        'Nicht konfiguriert';


    const guildId =
        ORS_CONFIG?.discord?.guildId ||
        'Nicht konfiguriert';


    const clientId =
        ORS_CONFIG?.discord?.clientId ||
        'Nicht konfiguriert';


    const leadership =
        ORS_CONFIG?.access
            ?.leadershipUsers || [];


    const officer =
        ORS_CONFIG?.access
            ?.officerRoles || [];


    const medical =
        ORS_CONFIG?.access
            ?.medicalRoles || [];


    setText(
        elements.configSupabaseUrl,
        supabaseUrl
    );


    setText(
        elements.configGuildId,
        guildId
    );


    setText(
        elements.configClientId,
        clientId
    );


    setText(
        elements.configLeadership,
        leadership.length
            ? leadership.join(' · ')
            : 'Keine'
    );


    setText(
        elements.configOfficer,
        officer.length
            ? officer.join(' · ')
            : 'Keine'
    );


    setText(
        elements.configMedical,
        medical.length
            ? medical.join(' · ')
            : 'Keine'
    );


    setText(
        elements.botGuildId,
        guildId
    );
}


/* =========================================================
   GESAMTSTATUS
   ========================================================= */

function updateOverallStatus(
    databaseComplete
) {

    if (
        databaseComplete
    ) {

        elements.overallStatus
            ?.setAttribute(
                'data-state',
                'success'
            );

        setText(
            elements.overallStatusTitle,
            'System betriebsbereit'
        );

        setText(
            elements.overallStatusText,
            'Datenbank und Systemdaten erfolgreich geprüft.'
        );

        setText(
            elements.footerStatus,
            'Systemprüfung erfolgreich abgeschlossen.'
        );

    } else {

        elements.overallStatus
            ?.setAttribute(
                'data-state',
                'error'
            );

        setText(
            elements.overallStatusTitle,
            'Systemprüfung mit Einschränkungen'
        );

        setText(
            elements.overallStatusText,
            'Mindestens ein Datenbankbereich konnte nicht geprüft werden.'
        );

        setText(
            elements.footerStatus,
            'Systemprüfung mit Einschränkungen abgeschlossen.'
        );
    }
}


/* =========================================================
   SYSTEM LADEN
   ========================================================= */

async function loadSystem() {

    const started =
        performance.now();


    elements.refreshButton
        ?.classList.add(
            'loading'
        );


    setText(
        elements.overallStatusTitle,
        'System wird geprüft'
    );


    setText(
        elements.overallStatusText,
        'Verbindung und Daten werden geladen.'
    );


    elements.overallStatus
        ?.setAttribute(
            'data-state',
            'loading'
        );


    try {

        loadConfiguration();


        const database =
            await loadDatabase();


        await loadRoles();


        const finished =
            performance.now();


        const seconds =
            (
                finished - started
            ) / 1000;


        setText(
            elements.lastCheck,
            `${formatDate(new Date())} · ${seconds.toFixed(2)} s`
        );


        updateOverallStatus(
            Boolean(
                database?.databaseComplete
            )
        );

    } catch (error) {

        console.error(
            '[ÖRS System] Laden fehlgeschlagen:',
            error
        );


        elements.overallStatus
            ?.setAttribute(
                'data-state',
                'error'
            );


        setText(
            elements.overallStatusTitle,
            'Systemprüfung fehlgeschlagen'
        );


        setText(
            elements.overallStatusText,
            'Beim Laden der Systemdaten ist ein Fehler aufgetreten.'
        );


        setText(
            elements.footerStatus,
            'Systemprüfung fehlgeschlagen.'
        );

    } finally {

        elements.refreshButton
            ?.classList.remove(
                'loading'
            );
    }
}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefresh() {

    if (
        !elements.refreshButton
    ) {
        return;
    }


    elements.refreshButton
        .addEventListener(
            'click',
            async () => {

                await loadSystem();
            }
        );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogoutShortcut() {

    /*
     * Die Systemseite besitzt bewusst keinen
     * eigenen Logout-Button.
     *
     * Abmeldung erfolgt weiterhin über
     * das Leadership-Dashboard.
     */
}


/* =========================================================
   INITIALISIERUNG
   ========================================================= */

async function initialize() {

    console.log(
        '[ÖRS System] Systemverwaltung wird geladen...'
    );


    const access =
        await checkLeadershipAccess();


    if (!access) {
        return;
    }


    setupRefresh();


    setupLogoutShortcut();


    await loadSystem();


    console.log(
        '[ÖRS System] Systemverwaltung geladen.'
    );
}


if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initialize
    );

} else {

    initialize();
}
