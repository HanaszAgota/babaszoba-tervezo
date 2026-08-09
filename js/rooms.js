"use strict";

document.addEventListener("DOMContentLoaded", function () {
   const roomsButton = document.querySelector(
       '.category-tab[data-category="rooms"]'
   );

   if (!roomsButton) {
       console.error("Nem található a Kész szobák gomb.");
       return;
   }

   const categoryNavigation = roomsButton.closest("nav");

   let roomsContainer = document.getElementById("rooms-list");

   if (!roomsContainer) {
       roomsContainer = document.createElement("div");
       roomsContainer.id = "rooms-list";
       roomsContainer.className = "rooms-list";

       if (categoryNavigation) {
           categoryNavigation.insertAdjacentElement(
               "afterend",
               roomsContainer
           );
       } else {
           roomsButton.parentElement.insertAdjacentElement(
               "afterend",
               roomsContainer
           );
       }
   }

   let rooms = [];
   let selectedRoom = null;
   let currentWall = "back";

   const wallButtons = {
       back: document.getElementById("wall-back"),
       left: document.getElementById("wall-left"),
       right: document.getElementById("wall-right"),
       front: document.getElementById("wall-front")
   };

   loadRooms();

   async function loadRooms() {
       try {
           const response = await fetch("data/rooms.json");

           if (!response.ok) {
               throw new Error(
                   "A rooms.json betöltése sikertelen."
               );
           }

           rooms = await response.json();

           if (!Array.isArray(rooms)) {
               throw new Error(
                   "A rooms.json tartalma nem megfelelő."
               );
           }

           renderRooms();
       } catch (error) {
           console.error(error);

           roomsContainer.innerHTML = `
               <div class="rooms-empty">
                   A kész szobák betöltése nem sikerült.
               </div>
           `;
       }
   }

   function renderRooms() {
       roomsContainer.innerHTML = "";

       if (rooms.length === 0) {
           roomsContainer.innerHTML = `
               <div class="rooms-empty">
                   Még nincs feltöltött kész szoba.
               </div>
           `;

           return;
       }

       rooms.forEach(function (room) {
           const roomCard = document.createElement("button");

           roomCard.type = "button";
           roomCard.className = "room-card";
           roomCard.dataset.roomId = room.id || "";

           const image = document.createElement("img");

           image.src =
               room.thumbnail ||
               room.walls?.back ||
               "";

           image.alt =
               room.name ||
               "Kész babaszoba";

           image.draggable = false;

           const roomName = document.createElement("strong");

           roomName.textContent =
               room.name ||
               "Kész babaszoba";

           roomCard.appendChild(image);
           roomCard.appendChild(roomName);

           roomCard.addEventListener("click", function () {
               selectRoom(room, roomCard);
           });

           roomsContainer.appendChild(roomCard);
       });
   }

   function selectRoom(room, roomCard) {
       selectedRoom = room;

       document
           .querySelectorAll(".room-card")
           .forEach(function (card) {
               card.classList.remove("selected");
           });

       roomCard.classList.add("selected");

       applyRoomWall(currentWall);
   }

   function applyRoomWall(wall) {
       if (!selectedRoom) {
           return;
       }

       const roomCanvas =
           document.getElementById("room-canvas");

       if (!roomCanvas) {
           console.error(
               "Nem található a room-canvas."
           );

           return;
       }

       const wallImage =
           selectedRoom.walls?.[wall] ||
           selectedRoom.thumbnail;

       if (!wallImage) {
           return;
       }

       roomCanvas.style.backgroundImage =
           `url("${wallImage}")`;

       roomCanvas.style.backgroundSize = "cover";
       roomCanvas.style.backgroundPosition = "center";
       roomCanvas.style.backgroundRepeat = "no-repeat";

       const placeholder = roomCanvas.querySelector(
           ".room-placeholder, .canvas-placeholder"
       );

       if (placeholder) {
           placeholder.style.display = "none";
       }
   }

   Object.keys(wallButtons).forEach(function (wall) {
       const button = wallButtons[wall];

       if (!button) {
           return;
       }

       button.addEventListener("click", function () {
           currentWall = wall;

           window.setTimeout(function () {
               applyRoomWall(wall);
           }, 0);
       });
   });

   document
       .querySelectorAll(".category-tab")
       .forEach(function (categoryButton) {
           categoryButton.addEventListener(
               "click",
               function () {
                   const category =
                       categoryButton.dataset.category;

                   roomsContainer.style.display =
                       category === "rooms"
                           ? "grid"
                           : "none";
               }
           );
       });

   roomsContainer.style.display =
       roomsButton.classList.contains("active")
           ? "grid"
           : "none";

   addRoomsStyles();
});

function addRoomsStyles() {
   if (document.getElementById("rooms-styles")) {
       return;
   }

   const style = document.createElement("style");

   style.id = "rooms-styles";

   style.textContent = `
       .rooms-list {
           display: grid;
           grid-template-columns: repeat(2, minmax(0, 1fr));
           gap: 12px;
           margin-top: 18px;
       }

       .room-card {
           display: flex;
           flex-direction: column;
           gap: 8px;
           padding: 8px;
           border: 1px solid rgba(47, 93, 80, 0.14);
           border-radius: 16px;
           background: #ffffff;
           color: #2f5d50;
           cursor: pointer;
           text-align: left;
           transition:
               transform 0.2s ease,
               border-color 0.2s ease,
               box-shadow 0.2s ease;
       }

       .room-card:hover {
           transform: translateY(-2px);
           border-color: #2f5d50;
           box-shadow: 0 10px 24px rgba(47, 93, 80, 0.10);
       }

       .room-card.selected {
           border: 2px solid #2f5d50;
           background: #e8efeb;
       }

       .room-card img {
           display: block;
           width: 100%;
           aspect-ratio: 1 / 1;
           object-fit: cover;
           border-radius: 12px;
       }

       .room-card strong {
           display: block;
           padding: 2px 4px 4px;
           font-size: 14px;
           line-height: 1.3;
       }

       .rooms-empty {
           grid-column: 1 / -1;
           padding: 24px 14px;
           border: 1px dashed rgba(47, 93, 80, 0.20);
           border-radius: 16px;
           text-align: center;
           color: #68746f;
       }

       @media (max-width: 700px) {
           .rooms-list {
               grid-template-columns: 1fr;
           }
       }
   `;

   document.head.appendChild(style);
}