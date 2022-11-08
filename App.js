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

import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react_native';

const styles = StyleSheet.create({
  center: {
    alignItems: 'center'
  }
})

const Greeting = (props) => {
    return (
        <View>
            <Text>Hello {props.name}!</Text>
        </View>
    );
}

const App = () => {
    return (
        <View style={styles.center}>
            <Greeting name="Multi-Media Systems"/>
        </View>
    );
}

export default App;
