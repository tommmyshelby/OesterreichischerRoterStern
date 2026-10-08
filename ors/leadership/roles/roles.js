
import {
    getUserAccessInfo,
    signOut
} from '../../js/auth.js';

import { supabase } from '../../js/supabase.js';

const LEADERSHIP_USERS = new Set([
    '881206091009122406',
    '1204084190014865439'
]);

const OFFICER_ROLE_IDS = [
    '1444448461519978778',
    '1443935474837229618'
];

const MEDICAL_ROLE_ID = '1556331287558627338';

const elements = {
    logout: document.querySelector('#logout-button'),
    form: document.querySelector('#role-form'),
    discordId: document.querySelector('#discord-id'),
    role: document.querySelector('#role-type'),
    roleId: document.querySelector('#role-id'),
    save: document.querySelector('#save-role'),
    formMessage: document.querySelector('#form-message'),
    listMessage: document.querySelector('#list-message'),
    table: document.querySelector('#roles-table-body'),
    search: document.querySelector('#search-input'),
    filter: document.querySelector('#filter-role'),
    refresh: document.querySelector('#refresh-button'),
    members: document.querySelector('#count-members'),
    leadership: document.querySelector('#count-leadership'),
    officer: document.querySelector('#count-officer'),
    medical: document.querySelector('#count-medical')
};

let memberRows = [];
let roleRows = [];

