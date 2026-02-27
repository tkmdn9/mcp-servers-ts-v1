import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
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

const getServiceNowRecords = createTool({
    id: 'getServiceNowRecords',
    description: `Get records from any ServiceNow table.
Table examples: incident, problem, change_request, sc_request
Query syntax (sysparm_query format):
- Simple: "state=1"
- AND: "state=1^priority=2"
- Dot-walk (reference field): "problem_id.number=PRB0040002"
- Name search: "caller_id.name=John Doe"
- Contains: "short_descriptionLIKEnetwork"`,
    inputSchema: z.object({
        table: z.string(),
        limit: z.number().optional().default(10),
        query: z.string().optional(),
    }),
    execute: async (input) => {
        const params: Record<string, unknown> = { sysparm_limit: input.limit };
        if (input.query) params.sysparm_query = input.query;
        return await serviceNow.getRecords(input.table, params);
    },
});

const createServiceNowRecord = createTool({
    id: 'createServiceNowRecord',
    description: 'Create a record in any ServiceNow table (e.g. incident, problem, change_request)',
    inputSchema: z.object({
        table: z.string(),
        short_description: z.string(),
        description: z.string().optional(),
    }),
    execute: async (input) => {
        const { table, ...record } = input;
        return await serviceNow.createRecord(table, record);
    },
});

export const agent = new Agent({
    id: 'enterprise-brain',
    name: 'Enterprise Brain',
    instructions: `あなたはRedmineとServiceNowのタスクをサポートするAIアシスタントです。
  必ず日本語で回答してください。
  提供されたツールを使ってレポートの取得、課題の作成、インシデントの管理を行います。
  ServiceNowについては、getServiceNowRecordsとcreateServiceNowRecordを使って
  incident、problem、change_request、sc_requestなど任意のテーブルにアクセスできます。

  ServiceNowのクエリ構文（queryパラメータ）:
  - 単一条件: "state=1"
  - AND条件: "state=1^priority=2"
  - 参照フィールド(dot-walk): "problem_id.number=PRB0040002"
  - 部分一致: "short_descriptionLIKEキーワード"

  重要: incident.problem_idはsys_idへの参照フィールドのため、
  PRB番号で検索する場合は必ず "problem_id.number=PRB0040002" の形式を使うこと。`,
    model: openai('gpt-4o'),
    tools: {
        getRedmineIssues,
        createRedmineIssue,
        getServiceNowIncidents,
        createServiceNowIncident,
        getServiceNowRecords,
        createServiceNowRecord,
    },
});

export const mastra = new Mastra({
    agents: { agent },
});
