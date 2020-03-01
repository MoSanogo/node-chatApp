const express = require('express');
const http = require('http');
const helmet = require('helmet');
const path = require('path');
const socketIo = require('socket.io');
const Filter = require('bad-words');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');
app.use(helmet());
app.use(express.static(path.join(__dirname, '../views')));
io.on('connection', (socket) => {
	socket.on('join', ({ username, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, username, room });
		if (error) {
			return callback(error);
		}
		socket.join(user.room);
		socket.emit('welcomeMessage', generateMessage('Admin', `Welcome ${user.username} `));
		socket.broadcast.to(user.room).emit('onJoiningMessage', generateMessage('Admin', `${user.username} has joined`));
		io.to(user.room).emit('room-data', {
			room: user.room,
			users: getUsersInRoom(user.room)
		});
		callback();
	});
	socket.on('sentMessage', (msg, callback) => {
		const user = getUser(socket.id);
		const filter = new Filter();
		if (user) {
			if (filter.isProfane(msg)) {
				return callback(generateMessage('Profanity is not allowed'));
			}

			io.to(user.room).emit('receivedMessage', generateMessage(user.username, msg));
			//the server can choose to provide some data;
			callback();
		}
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit('onLeaveMessage', generateMessage(`${user.username} has left !!`));

			io.to(user.room).emit('room-data', {
				room: user.room,
				users: getUsersInRoom(user.room)
			});
		}
	});
	socket.on('sendLocation', ({ latitude, longitude }) => {
		const user = getUser(socket.id);
		if (user) {
			io.to(user.room).emit('onSendLocationMessage', generateLocationMessage(`${user.username}`, `https://google.com/maps?q=${latitude},${longitude}`));
		}
	});
});

const port = process.env.PORT || 5000;
server.listen(port);
