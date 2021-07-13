import { StatusBar } from "expo-status-bar";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Alert, Text } from "react-native";
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
import Loading from "./loadingScreen";
import * as SplashScreen from "expo-splash-screen";

function textScreen({ firebase }) {
  const [state, setState] = useState({
    image: "",
    text: "",
  });
  const [uploading, setUploading] = useState(false);
  const [textLength, setTextLength] = useState(0);
  const [bothloading, setBothloading] = useState({ uploading, textLength });
  const RichText = useRef();

  const insertRichTextBox = async (response) => {
    let paragraphs = [];
    if (typeof response.responses[0].fullTextAnnotation === "undefined") return;
    response.responses[0].fullTextAnnotation.pages.forEach((page) => {
      page.blocks.forEach((block) => {
        block.paragraphs.forEach((paragraph) => {
          let para = "";
          let line = "";
          paragraph.words.forEach((word) => {
            word.symbols.forEach((symbol) => {
              line += symbol.text;
              if (typeof symbol.property.detectedBreak !== "undefined") {
                if (symbol.property.detectedBreak.type == "SPACE") {
                  line += " ";
                }
                if (symbol.property.detectedBreak.type == "EOL_SURE_SPACE") {
                  line += " ";
                  para += line;
                  line = "";
                }
                if (symbol.property.detectedBreak.type == "LINE_BREAK") {
                  para += line;
                  line = "";
                }
              }
            });
          });
          paragraphs.push(para);
        });
      });
    });
    let text = "";
    paragraphs.forEach((element) => {
      text += element + "\n\n";
    });
    RichText.current?.insertText(text);
  };
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
      const asset = await MediaLibrary.createAssetAsync(filePath.uri);
      const album = await MediaLibrary.getAlbumAsync("Documents");
      if (album == null) {
        await MediaLibrary.createAlbumAsync("Documents", asset, true);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
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
      let requestedFeatures = [{ type: "TEXT_DETECTION", maxResults: 5 }];
      let response = await firebase.submitToCloudVision(
        requestedFeatures,
        uploadUrl
      );
      setUploading(false);
      insertRichTextBox(response);
    } catch (e) {
      console.log(e);
      alert("Upload failed, somehow");
      setUploading(false);
    }
  };
  return (
    <View style={styles.container}>
      <Button onPress={createAlert} title="pdf" color="#1985bc" />
      <Button onPress={pickImage} title="Select Image" color="#1985bc" />
      <RichEditor
        disabled={uploading}
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

export default withFirebaseHOC(textScreen);

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
