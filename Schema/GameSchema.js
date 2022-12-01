import {BSON} from 'realm';

const GameSchema = {
  name: 'Game',
  properties: {
    _id: 'objectId',
    name: 'string',
    status: 'string',
    max_players: 'int',
    players: '{}',
  },
  primaryKey: '_id',
};

export default GameSchema;
