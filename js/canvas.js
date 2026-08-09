"use strict";

let roomCanvas = null;
let placedItems = [];
window.placedItems = placedItems;
let activeWall = "back";

let wallItems = {
    back: [],
    left: [],
    right: [],
    front: []
};

let frontWallVisible = true;

window.wallItems = wallItems;

let selectedItem = null;
let highestZIndex = 1;
let undoStack = [];
let redoStack = [];


const MAX_HISTORY =50;

document.addEventListener("DOMContentLoaded", function () {
   roomCanvas = document.getElementById("room-canvas");

   const deleteButton = document.getElementById("delete-selected");
   const bringForwardButton = document.getElementById("bring-forward");
   const sendBackwardButton = document.getElementById("send-backward");
   const wallBackButton = document.getElementById("wall-back");
   const wallLeftButton = document.getElementById("wall-left");
   const wallRightButton = document.getElementById("wall-right");
   const wallFrontButton = document.getElementById("wall-front");
   const toggleFrontWallButton = document.getElementById("toggle-front-wall");

document.querySelectorAll(".wall-color-picker").forEach(function (picker) {

   picker.addEventListener("input", function () {

       roomCanvas.style.backgroundImage = "none";
       roomCanvas.style.backgroundColor = this.value;

   });

});

   if (wallBackButton) {
   wallBackButton.addEventListener("click", function () {
       switchWall("back");
   });
}

if (wallLeftButton) {
   wallLeftButton.addEventListener("click", function () {
       switchWall("left");
   });
}

if (wallRightButton) {
   wallRightButton.addEventListener("click", function () {
       switchWall("right");
   });
}

if (wallFrontButton) {
   wallFrontButton.addEventListener("click", function () {
       switchWall("front");
   });
}

if (toggleFrontWallButton) {
   toggleFrontWallButton.addEventListener("click", function () {
       toggleFrontWall();
   });
}

updateActiveWallButton();
updateWallCanvasAppearance();


   document.querySelectorAll(".wall-menu-button").forEach(function(button){

       button.addEventListener("click", function(e){

           e.stopPropagation();

           document.querySelectorAll(".wall-menu").forEach(function(menu){

               if(menu !== button.nextElementSibling){
                   menu.classList.remove("show");
               }

           });

           button.nextElementSibling.classList.toggle("show");

       });

   });

   document.addEventListener("click", function (event) {

   if (event.target.closest(".wall-dropdown")) {
       return;
   }

   document
       .querySelectorAll(".wall-menu")
       .forEach(function (menu) {
           menu.classList.remove("show");
       });
});

const wallFeatureButtons = [
   {
       id: "back-door",
       wall: "back",
       name: "Ajtó",
       image: "images/walls/door.png",
       defaultWidth: 180
   },
   {
       id: "back-window",
       wall: "back",
       name: "Ablak",
       image: "images/walls/window.png",
       defaultWidth: 180
   },
   {
       id: "left-door",
       wall: "left",
       name: "Ajtó",
       image: "images/walls/door.png",
       defaultWidth: 180
   },
   {
       id: "left-window",
       wall: "left",
       name: "Ablak",
       image: "images/walls/window.png",
       defaultWidth: 180
   },
   {
       id: "right-door",
       wall: "right",
       name: "Ajtó",
       image: "images/walls/door.png",
       defaultWidth: 180
   },
   {
       id: "right-window",
       wall: "right",
       name: "Ablak",
       image: "images/walls/window.png",
       defaultWidth: 180
   },
   {
       id: "front-door",
       wall: "front",
       name: "Ajtó",
       image: "images/walls/door.png",
       defaultWidth: 180
   },
   {
       id: "front-window",
       wall: "front",
       name: "Ablak",
       image: "images/walls/window.png",
       defaultWidth: 180
   }
];

wallFeatureButtons.forEach(function (feature) {
   const featureButton =
       document.getElementById(feature.id);

   if (!featureButton) {
       return;
   }

   featureButton.addEventListener(
       "click",
       function (event) {
           event.preventDefault();
           event.stopPropagation();

           switchWall(feature.wall);

           const existingItem =
               placedItems.find(
                   function (placedItem) {
                       return (
                           placedItem &&
                           placedItem.wall === feature.wall &&
                           placedItem.product &&
                           placedItem.product.name === feature.name &&
                           placedItem.element &&
                           placedItem.element.isConnected
                       );
                   }
               );

           if (existingItem) {
               selectRoomItem(existingItem.element);
           } else {
               window.addProductToRoom({
                   id:
                       feature.wall +
                       "-" +
                       feature.name,
                   name: feature.name,
                   image: feature.image,
                   defaultWidth:
                       feature.defaultWidth
               });
           }

           document
               .querySelectorAll(".wall-menu")
               .forEach(function (menu) {
                   menu.classList.remove("show");
               });
       }
   );
});

   if (!roomCanvas) {
       console.error("Nem található a room-canvas.");
       return;
   }

   

   roomCanvas.addEventListener("pointerdown", function (event) {
       const clickedRoomItem = event.target.closest(".room-item");

       if (!clickedRoomItem && selectedItem) {
           selectedItem.classList.remove("selected");
           selectedItem = null;
       }
   });

   if (deleteButton) {
       deleteButton.addEventListener("click", function () {
           deleteSelectedItem();
       });
   }

   if (bringForwardButton) {
       bringForwardButton.addEventListener("click", function () {
           bringSelectedItemForward();
       });
   }

   if (sendBackwardButton) {
       sendBackwardButton.addEventListener("click", function () {
           sendSelectedItemBackward();
       });
   }

   saveHistory();
});


