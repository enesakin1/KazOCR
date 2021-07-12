import React from "react";
import { withFirebaseHOC } from "../config";
import LoadingScreen from "../screens/loadingScreen";
import UserPermissions from "../utilities/UserPermissions";

class Initial extends React.Component {
  componentDidMount = async () => {
    UserPermissions.getCameraPermission();
    UserPermissions.getMediaLibraryPermission();
    await this.props.firebase.checkUserAuth((user) => {
      if (user) {
        this.props.navigation.navigate("App");
      } else {
        this.props.navigation.navigate("Auth");
      }
    });
  };
  render() {
    return <LoadingScreen />;
  }
}

export default withFirebaseHOC(Initial);
