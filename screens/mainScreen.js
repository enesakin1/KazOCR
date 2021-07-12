import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Button } from "react-native-elements";
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

function mainScreen({ firebase }) {
  const source = {
    uri: "http://samples.leanpub.com/thereactnativebook-sample.pdf",
    cache: true,
  };
  const [state, setState] = useState({
    uploading: false,
    image: "",
    text: "",
  });
  const RichText = useRef();

  jsonCek = async () => {
    let queue = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + `offline_stored.json`
    );
    let data = JSON.parse(queue);
    console.log(data);
  };
  const createAlert = () => {
    Alert.alert(
      "SAVE AS PDF",
      "Are you sure to save this?",
      [
        {
          text: "SAVE",
          onPress: createPDF,
        },
        {
          text: "No",
          style: "cancel",
        },
      ],
      { cancelable: false }
    );
  };
  const createPDF = async () => {
    try {
      let { text } = state;
      let filePath = await Print.printToFileAsync({
        html: text,
        height: 792,
        width: 612,
        base64: false,
      });
      console.log(filePath.uri);
      const asset = await MediaLibrary.createAssetAsync(filePath.uri);
      const album = await MediaLibrary.getAlbumAsync("Downloads");
      if (album == null) {
        await MediaLibrary.createAlbumAsync("Downloads", asset, true);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const kes = () => {
    console.log(state.text);
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
        let uploadUrl = await firebase.uploadImageAsync(pickerResult.uri);
        setState({ image: uploadUrl });
        let requestedFeatures = [
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
      <Button onPress={createAlert} title="pdf" color="#1985bc" />
      <Button onPress={kes} title="pdsaf" color="#1985bc" />
      <RichEditor
        disabled={false}
        containerStyle={styles.editor}
        ref={RichText}
        style={styles.rich}
        placeholder={"Text..."}
        onChange={(text) => setState({ text: text })}
      />
      <RichToolbar
        style={[styles.richBar]}
        editor={RichText}
        disabled={false}
        iconTint={"blue"}
        selectedIconTint={"black"}
        disabledIconTint={"white"}
        iconSize={24}
        actions={[...defaultActions]}
      />
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
  /*******************************/
  editor: {
    backgroundColor: "black",
    borderColor: "black",
    borderWidth: 1,
  },
  rich: {
    minHeight: 300,
    flex: 1,
  },
  richBar: {
    height: 50,
    backgroundColor: "#F5FCFF",
  },
  //End
});
