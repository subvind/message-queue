"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueClient = void 0;
const axios_1 = require("axios");
const socket_io_client_1 = require("socket.io-client");
class MessageQueueClient {
    constructor(baseURL, config) {
        this.verbose = false;
        this.socket = null;
        if (config) {
            this.verbose = config.verbose;
        }
        this.axiosInstance = axios_1.default.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    async createExchange(name) {
        const response = await this.axiosInstance.post('/message-broker/exchange', { name });
        return response.data;
    }
    async bind(exchange, queue, routingKey) {
        const response = await this.axiosInstance.post('/message-broker/bind', { exchange, queue, routingKey });
        return response.data;
    }
    async publish(exchange, routingKey, message) {
        const response = await this.axiosInstance.post('/message-broker/publish', { exchange, routingKey, message });
        return response.data;
    }
    async consume(exchange, queue) {
        const response = await this.axiosInstance.get(`/message-broker/consume/${exchange}/${queue}`);
        return response.data;
    }
    async getQueueLength(exchange, queue) {
        const response = await this.axiosInstance.get(`/message-broker/queue-length/${exchange}/${queue}`);
        return response.data;
    }
    connectWebSocket() {
        return new Promise((resolve) => {
            this.socket = (0, socket_io_client_1.io)(this.axiosInstance.defaults.baseURL);
            this.socket.on('connect', () => {
                if (this.verbose) {
                    console.log('Connected to WebSocket server');
                }
                resolve();
            });
        });
    }
    subscribeToQueue(exchange, queue, callback) {
        return new Promise((resolve) => {
            if (!this.socket) {
                throw new Error('WebSocket is not connected. Call connectWebSocket() first.');
            }
            if (this.verbose) {
                console.log(`subscribeToQueue: ${exchange} ${queue}`);
            }
            this.socket.emit('subscribe', { exchange, queue }, (response) => {
                console.log(`Subscription response for ${exchange}/${queue}:`, response);
                this.socket.on('message', (data) => {
                    if (data.exchange === exchange && data.queue === queue) {
                        if (this.verbose) {
                            console.log(`subscribeToQueue.callback: ${data.exchange} === ${exchange} && ${data.queue} === ${queue}`, data.message);
                        }
                        callback(data.message);
                    }
                });
                resolve();
            });
        });
    }
    disconnectWebSocket() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}
exports.MessageQueueClient = MessageQueueClient;
