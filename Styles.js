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
    flex: 20,
    
  },
  text: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
  },
  Proximity: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: 'black',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
    flex: 8,
  },
  header: {
    fontSize: 20,
    flexDirection: 'row',
    backgroundColor: 'linen',
    fontWeight: 'bold',
    color: 'black',
    width: Dimensions.get('window').width,
    flex: 1,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 0,
  },
  buttons: {
    flex: 4,
    flexDirection: 'row',
    //flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 6,
    backgroundColor: 'linen',
  },
  image: {
    flex: 1,
  },
  settings: {
    flex: 1,
    flexBasis: 0,
    borderWidth: 0,
    borderColor: "grey",
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
    paddingHorizontal: 1,
    elevation: 6,
    backgroundColor: 'linen',
  }
});
