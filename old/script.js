const socket = io('http://localhost:3000')
const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const name = prompt('What is your name?')
appendMessage('You joined')
socket.emit('new-user', name)

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

socket.on('user-connected', name => {
  appendMessage(`${name} connected`)
})

socket.on('user-disconnected', name => {
  appendMessage(`${name} disconnected`)
})

messageForm.addEventListener('submit', e => {
  e.preventDefault()
  const message = messageInput.value
  appendMessage(`You: ${message}`)
  socket.emit('send-chat-message', message)
  messageInput.value = ''
})

function appendMessage(message) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}



let isInRoom = false
let currentRoom = ""
let currentPlayerName = ""

function refreshRoom() { // when clicking play
  const newPlayerName = document.querySelector("#home-screen > #spawn-input > #region-selector > #spawn-nickname").getAttribute("value")
  const region = document.querySelector("#home-screen > #server-selector > #region-selector > .selector > .selected").getAttribute("value")
  const gameMode = document.querySelector("#home-screen > #server-selector > #gamemode-selector > .selector > .selected").getAttribute("value")
  const newRoom = region+"-"+gameMode
  if (newRoom != currentRoom || newPlayerName != currentPlayerName) {
    currentPlayerName = newPlayerName
    updateConnection(newRoom)
  }
}

function updateConnection(newRoom) {
  if (isInRoom) {
    socket.emit('send-user-disconnected', currentRoom, currentPlayerName)
  }
  if (rooms[currentRoom] != undefined) {
    isInRoom = true
    socket.emit('new-user', newRoom, currentPlayerName)
  } else {
    isInRoom = false
  }
  currentRoom = newRoom
}


function sendMessage(message) {
  socket.emit('send-chat-message', currentRoom, message)
}

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

socket.on('user-connected', name => {
  appendMessage(`${name} connected`)
})

socket.on('user-connected', name => {
  appendMessage(`${name} connected`)
})

socket.on('user-disconnected', name => {
  appendMessage(`${name} disconnected`)
})