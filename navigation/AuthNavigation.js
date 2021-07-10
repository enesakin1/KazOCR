import { createSwitchNavigator } from "react-navigation";
import Signup from "../screens/signUpScreen";
import Login from "../screens/loginScreen";

const AuthNavigation = createSwitchNavigator(
  {
    Login: Login,
    Signup: Signup,
  },
  {
    initialRouteName: "Login",
  }
);

export { AuthNavigation };
