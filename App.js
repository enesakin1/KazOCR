import { StatusBar } from "expo-status-bar";
import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Firebase, { FirebaseProvider } from "./config";
import AppContainer from "./navigation/navigation";
import { LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
  useEffect(() => LogBox.ignoreLogs(["Setting a timer"]), []);
  return (
    <FirebaseProvider value={Firebase}>
      <NavigationContainer>
        <AppContainer />
      </NavigationContainer>
    </FirebaseProvider>
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
