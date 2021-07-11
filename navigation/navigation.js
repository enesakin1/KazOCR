import { createSwitchNavigator, createAppContainer } from "react-navigation";
import Initial from "./initial";
import { AuthNavigation } from "./AuthNavigation";
import DrawerNavigaton from "./AppDrawNavigation";

const SwitchNavigator = createSwitchNavigator(
  {
    Initial: Initial,
    Auth: AuthNavigation,
    App: DrawerNavigaton,
  },
  {
    initialRouteName: "Initial",
  }
);

const AppContainer = createAppContainer(SwitchNavigator);

export default AppContainer;
