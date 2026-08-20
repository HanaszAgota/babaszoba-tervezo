"use strict";

/* =========================================================
  MAMAME × MINIQUE – 2D CANVAS
  A 3D NÉZETET NEM KEZELI.
========================================================= */

let roomCanvas = null;

const placedItems = [];
window.placedItems = placedItems;

const wallItems = {
   back: [],
   left: [],
   right: [],
   front: []
};

window.wallItems = wallItems;

let activeWall = "back";
let selectedItem = null;
let highestZIndex = 1;

const undoStack = [];
const redoStack = [];

const MAX_HISTORY = 50;


/* =========================================================
  INDÍTÁS
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

   roomCanvas =
       document.getElementById("room-canvas");

   if (!roomCanvas) {
       console.error(
           "Nem található a room-canvas."
       );
       return;
   }

   initializeWallButtons();
   initializeWallMenus();
   initializeWallFeatureButtons();
   initializeToolbar();
   initializeWallColors();
   initializeCanvasSelection();
   initializeKeyboardControls();
   initializeSaveButton();
   initializeQuoteButton();
   initializeNewPlanButton();

   updateActiveWallButton();
   updateWallCanvasAppearance();
   updateToolbarState();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();

   saveHistory();
});


/* =========================================================
  TERMÉK HOZZÁADÁSA
========================================================= */

function addProductToTwoDRoom(product) {

   if (!roomCanvas) {
       roomCanvas =
           document.getElementById("room-canvas");
   }

   if (!roomCanvas) {
       console.error(
           "Nem található a room-canvas."
       );
       return null;
   }

   if (
       !product ||
       !product.image
   ) {
       console.error(
           "Hiányos termékadat:",
           product
       );
       return null;
   }


   const placeholder =
       roomCanvas.querySelector(
           ".canvas-placeholder"
       );

   if (placeholder) {
       placeholder.style.display =
           "none";
   }


   const item =
       document.createElement("div");

   item.className =
       "room-item";

   highestZIndex += 1;

   item.style.position =
       "absolute";

   item.style.left =
       "50%";

   item.style.top =
       "50%";

   item.style.zIndex =
       String(highestZIndex);

   item.style.transform =
       "translate(-50%, -50%)";

   item.style.cursor =
       "move";


   const width =
       Number(product.defaultWidth) ||
       220;

   item.style.width =
       width + "px";


   item.dataset.productId =
       product.id || "";

   item.dataset.productName =
       product.name || "";

   item.dataset.image =
       product.image || "";

   item.dataset.wall =
       activeWall;

   item.dataset.rotation =
       "0";


   /* TERMÉKKÉP */

   const image =
       document.createElement("img");

   image.src =
       product.image;

   image.alt =
       product.name ||
       "Termék";

   image.draggable = false;

   image.style.display =
       "block";

   image.style.width =
       "100%";

   image.style.height =
       "auto";

   image.style.pointerEvents =
       "none";

   image.style.userSelect =
       "none";

   item.appendChild(image);


   /* MÉRETEZŐ */

   const resizeHandle =
       document.createElement("button");

   resizeHandle.type =
       "button";

   resizeHandle.className =
       "resize-handle";

   resizeHandle.setAttribute(
       "aria-label",
       "Termék méretezése"
   );

   resizeHandle.textContent =
       "↘";

   item.appendChild(
       resizeHandle
   );


   /* FORGATÓ */

   const rotateHandle =
       document.createElement("button");

   rotateHandle.type =
       "button";

   rotateHandle.className =
       "rotate-handle";

   rotateHandle.setAttribute(
       "aria-label",
       "Termék forgatása"
   );

   rotateHandle.textContent =
       "⟳";

   item.appendChild(
       rotateHandle
   );


   /* TÖRLÉS */

   const deleteHandle =
       document.createElement("button");

   deleteHandle.type =
       "button";

   deleteHandle.className =
       "delete-handle";

   deleteHandle.setAttribute(
       "aria-label",
       "Termék törlése"
   );

   deleteHandle.textContent =
       "🗑";

   item.appendChild(
       deleteHandle
   );


   roomCanvas.appendChild(item);


   const placedItem = {
       element: item,
       product: product,
       wall: activeWall
   };

   placedItems.push(
       placedItem
   );

   wallItems[
       activeWall
   ].push(
       placedItem
   );


   /* ESEMÉNYEK */

   item.addEventListener(
       "pointerdown",
       function () {
           selectRoomItem(item);
       }
   );

   deleteHandle.addEventListener(
       "pointerdown",
       function (event) {
           event.preventDefault();
           event.stopPropagation();

           removePlacedItem(
               placedItem
           );

           saveHistory();
       }
   );


   makeDraggable(item);
   makeResizable(
       item,
       resizeHandle
   );

   makeRotatable(
       item,
       rotateHandle
   );


   selectRoomItem(item);

   updateSummaryPanel();
   updateToolbarState();

   console.log(
       "Termék bekerült a 2D szobába:",
       product.name
   );

   return item;
}


/*
* Ezt fogja az app.js használni.
*
* A three-d-view.js később ezt becsomagolja,
* így 3D módban saját addProductToThreeD()
* függvényt futtat.
*/

window.addProductToRoom =
   addProductToTwoDRoom;


