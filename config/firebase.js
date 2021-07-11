import firebaseConfig from "./firebaseConfig";
import * as firebase from "firebase";
import Environment from "./environment";
import uuid from "react-native-uuid";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

const Firebase = {
  checkUserAuth: (user) => {
    return firebase.auth().onAuthStateChanged(user);
  },
  loginWithEmail: (email, password) => {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  },
  signupWithEmail: (email, password) => {
    return firebase.auth().createUserWithEmailAndPassword(email, password);
  },
  signOut: () => {
    return firebase.auth().signOut();
  },
  createNewUser: (userData) => {
    return firebase
      .firestore()
      .collection("users")
      .doc(`${userData.uid}`)
      .set(userData);
  },
  uploadImageAsync: async (uri) => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const ref = firebase.storage().ref().child(uuid.v4());
    const snapshot = await ref.put(blob);

    blob.close();

    return await snapshot.ref.getDownloadURL();
  },
  submitToCloudVision: async (requestedFeatures, image) => {
    let body = JSON.stringify({
      requests: [
        {
          features: requestedFeatures,
          image: {
            source: {
              imageUri: image,
            },
          },
        },
      ],
    });
    let response = await fetch(
      "https://vision.googleapis.com/v1/images:annotate?key=" +
        Environment["GOOGLE_CLOUD_VISION_API_KEY"],
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: body,
      }
    );
    return await response.json();
  },
};

export default Firebase;
