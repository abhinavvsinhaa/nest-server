// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCwWSbY9daoV6m8IHBHYKL4i3LF-6Jjui8',
  authDomain: 'reunir-aad00.firebaseapp.com',
  projectId: 'reunir-aad00',
  storageBucket: 'reunir-aad00.appspot.com',
  messagingSenderId: '628749834430',
  appId: '1:628749834430:web:c6f773950cb1508124e6ef',
  measurementId: 'G-PVCXXGN4LW',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
