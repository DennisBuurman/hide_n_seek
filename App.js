/**
 * Large scale hide_n_seek app
 * https://github.com/DennisBuurman/hide_n_seek
 *
 * Authors: George Boukouvalas, Dennis Buurman
 * Organization: LIACS @ Leiden University
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
 *
 */

/*************************************************/

import React, { useState, useRef, component, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    Button,
    Alert,
    PermissionsAndroid,
    Platform,
    Image,
    Pressable,
} from 'react-native';

import MapView from 'react-native-maps';
import {
    Marker,
} from 'react-native-maps';

import Geolocation, {GeoPosition} from 'react-native-geolocation-service';
import VIForegroundService from '@voximplant/react-native-foreground-service';

import GetLocation from './GetLocation.js';

/*************************************************/

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: "flex-start",
  },
  map: {
    //...StyleSheet.absoluteFillObject,
    width: Dimensions.get('window').width,
    //height: Dimensions.get('window').height,
    flex: 18,
    
  },
  text: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    flex: 8,
  },
  header: {
    fontSize: 20,
    flexDirection: 'row',
    backgroundColor: 'lavender',
    fontWeight: 'bold',
    color: 'black',
    width: Dimensions.get('window').width,
    flex: 1,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: "thistle",
    borderRadius: 0,
  },
  buttons: {
    flex: 3,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: "thistle",
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
    paddingHorizontal: 1,
    elevation: 3,
    backgroundColor: 'lavender',
  },
  image: {
    flex: 1,
  }
});

/*************************************************/

const App = () => {
  // Variables, states, etc. here
  
  /* Location variables */
  const [forceLocation, setForceLocation] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);
  const [locationDialog, setLocationDialog] = useState(true);
  const [significantChanges, setSignificantChanges] = useState(false);
  const [observing, setObserving] = useState(false);
  const [foregroundService, setForegroundService] = useState(false);
  const [useLocationManager, setUseLocationManager] = useState(false);
  const [location, setLocation] = useState<GeoPosition | null>(null);
  
  const watchId = useRef<number | null>(null);
  /* End of location variables */
  
  const [region, setRegion] = useState({
    latitude: 51,
    longitude: -0.09,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  // Local functions
  const mapRef = useRef(null);
  
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
  
  const PlaceMarkers = ({locations}) => {
    
    let user_loc = {
      latitude: 51,
      longitude: -0.09,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    };
    
    if (location) {
      user_loc.latitude = location.coords.latitude;
      user_loc.longitude = location.coords.longitude;
    }
    
    var markers = Object.keys(locations).map(function(key) {
      return(
        <Marker 
          coordinate={ 
            {
              latitude: locations[key].latitude,
              longitude: locations[key].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            }
          }
          pinColor="red"
          title="Adversary"
          description="Last known location of Hunter {id}"
        >
          <Image 
            source={require("./adversary.png")}
            style={{width: 45, height: 45}}
            resizeMode="contain"
          />
        </Marker>
      );
    });
    
    markers.push(
      <Marker
        coordinate={user_loc || region}
        pinColor="blue"
        title="You"
        description="Your last known location"
      >
        <Image 
          source={require("./player.png")}
          style={{width: 45, height: 45}}
          resizeMode="contain"
        />
      </Marker>
    );
    
    console.log('Markers:');
    console.log(markers);
    
    return (
      markers
    );
  };
  
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
        console.log("Manual:");
        console.log(position);
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
        console.log("Watcher:");
        console.log(position);
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
  
  useEffect(() => {
    return () => {
      stopLocationUpdates();
    };
  }, []);
  
  /* End of location functions */
  
  let locations = [
    {
      latitude: 52.1705,
      longitude: 4.4556,
    },
    {
      latitude: 52.1691,
      longitude: 4.4576,
    },
  ]
  
  // Return sequence
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}> Large Scale Hide-n-Seek </Text>
        <Pressable style={styles.button} onPress={() => console.log("Settings pressed")}>
          <Image 
            source={require("./settings.jpg")}
            style={styles.image}
            resizeMode="contain"
          />
        </Pressable>
      </View>
      <MapView
        coords={location?.coords || null}
        ref={mapRef}
        style={styles.map}
        initialRegion = {region}
        onRegionChangeComplete={(region) => setRegion(region)}
      >
        <PlaceMarkers locations={locations}/>
      </MapView>
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={() => goToUser()}>
          <Text style={styles.text}>Center</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={getLocationUpdates}>
          <Text style={styles.text}>Observe Location</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={stopLocationUpdates}>
          <Text style={styles.text}>Stop Observing</Text>
        </Pressable>
      </View>
    </View>
    
    //GetLocation()
  );
}

export default App;
