import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import mainScreen from "../screens/mainScreen";

const appStack = createStackNavigator();

const SearchStackNavigator = () => {
  return (
    <appStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <appStack.Screen name="Main" component={mainScreen} />
    </appStack.Navigator>
  );
};

export default SearchStackNavigator;
