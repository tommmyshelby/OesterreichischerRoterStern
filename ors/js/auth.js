

import {
    supabase,
    getSession,
    getCurrentUser
} from './supabase.js';

import { ORS_CONFIG } from './config.js';



function log(...args) {
    console.log('[ÖRS Auth]', ...args);
}

function warn(...args) {
    console.warn('[ÖRS Auth]', ...args);
}

function error(...args) {
    console.error('[ÖRS Auth]', ...args);
}




export async function signInWithDiscord() {

    try {

        log('Starte Discord OAuth...');

        const redirectUrl =
            ORS_CONFIG.website.url;

        if (!redirectUrl) {
            throw new Error(
                '[ÖRS Auth] Website URL fehlt in config.js.'
            );
        }


        const { data, error: authError } =
            await supabase.auth.signInWithOAuth({

                provider: 'discord',

                options: {

                    redirectTo: redirectUrl,

                    scopes:
                        'identify guilds'
                }
            });


        if (authError) {

            error(
                'Discord OAuth Fehler:',
                authError
            );

            throw authError;
        }


        log(
            'Discord OAuth wurde gestartet.',
            data
        );


        return data;

    } catch (err) {

        error(
            'Discord Login fehlgeschlagen:',
            err
        );

        throw err;
    }
}




export async function signOut() {

    try {

        log('Melde Benutzer ab...');

        const {
            error: authError
        } = await supabase.auth.signOut();


        if (authError) {

            error(
                'Supabase Logout Fehler:',
                authError
            );

            throw authError;
        }


        log(
            'Benutzer erfolgreich abgemeldet.'
        );

    } catch (err) {

        error(
            'Logout fehlgeschlagen:',
            err
        );

        throw err;
    }
}



export async function getAuthenticatedUser() {

    try {

        const user =
            await getCurrentUser();

        return user;

    } catch (err) {

        error(
            'Fehler beim Laden des aktuellen Users:',
            err
        );

        return null;
    }
}



export async function getAuthenticatedSession() {

    try {

        const session =
            await getSession();

        return session;

    } catch (err) {

        error(
            'Fehler beim Laden der Session:',
            err
        );

        return null;
    }
}



export async function getProfile(
    userId = null
) {

    try {

        const user =
            await getCurrentUser();


        if (!user) {

            warn(
                'Kein angemeldeter Benutzer.'
            );

            return null;
        }


        const id =
            userId || user.id;


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
            .eq('id', id)
            .maybeSingle();


        if (profileError) {

            error(
                'Fehler beim Laden des Profils:',
                profileError
            );

            throw profileError;
        }


        return data;

    } catch (err) {

        error(
            'getProfile fehlgeschlagen:',
            err
        );

        return null;
    }
}




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
                'Leadership-Prüfung fehlgeschlagen:',
                rpcError
            );

            return false;
        }


        return Boolean(data);

    } catch (err) {

        error(
            'isLeadership Fehler:',
            err
        );

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
                'Officer-Prüfung fehlgeschlagen:',
                rpcError
            );

            return false;
        }


        return Boolean(data);

    } catch (err) {

        error(
            'isOfficer Fehler:',
            err
        );

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
                'Medical-Prüfung fehlgeschlagen:',
                rpcError
            );

            return false;
        }


        return Boolean(data);

    } catch (err) {

        error(
            'isMedical Fehler:',
            err
        );

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
                'ÖRS Zugriff konnte nicht geprüft werden:',
                rpcError
            );

            return false;
        }


        return Boolean(data);

    } catch (err) {

        error(
            'hasORSAccess Fehler:',
            err
        );

        return false;
    }
}



export async function getORSAccess() {

    try {

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

    } catch (err) {

        error(
            'getORSAccess fehlgeschlagen:',
            err
        );


        return {

            authenticated: true,

            hasAccess: false,

            isLeadership: false,

            isOfficer: false,

            isMedical: false
        };
    }
}



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
            'getUserAccessInfo fehlgeschlagen:',
            err
        );

        return null;
    }
}




export function getAccessLevel(
    accessInfo
) {

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



export async function isAuthenticated() {

    const session =
        await getSession();

    return Boolean(
        session?.user
    );
}




export function getDiscordId(
    user,
    profile = null
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


    return null;
}




export function getDiscordDisplayName(
    user,
    profile = null
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




export function getDiscordAvatar(
    user,
    profile = null
) {

    if (profile?.avatar_url) {
        return profile.avatar_url;
    }


    if (user?.user_metadata?.avatar_url) {
        return user.user_metadata.avatar_url;
    }


    if (user?.user_metadata?.picture) {
        return user.user_metadata.picture;
    }


    if (user?.user_metadata?.avatar) {
        return user.user_metadata.avatar;
    }


    return null;
}



export function isORSMember(
    accessInfo
) {

    return Boolean(
        accessInfo?.hasAccess
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

    canAccessLeadership,

    canAccessOfficer,

    canAccessMedical,

    isAuthenticated,

    getDiscordId,

    getDiscordDisplayName,

    getDiscordAvatar,

    isORSMember
};
