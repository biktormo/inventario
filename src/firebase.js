// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCArk2WNb-sa919Q29Mo18BSagig2ewy8w",
  authDomain: "inventario-d32b9.firebaseapp.com",
  projectId: "inventario-d32b9",
  storageBucket: "inventario-d32b9.firebasestorage.app",
  messagingSenderId: "779687480646",
  appId: "1:779687480646:web:78107fa0fec1d33413a947"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);