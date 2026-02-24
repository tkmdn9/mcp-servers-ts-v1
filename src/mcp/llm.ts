import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { RedmineClient } from '../api/redmine';
import { ServiceNowClient } from '../api/servicenow';

// Initialize clients
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

// Mastra Tools
const getRedmineIssues = createTool({
    id: 'getRedmineIssues',
    description: 'Get issues from Redmine',
    inputSchema: z.object({
        project_id: z.number().optional(),
        status_id: z.string().optional(),
    }),
    execute: async (input) => {
        return await redmine.getIssues(input);
    },
});

const createRedmineIssue = createTool({
    id: 'createRedmineIssue',
    description: 'Create a new issue in Redmine',
    inputSchema: z.object({
        project_id: z.number(),
        subject: z.string(),
        description: z.string().optional(),
    }),
    execute: async (input) => {
        return await redmine.createIssue(input);
    },
});

const getServiceNowIncidents = createTool({
    id: 'getServiceNowIncidents',
    description: 'Get incidents from ServiceNow',
    inputSchema: z.object({
        limit: z.number().optional().default(10),
    }),
    execute: async (input) => {
        return await serviceNow.getRecords('incident', { sysparm_limit: input.limit });
    },
});

const createServiceNowIncident = createTool({
    id: 'createServiceNowIncident',
    description: 'Create a new incident in ServiceNow',
    inputSchema: z.object({
        short_description: z.string(),
        description: z.string().optional(),
    }),
    execute: async (input) => {
        return await serviceNow.createRecord('incident', input);
    },
});

export const agent = new Agent({
    id: 'enterprise-brain',
    name: 'Enterprise Brain',
    instructions: `You are an AI assistant that can help with Redmine and ServiceNow tasks.
  Use the provided tools to fetch reports, create issues, and manage incidents.`,
    model: {
        providerId: 'OPENAI',
        modelId: 'gpt-4o',
    },
    tools: {
        getRedmineIssues,
        createRedmineIssue,
        getServiceNowIncidents,
        createServiceNowIncident,
    },
});

export const mastra = new Mastra({
    agents: { agent },
});
