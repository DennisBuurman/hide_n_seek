/**
 * Large scale hide_n_seek app
 * https://github.com/DennisBuurman/hide_n_seek
 *
 * Authors: George Boukouvalas, Dennis Buurman
 * Organization: LIACS @ Leiden University
 * key: 8c6526fd-284d-4601-90f8-5cf99e87cb18
 *
 * @format
 * @flow strict-local
 */

/*
 * Sources:
 * https://github.com/react-native-maps/react-native-maps
 * https://reactnative.dev/docs/0.63/geolocation
 * https://github.com/Agontuk/react-native-geolocation-service
 * https://developer.android.com/reference/android/Manifest.permission
 * https://blog.logrocket.com/react-native-maps-introduction/
 * https://github.com/manuelbieh/geolib
 * 
 *
 */

/*************************************************/

import React, { useState, useRef, component, useEffect } from "react";
import {
    Text,
    View,
    Button,
    Alert,
    PermissionsAndroid,
    Platform,
    Image,
    Pressable,
    ScrollView,
} from 'react-native';
import styles from './Styles.js';
import uuid from 'react-native-uuid';

import {
 Menu,
 MenuProvider,
 MenuOptions,
 MenuOption,
 MenuTrigger,
 renderers,
} from "react-native-popup-menu";

// Location and maps imports
import MapView from 'react-native-maps';
import {
    Marker,
} from 'react-native-maps';
import Geolocation, {GeoPosition} from 'react-native-geolocation-service';
import VIForegroundService from '@voximplant/react-native-foreground-service';
import { getDistance } from 'geolib';

// database imports
import firestore from '@react-native-firebase/firestore';

/*************************************************/

const gameCollection = firestore().collection('Games');
const uid = "69";// uuid.v4(); // TODO: save per device
//const uid = "1dc33d7d-64d8-4042-aa8d-f5c65caa8fbe";
const INTERVAL_MS = 3;
let counter = 0;

/*************************************************/

