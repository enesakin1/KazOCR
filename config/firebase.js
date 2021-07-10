import firebaseConfig from "./firebaseConfig";
import * as firebase from "firebase";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

const Firebase = {
  checkUserAuth: (user) => {
    return firebase.auth().onAuthStateChanged(user);
  },
};

export default Firebase;
