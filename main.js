const socket = io('http://localhost:3001');
let localStream;
let videoTrack; 
let audioTrack;

function openStream() {
    const config = { audio: true, video: true };  // Bật cả mic và camera
    return navigator.mediaDevices.getUserMedia(config);
}
function updateTracks(stream) {
    localStream = stream;
    audioTrack = localStream.getAudioTracks()[0];  // Lấy lại track audio
    videoTrack = localStream.getVideoTracks()[0];  // Lấy lại track video
}
function playStream(idVideoTag, stream){
    const video = document.getElementById(idVideoTag);
    video.srcObject = stream;
    video.play().catch(error => {
        console.error('Error playing the video:', error);
    });
};

openStream()
.then(stream => {
    localStream = stream;
    updateTracks(stream);
     playStream('localStream', stream);});
const peer = new Peer();
peer.on('open', id =>{
     $('#my-peer').append(id);
   
    $('#btnSignUp').click(() => {
    const username = $('#txtUsername').val();
    if (!username) { // Kiểm tra nếu username trống
        alert("Please enter a username!"); // Hiển thị thông báo lỗi
        return;
    }
    socket.emit('dang-ky', {ten: username, peerId: id});
    $('#home').hide();  
    $('#room').show();
});
});
$('#btnToggleMic').click(() => {
    if (!audioTrack) {
        console.error("Local stream is not initialized.");
        return;
    }
    if (audioTrack.enabled) {
        audioTrack.enabled = false;  // Tắt mic
        $('#btnToggleMic').text('Unmute Mic');  // Thay đổi văn bản nút
    } else {
        audioTrack.enabled = true;  // Bật mic
        $('#btnToggleMic').text('Mute Mic');  // Thay đổi văn bản nút
    }
});

// Chức năng bật/tắt camera
$('#btnToggleCamera').click(() => {
    if (!videoTrack) {
        console.error("Video track is not available.");
        return;
    }
    if (videoTrack.enabled) {
        videoTrack.enabled = false;  // Tắt camera
        $('#btnToggleCamera').text('Turn On Camera');
    } else {
        videoTrack.enabled = true;  // Bật camera
        $('#btnToggleCamera').text('Turn Off Camera');
    }
});

socket.on('danh-sach', (arrUserInfo) => {
    const userList = $('#userList');
    userList.empty();  // Xóa danh sách cũ trước khi thêm mới

    // Duyệt qua danh sách người dùng và hiển thị
    arrUserInfo.forEach(user => {
        userList.append(`<li>${user.ten} (${user.peerId})</li>`);
    });
});
$('#btnCall').click(() => {
    const id = $('#remoteId').val();
    if (!id || id.trim() === "") {
        alert("Please enter a valid ID to call."); // Hiển thị thông báo nếu ID trống
        return;
    }
    const userExists = $('#userList').find(`li:contains(${id})`).length > 0;
if (!userExists) {
    alert("The ID does not exist. Please check and try again.");
    return;
}
    openStream()
        .then(stream => {
            updateTracks(stream);
            playStream('localStream', stream);

            // Thực hiện cuộc gọi
            const call = peer.call(id, stream);

            if (!call) {
                alert("The ID is invalid or not available."); // Hiển thị thông báo nếu không gọi được
                return;
            }
            $('#my-peer').text(`Your Room: ${id}`);
            // Xử lý sự kiện khi không thể kết nối
            call.on('error', (error) => {
                console.error("Call failed:", error);
                alert("Failed to establish a call. Please check the Peer ID and try again.");
                $('#chatBox').hide(); // Ẩn khung chat nếu không gọi được
            });

            // Hiển thị khung chat khi gọi thành công
            $('#chatBox').show();

            // Xử lý khi nhận được stream từ người nhận
            call.on('stream', remoteStream => playStream('remoteStream', remoteStream));

            // Xử lý khi cuộc gọi kết thúc
            call.on('close', () => {
                $('#chatBox').hide(); // Ẩn khung chat khi kết thúc cuộc gọi
            });
        })
        .catch(error => {
            console.error("Error during call setup:", error);
            alert("Unable to access your camera or microphone. Please check your settings."); // Thông báo lỗi nếu không mở được stream
        })
})

peer.on('call', call => {
    openStream()
    .then(stream =>{
        call.answer(stream);
        updateTracks(stream);
        playStream('localStream', stream);
        $('#chatBox').show();
        call.on('stream', remoteStream => playStream('remoteStream',remoteStream));
        call.on('close', () => {
            $('#chatBox').hide(); // Ẩn khung chat khi kết thúc cuộc gọi
        });
    });
});
$('#sendMessage').click(() => {
    const message = $('#chatMessage').val(); // Lấy nội dung tin nhắn
    if (message.trim() !== "") {
        const username = $('#txtUsername').val(); // Tên người gửi
        socket.emit('chat-message', { username, message }); // Gửi tin nhắn tới server
        $('#chatMessage').val(''); // Xóa nội dung sau khi gửi
    }
});

// Nhận tin nhắn từ server và hiển thị
socket.on('chat-message', (data) => {
    const { username, message } = data;
    const messages = $('#messages');
    messages.append(`<p><b>${username}:</b> ${message}</p>`); // Thêm tin nhắn vào danh sách
    messages.scrollTop(messages[0].scrollHeight); // Cuộn xuống cuối khung chat
});
