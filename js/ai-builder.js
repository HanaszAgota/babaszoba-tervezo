/* =========================================================
 MamaME Designer – AI Builder
 - minique WooCommerce termékek betöltése
 - termékválasztó modal
 - kiválasztott termékek kezelése
 - árösszesítés
 - AI elrendezés
 - 1 db AI 3D látványterv
========================================================= */

document.addEventListener(
   "DOMContentLoaded",
   () => {

       const selectProductsButton =
           document.getElementById(
               "ai-select-products"
           );

       const selectedProductsContainer =
           document.getElementById(
               "ai-selected-products"
           );

       const selectionCount =
           document.getElementById(
               "ai-selection-count"
           );

       const selectionTotal =
           document.getElementById(
               "ai-selection-total"
           );

       const autoLayoutButton =
           document.getElementById(
               "ai-auto-layout"
           );


       /* =====================================================
          STATE
       ===================================================== */

       let allProducts = [];

       const selectedProducts =
           new Map();


       /* =====================================================
          TERMÉKEK BETÖLTÉSE – MINIQUE WOOCOMMERCE
       ===================================================== */

       async function loadProducts() {

           try {

               const response =
                   await fetch(
                       "products-proxy.php"
                   );


               if (!response.ok) {

                   throw new Error(
                       `minique WooCommerce betöltési hiba: ${response.status}`
                   );
               }


               const data =
                   await response.json();


               if (!Array.isArray(data)) {

                   throw new Error(
                       "A minique API nem tömböt adott vissza."
                   );
               }


               /* =============================================
                  WOOCOMMERCE → DESIGNER FORMÁTUM
               ============================================= */

               allProducts =
                   data.map(
                       product => {

                           const minorUnit =
                               Number(
                                   product.prices
                                       ?.currency_minor_unit ??
                                   0
                               );


                           const rawPrice =
                               Number(
                                   product.prices
                                       ?.price ??
                                   0
                               );


                           const price =
                               rawPrice /
                               Math.pow(
                                   10,
                                   minorUnit
                               );


                           return {

                               id:
                                   String(
                                       product.id
                                   ),

                               name:
                                   product.name ??
                                   "Névtelen termék",

                               category:
                                   product.categories
                                       ?.[0]
                                       ?.slug ??
                                   "egyeb",

                               categoryName:
                                   product.categories
                                       ?.[0]
                                       ?.name ??
                                   "Egyéb",

                               image:
                                   product.images
                                       ?.[0]
                                       ?.src ??
                                   "",

                               price,

                               permalink:
                                   product.permalink ??
                                   "",

                               sku:
                                   product.sku ??
                                   "",

                               inStock:
                                   product.is_in_stock ??
                                   true,

                               /*
                                * KÉSŐBB:
                                * VALÓS TERMÉKMÉRETEK
                                */

                               realWidth:
                                   null,

                               realDepth:
                                   null,

                               realHeight:
                                   null,

                               /*
                                * EREDETI
                                * WOOCOMMERCE ADAT
                                */

                               wooData:
                                   product
                           };
                       }
                   );


               console.log(
                   "AI Builder – minique termékek betöltve:",
                   allProducts.length
               );


               console.log(
                   "Első minique termék:",
                   allProducts[0]
               );


               renderProductGrid();


           } catch (error) {

               console.error(
                   "Nem sikerült betölteni a minique termékeket:",
                   error
               );


               allProducts = [];
           }
       }


       /* =====================================================
          SEGÉDFÜGGVÉNYEK
       ===================================================== */

       function getProductId(
           product,
           index
       ) {

           return String(
               product.id ??
               product.productId ??
               product.slug ??
               product.name ??
               index
           );
       }


       function getProductName(
           product
       ) {

           return (
               product.name ??
               product.title ??
               "Névtelen termék"
           );
       }


       function getProductPrice(
           product
       ) {

           const rawPrice =
               product.price ??
               product.salePrice ??
               product.regularPrice ??
               0;


           if (
               typeof rawPrice ===
               "number"
           ) {

               return rawPrice;
           }


           const cleaned =
               String(rawPrice)
                   .replace(
                       /[^\d,.-]/g,
                       ""
                   )
                   .replace(
                       ",",
                       "."
                   );


           const parsed =
               Number(cleaned);


           return Number.isFinite(
               parsed
           )
               ? parsed
               : 0;
       }


       function getProductImage(
           product
       ) {

           return (
               product.image ??
               product.imageUrl ??
               product.thumbnail ??
               product.img ??
               ""
           );
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
               price
           );
       }


       /* =====================================================
          MODAL LÉTREHOZÁSA
       ===================================================== */

       function createProductModal() {

           const oldModal =
               document.getElementById(
                   "ai-product-modal"
               );


           if (oldModal) {

               oldModal.remove();
           }


           const modal =
               document.createElement(
                   "div"
               );


           modal.id =
               "ai-product-modal";

           modal.className =
               "ai-product-modal";


           modal.innerHTML = `
               <div class="ai-modal-backdrop"></div>

               <div
                   class="ai-modal-dialog"
                   role="dialog"
                   aria-modal="true"
                   aria-labelledby="ai-modal-title">

                   <div class="ai-modal-header">

                       <div>

                           <span class="section-kicker">
                               minique katalógus
                           </span>

                           <h3 id="ai-modal-title">
                               Válassz termékeket
                           </h3>

                       </div>

                       <button
                           type="button"
                           class="ai-modal-close"
                           aria-label="Bezárás">

                           ×
                       </button>

                   </div>

                   <div class="ai-modal-search">

                       <input
                           type="search"
                           id="ai-product-search"
                           placeholder="Keresés a termékek között...">

                   </div>

                   <div
                       class="ai-product-grid"
                       id="ai-product-grid">
                   </div>

                   <div class="ai-modal-footer">

                       <div class="ai-modal-summary">

                           <span id="ai-modal-count">
                               0 kiválasztott termék
                           </span>

                           <strong id="ai-modal-total">
                               0 Ft
                           </strong>

                       </div>

                       <button
                           type="button"
                           class="button button-primary"
                           id="ai-products-done">

                           Kiválasztás kész
                       </button>

                   </div>

               </div>
           `;


           document.body.appendChild(
               modal
           );


           const closeButton =
               modal.querySelector(
                   ".ai-modal-close"
               );

           const backdrop =
               modal.querySelector(
                   ".ai-modal-backdrop"
               );

           const doneButton =
               modal.querySelector(
                   "#ai-products-done"
               );

           const searchInput =
               modal.querySelector(
                   "#ai-product-search"
               );


           closeButton
               ?.addEventListener(
                   "click",
                   closeProductModal
               );


           backdrop
               ?.addEventListener(
                   "click",
                   closeProductModal
               );


           doneButton
               ?.addEventListener(
                   "click",
                   () => {

                       renderSelectedProducts();

                       closeProductModal();
                   }
               );


           searchInput
               ?.addEventListener(
                   "input",
                   event => {

                       renderProductGrid(
                           event.target.value
                       );
                   }
               );


           renderProductGrid();

           updateModalSummary();
       }

              /* =====================================================
          MODAL MEGNYITÁSA / ZÁRÁSA
       ===================================================== */

       function openProductModal() {

           createProductModal();

           document.body.classList.add(
               "ai-modal-open"
           );


           renderProductGrid();

           updateModalSummary();
       }


       function closeProductModal() {

           const modal =
               document.getElementById(
                   "ai-product-modal"
               );


           if (modal) {

               modal.remove();
           }


           document.body.classList.remove(
               "ai-modal-open"
           );
       }


       /* =====================================================
          TERMÉK GRID
       ===================================================== */

       function renderProductGrid(
           searchTerm = ""
       ) {

           const grid =
               document.getElementById(
                   "ai-product-grid"
               );


           if (!grid) {

               return;
           }


           const normalizedSearch =
               searchTerm
                   .trim()
                   .toLowerCase();


           const filteredProducts =
               allProducts.filter(
                   product => {

                       const name =
                           getProductName(
                               product
                           )
                               .toLowerCase();


                       const category =
                           String(
                               product.category ??
                               ""
                           )
                               .toLowerCase();


                       return (
                           !normalizedSearch ||
                           name.includes(
                               normalizedSearch
                           ) ||
                           category.includes(
                               normalizedSearch
                           )
                       );
                   }
               );


           grid.innerHTML =
               "";


           if (
               filteredProducts.length ===
               0
           ) {

               grid.innerHTML = `
                   <div class="ai-no-products">
                       Nem találtunk ilyen terméket.
                   </div>
               `;

               return;
           }


           filteredProducts.forEach(
               (product, index) => {

                   const id =
                       getProductId(
                           product,
                           index
                       );


                   const name =
                       getProductName(
                           product
                       );


                   const price =
                       getProductPrice(
                           product
                       );


                   const image =
                       getProductImage(
                           product
                       );


                   const isSelected =
                       selectedProducts.has(
                           id
                       );


                   const card =
                       document.createElement(
                           "label"
                       );


                   card.className =
                       "ai-product-card";


                   if (isSelected) {

                       card.classList.add(
                           "selected"
                       );
                   }


                   card.innerHTML = `

                       <input
                           type="checkbox"
                           value="${escapeHtml(id)}"
                           ${isSelected ? "checked" : ""}>


                       <div class="ai-product-image">

                           ${
                               image
                                   ? `
                                       <img
                                           src="${escapeHtml(image)}"
                                           alt="${escapeHtml(name)}"
                                           >

                                     `
                                   : `
                                       <span>
                                           Nincs kép
                                       </span>
                                     `
                           }

                       </div>


                       <div class="ai-product-info">

                           <strong>
                               ${escapeHtml(name)}
                           </strong>

                           <span>
                               ${formatPrice(price)}
                           </span>

                       </div>


                       <div class="ai-product-check">
                           ✓
                       </div>
                   `;


                   const checkbox =
                       card.querySelector(
                           "input"
                       );


                   checkbox
                       ?.addEventListener(
                           "change",
                           () => {

                               if (
                                   checkbox.checked
                               ) {

                                   selectedProducts.set(
                                       id,
                                       {
                                           ...product,
                                           _aiId:
                                               id
                                       }
                                   );


                                   card.classList.add(
                                       "selected"
                                   );

                               } else {

                                   selectedProducts.delete(
                                       id
                                   );


                                   card.classList.remove(
                                       "selected"
                                   );
                               }


                               updateModalSummary();

                               updateMainSummary();
                           }
                       );


                   grid.appendChild(
                       card
                   );
               }
           );
       }


       /* =====================================================
          KIVÁLASZTOTT TERMÉKEK LISTÁJA
       ===================================================== */

       function renderSelectedProducts() {

           if (
               selectedProducts.size ===
               0
           ) {

               selectedProductsContainer.innerHTML = `
                   <p class="ai-empty">
                       Még nem választottál terméket.
                   </p>
               `;


               updateMainSummary();

               return;
           }


           selectedProductsContainer.innerHTML =
               "";


           selectedProducts.forEach(
               (product, id) => {

                   const name =
                       getProductName(
                           product
                       );


                   const price =
                       getProductPrice(
                           product
                       );


                   const image =
                       getProductImage(
                           product
                       );


                   const item =
                       document.createElement(
                           "div"
                       );


                   item.className =
                       "ai-selected-item";


                   item.innerHTML = `

                       <div class="ai-selected-thumb">

                           ${
                               image
                                   ? `
                                       <img
                                           src="${escapeHtml(image)}"
                                           alt="${escapeHtml(name)}">
                                        

                                     `
                                   : ""
                           }

                       </div>


                       <div class="ai-selected-info">

                           <strong>
                               ${escapeHtml(name)}
                           </strong>

                           <span>
                               ${formatPrice(price)}
                           </span>

                       </div>


                       <button
                           type="button"
                           class="ai-remove-product"
                           aria-label="${escapeHtml(name)} eltávolítása">

                           ×
                       </button>
                   `;


                   item
                       .querySelector(
                           ".ai-remove-product"
                       )
                       ?.addEventListener(
                           "click",
                           () => {

                               selectedProducts.delete(
                                   id
                               );


                               renderSelectedProducts();
                           }
                       );


                   selectedProductsContainer
                       .appendChild(
                           item
                       );
               }
           );


           updateMainSummary();
       }


       /* =====================================================
          ÖSSZESÍTÉS
       ===================================================== */

       function getSelectedTotal() {

           let total =
               0;


           selectedProducts.forEach(
               product => {

                   total +=
                       getProductPrice(
                           product
                       );
               }
           );


           return total;
       }


       function updateMainSummary() {

           const count =
               selectedProducts.size;


           if (selectionCount) {

               selectionCount.textContent =
                   `${count} kiválasztott termék`;
           }


           if (selectionTotal) {

               selectionTotal.textContent =
                   formatPrice(
                       getSelectedTotal()
                   );
           }
       }


       function updateModalSummary() {

           const countElement =
               document.getElementById(
                   "ai-modal-count"
               );


           const totalElement =
               document.getElementById(
                   "ai-modal-total"
               );


           if (
               !countElement ||
               !totalElement
           ) {

               return;
           }


           countElement.textContent =
               `${selectedProducts.size} kiválasztott termék`;


           totalElement.textContent =
               formatPrice(
                   getSelectedTotal()
               );
       }


       /* =====================================================
          HTML ESCAPE
       ===================================================== */

       function escapeHtml(
           value
       ) {

           return String(
               value
           )
               .replaceAll(
                   "&",
                   "&amp;"
               )
               .replaceAll(
                   "<",
                   "&lt;"
               )
               .replaceAll(
                   ">",
                   "&gt;"
               )
               .replaceAll(
                   '"',
                   "&quot;"
               )
               .replaceAll(
                   "'",
                   "&#039;"
               );
       }


       /* =====================================================
          KIVÁLASZTOTT AI TERV MENTÉSE
       ===================================================== */

       function saveChosenLayout(
           layout
       ) {

           const project = {

               room: {

                   width:
                       Number(
                           document.getElementById(
                               "ai-room-width"
                           )?.value
                       ),

                   length:
                       Number(
                           document.getElementById(
                               "ai-room-length"
                           )?.value
                       ),

                   height:
                       Number(
                           document.getElementById(
                               "ai-room-height"
                           )?.value
                       )
               },


               products:
                   Array.from(
                       selectedProducts.values()
                   ),


               layout
           };


           sessionStorage.setItem(
               "mamame-ai-room",
               JSON.stringify(
                   project
               )
           );


           alert(
               "A kiválasztott AI tervet elmentettem."
           );
       }

              /* =====================================================
          AI RENDEZZE BE
          1 DB AI ELRENDEZÉS + 1 DB 3D LÁTVÁNYTERV
       ===================================================== */

       autoLayoutButton
           ?.addEventListener(
               "click",
               async () => {

                   if (
                       !validateAIRequest()
                   ) {

                       return;
                   }


                   const request =
                       buildAIRequest(
                           "single"
                       );


                   autoLayoutButton.disabled =
                       true;


                   const originalText =
                       autoLayoutButton.innerHTML;


                   autoLayoutButton.innerHTML =
                       "✦ AI tervezés folyamatban...";


                   try {

                       /* =====================================
                          1. ELRENDEZÉS KÉRÉSE
                       ===================================== */

                       const response =
                           await fetch(
                               "ai-layout.php",
                               {
                                   method:
                                       "POST",

                                   headers: {
                                       "Content-Type":
                                           "application/json"
                                   },

                                   body:
                                       JSON.stringify(
                                           request
                                       )
                               }
                           );


                       const data =
                           await response.json();


                       console.log(
                           "AI elrendezés válasz:",
                           data
                       );


                       if (
                           !response.ok
                       ) {

                           throw new Error(
                               data.details
                                   ?.error
                                   ?.message ??
                               data.error ??
                               "AI elrendezési hiba."
                           );
                       }


                       if (
                           !data.success ||
                           !Array.isArray(
                               data.layout
                           )
                       ) {

                           throw new Error(
                               "Az AI nem adott használható elrendezést."
                           );
                       }


                       /* =====================================
                          2. 3D KÉP GENERÁLÁSA
                       ===================================== */

                       autoLayoutButton.innerHTML =
                           "✦ 3D látványterv készül...";


                       const generatedImage =
                           await generateAIImage({
                               layout:
                                   data.layout
                           });


                       /* =====================================
                          RÉGI EREDMÉNY TÖRLÉSE
                       ===================================== */

                       document
                           .getElementById(
                               "ai-image-results"
                           )
                           ?.remove();


                       /* =====================================
                          ÚJ 3D TERV MEGJELENÍTÉSE
                       ===================================== */

                       renderAIImageCard({

                           title:
                               "AI babaszoba látványterv",

                           description:
                               data.summary ??
                               "",

                           image:
                               generatedImage,

                           layout:
                               data.layout
                       });


                   } catch (error) {

                       console.error(
                           "AI tervezési hiba:",
                           error
                       );


                       alert(
                           "Nem sikerült elkészíteni az AI látványtervet.\n\n" +
                           error.message
                       );


                   } finally {

                       autoLayoutButton.disabled =
                           false;


                       autoLayoutButton.innerHTML =
                           originalText;
                   }
               }
           );


       /* =====================================================
          AI 3D KÉP KÉRÉSE
       ===================================================== */

       async function generateAIImage({
           layout
       }) {

           /*
            * Ugyanazokat a kiválasztott termékeket
            * küldjük tovább, amelyekből
            * az elrendezés készült.
            */

           const request =
               buildAIRequest(
                   "single"
               );


           const payload = {

               mode:
                   "single",

               room:
                   request.room,

               products:
                   request.products,

               layout
           };


           const response =
               await fetch(
                   "ai-image.php",
                   {
                       method:
                           "POST",

                       headers: {
                           "Content-Type":
                               "application/json"
                       },

                       body:
                           JSON.stringify(
                               payload
                           )
                   }
               );


           const data =
               await response.json();


           console.log(
               "AI 3D kép válasz:",
               data
           );


           if (
               !response.ok
           ) {

               throw new Error(
                   data.details
                       ?.error
                       ?.message ??
                   data.error ??
                   "AI képgenerálási hiba."
               );
           }


           if (
               !data.success ||
               !data.image
           ) {

               throw new Error(
                   "Az AI nem adott vissza 3D látványképet."
               );
           }


           return data.image;
       }


       /* =====================================================
          AI 3D LÁTVÁNYTERV MEGJELENÍTÉSE
       ===================================================== */

       function renderAIImageCard({
           title,
           description,
           image,
           layout
       }) {

           let resultSection =
               document.getElementById(
                   "ai-image-results"
               );


           if (
               !resultSection
           ) {

               resultSection =
                   document.createElement(
                       "section"
                   );


               resultSection.id =
                   "ai-image-results";


               resultSection.className =
                   "ai-image-results";


               const aiSection =
                   document.getElementById(
                       "ai-tervezo"
                   );


               aiSection
                   ?.insertAdjacentElement(
                       "afterend",
                       resultSection
                   );
           }


           /*
            * Biztosítjuk, hogy egyszerre
            * csak az aktuális AI terv
            * legyen látható.
            */

           resultSection.innerHTML =
               "";


           const card =
               document.createElement(
                   "article"
               );


           card.className =
               "ai-image-result-card";


           card.innerHTML = `

               <div class="ai-image-result-copy">

                   <span class="section-kicker">
                       AI 3D látványterv
                   </span>

                   <h3>
                       ${escapeHtml(title)}
                   </h3>

                   ${
                       description
                           ? `
                               <p>
                                   ${escapeHtml(description)}
                               </p>
                             `
                           : ""
                   }

               </div>


               <div class="ai-generated-image">

                   <img
                       src="${image}"
                       alt="${escapeHtml(title)}"
                       >


               </div>


               <button
                   type="button"
                   class="button button-primary ai-save-image-layout">

                   Ezt a tervet választom
               </button>
           `;


           const saveButton =
               card.querySelector(
                   ".ai-save-image-layout"
               );


           saveButton
               ?.addEventListener(
                   "click",
                   () => {

                       saveChosenLayout(
                           layout
                       );
                   }
               );


           resultSection.appendChild(
               card
           );


           resultSection.scrollIntoView({
               behavior:
                   "smooth",

               block:
                   "start"
           });
       }

              /* =====================================================
          AI REQUEST ÖSSZEÁLLÍTÁSA
       ===================================================== */

       function buildAIRequest(
           mode = "single"
       ) {

           const width =
               Number(
                   document.getElementById(
                       "ai-room-width"
                   )?.value
               );


           const length =
               Number(
                   document.getElementById(
                       "ai-room-length"
                   )?.value
               );


           const height =
               Number(
                   document.getElementById(
                       "ai-room-height"
                   )?.value
               );


           return {

               mode,

               room: {

                   width,

                   length,

                   height
               },


               products:
                   Array.from(
                       selectedProducts.values()
                   )
                       .map(
                           product => ({

                               id:
                                   String(
                                       product._aiId
                                   ),

                               name:
                                   getProductName(
                                       product
                                   ),

                               image:
                                   getProductImage(
                                       product
                                   ),

                               price:
                                   getProductPrice(
                                       product
                                   ),

                               width:
                                   product.realWidth ??
                                   product.width ??
                                   null,

                               depth:
                                   product.realDepth ??
                                   product.depth ??
                                   null,

                               height:
                                   product.realHeight ??
                                   product.height ??
                                   null,

                               category:
                                   product.category ??
                                   null
                           })
                       )
           };
       }


       /* =====================================================
          VALIDÁCIÓ
       ===================================================== */

       function validateAIRequest() {

           const request =
               buildAIRequest(
                   "single"
               );


           if (
               !request.room.width ||
               !request.room.length
           ) {

               alert(
                   "Add meg legalább a szoba szélességét és hosszúságát."
               );


               return false;
           }


           if (
               selectedProducts.size ===
               0
           ) {

               alert(
                   "Válassz legalább egy terméket a szobához."
               );


               return false;
           }


           return true;
       }


       /* =====================================================
          EVENTS
       ===================================================== */

       selectProductsButton
           ?.addEventListener(
               "click",
               openProductModal
           );


       /* =====================================================
          INIT
       ===================================================== */

       loadProducts();

       updateMainSummary();

   }
);