window.addProductToRoom = function (product) {
   
    if (!roomCanvas) {
       roomCanvas = document.getElementById("room-canvas");
   }

   if (!roomCanvas) {
       console.error("Nem található a room-canvas elem.");
       return;
   }

   if (!product || !product.image) {
       console.error("Hiányos termékadat:", product);
       return;
   }

   const placeholder = roomCanvas.querySelector(".canvas-placeholder");

   if (placeholder) {
       placeholder.style.display = "none";
   }

   const item = document.createElement("div");
   item.className = "room-item";

   highestZIndex += 1;
   item.style.zIndex = highestZIndex;

   item.addEventListener("pointerdown", function () {
    selectRoomItem(item);
   });

   const image = document.createElement("img");

   image.src = product.image;
   image.alt = product.name || "Termék";
   image.draggable = false;

   const width = Number(product.defaultWidth) || 220;

   item.style.position = "absolute";
   item.style.left = "50%";
   item.style.top = "50%";
   item.style.width = width + "px";
   item.style.transform = "translate(-50%, -50%)";
   item.style.cursor = "move";

   item.dataset.productId = product.id || "";
   item.dataset.productName = product.name || "";
   item.dataset.image = product.image;

   image.style.display = "block";
   image.style.width = "100%";
   image.style.height = "auto";
   image.style.pointerEvents = "none";
   image.style.userSelect = "none";

   item.appendChild(image);
   const resizeHandle = document.createElement("button");

resizeHandle.type = "button";
resizeHandle.className = "resize-handle";
resizeHandle.setAttribute("aria-label", "Termék méretezése");
resizeHandle.innerHTML = "↘";

item.appendChild(resizeHandle);

makeResizable(item, resizeHandle);

const rotateHandle = document.createElement("button");

rotateHandle.type = "button";
rotateHandle.className = "rotate-handle";
rotateHandle.setAttribute("aria-label", "Termék forgatása");
rotateHandle.innerHTML = "⟳";

item.appendChild(rotateHandle);

makeRotatable(item, rotateHandle);

// IDE JÖN A DELETE GOMB

const deleteButton = document.createElement("button");

deleteButton.type = "button";
deleteButton.className = "delete-handle";
deleteButton.setAttribute("aria-label", "Termék törlése");
deleteButton.innerHTML = "🗑";

deleteButton.addEventListener("pointerdown", function (event) {
   event.preventDefault();
   event.stopPropagation();

   const itemIndex = placedItems.findIndex(function (placedItem){
    return placedItem.element === item;

   });

   if (itemIndex !== -1) {
   const removedItem =
       placedItems[itemIndex];

   placedItems.splice(itemIndex, 1);

   if (
       removedItem &&
       removedItem.wall &&
       wallItems[removedItem.wall]
   ) {
       wallItems[removedItem.wall] =
           wallItems[
               removedItem.wall
           ].filter(function (wallItem) {
               return (
                   wallItem.element !== item
               );
           });
   }
}

   if (selectedItem === item) {
    selectedItem = null;
   }

   item.remove();

   updateToolbarState();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();
   saveHistory();
});

item.appendChild(deleteButton);

roomCanvas.appendChild(item);

makeDraggable(item);

selectRoomItem(item);

const placedItemData = {
    element: item,
    product: product,
    wall: activeWall
}

placedItems.push(placedItemData);
wallItems[activeWall].push(placedItemData);

item.dataset.wall = activeWall;

    selectRoomItem(item);
    updateSummaryPanel();

   console.log("Termék bekerült a szobába:", product.name);
};

