import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import mainScreen from "../screens/mainScreen";
import textScreen from "../screens/textScreen";

const appStack = createStackNavigator();

const SearchStackNavigator = () => {
  return (
    <appStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <appStack.Screen name="Main" component={mainScreen} />
      <appStack.Screen name="Text" component={textScreen} />
    </appStack.Navigator>
  );
};

export default SearchStackNavigator;
