
import { getUserAccessInfo } from '../../js/auth.js';
import { supabase } from '../../js/supabase.js';

const $ = (selector) => document.querySelector(selector);

const STATUS = {
    planned: 'Geplant',
    open: 'Offen',
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    cancelled: 'Abgebrochen'
};

const state = {
    operations: [],
    members: [],
    currentOperation: null,
    assignments: new Map(),
    loading: false,
    confirmAction: null
};

const el = {
    create: $('#create-operation-button'),
    emptyCreate: $('#empty-create-button'),
    refresh: $('#refresh-operations'),
    search: $('#operation-search'),
    filter: $('#operation-status-filter'),
    loading: $('#operations-loading'),
    empty: $('#operations-empty'),
    emptyTitle: $('#operations-empty-title'),
    emptyDescription: $('#operations-empty-description'),
    tableWrap: $('#operations-table-wrap'),
    tableBody: $('#operations-table-body'),
    resultsCount: $('#operations-results-count'),
    message: $('#operations-message'),

    total: $('#stat-total'),
    open: $('#stat-open'),
    active: $('#stat-active'),
    completed: $('#stat-completed'),

    operationDialog: $('#operation-dialog'),
    operationForm: $('#operation-form'),
    operationDialogTitle: $('#operation-dialog-title'),
    operationId: $('#operation-id'),
    operationTitle: $('#operation-title'),
    operationLocation: $('#operation-location'),
    operationStatus: $('#operation-status'),
    operationDescription: $('#operation-description'),
    operationFormError: $('#operation-form-error'),
    saveOperation: $('#save-operation-button'),

    membersDialog: $('#members-dialog'),
    membersLabel: $('#members-operation-label'),
    membersLoading: $('#members-loading'),
    membersList: $('#members-list'),
    membersSearch: $('#member-search'),
    membersError: $('#members-error'),
    saveMembers: $('#save-members-button'),

    confirmDialog: $('#confirm-dialog'),
    confirmTitle: $('#confirm-title'),
    confirmDescription: $('#confirm-description'),
    confirmAccept: $('#confirm-accept'),

    toastRegion: $('#ops-toast-region')
};

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
}

function formatDate(value) {
    if (!value) return '–';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '–';

    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function formatNumber(value) {
    return `#${String(value).padStart(3, '0')}`;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `ops-toast${type === 'error' ? ' error' : ''}`;
    toast.textContent = message;

    el.toastRegion.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 4500);
}

function showMessage(message, type = 'info') {
    el.message.textContent = message;
    el.message.classList.toggle('error', type === 'error');
    el.message.hidden = false;
}

function clearMessage() {
    el.message.hidden = true;
    el.message.textContent = '';
    el.message.classList.remove('error');
}

function showFormError(message) {
    el.operationFormError.textContent = message;
    el.operationFormError.hidden = false;
}

function clearFormError() {
    el.operationFormError.textContent = '';
    el.operationFormError.hidden = true;
}

function statusLabel(status) {
    return STATUS[status] || status || 'Unbekannt';
}

function statusClass(status) {
    return STATUS[status]
        ? `ops-status-${status}`
        : 'ops-status-open';
}

function updateStatistics() {
    const operations = state.operations;

    el.total.textContent = operations.length;
    el.open.textContent = operations.filter(
        (item) => ['open', 'planned'].includes(item.status)
    ).length;
    el.active.textContent = operations.filter(
        (item) => item.status === 'active'
    ).length;
    el.completed.textContent = operations.filter(
        (item) => item.status === 'completed'
    ).length;
}

function getFilteredOperations() {
    const search = el.search.value.trim().toLocaleLowerCase('de-DE');
    const status = el.filter.value;

    return state.operations.filter((operation) => {
        const matchesStatus =
            status === 'all' || operation.status === status;

        const searchable = [
            operation.operation_number,
            operation.title,
            operation.location,
            operation.description
        ].filter(Boolean).join(' ').toLocaleLowerCase('de-DE');

        return matchesStatus &&
            (!search || searchable.includes(search));
    });
}

