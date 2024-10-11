// ==UserScript==
// @name         Diep Copy Link While Alive
// @namespace    none
// @version      1.0
// @description  Adds a button to copy the party link while alive
// @author       Clever Yeti
// @match        https://*diep.io/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

setTimeout(() => {
    console.log("initialising diep copy link button")

    let newEl = document.createElement("div")
    let buttonEl = document.createElement("button")
    buttonEl.addEventListener("click", () => {document.getElementById("copy-party-link").click()})
    newEl.appendChild(buttonEl)
    buttonEl.innerHTML = `
        <div class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="width: 1.4em; height: 1.4em">
                ${document.getElementById("copy-party-link").querySelector(".icon > svg").innerHTML}
            </svg>
        </div>`

    document.getElementById("in-game-quick-buttons").insertBefore(newEl, document.getElementById("in-game-quick-buttons").children[1]);
}, 5000)