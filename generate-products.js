"use strict";

const fs = require("fs");
const path = require("path");

/* =========================================================
  MINIQUE DESIGNER – PRODUCTS.JSON GENERÁTOR
========================================================= */

const PROJECT_ROOT = __dirname;
const IMAGES_FOLDER = path.join(PROJECT_ROOT, "images");
const OUTPUT_FOLDER = path.join(PROJECT_ROOT, "data");
const OUTPUT_FILE = path.join(OUTPUT_FOLDER, "products.json");

/*
 Ezekből a mappákból készülnek termékek.
 A walls és rooms mappát külön kezeljük.
*/
const CATEGORY_SETTINGS = {
 chairs: {
   category: "chairs",
   categoryName: "Fotelek és ülőkék",
   defaultWidth: 180,
   realWidth: 60
 },

 decor: {
   category: "decor",
   categoryName: "Dekoráció",
   defaultWidth: 140,
   realWidth: 50
 },

 furniture: {
   category: "furniture",
   categoryName: "Bútorok",
   defaultWidth: 240,
   realWidth: 90
 },

 montessori: {
   category: "montessori",
   categoryName: "Montessori",
   defaultWidth: 240,
   realWidth: 100
 },

 sofas: {
   category: "sofas",
   categoryName: "Kanapék",
   defaultWidth: 260,
   realWidth: 120
 },

 textiles: {
   category: "textiles",
   categoryName: "Textilek",
   defaultWidth: 160,
   realWidth: 70
 },

 toys: {
   category: "toys",
   categoryName: "Játékok",
   defaultWidth: 190,
   realWidth: 80
 }
};

/* =========================================================
  SEGÉDFÜGGVÉNYEK
========================================================= */

function isSupportedImage(filename) {
 const extension = path.extname(filename).toLowerCase();

 return [".png", ".webp", ".jpg", ".jpeg"].includes(extension);
}

function createId(category, filename) {
 const filenameWithoutExtension = path.parse(filename).name;

 return `${category}-${filenameWithoutExtension}`
   .toLowerCase()
   .normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "")
   .replace(/[^a-z0-9]+/g, "-")
   .replace(/^-+|-+$/g, "");
}

function createProductName(filename) {
 const filenameWithoutExtension = path.parse(filename).name;

 const cleanedName = filenameWithoutExtension
   .replace(/^img[-_ ]?\d+$/i, filenameWithoutExtension)
   .replace(/[-_.]+/g, " ")
   .replace(/\s+/g, " ")
   .trim();

 return cleanedName
   .split(" ")
   .map(function (word) {
     if (!word) {
       return "";
     }

     return word.charAt(0).toUpperCase() + word.slice(1);
   })
   .join(" ");
}

function getImageFiles(folderPath) {
 if (!fs.existsSync(folderPath)) {
   console.warn(`A mappa nem található: ${folderPath}`);
   return [];
 }

 return fs
   .readdirSync(folderPath, { withFileTypes: true })
   .filter(function (entry) {
     return entry.isFile() && isSupportedImage(entry.name);
   })
   .map(function (entry) {
     return entry.name;
   })
   .sort(function (first, second) {
     return first.localeCompare(second, "hu", {
       numeric: true,
       sensitivity: "base"
     });
   });
}

/* =========================================================
  TERMÉKLISTA ELKÉSZÍTÉSE
========================================================= */

const products = [];

Object.entries(CATEGORY_SETTINGS).forEach(function (entry) {
 const folderName = entry[0];
 const settings = entry[1];

 const folderPath = path.join(IMAGES_FOLDER, folderName);
 const filenames = getImageFiles(folderPath);

 filenames.forEach(function (filename, index) {
   products.push({
     id: createId(settings.category, filename),

     name: createProductName(filename),

     category: settings.category,

     categoryName: settings.categoryName,

     image: `images/${folderName}/${filename}`,

     price: 0,

     realWidth: settings.realWidth,

     defaultWidth: settings.defaultWidth,

     order: index + 1,

     active: true
   });
 });

 console.log(
   `${settings.categoryName}: ${filenames.length} kép feldolgozva.`
 );
});

/* =========================================================
  ELLENŐRZÉSEK
========================================================= */

const usedIds = new Set();
const duplicateIds = [];

products.forEach(function (product) {
 if (usedIds.has(product.id)) {
   duplicateIds.push(product.id);
 }

 usedIds.add(product.id);
});

if (duplicateIds.length > 0) {
 console.warn("Duplikált termékazonosítók:");

 duplicateIds.forEach(function (id) {
   console.warn(`- ${id}`);
 });
}

/* =========================================================
  PRODUCTS.JSON MENTÉSE
========================================================= */

if (!fs.existsSync(OUTPUT_FOLDER)) {
 fs.mkdirSync(OUTPUT_FOLDER, {
   recursive: true
 });
}

fs.writeFileSync(
 OUTPUT_FILE,
 JSON.stringify(products, null, 2),
 "utf8"
);

console.log("");
console.log("==========================================");
console.log(`Kész: ${products.length} termék`);
console.log(`Fájl: ${OUTPUT_FILE}`);
console.log("==========================================");