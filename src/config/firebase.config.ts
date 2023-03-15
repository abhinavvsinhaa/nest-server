// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5V8oDWVmQz2t_kIqdrAv-KVsCFNxUxaY",
  authDomain: "reunir-c11c3.firebaseapp.com",
  projectId: "reunir-c11c3",
  storageBucket: "reunir-c11c3.appspot.com",
  messagingSenderId: "419370911863",
  appId: "1:419370911863:web:5913a615b8967929f09e72",
  measurementId: "G-J9DY74N6HH"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);