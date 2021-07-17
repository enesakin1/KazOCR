import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import mainScreen from "../screens/mainScreen";
import textScreen from "../screens/textScreen";
import cardScreen from "../screens/cardScreen";
import transcriptScreen from "../screens/transcriptScreen";

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
      <appStack.Screen name="Card" component={cardScreen} />
      <appStack.Screen name="Transcript" component={transcriptScreen} />
    </appStack.Navigator>
  );
};

export default SearchStackNavigator;
