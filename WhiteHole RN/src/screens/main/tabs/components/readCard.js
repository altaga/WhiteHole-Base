import {Text, View, ToastAndroid} from 'react-native';
import React, {Component} from 'react';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import emv from 'node-emv';
import IconFAB from 'react-native-vector-icons/FontAwesome6';
import GlobalStyles from '../../../styles/styles';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class ReadCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      red: false,
      reading: false,
    };
    this.interval = null;
  }
  readVisaCreditCard = async () => {
    return new Promise(async resolve => {
      console.log('reading Visa credit card...');
      try {
        // cancel any previous requests
        await NfcManager.cancelTechnologyRequest();
      } catch (error) {
        // do nothing
      }
      try {
        const commands = [
          '00A404000E325041592E5359532E444446303100',
          '00A4040007A000000003101000',
          '80A80000238321F620C00000000000000100000000000007240000000000097823112300194E172C00',
          '80A800002383212800000000000000000000000000000002500000000000097820052600E8DA935200',
          '80CA9F1700',
          '80CA9F3600',
        ];

        await NfcManager.requestTechnology([NfcTech.IsoDep]);

        const responses = [];

        for (let i = 0; i < commands.length; i++) {
          const resp = await NfcManager.isoDepHandler.transceive(
            this.toByteArray(commands[i]),
          );
          responses.push(resp);
        }

        if (responses && responses.length > 2) {
          const r = await this.getEmvInfo(this.toHexString(responses[2]));
          if (r) {
            const cardInfo = this.getCardInfoVisa(r);
            if (cardInfo) {
              resolve({
                card: cardInfo.card,
                exp: cardInfo.exp,
              });
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      } catch (error) {
        resolve(null);
      }
    });
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
    return text.match(/.{1,2}/g).map(b => {
      return parseInt(b, 16);
    });
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
    this.interval = setInterval(async () => {
      if(this.state.reading) {
        console.log('Reading...');
        return;
      };
      this.setStateAsync({reading: true}); 
      const cardInfo = await this.readVisaCreditCard();
      if (cardInfo !== null) {
        this.setState({red: true});
        this.props.cardInfo(cardInfo);
        clearInterval(this.interval);
        this.interval = null;
      } else {
        console.log('No card found');
        ToastAndroid.show('Read again', ToastAndroid.SHORT);
        await this.setStateAsync({reading: false});
      }
    }, 1000);
  }

  async componentWillUnmount() {
    this.interval && clearInterval(this.interval);
  }

  async setStateAsync(value) {
    return new Promise(resolve => {
      this.setState(
        {
          ...value,
        },
        () => resolve(),
      );
    });
  }

  render() {
    return (
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <IconFAB
          name="nfc-symbol"
          size={240}
          color={this.state.red ? 'white' : 'gray'}
        />
        <Text style={GlobalStyles.title}>Tap the NFC reader</Text>
      </View>
    );
  }
}