function renderOperations() {
    const operations = getFilteredOperations();

    el.loading.hidden = true;
    el.tableWrap.hidden = operations.length === 0;
    el.empty.hidden = operations.length !== 0;

    if (!state.operations.length) {
        el.emptyTitle.textContent = 'Noch keine Einsätze';
        el.emptyDescription.textContent =
            'Erstelle den ersten Einsatz, um die Verwaltung zu starten.';
        el.emptyCreate.hidden = false;
    } else if (!operations.length) {
        el.emptyTitle.textContent = 'Keine Treffer';
        el.emptyDescription.textContent =
            'Passe die Suche oder den ausgewählten Status an.';
        el.emptyCreate.hidden = true;
    }

    el.resultsCount.textContent =
        `${operations.length} ${operations.length === 1 ? 'Einsatz' : 'Einsätze'}`;

    el.tableBody.replaceChildren();

    for (const operation of operations) {
        const row = document.createElement('tr');

        const description = operation.description
            ? `<div class="ops-operation-description">${escapeHtml(operation.description)}</div>`
            : '';

        row.innerHTML = `
            <td>
                <div class="ops-operation-cell">
                    <span class="ops-number">${escapeHtml(formatNumber(operation.operation_number))}</span>
                    <div>
                        <div class="ops-operation-name">${escapeHtml(operation.title)}</div>
                        ${description}
                    </div>
                </div>
            </td>
            <td>${escapeHtml(operation.location || 'Kein Ort angegeben')}</td>
            <td>
                <span class="ops-status ${statusClass(operation.status)}">
                    ${escapeHtml(statusLabel(operation.status))}
                </span>
            </td>
            <td>${escapeHtml(formatDate(operation.created_at))}</td>
            <td>
                <div class="ops-row-actions">
                    <button class="ops-row-button" type="button"
                        data-action="members" data-id="${escapeHtml(operation.id)}"
                        title="Mitglieder zuweisen" aria-label="Mitglieder zuweisen">
                        <iconify-icon icon="iconoir:group"></iconify-icon>
                    </button>
                    <button class="ops-row-button" type="button"
                        data-action="edit" data-id="${escapeHtml(operation.id)}"
                        title="Bearbeiten" aria-label="Bearbeiten">
                        <iconify-icon icon="iconoir:edit-pencil"></iconify-icon>
                    </button>
                    <button class="ops-row-button danger" type="button"
                        data-action="delete" data-id="${escapeHtml(operation.id)}"
                        title="Löschen" aria-label="Löschen">
                        <iconify-icon icon="iconoir:trash"></iconify-icon>
                    </button>
                </div>
            </td>
        `;

        el.tableBody.appendChild(row);
    }

    updateStatistics();
}

async function loadOperations() {
    if (state.loading) return;

    state.loading = true;
    clearMessage();
    el.loading.hidden = false;
    el.tableWrap.hidden = true;
    el.empty.hidden = true;
    el.refresh.disabled = true;

    try {
        const { data, error } = await supabase
            .from('operations')
            .select(
                'id, operation_number, title, status, location, description, created_by, created_at, updated_at'
            )
            .order('operation_number', { ascending: false });

        if (error) throw error;

        state.operations = data || [];
        renderOperations();
    } catch (error) {
        console.error('[ÖRS Operations] Laden fehlgeschlagen:', error);

        el.loading.hidden = true;
        el.tableWrap.hidden = true;
        el.empty.hidden = true;

        showMessage(
            `Einsätze konnten nicht geladen werden: ${error.message || 'Unbekannter Fehler'}`,
            'error'
        );

        showToast('Einsätze konnten nicht geladen werden.', 'error');
    } finally {
        state.loading = false;
        el.refresh.disabled = false;
    }
}

function openCreateDialog() {
    el.operationForm.reset();
    el.operationId.value = '';
    el.operationStatus.value = 'open';
    el.operationDialogTitle.textContent = 'Einsatz erstellen';
    el.saveOperation.querySelector('span').textContent = 'Speichern';
    clearFormError();

    el.operationDialog.showModal();
    el.operationTitle.focus();
}

