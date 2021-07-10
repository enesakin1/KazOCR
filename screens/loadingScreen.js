import React from "react";
import { ActivityIndicator, View, Image, StyleSheet } from "react-native";

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="white" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
    backgroundColor: "#5bb9eb",
  },
  logo: {
    alignSelf: "center",
    resizeMode: "contain",
    aspectRatio: 0.7,
    justifyContent: "center",
    borderRadius: 10,
  },
});
