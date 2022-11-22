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

import React, { useState, useRef, component } from "react";
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    Button,
} from 'react-native';

import MapView from 'react-native-maps';
import {
    Marker,
} from 'react-native-maps';

import Geolocation, {GeoPosition} from 'react-native-geolocation-service';

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
    const [region, setRegion] = useState({
        latitude: 51.5079145,
        longitude: -0.0899163,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    const tokyoRegion = {
        latitude: 35.6762,
        longitude: 139.6503,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    const mapRef = useRef(null);

    const goToTokyo = () => {
        mapRef.current.animateToRegion(tokyoRegion, 1 * 1000);
    };

    return (
      /*
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style = {styles.map}
                initialRegion = {tokyoRegion}
                onRegionChangeComplete={(region) => setRegion(region)}
            >
                <Marker
                    coordinate={tokyoRegion}
                    pinColor="green"
                    //image={require("./shrek-head.png")}
                />
            </MapView>
            <Text style={styles.text}> Current latitude: {region.latitude} </Text>
            <Text style={styles.text}> Current longitude: {region.longitude} </Text>
            <Button onPress={() => goToTokyo()} title="Center" />
        </View>
      */
      GetLocation()
    );
}

export default App;
