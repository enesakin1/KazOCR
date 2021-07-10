import { createSwitchNavigator, createAppContainer } from "react-navigation";
import Initial from "./initial";
import { AuthNavigation } from "./AuthNavigation";
import Main from "../screens/mainScreen";

const SwitchNavigator = createSwitchNavigator(
  {
    Initial: Initial,
    Auth: AuthNavigation,
    App: Main,
  },
  {
    initialRouteName: "Initial",
  }
);

const AppContainer = createAppContainer(SwitchNavigator);

export default AppContainer;