function setMessage(element, message, state = '') {
    element.textContent = message;
    element.dataset.state = state;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function normalizeRole(role) {
    const value = String(role ?? '').toLowerCase();

    if (['leadership', 'leitung'].includes(value)) return 'leadership';
    if (['officer', 'offizier'].includes(value)) return 'officer';
    if (['medical', 'medizin', 'medic'].includes(value)) return 'medical';

    return 'member';
}

function roleLabel(role) {
    return ({
        leadership: 'Leadership',
        officer: 'Officer',
        medical: 'Medical',
        member: 'Mitglied'
    })[role] || 'Mitglied';
}

function rolePill(role) {
    return `<span class="role-pill ${role}">${roleLabel(role)}</span>`;
}

function rolesForDiscordId(discordId) {
    const normalizedId = String(discordId);
    const matching = roleRows.filter(
        row => String(row.discord_id) === normalizedId
    );

    const roles = new Set();

    if (LEADERSHIP_USERS.has(normalizedId)) {
        roles.add('leadership');
    }

    for (const row of matching) {
        const role = normalizeRole(row.role);
        if (role !== 'member') roles.add(role);
    }

    if (roles.size === 0) roles.add('member');

    return [...roles];
}

function updateRoleIdOptions() {
    const selectedRole = elements.role.value;
    const previousValue = elements.roleId.value;

    if (selectedRole === 'medical') {
        elements.roleId.innerHTML =
            `<option value="${MEDICAL_ROLE_ID}">Medical</option>`;
        return;
    }

    elements.roleId.innerHTML = `
        <option value="${OFFICER_ROLE_IDS[0]}">Officer – Rolle 1</option>
        <option value="${OFFICER_ROLE_IDS[1]}">Officer – Rolle 2</option>
    `;

    if (OFFICER_ROLE_IDS.includes(previousValue)) {
        elements.roleId.value = previousValue;
    }
}

async function loadData() {
    setMessage(elements.listMessage, 'Mitglieder werden geladen …');

    const [membersResult, rolesResult] = await Promise.all([
        supabase
            .from('members')
            .select('discord_id, username, display_name, rank, department, active')
            .order('display_name', { ascending: true }),

        supabase
            .from('access_roles')
            .select('discord_id, role, role_id, created_at')
    ]);

    if (membersResult.error) {
        console.error('[ÖRS Rollen] Mitglieder:', membersResult.error);
        setMessage(
            elements.listMessage,
            'Mitglieder konnten nicht geladen werden. Prüfe die Supabase-RLS-Regeln.',
            'error'
        );
        return;
    }

    if (rolesResult.error) {
        console.error('[ÖRS Rollen] Rollen:', rolesResult.error);
        setMessage(
            elements.listMessage,
            'Rollen konnten nicht geladen werden. Prüfe die Leseberechtigung für access_roles.',
            'error'
        );
        return;
    }

    memberRows = membersResult.data ?? [];
    roleRows = rolesResult.data ?? [];

    renderStats();
    renderTable();
    setMessage(elements.listMessage, `${memberRows.length} Mitglieder geladen.`, 'success');
}

function renderStats() {
    const activeMembers = memberRows.filter(member => member.active);
    const count = role => activeMembers.filter(member =>
        rolesForDiscordId(member.discord_id).includes(role)
    ).length;

    elements.members.textContent = activeMembers.length;
    elements.leadership.textContent = count('leadership');
    elements.officer.textContent = count('officer');
    elements.medical.textContent = count('medical');
}

function renderTable() {
    const query = elements.search.value.trim().toLowerCase();
    const filter = elements.filter.value;

    const filtered = memberRows.filter(member => {
        const discordId = String(member.discord_id ?? '');
        const name = String(member.display_name || member.username || '').toLowerCase();
        const roles = rolesForDiscordId(discordId);

        const matchesQuery =
            name.includes(query) || discordId.includes(query);

        const matchesRole = filter === 'all' || roles.includes(filter);

        return matchesQuery && matchesRole;
    });

    if (filtered.length === 0) {
        elements.table.innerHTML = `
            <tr>
                <td class="roles-empty" colspan="5">
                    Keine passenden Mitglieder gefunden.
                </td>
            </tr>
        `;
        return;
    }

    elements.table.innerHTML = filtered.map(member => {
        const discordId = String(member.discord_id ?? '');
        const name = escapeHtml(member.display_name || member.username || 'Unbekannt');
        const username = escapeHtml(member.username ? `@${member.username}` : '');
        const roles = rolesForDiscordId(discordId);
        const status = member.active ? 'Aktiv' : 'Inaktiv';

        const roleMarkup = roles.map(rolePill).join(' ');

        const removableRoles = roleRows.filter(row =>
            String(row.discord_id) === discordId &&
            ['officer', 'medical'].includes(normalizeRole(row.role))
        );

        const removeMarkup = removableRoles.length
            ? removableRoles.map(row => {
                const role = normalizeRole(row.role);
                return `<button
                    class="roles-remove-button"
                    type="button"
                    data-remove-id="${escapeHtml(discordId)}"
                    data-remove-role="${role}"
                >${roleLabel(role)} entfernen</button>`;
            }).join(' ')
            : '–';

        return `
            <tr>
                <td><strong>${name}</strong><small>${username}</small></td>
                <td>${escapeHtml(discordId)}</td>
                <td>${roleMarkup}</td>
                <td><span class="status-pill">${status}</span></td>
                <td>${removeMarkup}</td>
            </tr>
        `;
    }).join('');

    elements.table.querySelectorAll('[data-remove-id]').forEach(button => {
        button.addEventListener('click', () => removeRole(
            button.dataset.removeId,
            button.dataset.removeRole,
            button
        ));
    });
}

async function assignRole(event) {
    event.preventDefault();

    const discordId = elements.discordId.value.trim();
    const role = elements.role.value;
    const roleId = elements.roleId.value;

    if (!/^[0-9]{17,20}$/.test(discordId)) {
        setMessage(elements.formMessage, 'Bitte eine gültige Discord-ID eingeben.', 'error');
        return;
    }

    if (!['officer', 'medical'].includes(role)) {
        setMessage(elements.formMessage, 'Diese Rolle ist nicht zulässig.', 'error');
        return;
    }

    if (role === 'officer' && !OFFICER_ROLE_IDS.includes(roleId)) {
        setMessage(elements.formMessage, 'Ungültige Officer-Rolle.', 'error');
        return;
    }

    if (role === 'medical' && roleId !== MEDICAL_ROLE_ID) {
        setMessage(elements.formMessage, 'Ungültige Medical-Rolle.', 'error');
        return;
    }

    elements.save.disabled = true;
    setMessage(elements.formMessage, 'Berechtigung wird gespeichert …');

    try {
        const { error } = await supabase.rpc('ors_assign_access_role', {
            target_discord_id: discordId,
            target_role: role,
            target_role_id: roleId
        });

        if (error) throw error;

        setMessage(
            elements.formMessage,
            `${roleLabel(role)} wurde erfolgreich zugewiesen.`,
            'success'
        );

        elements.form.reset();
        updateRoleIdOptions();
        await loadData();
    } catch (error) {
        console.error('[ÖRS Rollen] Vergabe fehlgeschlagen:', error);
        setMessage(
            elements.formMessage,
            error.message || 'Die Berechtigung konnte nicht vergeben werden.',
            'error'
        );
    } finally {
        elements.save.disabled = false;
    }
}

async function removeRole(discordId, role, button) {
    if (!['officer', 'medical'].includes(role)) return;

    const confirmed = window.confirm(
        `${roleLabel(role)} für Discord-ID ${discordId} wirklich entfernen?`
    );

    if (!confirmed) return;

    button.disabled = true;

    try {
        const { error } = await supabase.rpc('ors_revoke_access_role', {
            target_discord_id: discordId,
            target_role: role
        });

        if (error) throw error;

        await loadData();
    } catch (error) {
        console.error('[ÖRS Rollen] Entfernen fehlgeschlagen:', error);
        window.alert(error.message || 'Die Berechtigung konnte nicht entfernt werden.');
        button.disabled = false;
    }
}

async function initialize() {
    try {
        const accessInfo = await getUserAccessInfo();

        if (!accessInfo?.authenticated) {
            window.location.replace('../../../index.html?access=login-required');
            return;
        }

        if (!accessInfo.isLeadership) {
            window.location.replace('../../../index.html?access=denied');
            return;
        }

        elements.role.addEventListener('change', updateRoleIdOptions);
        elements.form.addEventListener('submit', assignRole);
        elements.search.addEventListener('input', renderTable);
        elements.filter.addEventListener('change', renderTable);
        elements.refresh.addEventListener('click', loadData);

        elements.logout.addEventListener('click', async () => {
            elements.logout.disabled = true;

            try {
                await signOut();
                window.location.replace('../../../index.html');
            } catch (error) {
                console.error('[ÖRS Rollen] Abmeldung fehlgeschlagen:', error);
                elements.logout.disabled = false;
            }
        });

        updateRoleIdOptions();
        await loadData();
    } catch (error) {
        console.error('[ÖRS Rollen] Initialisierung fehlgeschlagen:', error);
        setMessage(
            elements.listMessage,
            'Die Rollenverwaltung konnte nicht initialisiert werden.',
            'error'
        );
    }
}

initialize();
