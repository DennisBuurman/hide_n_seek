/**
 * Large scale hide_n_seek app
 * https://github.com/DennisBuurman/hide_n_seek
 *
 * Authors: George Boukouvalas, Dennis Buurman
 * Organization: LIACS @ Leiden University
 * key: 8c6526fd-284d-4601-90f8-5cf99e87cb18
 * realm-cli login --api-key jvmokmqb --private-api-key 8c6526fd-284d-4601-90f8-5cf99e87cb18
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
} from 'react-native';
import styles from './Styles.js';
import uuid from 'react-native-uuid';

// Location and maps imports
import MapView from 'react-native-maps';
import {
    Marker,
} from 'react-native-maps';
import Geolocation, {GeoPosition} from 'react-native-geolocation-service';
import VIForegroundService from '@voximplant/react-native-foreground-service';
import getDistance from 'geolib/es/getDistance';

// database imports
import firestore from '@react-native-firebase/firestore';

/*************************************************/

const gameCollection = firestore().collection('Games');
const uid = uuid.v4(); // TODO: save in file after debug phase (used for player simulation)
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
  const [role, setRole] = useState('Hunted');
  const [host, setHost] = useState('Lobby'); // Lobby, Host, Participant
  
  const customAlert = (msg) => {
    Alert.alert(
      msg.title,
      msg.desc,
      [
        { text: "OK", onPress: () => console.log("OK Pressed") }
      ]
    );
  }
  
  const startGame = () => {
    console.log('TODO: start game (first check if Host)');
    customAlert({title: 'Starting a game', desc: 'TODO: Trying  to start a game'});
  }
  
  const joinGame = (id) => {
    firestore().collection('Games').doc(id).get().then(documentSnapshot => {
      console.log("--> Game exists:", documentSnapshot.exists);
      if (documentSnapshot.exists) {
        let players = documentSnapshot.data().players;
        players.push({
          player_id: uid,
          alive: true,
        });
        let player_count = documentSnapshot.data().player_count;
        if (documentSnapshot.data().max_players > player_count) {
          firestore().collection('Games').doc(id).update({
            'player_count': player_count + 1,
          })
          firestore().collection('Games').doc(id).update({
            'players': players,
          }).then(() => {
            console.log('--> Joined game!');
            customAlert({title: 'Join info:', desc: 'Game exists and succesfully joined!'});
            setHost('Participant');
          });
        } else {
          console.log("--> Game full...");
          customAlert({title: 'Joi info:', desc: 'Failed: Game full.'});
        }
      }
    });
  }
  
  const createGame = () => {
    console.log("--> Trying to create a Game");
    firestore().collection('Games').doc(gameId).get().then(documentSnapshot => {
      if (documentSnapshot.exists) {
        console.log("--> Game already exists, trying to join...");
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
            console.log('--> Game added!');
            customAlert({title: 'Create info:', desc: 'Created game with ID: ' + gameId});
            setHost('Host');
            setStatus('Prep');
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
  
  const checkWinCondition = () => {
    // Check if player in vicinity
    let adversaries = [];
    let you;
    let dist;
    
    // Get adversary list from plocs: {id, lat, lon, role}
    plocs.forEach(p => {
      if (p.role != role) {
        adversaries.push(p);
      } else if (p.id == uid) {
        you = p;
      }
    });
    
    // Check if an adversary is close to you
    adversaries.forEach(a => {
      dist = getDistance(
        {
          latitute: you.latitude, 
          longitude: you.longitude
        }, 
        {
          latitude: a.latitude, 
          longitde: a.longitude
        },
        1
      );
      if (dist < 50) {
        customAlert({title: 'Adversary close', desc: 'TODO: Have you spotted an Adversary?'});
      }
    });
  }
  
  const checkStatus = () => {
    if (status == 'Menu') {
      console.log('--> Still in menu...');
    } else if (status == 'Prep') {
      console.log('--> Preparation phase...');
    } else if (status == 'Play') {
      console.log('--> Playing game...');
      checkWinCondition();
    } else {
      console.log('--> Game has Ended...');
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
          //console.log('Players: ', players);
          updateLocations(); // update player locations
          if (documentSnapshot.data().status == 'Play' && status != 'Play') {
            customAlert({title: 'Game status info:', desc: 'Game has started, good luck!'});
          }
          setStatus(documentSnapshot.data().status); // update game status
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
    console.log("Trying to change role...");
    let new_role = 'Hunted';
    firestore().collection('Locations').doc(uid).get().then(documentSnapshot => {
      console.log("Location doc exists:", documentSnapshot.exists);
      if (documentSnapshot.exists) {
        let cur_role = documentSnapshot.data().role;
        if (cur_role == 'Hunted') {
          new_role = 'Hunter';
        }
        firestore().collection('Locations').doc(uid).update({
          'role': new_role
        }).then(() => {
          setRole(new_role);
          console.log('Role changed to:', new_role);
          customAlert({title: 'Role info:', desc: 'Changed role to: ' + new_role});
        });
      } else {
        customAlert({title: 'Role info:', desc: 'Join a game first :)'});
      }
    });
  }
  
  /* End of Databas functions */
  
  /* Map functions */
  const goToUser = () => {
    console.log("Center button pressed.");
    let user_loc = {
      latitude: location?.coords?.latitude,
      longitude: location?.coords?.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    mapRef.current.animateToRegion(user_loc, 1 * 1000);
  };
  
  /* use React.memo */
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
  
//  useEffect(() => {
//    const interval = setInterval(() => {
//      console.log('\n<Interval>');
//      postLocation();
//      updateGame();
//    }, MINUTE_MS);
//    
//    return () => clearInterval(interval);
//  }, [])
  
//  TODO: use useCallback hook
//  useEffect(() => {
//    return () => {
//      stopLocationUpdates();
//    };
//  }, []);
  
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
    
  /* Return sequence */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}> Large Scale Hide-n-Seek </Text>
        <Pressable style={styles.button} onPress={() => console.log("Settings pressed")}>
          <Image 
            source={require("./img/settings.jpg")}
            style={styles.image}
            resizeMode="contain"
          />
        </Pressable>
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
