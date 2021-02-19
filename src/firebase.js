import firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyAiMh45vJUO9-_UEepRGp_J1T5yajQVOF4",
  authDomain: "pinterest-jes.firebaseapp.com",
  projectId: "pinterest-jes",
  storageBucket: "pinterest-jes.appspot.com",
  messagingSenderId: "563761032509",
  appId: "1:563761032509:web:0fca92a9765cca41066954",
  measurementId: "G-6THGM1767M",
};
const firebaseApp = firebase.initializeApp(firebaseConfig);

const db = firebaseApp.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

export { auth, provider };
export default db;
