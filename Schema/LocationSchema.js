import {BSON} from 'realm';

export class Locations {
  constructor({
    id,
    p_latitude,
    p_longitude,
    epoch,
  }) {
    this.player_id = id;
    this.locations.push({latitude: p_latitude, longitude: p_longitude, timestamp: epoch});
  }
  
  static schema = {
    player_id: 'objectId',
    locations: [
      {
        latitude: 'double',
        longitude: 'double',
        timestamp: 'date'
      }
    ]
  }
}

export {Locations}
