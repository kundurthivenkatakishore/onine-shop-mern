// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAziXYj4RGIlYuK6VFQ9VdhaQgz28XDQcs",
  authDomain: "ecommerce-a281b.firebaseapp.com",
  projectId: "ecommerce-a281b",
  storageBucket: "ecommerce-a281b.appspot.com",
  messagingSenderId: "266148656957",
  appId: "1:266148656957:web:464c60635f9b0baae3f754"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;