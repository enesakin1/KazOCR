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

function textScreen({ firebase }) {
  const [state, setState] = useState({
    image: "",
    text: "",
  });
  const [filename, setFilename] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [textLength, setTextLength] = useState(0);
  const [bothloading, setBothloading] = useState({ uploading, textLength });
  const RichText = useRef();

  const insertRichTextBox = async (response) => {
    if (typeof response.responses[0].fullTextAnnotation === "undefined") return;

    response.responses[0].fullTextAnnotation.pages.forEach((page) => {
      page.blocks.forEach((block) => {
        block.paragraphs.forEach((paragraph) => {
          let para = "";
          let line = "";
          paragraph.words.forEach((word) => {
            word.symbols.forEach((symbol) => {
              line += symbol.text;
              if (
                typeof symbol.property !== "undefined" &&
                typeof symbol.property.detectedBreak !== "undefined"
              ) {
                if (symbol.property.detectedBreak.type == "SPACE") {
                  line += " ";
                } else if (
                  symbol.property.detectedBreak.type == "EOL_SURE_SPACE"
                ) {
                  if (line.endsWith("-")) {
                    line = line.slice(0, -1);
                  } else {
                    line += " ";
                  }
                  para += line;
                  line = "";
                } else if (symbol.property.detectedBreak.type == "LINE_BREAK") {
                  if (line.endsWith("-")) {
                    line = line.slice(0, -1);
                  } else {
                    line += " ";
                  }
                  para += line;
                  line = "";
                }
              }
            });
          });
          para += "\n\n";
          RichText.current?.insertText(para);
        });
      });
    });
  };
  const clearTextBox = () => {
    RichText.current?.setContentHTML("");
    setState({ text: "" });
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

  const createPDF = async () => {
    try {
      let { text } = state;
      let fileInfo = await Print.printToFileAsync({
        html: text,
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
      Sharing.shareAsync(pdfName);
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
        { type: "DOCUMENT_TEXT_DETECTION", maxResults: 5 },
      ];
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onDismiss={() => {
          setFilename("");
        }}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
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
            <View style={styles.modalButtonsContainer}>
              <Button
                title="Confirm"
                style={{ margin: 20 }}
                onPress={() => {
                  setModalVisible(!modalVisible);
                  createPDF();
                }}
              />
              <Button
                title="Cancel"
                style={{ alignSelf: "flex-end" }}
                onPress={() => {
                  setModalVisible(!modalVisible);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
      <Button
        onPress={() => {
          setModalVisible(true);
        }}
        title="Save"
        color="#1985bc"
      />
      <Button onPress={pickImage} title="Select Image" color="#1985bc" />
      <Button onPress={takePhoto} title="Take Photo" color="#1985bc" />
      <Button onPress={clearTextBox} title="Clear" color="#1985bc" />

      <ScrollView nestedScrollEnabled={true}>
        <RichEditor
          disabled={uploading}
          scrollEnabled={true}
          containerStyle={styles.editor}
          ref={RichText}
          style={styles.rich}
          placeholder={"Text..."}
          onChange={(text) => setState({ text: text })}
        />
      </ScrollView>
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
  /***************** */
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