function makeDraggable(item) {
   let isDragging = false;
   let startX = 0;
   let startY = 0;
   let startLeft = 0;
   let startTop = 0;

   item.addEventListener("pointerdown", function (event) {
       if (
           event.target.closest(".resize-handle") ||
           event.target.closest(".rotate-handle") ||
           event.target.closest(".delete-handle")
       ) {
           return;
       }

       event.preventDefault();

       isDragging = true;

       selectRoomItem(item);

       const canvasRect =
           roomCanvas.getBoundingClientRect();

       const itemRect =
           item.getBoundingClientRect();

       startX = event.clientX;
       startY = event.clientY;

       startLeft =
           itemRect.left - canvasRect.left;

       startTop =
           itemRect.top - canvasRect.top;

       item.style.left = startLeft + "px";
       item.style.top = startTop + "px";

       const rotation =
           Number(item.dataset.rotation || 0);

       item.style.transform =
           `rotate(${rotation}deg)`;

       item.setPointerCapture(event.pointerId);
   });

   item.addEventListener("pointermove", function (event) {
       if (!isDragging) {
           return;
       }

       event.preventDefault();

       const deltaX =
           event.clientX - startX;

       const deltaY =
           event.clientY - startY;

       const newLeft =
           startLeft + deltaX;

       const newTop =
           startTop + deltaY;

       const finalPosition =
           calculateDraggedItemPosition(
               item,
               newLeft,
               newTop
           );

       item.style.left =
           finalPosition.left + "px";

       item.style.top =
           finalPosition.top + "px";
   });

   item.addEventListener("pointerup", function (event) {
       if (!isDragging) {
           return;
       }

       isDragging = false;
       hideGuides();
       saveHistory();

       if (
           item.hasPointerCapture &&
           item.hasPointerCapture(event.pointerId)
       ) {
           item.releasePointerCapture(
               event.pointerId
           );
       }
   });

   item.addEventListener(
       "pointercancel",
       function () {
           isDragging = false;
           hideGuides();
           saveHistory();
       }
   );

   item.addEventListener(
       "lostpointercapture",
       function () {
           isDragging = false;
           hideGuides();
       }
   );
}

   function makeResizable(item, resizeHandle) {
   let isResizing = false;
   let startX = 0;
   let startWidth = 0;

   resizeHandle.addEventListener("pointerdown", function (event) {
       event.preventDefault();
       event.stopPropagation();

       isResizing = true;
       startX = event.clientX;
       startWidth = item.offsetWidth;

       resizeHandle.setPointerCapture(event.pointerId);
   });
   

   resizeHandle.addEventListener("pointermove", function (event) {
       if (!isResizing) {
           return;
       }

       const difference = event.clientX - startX;

       let newWidth = startWidth + difference;

       const minimumWidth = 70;
       const maximumWidth = Math.min(
           600,
           roomCanvas.clientWidth
       );

       newWidth = Math.max(
           minimumWidth,
           Math.min(newWidth, maximumWidth)
       );

       item.style.width = newWidth + "px";
   });

   resizeHandle.addEventListener("pointerup", function (event) {
       isResizing = false;
       hideGuides();
       saveHistory();

       if (resizeHandle.hasPointerCapture(event.pointerId)) {
           resizeHandle.releasePointerCapture(event.pointerId);
       }
   });

   resizeHandle.addEventListener("pointercancel", function () {
       isResizing = false;
       hideGuides();
       saveHistory();
   });
}

function makeRotatable(item, rotateHandle) {
   let isRotating = false;
   let startAngle = 0;
   let currentRotation = 0;

   rotateHandle.addEventListener("pointerdown", function (event) {
       event.preventDefault();
       event.stopPropagation();

       isRotating = true;

       const itemRect = item.getBoundingClientRect();
       const centerX = itemRect.left + itemRect.width / 2;
       const centerY = itemRect.top + itemRect.height / 2;

       startAngle = Math.atan2(
           event.clientY - centerY,
           event.clientX - centerX
       );

       const savedRotation = Number(item.dataset.rotation || 0);
       currentRotation = savedRotation;

       rotateHandle.setPointerCapture(event.pointerId);
   });

   rotateHandle.addEventListener("pointermove", function (event) {
       if (!isRotating) {
           return;
       }

       const itemRect = item.getBoundingClientRect();
       const centerX = itemRect.left + itemRect.width / 2;
       const centerY = itemRect.top + itemRect.height / 2;

       const newAngle = Math.atan2(
           event.clientY - centerY,
           event.clientX - centerX
       );

       const angleDifference =
           (newAngle - startAngle) * (180 / Math.PI);

       const newRotation = currentRotation + angleDifference;

       item.dataset.rotation = newRotation;

       item.style.transform = `rotate(${newRotation}deg)`;
   });

   rotateHandle.addEventListener("pointerup", function (event) {
       isRotating = false;
       hideGuides();
       saveHistory();

       if (rotateHandle.hasPointerCapture(event.pointerId)) {
           rotateHandle.releasePointerCapture(event.pointerId);
       }
   });

   rotateHandle.addEventListener("pointercancel", function () {
       isRotating = false;
   });
}

