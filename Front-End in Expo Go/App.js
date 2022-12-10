import * as React from "react";
import "react-native-gesture-handler";
import StartScreen from "./app/screens/StartScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GameScreen from "./app/screens/GameScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen
          name="Welcome"
          component={StartScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Gameplay" component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
