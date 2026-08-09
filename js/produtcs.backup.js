"use strict";

/* =========================================================
  MINIQUE DESIGNER – TERMÉKADATOK
========================================================= */

const PRODUCTS = [
 {
   id: "minique-nyitott-gardrob-zold",
   name: "MiniQue nyitott gardrób",
   category: "furniture",
   image: "images/furniture/fellepo-modifiq.png",
   price: 0,
   realWidth: 90,
   defaultWidth: 240
 },

 {
   id: "minique-nyitott-gardrob-kek",
   name: "MiniQue nyitott gardrób – kék",
   category: "furniture",
   image: "images/furniture/fardrobe-magas.modofiq2.png",
   price: 0,
   realWidth: 90,
   defaultWidth: 240
 },

 {
   id: "minique-konyvespolc",
   name: "MiniQue könyvespolc",
   category: "furniture",
   image: "images/furniture/tarolo-pad-modifiq2.png",
   price: 0,
   realWidth: 90,
   defaultWidth: 220
 },

 {
   id: "minique-alacsony-polc",
   name: "MiniQue alacsony polc",
   category: "furniture",
   image: "images/furniture/polc-modifiq.png",
   price: 0,
   realWidth: 90,
   defaultWidth: 220
 },

 {
   id: "minique-gyerekszek",
   name: "MiniQue gyerekszék",
   category: "furniture",
   image: "images/furniture/kisagy-pelenkazo-modifiq.png",
   price: 0,
   realWidth: 45,
   defaultWidth: 130
 },

 {
   id: "minique-asztal-szek",
   name: "MiniQue asztal és szék",
   category: "furniture",
   image: "images/furniture/uloke-kisasztal-modifiq.png",
   price: 0,
   realWidth: 100,
   defaultWidth: 230
 },

 {
   id: "minique-csuszda",
   name: "MiniQue Montessori csúszda",
   category: "furniture",
   image: "images/montessori/montessori-hinta-maszo-pallo-parna-bezs.png",
   price: 0,
   realWidth: 120,
   defaultWidth: 260
 }
];

/* A tömb más fájlokból is elérhető legyen. */
window.PRODUCTS = PRODUCTS;


