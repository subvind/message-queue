import axios, { AxiosInstance } from 'axios';

export class DatabaseClient {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async createUser(username: string, password: string): Promise<string> {
    const response = await this.axiosInstance.post('/storage/user', { username, password });
    return response.data;
  }

  async login(username: string, password: string): Promise<void> {
    const response = await this.axiosInstance.post('/storage/login', { username, password });
    this.token = response.data.access_token;
  }

  async assignUserToDatabase(dbIndex: number): Promise<string> {
    const response = await this.axiosInstance.post('/storage/assign-db', { dbIndex }, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async rpush(dbIndex: number, key: string, values: string[]): Promise<number> {
    const response = await this.axiosInstance.post(`/storage/rpush/${dbIndex}/${key}`, { values }, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async lrange(dbIndex: number, key: string, start: number, stop: number): Promise<string[]> {
    const response = await this.axiosInstance.get(`/storage/lrange/${dbIndex}/${key}`, {
      params: { start, stop },
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async lpop(dbIndex: number, key: string): Promise<string | null> {
    const response = await this.axiosInstance.post(`/storage/lpop/${dbIndex}/${key}`, {}, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async llen(dbIndex: number, key: string): Promise<number> {
    const response = await this.axiosInstance.get(`/storage/llen/${dbIndex}/${key}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async createSnapshot(): Promise<string> {
    const response = await this.axiosInstance.post('/storage/snapshot', {}, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async set(dbIndex: number, key: string, value: string): Promise<string> {
    const response = await this.axiosInstance.post(`/storage/set/${dbIndex}/${key}`, { value }, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async get(dbIndex: number, key: string): Promise<string | null> {
    const response = await this.axiosInstance.get(`/storage/get/${dbIndex}/${key}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async incr(dbIndex: number, key: string): Promise<number> {
    const response = await this.axiosInstance.post(`/storage/incr/${dbIndex}/${key}`, {}, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async sadd(dbIndex: number, key: string, members: string[]): Promise<number> {
    const response = await this.axiosInstance.post(`/storage/sadd/${dbIndex}/${key}`, { members }, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async smembers(dbIndex: number, key: string): Promise<string[]> {
    const response = await this.axiosInstance.get(`/storage/smembers/${dbIndex}/${key}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async sismember(dbIndex: number, key: string, member: string): Promise<boolean> {
    const response = await this.axiosInstance.get(`/storage/sismember/${dbIndex}/${key}/${member}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async del(dbIndex: number, keys: string[]): Promise<number> {
    const response = await this.axiosInstance.post(`/storage/del/${dbIndex}`, { keys }, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async exists(dbIndex: number, keys: string[]): Promise<number> {
    const response = await this.axiosInstance.get(`/storage/exists/${dbIndex}`, {
      params: { keys },
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async expire(dbIndex: number, key: string, seconds: number): Promise<boolean> {
    const response = await this.axiosInstance.post(`/storage/expire/${dbIndex}/${key}`, { seconds }, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async deleteDatabase(dbIndex: number): Promise<string> {
    const response = await this.axiosInstance.delete(`/storage/database/${dbIndex}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async getDatabaseInfo(dbIndex: number): Promise<any> {
    const response = await this.axiosInstance.get(`/storage/database/${dbIndex}/info`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async getUserInfo(): Promise<any> {
    const response = await this.axiosInstance.get('/storage/user/info', {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async listDatabases(): Promise<number[]> {
    const response = await this.axiosInstance.get('/storage/databases', {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async listUsers(): Promise<string[]> {
    const response = await this.axiosInstance.get('/storage/users', {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }
}