

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

import { ORS_CONFIG } from './config.js';



if (!ORS_CONFIG.supabase.url) {
    throw new Error(
        '[ÖRS] Supabase URL fehlt in config.js.'
    );
}

if (!ORS_CONFIG.supabase.publishableKey) {
    throw new Error(
        '[ÖRS] Supabase Publishable Key fehlt in config.js.'
    );
}


export const supabase = createClient(
    ORS_CONFIG.supabase.url,
    ORS_CONFIG.supabase.publishableKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);



export async function getSession() {

    const {
        data,
        error
    } = await supabase.auth.getSession();


    if (error) {

        console.error(
            '[ÖRS] Fehler beim Laden der Session:',
            error
        );

        return null;
    }


    return data.session;
}


export async function getCurrentUser() {

    const {
        data,
        error
    } = await supabase.auth.getUser();


    if (error) {

        console.error(
            '[ÖRS] Fehler beim Laden des Benutzers:',
            error
        );

        return null;
    }


    return data.user;
}


export async function isLoggedIn() {

    const session = await getSession();

    return Boolean(session);
}



export function onAuthStateChange(callback) {

    return supabase.auth.onAuthStateChange(
        (event, session) => {

            callback(event, session);

        }
    );
}



export default supabase;
