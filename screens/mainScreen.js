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

function mainScreen({ navigation }) {
  useEffect(() => {
    async function prepare() {
      await SplashScreen.hideAsync();
    }

    prepare();
  }, []);
  const navigateTextScreen = async () => {
    navigation.navigate("Text");
  };
  return (
    <View style={styles.container}>
      <Button
        onPress={navigateTextScreen}
        title="Text"
        color="#1985bc"
        style={styles.buttons}
      />
      <StatusBar hidden={true} />
    </View>
  );
}

export default withFirebaseHOC(mainScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  buttons: {
    width: 15,
  },
});
