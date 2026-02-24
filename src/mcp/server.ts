import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { RedmineClient } from '../api/redmine.ts';
import { ServiceNowClient } from '../api/servicenow.ts';

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
        return await serviceNow.getRecords('incident', { sysparm_limit: args.limit });
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
        return await serviceNow.createRecord('incident', args);
    },
});

// Start the server
mcp.start({ transportType: 'stdio' });
console.error('FastMCP server started with stdio transport');