function switchWall(newWall) {
   const allowedWalls = [
       "back",
       "left",
       "right",
       "front"
   ];

   if (!allowedWalls.includes(newWall)) {
       console.error(
           "Ismeretlen fal:",
           newWall
       );
       return;
   }

   if (newWall === activeWall) {
       return;
   }

   saveCurrentWallItems();

   if (selectedItem) {
       selectedItem.classList.remove("selected");
       selectedItem = null;
   }

   hideAllWallItems();

   activeWall = newWall;

   showActiveWallItems();
   updateActiveWallButton();
   updateWallCanvasAppearance();
   updateToolbarState();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();
}


function saveCurrentWallItems() {
   if (!wallItems[activeWall]) {
       wallItems[activeWall] = [];
   }

   wallItems[activeWall] =
       placedItems.filter(function (placedItem) {
           return (
               placedItem &&
               placedItem.wall === activeWall
           );
       });
}


function hideAllWallItems() {
   placedItems.forEach(function (placedItem) {
       if (!placedItem || !placedItem.element) {
           return;
       }

       placedItem.element.style.display = "none";
   });
}


function showActiveWallItems() {
   placedItems.forEach(function (placedItem) {
       if (!placedItem || !placedItem.element) {
           return;
       }

       if (placedItem.wall === activeWall) {
           placedItem.element.style.display = "";
       } else {
           placedItem.element.style.display = "none";
       }
   });
}


function updateActiveWallButton() {
   const wallButtons = {
       back: document.getElementById("wall-back"),
       left: document.getElementById("wall-left"),
       right: document.getElementById("wall-right"),
       front: document.getElementById("wall-front")
   };

   Object.entries(wallButtons).forEach(
       function ([wallName, button]) {
           if (!button) {
               return;
           }

           const isActive =
               wallName === activeWall;

           button.classList.toggle(
               "active",
               isActive
           );

           button.setAttribute(
               "aria-pressed",
               String(isActive)
           );
       }
   );
}


function updateWallCanvasAppearance() {
   if (!roomCanvas) {
       return;
   }

   roomCanvas.dataset.activeWall =
       activeWall;

   roomCanvas.classList.remove(
       "wall-back-active",
       "wall-left-active",
       "wall-right-active",
       "wall-front-active"
   );

   roomCanvas.classList.add(
       `wall-${activeWall}-active`
   );
}

function selectRoomItem(item) {
   if (selectedItem && selectedItem !== item) {
       selectedItem.classList.remove("selected");
   }

   selectedItem = item;

   if (selectedItem) {
       selectedItem.classList.add("selected");
   }

   updateToolbarState();
}

function deleteSelectedItem() {


   if (!selectedItem) {
       return;
   }

   const itemToDelete = selectedItem;

   const itemIndex =
       placedItems.findIndex(
           function (placedItem) {
               return (
                   placedItem.element ===
                   itemToDelete
               );
           }
       );

   if (itemIndex !== -1) {
       const removedItem =
           placedItems[itemIndex];

       placedItems.splice(itemIndex, 1);

       if (
           removedItem &&
           removedItem.wall &&
           wallItems[removedItem.wall]
       ) {
           wallItems[removedItem.wall] =
               wallItems[
                   removedItem.wall
               ].filter(
                   function (wallItem) {
                       return (
                           wallItem.element !==
                           itemToDelete
                       );
                   }
               );
       }
   }

   itemToDelete.remove();
   selectedItem = null;

   updateToolbarState();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();
   saveHistory();
}


