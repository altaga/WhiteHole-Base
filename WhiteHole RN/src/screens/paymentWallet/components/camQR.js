import React, {Component} from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import {isValidUUID} from '../../../utils/utils';

export default class CamQR extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scanning: true,
      permission: false,
    };
    this.scanning = true;
  }

  async componentDidMount() {
    this.scanning = true;
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

  render() {
    return (
      <React.Fragment>
        {this.state.permission && (
          <Camera
            style={{height: '100%', width: '100%'}}
            scanBarcode={this.state.scanning}
            onReadCode={event => {
              let temp = event.nativeEvent.codeStringValue;
              if (isValidUUID(temp) && this.scanning) {
                this.scanning = false;
                this.setState(
                  {
                    scanning: false,
                  },
                  () => {
                    this.props.callbackAddress(temp);
                  },
                );
              }
            }}
            showFrame={false}
            cameraType={CameraType.Back}
          />
        )}
      </React.Fragment>
    );
  }
}
