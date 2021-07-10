import { createSwitchNavigator, createAppContainer } from "react-navigation";
import Initial from "./initial";
import { AuthNavigation } from "../App";
import DrawerNavigator from "../App";

const SwitchNavigator = createSwitchNavigator(
  {
    Initial: Initial,
    Auth: AuthNavigation,
    App: DrawerNavigator,
  },
  {
    initialRouteName: "Initial",
  }
);

const AppContainer = createAppContainer(SwitchNavigator);

export default AppContainer;
