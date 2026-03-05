import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { RedmineClient } from '../api/redmine.ts';
import { ServiceNowClient } from '../api/servicenow.ts';
import { getFieldsDescription } from '../config/servicenow-fields.ts';

const PORT = parseInt(process.env.MCP_HTTP_PORT ?? '3000', 10);

// Initialize clients (shared across requests)
const redmine = new RedmineClient({
    baseUrl: process.env.REDMINE_URL ?? 'http://localhost/redmine',
    apiKey: process.env.REDMINE_API_KEY ?? '',
});

const serviceNow = new ServiceNowClient({
    instance: process.env.SNOW_INSTANCE ?? '',
    username: process.env.SNOW_USER,
    password: process.env.SNOW_PASS,
    accessToken: process.env.SNOW_TOKEN,
});

// Factory: create a new McpServer with all tools registered
function createMcpServer(): McpServer {
    const server = new McpServer({ name: 'MyEnterpriseMCP', version: '1.0.0' });

    // --- Redmine Tools ---
    server.tool(
        'get_redmine_issues',
        'Get issues from Redmine',
        {
            project_id: z.number().optional(),
            status_id: z.string().optional(),
        },
        async (args) => {
            const data = await redmine.getIssues(args);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    server.tool(
        'create_redmine_issue',
        'Create a new issue in Redmine',
        {
            project_id: z.number(),
            subject: z.string(),
            description: z.string().optional(),
        },
        async (args) => {
            const data = await redmine.createIssue(args);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    server.tool(
        'update_redmine_issue',
        `Update an existing issue in Redmine.
status_id: 1=New, 2=In Progress, 3=Resolved, 4=Feedback, 5=Closed, 6=Rejected
priority_id: 1=Low, 2=Normal, 3=High, 4=Urgent, 5=Immediate`,
        {
            id: z.number(),
            subject: z.string().optional(),
            description: z.string().optional(),
            status_id: z.number().optional(),
            priority_id: z.number().optional(),
            assigned_to_id: z.number().optional(),
            notes: z.string().optional(),
        },
        async (args) => {
            const { id, ...issue } = args;
            const data = await redmine.updateIssue(id, issue);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    server.tool(
        'delete_redmine_issue',
        'Delete an issue from Redmine. Use with caution as this is irreversible.',
        { id: z.number() },
        async (args) => {
            const result = await redmine.deleteIssue(args.id);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    // --- ServiceNow Tools ---
    server.tool(
        'get_servicenow_incidents',
        'Get incidents from ServiceNow. Use offset for pagination. Response includes total and has_more so you can page through all records.',
        {
            limit: z.number().optional().default(10),
            offset: z.number().optional().default(0),
        },
        async (args) => {
            const { data, total } = await serviceNow.getRecordsWithMeta('incident', {
                sysparm_limit: args.limit,
                sysparm_offset: args.offset,
            });
            const records: unknown[] = data.result ?? [];
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        records,
                        offset: args.offset,
                        limit: args.limit,
                        total,
                        has_more: total >= 0 ? args.offset + records.length < total : records.length === args.limit,
                    }, null, 2),
                }],
            };
        }
    );

    server.tool(
        'create_servicenow_incident',
        'Create a new incident in ServiceNow',
        {
            short_description: z.string(),
            description: z.string().optional(),
        },
        async (args) => {
            const data = await serviceNow.createRecord('incident', args);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    server.tool(
        'get_servicenow_records',
        `Get records from any ServiceNow table with pagination support.
Table examples: incident, problem, change_request, sc_request
Query syntax (sysparm_query format):
- Simple: "state=1"
- AND: "state=1^priority=2"
- Dot-walk (reference field): "problem_id.number=PRB0040002"
- Name search: "caller_id.name=John Doe"
- Contains: "short_descriptionLIKEnetwork"
Set display_value=true to show human-readable values for reference fields (caller name, group name, etc.)
Pagination: use offset to page through results (e.g. offset=0, offset=100, offset=200...).
Response includes total count and has_more flag — keep calling with increasing offset while has_more=true.
Fields example per table:
${getFieldsDescription()}`,
        {
            table: z.string(),
            limit: z.number().optional().default(10),
            offset: z.number().optional().default(0),
            query: z.string().optional(),
            fields: z.string().optional(),
            display_value: z.boolean().optional().default(true),
        },
        async (args) => {
            const params: Record<string, unknown> = {
                sysparm_limit: args.limit,
                sysparm_offset: args.offset,
            };
            if (args.query) params.sysparm_query = args.query;
            if (args.fields) params.sysparm_fields = args.fields;
            params.sysparm_display_value = args.display_value ? 'true' : 'false';
            const { data, total } = await serviceNow.getRecordsWithMeta(args.table, params);
            const records: unknown[] = data.result ?? [];
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        records,
                        offset: args.offset,
                        limit: args.limit,
                        total,
                        has_more: total >= 0 ? args.offset + records.length < total : records.length === args.limit,
                    }, null, 2),
                }],
            };
        }
    );

    server.tool(
        'create_servicenow_record',
        'Create a record in any ServiceNow table (e.g. incident, problem, change)',
        {
            table: z.string(),
            short_description: z.string(),
            description: z.string().optional(),
        },
        async (args) => {
            const { table, ...record } = args;
            const data = await serviceNow.createRecord(table, record);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    server.tool(
        'update_servicenow_record',
        `Update a record in any ServiceNow table.
State values by table:
  incident: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed
  problem: 100=Open, 102=Known Error, 103=Pending Change, 104=Closed/Resolved
  change_request: -5=New, -4=Assess, -3=Authorize, -2=Scheduled, -1=Implement, 0=Review, 3=Closed
close_code examples (incident): "Solved (Permanently)", "Solved (Work Around)", "Not Solved (Not Reproducible)"
Use work_notes to add internal notes without notifying the caller.
Link fields (use sys_id values):
  problem_id: link incident to a problem record
  rfc: link incident to a change_request record
  parent_incident: link incident to a parent incident`,
        {
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
            problem_id: z.string().optional(),
            rfc: z.string().optional(),
            parent_incident: z.string().optional(),
        },
        async (args) => {
            const { table, sys_id, ...rest } = args;
            const data = Object.fromEntries(
                Object.entries(rest).filter(([, v]) => v !== undefined)
            );
            const result = await serviceNow.updateRecord(table, sys_id, data);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'delete_servicenow_record',
        'Delete a record from any ServiceNow table. Use with caution as this is irreversible.',
        {
            table: z.string(),
            sys_id: z.string(),
        },
        async (args) => {
            const result = await serviceNow.deleteRecord(args.table, args.sys_id);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    return server;
}

// --- Hono App ---
const app = new Hono();

app.use(logger());
app.use('/mcp', cors());

app.get('/health', (c) => c.json({ status: 'ok', transport: 'streamable-http' }));

// MCP Streamable HTTP endpoint (stateless: new server per request)
app.all('/mcp', async (c) => {
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless mode
    });
    const server = createMcpServer();
    await server.connect(transport);
    return transport.handleRequest(c.req.raw);
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.error(`MCP HTTP server (Hono) listening on http://localhost:${info.port}`);
    console.error(`  Health: http://localhost:${info.port}/health`);
    console.error(`  MCP:    http://localhost:${info.port}/mcp`);
});
