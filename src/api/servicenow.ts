import axios, { type AxiosInstance } from 'axios';
import { Buffer } from 'node:buffer';

export interface ServiceNowConfig {
    instance: string;
    username?: string;
    password?: string;
    accessToken?: string;
}

export interface ServiceNowRecord {
    sys_id?: string;
    short_description: string;
    description?: string;
    [key: string]: any;
}

export class ServiceNowClient {
    private client: AxiosInstance;

    constructor(config: ServiceNowConfig) {
        const base = config.instance.startsWith('http')
            ? config.instance.replace(/\/$/, '')
            : `https://${config.instance}.service-now.com`;
        const baseURL = `${base}/api/now/table`;
        const headers: any = {
            'Content-Type': 'application/json',
        };

        if (config.accessToken) {
            headers['Authorization'] = `Bearer ${config.accessToken}`;
        } else if (config.username && config.password) {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }

        this.client = axios.create({
            baseURL,
            headers,
        });
    }

    async getRecords(tableName: string, params?: any) {
        const response = await this.client.get(`/${tableName}`, { params });
        return response.data;
    }

    async getRecord(tableName: string, sysId: string) {
        const response = await this.client.get(`/${tableName}/${sysId}`);
        return response.data;
    }

    async createRecord(tableName: string, record: ServiceNowRecord) {
        const response = await this.client.post(`/${tableName}`, record);
        return response.data;
    }

    async updateRecord(tableName: string, sysId: string, record: Partial<ServiceNowRecord>) {
        const response = await this.client.put(`/${tableName}/${sysId}`, record);
        return response.data;
    }

    async deleteRecord(tableName: string, sysId: string) {
        await this.client.delete(`/${tableName}/${sysId}`);
        return { success: true, message: `Record ${sysId} deleted from ${tableName}` };
    }
}
