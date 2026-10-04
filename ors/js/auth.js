import {
    supabase,
    getSession,
    getCurrentUser
} from './supabase.js';

import {
    ORS_CONFIG
} from './config.js';


function log(...args) {
    console.log('[ÖRS Auth]', ...args);
}


function error(...args) {
    console.error('[ÖRS Auth]', ...args);
}


/* =========================================================
   DISCORD LOGIN
========================================================= */

export async function signInWithDiscord() {

    try {

        const {
            error: loginError
        } = await supabase.auth.signInWithOAuth({

            provider: 'discord',

            options: {

                redirectTo:
                    ORS_CONFIG.website.url,

                scopes:
                    'identify'
            }
        });


        if (loginError) {
            throw loginError;
        }

    } catch (err) {

        error(
            'Discord Login fehlgeschlagen:',
            err
        );

        throw err;
    }
}


/* =========================================================
   LOGOUT
========================================================= */

export async function signOut() {

    try {

        const {
            error: logoutError
        } = await supabase.auth.signOut();

        if (logoutError) {
            throw logoutError;
        }

    } catch (err) {

        error(
            'Logout fehlgeschlagen:',
            err
        );

        throw err;
    }
}


/* =========================================================
   USER
========================================================= */

export async function getAuthenticatedUser() {

    return await getCurrentUser();
}


export async function getAuthenticatedSession() {

    return await getSession();
}


/* =========================================================
   PROFILE
========================================================= */

export async function getProfile(userId) {

    if (!userId) {
        return null;
    }


    try {

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
            `)
            .eq('id', userId)
            .maybeSingle();


        if (profileError) {

            error(
                'Profil konnte nicht geladen werden:',
                profileError
            );

            return null;
        }


        return data;

    } catch (err) {

        error(
            'getProfile Fehler:',
            err
        );

        return null;
    }
}


/* =========================================================
   ROLLEN
========================================================= */

export async function isLeadership() {

    try {

        const {
            data,
            error: rpcError
        } = await supabase.rpc(
            'is_ors_leadership'
        );


        if (rpcError) {

            error(
                'Leadership-Prüfung:',
                rpcError
            );

            return false;
        }


        return Boolean(data);

    } catch (err) {

        error(err);

        return false;
    }
}


export async function isOfficer() {

    try {

        const {
            data,
            error: rpcError
        } = await supabase.rpc(
            'is_ors_officer'
        );


        if (rpcError) {

            error(
                'Officer-Prüfung:',
                rpcError
            );

            return false;
        }


        return Boolean(data);

    } catch (err) {

        error(err);

        return false;
    }
}


export async function isMedical() {

    try {

        const {
            data,
            error: rpcError
        } = await supabase.rpc(
            'is_ors_medical'
        );


        if (rpcError) {

            error(
                'Medical-Prüfung:',
                rpcError
            );

            return false;
        }


        return Boolean(data);

    } catch (err) {

        error(err);

        return false;
    }
}


export async function hasORSAccess() {

    try {

        const {
            data,
            error: rpcError
        } = await supabase.rpc(
            'has_ors_access'
        );


        if (rpcError) {

            error(
                'ÖRS-Zugriff:',
                rpcError
            );

            return false;
        }


        return Boolean(data);

    } catch (err) {

        error(err);

        return false;
    }
}


/* =========================================================
   KOMPLETTER ACCESS
========================================================= */

export async function getORSAccess() {

    const user =
        await getCurrentUser();


    if (!user) {

        return {

            authenticated: false,

            hasAccess: false,

            isLeadership: false,
            isOfficer: false,
            isMedical: false
        };
    }


    const [
        leadership,
        officer,
        medical,
        access
    ] = await Promise.all([

        isLeadership(),
        isOfficer(),
        isMedical(),
        hasORSAccess()

    ]);


    return {

        authenticated: true,

        hasAccess: access,

        isLeadership: leadership,
        isOfficer: officer,
        isMedical: medical
    };
}


/* =========================================================
   USER + PROFILE + ACCESS
========================================================= */

export async function getUserAccessInfo() {

    try {

        const user =
            await getCurrentUser();


        if (!user) {
            return null;
        }


        const [
            profile,
            access
        ] = await Promise.all([

            getProfile(user.id),
            getORSAccess()

        ]);


        return {

            user,

            profile,

            authenticated:
                access.authenticated,

            hasAccess:
                access.hasAccess,

            isLeadership:
                access.isLeadership,

            isOfficer:
                access.isOfficer,

            isMedical:
                access.isMedical
        };

    } catch (err) {

        error(
            'Access-Information:',
            err
        );

        return null;
    }
}


/* =========================================================
   ACCESS LEVEL
========================================================= */

export function getAccessLevel(accessInfo) {

    if (!accessInfo) {
        return 'Kein Zugriff';
    }


    if (accessInfo.isLeadership) {
        return 'Leadership';
    }


    if (accessInfo.isOfficer) {
        return 'Officer';
    }


    if (accessInfo.isMedical) {
        return 'Medical';
    }


    if (accessInfo.hasAccess) {
        return 'ÖRS Mitglied';
    }


    return 'Kein ÖRS Zugriff';
}


/* =========================================================
   USER DATA
========================================================= */

export function getDiscordId(
    user,
    profile = null
) {

    return (
        profile?.discord_id ||
        user?.user_metadata?.provider_id ||
        user?.user_metadata?.sub ||
        user?.app_metadata?.provider_id ||
        'Nicht verfügbar'
    );
}


export function getDisplayName(
    user,
    profile = null
) {

    return (
        profile?.display_name ||
        profile?.username ||
        user?.user_metadata?.global_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.preferred_username ||
        user?.user_metadata?.username ||
        'ÖRS Mitglied'
    );
}


export function getAvatarUrl(
    user,
    profile = null
) {

    if (profile?.avatar_url) {
        return profile.avatar_url;
    }


    if (user?.user_metadata?.avatar_url) {
        return user.user_metadata.avatar_url;
    }


    return null;
}


/* =========================================================
   HELPER
========================================================= */

export async function isAuthenticated() {

    const session =
        await getSession();

    return Boolean(
        session?.user
    );
}


export async function isORSMember() {

    const access =
        await getORSAccess();

    return Boolean(
        access.hasAccess
    );
}


export function canAccessLeadership(
    accessInfo
) {

    return Boolean(
        accessInfo?.isLeadership
    );
}


export function canAccessOfficer(
    accessInfo
) {

    return Boolean(
        accessInfo?.isLeadership ||
        accessInfo?.isOfficer
    );
}


export function canAccessMedical(
    accessInfo
) {

    return Boolean(
        accessInfo?.isLeadership ||
        accessInfo?.isMedical
    );
}


export default {

    signInWithDiscord,
    signOut,

    getAuthenticatedUser,
    getAuthenticatedSession,

    getProfile,

    isLeadership,
    isOfficer,
    isMedical,
    hasORSAccess,

    getORSAccess,
    getUserAccessInfo,

    getAccessLevel,

    getDiscordId,
    getDisplayName,
    getAvatarUrl,

    isAuthenticated,
    isORSMember,

    canAccessLeadership,
    canAccessOfficer,
    canAccessMedical
};
