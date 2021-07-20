import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  Image,
} from "react-native";
import { Button } from "react-native-elements";
import { withFirebaseHOC } from "../config";
import * as SplashScreen from "expo-splash-screen";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

function mainScreen({ navigation }) {
  useEffect(() => {
    async function prepare() {
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);
  const navigateScreen = async (screen) => {
    navigation.navigate(screen);
  };
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../assets/background.jpg")}
        style={{ flex: 1, width: "100%" }}
        blurRadius={1}
      >
        <View
          style={{
            flex: 0.5,
            marginTop: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../assets/iconwithname.png")}
            style={{
              width: width * (2 / 3),
              height: height * (2 / 5),
              resizeMode: "contain",
            }}
          />
        </View>
        <View
          style={{ flex: 0.5, justifyContent: "center", alignItems: "center" }}
        >
          <Button
            titleStyle={styles.buttonTitle}
            icon={() => (
              <Ionicons
                name="document-text-outline"
                color={"white"}
                size={24}
              />
            )}
            onPress={() => {
              navigateScreen("Text");
            }}
            title="Document"
            buttonStyle={styles.buttons}
          />
          <Button
            titleStyle={styles.buttonTitle}
            icon={() => (
              <Ionicons name="ios-person" color={"white"} size={24} />
            )}
            onPress={() => {
              navigateScreen("Card");
            }}
            title="Student ID Card"
            buttonStyle={styles.buttons}
          />
          <Button
            titleStyle={styles.buttonTitle}
            icon={() => (
              <Ionicons name="school-outline" color={"white"} size={24} />
            )}
            onPress={() => {
              navigateScreen("Transcript");
            }}
            title="Transcript"
            buttonStyle={styles.buttons}
          />
        </View>
      </ImageBackground>
      <StatusBar hidden={true} />
    </SafeAreaView>
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
    margin: 20,
    borderRadius: 10,
    backgroundColor: "#3a3c3d",
    width: (width * 3) / 4,
    height: height / 12,
  },
  buttonTitle: {
    marginLeft: 10,
  },
});
