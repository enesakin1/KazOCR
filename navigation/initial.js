import React from "react";
import { withFirebaseHOC } from "../config";
import UserPermissions from "../utilities/UserPermissions";
import { StyleSheet, View, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";

class Initial extends React.Component {
  componentDidMount = async () => {
    await UserPermissions.getCameraPermission();
    await UserPermissions.getMediaLibraryPermission();
    await SplashScreen.preventAutoHideAsync();
    await this.props.firebase.checkUserAuth(async (user) => {
      if (user) {
        this.props.navigation.navigate("App");
      } else {
        this.props.navigation.navigate("Auth");
      }
    });
  };
  render() {
    return null;
  }
}
export default withFirebaseHOC(Initial);
