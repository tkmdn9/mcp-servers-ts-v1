import axios, { type AxiosInstance } from 'axios';

export interface RedmineConfig {
    baseUrl: string;
    apiKey: string;
}

export interface RedmineIssue {
    id?: number;
    subject: string;
    description?: string;
    status_id?: number;
    priority_id?: number;
    project_id: number;
}

export class RedmineClient {
    private client: AxiosInstance;

    constructor(config: RedmineConfig) {
        this.client = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'X-Redmine-API-Key': config.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    async getIssues(params?: any) {
        const response = await this.client.get('/issues.json', { params });
        return response.data;
    }

    async getIssue(id: number) {
        const response = await this.client.get(`/issues/${id}.json`);
        return response.data;
    }

    async createIssue(issue: RedmineIssue) {
        const response = await this.client.post('/issues.json', { issue });
        return response.data;
    }

    async updateIssue(id: number, issue: Partial<RedmineIssue>) {
        const response = await this.client.put(`/issues/${id}.json`, { issue });
        return response.data;
    }
}
