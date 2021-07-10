import React from "react";
import { withFirebaseHOC } from "../config/Firebase";
import LoadingScreen from "./loadingScreen";

class Initial extends React.Component {
  componentDidMount = async () => {
    try {
      await this.props.firebase.checkUserAuth((user) => {
        if (user) {
          this.props.navigation.navigate("App");
        } else {
          this.props.navigation.navigate("Auth");
        }
      });
    } catch (error) {
      console.log(error);
    }
  };
  render() {
    return <LoadingScreen />;
  }
}

export default withFirebaseHOC(Initial);