function updateToolbarState() {
   const deleteButton =
       document.getElementById("delete-selected");

   const bringForwardButton =
       document.getElementById("bring-forward");

   const sendBackwardButton =
       document.getElementById("send-backward");

   const disabled = !selectedItem;

   if (deleteButton) {
       deleteButton.disabled = disabled;
   }

   if (bringForwardButton) {
       bringForwardButton.disabled = disabled;
   }

   if (sendBackwardButton) {
       sendBackwardButton.disabled = disabled;
   }
}

function showPlaceholderWhenEmpty() {
   if (!roomCanvas) {
       return;
   }

   const placeholder =
       roomCanvas.querySelector(
           ".canvas-placeholder"
       );

   if (!placeholder) {
       return;
   }

   const activeWallHasItems =
       placedItems.some(
           function (placedItem) {
               return (
                   placedItem &&
                   placedItem.wall ===
                       activeWall &&
                   placedItem.element &&
                   placedItem.element
                       .isConnected
               );
           }
       );

   placeholder.style.display =
       activeWallHasItems
           ? "none"
           : "";
}

document.addEventListener("keydown", function (event) {
   const activeElement = document.activeElement;

   const isTyping =
       activeElement &&
       (
           activeElement.tagName === "INPUT" ||
           activeElement.tagName === "TEXTAREA" ||
           activeElement.isContentEditable
       );

   if (isTyping) {
       return;
   }

   if (
       event.key === "Delete" ||
       event.key === "Backspace"
   ) {
       event.preventDefault();
       deleteSelectedItem();
   }
});

function bringSelectedItemForward() {
   if (!selectedItem) {
       return;
   }

   highestZIndex += 1;
   selectedItem.style.zIndex =
       String(highestZIndex);

       saveHistory();
}

function sendSelectedItemBackward() {
   if (!selectedItem || !roomCanvas) {
       return;
   }

   const allRoomItems = Array.from(
       roomCanvas.querySelectorAll(".room-item")
   );

   if (allRoomItems.length <= 1) {
       return;
   }

   const lowestZIndex = Math.min(
       ...allRoomItems.map(function (roomItem) {
           return Number(
               roomItem.style.zIndex || 1
           );
       })
   );

   selectedItem.style.zIndex =
       String(lowestZIndex - 1);

       saveHistory();
}

function getWallDisplayName(wall) {
   const wallNames = {
       back: "Hátsó fal",
       left: "Bal oldali fal",
       right: "Jobb oldali fal",
       front: "Elülső fal"
   };

   return wallNames[wall] || "Fal";
}

function updateSummaryPanel() {
   const summaryContainer =
       document.getElementById("selected-products");

   const totalPriceElement =
       document.getElementById("total-price");

   if (!summaryContainer) {
       return;
   }

   summaryContainer.innerHTML = "";

   const summaryItems = placedItems.filter(function (placedItem) {
   return (
       placedItem &&
       placedItem.product &&
       placedItem.product.name !== "Ajtó" &&
       placedItem.product.name !== "Ablak"
   );
});

   if (summaryItems.length === 0) {
       summaryContainer.innerHTML = `
           <div class="empty-summary">
               Még nem választottál terméket.
           </div>
       `;

       if (totalPriceElement) {
           totalPriceElement.textContent = formatPrice(0);
       }

       return;
   }

   const groupedProducts = new Map();
   let totalPrice = 0;

   summaryItems.forEach(function (placedItem) {
       const product = placedItem.product;

       if (!product) {
           return;
       }

       const wall = placedItem.wall || "back";

       const productKey = String(
           product.id ||
           product.name ||
           product.image
       ); + "-" + wall;

       const productPrice = getProductPrice(product);

       totalPrice += productPrice;

       if (!groupedProducts.has(productKey)) {
           groupedProducts.set(productKey, {
               key: productKey,
               product: product,
               wall: wall,
               quantity: 0
           });
       }

       groupedProducts.get(productKey).quantity += 1;
   });

   groupedProducts.forEach(function (group) {
       const product = group.product;
       const quantity = group.quantity;
       const unitPrice = getProductPrice(product);

       const summaryItem =
           document.createElement("div");

       summaryItem.className = "summary-item";


       /* TERMÉKKÉP */

       const imageBox =
           document.createElement("div");

       imageBox.className = "summary-item-image";

       const image =
           document.createElement("img");

       image.src = product.image || "";
       image.alt = product.name || "Termék";
       image.draggable = false;

       imageBox.appendChild(image);


       /* TERMÉKNÉV ÉS ÁR */

       const content =
           document.createElement("div");

       content.className = "summary-item-content";

       const productName =
           document.createElement("strong");

       productName.textContent =
           product.name || "Névtelen termék";

       const productPrice =
           document.createElement("span");

       if (unitPrice > 0) {
           productPrice.textContent =
               formatPrice(unitPrice) + " / db";
       } else {
           productPrice.textContent =
               "Ár egyeztetés alapján";
       }

       const wallName = getWallDisplayName(group.wall);

       const wallLabel = document.createElement("small");

       wallLabel.className = "summary-item-wall";

       wallLabel.textContent = wallName;

       content.appendChild(productName);
       content.appendChild(wallLabel);
       content.appendChild(productPrice);


       /* DARABSZÁM ÉS TÖRLÉS */

       const quantityBox =
           document.createElement("div");

       quantityBox.className =
           "summary-item-quantity";

       const quantityLabel =
           document.createElement("strong");

       quantityLabel.textContent =
           quantity + " db";

       const removeButton =
           document.createElement("button");

       removeButton.type = "button";
       removeButton.className =
           "summary-item-remove";

       removeButton.textContent = "−";

       removeButton.setAttribute(
           "aria-label",
           "Egy darab eltávolítása ebből: " +
               (product.name || "termék")
       );

       removeButton.addEventListener(
           "click",
           function () {
               removeOneProductFromRoom(
                   group.key
               );
           }
       );

       quantityBox.appendChild(quantityLabel);
       quantityBox.appendChild(removeButton);


       /* SOR ÖSSZEÁLLÍTÁSA */

       summaryItem.appendChild(imageBox);
       summaryItem.appendChild(content);
       summaryItem.appendChild(quantityBox);

       summaryContainer.appendChild(summaryItem);
   });

   if (totalPriceElement) {
       totalPriceElement.textContent =
           formatPrice(totalPrice);
   }
}


