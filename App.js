import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Firebase, { FirebaseProvider } from "./config";
import AppContainer from "./navigation/navigation";
import { LogBox } from "react-native";

export default function App() {
  useEffect(() => LogBox.ignoreLogs(["Setting a timer"]), []);
  return (
    <View style={styles.container}>
      <Text>Hi</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
