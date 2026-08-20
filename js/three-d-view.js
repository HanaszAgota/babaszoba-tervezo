"use strict";

import * as THREE from "three";

import {
   OrbitControls
} from "three/addons/controls/OrbitControls.js";


document.addEventListener("DOMContentLoaded", function () {

   const roomCanvas =
       document.getElementById("room-canvas");

   const room3dView =
       document.getElementById("room-3d-view");

   const container =
       document.getElementById("three-d-room");

   const button2d =
       document.getElementById("show-2d-button");

   const button3d =
       document.getElementById("show-3d-button");


   if (
       !roomCanvas ||
       !room3dView ||
       !container ||
       !button2d ||
       !button3d
   ) {
       console.error("3D HTML elem hiányzik.");
       return;
   }


   let started = false;


   button2d.addEventListener("click", function () {

       room3dView.hidden = true;
       roomCanvas.hidden = false;

       button2d.classList.add("active");
       button3d.classList.remove("active");
   });


   button3d.addEventListener("click", function () {

       roomCanvas.hidden = true;
       room3dView.hidden = false;

       button2d.classList.remove("active");
       button3d.classList.add("active");


       if (started) {
           return;
       }

       started = true;


       requestAnimationFrame(function () {

           createTestRoom();

       });

   });


   function createTestRoom() {

       const width =
           container.clientWidth || 700;

       const height =
           container.clientHeight || 650;


       console.log(
           "3D TEST méret:",
           width,
           height
       );


       const scene =
           new THREE.Scene();

       scene.background =
           new THREE.Color(0xf5f2ec);


       const camera =
           new THREE.PerspectiveCamera(
               45,
               width / height,
               0.1,
               100
           );


       camera.position.set(
           7,
           4.8,
           8
       );


       const renderer =
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
           width,
           height,
           false
       );


       renderer.outputColorSpace =
           THREE.SRGBColorSpace;


       renderer.domElement.style.width =
           "100%";

       renderer.domElement.style.height =
           "100%";

       renderer.domElement.style.display =
           "block";


       container.innerHTML = "";

       container.appendChild(
           renderer.domElement
       );


       const controls =
           new OrbitControls(
               camera,
               renderer.domElement
           );


       controls.target.set(
           0,
           1.4,
           0
       );

       controls.enableDamping = true;

       controls.update();


       /* PADLÓ */

       const floor =
           new THREE.Mesh(
               new THREE.PlaneGeometry(
                   6,
                   5
               ),
               new THREE.MeshStandardMaterial({
                   color: 0xc9a982,
                   side: THREE.DoubleSide
               })
           );


       floor.rotation.x =
           -Math.PI / 2;


       scene.add(floor);


       /* HÁTSÓ FAL */

       const wallMaterial =
           new THREE.MeshStandardMaterial({
               color: 0xeee8df,
               side: THREE.DoubleSide
           });


       const backWall =
           new THREE.Mesh(
               new THREE.PlaneGeometry(
                   6,
                   3.2
               ),
               wallMaterial
           );


       backWall.position.set(
           0,
           1.6,
           -2.5
       );


       scene.add(backWall);


       /* BAL FAL */

       const leftWall =
           new THREE.Mesh(
               new THREE.PlaneGeometry(
                   5,
                   3.2
               ),
               wallMaterial
           );


       leftWall.rotation.y =
           Math.PI / 2;


       leftWall.position.set(
           -3,
           1.6,
           0
       );


       scene.add(leftWall);


       /* JOBB FAL */

       const rightWall =
           new THREE.Mesh(
               new THREE.PlaneGeometry(
                   5,
                   3.2
               ),
               wallMaterial
           );


       rightWall.rotation.y =
           -Math.PI / 2;


       rightWall.position.set(
           3,
           1.6,
           0
       );


       scene.add(rightWall);


       /* DIREKT FELTŰNŐ PRÓBAKOCKA */

       const cube =
           new THREE.Mesh(
               new THREE.BoxGeometry(
                   1.5,
                   1,
                   1
               ),
               new THREE.MeshStandardMaterial({
                   color: 0xd4a48f
               })
           );


       cube.position.set(
           0,
           0.5,
           -1
       );


       scene.add(cube);


       /* FÉNY */

       scene.add(
           new THREE.HemisphereLight(
               0xffffff,
               0xb7a995,
               2
           )
       );


       const light =
           new THREE.DirectionalLight(
               0xffffff,
               2
           );


       light.position.set(
           4,
           7,
           5
       );


       scene.add(light);


       console.log(
           "3D TEST scene children:",
           scene.children.length
       );


       function animate() {

           requestAnimationFrame(
               animate
           );


           controls.update();


           renderer.render(
               scene,
               camera
           );
       }


       animate();

   }

});