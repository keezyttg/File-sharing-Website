// src/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBtdk5AqMG2mWSqJRmVwVq5QH_rYo4Ezrk",
    authDomain: "fileshare-ff234.firebaseapp.com",
    databaseURL: "https://fileshare-ff234-default-rtdb.firebaseio.com",
    projectId: "fileshare-ff234",
    storageBucket: "fileshare-ff234.appspot.com",
    messagingSenderId: "590959302306",
    appId: "1:590959302306:web:9fca6eeb5599e507b129fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };