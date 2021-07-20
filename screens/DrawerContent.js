import React from "react";
import { View, StyleSheet, ImageBackground, SafeAreaView } from "react-native";
import { Drawer } from "react-native-paper";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { withFirebaseHOC } from "../config";

function DrawerContent(props) {
  _signOut = async () => {
    await props.firebase.signOut();
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ECF1F4" }}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerContent}>
          <View style={styles.userInfoSection}>
            <View
              style={{
                marginTop: 15,
              }}
            >
              <ImageBackground
                source={require("../assets/icon1.png")}
                style={styles.logo}
                borderRadius={10}
              />
            </View>
            <Drawer.Section style={styles.drawerSection}>
              <DrawerItem
                icon={({ color, size }) => (
                  <Ionicons name="home-outline" color={color} size={size} />
                )}
                label="Home"
                labelStyle={{ fontSize: 16 }}
                onPress={() => {
                  props.navigation.navigate("Main");
                }}
              />
              <DrawerItem
                icon={({ color, size }) => (
                  <Ionicons
                    name="document-text-outline"
                    color={color}
                    size={size}
                  />
                )}
                label="Document"
                labelStyle={{ fontSize: 16 }}
                onPress={() => {
                  props.navigation.navigate("Text");
                }}
              />
              <DrawerItem
                icon={({ color, size }) => (
                  <Ionicons name="ios-person" color={color} size={size} />
                )}
                label="Student ID Card"
                labelStyle={{ fontSize: 16 }}
                onPress={() => {
                  props.navigation.navigate("Card");
                }}
              />
              <DrawerItem
                icon={({ color, size }) => (
                  <Ionicons name="school-outline" color={color} size={size} />
                )}
                label="Transcript"
                labelStyle={{ fontSize: 16 }}
                onPress={() => {
                  props.navigation.navigate("Transcript");
                }}
              />
            </Drawer.Section>
          </View>
        </View>
      </DrawerContentScrollView>
      <Drawer.Section style={styles.bottomDrawerSection}>
        <DrawerItem
          icon={({ color, size }) => (
            <Ionicons name="ios-exit" color={color} size={size} />
          )}
          label="Sign Out"
          onPress={_signOut}
        />
      </Drawer.Section>
    </SafeAreaView>
  );
}

export default withFirebaseHOC(DrawerContent);

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
  },
  row: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  bottomDrawerSection: {
    marginBottom: 15,
    borderTopColor: "#f4f4f4",
    borderTopWidth: 1,
  },
  logo: {
    flex: 1,
    aspectRatio: 1,
  },
});
