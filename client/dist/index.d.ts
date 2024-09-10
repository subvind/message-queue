export declare class MessageQueueClient {
    private verbose;
    private axiosInstance;
    private socket;
    constructor(baseURL: string, config?: any);
    createExchange(name: string): Promise<any>;
    bind(exchange: string, queue: string, routingKey: string): Promise<any>;
    publish(exchange: string, routingKey: string, message: any): Promise<any>;
    consume(exchange: string, queue: string): Promise<any>;
    getQueueLength(exchange: string, queue: string): Promise<any>;
    connectWebSocket(): Promise<void>;
    subscribeToQueue(exchange: string, queue: string, callback: (message: any) => void): Promise<void>;
    disconnectWebSocket(): void;
}