/* =========================================================
  HTML-ELEMEK MEGKERESÉSE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
 const productList = document.getElementById("product-list");
 const roomCanvas = document.getElementById("room-canvas");

 const categoryButtons = document.querySelectorAll(
   ".category-tab"
 );

 if (!productList) {
   console.error(
     "Nem található a #product-list elem az index.html-ben."
   );
   return;
 }

 if (!roomCanvas) {
   console.error(
     "Nem található a #room-canvas elem az index.html-ben."
   );
   return;
 }


 /* =======================================================
    TERMÉKKÁRTYÁK MEGJELENÍTÉSE
 ======================================================= */

 function renderProducts(category) {
   productList.innerHTML = "";

   const filteredProducts = PRODUCTS.filter(function (product) {
     return product.category === category;
   });

   if (filteredProducts.length === 0) {
     productList.innerHTML = `
       <div class="empty-product-message">
         <strong>Még nincsenek feltöltve termékek.</strong>
         <span>Ebben a kategóriában hamarosan megjelennek az elemek.</span>
       </div>
     `;

     return;
   }

   filteredProducts.forEach(function (product) {
     const card = document.createElement("button");

     card.type = "button";
     card.className = "product-card";
     card.dataset.productId = product.id;

     card.innerHTML = `
       <span class="product-card-image">
         <img
           src="${product.image}"
           alt="${product.name}"
           loading="lazy"

       </span>

       <span class="product-card-info">
         <strong>${product.name}</strong>
         <small>Kattints a hozzáadáshoz</small>
       </span>
     `;

     card.addEventListener("click", function () {
       addProductToCanvas(product);
     });

     productList.appendChild(card);
   });
 }


 /* =======================================================
    TERMÉK HOZZÁADÁSA A TERVEZŐFELÜLETHEZ
 ======================================================= */

 function addProductToCanvas(product) {
   const placeholder = roomCanvas.querySelector(
     ".canvas-placeholder"
   );

   if (placeholder) {
     placeholder.style.display = "none";
   }

   const item = document.createElement("div");

   item.className = "room-item selected";
   item.dataset.productId = product.id;
   item.dataset.productName = product.name;
   item.dataset.price = product.price || 0;

   const canvasWidth = roomCanvas.clientWidth;
   const canvasHeight = roomCanvas.clientHeight;

   const startLeft =
     Math.max(20, canvasWidth / 2 - product.defaultWidth / 2);

   const startTop =
     Math.max(20, canvasHeight / 2 - product.defaultWidth / 3);

   item.style.width = product.defaultWidth + "px";
   item.style.left = startLeft + "px";
   item.style.top = startTop + "px";
   item.style.zIndex = getNextZIndex();

   item.innerHTML = `
     <img
       src="${product.image}"
       alt="${product.name}"
       draggable="false"


     <button
       class="room-item-delete"
       type="button"
       aria-label="${product.name} törlése"

       ×
     </button>

     <span
       class="room-item-resize"
       aria-hidden="true"
</span>
   `;

   deselectAllItems();

   roomCanvas.appendChild(item);

   makeItemDraggable(item);
   makeItemResizable(item);

   const deleteButton = item.querySelector(
     ".room-item-delete"
   );

   deleteButton.addEventListener("click", function (event) {
     event.stopPropagation();
     item.remove();
   });

   item.addEventListener("pointerdown", function () {
     selectItem(item);
   });
 }


 /* =======================================================
    KIJELÖLÉS
 ======================================================= */

 function deselectAllItems() {
   roomCanvas
     .querySelectorAll(".room-item")
     .forEach(function (item) {
       item.classList.remove("selected");
     });
 }

 function selectItem(item) {
   deselectAllItems();
   item.classList.add("selected");
   item.style.zIndex = getNextZIndex();
 }

 roomCanvas.addEventListener("pointerdown", function (event) {
   if (event.target === roomCanvas) {
     deselectAllItems();
   }
 });


 /* =======================================================
    HÚZHATÓ TERMÉKEK
 ======================================================= */

 function makeItemDraggable(item) {
   let startPointerX = 0;
   let startPointerY = 0;
   let startLeft = 0;
   let startTop = 0;
   let dragging = false;

   item.addEventListener("pointerdown", function (event) {
     if (
       event.target.closest(".room-item-delete") ||
       event.target.closest(".room-item-resize")
     ) {
       return;
     }

     event.preventDefault();

     dragging = true;

     startPointerX = event.clientX;
     startPointerY = event.clientY;

     startLeft = item.offsetLeft;
     startTop = item.offsetTop;

     item.setPointerCapture(event.pointerId);
     selectItem(item);
   });

   item.addEventListener("pointermove", function (event) {
     if (!dragging) {
       return;
     }

     const differenceX =
       event.clientX - startPointerX;

     const differenceY =
       event.clientY - startPointerY;

     let newLeft = startLeft + differenceX;
     let newTop = startTop + differenceY;

     const maximumLeft =
       roomCanvas.clientWidth - item.offsetWidth;

     const maximumTop =
       roomCanvas.clientHeight - item.offsetHeight;

     newLeft = Math.max(
       0,
       Math.min(newLeft, maximumLeft)
     );

     newTop = Math.max(
       0,
       Math.min(newTop, maximumTop)
     );

     item.style.left = newLeft + "px";
     item.style.top = newTop + "px";
   });

   item.addEventListener("pointerup", function () {
     dragging = false;
   });

   item.addEventListener("pointercancel", function () {
     dragging = false;
   });
 }


 /* =======================================================
    MÉRETEZHETŐ TERMÉKEK
 ======================================================= */

 function makeItemResizable(item) {
   const resizeHandle = item.querySelector(
     ".room-item-resize"
   );

   let resizing = false;
   let startPointerX = 0;
   let startWidth = 0;

   resizeHandle.addEventListener(
     "pointerdown",
     function (event) {
       event.preventDefault();
       event.stopPropagation();

       resizing = true;

       startPointerX = event.clientX;
       startWidth = item.offsetWidth;

       resizeHandle.setPointerCapture(
         event.pointerId
       );

       selectItem(item);
     }
   );

   resizeHandle.addEventListener(
     "pointermove",
     function (event) {
       if (!resizing) {
         return;
       }

       const differenceX =
         event.clientX - startPointerX;

       const newWidth = Math.max(
         70,
         Math.min(
           startWidth + differenceX,
           roomCanvas.clientWidth
         )
       );

       item.style.width = newWidth + "px";
     }
   );

   resizeHandle.addEventListener(
     "pointerup",
     function () {
       resizing = false;
     }
   );

   resizeHandle.addEventListener(
     "pointercancel",
     function () {
       resizing = false;
     }
   );
 }


 /* =======================================================
    RÉTEGSORREND
 ======================================================= */

 function getNextZIndex() {
   const items = roomCanvas.querySelectorAll(
     ".room-item"
   );

   let highestZIndex = 10;

   items.forEach(function (item) {
     const currentZIndex =
       Number(item.style.zIndex) || 10;

     highestZIndex = Math.max(
       highestZIndex,
       currentZIndex
     );
   });

   return highestZIndex + 1;
 }


 /* =======================================================
    KATEGÓRIAGOMBOK
 ======================================================= */

 categoryButtons.forEach(function (button) {
   button.addEventListener("click", function () {
     const category = button.dataset.category;

     if (
       category === "walls" ||
       category === "rooms"
     ) {
       return;
     }

     categoryButtons.forEach(function (otherButton) {
       otherButton.classList.remove("active");
     });

     button.classList.add("active");

     renderProducts(category);
   });
 });


 /* Elsőként a bútorok megjelenítése. */
 renderProducts("furniture");
});