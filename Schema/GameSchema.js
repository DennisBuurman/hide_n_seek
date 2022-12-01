import {BSON} from 'realm';

export class Game {
  constructor({
    name,
    id = new BSON.ObjectId(),
    max_players = 10,
    status = Game.STATUS_PREPARATION,
    mode = 'Hunted',
  }) {
    this._id = id;
    this.name = name;
    this.status = status;
    this.mode = mode;
  }
  static STATUS_PREPARATION = 'Preparation';
  static STATUS_IN_PROGRESS = 'InProgress';
  static STATUS_COMPLETE = 'Complete';
  
  static ROLE_HUNTER = 'Hunter';
  static ROLE_HUNTED = 'Hunted';
  
  static schema = {
    name: 'Game',
    properties: {
      _id: 'objectId',
      name: 'string',
      status: 'string',
      max_players: 'int',
      players: '{}', // {player_id: 'objectId', role: 'string'}
    },
    primaryKey: '_id',
  };
}