function openEditDialog(operation) {
    el.operationForm.reset();
    el.operationId.value = operation.id;
    el.operationTitle.value = operation.title || '';
    el.operationLocation.value = operation.location || '';
    el.operationDescription.value = operation.description || '';
    el.operationStatus.value = STATUS[operation.status]
        ? operation.status
        : 'open';

    el.operationDialogTitle.textContent =
        `Einsatz ${formatNumber(operation.operation_number)} bearbeiten`;

    el.saveOperation.querySelector('span').textContent = 'Änderungen speichern';
    clearFormError();

    el.operationDialog.showModal();
    el.operationTitle.focus();
}

async function saveOperation(event) {
    event.preventDefault();
    clearFormError();

    const title = el.operationTitle.value.trim();

    if (!title) {
        showFormError('Bitte gib einen Einsatz-Titel ein.');
        el.operationTitle.focus();
        return;
    }

    const id = el.operationId.value;
    const payload = {
        title,
        location: el.operationLocation.value.trim() || null,
        description: el.operationDescription.value.trim() || null,
        status: el.operationStatus.value,
        updated_at: new Date().toISOString()
    };

    el.saveOperation.disabled = true;

    try {
        let result;

        if (id) {
            result = await supabase
                .from('operations')
                .update(payload)
                .eq('id', id)
                .select('id')
                .single();
        } else {
            const { data: userResult, error: userError } =
                await supabase.auth.getUser();

            if (userError) throw userError;

            payload.created_by = userResult.user?.id || null;

            result = await supabase
                .from('operations')
                .insert(payload)
                .select('id')
                .single();
        }

        if (result.error) throw result.error;

        el.operationDialog.close();

        showToast(
            id ? 'Einsatz wurde aktualisiert.' : 'Einsatz wurde erstellt.'
        );

        await loadOperations();
    } catch (error) {
        console.error('[ÖRS Operations] Speichern fehlgeschlagen:', error);

        showFormError(
            `Speichern fehlgeschlagen: ${error.message || 'Bitte versuche es erneut.'}`
        );
    } finally {
        el.saveOperation.disabled = false;
    }
}

function openConfirmDialog({ title, description, buttonText = 'Bestätigen', action }) {
    state.confirmAction = action;
    el.confirmTitle.textContent = title;
    el.confirmDescription.textContent = description;
    el.confirmAccept.textContent = buttonText;
    el.confirmDialog.showModal();
}

async function deleteOperation(operation) {
    openConfirmDialog({
        title: 'Einsatz löschen?',
        description:
            `Einsatz ${formatNumber(operation.operation_number)} – ${operation.title} wird endgültig gelöscht. Zugehörige Mitgliederzuweisungen werden durch die Datenbankbeziehung ebenfalls entfernt.`,
        buttonText: 'Einsatz löschen',
        action: async () => {
            el.confirmAccept.disabled = true;

            try {
                const { error } = await supabase
                    .from('operations')
                    .delete()
                    .eq('id', operation.id);

                if (error) throw error;

                el.confirmDialog.close();
                showToast('Einsatz wurde gelöscht.');
                await loadOperations();
            } catch (error) {
                console.error('[ÖRS Operations] Löschen fehlgeschlagen:', error);
                showToast(
                    `Einsatz konnte nicht gelöscht werden: ${error.message || 'Unbekannter Fehler'}`,
                    'error'
                );
            } finally {
                el.confirmAccept.disabled = false;
                state.confirmAction = null;
            }
        }
    });
}

