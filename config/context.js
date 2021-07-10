import React, { createContext } from "react";

const context = createContext({});

export const FirebaseProvider = context.Provider;
export const FirebaseConsumer = context.Consumer;

export const withFirebaseHOC = (Component) => (props) =>
  (
    <FirebaseConsumer>
      {(state) => <Component {...props} firebase={state} />}
    </FirebaseConsumer>
  );
