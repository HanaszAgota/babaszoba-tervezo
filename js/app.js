"use strict";

document.addEventListener("DOMContentLoaded", function () {
 const categoryButtons = document.querySelectorAll(
   ".category-tab[data-category]"
 );

 const productList =
   document.querySelector("#product-list") ||
   document.querySelector(".product-list") ||
   document.querySelector("[data-product-list]");

 if (!productList) {
   console.error(
     'Nem található a terméklista. Az index.html-ben legyen egy id="product-list" elem.'
   );
   return;
 }

 const categoryNames = {
   rooms: "Kész szobák",
   walls: "Falak",
   chairs: "Fotelek",
   furniture: "Bútorok",
   montessori: "Montessori",
   sofas: "Kanapék",
   decor: "Dekor",
   textiles: "Textilek",
   toys: "Játékok"
 };

 let allProducts = [];
 let activeCategory = "rooms";

 /**
  * A products.json betöltése.
  */
 async function loadProducts() {
   showLoading();

   try {
     const response = await fetch("data/products.json", {
       cache: "no-store"
     });

     if (!response.ok) {
       throw new Error(
         `A products.json nem tölthető be. Hibakód: ${response.status}`
       );
     }

     const data = await response.json();

     if (!Array.isArray(data)) {
       throw new Error(
         "A products.json tartalma nem megfelelő: egy tömböt kell tartalmaznia."
       );
     }

     allProducts = data;

     console.log(`${allProducts.length} termék betöltve.`);
     renderCategory(activeCategory);
   } catch (error) {
     console.error(error);
     showError(error.message);
   }
 }

 /**
  * Egy kategória termékeinek megjelenítése.
  */
 function renderCategory(category) {
   activeCategory = category;

   const categoryProducts = allProducts.filter(function (product) {
     return product.category === category;
   });

   updateActiveButton(category);

   const categoryTitle = categoryNames[category] || "Termékek";

   if (categoryProducts.length === 0) {
     productList.innerHTML = `
       <div class="product-list-header">
         <h3>${escapeHtml(categoryTitle)}</h3>
         <span>0 termék</span>
       </div>

       <div class="product-empty-state">
         <p>Ebben a kategóriában még nincs megjeleníthető termék.</p>
       </div>
     `;

     return;
   }

   const cards = categoryProducts
     .map(function (product) {
       return createProductCard(product);
     })
     .join("");

   productList.innerHTML = `
     <div class="product-list-header">
       <h3>${escapeHtml(categoryTitle)}</h3>
       <span>${categoryProducts.length} termék</span>
     </div>

     <div class="product-grid">
       ${cards}
     </div>
   `;
 }

 /**
  * Egy termékkártya HTML-je.
  *
  * Ebben a lépésben a kártyára kattintás még nem teszi be
  * a terméket a szobába. Ez lesz a 3. lépés.
  */
 function createProductCard(product) {
   const id = escapeHtml(String(product.id || ""));
   const name = escapeHtml(product.name || "Névtelen termék");
   const image = escapeHtml(product.image || "");

   return `
     <button
       class="product-card"
       onclick="selectProduct('${product.id}')"
       type="button"
       data-product-id="${id}"
       aria-label="${name}"

       <span class="product-card-image">
         <img
           src="${image}"
           alt="${name}"
           loading="lazy"
           draggable="false"

       </span>

       <span class="product-card-name">
         ${name}
       </span>
     </button>
   `;
 }

 /**
  * Az aktív kategóriagomb kijelölése.
  */
 function updateActiveButton(category) {
   categoryButtons.forEach(function (button) {
     const isActive = button.dataset.category === category;

     button.classList.toggle("active", isActive);
     button.setAttribute("aria-pressed", String(isActive));
   });
 }

 function showLoading() {
   productList.innerHTML = `
     <div class="product-loading">
       <span class="product-loading-spinner"></span>
       <p>Termékek betöltése…</p>
     </div>
   `;
 }

 function showError(message) {
   productList.innerHTML = `
     <div class="product-error">
       <strong>A termékeket nem sikerült betölteni.</strong>
       <p>${escapeHtml(message)}</p>
       <p>
         Ellenőrizd, hogy a fájl itt található-e:
         <code>data/products.json</code>
       </p>
     </div>
   `;
 }

 function escapeHtml(value) {
   return String(value)
     .replaceAll("&", "&amp;")
     .replaceAll("<", "&lt;")
     .replaceAll(">", "&gt;")
     .replaceAll('"', "&quot;")
     .replaceAll("'", "&#039;");
 }

 /**
  * Kategóriagombok kezelése.
  */
 categoryButtons.forEach(function (button) {
   button.addEventListener("click", function () {
     const category = button.dataset.category;

     if (!category) {
       return;
     }

     renderCategory(category);
   });
 });

 window.selectProduct = function(id) {
   const product = allProducts.find(function (item) {
       return item.id === id;
   });

   if (!product) {
       console.error("Nem található termék:", id);
       return;
   }

   if (product.category === "walls") {
       if (typeof window.applyWall === "function") {
           window.applyWall(product);
       }

       return;
   }

   if (typeof window.addProductToRoom === "function") {
       window.addProductToRoom(product);
   } else {
       console.error("Az addProductToRoom függvény nem érhető el.");
   }
}

 loadProducts();
});

const newPlanButton = document.getElementById("new-plan-button");

if (newPlanButton) {
    newPlanButton.addEventListener("click", function () {
        clearRoom();
    });
}