function removeOneProductFromRoom(productKey) {
   let matchingItemIndex = -1;

   for (
       let index = placedItems.length - 1;
       index >= 0;
       index -= 1
   ) {
       const placedItem = placedItems[index];
       const product = placedItem.product;

       if (!product) {
           continue;
       }

       const currentProductKey = String(
           product.id ||
           product.name ||
           product.image
       );

       if (currentProductKey === productKey) {
           matchingItemIndex = index;
           break;
       }
   }

   if (matchingItemIndex === -1) {
       return;
   }

   const removedItem =
       placedItems[matchingItemIndex];

   if (
       selectedItem &&
       selectedItem === removedItem.element
   ) {
       selectedItem.classList.remove("selected");
       selectedItem = null;
   }

   if (removedItem.element) {
   removedItem.element.remove();
}

const removedWall =
   removedItem.wall || activeWall;

placedItems.splice(matchingItemIndex, 1);

if (wallItems[removedWall]) {
   wallItems[removedWall] =
       wallItems[removedWall].filter(
           function (wallItem) {
               return (
                   wallItem !== removedItem
               );
           }
       );
}

   updateToolbarState();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();
   saveHistory();
}


function getProductPrice(product) {
   if (!product) {
       return 0;
   }

   const rawPrice =
       product.price ??
       product.salePrice ??
       product.unitPrice ??
       0;

   if (typeof rawPrice === "number") {
       return Number.isFinite(rawPrice)
           ? rawPrice
           : 0;
   }

   const cleanedPrice = String(rawPrice)
       .replace(/\s/g, "")
       .replace(/Ft/gi, "")
       .replace(/[^\d,.-]/g, "")
       .replace(/\./g, "")
       .replace(",", ".");

   const parsedPrice = Number(cleanedPrice);

   if (!Number.isFinite(parsedPrice)) {
       return 0;
   }

   return parsedPrice;
}


function formatPrice(price) {
   const safePrice =
       Number.isFinite(Number(price))
           ? Number(price)
           : 0;

   return new Intl.NumberFormat("hu-HU", {
       style: "currency",
       currency: "HUF",
       maximumFractionDigits: 0
   }).format(safePrice);
}

const saveImageButton = document.getElementById("save-image-button");

if (saveImageButton) {
   saveImageButton.addEventListener("click", async function () {

       const canvas = document.getElementById("room-canvas");

       if (!canvas) {
           return;
       }

       const screenshot = await html2canvas(canvas, {
           backgroundColor: null,
           scale: 2,
           useCORS: true
       });

       const link = document.createElement("a");
       link.download = "mamame-babaszoba-terv.png";
       link.href = screenshot.toDataURL("image/png");
       link.click();
   });
}

