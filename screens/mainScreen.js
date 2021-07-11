import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Input } from "react-native-elements";
import * as ImagePicker from "expo-image-picker";
import { withFirebaseHOC } from "../config";
import * as FileSystem from "expo-file-system";

function mainScreen({ firebase }) {
  const [state, setState] = useState({
    uploading: false,
    image: "",
  });

  jsonCek = async () => {
    let queue = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + `offline_stored.json`
    );
    let data = JSON.parse(queue);
    console.log(data);
  };
  takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });
    handleImagePicked(pickerResult);
  };

  pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });
    handleImagePicked(pickerResult);
  };

  handleImagePicked = async (pickerResult) => {
    try {
      setState({ uploading: true });

      if (!pickerResult.cancelled) {
        uploadUrl = await firebase.uploadImageAsync(pickerResult.uri);
        setState({ image: uploadUrl });
        requestedFeatures = [
          { type: "DOCUMENT_TEXT_DETECTION", maxResults: 5 },
        ];
        let response = await firebase.submitToCloudVision(
          requestedFeatures,
          uploadUrl
        );
        await FileSystem.writeAsStringAsync(
          FileSystem.documentDirectory + `offline_stored.json`,
          JSON.stringify(response)
        );
      }
    } catch (e) {
      console.log(e);
      alert("Upload failed, somehow");
    } finally {
      setState({ uploading: false });
    }
  };
  return (
    <View style={styles.container}>
      <Button onPress={jsonCek} title="JSON" color="#1985bc" />
      <StatusBar hidden={true} />
    </View>
  );
}

export default withFirebaseHOC(mainScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },
});
