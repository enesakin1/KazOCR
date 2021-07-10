import { createSwitchNavigator, createAppContainer } from "react-navigation";
import Initial from "./initial";
import Signup from "../screens/signUpScreen";
import Login from "../screens/loginScreen";
import Main from "../screens/mainScreen";

const SwitchNavigator = createSwitchNavigator(
  {
    Initial: Initial,
    Signup: Signup,
    Login: Login,
    Main: Main,
  },
  {
    initialRouteName: "Initial",
  }
);

const AppContainer = createAppContainer(SwitchNavigator);

export default AppContainer;
