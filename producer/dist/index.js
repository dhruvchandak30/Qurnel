"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const PopulateDataInRedis_1 = __importDefault(require("./PopulateDataInRedis"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
let ws = null;
io.on('connection', (socket) => {
    console.log('User Connected', socket.id);
    ws = socket;
    socket.on('message', async (data) => {
        const { type, message } = data;
        switch (type) {
            case 'populate-data':
                await (0, PopulateDataInRedis_1.default)();
                send(socket, 'populate-data-response', 'Populated Data in Redis Queues');
                break;
            case 'get-updates':
                break;
            default:
                send;
                break;
        }
    });
});
const send = (ws, type, message) => {
    const msg = {
        type,
        message,
    };
    ws.emit('message', msg);
};
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WS Server running on port ${PORT}`);
    (0, PopulateDataInRedis_1.default)();
});
