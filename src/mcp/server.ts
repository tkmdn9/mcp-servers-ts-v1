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

// Start the server
mcp.start({ transportType: 'stdio' });
console.error('FastMCP server started with stdio transport');
