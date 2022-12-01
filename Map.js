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

import MapView from 'react-native-maps';
import {
    Marker,
} from 'react-native-maps';
import Geolocation, {GeoPosition} from 'react-native-geolocation-service';
import VIForegroundService from '@voximplant/react-native-foreground-service';

export function GameMap() {
//  const [forceLocation, setForceLocation] = useState(true);
//  const [highAccuracy, setHighAccuracy] = useState(true);
//  const [locationDialog, setLocationDialog] = useState(true);
//  const [significantChanges, setSignificantChanges] = useState(false);
//  const [observing, setObserving] = useState(false);
//  const [foregroundService, setForegroundService] = useState(false);
//  const [useLocationManager, setUseLocationManager] = useState(false);
  const [location, setLocation] = useState<GeoPosition | null>(null);
//  const watchId = useRef<number | null>(null);
//  const [region, setRegion] = useState({
//    latitude: 51,
//    longitude: -0.09,
//    latitudeDelta: 0.01,
//    longitudeDelta: 0.01,
//  });
//  const mapRef = useRef(null);
  
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
    
    var markers = locations.map(loc => {
      return(
        <Marker
          key={loc.id}
          coordinate={ 
            {
              latitude: loc.latitude,
              longitude: loc.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            }
          }
          pinColor="red"
          title="Adversary"
          description="Last known location of Hunter {id}"
        >
          <Image 
            source={require("./img/adversary.png")}
            style={{width: 45, height: 45}}
            resizeMode="contain"
          />
        </Marker>
      );
    });
    
    markers.push(
      <Marker
        key={uid || region}
        coordinate={user_loc || region}
        pinColor="blue"
        title="You"
        description="Your last known location"
      >
        <Image 
          source={require("./img/player.png")}
          style={{width: 45, height: 45}}
          resizeMode="contain"
        />
      </Marker>
    );
    
    console.log('Markers:', markers);
    
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
        console.log("Manual: ", position);
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
        console.log("Watcher:", position);
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
  
  useEffect(() => {
    return () => {
      stopLocationUpdates();
    };
  }, []);
  
  /* End of location functions */
  
  let locations = [
    {
      id: 2,
      latitude: 52.1705,
      longitude: 4.4556,
    },
    {
      id: 1,
      latitude: 52.1691,
      longitude: 4.4576,
    },
  ]
  
  return (
    <View>
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
  );
}
