"use strict";

import * as THREE from "three";

import {
   OrbitControls
} from "three/addons/controls/OrbitControls.js";


document.addEventListener("DOMContentLoaded", function () {

   /*
    * HTML-ELEMEK
    */

   const roomCanvas =
       document.getElementById("room-canvas");

   const room3dView =
       document.getElementById("room-3d-view");

   const threeDContainer =
       document.getElementById("three-d-room");

   const show2dButton =
       document.getElementById("show-2d-button");

   const show3dButton =
       document.getElementById("show-3d-button");

   const frontWallButton =
       document.getElementById("toggle-front-wall");

   const doorButton =
       document.getElementById("add-door-button");

   const windowButton =
       document.getElementById("add-window-button");

   const deleteButton =
       document.getElementById("delete-selected");

   const bringForwardButton =
       document.getElementById("bring-forward");

   const sendBackwardButton =
       document.getElementById("send-backward");

   const threeDControls =
       document.querySelector(".three-d-controls");


   if (
       !roomCanvas ||
       !room3dView ||
       !threeDContainer ||
       !show2dButton ||
       !show3dButton
   ) {
       console.error(
           "A 3D nézet HTML-elemei nem találhatók."
       );

       return;
   }


   /*
    * A MŰKÖDŐ 2D TERMÉKHOZZÁADÁS MEGŐRZÉSE
    */

   const originalAddProductToRoom =
       window.addProductToRoom;

   if (
       typeof originalAddProductToRoom !==
       "function"
   ) {
       console.error(
           "A 2D addProductToRoom függvény nem található."
       );

       return;
   }


   /*
    * 3D ÁLLAPOT
    */

   let scene = null;
   let camera = null;
   let renderer = null;
   let orbitControls = null;

   let backWall = null;
   let leftWall = null;
   let rightWall = null;
   let frontWall = null;

   let doorGroup = null;
   let windowGroup = null;
   let productGroup = null;

   let selected3dProduct = null;
   let selectionHelper = null;

   let threeDInitialized = false;
   let frontWallVisible = false;
   let doorVisible = false;
   let windowVisible = false;

   let isDraggingProduct = false;
   let dragOffsetX = 0;
   let dragOffsetZ = 0;

   let windowMenu =null;

   const raycaster =
       new THREE.Raycaster();

   const pointer =
       new THREE.Vector2();

   const floorDragPlane =
       new THREE.Plane(
           new THREE.Vector3(0, 1, 0),
           0
       );

   const dragIntersection =
       new THREE.Vector3();


   /*
    * SZOBAMÉRETEK
    */

   const roomWidth = 6;
   const roomHeight = 3.2;
   const roomDepth = 5;


   /*
    * NÉZET ELLENŐRZÉSE
    */

   function isThreeDViewActive() {
       return !room3dView.hidden;
   }


   /*
    * TERMÉKKATTINTÁS ÁTIRÁNYÍTÁSA
    *
    * 2D nézetben: az eredeti 2D függvény fut.
    * 3D nézetben: a termék külön a 3D szobába kerül.
    */

   window.addProductToRoom =
       function (product) {

           if (isThreeDViewActive()) {
               addProductToThreeD(product);
               return;
           }

           originalAddProductToRoom(product);
       };


   /*
    * 3D SZÍNPAD INDÍTÁSA
    */

   function initializeThreeDRoom() {
       if (threeDInitialized) {
           return;
       }

       threeDInitialized = true;

       createScene();
       createRoom();
       createDoor();
       createWindow();
       createLights();
       createProductControls();
       createWallColorControls();
       addPointerEvents();

       handleResize();
       animate();
   }


   /*
    * JELENET, KAMERA, RENDERER
    */

   function createScene() {
       scene = new THREE.Scene();

       scene.background =
           new THREE.Color(0xf5f2ec);

       camera =
           new THREE.PerspectiveCamera(
               43,
               getContainerAspect(),
               0.1,
               100
           );

       camera.position.set(
           7,
           4.6,
           8
       );

       renderer =
           new THREE.WebGLRenderer({
               antialias: true
           });

       renderer.setPixelRatio(
           Math.min(
               window.devicePixelRatio,
               2
           )
       );

       renderer.setSize(
           getContainerWidth(),
           getContainerHeight()
       );

       renderer.shadowMap.enabled = true;

       renderer.shadowMap.type =
           THREE.PCFSoftShadowMap;

       renderer.outputColorSpace =
           THREE.SRGBColorSpace;

       renderer.domElement.style.touchAction =
           "none";

       threeDContainer.appendChild(
           renderer.domElement
       );

       renderer.domElement.style.display = "block";
       renderer.domElement.style.margin = "0"

       orbitControls =
           new OrbitControls(
               camera,
               renderer.domElement
           );

       orbitControls.target.set(
           0,
           1.35,
           0
       );

       orbitControls.enableDamping = true;
       orbitControls.dampingFactor = 0.06;

       orbitControls.enablePan = false;

       orbitControls.minDistance = 5;
       orbitControls.maxDistance = 14;

       orbitControls.minPolarAngle =
           THREE.MathUtils.degToRad(42);

       orbitControls.maxPolarAngle =
           THREE.MathUtils.degToRad(84);

       orbitControls.update();

       productGroup =
           new THREE.Group();

       productGroup.name =
           "three-d-products";

       scene.add(productGroup);
   }


   /*
    * SZOBATEST
    */

   function createRoom() {
       const floorMaterial =
           new THREE.MeshStandardMaterial({
               color: 0xc9a982,
               roughness: 0.8,
               metalness: 0,
               side: THREE.DoubleSide
           });

       const floor =
           new THREE.Mesh(
               new THREE.PlaneGeometry(
                   roomWidth,
                   roomDepth
               ),
               floorMaterial
           );

       floor.rotation.x =
           -Math.PI / 2;

       floor.receiveShadow = true;

       scene.add(floor);


       backWall = createWall(
           roomWidth,
           roomHeight
       );

       backWall.position.set(
           0,
           roomHeight / 2,
           -roomDepth / 2
       );

       scene.add(backWall);


       leftWall = createWall(
           roomDepth,
           roomHeight
       );

       leftWall.rotation.y =
           Math.PI / 2;

       leftWall.position.set(
           -roomWidth / 2,
           roomHeight / 2,
           0
       );

       scene.add(leftWall);


       rightWall = createWall(
           roomDepth,
           roomHeight
       );

       rightWall.rotation.y =
           -Math.PI / 2;

       rightWall.position.set(
           roomWidth / 2,
           roomHeight / 2,
           0
       );

       scene.add(rightWall);


       frontWall = createWall(
           roomWidth,
           roomHeight
       );

       frontWall.rotation.y =
           Math.PI;

       frontWall.position.set(
           0,
           roomHeight / 2,
           roomDepth / 2
       );

       frontWall.visible = false;

       scene.add(frontWall);

       createSkirtingBoards();
   }


   function createWall(width, height) {
       const material =
           new THREE.MeshStandardMaterial({
               color: 0xeee8df,
               roughness: 0.92,
               metalness: 0,
               side: THREE.DoubleSide
           });

       const wall =
           new THREE.Mesh(
               new THREE.PlaneGeometry(
                   width,
                   height
               ),
               material
           );

       wall.receiveShadow = true;

       return wall;
   }


   /*
    * SZEGŐLÉCEK
    */

   function createSkirtingBoards() {
       const material =
           new THREE.MeshStandardMaterial({
               color: 0xffffff,
               roughness: 0.82
           });

       createSkirting(
           roomWidth,
           0.12,
           0.08,
           0,
           0.06,
           -roomDepth / 2 + 0.04,
           material
       );

       createSkirting(
           0.08,
           0.12,
           roomDepth,
           -roomWidth / 2 + 0.04,
           0.06,
           0,
           material
       );

       createSkirting(
           0.08,
           0.12,
           roomDepth,
           roomWidth / 2 - 0.04,
           0.06,
           0,
           material
       );
   }


   function createSkirting(
       width,
       height,
       depth,
       x,
       y,
       z,
       material
   ) {
       const skirting =
           new THREE.Mesh(
               new THREE.BoxGeometry(
                   width,
                   height,
                   depth
               ),
               material
           );

       skirting.position.set(x, y, z);

       skirting.receiveShadow = true;

       scene.add(skirting);
   }


   /*
    * AJTÓ
    */

   function createDoor() {
       doorGroup =
           new THREE.Group();

       const doorMaterial =
           new THREE.MeshStandardMaterial({
               color: 0xe4d6c6,
               roughness: 0.76
           });

       const frameMaterial =
           new THREE.MeshStandardMaterial({
               color: 0xffffff,
               roughness: 0.82
           });

       const door =
           new THREE.Mesh(
               new THREE.BoxGeometry(
                   1.05,
                   2.2,
                   0.08
               ),
               doorMaterial
           );

       door.position.y = 1.1;

       doorGroup.add(door);

       const topFrame =
           new THREE.Mesh(
               new THREE.BoxGeometry(
                   1.2,
                   0.08,
                   0.12
               ),
               frameMaterial
           );

       topFrame.position.set(
           0,
           2.24,
           0.02
       );

       doorGroup.add(topFrame);

       const leftFrame =
           new THREE.Mesh(
               new THREE.BoxGeometry(
                   0.08,
                   2.3,
                   0.12
               ),
               frameMaterial
           );

       leftFrame.position.set(
           -0.56,
           1.15,
           0.02
       );

       doorGroup.add(leftFrame);

       const rightFrame =
           leftFrame.clone();

       rightFrame.position.x = 0.56;

       doorGroup.add(rightFrame);

       doorGroup.position.set(
           1.75,
           0,
           -roomDepth / 2 + 0.06
       );

       doorGroup.visible = false;

       scene.add(doorGroup);
   }


   /*
    * ABLAK
    */

   function createWindow() {
       windowGroup =
           new THREE.Group();

       const glassMaterial =
           new THREE.MeshStandardMaterial({
               color: 0xbdd7dc,
               roughness: 0.2,
               transparent: true,
               opacity: 0.58
           });

       const frameMaterial =
           new THREE.MeshStandardMaterial({
               color: 0xffffff,
               roughness: 0.8
           });

       const glass =
           new THREE.Mesh(
               new THREE.BoxGeometry(
                   1.7,
                   1.2,
                   0.04
               ),
               glassMaterial
           );

       windowGroup.add(glass);

       createWindowFrame(
           1.85,
           0.08,
           0,
           0.64,
           frameMaterial
       );

       createWindowFrame(
           1.85,
           0.08,
           0,
           -0.64,
           frameMaterial
       );

       createWindowFrame(
           0.08,
           1.35,
           -0.89,
           0,
           frameMaterial
       );

       createWindowFrame(
           0.08,
           1.35,
           0.89,
           0,
           frameMaterial
       );

       createWindowFrame(
           0.06,
           1.2,
           0,
           0,
           frameMaterial
       );

       windowGroup.position.set(
           -1.35,
           1.85,
           -roomDepth / 2 + 0.05
       );

       windowGroup.visible = false;

       scene.add(windowGroup);
   }

   function createWindowMenu() {

   const menu = document.createElement("div");

   menu.id = "window-menu";
   menu.className = "window-menu";

   menu.innerHTML = `
       <button data-wall="back">Hátsó fal</button>
       <button data-wall="left">Bal fal</button>
       <button data-wall="right">Jobb fal</button>
       <button data-wall="front">Elülső fal</button>
       <hr>
       <button data-wall="delete">🗑 Törlés</button>
   `;

   document.body.appendChild(menu);

   menu.addEventListener("click", function(e){

       if(e.target.tagName !== "BUTTON") return;

       const wall = e.target.dataset.wall;

       if(wall === "delete"){

           windowGroup.visible = false;
           windowVisible = false;
           windowButton.classList.remove("active");

       }else{

           setWindowWall(wall);

           windowGroup.visible = true;
           windowVisible = true;
           windowButton.classList.add("active");

       }

       menu.style.display = "none";

   });

   return menu;
}


   function setWindowWall(wall) {

   windowGroup.rotation.set(0, 0, 0);

   switch (wall) {

       case "back":

           windowGroup.position.set(
               -1.35,
               1.85,
               -roomDepth / 2 + 0.05
           );
           break;

       case "left":

           windowGroup.rotation.y = Math.PI / 2;

           windowGroup.position.set(
               -roomWidth / 2 + 0.05,
               1.85,
               0
           );
           break;

       case "right":

           windowGroup.rotation.y = -Math.PI / 2;

           windowGroup.position.set(
               roomWidth / 2 - 0.05,
               1.85,
               0
           );
           break;

       case "front":

           windowGroup.rotation.y = Math.PI;

           windowGroup.position.set(
               0,
               1.85,
               roomDepth / 2 - 0.05
           );
           break;
   }

   windowGroup.visible = true;
   windowVisible = true;
}


   function createWindowFrame(
       width,
       height,
       x,
       y,
       material
   ) {
       const frame =
           new THREE.Mesh(
               new THREE.BoxGeometry(
                   width,
                   height,
                   0.09
               ),
               material
           );

       frame.position.set(x, y, 0);

       windowGroup.add(frame);
   }


   /*
    * FÉNYEK
    */

   function createLights() {
       const hemisphereLight =
           new THREE.HemisphereLight(
               0xffffff,
               0xb7a995,
               1.7
           );

       scene.add(hemisphereLight);

       const directionalLight =
           new THREE.DirectionalLight(
               0xffffff,
               2.2
           );

       directionalLight.position.set(
           3,
           6,
           4
       );

       scene.add(directionalLight);
   }


   /*
    * TERMÉK HOZZÁADÁSA KÖZVETLENÜL A 3D-BE
    */

   async function addProductToThreeD(product) {
       if (
           !product ||
           !product.image
       ) {
           console.error(
               "Hiányos 3D termékadat:",
               product
           );

           return;
       }

       initializeThreeDRoom();

       const textureLoader =
           new THREE.TextureLoader();

       try {
           const texture =
               await textureLoader.loadAsync(
                   product.image
               );

           texture.colorSpace =
               THREE.SRGBColorSpace;

           const imageWidth =
               texture.image.naturalWidth ||
               texture.image.width ||
               1;

           const imageHeight =
               texture.image.naturalHeight ||
               texture.image.height ||
               1;

           const imageRatio =
               imageHeight / imageWidth;

           const productWidth = 1.35;

           const productHeight =
               Math.max(
                   productWidth * imageRatio,
                   0.25
               );

           const geometry =
               new THREE.PlaneGeometry(
                   productWidth,
                   productHeight
               );

           const material =
               new THREE.MeshBasicMaterial({
                   map: texture,
                   transparent: true,
                   alphaTest: 0.03,
                   side: THREE.DoubleSide
               });

           const productObject =
               new THREE.Mesh(
                   geometry,
                   material
               );

           productObject.position.set(
               0,
               productHeight / 2,
               0.5
           );

           productObject.userData.product =
               product;

           productObject.userData.baseWidth =
               productWidth;

           productObject.userData.baseHeight =
               productHeight;

           productObject.userData.isRoomProduct =
               true;

           productGroup.add(productObject);

           selectThreeDProduct(
               productObject
           );

       } catch (error) {
           console.error(
               "A termék nem tölthető be a 3D szobába:",
               product.image,
               error
           );
       }
   }


   /*
    * 3D TERMÉK KIJELÖLÉSE
    */

   function selectThreeDProduct(productObject) {
       selected3dProduct =
           productObject;

       if (selectionHelper) {
           scene.remove(selectionHelper);
           selectionHelper = null;
       }

       if (!selected3dProduct) {
           return;
       }

       selectionHelper =
           new THREE.BoxHelper(
               selected3dProduct,
               0x315f55
           );

       scene.add(selectionHelper);
   }


   function updateSelectionHelper() {
       if (selectionHelper) {
           selectionHelper.update();
       }
   }


   /*
    * 3D TERMÉK MOZGATÁSA
    */

   function addPointerEvents() {
       renderer.domElement.addEventListener(
           "pointerdown",
           handleProductPointerDown
       );

       renderer.domElement.addEventListener(
           "pointermove",
           handleProductPointerMove
       );

       renderer.domElement.addEventListener(
           "pointerup",
           handleProductPointerUp
       );

       renderer.domElement.addEventListener(
           "pointercancel",
           handleProductPointerUp
       );
   }


   function updatePointer(event) {
       const rect =
           renderer.domElement.getBoundingClientRect();

       pointer.x =
           (
               (
                   event.clientX -
                   rect.left
               ) / rect.width
           ) * 2 - 1;

       pointer.y =
           -(
               (
                   event.clientY -
                   rect.top
               ) / rect.height
           ) * 2 + 1;

       raycaster.setFromCamera(
           pointer,
           camera
       );
   }


   function handleProductPointerDown(event) {
       updatePointer(event);

       const intersections =
           raycaster.intersectObjects(
               productGroup.children,
               false
           );

       if (intersections.length === 0) {
           selectThreeDProduct(null);
           return;
       }

       const productObject =
           intersections[0].object;

       selectThreeDProduct(
           productObject
       );

       if (
           raycaster.ray.intersectPlane(
               floorDragPlane,
               dragIntersection
           )
       ) {
           dragOffsetX =
               productObject.position.x -
               dragIntersection.x;

           dragOffsetZ =
               productObject.position.z -
               dragIntersection.z;
       }

       isDraggingProduct = true;

       orbitControls.enabled = false;

       renderer.domElement.setPointerCapture(
           event.pointerId
       );
   }


   function handleProductPointerMove(event) {
       if (
           !isDraggingProduct ||
           !selected3dProduct
       ) {
           return;
       }

       updatePointer(event);

       if (
           !raycaster.ray.intersectPlane(
               floorDragPlane,
               dragIntersection
           )
       ) {
           return;
       }

       const halfWidth =
           selected3dProduct.userData.baseWidth *
           selected3dProduct.scale.x /
           2;

       const newX =
           dragIntersection.x +
           dragOffsetX;

       const newZ =
           dragIntersection.z +
           dragOffsetZ;

       selected3dProduct.position.x =
           THREE.MathUtils.clamp(
               newX,
               -roomWidth / 2 + halfWidth,
               roomWidth / 2 - halfWidth
           );

       selected3dProduct.position.z =
           THREE.MathUtils.clamp(
               newZ,
               -roomDepth / 2 + 0.18,
               roomDepth / 2 - 0.18
           );

       updateSelectionHelper();
   }


   function handleProductPointerUp(event) {
       isDraggingProduct = false;

       orbitControls.enabled = true;

       if (
           renderer.domElement.hasPointerCapture &&
           renderer.domElement.hasPointerCapture(
               event.pointerId
           )
       ) {
           renderer.domElement.releasePointerCapture(
               event.pointerId
           );
       }
   }


   /*
    * 3D TERMÉKVEZÉRLŐ GOMBOK
    */

   function createProductControls() {
       if (!threeDControls) {
           return;
       }

       if (
           document.getElementById(
               "three-d-smaller"
           )
       ) {
           return;
       }

       createControlButton(
           "three-d-smaller",
           "Kisebb",
           makeSelectedProductSmaller
       );

       createControlButton(
           "three-d-larger",
           "Nagyobb",
           makeSelectedProductLarger
       );

       createControlButton(
           "three-d-rotate",
           "Forgatás",
           rotateSelectedProduct
       );
   }

   function createWindowMenu() {

   const menu = document.createElement("div");

   menu.id = "window-menu";

   menu.style.position = "absolute";
   menu.style.display = "none";
   menu.style.background = "#fff";
   menu.style.border = "1px solid #ddd";
   menu.style.borderRadius = "12px";
   menu.style.boxShadow = "0 8px 20px rgba(0,0,0,.15)";
   menu.style.padding = "6px";
   menu.style.zIndex = "999";

   const items = [
       ["Hátsó fal","back"],
       ["Bal fal","left"],
       ["Jobb fal","right"],
       ["Elülső fal","front"],
       ["🗑 Ablak törlése","delete"]
   ];

   items.forEach(function(item){

       const button = document.createElement("button");

       button.type = "button";
       button.textContent = item[0];

       button.style.display = "block";
       button.style.width = "100%";
       button.style.padding = "10px";
       button.style.border = "0";
       button.style.background = "transparent";
       button.style.cursor = "pointer";
       button.style.textAlign = "left";

       button.onclick = function(){

           if(item[1] === "delete"){

               windowVisible = false;
               windowGroup.visible = false;
               windowButton.classList.remove("active");

           }else{

               setWindowWall(item[1]);

               windowVisible = true;
               windowGroup.visible = true;
               windowButton.classList.add("active");
           }

           menu.style.display = "none";
       };

       menu.appendChild(button);

   });

   document.body.appendChild(menu);

   return menu;
}


   function createControlButton(
       id,
       text,
       clickHandler
   ) {
       const button =
           document.createElement("button");

       button.id = id;

       button.type = "button";

       button.className =
           "three-d-control-button";

       button.textContent = text;

       button.addEventListener(
           "click",
           clickHandler
       );

       threeDControls.appendChild(button);
   }


   function makeSelectedProductSmaller() {
       if (!selected3dProduct) {
           return;
       }

       selected3dProduct.scale.multiplyScalar(
           0.9
       );

       keepProductOnFloor();
       updateSelectionHelper();
   }


   function makeSelectedProductLarger() {
       if (!selected3dProduct) {
           return;
       }

       selected3dProduct.scale.multiplyScalar(
           1.1
       );

       keepProductOnFloor();
       updateSelectionHelper();
   }


   function rotateSelectedProduct() {
       if (!selected3dProduct) {
           return;
       }

       selected3dProduct.rotation.y +=
           THREE.MathUtils.degToRad(15);

       updateSelectionHelper();
   }


   function keepProductOnFloor() {
       if (!selected3dProduct) {
           return;
       }

       const scaledHeight =
           selected3dProduct.userData.baseHeight *
           selected3dProduct.scale.y;

       selected3dProduct.position.y =
           scaledHeight / 2;
   }


   /*
    * TÖRLÉS / ELŐRE / HÁTRA
    *
    * 3D-ben a meglévő felső gombok
    * a kijelölt 3D terméket kezelik.
    */

   function deleteSelectedThreeDProduct() {
       if (!selected3dProduct) {
           return;
       }

       productGroup.remove(
           selected3dProduct
       );

       if (selected3dProduct.geometry) {
           selected3dProduct.geometry.dispose();
       }

       if (selected3dProduct.material) {
           if (selected3dProduct.material.map) {
               selected3dProduct.material.map.dispose();
           }

           selected3dProduct.material.dispose();
       }

       selectThreeDProduct(null);
   }


   function bringSelectedThreeDProductForward() {
       if (!selected3dProduct) {
           return;
       }

       selected3dProduct.position.z =
           THREE.MathUtils.clamp(
               selected3dProduct.position.z + 0.25,
               -roomDepth / 2 + 0.18,
               roomDepth / 2 - 0.18
           );

       updateSelectionHelper();
   }


   function sendSelectedThreeDProductBackward() {
       if (!selected3dProduct) {
           return;
       }

       selected3dProduct.position.z =
           THREE.MathUtils.clamp(
               selected3dProduct.position.z - 0.25,
               -roomDepth / 2 + 0.18,
               roomDepth / 2 - 0.18
           );

       updateSelectionHelper();
   }


   function interceptThreeDButton(
       button,
       handler
   ) {
       if (!button) {
           return;
       }

       button.addEventListener(
           "click",
           function (event) {
               if (!isThreeDViewActive()) {
                   return;
               }

               event.preventDefault();
               event.stopImmediatePropagation();

               handler();
           },
           true
       );
   }


   interceptThreeDButton(
       deleteButton,
       deleteSelectedThreeDProduct
   );

   interceptThreeDButton(
       bringForwardButton,
       bringSelectedThreeDProductForward
   );

   interceptThreeDButton(
       sendBackwardButton,
       sendSelectedThreeDProductBackward
   );


   /*
    * FALAK SZÍNEZÉSE
    */

   function createWallColorControls() {
       if (!threeDControls) {
           return;
       }

       if (
           document.querySelector(
               ".wall-color-controls"
           )
       ) {
           return;
       }

       const colorControls =
           document.createElement("div");

       colorControls.className =
           "wall-color-controls";

       createColorInput(
           colorControls,
           "Hátsó fal",
           "#eee8df",
           function (color) {
               backWall.material.color.set(color);
           }
       );

       createColorInput(
           colorControls,
           "Bal fal",
           "#eee8df",
           function (color) {
               leftWall.material.color.set(color);
           }
       );

       createColorInput(
           colorControls,
           "Jobb fal",
           "#eee8df",
           function (color) {
               rightWall.material.color.set(color);
           }
       );

       createColorInput(
           colorControls,
           "Elülső fal",
           "#eee8df",
           function (color) {
               frontWall.material.color.set(color);
           }
       );

       threeDControls.appendChild(
           colorControls
       );
   }


   function createColorInput(
       parent,
       labelText,
       defaultColor,
       onChange
   ) {
       const label =
           document.createElement("label");

       label.className =
           "wall-color-control";

       const text =
           document.createElement("span");

       text.textContent = labelText;

       const input =
           document.createElement("input");

       input.type = "color";
       input.value = defaultColor;

       input.addEventListener(
           "input",
           function () {
               onChange(input.value);
           }
       );

       label.appendChild(text);
       label.appendChild(input);

       parent.appendChild(label);
   }


   /*
    * 2D / 3D VÁLTÁS
    */

   function showTwoDView() {
       room3dView.hidden = true;
       roomCanvas.hidden = false;

       show2dButton.classList.add("active");
       show3dButton.classList.remove("active");
   }


   function showThreeDView() {
       initializeThreeDRoom();

       roomCanvas.hidden = true;
       room3dView.hidden = false;

       show2dButton.classList.remove("active");
       show3dButton.classList.add("active");

       initializeThreeDRoom();

       window.requestAnimationFrame(function(){
        handleResize();
       });
   }


   show2dButton.addEventListener(
       "click",
       showTwoDView
   );

   show3dButton.addEventListener(
       "click",
       showThreeDView
   );


   /*
    * ELÜLSŐ FAL / AJTÓ / ABLAK
    */

   if (frontWallButton) {
       frontWallButton.addEventListener(
           "click",
           function () {
               frontWallVisible =
                   !frontWallVisible;

               frontWall.visible =
                   frontWallVisible;

               frontWallButton.classList.toggle(
                   "active",
                   frontWallVisible
               );

               frontWallButton.textContent =
                   frontWallVisible
                       ? "Elülső fal kikapcsolása"
                       : "Elülső fal bekapcsolása";
           }
       );
   }


   if (doorButton) {
       doorButton.addEventListener(
           "click",
           function () {
               doorVisible = !doorVisible;

               doorGroup.visible =
                   doorVisible;

               doorButton.classList.toggle(
                   "active",
                   doorVisible
               );
           }
       );
   }


   if (windowButton) {

   windowButton.addEventListener("click", function () {

       const wall = prompt(
`Melyik falra kerüljön az ablak?

back = Hátsó
left = Bal
right = Jobb
front = Elülső`
       );

       if (!wall) return;

       setWindowWall(
           wall.toLowerCase()
       );

       windowButton.classList.add(
           "active"
       );

   });

}

   /*
    * MÉRETEZÉS
    */

   function getContainerWidth() {
       return Math.max(
           threeDContainer.clientWidth,
           320
       );
   }


   function getContainerHeight() {
       return threeDContainer.clientHeight;
   }


   function getContainerAspect() {
       return (
           getContainerWidth() /
           getContainerHeight()
       );
   }


   function handleResize() {
       if (
           !renderer ||
           !camera
       ) {
           return;
       }

       const width =
           getContainerWidth();

       const height =
           getContainerHeight();

       camera.aspect =
           width / height;

       camera.updateProjectionMatrix();

       renderer.setSize(
           width,
           height,
           false
       );
   }


   window.addEventListener(
       "resize",
       handleResize
   );


   /*
    * ANIMÁCIÓ
    */

   function animate() {
       window.requestAnimationFrame(
           animate
       );

       if (orbitControls) {
           orbitControls.update();
       }

       if (
           renderer &&
           scene &&
           camera
       ) {
           renderer.render(
               scene,
               camera
           );
       }
   }

});