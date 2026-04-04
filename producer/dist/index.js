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
    },
});
io.on('connection', (socket) => {
    console.log('Producer Client Connected:', socket.id);
    socket.on('message', async (data) => {
        const { type } = data;
        console.log('Got Message', data);
        switch (type) {
            case 'populate-data':
                console.log('Populate Data Message Type triggered');
                await (0, PopulateDataInRedis_1.default)();
                send(socket, "populate-data-response", "Data populated in Redis");
                break;
            default:
                break;
        }
    });
});
const send = (socket, type, message) => {
    socket.emit('message', { type, message });
};
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Producer running on port ${PORT}`);
});
