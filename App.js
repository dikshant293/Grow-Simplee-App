import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './Components/LoginScreen';
import RiderHome from './Components/RiderHome';
import BinPacking from './Components/BinPacking';
import RouteScreen from './Components/RouteScreen';
import ViewMapScreen from './Components/ViewMapScreen';
import PackageScreen from './Components/PackageScreen';
import {enableLatestRenderer} from 'react-native-maps';

enableLatestRenderer();

function App(props) {
  // React Native Navigator Stack for Screens
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Login' screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Rider Home" component={RiderHome} options={{ gestureEnabled: false }}/>
        <Stack.Screen name="Bin Packing" component={BinPacking} />
        <Stack.Screen name="Route Screen" component={RouteScreen} />
        <Stack.Screen name="View Map" component={ViewMapScreen} />
        <Stack.Screen name="Package Screen" component={PackageScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;