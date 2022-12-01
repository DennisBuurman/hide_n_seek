/**
 * https://www.mongodb.com/docs/realm/sdk/react-native/quick-start/
 */

import Realm from "realm";
import {useApp} from '@realm/react';

export function LoginComponent({}) {
  console.log("Trying to log in...");
  const app = useApp();
  
  const signIn = async () => {
    const credentials = Realm.Credentials.anonymous(); // create an anonymous credential
    try {
      const user = await app.logIn(credentials);
      console.log("Successfully logged in!", user.id);
      return user;
    } catch (err) {
      console.error("Failed to log in", err.message);
    }
  };
  
  signIn();
}