async function loadMembersForAssignment(operation) {
    state.currentOperation = operation;
    state.assignments = new Map();

    el.membersLabel.textContent =
        `${formatNumber(operation.operation_number)} · ${operation.title}`;

    el.membersSearch.value = '';
    el.membersList.replaceChildren();
    el.membersError.hidden = true;
    el.membersLoading.hidden = false;
    el.saveMembers.disabled = true;

    el.membersDialog.showModal();

    try {
        const [membersResult, assignmentsResult] = await Promise.all([
            supabase
                .from('members')
                .select('id, username, display_name, rank, department, active')
                .eq('active', true)
                .order('display_name', { ascending: true }),

            supabase
                .from('operation_members')
                .select('member_id, role')
                .eq('operation_id', operation.id)
        ]);

        if (membersResult.error) throw membersResult.error;
        if (assignmentsResult.error) throw assignmentsResult.error;

        state.members = membersResult.data || [];

        for (const assignment of assignmentsResult.data || []) {
            state.assignments.set(assignment.member_id, {
                selected: true,
                role: assignment.role || ''
            });
        }

        renderMembers();
    } catch (error) {
        console.error('[ÖRS Operations] Mitglieder konnten nicht geladen werden:', error);

        el.membersError.textContent =
            `Mitglieder konnten nicht geladen werden: ${error.message || 'Unbekannter Fehler'}`;
        el.membersError.hidden = false;
    } finally {
        el.membersLoading.hidden = true;
        el.saveMembers.disabled = false;
    }
}

function renderMembers() {
    const query = el.membersSearch.value.trim().toLocaleLowerCase('de-DE');

    const filteredMembers = state.members.filter((member) => {
        const name = [
            member.display_name,
            member.username,
            member.rank,
            member.department
        ].filter(Boolean).join(' ').toLocaleLowerCase('de-DE');

        return !query || name.includes(query);
    });

    el.membersList.replaceChildren();

    if (!filteredMembers.length) {
        const empty = document.createElement('div');
        empty.className = 'ops-member-empty';
        empty.textContent = state.members.length
            ? 'Keine passenden Mitglieder gefunden.'
            : 'Es wurden keine aktiven Mitglieder gefunden.';
        el.membersList.appendChild(empty);
        return;
    }

    for (const member of filteredMembers) {
        const assignment = state.assignments.get(member.id) || {
            selected: false,
            role: ''
        };

        const label = document.createElement('label');
        label.className = 'ops-member-row';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = assignment.selected;
        checkbox.setAttribute('aria-label', 'Mitglied zuweisen');

        const info = document.createElement('span');
        info.className = 'ops-member-info';

        const name = document.createElement('strong');
        name.textContent =
            member.display_name || member.username || 'Unbekanntes Mitglied';

        const meta = document.createElement('small');
        meta.textContent = [
            member.rank,
            member.department,
            member.username
        ].filter(Boolean).join(' · ') || 'ÖRS-Mitglied';

        info.append(name, meta);

        const role = document.createElement('select');
        role.className = 'ops-member-role';
        role.setAttribute('aria-label', 'Einsatzrolle');
        role.disabled = !assignment.selected;

        const options = [
            ['', 'Rolle auswählen'],
            ['einsatzleitung', 'Einsatzleitung'],
            ['sanitaet', 'Sanitätsdienst'],
            ['unterstuetzung', 'Unterstützung'],
            ['transport', 'Transport'],
            ['sonstige', 'Sonstige']
        ];

        for (const [value, text] of options) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            role.appendChild(option);
        }

        role.value = assignment.role;

        checkbox.addEventListener('change', () => {
            state.assignments.set(member.id, {
                selected: checkbox.checked,
                role: role.value
            });

            role.disabled = !checkbox.checked;
        });

        role.addEventListener('change', () => {
            state.assignments.set(member.id, {
                selected: checkbox.checked,
                role: role.value
            });
        });

        label.append(checkbox, info, role);
        el.membersList.appendChild(label);
    }
}

