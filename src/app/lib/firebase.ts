import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
    apiKey: "AIzaSyD8IVGtjXcd_MvxY0H5d4deW2J0rD_LQGM",
    authDomain: "latihan-d90ca.firebaseapp.com",
    projectId: "latihan-d90ca",
    storageBucket: "latihan-d90ca.firebasestorage.app",
    messagingSenderId: "1077115675635",
    appId: "1:1077115675635:web:9c883cbf077c3c904ae886",
    measurementId: "G-C3NSDH2D2Y"
  };

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
