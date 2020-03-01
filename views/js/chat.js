const socket = io();
//DOM elements.
const $messageForm = document.getElementById('message-form');
const { $messageFormInput, $messageFormButton } = $messageForm;
const $sendLocationButton = document.getElementById('send-location');
const $messages = document.getElementById('messages');
const $chatSidebar = document.getElementById('sidebar');
//Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationMessageTemplate = document.getElementById('location-message-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;
//Options
//Autoll scroll
const autollScroll = () => {
	//New message element
	const $newMessage = $messages.lastElementChild;
	//Height of the new message
	const newMessageStyles = getComputedStyle($newMessage);
	//Parsing the margin of the margin bottom of the lastElement child of $message.
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	//We update the height of the lastElement child of $message.
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
	// visible height== the height of the $message;
	const visibleHeight = $messages.offsetHeight;
	//Height of messages container
	const containerHeight = $messages.scrollHeight;
	//How far have I scrolled
	const scrollOffset = $messages.scrollTop + visibleHeight;
	if (containerHeight - newMessageHeight <= scrollOffset) {
		//containerHeight - newMessageHeight
		$messages.scrollTop = $messages.scrollHeight;
	}
};
//Parsing the query string into an object ={username,room}
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });
//When user joins the chatroom
socket.on('welcomeMessage', ({ username, text, createdAt }) => {
	const html = Mustache.render(messageTemplate, { username, text, createdAt: moment(createdAt).format('h:mm a') });
	$messages.insertAdjacentHTML('beforeend', html);
});

//when a user receives a message from another user.

socket.on('receivedMessage', ({ username, text, createdAt }) => {
	const html = Mustache.render(messageTemplate, { username, text, createdAt: moment(createdAt).format('h:mm a') });
	$messages.insertAdjacentHTML('beforeend', html);
	autollScroll();
});
//When a customer shares their location with other!!!
socket.on('onSendLocationMessage', ({ username, url, createdAt }) => {
	const html = Mustache.render(locationMessageTemplate, { username, url, createdAt: moment(createdAt).format('h:mm a') });
	$messages.insertAdjacentHTML('beforeend', html);
	autollScroll();
});
//When the customer leaves the chatroom.
socket.on('onLeaveMessage', ({ text, createdAt }) => {
	const html = Mustache.render(messageTemplate, { text, createdAt: moment(createdAt).format('h:mm a') });
	$messages.insertAdjacentHTML('beforeend', html);
	autollScroll();
});
//When a user joins the chatroom and we need to inform others.
socket.on('onJoiningMessage', ({ username, text, createdAt }) => {
	const html = Mustache.render(messageTemplate, { username, text, createdAt: moment(createdAt).format('h:mm a') });
	$messages.insertAdjacentHTML('beforeend', html);
});

//Listing all users in the room.
socket.on('room-data', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, { room, users });
	$chatSidebar.innerHTML = html;
});
$messageForm.addEventListener('submit', sendMessage);
function sendMessage(e) {
	e.preventDefault();
	$messageFormButton.disabled = true;
	$messageFormInput.focus();
	let msg = $messageFormInput.value;
	if (!msg) {
		$messageFormButton.disabled = false;
		console.log('Please,provide a message!!');
		return;
	}
	socket.emit('sentMessage', msg, (err) => {
		if (err) {
			console.error(err);
			$messageFormButton.disabled = false;
			return;
		}
		$messageFormButton.disabled = false;
		$messageFormInput.focus();
		this.reset();
	});
}
$sendLocationButton.addEventListener('click', function() {
	if (!navigator.geolocation) {
		return alert('Geolocation is not supported by your browser.');
	}
	//The sendLocation button is disabled while the user location is being fetched!!
	this.disabled = true;
	navigator.geolocation.getCurrentPosition((position) => {
		const { latitude, longitude } = position.coords;
		socket.emit('sendLocation', { latitude, longitude });
		this.disabled = false;
	}),
		(err) => {
			console.error(err);
		};
});
socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = '/';
	}
});