function clearRoom() {

   if (!confirm("Biztosan új tervet szeretnél kezdeni? Minden elhelyezett termék törlődik.")) {
       return;
   }

   placedItems.forEach(function (placedItem) {
       if (placedItem.element) {
           placedItem.element.remove();
       }
   });

   placedItems.length = 0;

   selectedItem = null;

   updateToolbarState();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();
   saveHistory();

   const roomCanvas = document.getElementById("room-canvas");

   if (roomCanvas) {
       roomCanvas.style.backgroundImage = "";
       roomCanvas.style.backgroundColor = "";
   }

   if (typeof resetWalls === "function") {
       resetWalls();
   }
}

function getSnapPosition(item, proposedLeft, proposedTop) {
   const roomCanvas = document.getElementById("room-canvas");

   if (!roomCanvas || !item) {
       return {
           left: proposedLeft,
           top: proposedTop
       };
   }

   const snapDistance = 20;

   const canvasWidth = roomCanvas.clientWidth;
   const canvasHeight = roomCanvas.clientHeight;

   const itemWidth = item.offsetWidth;
   const itemHeight = item.offsetHeight;

   let snappedLeft = proposedLeft;
   let snappedTop = proposedTop;

   let guideX = null;
   let guideY = null;

   const itemRight = proposedLeft + itemWidth;
   const itemBottom = proposedTop + itemHeight;

   const canvasCenterX = canvasWidth / 2;
   const canvasCenterY = canvasHeight / 2;

   const itemCenterX = proposedLeft + itemWidth / 2;
   const itemCenterY = proposedTop + itemHeight / 2;

   /* BAL SZÉL */

   if (Math.abs(proposedLeft) <= snapDistance) {
       snappedLeft = 0;
       guideX = 0;
   }

   /* JOBB SZÉL */

   if (
       Math.abs(canvasWidth - itemRight) <=
       snapDistance
   ) {
       snappedLeft = canvasWidth - itemWidth;
       guideX = canvasWidth;
   }

   /* FELSŐ SZÉL */

   if (Math.abs(proposedTop) <= snapDistance) {
       snappedTop = 0;
       guideY = 0;
   }

   /* ALSÓ SZÉL */

   if (
       Math.abs(canvasHeight - itemBottom) <=
       snapDistance
   ) {
       snappedTop = canvasHeight - itemHeight;
       guideY = canvasHeight;
   }

   /* VÍZSZINTES KÖZÉP */

   if (
       Math.abs(itemCenterX - canvasCenterX) <=
       snapDistance
   ) {
       snappedLeft =
           canvasCenterX - itemWidth / 2;

       guideX = canvasCenterX;
   }

   /* FÜGGŐLEGES KÖZÉP */

   if (
       Math.abs(itemCenterY - canvasCenterY) <=
       snapDistance
   ) {
       snappedTop =
           canvasCenterY - itemHeight / 2;

       guideY = canvasCenterY;
   }

   showGuides(guideX, guideY);

   return {
       left: snappedLeft,
       top: snappedTop
   };
}


function keepItemInsideCanvas(item, left, top) {
   const roomCanvas = document.getElementById("room-canvas");

   if (!roomCanvas || !item) {
       return {
           left: left,
           top: top
       };
   }

   const maximumLeft =
       roomCanvas.clientWidth - item.offsetWidth;

   const maximumTop =
       roomCanvas.clientHeight - item.offsetHeight;

   return {
       left: Math.max(
           0,
           Math.min(left, maximumLeft)
       ),
       top: Math.max(
           0,
           Math.min(top, maximumTop)
       )
   };
}

function calculateDraggedItemPosition(
   item,
   proposedLeft,
   proposedTop
) {
   const snappedPosition = getSnapPosition(
       item,
       proposedLeft,
       proposedTop
   );

   return keepItemInsideCanvas(
       item,
       snappedPosition.left,
       snappedPosition.top
   );
}

function showGuides(x, y) {
   const verticalGuide =
       document.getElementById("guide-x");

   const horizontalGuide =
       document.getElementById("guide-y");

   if (verticalGuide) {
       if (x === null) {
           verticalGuide.style.display = "none";
       } else {
           verticalGuide.style.display = "block";
           verticalGuide.style.left = x + "px";
       }
   }

   if (horizontalGuide) {
       if (y === null) {
           horizontalGuide.style.display = "none";
       } else {
           horizontalGuide.style.display = "block";
           horizontalGuide.style.top = y + "px";
       }
   }
}

function hideGuides() {
   showGuides(null, null);
}

