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
    justifyContent: "flex-end",
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    //width: Dimensions.get('window').width,
    //height: Dimensions.get('window').height,
  },
  text: {
    alignItems: 'center',
    fontSize: 20,
    backgroundColor: 'lightblue',
  },
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
    console.log(location);
    let user_loc = {
      latitude: location?.coords?.latitude,
      longitude: location?.coords?.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    mapRef.current.animateToRegion(user_loc, 1 * 1000);
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
  
  /* End of location functions */
  
  // Return sequence
  return (
    <View style={styles.container}>
      <MapView
        coords={location?.coords || null}
        ref={mapRef}
        style = {styles.map}
        initialRegion = {region}
        onRegionChangeComplete={(region) => setRegion(region)}
      >
        <Marker
          {/* TODO: set marker to user location and make function*/}
          coordinate={region}
          pinColor="green"
          //image={require("./shrek-head.png")}
        />
      </MapView>
      <Text style={styles.text}> Current latitude: {region.latitude} </Text>
      <Text style={styles.text}> Current longitude: {region.longitude} </Text>
      <Button onPress={() => goToUser()} title="Center" />
      <Button title="Get Location" onPress={getLocation} />
    </View>
    
    //GetLocation()
  );
}

export default App;