/* =========================================================
  KIJELÖLÉS
========================================================= */

function selectRoomItem(item) {

   if (
       selectedItem &&
       selectedItem !== item
   ) {
       selectedItem.classList.remove(
           "selected"
       );
   }

   selectedItem =
       item || null;

   if (selectedItem) {
       selectedItem.classList.add(
           "selected"
       );
   }

   updateToolbarState();
}


function clearSelection() {

   if (selectedItem) {
       selectedItem.classList.remove(
           "selected"
       );
   }

   selectedItem = null;

   updateToolbarState();
}


/* =========================================================
  MOZGATÁS
========================================================= */

function makeDraggable(item) {

   let isDragging = false;

   let startX = 0;
   let startY = 0;

   let startLeft = 0;
   let startTop = 0;


   item.addEventListener(
       "pointerdown",
       function (event) {

           if (
               event.target.closest(
                   ".resize-handle"
               ) ||
               event.target.closest(
                   ".rotate-handle"
               ) ||
               event.target.closest(
                   ".delete-handle"
               )
           ) {
               return;
           }


           event.preventDefault();

           isDragging = true;

           selectRoomItem(item);


           const canvasRect =
               roomCanvas
                   .getBoundingClientRect();

           const itemRect =
               item
                   .getBoundingClientRect();


           startX =
               event.clientX;

           startY =
               event.clientY;

           startLeft =
               itemRect.left -
               canvasRect.left;

           startTop =
               itemRect.top -
               canvasRect.top;


           item.style.left =
               startLeft + "px";

           item.style.top =
               startTop + "px";


           applyItemRotation(
               item
           );


           item.setPointerCapture(
               event.pointerId
           );
       }
   );


   item.addEventListener(
       "pointermove",
       function (event) {

           if (!isDragging) {
               return;
           }

           event.preventDefault();


           const proposedLeft =
               startLeft +
               (
                   event.clientX -
                   startX
               );

           const proposedTop =
               startTop +
               (
                   event.clientY -
                   startY
               );


           const position =
               calculateDraggedItemPosition(
                   item,
                   proposedLeft,
                   proposedTop
               );


           item.style.left =
               position.left +
               "px";

           item.style.top =
               position.top +
               "px";
       }
   );


   function finishDrag(event) {

       if (!isDragging) {
           return;
       }

       isDragging = false;

       hideGuides();

       saveHistory();


       if (
           event &&
           item.hasPointerCapture &&
           item.hasPointerCapture(
               event.pointerId
           )
       ) {
           item.releasePointerCapture(
               event.pointerId
           );
       }
   }


   item.addEventListener(
       "pointerup",
       finishDrag
   );

   item.addEventListener(
       "pointercancel",
       finishDrag
   );

   item.addEventListener(
       "lostpointercapture",
       function () {
           isDragging = false;
           hideGuides();
       }
   );
}


/* =========================================================
  MÉRETEZÉS
========================================================= */

function makeResizable(
   item,
   resizeHandle
) {

   let isResizing = false;

   let startX = 0;
   let startWidth = 0;


   resizeHandle.addEventListener(
       "pointerdown",
       function (event) {

           event.preventDefault();
           event.stopPropagation();

           selectRoomItem(item);

           isResizing = true;

           startX =
               event.clientX;

           startWidth =
               item.offsetWidth;

           resizeHandle
               .setPointerCapture(
                   event.pointerId
               );
       }
   );


   resizeHandle.addEventListener(
       "pointermove",
       function (event) {

           if (!isResizing) {
               return;
           }


           let newWidth =
               startWidth +
               (
                   event.clientX -
                   startX
               );


           const minimumWidth =
               70;

           const maximumWidth =
               Math.max(
                   70,
                   Math.min(
                       600,
                       roomCanvas.clientWidth
                   )
               );


           newWidth =
               Math.max(
                   minimumWidth,
                   Math.min(
                       newWidth,
                       maximumWidth
                   )
               );


           item.style.width =
               newWidth +
               "px";
       }
   );


   function finishResize(event) {

       if (!isResizing) {
           return;
       }

       isResizing = false;

       hideGuides();

       saveHistory();


       if (
           event &&
           resizeHandle.hasPointerCapture &&
           resizeHandle.hasPointerCapture(
               event.pointerId
           )
       ) {
           resizeHandle
               .releasePointerCapture(
                   event.pointerId
               );
       }
   }


   resizeHandle.addEventListener(
       "pointerup",
       finishResize
   );

   resizeHandle.addEventListener(
       "pointercancel",
       finishResize
   );
}


/* =========================================================
  FORGATÁS
========================================================= */

