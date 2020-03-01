//The state of the chatroom;

const users = [];
//addUser,removeUser,getUser,getUsersInRoom;
const addUser = ({ id, username, room }) => {
	//clean the data;
	username = username.trim().toLowerCase();
	room = room.trim().toLowerCase();
	//validate the data;
	if (!username || !room) {
		return {
			error: 'Username and room are required!'
		};
	}
	//check for existing user;
	const existingUser = users.find((user) => {
		return user.room === room && user.username === username;
	});
	//validate username;
	if (existingUser) {
		return {
			error: 'username is in use!!'
		};
	}
	//store
	const user = { id, username, room };
	users.push(user);
	return {
		user
	};
};
//Remove user
const removeUser = (id) => {
	const index = users.findIndex((user) => user.id == id);
	if (index) {
		return users.splice(index, 1)[0];
	}
};
//Get user
const getUser = (id) => {
	return users.find((user) => user.id === id);
};
//Get users
const getUsersInRoom = (room) => {
	return users.filter((user) => user.room.trim().toLowerCase() === room.trim().toLowerCase());
};

module.exports = { addUser, removeUser, getUser, getUsersInRoom };