const App = () => {
  /* Variables */
  const [forceLocation, setForceLocation] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);
  const [locationDialog, setLocationDialog] = useState(true);
  const [significantChanges, setSignificantChanges] = useState(false);
  const [observing, setObserving] = useState(false);
  const [foregroundService, setForegroundService] = useState(false);
  const [useLocationManager, setUseLocationManager] = useState(false);
  const [location, setLocation] = useState<GeoPosition | null>(null);
  const watchId = useRef<number | null>(null);
  const [region, setRegion] = useState({
    latitude: 51,
    longitude: -0.09,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const mapRef = useRef(null);
  /* End variables */
  
  /* Database variables and functions */
  const [players, setPlayers] = useState([]); // list of other player {id, alive}
  const [plocs, setPlocs] = useState([]); // locations of other players {id, lat, lon, role}
  const [status, setStatus] = useState('Menu'); // Menu, Prep, Play, End
  const [gameId, setGameId] = useState('TestID');
  const [role, setRole] = useState('Hunter');
  const [host, setHost] = useState('Lobby'); // Lobby, Host, Participant
  const [alive, setAlive] = useState(true); // alive: false or true?
  const [maxPlayers, setMaxPlayers] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [markList, setMarkList] = useState([]);
  
  const customAlert = (msg) => {
    Alert.alert(
      msg.title,
      msg.desc,
      [
        { text: "OK", onPress: () => console.log("OK Pressed") }
      ]
    );
  }
  
  const gameSettings = () => {
    let info_str = 'Player ID: ' + uid + '\n\n';
    
    if (status == 'Menu') {
      info_str += 'Still in menu.\nJoin a game to start playing.';
    } else {
      info_str += status + ' phase:\n';
      info_str += '- role: ' + role + '\n'; 
      info_str += '- player count: ' + playerCount + '\n';
      info_str += '- game status: ' + status + '\n';
      info_str += '- rank: ' + host + '\n';
      info_str += '- players:\n';
      // info_str += '- winner: ' + winner; // TODO: winner
    }
    
    players.forEach(p => {
      info_str += '   => ' + p.player_id + '\n';
    });
    
    customAlert({title: 'Info:', desc: info_str});
  }
  
  const startGame = () => {
    let info_str = '';
    console.log('[Trying to start the Game]');
    
    if (host == 'Host') {
      console.log('[Verified host, starting game...]');
      firestore().collection('Games').doc(gameId).get().then(documentSnapshot => {
        if (documentSnapshot.data().status != 'Play') {
          if (documentSnapshot.exists) {
            firestore().collection('Games').doc(gameId).update({
              'status': 'Play',
            });
            console.log("[Game started!]");
            info_str += 'Verified host, started game!';
          }
        } else {
          console.log("[Game not startable, status " + ocumentSnapshot.data().status  + "]");
          info_str += 'Game not startable, check settings for more info.';
        }
      });
    } else {
      console.log('[Not the host, unable to start game.]');
      info_str += "Not the host, unable to start game.";
    }
    customAlert({title: 'Starting a game:', desc: info_str});
  }
  
  const joinGame = (id) => {
    let joined = false;
    let still_alive = true;
    
    if (status != 'Menu') {
      console.log('[Already in a game.]');
      customAlert({title: 'Join info:', desc: 'Already in a game.\nGame not joined.'});
    } else {
      firestore().collection('Games').doc(id).get().then(documentSnapshot => {
        console.log("[Game exists:", documentSnapshot.exists + ']');
        if (documentSnapshot.exists) {
          documentSnapshot.data().players.forEach(p => {
            if (p.player_id == uid) {
              joined = true;
              still_alive = p.alive;
            }
          });
          if (!joined) {
            let players = documentSnapshot.data().players;
            players.push({
              player_id: uid,
              alive: true,
            });
            let player_count = documentSnapshot.data().player_count;
            if (documentSnapshot.data().max_players > player_count) {
              firestore().collection('Games').doc(id).update({
                'player_count': player_count + 1,
              });
              firestore().collection('Games').doc(id).update({
                'players': players,
              }).then(() => {
                console.log('[Joined game!]');
                customAlert({title: 'Join info:', desc: 'Game succesfully joined!'});
                setHost('Participant');
                setMaxPlayers(documentSnapshot.data().max_players);
                setStatus(documentSnapshot.data().status);
                setGameId(id);
                setAlive(true);
              });
            } else {
              console.log("[Game full...]");
              customAlert({title: 'Join info:', desc: 'Failed: Game full.'});
            }
          } else {
            console.log('Already in this game');
            customAlert({title: 'Join info:', desc: 'Joined game before.\n Rejoining game.'});
            setGameId(id);
            setStatus(documentSnapshot.data().status);
            setMaxPlayers(documentSnapshot.data().max_players);
            setAlive(still_alive);
            if (uid == documentSnapshot.data().host) {
              setHost('Host');
            } else {
              setHost('Participant');
            }
          }
        }
      });
    }
  }
  
  const createGame = () => {
    console.log("[Trying to create a Game]");
    firestore().collection('Games').doc(gameId).get().then(documentSnapshot => {
      if (documentSnapshot.exists) {
        console.log("[Game already exists, trying to join...]");
        joinGame(gameId);
      } else {
          firestore().collection('Games').doc(gameId).set({
            name: 'Test game',
            max_players: 20,
            player_count: 1,
            status: 'Prep',
            host: uid,
            players: [
              {
                player_id: uid,
                alive: true,
              }
            ]
          }).then(() => {
            console.log('[Game added!]');
            customAlert({title: 'Create info:', desc: 'Created game with ID: ' + gameId});
            setHost('Host');
            setStatus('Prep');
            setMaxPlayers(20);
            setAlive(true);
          });
      }
    });
  }
  
  const updateLocations = () => {
    let locations = [];
    let count = 0;
    firestore().collection('Locations').get().then(querySnapshot => {
      //console.log('--> Total users: ', querySnapshot.size);
      querySnapshot.forEach(documentSnapshot => {
        players.forEach(p => {
          if (p.alive && p.player_id == documentSnapshot.id) {
            count += 1;
            locations.push({
              player_id: documentSnapshot.id,
              role: documentSnapshot.data().role,
              latitude: documentSnapshot.data().latitude,
              longitude: documentSnapshot.data().longitude
            });
          }
        });
      });
      console.log("--> Players in game:", count);
      setPlocs(locations);
    });
  }
  
  const leaveGame = () => {
    console.log('TODO: leave current game');
  }
  
  const markPlayer = (id) => {
    let list;
    console.log('[Marking player: ' + id + ']');
    
    firestore().collection('Proximity').doc(uid).get().then(documentSnapshot => {
      if (documentSnapshot.exists) {
        list = documentSnapshot.data().marks;
        list.forEach(mark => {
          if (mark.player_id == id) {
            mark.marked = true;
          }
        });
        setMarkList(list);
        firestore().collection('Proximity').doc(uid).set({marks: list}).then(() => {
          console.log('[Player ' + id + ' marked]');
        });
      }
    });
    
    customAlert({title: 'Mark info:', desc: 'Marked player: ' + id});
  }
  
  const markMenu = () => {
    let options = [{ text: "Return", onPress: () => console.log("OK Pressed") }];
    let desc = 'Tap on player you would like to mark:';
    
    console.log('[Checking mark list menu.]');
    
    if (role == 'Hunter') {
      markList.forEach(mark => {
        if (!mark.marked) {
          options.push({
            text: mark.player_id,
            onPress: () => markPlayer(mark.player_id),
          });
        }
      });
    } else {
      desc = 'Tap on player to confirm his/her mark:';
      markList.forEach(mark => {
        options.push({
          text: mark.player_id,
          onPress: () => die(),
        });
      });
    }
    
    Alert.alert(
      "Mark List",
      desc,
      options,
    );
  }
  
  const updateMarkList = () => {
    let adversaries = [];
    let marks = [];
    let dist;
    let you;
    
    // Get adversary list from plocs: {id, lat, lon, role}
    plocs.forEach(p => {
      if (p.role != role) {
        adversaries.push(p);
      } else if (p.player_id == uid) {
        you = p;
      }
    });
    
    if (you) {
      // Check if an adversary is close to you
      adversaries.forEach(a => {
        dist = getDistance(
          {latitude: you.latitude, longitude: you.longitude,}, 
          {latitude: a.latitude, longitude: a.longitude,},
        );
        // Adversary is close, add to mark list
        if (dist < 100) {
          marks.push({player_id: a.player_id, marked: false});
        }
      });
      
      // Compare new mark list with old one (don't overwrite 'marked' values')
      marks.forEach(new_mark => {
        markList.forEach(old_mark => {
          // Keep old markers (dont false a previous true)
          if (old_mark.player_id == new_mark.player_id) {
            new_mark.marked = old_mark.marked;
          }
        });
      });
      
      // Update mark list
      // Proximity: player_id: {marks: [{player_id, mark}]}
      firestore().collection('Proximity').doc(uid).set({
          marks: marks,
      });
      setMarkList(marks);
      console.log('--> Updated mark list, len: ' + marks.length);
    } else {
      console.log('--> Failed to update mark list: user not found');
    }
  }
  
  const players_alive = () => {
    let found = false;
    let P;
    let hunteds = [];
    console.log('--> Checking if there are alive hunteds');
    
    players.forEach(p => {
      if (p.role == 'Hunted' && p.alive) {
        hunteds.push(p.player_id);
      }
    });
    
    firestore().collection('Games').doc(gameId).get().then(documentSnapshot => {
      if (documentSnapshot.exists) {
        P = documentSnapshot.data().players;
        P.forEach(p => {
          if (hunteds.includes(p.player_id)) {
            found = true;
          }
        });
        if (found) {
          console.log('--> Found alive player.');
        } else {
          console.log('--> No hunteds alive, ending game...');
          firestore().collection('Games').doc(gameId).update({
            'status': 'End',
          });
          setStatus('End');
        }
      }
    });
  }
  
  // Unalive player. Check if game must end.
  const die = () => {
    let P;
    console.log('[Unaliving self.]');
    
    firestore().collection('Games').doc(gameId).get().then(documentSnapshot => {
      if (documentSnapshot.exists) {
        P = documentSnapshot.data().players;
        P.forEach(p => {
          if (p.player_id == uid) {
            p.alive = false;
          }
        });
        firestore().collection('Games').doc(gameId).update({
          'players': P,
        });
        setPlayers(P);
        setAlive(false);
        console.log('[Unalived succesfully.]');
        customAlert({title: 'Game info:', desc: 'You have been eliminated.'});
        players_alive();
      }
    });
  }
  
  const denyMark = (id) => {
    console.log('[Denied mark, adding to list.]');
    customAlert({title: 'Denied mark.', desc: 'Added to mark list for later confirmation.'});
    
    let list = markList;
    list.push(id);
    setMarkList(list);
  }
  
  // Hunted: Confirm and deny functions
  const markedMenu = (id) => {
    let options = [
      { text: "Return", onPress: () => console.log("OK Pressed") },
      { text: "Confirm", onPress: die()},
      { text: "Deny", onPress: denyMark(id)},
    ];
    
    console.log('[Checking marked menu.]');
    
    Alert.alert(
      "You have been marked!",
      "Confirm or deny this mark",
      options,
    );
  }
  
  // Prompt user if marked by hunter
  // save mark if denied
  const checkMarks = () => {
    let adversaries = [];
    let list;
    let found = false;
    let prev_marked;
    let you;
    console.log('--> Checking for marks.');
    
    // Get adversary list from players: {id, alive}
    players.forEach(p => {
      if (p.role != role) {
        adversaries.push(p);
      } else if (p.player_id == uid) {
        you = p;
      }
    });
    
    adversaries.forEach(a => {
      if (!found) {
        prev_marked = false;
        firestore().collection('Proximity').doc(a.player_id).get().then(documentSnapshot => {
          if (documentSnapshot.exists) {
            list = documentSnapshot.data().marks;
            list.forEach(mark => {
              if (mark.player_id == uid) {
                // Prompt user
                markList.forEach(x => {
                  if (x.player_id == mark.player_id) {
                    prev_marked = true;
                  }
                });
                if (!prev_marked) {
                  markedMenu(a.player_id);
                  found = true;
                }
              }
            });
          }
        });
      }
    });
  }
  
  // Check proximity and action, depending on role
  const checkProximity = () => {
    if (role == 'Hunter') {
      updateMarkList();
    } else {
      checkMarks();
    }
  }
  
  const checkStatus = () => {
    if (status == 'Menu') {
      console.log('--> Still in menu...');
    } else if (status == 'Prep') {
      console.log('--> Preparation phase...');
    } else if (status == 'Play') {
      console.log('--> Playing game...');
      if (alive) {
        checkProximity();
      }
    } else {
      console.log('--> Game has Ended...');
      customAlert({title: 'Game info:', desc: 'Game ended!\nReturning to menu.'});
      setStatus('Menu');
    }
  }
  
  const postLocation = () => {
    if (location) {
      firestore().collection('Locations').doc(uid).set({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        role: role,
      }).then(() => {
        console.log('--> Location posted!');
      });
    } else {
      console.log("--> Waiting for location...");
    }
  }
  
  const updateGame = () => {
    if (status != 'Menu') {
      firestore().collection('Games').doc(gameId).get().then(documentSnapshot => {
        console.log('--> Game exists: ', documentSnapshot.exists);
        if (documentSnapshot.exists) {
          //console.log('Game data: ', documentSnapshot.data());
          setPlayers(documentSnapshot.data().players); // update player list
          setMaxPlayers(documentSnapshot.data().max_players);
          setPlayerCount(documentSnapshot.data().player_count);
          //console.log('Players: ', players);
          updateLocations(); // update player locations
          if (documentSnapshot.data().status == 'Play' && status != 'Play') {
            customAlert({title: 'Game status info:', desc: 'Game has started, good luck!'});
          }
          setStatus(documentSnapshot.data().status); // update game status
        } else {
          setStatus('Menu');
          setHost('Lobby');
        }
      });
    }
    checkStatus();
  }
  
  const deleteLocation = () => {
    firestore().collection('Users').doc(uid).delete().then(() => {
      console.log('User deleted!');
    });
  }
  
  const changeRole = () => {
    console.log("[Trying to change role...]");
    let new_role = 'Hunted';
    
    if (status != 'Play') {
      firestore().collection('Locations').doc(uid).get().then(documentSnapshot => {
        console.log("[Location doc exists:", documentSnapshot.exists + ']');
        if (documentSnapshot.exists) {
          let cur_role = documentSnapshot.data().role;
          if (cur_role == 'Hunted') {
            new_role = 'Hunter';
          }
          firestore().collection('Locations').doc(uid).update({
            'role': new_role
          }).then(() => {
            setRole(new_role);
            console.log('[Role changed to:', new_role + ']');
            customAlert({title: 'Role info:', desc: 'Changed role to: ' + new_role});
          });
        } else {
          customAlert({title: 'Role info:', desc: 'Failed: could not find player. Try again in a few seconds.'});
        }
      });
    } else {
      console.log('[Cannot change role, game started.]');
      customAlert({title: 'Role info:', desc: 'Cannot change role.\nGame already started.'});
    }
  }
  /* End of Databas functions */
  
  /* Map functions */
  const goToUser = () => {
    console.log("[Center button pressed.]");
    let user_loc = {
      latitude: location?.coords?.latitude,
      longitude: location?.coords?.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    mapRef.current.animateToRegion(user_loc, 1 * 1000);
  };
  
  const PlaceMarkers = () => {
    //console.log("Locations:", plocs);
    
    var markers = plocs.map(loc => {
      let imgs = [require("./img/adversary.png"), require("./img/player.png")];
      let img = imgs[0]
      let description = loc.player_id;
      let title = "Adversary: " + loc.role;
      
      // check if friend
      if (loc.role == role) {
        img = imgs[1];
        title = "Team: " + loc.role;
      }
      
      if (loc.player_id == uid) {
        title = "You: " + loc.role;
      }
      
      return(
        <Marker
          key={loc.player_id}
          tracksViewChanges={false}
          coordinate={ 
            {
              latitude: loc.latitude,
              longitude: loc.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            }
          }
          pinColor="red"
          title={title}
          description={description}
        >
          <Image 
            source={img}
            style={{width: 45, height: 45}}
            resizeMode="contain"
          />
        </Marker>
      );
    });
    
    console.log('--> Update Markers');
    
    return (
      markers
    );
  };
  /* End of Map functions */
  
  /* Location functions */
  const hasPermissionIOS = async () => {
    const openSetting = () => {
      Linking.openSettings().catch(() => {
        Alert.alert('Unable to open settings');
      });
    };
    const status = await Geolocation.requestAuthorization('whenInUse');
    
    if (status === 'granted') {
      return true;
    }
    
    if (status === 'denied') {
      Alert.alert('Location permission denied');
    }
    
    if (status === 'disabled') {
      Alert.alert(
        `Turn on Location Services to allow "${appConfig.displayName}" to determine your location.`,
        '',
        [
          { text: 'Go to Settings', onPress: openSetting },
          { text: "Don't Use Location", onPress: () => {} },
        ],
      );
    }
    
    return false;
  };
  
  const hasLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const hasPermission = await hasPermissionIOS();
      return hasPermission;
    }
    
    if (Platform.OS === 'android' && Platform.Version < 23) {
      return true;
    }
    
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    
    if (hasPermission) {
      return true;
    }
    
    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    
    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }
    
    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    }
    
    return false;
  };
  
  const getLocation = async () => {
    const hasPermission = await hasLocationPermission();
    
    if (!hasPermission) {
      return;
    }
    
    Geolocation.getCurrentPosition(
      position => {
        setLocation(position);
        //console.log("Manual: ", position);
      },
      error => {
        Alert.alert(`Code ${error.code}`, error.message);
        setLocation(null);
        console.log(error);
      },
      {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 0,
        forceRequestLocation: forceLocation,
        forceLocationManager: useLocationManager,
        showLocationDialog: locationDialog,
      },
    );
  };
  
  const getLocationUpdates = async () => {
    const hasPermission = await hasLocationPermission();
    
    if (!hasPermission) {
      return;
    }
    
    if (Platform.OS === 'android' && foregroundService) {
      await startForegroundService();
    }
    
    setObserving(true);
    
    watchId.current = Geolocation.watchPosition(
      position => {
        setLocation(position);
        console.log("--> Position:", position.coords.latitude, position.coords.longitude);
      },
      error => {
        setLocation(null);
        console.log(error);
      },
      {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        enableHighAccuracy: highAccuracy,
        distanceFilter: 0,
        interval: 10000,
        fastestInterval: 10000,
        forceRequestLocation: forceLocation,
        forceLocationManager: useLocationManager,
        showLocationDialog: locationDialog,
        useSignificantChanges: significantChanges,
      },
    );
  };
  
  const startForegroundService = async () => {
    if (Platform.Version >= 26) {
      await VIForegroundService.getInstance().createNotificationChannel({
        id: 'locationChannel',
        name: 'Location Tracking Channel',
        description: 'Tracks location of user',
        enableVibration: false,
      });
    }
    
    return VIForegroundService.getInstance().startService({
      channelId: 'locationChannel',
      id: 420,
      title: appConfig.displayName,
      text: 'Tracking location updates',
      icon: 'ic_launcher',
    });
  };
  
  const stopLocationUpdates = () => {
    console.log("Stop observing");
    
    if (Platform.OS === 'android') {
      VIForegroundService.getInstance()
        .stopService()
        .catch((err: any) => err);
    }
  
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setObserving(false);
    }
  };
  
  /* End of location functions */
  
  if (!observing) {
    getLocationUpdates(); // start by activating location updates
  } else {
    if (counter > INTERVAL_MS) {
      postLocation();
      updateGame();
      counter = 0;
    } else {
      counter = counter + 1;
    }
  }
  
  const ProximityInfo = () => {
    let content = [];
    
    if (role == 'Hunter') {
      content.push(
        <Text style={styles.Proximity}> Targets in proximity: {markList.length} </Text>
      );
    } else {
      content.push(
        <Text style={styles.Proximity}> Marked by {markList.length} players. </Text>
      );
    }
    
    return (
      content
    );
  }
  
  /* Return sequence */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}> Large Scale Hide-n-Seek </Text>
        <Pressable style={styles.settings} onPress={gameSettings}>
          <Image 
            source={require("./img/settings.jpg")}
            style={styles.image}
            resizeMode="contain"
          />
        </Pressable>
      </View>
      <View style={styles.header}>
        <ProximityInfo/>
      </View>
      <MapView
        coords={location?.coords || null}
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={(region) => setRegion(region)}
      >
        <PlaceMarkers/>
      </MapView>
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={() => goToUser()}>
          <Text style={styles.text}>Center</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={markMenu}>
          <Text style={styles.text}>Mark List</Text>
        </Pressable>
      </View>
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={createGame}>
          <Text style={styles.text}>Join a Game</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={startGame}>
          <Text style={styles.text}>Start Game</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={changeRole}>
          <Text style={styles.text}>Change Role</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default App;
