import { StatusBar } from "expo-status-bar";
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  version,
} from "react";
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  Modal,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  ToastAndroid,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const { width, height } = Dimensions.get("window");
function textScreen({ firebase }) {
  const [state, setState] = useState({
    image: "",
    text: "",
  });
  const [filename, setFilename] = useState("");
  const [errorText, setErrorText] = useState("");
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const RichText = useRef();

  const clearAlert = () =>
    Alert.alert(
      "Clear Text Box",
      "Are you sure?",
      [
        {
          text: "Yes",
          onPress: () => {
            RichText.current?.setContentHTML("");
            setState({ text: "" });
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
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

  const createPDF = async (saveWay) => {
    setUploading(true);
    try {
      let { text } = state;
      let fileInfo = await Print.printToFileAsync({
        html: text,
        height: 792,
        width: 612,
        base64: false,
      });
      setUploading(false);
      if (saveWay === "Share") {
        let pdfName =
          fileInfo.uri.slice(0, fileInfo.uri.lastIndexOf("Print/")) +
          filename +
          ".pdf";
        await FileSystem.moveAsync({
          from: fileInfo.uri,
          to: pdfName,
        });
        const result = await Sharing.shareAsync(pdfName);
        if (result.action === Sharing.sharedAction) {
          ToastAndroid.show("Successful shared!", ToastAndroid.LONG);
        }
      } else if (saveWay === "Save") {
        const asset = await MediaLibrary.createAssetAsync(fileInfo.uri);
        const album = await MediaLibrary.getAlbumAsync("KazOCR");
        if (album == null) {
          await MediaLibrary.createAlbumAsync("KazOCR", asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
        ToastAndroid.show(
          "Successful saved! (Check KazOCR folder)",
          ToastAndroid.LONG
        );
      }
    } catch (err) {
      console.log("Save err: ", err);
      setUploading(false);
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
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../assets/background.jpg")}
        style={{ flex: 1, width: "100%" }}
        blurRadius={1}
      >
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          nestedScrollEnabled={true}
        >
          <Modal
            animationType="slide"
            transparent={true}
            visible={saveModalVisible}
            onShow={() => {
              setFilename("");
              setErrorText("");
            }}
            onRequestClose={() => {
              setSaveModalVisible(!saveModalVisible);
            }}
          >
            <View style={styles.saveModalView}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalText}>Enter filename</Text>
                <Input
                  onChangeText={(value) => setFilename(value)}
                  placeholder="Filename..."
                  style={{ backgroundColor: "white" }}
                />
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
              <View style={styles.modalButtonsContainer}>
                <Button
                  title="Confirm"
                  buttonStyle={styles.modalButtonStyle}
                  onPress={() => {
                    if (state.text.length < 19) {
                      setErrorText(
                        "Text must be contain at least 20 characters"
                      );
                    } else if (filename.length == 0) {
                      setErrorText("Filename can't be empty");
                    } else {
                      setErrorText("");
                      setSaveModalVisible(!saveModalVisible);
                      createPDF("Share");
                    }
                  }}
                />
                <Button
                  title="Cancel"
                  buttonStyle={styles.modalButtonStyle}
                  onPress={() => {
                    setSaveModalVisible(!saveModalVisible);
                  }}
                />
              </View>
            </View>
          </Modal>
          <Modal animationType="fade" transparent={true} visible={uploading}>
            <View style={styles.modalView}>
              <View
                style={{
                  justifyContent: "center",
                  alignContent: "center",
                  flexDirection: "row",
                }}
              >
                <Text style={{ fontSize: 14 }}>Loading </Text>
                <ActivityIndicator color="black" />
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
            <View style={styles.scanModalView}>
              <Text style={styles.modalText}>Choose From</Text>
              <View style={styles.modalButtonsContainer}>
                <Button
                  title="Media Library"
                  buttonStyle={styles.modalButtonStyle}
                  onPress={() => {
                    setAddModalVisible(!addModalVisible);
                    pickImage();
                  }}
                />
                <Button
                  title="Camera"
                  buttonStyle={styles.modalButtonStyle}
                  onPress={() => {
                    setAddModalVisible(!addModalVisible);
                    takePhoto();
                  }}
                />
              </View>
            </View>
          </Modal>
          <View
            style={{
              flex: 0.16,
              margin: 10,
              backgroundColor: "#fcfcff",
              borderBottomWidth: 0.8,
            }}
          >
            <View
              style={{
                flex: 1.8,
                flexDirection: "row",
                borderBottomWidth: 0.6,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  padding: 10,
                  flex: 0.8,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (state.text.length < 19) {
                      ToastAndroid.show(
                        "Text must be contain at least 20 characters",
                        ToastAndroid.SHORT
                      );
                      return;
                    }
                    createPDF("Save");
                  }}
                  style={{ marginLeft: 10 }}
                >
                  <Ionicons name="save-sharp" color={"#3a3c3d"} size={32} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSaveModalVisible(true);
                  }}
                  style={{ marginLeft: 15 }}
                >
                  <Ionicons name="share-social" color={"#3a3c3d"} size={32} />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  flex: 0.3,
                  alignItems: "flex-start",
                  justifyContent: "center",
                }}
              >
                <Button
                  icon={() => (
                    <Ionicons name="scan-outline" color={"white"} size={24} />
                  )}
                  onPress={() => {
                    setAddModalVisible(true);
                  }}
                  title="Scan"
                  buttonStyle={styles.buttonStyle}
                  titleStyle={styles.titleStyle}
                />
              </View>
            </View>
            <View
              style={{
                justifyContent: "flex-start",
                flex: 0.7,
                backgroundColor: "white",
              }}
            >
              <TouchableOpacity onPress={clearAlert} style={styles.clearButton}>
                <Ionicons name="trash" color={"#3a3c3d"} size={26} />
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    alignSelf: "center",
                    color: "#3a3c3d",
                  }}
                >
                  Clear Text Box
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flex: 0.9, marginLeft: 10, marginRight: 10 }}>
            <RichToolbar
              style={[styles.richBar]}
              editor={RichText}
              disabled={false}
              iconTint={"#3a3c3d"}
              selectedIconTint={"grey"}
              disabledIconTint={"white"}
              iconSize={24}
              actions={[...defaultActions]}
            />
            <RichEditor
              disabled={uploading}
              scrollEnabled={true}
              containerStyle={styles.editor}
              ref={RichText}
              style={styles.rich}
              placeholder={"Text..."}
              onChange={(text) => setState({ text: text })}
            />
          </View>
        </KeyboardAwareScrollView>
      </ImageBackground>
      <StatusBar hidden={true} />
    </SafeAreaView>
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
    flex: 1,
  },
  richBar: {
    height: 50,
    backgroundColor: "#F5FCFF",
  },
  //End
  /***************** */
  modalView: {
    flex: 0.05,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveModalView: {
    flex: 0.3,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanModalView: {
    flex: 0.15,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
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
    fontWeight: "bold",
    fontSize: 17,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  /***** */
  clearButton: {
    borderRadius: 10,
    alignSelf: "flex-end",
    flexDirection: "row",
    marginRight: 5,
  },
  buttonStyle: {
    borderRadius: 10,
    backgroundColor: "#3a3c3d",
  },
  modalButtonStyle: {
    borderRadius: 10,
    backgroundColor: "#3a3c3d",
    marginLeft: 10,
  },
  titleStyle: {
    marginLeft: 5,
  },
  errorText: {
    color: "red",
    paddingBottom: 15,
    alignSelf: "center",
  },
});
