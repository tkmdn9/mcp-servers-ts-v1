export const SERVICENOW_FIELDS: Record<string, string[]> = {
    incident: [
        'number', 'sys_id', 'short_description', 'description',
        'state', 'incident_state', 'priority', 'urgency', 'impact', 'severity',
        'category', 'subcategory',
        'caller_id', 'opened_by', 'assigned_to', 'assignment_group',
        'resolved_by', 'closed_by',
        'opened_at', 'resolved_at', 'closed_at', 'sys_created_on', 'sys_updated_on',
        'close_code', 'close_notes', 'work_notes', 'comments',
        'contact_type', 'escalation', 'made_sla', 'sla_due',
        'business_duration', 'calendar_duration',
        'child_incidents', 'reopen_count', 'knowledge',
        'business_service', 'cmdb_ci', 'location', 'company', 'department',
        'upon_approval', 'upon_reject', 'notify',
        'sys_created_by', 'sys_updated_by', 'sys_mod_count',
        'parent_incident', 'problem_id', 'rfc',
    ],
    problem: [
        'number', 'sys_id', 'short_description', 'description',
        'state', 'problem_state', 'priority', 'urgency', 'impact',
        'category', 'subcategory',
        'opened_by', 'assigned_to', 'assignment_group',
        'resolved_by', 'closed_by', 'confirmed_by',
        'opened_at', 'resolved_at', 'closed_at', 'confirmed_at',
        'sys_created_on', 'sys_updated_on', 'fix_at', 'fix_by',
        'cause_notes', 'fix_notes', 'workaround',
        'workaround_applied', 'workaround_communicated_at',
        'close_notes', 'work_notes', 'comments',
        'known_error', 'major_problem',
        'first_reported_by_task', 'related_incidents',
        'cmdb_ci', 'business_service', 'location', 'company',
        'escalation', 'made_sla', 'knowledge', 'rfc',
        'review_outcome', 'duplicate_of',
        'sys_created_by', 'sys_mod_count', 'prb_model',
    ],
    change_request: [
        'number', 'sys_id', 'short_description', 'description',
        'state', 'type', 'priority', 'risk', 'impact',
        'category', 'phase', 'phase_state',
        'assigned_to', 'assignment_group', 'requested_by', 'opened_by', 'closed_by',
        'change_plan', 'backout_plan', 'test_plan', 'justification',
        'start_date', 'end_date', 'work_start', 'work_end',
        'opened_at', 'closed_at', 'sys_created_on', 'sys_updated_on',
        'close_code', 'close_notes', 'work_notes', 'comments',
        'on_hold', 'on_hold_reason',
        'production_system', 'review_date', 'review_status', 'review_comments',
        'cmdb_ci', 'business_service', 'location', 'company',
        'cab_date', 'cab_recommendation',
        'made_sla', 'outside_maintenance_schedule',
        'sys_created_by', 'sys_mod_count', 'approval',
    ],
};

export function getFieldsString(table: string): string {
    return (SERVICENOW_FIELDS[table] ?? []).join(',');
}

export function getFieldsDescription(): string {
    return Object.entries(SERVICENOW_FIELDS)
        .map(([table, fields]) => `  ${table} (${fields.length}個): ${fields.join(', ')}`)
        .join('\n');
}
