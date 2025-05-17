import {Text, View} from 'react-native';
import React, {Component} from 'react';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import emv from 'node-emv';
import IconFAB from 'react-native-vector-icons/FontAwesome6';
import GlobalStyles from '../../../styles/styles';
import { getAID } from './cardUtils';

export default class ReadCard extends Component {
  constructor(props) {
    super(props);
  }
  readVisaCreditCard = async () => {
    console.log('reading Visa credit card...');
    try {
      NfcManager.cancelTechnologyRequest();
    } catch (error) {
      console.warn(error);
    }

    try {
      
      await NfcManager.requestTechnology([NfcTech.IsoDep]);
      let command = '00A404000E325041592E5359532E444446303100';
      let resp = await NfcManager.isoDepHandler.transceive(
        this.toByteArray(command),
      );
      let response = await getAID(this.toHexString(resp));
      command = `00A40400${response.prefix}${response.AID}00`;
      resp = await NfcManager.isoDepHandler.transceive(
        this.toByteArray(command),
      );
      console.log(this.toHexString(resp));
    } catch (error) {
      console.warn('Error:', error);
      return null;
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  };

  getEmvInfo = info => {
    return new Promise(resolve => {
      emv.describe(info, data => {
        if (data) {
          resolve(data);
        } else {
          resolve(null);
        }
      });
    });
  };

  toByteArray = text => {
    return text.match(/.{1,2}/g).map(value => parseInt(value, 16));
  };

  toHexString = byteArr => {
    return byteArr.reduce((acc, byte) => {
      return acc + ('00' + byte.toString(16).toUpperCase()).slice(-2);
    }, '');
  };

  getCardInfoVisa = responses => {
    let res;
    let end = false;
    for (let i = 0; i < responses.length; i++) {
      const r = responses[i];
      if (r.tag === '77' && r.value && r.value.length > 0) {
        for (let j = 0; j < r.value.length; j++) {
          const e = r.value[j];
          if (e.tag === '57' && e.value) {
            const parts = e.value.split('D');
            if (parts.length > 1) {
              res = {
                card: parts[0],
                exp: parts[1].substring(0, 4),
              };
              end = true;
            }
          }

          if (end) {
            break;
          }
        }

        if (end) {
          break;
        }
      }
    }
    return res;
  };

  async componentDidMount() {
    const cardInfo = await this.readVisaCreditCard();
    this.props.cardInfo(cardInfo);
  }

  componentWillUnmount() {
    NfcManager.cancelTechnologyRequest();
  }

  render() {
    return (
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <IconFAB name="nfc-symbol" size={240} color="white" />
        <Text style={GlobalStyles.title}>Tap the NFC reader</Text>
      </View>
    );
  }
}