function makeRotatable(
   item,
   rotateHandle
) {

   let isRotating = false;

   let startAngle = 0;
   let startRotation = 0;


   rotateHandle.addEventListener(
       "pointerdown",
       function (event) {

           event.preventDefault();
           event.stopPropagation();

           selectRoomItem(item);

           isRotating = true;


           const rect =
               item.getBoundingClientRect();

           const centerX =
               rect.left +
               rect.width / 2;

           const centerY =
               rect.top +
               rect.height / 2;


           startAngle =
               Math.atan2(
                   event.clientY -
                       centerY,

                   event.clientX -
                       centerX
               );


           startRotation =
               Number(
                   item.dataset.rotation ||
                   0
               );


           rotateHandle
               .setPointerCapture(
                   event.pointerId
               );
       }
   );


   rotateHandle.addEventListener(
       "pointermove",
       function (event) {

           if (!isRotating) {
               return;
           }


           const rect =
               item.getBoundingClientRect();

           const centerX =
               rect.left +
               rect.width / 2;

           const centerY =
               rect.top +
               rect.height / 2;


           const currentAngle =
               Math.atan2(
                   event.clientY -
                       centerY,

                   event.clientX -
                       centerX
               );


           const difference =
               (
                   currentAngle -
                   startAngle
               ) *
               (
                   180 /
                   Math.PI
               );


           item.dataset.rotation =
               String(
                   startRotation +
                   difference
               );


           applyItemRotation(
               item
           );
       }
   );


   function finishRotation(event) {

       if (!isRotating) {
           return;
       }

       isRotating = false;

       saveHistory();


       if (
           event &&
           rotateHandle.hasPointerCapture &&
           rotateHandle.hasPointerCapture(
               event.pointerId
           )
       ) {
           rotateHandle
               .releasePointerCapture(
                   event.pointerId
               );
       }
   }


   rotateHandle.addEventListener(
       "pointerup",
       finishRotation
   );

   rotateHandle.addEventListener(
       "pointercancel",
       finishRotation
   );
}


function applyItemRotation(item) {

   const rotation =
       Number(
           item.dataset.rotation ||
           0
       );

   item.style.transform =
       `rotate(${rotation}deg)`;
}


/* =========================================================
  FALVÁLTÁS
========================================================= */

function initializeWallButtons() {

   const wallButtons = {
       back:
           document.getElementById(
               "wall-back"
           ),

       left:
           document.getElementById(
               "wall-left"
           ),

       right:
           document.getElementById(
               "wall-right"
           ),

       front:
           document.getElementById(
               "wall-front"
           )
   };


   Object.entries(
       wallButtons
   ).forEach(
       function (
           [wall, button]
       ) {

           if (!button) {
               return;
           }


           button.addEventListener(
               "click",
               function () {
                   switchWall(
                       wall
                   );
               }
           );
       }
   );
}


function switchWall(newWall) {

   const allowedWalls = [
       "back",
       "left",
       "right",
       "front"
   ];


   if (
       !allowedWalls.includes(
           newWall
       )
   ) {
       return;
   }


   if (
       newWall ===
       activeWall
   ) {
       return;
   }


   clearSelection();

   hideAllWallItems();

   activeWall =
       newWall;

   showActiveWallItems();

   updateActiveWallButton();
   updateWallCanvasAppearance();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();
}


function hideAllWallItems() {

   placedItems.forEach(
       function (placedItem) {

           if (
               !placedItem ||
               !placedItem.element
           ) {
               return;
           }

           placedItem.element.style.display =
               "none";
       }
   );
}


function showActiveWallItems() {

   placedItems.forEach(
       function (placedItem) {

           if (
               !placedItem ||
               !placedItem.element
           ) {
               return;
           }


           placedItem.element.style.display =
               placedItem.wall === activeWall
                   ? ""
                   : "none";
       }
   );
}


