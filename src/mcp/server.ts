import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { RedmineClient } from '../api/redmine.ts';
import { ServiceNowClient } from '../api/servicenow.ts';
import { getFieldsDescription } from '../config/servicenow-fields.ts';

const mcp = new FastMCP({ name: 'MyEnterpriseMCP', version: '1.0.0' });

// Initialize clients with environment variables
const redmine = new RedmineClient({
    baseUrl: process.env.REDMINE_URL || 'http://localhost/redmine',
    apiKey: process.env.REDMINE_API_KEY || '',
});

const serviceNow = new ServiceNowClient({
    instance: process.env.SNOW_INSTANCE || '',
    username: process.env.SNOW_USER,
    password: process.env.SNOW_PASS,
    accessToken: process.env.SNOW_TOKEN,
});

// Redmine Tools
mcp.addTool({
    name: 'get_redmine_issues',
    description: 'Get issues from Redmine',
    parameters: z.object({
        project_id: z.number().optional(),
        status_id: z.string().optional(),
    }),
    execute: async (args) => {
        return await redmine.getIssues(args);
    },
});

mcp.addTool({
    name: 'create_redmine_issue',
    description: 'Create a new issue in Redmine',
    parameters: z.object({
        project_id: z.number(),
        subject: z.string(),
        description: z.string().optional(),
    }),
    execute: async (args) => {
        return await redmine.createIssue(args);
    },
});

mcp.addTool({
    name: 'update_redmine_issue',
    description: `Update an existing issue in Redmine.
status_id: 1=New, 2=In Progress, 3=Resolved, 4=Feedback, 5=Closed, 6=Rejected
priority_id: 1=Low, 2=Normal, 3=High, 4=Urgent, 5=Immediate`,
    parameters: z.object({
        id: z.number(),
        subject: z.string().optional(),
        description: z.string().optional(),
        status_id: z.number().optional(),
        priority_id: z.number().optional(),
        assigned_to_id: z.number().optional(),
        notes: z.string().optional(),
    }),
    execute: async (args) => {
        const { id, ...issue } = args;
        const data = await redmine.updateIssue(id, issue);
        return JSON.stringify(data, null, 2);
    },
});

// ServiceNow Tools
mcp.addTool({
    name: 'get_servicenow_incidents',
    description: 'Get incidents from ServiceNow',
    parameters: z.object({
        limit: z.number().optional().default(10),
    }),
    execute: async (args) => {
        const data = await serviceNow.getRecords('incident', { sysparm_limit: args.limit });
        return JSON.stringify(data, null, 2);
    },
});

mcp.addTool({
    name: 'create_servicenow_incident',
    description: 'Create a new incident in ServiceNow',
    parameters: z.object({
        short_description: z.string(),
        description: z.string().optional(),
    }),
    execute: async (args) => {
        const data = await serviceNow.createRecord('incident', args);
        return JSON.stringify(data, null, 2);
    },
});

// ServiceNow Generic Tools
mcp.addTool({
    name: 'get_servicenow_records',
    description: `Get records from any ServiceNow table.
Table examples: incident, problem, change_request, sc_request
Query syntax (sysparm_query format):
- Simple: "state=1"
- AND: "state=1^priority=2"
- Dot-walk (reference field): "problem_id.number=PRB0040002"
- Name search: "caller_id.name=John Doe"
- Contains: "short_descriptionLIKEnetwork"
Set display_value=true to show human-readable values for reference fields (caller name, group name, etc.)
Fields example per table:
${getFieldsDescription()}`,
    parameters: z.object({
        table: z.string(),
        limit: z.number().optional().default(10),
        query: z.string().optional(),
        fields: z.string().optional(),
        display_value: z.boolean().optional().default(true),
    }),
    execute: async (args) => {
        const params: Record<string, unknown> = { sysparm_limit: args.limit };
        if (args.query) params.sysparm_query = args.query;
        if (args.fields) params.sysparm_fields = args.fields;
        params.sysparm_display_value = args.display_value ? 'true' : 'false';
        const data = await serviceNow.getRecords(args.table, params);
        return JSON.stringify(data, null, 2);
    },
});

mcp.addTool({
    name: 'create_servicenow_record',
    description: 'Create a record in any ServiceNow table (e.g. incident, problem, change)',
    parameters: z.object({
        table: z.string(),
        short_description: z.string(),
        description: z.string().optional(),
    }),
    execute: async (args) => {
        const { table, ...record } = args;
        const data = await serviceNow.createRecord(table, record);
        return JSON.stringify(data, null, 2);
    },
});

mcp.addTool({
    name: 'update_servicenow_record',
    description: `Update a record in any ServiceNow table.
State values by table:
  incident: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed
  problem: 100=Open, 102=Known Error, 103=Pending Change, 104=Closed/Resolved
  change_request: -5=New, -4=Assess, -3=Authorize, -2=Scheduled, -1=Implement, 0=Review, 3=Closed
close_code examples (incident): "Solved (Permanently)", "Solved (Work Around)", "Not Solved (Not Reproducible)"
Use work_notes to add internal notes without notifying the caller.`,
    parameters: z.object({
        table: z.string(),
        sys_id: z.string(),
        short_description: z.string().optional(),
        description: z.string().optional(),
        state: z.number().optional(),
        close_code: z.string().optional(),
        close_notes: z.string().optional(),
        work_notes: z.string().optional(),
        assigned_to: z.string().optional(),
        assignment_group: z.string().optional(),
        priority: z.number().optional(),
        urgency: z.number().optional(),
        impact: z.number().optional(),
    }),
    execute: async (args) => {
        const { table, sys_id, ...rest } = args;
        const data = Object.fromEntries(
            Object.entries(rest).filter(([, v]) => v !== undefined)
        );
        const result = await serviceNow.updateRecord(table, sys_id, data);
        return JSON.stringify(result, null, 2);
    },
});

// Start the server
mcp.start({ transportType: 'stdio' });
console.error('FastMCP server started with stdio transport');
