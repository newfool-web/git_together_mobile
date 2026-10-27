import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import appStore from "./src/utils/store";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <Provider store={appStore}>
      <StatusBar style="light" />
      <AppNavigator />
    </Provider>
  );
}
