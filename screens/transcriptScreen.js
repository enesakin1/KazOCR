import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ToastAndroid,
  SafeAreaView,
  ImageBackground,
  TextInput,
} from "react-native";
import { Button, Input, CheckBox } from "react-native-elements";
import * as ImagePicker from "expo-image-picker";
import { withFirebaseHOC } from "../config";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
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
  const [pdfSelected, setPDFSelection] = useState(true);

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
    for (let index = 0; index < transcript.length; index++) {
      if (index % 2 == 0) {
        printHTML +=
          '<div style="display: flex;flex-direction: row;justify-content: space-around;" >';
      }
      printHTML +=
        "<div>\
        <div>\
        <div>\
        <h3>" +
        transcript[index].semester +
        ' .Yarıyıl</h3> \
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
    if (hasSingle) {
      printHTML += "</div>";
    }
    printHTML += "</div>";
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
      setUploading(false);
      return;
    }
    let lectureCounter = 0;
    let startSemester = replaced[0];
    const columnCount = (replaced.match(/\byar[ıi]y[ıi]l\b/gi) || []).length;
    const semesterCount = (text.match(/\byar[ıi]y[ıi]l\b/gi) || []).length;
    if (semesterCount == 0 && columnCount == 0) {
      setUploading(false);
      return;
    }
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
  const createJSON = async () => {
    setUploading(true);
    setPDFSelection(true);

    let temp = [...transcript];
    temp.forEach((semester) => {
      semester.lectures.forEach((lecture) => {
        delete lecture["id"];
      });
    });
    try {
      let uri = FileSystem.cacheDirectory + filename + `.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(temp));
      const result = await Sharing.shareAsync(uri);
      if (result.action === Sharing.sharedAction) {
        ToastAndroid.show("Successful shared!", ToastAndroid.LONG);
      }
      await FileSystem.deleteAsync(uri);
    } catch (e) {
      console.log(e);
    }
    setUploading(false);
  };
  const createPDF = async (html) => {
    setUploading(false);
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
      const result = await Sharing.shareAsync(pdfName);
      if (result.action === Sharing.sharedAction) {
        ToastAndroid.show("Successful shared!", ToastAndroid.LONG);
      }
      await FileSystem.deleteAsync(pdfName);
    } catch (err) {
      console.log("Save err: ", err);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    if (status != "granted") {
      alert("Need permission to use your camera");
      return;
    }
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
    });
    if (!pickerResult.cancelled) {
      handleImagePicked(pickerResult);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (status != "granted") {
      alert("Need permission to use your media library");
      return;
    }
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
      await firebase.deleteImageAsync(uploadUrl);
      parseText(response);
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
        <Modal
          animationType="slide"
          transparent={true}
          visible={saveModalVisible}
          onShow={() => {
            setFilename("");
            setErrorText("");
            setPDFSelection(true);
          }}
          onRequestClose={() => {
            setSaveModalVisible(!saveModalVisible);
          }}
        >
          <View style={styles.saveModalView}>
            <View style={{ flex: 5 }}>
              <Text style={styles.modalText}>Enter filename</Text>

              <Input
                onChangeText={(value) => setFilename(value)}
                placeholder="Filename..."
                style={{ backgroundColor: "white" }}
              />
              <CheckBox
                center
                title="JSON"
                iconRight
                iconType="material"
                checked={pdfSelected}
                checkedIcon="clear"
                uncheckedIcon="check"
                onPress={() => setPDFSelection(!pdfSelected)}
              />
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                flex: 0.2,
              }}
            >
              <Button
                title="Confirm"
                buttonStyle={styles.modalButtonStyle}
                onPress={() => {
                  if (transcript.length == 0) {
                    setErrorText("Please scan a transcript first");
                  } else if (filename.length == 0) {
                    setErrorText("Filename can't be empty");
                  } else {
                    setErrorText("");
                    setSaveModalVisible(!saveModalVisible);
                    if (pdfSelected) {
                      createHTML();
                    } else {
                      createJSON();
                    }
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
          <View style={styles.addLectureModalView}>
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
            <Text style={styles.errorText}>{errorText}</Text>
            <View style={styles.modalButtonsContainer}>
              <Button
                title="Confirm"
                buttonStyle={styles.modalButtonStyle}
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
                buttonStyle={styles.modalButtonStyle}
                onPress={() => {
                  setAddLectureModalVisible(!addLectureModalVisible);
                }}
              />
            </View>
          </View>
        </Modal>
        <View
          style={{
            flex: 0.09,
            margin: 10,
            backgroundColor: "#fcfcff",
            borderBottomWidth: 0.8,
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingRight: 20,
            alignItems: "center",
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
                setSaveModalVisible(true);
              }}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="share-social" color={"#3a3c3d"} size={32} />
            </TouchableOpacity>
          </View>
          <View
            style={{
              flex: 1.35,
              alignItems: "flex-start",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Button
              icon={() => (
                <Ionicons name="book-outline" color={"white"} size={24} />
              )}
              onPress={() => {
                setAddLectureModalVisible(true);
              }}
              title="Add Lecture"
              buttonStyle={{
                borderRadius: 10,
                backgroundColor: "#3a3c3d",
                marginRight: 10,
              }}
              titleStyle={styles.titleStyle}
            />
            <Button
              icon={() => (
                <Ionicons name="scan-outline" color={"white"} size={24} />
              )}
              onPress={() => {
                setAddModalVisible(true);
              }}
              title="Scan"
              buttonStyle={{
                borderRadius: 10,
                backgroundColor: "#3a3c3d",
              }}
              titleStyle={styles.titleStyle}
            />
          </View>
        </View>
        <View style={{ flex: 0.9, marginRight: 10, marginLeft: 10 }}>
          <FlatList
            data={transcript}
            renderItem={({ item }) => (
              <View
                style={{ margin: 5, padding: 10, backgroundColor: "#f2f2f2" }}
              >
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
                <Grid>
                  <Col size={50}>
                    <Row style={styles.cell}>
                      <Text
                        style={{
                          alignSelf: "center",
                          fontWeight: "bold",
                        }}
                      >
                        Lecture Name
                      </Text>
                    </Row>
                  </Col>
                  <Col size={15}>
                    <Row style={styles.cell}>
                      <Text
                        style={{
                          alignSelf: "center",
                          fontWeight: "bold",
                        }}
                      >
                        Grade
                      </Text>
                    </Row>
                  </Col>
                </Grid>
                <FlatList
                  data={item.lectures}
                  renderItem={({ item: item2 }) => (
                    <Grid>
                      <Col size={50}>
                        <Row style={styles.cell}>
                          <TextInput
                            style={{ paddingLeft: 20, alignSelf: "center" }}
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
                          <Ionicons
                            name="trash-outline"
                            size={17}
                            color="red"
                            style={{
                              position: "absolute",
                              right: 0,
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
        </View>
      </ImageBackground>
      <StatusBar hidden={true} />
    </SafeAreaView>
  );
}

export default withFirebaseHOC(transcriptScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },
  addLectureModalView: {
    flex: 0.6,
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
  saveModalView: {
    flex: 0.4,
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
  modalButtonStyle: {
    borderRadius: 10,
    backgroundColor: "#3a3c3d",
    marginLeft: 10,
  },
  /***** */
  cell: {
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleStyle: {
    marginLeft: 5,
  },
  errorText: {
    color: "red",
    paddingBottom: 15,
    alignSelf: "center",
  },
  buttonStyle: {
    borderRadius: 10,
    backgroundColor: "#3a3c3d",
  },
});
