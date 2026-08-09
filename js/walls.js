document.addEventListener("DOMContentLoaded", function () {
 const walls = [
   {
     name: "Barackálom",
     image: "images/walls/barackalom.png"
   },
   {
     name: "Erdei Hajnal",
     image: "images/walls/erdei-hajnal.png"
   },
   {
     name: "Felhős Égbolt",
     image: "images/walls/felhos-egbolt.png"
   },
   {
     name: "Mályvarózsa",
     image: "images/walls/malyvarozsa.png"
   },
   {
     name: "Meleg Latte",
     image: "images/walls/meleg-latte.png"
   },
   {
     name: "Olíva Harmónia",
     image: "images/walls/oliva-harmonia.png"
   },
   {
     name: "Púderfelhő",
     image: "images/walls/puderfelho.png"
   },
   {
     name: "Selyemhomok",
     image: "images/walls/selyemhomok.png"
   },
   {
     name: "Tiszta Forrás",
     image: "images/walls/tiszta-forras.png"
   },
 ];

 

 const wallsButton = document.querySelector(
   '.category-tab[data-category="walls"]'
 );

 const productList = document.getElementById("product-list");
 const roomCanvas = document.getElementById("room-canvas");

 function showWalls() {
   productList.innerHTML = "";

   walls.forEach(function (wall) {
     const card = document.createElement("button");

     card.type = "button";
     card.className = "wall-product-card";

     card.innerHTML = `
       <img src="${wall.image}" alt="${wall.name}">
       <span>${wall.name}</span>
     `;

     card.addEventListener("click", function () {
       roomCanvas.style.backgroundImage = `url("${wall.image}")`;
       roomCanvas.style.backgroundSize = "cover";
       roomCanvas.style.backgroundPosition = "center top";
       roomCanvas.style.backgroundRepeat = "no-repeat";

       const placeholder =
         roomCanvas.querySelector(".canvas-placeholder");

       if (placeholder) {
         placeholder.style.display = "none";
       }

       document
         .querySelectorAll(".wall-product-card")
         .forEach(function (item) {
           item.classList.remove("selected");
         });

       card.classList.add("selected");
     });

     productList.appendChild(card);
   });
 }

 if (wallsButton) {
   wallsButton.addEventListener("click", function () {
     document
       .querySelectorAll(".category-tab")
       .forEach(function (button) {
         button.classList.remove("active");
       });

     wallsButton.classList.add("active");
     showWalls();
   });
 }
});