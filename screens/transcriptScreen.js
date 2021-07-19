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
  SectionList,
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
import { DataTable } from "react-native-paper";
import { Col, Row, Grid } from "react-native-easy-grid";

function transcriptScreen({ firebase }) {
  const [transcript, setTranscript] = useState([]);
  const [errorText, setErrorText] = useState("");
  const [filename, setFilename] = useState("");
  const [lecture, setLecture] = useState("");
  const [grade, setGrade] = useState("");
  const [semester, setSemester] = useState("");
  const [lastLecture, setLastLecture] = useState(0);
  const [addLectureModalVisible, setAddLectureModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [textLength, setTextLength] = useState(0);
  const jsonCek = async () => {
    let queue = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + `offline_stored.json`
    );
    let data = JSON.parse(queue);
    parseText(data);
  };
  const deleteLecture = (index, id) => {
    let temp = [...transcript];
    let lectureIndex = 0;
    temp[index].lectures.every((element) => {
      if (element.id == id) {
        return false;
      }
      lectureIndex++;
      return true;
    });
    temp[index].lectures.splice(lectureIndex, 1);
    setTranscript(temp);
  };
  const createLecture = (index) => {
    let temp = [...transcript];
    let counter = lastLecture;
    let tempGrade = grade.toUpperCase();
    const lectureInfo = { id: counter, lecture: lecture, grade: tempGrade };
    temp[index].lectures.push(lectureInfo);
    counter++;
    setLastLecture(counter);
    setTranscript(temp);
  };
  const createHTML = () => {
    setUploading(true);
    const hasSingle = transcript.length % 2 == 0 ? false : true;
    let printHTML = "<div>";
    const maxIndex = hasSingle ? transcript.length - 1 : transcript.length;
    for (let index = 0; index < maxIndex; index++) {
      if (index % 2 == 0) {
        printHTML +=
          '<div style="display: flex;flex-direction: row;justify-content: space-around;">';
      }
      printHTML +=
        "<div>\
        <div>\
        <div>\
        <h3>" +
        transcript[index].semester +
        ' .Semester</h3> \
      </div> \
      </div> \
      <div> \
      <table style="margin: 0; width:250pt;border: 1px solid black"> \
      <thead> \
      <tr> \
      <td style="padding-left:10px"><strong>Ders Adı</strong></td> \
      <td style="text-align: center;"><strong>Başarı Notu</strong></td> \
      </tr> \
      </thead> \
      </tbody> ';
      transcript[index].lectures.forEach((item) => {
        printHTML +=
          '<tr> \
        <td style="width:75%;border: 1px solid black;padding-left:4px">' +
          item.lecture +
          '</td>\
        <td style="width:25%; text-align: center;vertical-align: middle;border: 1px solid black">' +
          item.grade +
          "</td> \
        </tr>";
      });
      printHTML += "</tbody> \
      </table> \
      </div> \
      </div> ";

      if (index % 2 == 1) {
        printHTML += "</div>";
      }
    }
    printHTML += "</div>";
    /*transcript.forEach((element) => {
      if (counter % 2 == 0) {
        printHTML +=
          '<div style="display: flex;flex-direction: column-reverse;">';
      }
      printHTML +=
        "<div>\
        <div>\
        <h3>" +
        element.semester +
        ' .Semester</h3> \
      </div> \
      </div> \
      <table style="margin: 0; width:45%"> \
      <thead> \
      <tr> \
      <td><strong>Ders Adı</strong></td> \
      <td><strong>Başarı Notu</strong></td> \
      </tr> \
      </thead> \
      </tbody> ';
      element.lectures.forEach((item) => {
        printHTML +=
          '<tr> \
        <td style="width:75%">' +
          item.lecture +
          '</td>\
        <td style="width:25%">' +
          item.grade +
          "</td> \
        </tr>";
      });
      printHTML += "</tbody> \
      </table> \
      </div>";
      counter++;
    });*/
    createPDF(printHTML);
  };
  const parseText = async (response) => {
    if (typeof response.responses[0].textAnnotations === "undefined") {
      setUploading(false);
      return;
    }

    let text = response.responses[0].textAnnotations[0].description.replace(
      /[\n\r]+/gm,
      " "
    );

    let regex = /ders(.*)/gi;
    let replaced = text.replace(regex, "");
    if (replaced.length < 1) {
      return;
    }
    let lectureCounter = 0;
    let startSemester = replaced[0];
    const columnCount = (replaced.match(/\byar[ıi]y[ıi]l\b/gi) || []).length;
    const semesterCount = (text.match(/\byar[ıi]y[ıi]l\b/gi) || []).length;
    const rowCount = semesterCount / columnCount;
    const rowSingle =
      semesterCount - rowCount * columnCount == 1 ? true : false;
    let matches = [];
    let textColumn = [];
    regex = /Toplam\s*AKTS(.*)/gi;
    for (let i = 0; i <= semesterCount - columnCount; i += columnCount) {
      let temp = "";
      for (let j = i; j < i + columnCount; j++) {
        temp = text.replace(regex, "");
        let tempRegex = /(.*notu\s*akts\s*)/gi;
        temp = temp.replace(tempRegex, "");
        textColumn.push(temp);
        let matches = regex.exec(text);
        if (matches != null && matches.length > 1) {
          text = matches[1];
        }
      }
    }
    let firstIndex = rowSingle ? semesterCount - 1 : semesterCount;
    regex =
      /(?:.*(?:ortalama|,[0-9]{2}))?\s*(.*?)\s*\w+[ç]?\w+[ıi]?\s*([a-z]{2})\s*[0-9]/gi;
    let tempTranscript = [];
    let tempCoulumnCount = 0;
    let lastCoulumns = [];
    for (let index = 0; index < semesterCount; index++) {
      tempTranscript.push({ semester: startSemester, lectures: [] });
      startSemester++;
    }
    for (let i = 0; i < firstIndex; i++) {
      if (i != 0 && i % columnCount == 0) {
        tempCoulumnCount += columnCount;
      }
      let counter = tempCoulumnCount;
      while ((matches = regex.exec(textColumn[i])) !== null) {
        let lectureInfo = { id: lectureCounter, lecture: "", grade: "" };
        if (matches.length > 2);
        {
          lectureInfo.lecture = matches[1];
          lectureInfo.grade = matches[2];
          lectureCounter++;
        }
        if (i % columnCount == 0) {
          if (counter >= columnCount + tempCoulumnCount) {
            counter = tempCoulumnCount;
          }
          tempTranscript[counter].lectures.push(lectureInfo);
        } else {
          counter++;
          while (lastCoulumns.includes(counter)) {
            counter++;
          }
          if (counter >= columnCount + tempCoulumnCount) {
            counter = tempCoulumnCount;
          }
          tempTranscript[counter].lectures.push(lectureInfo);
        }
        counter++;
      }
      if (i % columnCount == 0) {
        lastCoulumns.length = 0;
      }
      lastCoulumns.push(counter);
    }
    if (rowSingle) {
      while ((matches = regex.exec(textColumn[semesterCount - 1])) !== null) {
        let lectureInfo = { id: lectureCounter, lecture: "", grade: "" };
        if (matches.length > 2);
        {
          lectureInfo.lecture = matches[1];
          lectureInfo.grade = matches[2];
          lectureCounter++;
        }
        tempTranscript[semesterCount - 1].lectures.push(lectureInfo);
      }
    }
    setLastLecture(lectureCounter);
    setTranscript(tempTranscript);
    setUploading(false);
  };

  const analyzeTranscript = async (response) => {
    parseText(response);
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
      let requestedFeatures = [
        { type: "DOCUMENT_TEXT_DETECTION", maxResults: 5 },
        { type: "OBJECT_LOCALIZATION", maxResults: 5 },
      ];
      let response = await firebase.submitToCloudVision(
        requestedFeatures,
        uploadUrl
      );
      analyzeTranscript(response);
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
        visible={saveModalVisible}
        onShow={() => {
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
                  if (transcript.length == 0) {
                    setErrorText("Please scan a transcript first");
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={addLectureModalVisible}
        onShow={() => {
          setLecture("");
          setGrade("");
          setSemester("");
          setErrorText("");
        }}
        onRequestClose={() => {
          setAddLectureModalVisible(!addLectureModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Add Lecture</Text>

            <Input
              onChangeText={(value) => setSemester(value)}
              maxLength={2}
              keyboardType="numeric"
              placeholder="Semester"
              style={{ backgroundColor: "white" }}
            />
            <Input
              onChangeText={(value) => setLecture(value)}
              placeholder="Lecture"
              style={{ backgroundColor: "white" }}
            />
            <Input
              onChangeText={(value) => setGrade(value)}
              maxLength={2}
              placeholder="Grade"
              style={{ backgroundColor: "white" }}
            />
            <Text style={{ color: "red", paddingBottom: 10 }}>{errorText}</Text>
            <View style={styles.modalButtonsContainer}>
              <Button
                title="Confirm"
                style={{ margin: 20 }}
                onPress={() => {
                  let semesterControl = true;
                  let index = 0;
                  transcript.every((element) => {
                    if (element.semester == semester) {
                      semesterControl = false;
                      return false;
                    }
                    index++;
                    return true;
                  });
                  if (transcript.length == 0) {
                    setErrorText("Please scan a transcript first");
                  } else if (lecture.length == 0) {
                    setErrorText("Lecture name can't be empty");
                  } else if (grade.length != 2) {
                    setErrorText("Grade isn't correct");
                  } else if (semesterControl) {
                    setErrorText(
                      "Scanned transcript not contaning entered semester"
                    );
                  } else {
                    setErrorText("");
                    setAddLectureModalVisible(!addLectureModalVisible);
                    createLecture(index);
                  }
                }}
              />
              <Button
                title="Cancel"
                style={{ alignSelf: "flex-end" }}
                onPress={() => {
                  setAddLectureModalVisible(!addLectureModalVisible);
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
          setAddLectureModalVisible(true);
        }}
        title="Add Lecture"
        color="#1985bc"
      />
      <Button
        onPress={() => {
          setAddModalVisible(true);
        }}
        title="add"
        color="#1985bc"
      />
      <Button
        onPress={() => {
          console.log(transcript);
        }}
        title="bilgi"
        color="#1985bc"
      />
      <Button onPress={jsonCek} title="json" color="#1985bc" />
      <FlatList
        data={transcript}
        renderItem={({ item }) => (
          <View style={{ padding: 10 }}>
            <View style={{ borderWidth: 1, backgroundColor: "#5898fc" }}>
              <Text
                style={{
                  alignSelf: "center",
                  fontWeight: "bold",
                }}
              >
                {item.semester} .Semester
              </Text>
            </View>
            <FlatList
              data={item.lectures}
              renderItem={({ item: item2 }) => (
                <Grid>
                  <Col size={50}>
                    <Row style={styles.cell}>
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="red"
                        style={{
                          position: "absolute",
                          left: 0,
                          borderRightWidth: 0.7,
                          borderRightColor: "red",
                        }}
                        onPress={() => {
                          let index = 0;
                          transcript.every((element) => {
                            if (element.semester == item.semester) {
                              return false;
                            }

                            index++;
                            return true;
                          });
                          deleteLecture(index, item2.id);
                        }}
                      />
                      <TextInput
                        style={{ paddingLeft: 20 }}
                        multiline={true}
                        onChangeText={(text) => {
                          let temp = [...transcript];
                          let semesterIndex = 0;
                          let lectureIndex = 0;
                          temp.every((element) => {
                            if (element.semester == item.semester) {
                              return false;
                            }
                            semesterIndex++;
                            return true;
                          });
                          temp[semesterIndex].lectures.every((element) => {
                            if (element.id == item2.id) {
                              return false;
                            }
                            lectureIndex++;
                            return true;
                          });
                          temp[semesterIndex].lectures[lectureIndex] = {
                            ...temp[semesterIndex].lectures[lectureIndex],
                            lecture: text,
                          };
                          setTranscript(temp);
                        }}
                      >
                        {item2.lecture}
                      </TextInput>
                    </Row>
                  </Col>
                  <Col size={15}>
                    <Row style={styles.cell}>
                      <TextInput
                        multiline={true}
                        maxLength={2}
                        onChangeText={(text) => {
                          let temp = [...transcript];
                          let semesterIndex = 0;
                          let lectureIndex = 0;
                          temp.every((element) => {
                            if (element.semester == item.semester) {
                              return false;
                            }
                            semesterIndex++;
                            return true;
                          });
                          temp[semesterIndex].lectures.every((element) => {
                            if (element.id == item2.id) {
                              return false;
                            }
                            lectureIndex++;
                            return true;
                          });
                          temp[semesterIndex].lectures[lectureIndex] = {
                            ...temp[semesterIndex].lectures[lectureIndex],
                            grade: text,
                          };
                          setTranscript(temp);
                        }}
                      >
                        {item2.grade}
                      </TextInput>
                    </Row>
                  </Col>
                </Grid>
              )}
              keyExtractor={(item2, index) => item2 + index}
            />
          </View>
        )}
        keyExtractor={(item, index) => item + index}
      />
      <StatusBar hidden={true} />
    </View>
  );
}

export default withFirebaseHOC(transcriptScreen);

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
  cell: {
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
