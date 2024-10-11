// ==UserScript==
// @name         Diep Chat
// @namespace    none
// @version      1.0
// @description  Press t to open chat
// @author       Clever Yeti
// @match        https://*diep.io/*
// @grant        none
// @run-at       document-idle
// @require https://raw.githubusercontent.com/CleverYeti/diepChat/refs/heads/main/socket.io.js
// ==/UserScript==
setTimeout(()=>{
  function addScript(src) {
    var s = document.createElement("script");
    s.setAttribute("src", src);
    document.body.appendChild(s);
  }
  addScript("https://raw.githubusercontent.com/CleverYeti/diepChat/refs/heads/main/socket.io.js")
},2000)



setTimeout(initChat, 5000)
function initChat() {
  console.log("initialising diep chat")

  const messageDuration = 10
  const chatSocket = io('https://diep-chat.onrender.com/')

  const style = `
  #chat {
    --ui-scale: calc((var(--scale-height) + var(--scale-width)) / 3000);
    --ui-scale: max(calc(100vh / 1080 * 1.5), calc(100vw / 1920) * 1.5);
    font-size: calc(16 * var(--ui-scale));
    position: fixed;
    bottom: calc(200 * var(--ui-scale));
    left: calc(30 * var(--ui-scale));
    width: calc(300 * var(--ui-scale));
    background: #00000044;
    border-radius: calc(10 * var(--ui-scale));
    display: flex;
    flex-direction: column;
    z-index: 1000;
  }

  body:has(#in-game-screen.active) #chat {
    pointer-events: none;
    touch-events: none;
  }

  #chat > .input {
    display: block;
    width: auto;
    height: calc(20 * var(--ui-scale));
    border-radius: calc(10 * var(--ui-scale));
    padding-left: calc(10 * var(--ui-scale));
    border: none;
    background: var(--uicolor-3);
    box-shadow: inset 0 0 0 calc(2 * var(--ui-scale)) rgba(0,0,0,0.25);
    color: white;
    font-size: calc(16 * var(--ui-scale));
  }
  #chat > .input:focus {
    background: #333333;
  }


  #chat > .message {
    display: grid;
    grid-template-columns: auto 1fr;
    color: white;
    gap:  calc(10 * var(--ui-scale));
    padding: calc(2 * var(--ui-scale)) calc(10 * var(--ui-scale));
    width: 100%;
  }

  #chat > .message > .playerName {
    -webkit-text-stroke: 1px white;
  }
  #chat > .message.you > .playerName {
    color: var(--netcolor2);
    -webkit-text-stroke: 1px var(--netcolor2);
  }

  #chat > .message > .text {
    text-wrap: wrap;
    width: 100%;
  }

  `


  
  const regions = {
    "atl": "Atlanta",
    "lax": "Los Angeles",
    "fra": "Frankfurt",
    "osa": "Osaka",
    "syd": "Sydney"
  }
  const gameModes = {
    "ffa": "FFA",
    "teams": "2TDM",
    "4teams": "4TDM",
    "event": "Event",
    "maze": "Maze"
  }
  
  let rooms = {}
  for (let [regionCode, regionName] of Object.entries(regions)) {
    for (let [gameModeCode, gameModeName] of Object.entries(gameModes)) {
      rooms[regionCode+"-"+gameModeCode] = {name: regionName+" " +gameModeName}
    }
  }
  
  let isChatOpen = false
  let isInRoom = false
  let currentRoom = ""
  let currentPlayerName = ""
  let lastPlayerCountTime = Date.now()
  let currentPlayerCount = 0
  
  const maxAcceptableInterval = 30000
  const connectionCheckInterval = 5000

  const version = "1.1"

  // check version
  (async () => {
    const response = await (await fetch("https://raw.githubusercontent.com/CleverYeti/diepChat/refs/heads/main/version.json")).json()
    if (version != response.version) {
      appendMessage("", "Your version of DiepChat (v" + version + ") is out of date, it may not work properly. you can download the new version (v" + response.version + ") from https://github.com/CleverYeti/diepchat")
    }
  })()
  

  let chatStyleEl = document.createElement("style")
  chatStyleEl.innerHTML = style
  document.body.appendChild(chatStyleEl)
  
  let chatEl = document.createElement("div")
  chatEl.id = "chat"
  document.body.appendChild(chatEl)
  
  let chatInputEl = document.createElement("input")
  chatInputEl.classList.add("input")
  chatInputEl.type = "text"
  chatInputEl.placeholder = "Press T to chat"
  chatEl.appendChild(chatInputEl)
  chatInputEl.addEventListener("blur", ()=>{
    isChatOpen = false
  })
  chatInputEl.addEventListener("focus", ()=>{
    isChatOpen = true
  })
  
  document.addEventListener("keydown", (event) => {
    const isInGame = document.querySelector("#in-game-screen.active") != null
    const isTypingName = document.querySelector("#spawn-nickname:focus") != null
    
    if (isChatOpen) event.stopPropagation()
      if (event.key == "Enter") {
        if (isChatOpen) {
        console.log("send")
        sendMessage(chatInputEl.value)
        chatInputEl.value = ""
        chatInputEl.blur()
      }
    }
    if (event.key == "Escape") {
      if (isChatOpen) {
        event.stopPropagation()
        chatInputEl.blur()
      }
    }
    if (event.which == 84) { // t key
      if (!isChatOpen && !isTypingName) {
        isChatOpen = true
        event.stopPropagation()
        setTimeout(()=>{
          chatInputEl.focus()
        }, 0)
      }
    }
  })

  function appendMessage(sender, message = "", isYou = false) {
    const messageEl = document.createElement("div")
    messageEl.classList.add("message")
    if (isYou) messageEl.classList.add("you")

    const playerNameEl = document.createElement("div")
    playerNameEl.classList.add("playerName")
    playerNameEl.innerText = sender
    messageEl.appendChild(playerNameEl)
    const textEl = document.createElement("div")
    textEl.classList.add("text")
    textEl.innerText = message
    messageEl.appendChild(textEl)

    chatEl.insertBefore(messageEl, chatInputEl)
    setTimeout(()=>{
      messageEl.remove()
    }, messageDuration * 1000)
  }

  setInterval(refreshRoom, 1000)

  function refreshRoom() { // when clicking play
    const isInGame = document.querySelector("#in-game-screen.active") != null
    if (!isInGame) return    
    
    let newPlayerName = null
    const nameEl = document.querySelector("#spawn-nickname")
    if (nameEl) newPlayerName = nameEl.value
    if (newPlayerName === "") newPlayerName = "Unnamed player"

    let newRegion = null
    const regionEl = document.querySelector("#home-screen > #server-selector > #region-selector > .selector > .selected")
    if (regionEl) newRegion = regionEl.getAttribute("value")

    let newGameMode = null
    const gameModeEl = document.querySelector("#home-screen > #server-selector > #gamemode-selector > .selector > .selected")
    if (gameModeEl) newGameMode = gameModeEl.getAttribute("value")
    
    if (newPlayerName !== null && newRegion !== null && newGameMode !== null) {
      const newRoom = newRegion + "-" + newGameMode
      if (newRoom !== currentRoom || newPlayerName !== currentPlayerName) {
        console.log("login change", newRoom, newPlayerName)
        currentPlayerName = newPlayerName
        updateConnection(newRoom)
      }
    }
  }

  async function updateConnection(newRoom) {
    console.log("connection update")
    if (isInRoom) {
      const room = currentRoom
      const response1 = await chatSocket.emit('send-user-disconnected', room, currentPlayerName)
      if (response1.connected) {
        appendMessage("You left "+ rooms[room].name, "", true)
      } else {
        appendMessage("Failed to leave room")
      }
    }
    if (rooms[newRoom] != undefined) {
      isInRoom = true
      const room = newRoom
      const name = currentPlayerName
      const response2 = await chatSocket.emit('new-user', room, name)
      if (response2.connected) {
        appendMessage("You joined " + rooms[room].name + " as " + name, "", true)
      } else {
        appendMessage("Failed to join room")
      }
    } else {
      isInRoom = false
    }
    currentRoom = newRoom
  }


  async function sendMessage(message) {
    if (!isInRoom) {
      appendMessage("Cannot send message - no room connected")
      return
    }
    if (message == "") return
    const name = currentPlayerName
    const response = await chatSocket.emit('send-chat-message', currentRoom, message)
    if (response.connected) {
      appendMessage(name + ":", message, true)
    } else {
      appendMessage("Failed sending message")
    }
  }

  chatSocket.on('chat-message', data => {
    appendMessage(data.name + ":", data.message, false)
  })

  chatSocket.on('server-message', message => {
    appendMessage("", message)
  })

  chatSocket.on('user-connected', name => {
    appendMessage(name + " joined the chat", "", false)
  })

  chatSocket.on('user-disconnected', name => {
    appendMessage(name + " left the chat", "", false)
  })

  chatSocket.on('connection-check', playerCount => {
    if (playerCount != currentPlayerCount) {
      currentPlayerCount = playerCount
      appendMessage("", playerCount + " players are in chat", false)
    }
  })

  setInterval(() => {
    if (Date.now() - lastPlayerCountTime > maxAcceptableInterval) {
      appendMessage("", "No mesage from server in the last "+ Math.floor((Date.now() - lastPlayerCountTime)/1000) + " seconds, chat may have disconnected", false)
    }
  }, connectionCheckInterval)
}