function saveHistory() {

   const snapshot = placedItems.map(function (placedItem) {

       return {

           product: placedItem.product,

           wall: placedItem.wall || activeWall,

           left: placedItem.element.style.left,

           top: placedItem.element.style.top,

           width: placedItem.element.style.width,

           height: placedItem.element.style.height,

           rotation:
               placedItem.element.dataset.rotation || "0",

           zIndex:
               placedItem.element.style.zIndex || "1"

       };

   });

   undoStack.push(snapshot);

   if (undoStack.length > MAX_HISTORY) {
       undoStack.shift();
   }

   redoStack.length = 0;

}

function restoreHistory(snapshot) {
   placedItems.forEach(function (placedItem) {
       if (placedItem.element) {
           placedItem.element.remove();
       }
   });

   placedItems.length = 0;

   wallItems.back = [];
   wallItems.left = [];
   wallItems.right = [];
   wallItems.front = [];

   selectedItem = null;

   snapshot.forEach(function (itemData) {
       const itemWall =
           itemData.wall || "back";

       const previousWall = activeWall;

       activeWall = itemWall;

       addProductToRoom(
           itemData.product
       );

       const placedItem =
           placedItems[
               placedItems.length - 1
           ];

       if (
           !placedItem ||
           !placedItem.element
       ) {
           activeWall = previousWall;
           return;
       }

       placedItem.wall = itemWall;

       placedItem.element.dataset.wall =
           itemWall;

       placedItem.element.style.left =
           itemData.left;

       placedItem.element.style.top =
           itemData.top;

       placedItem.element.style.width =
           itemData.width;

       placedItem.element.style.height =
           itemData.height;

       placedItem.element.style.zIndex =
           itemData.zIndex;

       placedItem.element.dataset.rotation =
           itemData.rotation;

       placedItem.element.style.transform =
           `rotate(${itemData.rotation}deg)`;

       activeWall = previousWall;
   });

   hideAllWallItems();
   showActiveWallItems();

   selectedItem = null;

   updateActiveWallButton();
   updateWallCanvasAppearance();
   updateToolbarState();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();
}

function undo() {

   if (undoStack.length <= 1) {
       return;
   }

   const current =
       undoStack.pop();

   redoStack.push(current);

   restoreHistory(
       undoStack[undoStack.length - 1]
   );

}

function redo() {
    if (redoStack.length === 0){
        return;
}

const snapshot =
redoStack.pop();

undoStack.push(snapshot);
restoreHistory(snapshot);
}

document.addEventListener("DOMContentLoaded", function () {
  const requestBtn = document.getElementById("request-quote-button");
  if (!requestBtn) return;

  requestBtn.addEventListener("click", function () {
    if (!window.placedItems || !Array.isArray(window.placedItems)) {
      // Ha nem globális a placedItems, akkor a canvas.js-ben csinálunk egy getter-t
      // (lásd lentebb a 2. pontot).
      alert("Nem találom a kiválasztott elemeket a terven.");
      return;
    }

    const items = window.placedItems.filter(x => x && x.product);

    if (items.length === 0) {
      alert("Előbb válassz/tegyél be termékeket a szobába.");
      return;
    }

    // darabszámolás
    const map = new Map();
    items.forEach(({ product }) => {
      const key = String(product.id || product.name || product.image);
      if (!map.has(key)) {
        map.set(key, { product, qty: 0 });
      }
      map.get(key).qty += 1;
    });

    let messageLines = [];
    map.forEach(({ product, qty }) => {
      const name = product.name || "Névtelen termék";
      const price = product.price ?? product.salePrice ?? product.unitPrice ?? "";
      messageLines.push(`- ${name} (${qty} db)${price ? ` | Ár: ${price}` : ""}`);
    });

    // összeg
    let total = 0;
    
    items.forEach(function({product}){
        total += getProductPrice(product);
    });

    const totalLine = 
    total > 0
    ? `Tervezett összeg: ${formatPrice(total)}`
    : "Tervezett összeg: egyeztetés alapján";

    // kép URL nem egyszerű frontendből (PNG letöltés kellene), de az üzenet így is jó.
    const subject = encodeURIComponent("Ajánlatkérés - Babaszoba terv");
    const body = encodeURIComponent(
      `Szia!\n\nKérek ajánlatot a következő babaszoba tervre:\n\n${messageLines.join("\n")}\n\n${totalLine}\n\nKöszönöm!\n`
    );

    // Ide írd a te email címed:
    const recipient = "mamame2025@icloud.com";

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  });
});