function updateActiveWallButton() {

   const walls = [
       "back",
       "left",
       "right",
       "front"
   ];


   walls.forEach(
       function (wall) {

           const button =
               document.getElementById(
                   `wall-${wall}`
               );


           if (!button) {
               return;
           }


           const isActive =
               wall ===
               activeWall;


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


/* =========================================================
  FALMENÜK
========================================================= */

function initializeWallMenus() {

   document
       .querySelectorAll(
           ".wall-menu-button"
       )
       .forEach(
           function (button) {

               button.addEventListener(
                   "click",
                   function (event) {

                       event.stopPropagation();


                       const menu =
                           button
                               .nextElementSibling;


                       document
                           .querySelectorAll(
                               ".wall-menu"
                           )
                           .forEach(
                               function (
                                   otherMenu
                               ) {

                                   if (
                                       otherMenu !==
                                       menu
                                   ) {
                                       otherMenu
                                           .classList
                                           .remove(
                                               "show"
                                           );
                                   }
                               }
                           );


                       if (menu) {
                           menu
                               .classList
                               .toggle(
                                   "show"
                               );
                       }
                   }
               );
           }
       );


   document.addEventListener(
       "click",
       function (event) {

           if (
               event.target.closest(
                   ".wall-dropdown"
               )
           ) {
               return;
           }


           document
               .querySelectorAll(
                   ".wall-menu"
               )
               .forEach(
                   function (menu) {
                       menu
                           .classList
                           .remove(
                               "show"
                           );
                   }
               );
       }
   );
}


/* =========================================================
  AJTÓ / ABLAK – CSAK 2D
========================================================= */

function initializeWallFeatureButtons() {

   const features = [
       ["back-door", "back", "Ajtó", "images/walls/door.png"],
       ["back-window", "back", "Ablak", "images/walls/window.png"],

       ["left-door", "left", "Ajtó", "images/walls/door.png"],
       ["left-window", "left", "Ablak", "images/walls/window.png"],

       ["right-door", "right", "Ajtó", "images/walls/door.png"],
       ["right-window", "right", "Ablak", "images/walls/window.png"],

       ["front-door", "front", "Ajtó", "images/walls/door.png"],
       ["front-window", "front", "Ablak", "images/walls/window.png"]
   ];


   features.forEach(
       function (feature) {

           const [
               id,
               wall,
               name,
               image
           ] = feature;


           const button =
               document.getElementById(
                   id
               );


           if (!button) {
               return;
           }


           button.addEventListener(
               "click",
               function (event) {

                   event.preventDefault();
                   event.stopPropagation();


                   switchWall(wall);


                   const existing =
                       placedItems.find(
                           function (item) {

                               return (
                                   item.wall === wall &&
                                   item.product &&
                                   item.product.name ===
                                       name &&
                                   item.element &&
                                   item.element.isConnected
                               );
                           }
                       );


                   if (existing) {

                       selectRoomItem(
                           existing.element
                       );

                   } else {

                       addProductToTwoDRoom({
                           id:
                               `${wall}-${name.toLowerCase()}`,

                           name: name,

                           image: image,

                           defaultWidth: 180,

                           price: 0
                       });
                   }


                   document
                       .querySelectorAll(
                           ".wall-menu"
                       )
                       .forEach(
                           function (menu) {
                               menu
                                   .classList
                                   .remove(
                                       "show"
                                   );
                           }
                       );
               }
           );
       }
   );
}


/* =========================================================
  FALSZÍN – CSAK 2D
========================================================= */

function initializeWallColors() {

   document
       .querySelectorAll(
           ".wall-color-picker"
       )
       .forEach(
           function (picker) {

               picker.addEventListener(
                   "input",
                   function () {

                       if (
                           !roomCanvas
                       ) {
                           return;
                       }


                       roomCanvas
                           .style
                           .backgroundImage =
                           "none";


                       roomCanvas
                           .style
                           .backgroundColor =
                           picker.value;
                   }
               );
           }
       );
}


/* =========================================================
  TOOLBAR
========================================================= */

function initializeToolbar() {

   const deleteButton =
       document.getElementById(
           "delete-selected"
       );

   const bringForwardButton =
       document.getElementById(
           "bring-forward"
       );

   const sendBackwardButton =
       document.getElementById(
           "send-backward"
       );


   if (deleteButton) {

       deleteButton.addEventListener(
           "click",
           function () {
               deleteSelectedItem();
           }
       );
   }


   if (bringForwardButton) {

       bringForwardButton.addEventListener(
           "click",
           function () {
               bringSelectedItemForward();
           }
       );
   }


   if (sendBackwardButton) {

       sendBackwardButton.addEventListener(
           "click",
           function () {
               sendSelectedItemBackward();
           }
       );
   }
}


function updateToolbarState() {

   const disabled =
       !selectedItem;


   [
       "delete-selected",
       "bring-forward",
       "send-backward"
   ].forEach(
       function (id) {

           const button =
               document.getElementById(
                   id
               );

           if (button) {
               button.disabled =
                   disabled;
           }
       }
   );
}


/* =========================================================
  TÖRLÉS
========================================================= */

function deleteSelectedItem() {

   if (!selectedItem) {
       return;
   }


   const placedItem =
       placedItems.find(
           function (item) {
               return (
                   item.element ===
                   selectedItem
               );
           }
       );


   if (placedItem) {
       removePlacedItem(
           placedItem
       );
   }


   saveHistory();
}


function removePlacedItem(
   placedItem
) {

   if (!placedItem) {
       return;
   }


   const index =
       placedItems.indexOf(
           placedItem
       );


   if (index !== -1) {
       placedItems.splice(
           index,
           1
       );
   }


   const wall =
       placedItem.wall;


   if (
       wall &&
       wallItems[wall]
   ) {

       wallItems[wall] =
           wallItems[
               wall
           ].filter(
               function (item) {
                   return (
                       item !==
                       placedItem
                   );
               }
           );

       window.wallItems =
           wallItems;
   }


   if (
       placedItem.element &&
       placedItem.element.isConnected
   ) {
       placedItem.element.remove();
   }


   if (
       selectedItem ===
       placedItem.element
   ) {
       selectedItem = null;
   }


   updateToolbarState();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();
}


/* =========================================================
  RÉTEGEK
========================================================= */

function bringSelectedItemForward() {

   if (!selectedItem) {
       return;
   }

   highestZIndex += 1;

   selectedItem.style.zIndex =
       String(
           highestZIndex
       );

   saveHistory();
}


function sendSelectedItemBackward() {

   if (
       !selectedItem ||
       !roomCanvas
   ) {
       return;
   }


   const items =
       Array.from(
           roomCanvas
               .querySelectorAll(
                   ".room-item"
               )
       );


   if (
       items.length <= 1
   ) {
       return;
   }


   const lowest =
       Math.min(
           ...items.map(
               function (item) {
                   return Number(
                       item.style.zIndex ||
                       1
                   );
               }
           )
       );


   selectedItem.style.zIndex =
       String(
           lowest - 1
       );

   saveHistory();
}


/* =========================================================
  CANVAS KATTINTÁS
========================================================= */

function initializeCanvasSelection() {

   roomCanvas.addEventListener(
       "pointerdown",
       function (event) {

           const item =
               event.target.closest(
                   ".room-item"
               );


           if (!item) {
               clearSelection();
           }
       }
   );
}


/* =========================================================
  BILLENTYŰZET
========================================================= */

function initializeKeyboardControls() {

   document.addEventListener(
       "keydown",
       function (event) {

           const activeElement =
               document.activeElement;


           const isTyping =
               activeElement &&
               (
                   activeElement.tagName ===
                       "INPUT" ||

                   activeElement.tagName ===
                       "TEXTAREA" ||

                   activeElement
                       .isContentEditable
               );


           if (isTyping) {
               return;
           }


           if (
               event.key ===
                   "Delete" ||
               event.key ===
                   "Backspace"
           ) {

               if (!selectedItem) {
                   return;
               }

               event.preventDefault();

               deleteSelectedItem();
           }


           const modifier =
               event.metaKey ||
               event.ctrlKey;


           if (
               modifier &&
               event.key.toLowerCase() ===
                   "z"
           ) {

               event.preventDefault();

               if (event.shiftKey) {
                   redo();
               } else {
                   undo();
               }
           }
       }
   );
}


/* =========================================================
  SNAP
========================================================= */

function calculateDraggedItemPosition(
   item,
   proposedLeft,
   proposedTop
) {

   const snapped =
       getSnapPosition(
           item,
           proposedLeft,
           proposedTop
       );


   return keepItemInsideCanvas(
       item,
       snapped.left,
       snapped.top
   );
}


function getSnapPosition(
   item,
   proposedLeft,
   proposedTop
) {

   if (
       !roomCanvas ||
       !item
   ) {
       return {
           left: proposedLeft,
           top: proposedTop
       };
   }


   const snapDistance =
       20;


   const canvasWidth =
       roomCanvas.clientWidth;

   const canvasHeight =
       roomCanvas.clientHeight;

   const itemWidth =
       item.offsetWidth;

   const itemHeight =
       item.offsetHeight;


   let left =
       proposedLeft;

   let top =
       proposedTop;

   let guideX =
       null;

   let guideY =
       null;


   const right =
       proposedLeft +
       itemWidth;

   const bottom =
       proposedTop +
       itemHeight;


   const canvasCenterX =
       canvasWidth / 2;

   const canvasCenterY =
       canvasHeight / 2;

   const itemCenterX =
       proposedLeft +
       itemWidth / 2;

   const itemCenterY =
       proposedTop +
       itemHeight / 2;


   if (
       Math.abs(
           proposedLeft
       ) <= snapDistance
   ) {

       left = 0;
       guideX = 0;
   }


   if (
       Math.abs(
           canvasWidth -
           right
       ) <= snapDistance
   ) {

       left =
           canvasWidth -
           itemWidth;

       guideX =
           canvasWidth;
   }


   if (
       Math.abs(
           proposedTop
       ) <= snapDistance
   ) {

       top = 0;
       guideY = 0;
   }


   if (
       Math.abs(
           canvasHeight -
           bottom
       ) <= snapDistance
   ) {

       top =
           canvasHeight -
           itemHeight;

       guideY =
           canvasHeight;
   }


   if (
       Math.abs(
           itemCenterX -
           canvasCenterX
       ) <= snapDistance
   ) {

       left =
           canvasCenterX -
           itemWidth / 2;

       guideX =
           canvasCenterX;
   }


   if (
       Math.abs(
           itemCenterY -
           canvasCenterY
       ) <= snapDistance
   ) {

       top =
           canvasCenterY -
           itemHeight / 2;

       guideY =
           canvasCenterY;
   }


   showGuides(
       guideX,
       guideY
   );


   return {
       left: left,
       top: top
   };
}


function keepItemInsideCanvas(
   item,
   left,
   top
) {

   const maxLeft =
       Math.max(
           0,
           roomCanvas.clientWidth -
           item.offsetWidth
       );


   const maxTop =
       Math.max(
           0,
           roomCanvas.clientHeight -
           item.offsetHeight
       );


   return {
       left:
           THREE_CLAMP(
               left,
               0,
               maxLeft
           ),

       top:
           THREE_CLAMP(
               top,
               0,
               maxTop
           )
   };
}


/*
* Nem használunk THREE-t a 2D fájlban.
* Ez csak egy egyszerű clamp segéd.
*/

function THREE_CLAMP(
   value,
   minimum,
   maximum
) {

   return Math.max(
       minimum,
       Math.min(
           value,
           maximum
       )
   );
}


/* =========================================================
  SEGÉDVONALAK
========================================================= */

function showGuides(
   x,
   y
) {

   const vertical =
       document.getElementById(
           "guide-x"
       );

   const horizontal =
       document.getElementById(
           "guide-y"
       );


   if (vertical) {

       if (x === null) {
           vertical.style.display =
               "none";
       } else {
           vertical.style.display =
               "block";

           vertical.style.left =
               x +
               "px";
       }
   }


   if (horizontal) {

       if (y === null) {
           horizontal.style.display =
               "none";
       } else {
           horizontal.style.display =
               "block";

           horizontal.style.top =
               y +
               "px";
       }
   }
}


function hideGuides() {
   showGuides(
       null,
       null
   );
}


/* =========================================================
  PLACEHOLDER
========================================================= */

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


   const hasItems =
       placedItems.some(
           function (item) {

               return (
                   item &&
                   item.wall ===
                       activeWall &&
                   item.element &&
                   item.element
                       .isConnected
               );
           }
       );


   placeholder.style.display =
       hasItems
           ? "none"
           : "";
}


/* =========================================================
  ÖSSZESÍTŐ
========================================================= */

function getWallDisplayName(
   wall
) {

   const names = {
       back:
           "Hátsó fal",

       left:
           "Bal fal",

       right:
           "Jobb fal",

       front:
           "Elülső fal"
   };


   return (
       names[wall] ||
       "Fal"
   );
}


function updateSummaryPanel() {

   const container =
       document.getElementById(
           "selected-products"
       );


   const totalElement =
       document.getElementById(
           "total-price"
       );


   if (!container) {
       return;
   }


   container.innerHTML =
       "";


   const products =
       placedItems.filter(
           function (item) {

               return (
                   item &&
                   item.product &&
                   item.product.name !==
                       "Ajtó" &&
                   item.product.name !==
                       "Ablak"
               );
           }
       );


   if (
       products.length === 0
   ) {

       container.innerHTML = `
           <div class="empty-summary">
               Még nem választottál terméket.
           </div>
       `;


       if (totalElement) {
           totalElement.textContent =
               formatPrice(0);
       }

       return;
   }


   const groups =
       new Map();

   let total =
       0;


   products.forEach(
       function (item) {

           const product =
               item.product;

           const wall =
               item.wall ||
               "back";


           const baseKey =
               String(
                   product.id ||
                   product.name ||
                   product.image
               );


           const key =
               `${baseKey}::${wall}`;


           const price =
               getProductPrice(
                   product
               );


           total +=
               price;


           if (
               !groups.has(
                   key
               )
           ) {

               groups.set(
                   key,
                   {
                       key: key,
                       product: product,
                       wall: wall,
                       quantity: 0
                   }
               );
           }


           groups.get(
               key
           ).quantity += 1;
       }
   );


   groups.forEach(
       function (group) {

           const row =
               document.createElement(
                   "div"
               );

           row.className =
               "summary-item";


           const imageBox =
               document.createElement(
                   "div"
               );

           imageBox.className =
               "summary-item-image";


           const image =
               document.createElement(
                   "img"
               );

           image.src =
               group.product.image ||
               "";

           image.alt =
               group.product.name ||
               "Termék";

           image.draggable =
               false;


           imageBox.appendChild(
               image
           );


           const content =
               document.createElement(
                   "div"
               );

           content.className =
               "summary-item-content";


           const name =
               document.createElement(
                   "strong"
               );

           name.textContent =
               group.product.name ||
               "Névtelen termék";


           const wall =
               document.createElement(
                   "small"
               );

           wall.className =
               "summary-item-wall";

           wall.textContent =
               getWallDisplayName(
                   group.wall
               );


           const price =
               document.createElement(
                   "span"
               );


           const unitPrice =
               getProductPrice(
                   group.product
               );


           price.textContent =
               unitPrice > 0
                   ? `${formatPrice(unitPrice)} / db`
                   : "Ár egyeztetés alapján";


           content.appendChild(
               name
           );

           content.appendChild(
               wall
           );

           content.appendChild(
               price
           );


           const quantityBox =
               document.createElement(
                   "div"
               );

           quantityBox.className =
               "summary-item-quantity";


           const quantity =
               document.createElement(
                   "strong"
               );

           quantity.textContent =
               `${group.quantity} db`;


           const removeButton =
               document.createElement(
                   "button"
               );

           removeButton.type =
               "button";

           removeButton.className =
               "summary-item-remove";

           removeButton.textContent =
               "−";


           removeButton.addEventListener(
               "click",
               function () {

                   removeOneProductFromRoom(
                       group.key
                   );
               }
           );


           quantityBox.appendChild(
               quantity
           );

           quantityBox.appendChild(
               removeButton
           );


           row.appendChild(
               imageBox
           );

           row.appendChild(
               content
           );

           row.appendChild(
               quantityBox
           );


           container.appendChild(
               row
           );
       }
   );


   if (totalElement) {
       totalElement.textContent =
           formatPrice(
               total
           );
   }
}


function removeOneProductFromRoom(
   groupKey
) {

   for (
       let index =
           placedItems.length - 1;

       index >= 0;

       index -= 1
   ) {

       const item =
           placedItems[index];


       if (
           !item ||
           !item.product
       ) {
           continue;
       }


       const baseKey =
           String(
               item.product.id ||
               item.product.name ||
               item.product.image
           );


       const key =
           `${baseKey}::${item.wall || "back"}`;


       if (
           key !==
           groupKey
       ) {
           continue;
       }


       removePlacedItem(
           item
       );

       saveHistory();

       return;
   }
}


/* =========================================================
  ÁRAK
========================================================= */

function getProductPrice(
   product
) {

   if (!product) {
       return 0;
   }


   const raw =
       product.price ??
       product.salePrice ??
       product.unitPrice ??
       0;


   if (
       typeof raw ===
       "number"
   ) {
       return Number.isFinite(
           raw
       )
           ? raw
           : 0;
   }


   const cleaned =
       String(raw)
           .replace(
               /\s/g,
               ""
           )
           .replace(
               /Ft/gi,
               ""
           )
           .replace(
               /[^\d,.-]/g,
               ""
           )
           .replace(
               /\./g,
               ""
           )
           .replace(
               ",",
               "."
           );


   const parsed =
       Number(
           cleaned
       );


   return Number.isFinite(
       parsed
   )
       ? parsed
       : 0;
}


function formatPrice(
   price
) {

   return new Intl.NumberFormat(
       "hu-HU",
       {
           style:
               "currency",

           currency:
               "HUF",

           maximumFractionDigits:
               0
       }
   ).format(
       Number(price) ||
       0
   );
}


/* =========================================================
  ELŐZMÉNY
========================================================= */

function createHistorySnapshot() {

   return placedItems.map(
       function (item) {

           return {
               product:
                   item.product,

               wall:
                   item.wall,

               left:
                   item.element
                       .style
                       .left,

               top:
                   item.element
                       .style
                       .top,

               width:
                   item.element
                       .style
                       .width,

               rotation:
                   item.element
                       .dataset
                       .rotation ||
                   "0",

               zIndex:
                   item.element
                       .style
                       .zIndex ||
                   "1"
           };
       }
   );
}


function saveHistory() {

   undoStack.push(
       createHistorySnapshot()
   );


   if (
       undoStack.length >
       MAX_HISTORY
   ) {
       undoStack.shift();
   }


   redoStack.length =
       0;
}


function restoreHistory(
   snapshot
) {

   removeAllItemsWithoutHistory();


   snapshot.forEach(
       function (data) {

           const previousWall =
               activeWall;


           activeWall =
               data.wall ||
               "back";


           const element =
               addProductToTwoDRoom(
                   data.product
               );


           const item =
               placedItems[
                   placedItems.length -
                   1
               ];


           if (
               element &&
               item
           ) {

               item.wall =
                   data.wall ||
                   "back";


               element.dataset.wall =
                   item.wall;


               element.style.left =
                   data.left;

               element.style.top =
                   data.top;

               element.style.width =
                   data.width;

               element.dataset.rotation =
                   data.rotation;

               element.style.zIndex =
                   data.zIndex;

               applyItemRotation(
                   element
               );
           }


           activeWall =
               previousWall;
       }
   );


   hideAllWallItems();
   showActiveWallItems();

   clearSelection();

   updateActiveWallButton();
   updateWallCanvasAppearance();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();
}


function undo() {

   if (
       undoStack.length <=
       1
   ) {
       return;
   }


   const current =
       undoStack.pop();


   redoStack.push(
       current
   );


   restoreHistory(
       undoStack[
           undoStack.length -
           1
       ]
   );
}


function redo() {

   if (
       redoStack.length ===
       0
   ) {
       return;
   }


   const snapshot =
       redoStack.pop();


   undoStack.push(
       snapshot
   );


   restoreHistory(
       snapshot
   );
}


/* =========================================================
  ÚJ TERV
========================================================= */

function removeAllItemsWithoutHistory() {

   placedItems.forEach(
       function (item) {

           if (
               item.element &&
               item.element
                   .isConnected
           ) {
               item.element.remove();
           }
       }
   );


   placedItems.length =
       0;


   Object.keys(
       wallItems
   ).forEach(
       function (wall) {

           wallItems[
               wall
           ] = [];
       }
   );


   clearSelection();
}


function clearRoom() {

   const confirmed =
       window.confirm(
           "Biztosan új tervet szeretnél kezdeni? Minden elhelyezett termék törlődik."
       );


   if (!confirmed) {
       return;
   }


   removeAllItemsWithoutHistory();


   activeWall =
       "back";


   if (roomCanvas) {

       roomCanvas
           .style
           .backgroundImage =
           "";

       roomCanvas
           .style
           .backgroundColor =
           "";
   }


   updateActiveWallButton();
   updateWallCanvasAppearance();
   showPlaceholderWhenEmpty();
   updateSummaryPanel();

   saveHistory();
}


window.clearRoom =
   clearRoom;


function initializeNewPlanButton() {

   const button =
       document.getElementById(
           "new-plan-button"
       );


   if (!button) {
       return;
   }


   button.addEventListener(
       "click",
       clearRoom
   );
}


/* =========================================================
  TERV MENTÉSE
========================================================= */

/* =====================================================
  TERV MENTÉSE – 2D + 3D
====================================================== */

const saveImageButton =
   document.getElementById(
       "save-image-button"
   );


if (saveImageButton) {

   saveImageButton.addEventListener(
       "click",
       async function () {

           const room3dView =
               document.getElementById(
                   "room-3d-view"
               );


           const isThreeD =
               room3dView &&
               !room3dView.hidden;


           /* =============================================
              3D MENTÉS
           ============================================== */

           if (isThreeD) {

               const threeDFrame =
                   document.getElementById(
                       "three-d-frame"
                   );


               if (
                   !threeDFrame ||
                   !threeDFrame.contentWindow
               ) {

                   alert(
                       "A 3D terv nem érhető el."
                   );

                   return;
               }


               try {

                   const frameDocument =
                       threeDFrame
                           .contentWindow
                           .document;


                   const threeCanvas =
                       frameDocument
                           .querySelector(
                               "#three-d-room canvas"
                           );


                   if (!threeCanvas) {

                       alert(
                           "A 3D kép nem található."
                       );

                       return;
                   }


                   /*
                    * Közvetlenül a Three.js
                    * WebGL canvas tartalmát mentjük.
                    */

                   const imageUrl =
                       threeCanvas.toDataURL(
                           "image/png"
                       );


                   const link =
                       document.createElement(
                           "a"
                       );


                   link.download =
                       "mamame-3d-babaszoba-terv.png";


                   link.href =
                       imageUrl;


                   link.click();


                   return;


               } catch (error) {

                   console.error(
                       "3D terv mentési hiba:",
                       error
                   );


                   alert(
                       "A 3D terv mentése nem sikerült."
                   );


                   return;
               }
           }


           /* =============================================
              2D MENTÉS
           ============================================== */

           const canvas =
               document.getElementById(
                   "room-canvas"
               );


           if (!canvas) {
               return;
           }


           try {

               const screenshot =
                   await html2canvas(
                       canvas,
                       {
                           backgroundColor:
                               null,

                           scale:
                               2,

                           useCORS:
                               true
                       }
                   );


               const link =
                   document.createElement(
                       "a"
                   );


               link.download =
                   "mamame-2d-babaszoba-terv.png";


               link.href =
                   screenshot.toDataURL(
                       "image/png"
                   );


               link.click();


           } catch (error) {

               console.error(
                   "2D terv mentési hiba:",
                   error
               );
           }

       }
   );
}

/* =====================================================
  AJÁNLATKÉRÉS – 2D + 3D
====================================================== */

document.addEventListener(
   "DOMContentLoaded",
   function () {

       const requestBtn =
           document.getElementById(
               "request-quote-button"
           );

       if (!requestBtn) {
           return;
       }


       requestBtn.addEventListener(
           "click",
           function () {

               /* =========================================
                  2D TERMÉKEK
               ========================================== */

               const twoDItems =
                   Array.isArray(
                       window.placedItems
                   )
                       ? window.placedItems.filter(
                           function (item) {

                               return (
                                   item &&
                                   item.product &&
                                   item.product.name !== "Ajtó" &&
                                   item.product.name !== "Ablak"
                               );
                           }
                       )
                       : [];


               /* =========================================
                  3D TERMÉKEK
               ========================================== */

               const threeDItems =
                   Array.isArray(
                       window.threeDProducts
                   )
                       ? window.threeDProducts
                       : [];


               /* =========================================
                  AKTÍV NÉZET
               ========================================== */

               const room3dView =
                   document.getElementById(
                       "room-3d-view"
                   );


               const isThreeD =
                   room3dView &&
                   !room3dView.hidden;


               /*
                * Csak az aktuális terv termékeit használjuk.
                */

               const sourceItems =
                   isThreeD
                       ? threeDItems.map(
                           function (item) {
                               return {
                                   product:
                                       item.product
                               };
                           }
                       )
                       : twoDItems;


               if (
                   sourceItems.length === 0
               ) {

                   alert(
                       "Előbb válassz termékeket a szobába."
                   );

                   return;
               }


               /* =========================================
                  DARABSZÁMOK
               ========================================== */

               const productMap =
                   new Map();


               sourceItems.forEach(
                   function (item) {

                       const product =
                           item.product;

                       if (!product) {
                           return;
                       }


                       const key =
                           String(
                               product.id ||
                               product.name ||
                               product.image
                           );


                       if (
                           !productMap.has(
                               key
                           )
                       ) {

                           productMap.set(
                               key,
                               {
                                   product:
                                       product,

                                   quantity:
                                       0
                               }
                           );
                       }


                       productMap.get(
                           key
                       ).quantity += 1;

                   }
               );


               /* =========================================
                  EMAIL SZÖVEG
               ========================================== */

               const messageLines =
                   [];


               let total =
                   0;


               productMap.forEach(
                   function (group) {

                       const product =
                           group.product;


                       const quantity =
                           group.quantity;


                       const price =
                           getProductPrice(
                               product
                           );


                       total +=
                           price *
                           quantity;


                       let line =
                           "- " +
                           (
                               product.name ||
                               "Névtelen termék"
                           ) +
                           " (" +
                           quantity +
                           " db)";


                       if (
                           price > 0
                       ) {

                           line +=
                               " | " +
                               formatPrice(
                                   price
                               ) +
                               " / db";
                       }


                       messageLines.push(
                           line
                       );

                   }
               );


               const totalLine =
                   total > 0
                       ? "Tervezett összeg: " +
                         formatPrice(total)

                       : "Tervezett összeg: egyeztetés alapján";


               const viewName =
                   isThreeD
                       ? "3D babaszoba terv"
                       : "2D babaszoba terv";


               const subject =
                   encodeURIComponent(
                       "Ajánlatkérés - " +
                       viewName
                   );


               const body =
                   encodeURIComponent(

                       "Szia!\n\n" +

                       "Kérek ajánlatot a következő " +
                       viewName +
                       " alapján:\n\n" +

                       messageLines.join(
                           "\n"
                       ) +

                       "\n\n" +

                       totalLine +

                       "\n\nKöszönöm!"
                   );


               const recipient =
                   "mamame2025@icloud.com";


               window.location.href =
                   `mailto:${recipient}?subject=${subject}&body=${body}`;

           }
       );

   }
);