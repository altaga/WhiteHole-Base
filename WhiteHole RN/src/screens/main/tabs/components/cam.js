import React, {Component} from 'react';
import {Alert, Image, PermissionsAndroid, Platform} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';

class Cam extends Component {
  constructor(props) {
    super(props);
    this.state = {
      take: false,
      permission: false,
    };
    this.camera;
  }

  async componentDidMount() {
    if (Platform.OS === 'android') {
      const checkCam = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (!checkCam) {
        PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]).then(result => {
          if (result['android.permission.CAMERA'] === 'granted') {
            this.setState({
              permission: true,
            });
          } else {
            Alert.alert(
              'Permissions denied!',
              'You need to give permissions to camera',
            );
          }
        });
      } else {
        this.setState({
          permission: true,
        });
      }
    }
  }

  async takePicture() {
    const {uri} = await this.camera.capture();
    const res = await Image.getSize(uri);
    const ratio = res.width / res.height;
    const heightD = 512;
    const widthD = Math.round(heightD * ratio);
    const resizedImage = await ImageResizer.createResizedImage(
      uri, // image uri
      widthD, // new width
      heightD, // new height
      'JPEG', // format
      100, // quality (0-100)
    );
    const base64 = await RNFS.readFile(resizedImage.uri, 'base64');
    this.props.onImage(base64);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.take !== this.props.take && this.props.take) {
      this.takePicture();
    }
  }

  render() {
    return (
      <React.Fragment>
        {this.state.permission && (
          <React.Fragment>
            <Camera
              ref={ref => (this.camera = ref)}
              cameraType={CameraType.Front}
              style={{height: '100%', width: '100%'}}
              showFrame={false}
            />
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

export default Cam;
