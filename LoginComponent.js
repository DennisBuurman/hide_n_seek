import Realm from 'realm';
import GameSchema from './Schema/GameSchema';
import {Locations} from './Schema/LocationSchema';

const app = new Realm.App({ id: "hide-n-seek-hcajb", timeout: 10000 });
const credentials = Realm.Credentials.anonymous();

getRealm = async () => {
  try{
    const user = await app.logIn(credentials);
    const configuration = {
      schema: [GameSchema],
      sync: {
        user: app.currentUser,
        flexible: true,
      }
    };
    console.log('Succesfully logged in', app.currentUser.id);
    return Realm.open(configuration);
  } catch (err) {
    console.error('Failed to log in', err.message);
  }
}

export default getRealm;
