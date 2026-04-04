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
const InitWorkers_1 = __importDefault(require("./InitWorkers"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: '*' },
});
io.on('connection', (socket) => {
    console.log('Worker Client Connected:', socket.id);
    socket.on('message', async (data) => {
        const { type } = data;
        switch (type) {
            case 'start-working':
                send(socket, 'start-working-response', 'Workers Started');
                (0, InitWorkers_1.default)(io);
                break;
            default:
                break;
        }
    });
});
const send = (socket, type, message) => {
    socket.emit('message', { type, message });
};
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Worker server running on port ${PORT}`);
});
