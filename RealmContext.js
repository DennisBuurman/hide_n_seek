import {createRealmContext} from '@realm/react';
import {Game} from './Schema/GameSchema';

export default createRealmContext({
  schema: [Game.schema],
});
