
import {
    getUserAccessInfo,
    getAccessLevel
} from './auth.js';


let cachedAccess = null;



export async function loadPermissions(force = false) {

    if (cachedAccess && !force) {
        return cachedAccess;
    }

    cachedAccess = await getUserAccessInfo();

    return cachedAccess;
}



export function getPermissions() {
    return cachedAccess;
}



export function isAuthenticated() {

    return Boolean(
        cachedAccess?.authenticated &&
        cachedAccess?.user
    );
}


export function canAccessORS() {

    return Boolean(
        cachedAccess?.hasAccess
    );
}



export function canAccessLeadership() {

    return Boolean(
        cachedAccess?.isLeadership
    );
}



export function canAccessOfficer() {

    return Boolean(
        cachedAccess?.isLeadership ||
        cachedAccess?.isOfficer
    );
}


export function canAccessMedical() {

    return Boolean(
        cachedAccess?.isLeadership ||
        cachedAccess?.isMedical
    );
}



export function hasPermission(permission) {

    switch (permission) {

        case 'ors':
            return canAccessORS();

        case 'member':
        case 'members':
        case 'operations':
        case 'dashboard':
            return canAccessORS();

        case 'medical':
            return canAccessMedical();

        case 'officer':
            return canAccessOfficer();

        case 'leadership':
        case 'admin':
            return canAccessLeadership();

        default:
            return false;
    }
}



export function getCurrentAccessLevel() {

    return getAccessLevel(
        cachedAccess
    );
}



export async function requirePermission(permission) {

    const access = await loadPermissions();

    if (!access?.user) {

        redirectHome(
            'Bitte melde dich zuerst mit Discord an.'
        );

        return false;
    }


    if (!hasPermission(permission)) {

        redirectHome(
            'Du hast für diesen Bereich keine Berechtigung.'
        );

        return false;
    }


    return true;
}



function redirectHome(message = '') {

    if (message) {
        sessionStorage.setItem(
            'ors_redirect_message',
            message
        );
    }

    window.location.href =
        '../../index.html';
}



export function clearPermissions() {

    cachedAccess = null;

}
