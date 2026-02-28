import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { RedmineClient } from '../api/redmine';
import { ServiceNowClient } from '../api/servicenow';
import { getFieldsDescription } from '../config/servicenow-fields';

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

const updateRedmineIssue = createTool({
    id: 'updateRedmineIssue',
    description: `Update an existing issue in Redmine.
status_id: 1=New, 2=In Progress, 3=Resolved, 4=Feedback, 5=Closed, 6=Rejected
priority_id: 1=Low, 2=Normal, 3=High, 4=Urgent, 5=Immediate`,
    inputSchema: z.object({
        id: z.number(),
        subject: z.string().optional(),
        description: z.string().optional(),
        status_id: z.number().optional(),
        priority_id: z.number().optional(),
        assigned_to_id: z.number().optional(),
        notes: z.string().optional(),
    }),
    execute: async (input) => {
        const { id, ...issue } = input;
        return await redmine.updateIssue(id, issue);
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
- Contains: "short_descriptionLIKEnetwork"
Fields example: "number,short_description,state,priority,caller_id,assignment_group,opened_at"
Set display_value=true to show human-readable values for reference fields (caller name, group name, etc.)`,
    inputSchema: z.object({
        table: z.string(),
        limit: z.number().optional().default(10),
        query: z.string().optional(),
        fields: z.string().optional(),
        display_value: z.boolean().optional().default(true),
    }),
    execute: async (input) => {
        const params: Record<string, unknown> = { sysparm_limit: input.limit };
        if (input.query) params.sysparm_query = input.query;
        if (input.fields) params.sysparm_fields = input.fields;
        params.sysparm_display_value = input.display_value ? 'true' : 'false';
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

const updateServiceNowRecord = createTool({
    id: 'updateServiceNowRecord',
    description: `Update a record in any ServiceNow table.
State values by table:
  incident: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed
  problem: 100=Open, 102=Known Error, 103=Pending Change, 104=Closed/Resolved
  change_request: -5=New, -4=Assess, -3=Authorize, -2=Scheduled, -1=Implement, 0=Review, 3=Closed
close_code examples (incident): "Solved (Permanently)", "Solved (Work Around)", "Not Solved (Not Reproducible)"
Use work_notes to add internal notes without notifying the caller.`,
    inputSchema: z.object({
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
    execute: async (input) => {
        const { table, sys_id, ...rest } = input;
        const data = Object.fromEntries(
            Object.entries(rest).filter(([, v]) => v !== undefined)
        );
        return await serviceNow.updateRecord(table, sys_id, data);
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
  PRB番号で検索する場合は必ず "problem_id.number=PRB0040002" の形式を使うこと。

  取得項目を指定する場合は fields パラメータを使うこと。
  「全ての項目を取得」「全フィールド」と言われた場合は fields を省略すること（省略すると全フィールド100以上が返る）。
  以下は代表的なフィールド例であり、これ以外も自由に指定可能:
${getFieldsDescription()}

  参照フィールド（caller_id, assignment_group等）は {display_value: "名前", link: "URL"} の形式で返る。
  表示する際は display_value の値のみを使い、link や URL は表示しないこと。`,
    model: openai('gpt-4o'),
    tools: {
        getRedmineIssues,
        createRedmineIssue,
        updateRedmineIssue,
        getServiceNowIncidents,
        createServiceNowIncident,
        getServiceNowRecords,
        createServiceNowRecord,
        updateServiceNowRecord,
    },
});

export const mastra = new Mastra({
    agents: { agent },
});
