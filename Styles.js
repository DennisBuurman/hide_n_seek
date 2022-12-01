import {
    StyleSheet,
    Dimensions,
} from 'react-native';

export default styles = StyleSheet.create({
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