async function saveMemberAssignments() {
    const operation = state.currentOperation;

    if (!operation) return;

    const selected = [...state.assignments.entries()]
        .filter(([, assignment]) => assignment.selected)
        .map(([memberId, assignment]) => ({
            operation_id: operation.id,
            member_id: memberId,
            role: assignment.role || null
        }));

    el.saveMembers.disabled = true;
    el.membersError.hidden = true;

    try {
        const { data: currentRows, error: currentError } = await supabase
            .from('operation_members')
            .select('member_id')
            .eq('operation_id', operation.id);

        if (currentError) throw currentError;

        const existingIds = new Set(
            (currentRows || []).map((row) => row.member_id)
        );

        const selectedIds = new Set(
            selected.map((row) => row.member_id)
        );

        const idsToRemove = [...existingIds].filter(
            (id) => !selectedIds.has(id)
        );

        const rowsToInsert = selected.filter(
            (row) => !existingIds.has(row.member_id)
        );

        const rowsToUpdate = selected.filter(
            (row) => existingIds.has(row.member_id)
        );

        // Erst neue Einträge hinzufügen, damit ein Insert-Fehler
        // nicht vorher bestehende Zuweisungen entfernt.
        if (rowsToInsert.length) {
            const { error } = await supabase
                .from('operation_members')
                .insert(rowsToInsert);

            if (error) throw error;
        }

        for (const row of rowsToUpdate) {
            const { error } = await supabase
                .from('operation_members')
                .update({ role: row.role })
                .eq('operation_id', operation.id)
                .eq('member_id', row.member_id);

            if (error) throw error;
        }

        if (idsToRemove.length) {
            const { error } = await supabase
                .from('operation_members')
                .delete()
                .eq('operation_id', operation.id)
                .in('member_id', idsToRemove);

            if (error) throw error;
        }

        el.membersDialog.close();
        showToast('Mitgliederzuweisungen wurden gespeichert.');
    } catch (error) {
        console.error('[ÖRS Operations] Zuweisungen fehlgeschlagen:', error);

        el.membersError.textContent =
            `Zuweisungen konnten nicht vollständig gespeichert werden: ${error.message || 'Unbekannter Fehler'}`;
        el.membersError.hidden = false;
    } finally {
        el.saveMembers.disabled = false;
    }
}

function setupEvents() {
    el.create.addEventListener('click', openCreateDialog);
    el.emptyCreate.addEventListener('click', openCreateDialog);
    el.refresh.addEventListener('click', loadOperations);
    el.search.addEventListener('input', renderOperations);
    el.filter.addEventListener('change', renderOperations);
    el.operationForm.addEventListener('submit', saveOperation);

    $('#close-operation-dialog').addEventListener('click', () => {
        el.operationDialog.close();
    });

    $('#cancel-operation-dialog').addEventListener('click', () => {
        el.operationDialog.close();
    });

    $('#close-members-dialog').addEventListener('click', () => {
        el.membersDialog.close();
    });

    $('#cancel-members-dialog').addEventListener('click', () => {
        el.membersDialog.close();
    });

    el.membersSearch.addEventListener('input', renderMembers);
    el.saveMembers.addEventListener('click', saveMemberAssignments);

    $('#confirm-cancel').addEventListener('click', () => {
        state.confirmAction = null;
        el.confirmDialog.close();
    });

    el.confirmAccept.addEventListener('click', async () => {
        if (state.confirmAction) {
            await state.confirmAction();
        }
    });

    el.tableBody.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');

        if (!button) return;

        const operation = state.operations.find(
            (item) => item.id === button.dataset.id
        );

        if (!operation) return;

        switch (button.dataset.action) {
            case 'edit':
                openEditDialog(operation);
                break;

            case 'members':
                await loadMembersForAssignment(operation);
                break;

            case 'delete':
                deleteOperation(operation);
                break;
        }
    });

    for (const dialog of [
        el.operationDialog,
        el.membersDialog,
        el.confirmDialog
    ]) {
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) {
                dialog.close();
            }
        });
    }
}

async function initialize() {
    try {
        const accessInfo = await getUserAccessInfo();

        if (!accessInfo?.authenticated) {
            window.location.replace('../../index.html?access=login-required');
            return;
        }

        if (!accessInfo.isLeadership) {
            window.location.replace('../../index.html?access=denied');
            return;
        }

        setupEvents();
        await loadOperations();
    } catch (error) {
        console.error('[ÖRS Operations] Initialisierung fehlgeschlagen:', error);

        showMessage(
            'Die Einsatzverwaltung konnte nicht initialisiert werden. Bitte melde dich erneut an.',
            'error'
        );
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
    initialize();
}
