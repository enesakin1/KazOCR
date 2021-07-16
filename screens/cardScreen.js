import { StatusBar } from "expo-status-bar";
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  Modal,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TextComponent,
  Image,
  ActivityIndicator,
  FlatList,
  ToastAndroid,
} from "react-native";
import { Button, Input } from "react-native-elements";
import * as ImagePicker from "expo-image-picker";
import { withFirebaseHOC } from "../config";
import * as FileSystem from "expo-file-system";
import {
  defaultActions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import * as Print from "expo-print";
import * as MediaLibrary from "expo-media-library";
import Loading from "./loadingScreen";
import * as SplashScreen from "expo-splash-screen";
import * as Sharing from "expo-sharing";
import * as ImageManipulator from "expo-image-manipulator";
import { object } from "yup";
import { cos } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import { Share } from "react-native";

function textScreen({ firebase }) {
  const defaultPhotoURL = "gs://kazocr-50026.appspot.com/defaultPhoto.png";
  const [state, setState] = useState({
    image: "",
    text: "",
  });
  const [errorText, setErrorText] = useState("");
  const [scanCounter, setScanCounter] = useState(-1);
  const [people, setPeople] = useState([]);
  const [filename, setFilename] = useState("");
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [textLength, setTextLength] = useState(0);
  const [bothloading, setBothloading] = useState({ uploading, textLength });

  /*useEffect(() => {
    if (typeof state.text !== "undefined" && state.text.length > 0) {
      setTextLength(state.text.length);
    }
  }, [state.text]);
  useEffect(() => {
    setBothloading((prev) => {
      return uploading !== prev.uploading && textLength !== prev.textLength
        ? { uploading, textLength }
        : prev;
    });
  }, [uploading, textLength]);
  useEffect(() => {
  }, [bothloading]);*/
  const deleteCard = async (id) => {
    setUploading(true);
    let counter = scanCounter - 1;
    setScanCounter(counter);
    let temp = [...people];
    temp.splice(id, 1);
    await FileSystem.deleteAsync(people[id].localPhoto);
    await firebase.deleteImageAsync(people[id].photo, people[id].fullPhoto);
    setPeople(temp);
    setUploading(false);
  };
  const createHTML = () => {
    setUploading(true);
    let baseHTML =
      '<div style="padding-top: 10px;"> \
    <div style="display: inline-block; vertical-align: middle;"><img style="border-style: solid;" src="PHOTOxx" alt="img" width="170" height="200" /></div> \
    <div style="display: inline-flex; flex-direction: column; padding: 15px;"> \
    <div style="padding-bottom: 10px;">Adı : NAMExx</div> \
    <div style="padding-bottom: 10px;">Soyadı : SURNAMExx</div> \
    <div style="padding-bottom: 10px;">Numarası : NUMBERxx</div> \
    </div> \
    </div>  ';
    let printHTML = "";
    for (let index = 0; index < scanCounter + 1; index++) {
      printHTML += baseHTML.replace("NAMExx", people[index].name);
      printHTML = printHTML.replace("PHOTOxx", people[index].photo);
      printHTML = printHTML.replace("SURNAMExx", people[index].surname);
      printHTML = printHTML.replace("NUMBERxx", people[index].number);
    }
    createPDF(printHTML);
  };
  const parseText = async (response, userdata) => {
    if (typeof response.responses[0].textAnnotations === "undefined") {
      setUploading(false);
      return;
    }

    const text = response.responses[0].textAnnotations[0].description.replace(
      /[\n:\r]+/gm,
      ""
    );
    let matches = /ad[ıi]\s*(.*)\s*soyad[ıi]/gim.exec(text);
    if (matches != null && matches.length > 1) {
      userdata.name = matches[1];
    } else {
      setUploading(false);
      return;
    }
    matches = /soyad[ıi]\s*(.+?)(?:S[ıi]n[ıi]f[ıi]|n(?:o|umara)|[0-9])/gi.exec(
      text
    );
    if (matches != null && matches.length > 1) {
      userdata.surname = matches[1];
    } else {
      setUploading(false);
      return;
    }
    matches = /no\s*([a-zA-z]?[0-9]*)/im.exec(text);
    if (matches != null && matches.length > 1) {
      userdata.number = matches[1];
    } else {
      setUploading(false);
      return;
    }
    let id = scanCounter + 1;
    userdata.id = id;
    setScanCounter(id);
    setPeople([...people, userdata]);
    setUploading(false);
  };
  const cropImage = async (response, imageInfo) => {
    const userdata = {
      id: -1,
      name: "",
      surname: "",
      number: 0,
      photo: defaultPhotoURL,
      localPhoto: defaultPhotoURL,
      fullPhoto: imageInfo.uri,
    };
    if (
      typeof response.responses[0].localizedObjectAnnotations === "undefined"
    ) {
      parseText(response, userdata);
      return;
    }
    let person = { score: 0 };
    response.responses[0].localizedObjectAnnotations.forEach((object) => {
      if (object.name === "Person") {
        if (object.score > person.score) {
          person = object;
        }
      }
    });
    if (person.score == 0) {
      parseText(response, userdata);
      return;
    }
    let width = imageInfo.width;
    let height = imageInfo.height;
    imageInfo.width =
      (person.boundingPoly.normalizedVertices[2].x -
        person.boundingPoly.normalizedVertices[3].x) *
      width;
    imageInfo.height =
      (person.boundingPoly.normalizedVertices[3].y -
        person.boundingPoly.normalizedVertices[1].y) *
      height;
    imageInfo.x = person.boundingPoly.normalizedVertices[3].x * width;
    imageInfo.y = person.boundingPoly.normalizedVertices[3].y * height;

    let fileUri = FileSystem.documentDirectory + "test.png";
    await FileSystem.downloadAsync(imageInfo.uri, fileUri);
    const manipResult = await ImageManipulator.manipulateAsync(
      fileUri,
      [
        {
          crop: {
            originX: imageInfo.x,
            originY: imageInfo.y - imageInfo.height,
            width: imageInfo.width,
            height: imageInfo.height,
          },
        },
      ],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    userdata.photo = await firebase.uploadImageAsync(manipResult.uri);
    userdata.localPhoto = manipResult.uri;
    parseText(response, userdata);
    /*const asset = await MediaLibrary.createAssetAsync(manipResult.uri);
    const album = await MediaLibrary.getAlbumAsync("KazOCR");
    if (album === null) {
      await MediaLibrary.createAlbumAsync("KazOCR", asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }
    const assetResult = await MediaLibrary.getAssetsAsync({
      first: 1,
      album: album,
      sortBy: MediaLibrary.SortBy.creationTime,
    });
    const hey = assetResult.assets[0];*/
  };
  const analyzeCard = async (response, imageInfo) => {
    cropImage(response, imageInfo);
  };
  const createPDF = async (html) => {
    try {
      let fileInfo = await Print.printToFileAsync({
        html: html,
        height: 792,
        width: 612,
        base64: false,
      });
      let pdfName =
        fileInfo.uri.slice(0, fileInfo.uri.lastIndexOf("Print/")) +
        filename +
        ".pdf";
      await FileSystem.moveAsync({
        from: fileInfo.uri,
        to: pdfName,
      });
      setUploading(false);
      let result = Sharing.shareAsync(pdfName);
      if (result.action === Share.sharedAction) {
        console.log("shared");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
    });
    if (!pickerResult.cancelled) {
      handleImagePicked(pickerResult);
    }
  };

  const pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
    });
    if (!pickerResult.cancelled) {
      handleImagePicked(pickerResult);
    }
  };

  const handleImagePicked = async (pickerResult) => {
    try {
      setUploading(true);
      let uploadUrl = await firebase.uploadImageAsync(pickerResult.uri);
      setState({ image: uploadUrl });
      let requestedFeatures = [
        { type: "TEXT_DETECTION", maxResults: 5 },
        { type: "OBJECT_LOCALIZATION", maxResults: 5 },
      ];
      let response = await firebase.submitToCloudVision(
        requestedFeatures,
        uploadUrl
      );
      let imageInfo = {
        uri: uploadUrl,
        x: 0,
        y: 0,
        height: pickerResult.height,
        width: pickerResult.width,
      };
      analyzeCard(response, imageInfo);
    } catch (e) {
      console.log(e);
      alert("Upload failed, somehow");
      setUploading(false);
    }
  };
  const renderItem = ({ item }) => (
    <View
      style={{
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 1,
        height: 200,
      }}
    >
      <Ionicons
        name="close-circle-outline"
        size={42}
        color="red"
        style={{
          position: "absolute",
          top: 5,
          right: 5,
        }}
        onPress={() => {
          deleteCard(item.id);
        }}
      />
      <Image
        source={
          item.localPhoto != defaultPhotoURL
            ? { uri: item.photo }
            : require("../assets/defaultPhoto.png")
        }
        style={{ width: 125, height: 166, borderWidth: 1 }}
      />
      <View
        style={{
          paddingLeft: 10,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          alignContent: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignSelf: "center",
            alignItems: "center",
            alignContent: "center",
          }}
        >
          <Text
            style={{
              paddingBottom: 10,
              fontSize: 15,
              alignSelf: "center",
            }}
          >
            Adı :{" "}
          </Text>
          <TextInput
            maxLength={20}
            multiline={false}
            defaultValue={item.name}
            onChangeText={(text) => {
              let temp = [...people];
              temp[item.id] = { ...temp[item.id], name: text };
              setPeople(temp);
            }}
            style={{
              paddingBottom: 10,
              fontSize: 15,
              width: 100,
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignSelf: "center",
            alignItems: "center",
            alignContent: "center",
          }}
        >
          <Text
            style={{
              paddingBottom: 10,
              fontSize: 15,
              alignSelf: "center",
            }}
          >
            Soyadı :{" "}
          </Text>
          <TextInput
            maxLength={20}
            multiline={false}
            defaultValue={item.surname}
            onChangeText={(text) => {
              let temp = [...people];
              temp[item.id] = { ...temp[item.id], surname: text };
              setPeople(temp);
            }}
            style={{
              paddingBottom: 10,
              fontSize: 15,
              width: 100,
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignSelf: "center",
            alignItems: "center",
            alignContent: "center",
          }}
        >
          <Text
            style={{
              paddingBottom: 10,
              fontSize: 15,
              alignSelf: "center",
            }}
          >
            Numara :{" "}
          </Text>
          <TextInput
            maxLength={20}
            multiline={false}
            defaultValue={item.number}
            onChangeText={(text) => {
              let temp = [...people];
              temp[item.id] = { ...temp[item.id], number: text };
              setPeople(temp);
            }}
            style={{
              paddingBottom: 10,
              fontSize: 15,
              width: 100,
            }}
          />
        </View>
      </View>
    </View>
  );
  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={saveModalVisible}
        onDismiss={() => {
          setFilename("");
          setErrorText("");
        }}
        onRequestClose={() => {
          setSaveModalVisible(!saveModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Enter filename</Text>

            <Input
              onChangeText={(value) => setFilename(value)}
              placeholder="Filename..."
              style={{ backgroundColor: "white" }}
            />
            <Text style={{ color: "red", paddingBottom: 10 }}>{errorText}</Text>
            <View style={styles.modalButtonsContainer}>
              <Button
                title="Confirm"
                style={{ margin: 20 }}
                onPress={() => {
                  if (people.length == 0) {
                    setErrorText("Please scan at least one card");
                  } else if (filename.length == 0) {
                    setErrorText("Filename can't be empty");
                  } else {
                    setErrorText("");
                    setSaveModalVisible(!saveModalVisible);
                    createHTML();
                  }
                }}
              />
              <Button
                title="Cancel"
                style={{ alignSelf: "flex-end" }}
                onPress={() => {
                  setSaveModalVisible(!saveModalVisible);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
      <Modal animationType="fade" transparent={true} visible={uploading}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View
              style={{
                justifyContent: "center",
                alignContent: "center",
                flexDirection: "row",
              }}
            >
              <Text>Loading </Text>
              <ActivityIndicator color="black" />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => {
          setAddModalVisible(!addModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Choose From</Text>
            <View style={styles.modalButtonsContainer}>
              <Button
                title="Media Library"
                style={{ margin: 20 }}
                onPress={() => {
                  setAddModalVisible(!addModalVisible);
                  pickImage();
                }}
              />
              <Button
                title="Camera"
                style={{ alignSelf: "flex-end" }}
                onPress={() => {
                  setAddModalVisible(!addModalVisible);
                  takePhoto();
                }}
              />
              <Button
                title="Cancel"
                style={{ alignSelf: "flex-end" }}
                onPress={() => {
                  setAddModalVisible(!addModalVisible);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Button
        onPress={() => {
          setSaveModalVisible(true);
        }}
        title="Save"
        color="#1985bc"
      />
      <Button
        onPress={() => {
          console.log(people);
        }}
        title="bilgi"
        color="#1985bc"
      />
      <TouchableOpacity
        onPress={() => {
          setAddModalVisible(true);
        }}
      >
        <View
          style={{
            flexDirection: "row",
            padding: 10,
            borderBottomWidth: 1,
            height: 200,
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={60}
            color="green"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
            }}
          />
          <Image
            source={require("../assets/defaultPhoto.png")}
            style={{ width: 125, height: 166, borderWidth: 1 }}
          />
          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              padding: 10,
            }}
          >
            <Text
              style={{
                paddingBottom: 10,
              }}
            >
              Adı :{" "}
            </Text>

            <Text
              style={{
                paddingBottom: 10,
              }}
            >
              Soyadı :{" "}
            </Text>

            <Text
              style={{
                paddingBottom: 10,
              }}
            >
              Numara :{" "}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <FlatList
        data={people}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1 }}
      ></FlatList>
      <StatusBar hidden={true} />
    </View>
  );
}

export default withFirebaseHOC(textScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },
  enteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtonsContainer: {
    flexDirection: "row",
  },
  /***** */
});
