"use strict";

document.addEventListener(
   "DOMContentLoaded",
   function () {

       /* =====================================================
          DEKORFALAK
       ====================================================== */

       const walls = [

           {
               id: "barackalom",
               name: "Barackálom",
               category: "walls",
               image: "images/walls/barackalom.png",
               image3d:"images/walls/barackalom-3d.png"
           },

           {
               id: "erdei-hajnal",
               name: "Erdei Hajnal",
               category: "walls",
               image: "images/walls/erdei-hajnal.png",
               image3d:"images/walls/erdei-hajnal-3d.png"
           },

           {
               id: "felhos-egbolt",
               name: "Felhős Égbolt",
               category: "walls",
               image: "images/walls/felhos-egbolt.png",
               image3d:"images/walls/felhos-egbolt-3d.png"
           },

           {
               id: "malyvarozsa",
               name: "Mályvarózsa",
               category: "walls",
               image: "images/walls/malyvarozsa.png",
               image3d:"images/walls/malyvarozsa-3d.png"
           },

           {
               id: "meleg-latte",
               name: "Meleg Latte",
               category: "walls",
               image: "images/walls/meleg-latte.png",
               image3d:"images/walls/meleg-latte-3d.png"
           },

           {
               id: "oliva-harmonia",
               name: "Olíva Harmónia",
               category: "walls",
               image: "images/walls/oliva-harmonia.png",
               image3d:"images/walls/oliva-harmonia-3d.png"
           },

           {
               id: "puderfelho",
               name: "Púderfelhő",
               category: "walls",
               image: "images/walls/puderfelho.png",
               image3d:"images/walls/puderfelho-3d.png"
           },

           {
               id: "selyemhomok",
               name: "Selyemhomok",
               category: "walls",
               image: "images/walls/selyemhomok.png",
               image3d:"images/walls/selyemhomok-3d.png"
           },

           {
               id: "tiszta-forras",
               name: "Tiszta Forrás",
               category: "walls",
               image: "images/walls/tiszta-forras.png",
               image3d:"images/walls/tiszta-forras-3d.png"
           }

       ];


       /* =====================================================
          HTML ELEMEK
       ====================================================== */

       const wallsButton =
           document.querySelector(
               '.category-tab[data-category="walls"]'
           );


       const productList =
           document.getElementById(
               "product-list"
           );


       const roomCanvas =
           document.getElementById(
               "room-canvas"
           );


       const room3dView =
           document.getElementById(
               "room-3d-view"
           );


       const threeDFrame =
           document.getElementById(
               "three-d-frame"
           );


       if (
           !wallsButton ||
           !productList ||
           !roomCanvas
       ) {

           console.error(
               "A dekorfalakhoz szükséges HTML-elemek nem találhatók."
           );

           return;
       }


       /* =====================================================
          3D NÉZET AKTÍV?
       ====================================================== */

       function isThreeDViewActive() {

           return (
               room3dView &&
               !room3dView.hidden
           );
       }


       /* =====================================================
          DEKORFAL ALKALMAZÁSA
       ====================================================== */

       function applySelectedWall(
           wall,
           card
       ) {

           /* =============================================
              3D NÉZET
           ============================================== */

           if (
               isThreeDViewActive()
           ) {

               if (
                   !threeDFrame ||
                   !threeDFrame.contentWindow
               ) {

                   console.error(
                       "A 3D iframe nem található."
                   );

                   return;
               }


               threeDFrame.contentWindow.postMessage(
                   {

                       type:
                           "MINIQUE_APPLY_3D_WALL",

                       product: {
                           id: wall.id,
                           name: wall.name,
                           category: wall.category,
                           image: 
                                  wall.image3d || wall.image
                       }

                   },

                   window.location.origin
               );


               console.log(
                   "Dekorfal elküldve a 3D szobának:",
                   wall.name
               );


               markSelectedCard(
                   card
               );


               return;
           }


           /* =============================================
              2D NÉZET
           ============================================== */

           roomCanvas.style.backgroundImage =
               `url("${wall.image}")`;


           roomCanvas.style.backgroundSize =
               "cover";


           roomCanvas.style.backgroundPosition =
               "center top";


           roomCanvas.style.backgroundRepeat =
               "no-repeat";


           const placeholder =
               roomCanvas.querySelector(
                   ".canvas-placeholder"
               );


           if (
               placeholder
           ) {

               placeholder.style.display =
                   "none";
           }


           markSelectedCard(
               card
           );
       }


       /* =====================================================
          KIJELÖLT KÁRTYA
       ====================================================== */

       function markSelectedCard(
           selectedCard
       ) {

           document
               .querySelectorAll(
                   ".wall-product-card"
               )
               .forEach(
                   function (card) {

                       card.classList.remove(
                           "selected"
                       );
                   }
               );


           if (
               selectedCard
           ) {

               selectedCard.classList.add(
                   "selected"
               );
           }
       }


       /* =====================================================
          DEKORFALAK LISTÁZÁSA
       ====================================================== */

       function showWalls() {

           productList.innerHTML =
               "";


           walls.forEach(
               function (wall) {

                   const card =
                       document.createElement(
                           "button"
                       );


                   card.type =
                       "button";


                   card.className =
                       "wall-product-card";


                   card.dataset.wallId =
                       wall.id;


                   const image =
                       document.createElement(
                           "img"
                       );


                   image.src =
                       wall.image;


                   image.alt =
                       wall.name;


                   image.draggable =
                       false;


                   const name =
                       document.createElement(
                           "span"
                       );


                   name.textContent =
                       wall.name;


                   card.appendChild(
                       image
                   );


                   card.appendChild(
                       name
                   );


                   card.addEventListener(
                       "click",
                       function () {

                           applySelectedWall(
                               wall,
                               card
                           );

                       }
                   );


                   productList.appendChild(
                       card
                   );
               }
           );
       }


       /* =====================================================
          DEKOR FALAK KATEGÓRIA
       ====================================================== */

       wallsButton.addEventListener(
           "click",
           function () {

               document
                   .querySelectorAll(
                       ".category-tab"
                   )
                   .forEach(
                       function (
                           button
                       ) {

                           button.classList.remove(
                               "active"
                           );
                       }
                   );


               wallsButton.classList.add(
                   "active"
               );


               showWalls();

           }
       );

   }
);