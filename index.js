/*const express = require('express');
const http = require('http');
const io = require('socket.io')(3001);
const Peer = require('peer').Peer;
const app = express();
const server = http.createServer(app);


io.on('connection', (socket) => {
    console.log(socket.id);
});
server.listen(3001, () => {
    console.log('Server running on port 3000');
});
*/
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const arrUserInfo = [];
const app = express();
const server = http.createServer(app);

// Cấu hình CORS cho phép frontend từ cổng 5500
const io = socketIo(server, {
    cors: {
        origin: ["https://project-i-54t6.onrender.com"], // Frontend đang chạy trên cổng này
        methods: ["GET", "POST"]
    }
});
app.use(express.static('./'));
const userList = [];
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Sự kiện 'dang-ky': Đăng ký người dùng
    socket.on('dang-ky', (user) => {
        const { ten, peerId } = user;
        
        // Kiểm tra xem người dùng đã tồn tại hay chưa
        if (!arrUserInfo.some((u) => u.peerId === peerId)) {
            arrUserInfo.push({ ten, peerId, socketId: socket.id });
            console.log('User registered:', { ten, peerId });

            // Gửi danh sách người dùng đến tất cả client
            io.emit('danh-sach', arrUserInfo);
        } else {
            console.log('User already registered:', { ten, peerId });
        }
    });

    // Xử lý khi client ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Xóa người dùng khỏi danh sách khi ngắt kết nối
        const index = arrUserInfo.findIndex((u) => u.socketId === socket.id);
        if (index !== -1) {
            arrUserInfo.splice(index, 1);
            console.log('Updated user list:', arrUserInfo);

            // Gửi danh sách mới đến các client
            io.emit('danh-sach', arrUserInfo);
        }
    });

    // Lắng nghe sự kiện 'message' từ client (ví dụ)
    socket.on('message', (data) => {
        console.log('Received message:', data);
    });
    socket.on('chat-message', (data) => {
    const { username, message } = data;
    
    // Thêm tin nhắn vào danh sách
   // Cuộn xuống cuối khung chat
    console.log(`Received message from ${data.username}: ${data.message}`);
    io.emit('chat-message', data);
});
});


server.listen(3001, () => {
    console.log('Server running on port 3001');
});

