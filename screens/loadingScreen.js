import React from "react";
import { ActivityIndicator, View, Image, StyleSheet, Text } from "react-native";

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/icon1.png")}
        style={styles.logo}
      ></Image>
      <Text style={styles.loading}>Analyzing</Text>
      <ActivityIndicator size="large" color="white" style={styles.indicator} />
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
    flex: 0.3,
    justifyContent: "center",
    borderRadius: 10,
  },
  loading: {
    fontWeight: "bold",
    alignSelf: "center",
    color: "white",
  },
  indicator: {
    marginTop: 10,
  },
});
