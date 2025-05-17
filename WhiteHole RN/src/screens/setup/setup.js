import { GOOGLE_URL_API } from '@env';
import React, { Component, Fragment } from 'react';
import { Dimensions, Image, Pressable, Text, View } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import Crypto from 'react-native-quick-crypto';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Entypo';
import VirtualKeyboard from 'react-native-virtual-keyboard';
import logo from '../../assets/logoSplash.png';
import GlobalStyles, { ratio, secondaryColor } from '../../styles/styles';
import { baseWallets, CloudPublicKeyEncryption } from '../../utils/constants';
import {
  checkBiometrics,
  getAsyncStorageValue,
  setAsyncStorageValue,
  setEncryptedStorageValue,
} from '../../utils/utils';

const baseSetupState = {
  // Stage and Control
  stage: 0,
  loading: false,
  mnemonic:
    'no mnemonic needed recovery is automatic your wallet is safe and secure',
  // Basic Data
  user: "",
  wallets: baseWallets,
  // Utils
  pin: '',
  biometrics: false,
  clear: false,
};

export default class Setup extends Component {
  constructor(props) {
    super(props);
    this.state = baseSetupState;
    this.biometrics = new ReactNativeBiometrics();
  }

  async componentDidMount() {
    this.props.navigation.addListener('focus', async () => {
      console.log(this.props.route.name);
      const flag = await getAsyncStorageValue('biometricsAvailable');
      if (flag === null) {
        const biometricsAvailable = (await this.biometrics.isSensorAvailable())
          .available;
        await setAsyncStorageValue({biometricsAvailable});
        this.setState({
          biometrics: biometricsAvailable,
        });
      } else {
        this.setState({
          biometrics: flag,
        });
      }
    });
    this.props.navigation.addListener('blur', async () => {});
  }

  createWallet() {
    this.setState({
      loading: true,
    });
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const raw = JSON.stringify({
      kind: this.encryptData('account'),
    });
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };
    fetch(`${GOOGLE_URL_API}/createWallets`, requestOptions)
      .then(response => response.json())
      .then(result => {
        const {user, wallets} = result;
        this.setState({
          user,
          wallets,
          loading: false,
          stage: 1,
        });
      })
      .catch(() => {
        this.setState({
          loading: false,
        });
      });
  }

  async completeSetup() {
    await this.setStateAsync({
      loading: true,
    });
    await setEncryptedStorageValue({
      user: this.state.user,
    });
    await setAsyncStorageValue({
      wallets: this.state.wallets,
    });
    await this.setStateAsync({
      stage: 2,
      loading: false,
    });
  }

  async changeText(val) {
    if (val.length <= 4) {
      this.setState({
        pin: val,
      });
    } else {
      await this.resetKeyboard();
    }
  }

  encryptData(data) {
    const encrypted = Crypto.publicEncrypt(
      {
        key: CloudPublicKeyEncryption,
      },
      Buffer.from(data, 'utf8'),
    );
    return encrypted.toString('base64');
  }

  resetKeyboard() {
    return new Promise((resolve, reject) => {
      this.setState(
        {
          clear: true,
        },
        () =>
          this.setState(
            {
              clear: false,
              pin: '',
            },
            () => resolve('ok'),
          ),
      );
    });
  }

  async setBiometrics(check = true) {
    this.setState({
      loading: true,
    });
    const flag = check ? await checkBiometrics() : false;
    await setEncryptedStorageValue({biometrics: flag});
    this.setState({
      stage: 4,
      loading: false,
    });
  }

  async setPin() {
    await this.setStateAsync({
      loading: true,
    });
    await setEncryptedStorageValue({pin: this.state.pin});
    await this.setStateAsync({
      stage: this.state.biometrics ? 3 : 4,
      loading: false,
    });
  }

  // Component Utils
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
    const size = Dimensions.get('window').width * (ratio > 1.7 ? 0.8 : 0.6);
    return (
      <SafeAreaView style={[GlobalStyles.container, {paddingVertical: 20}]}>
        {this.state.stage === 0 && (
          <Fragment>
            <Image
              source={logo}
              alt="Cat"
              style={{
                width: size,
                height: size,
              }}
            />
            <Text
              style={{
                fontSize: 28,
                textAlign: 'center',
                marginHorizontal: 40,
                color: 'white',
                fontFamily: 'DMSans-Medium',
              }}>
              Secure and effortless wallet, featuring optimized savings and seamless
              card payments.
            </Text>
            <View style={GlobalStyles.buttonContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {[...Array(this.state.biometrics ? 5 : 4).keys()].map(
                  (_, index) => (
                    <Text
                      key={'dot:' + index}
                      style={{
                        color: this.state.stage >= index ? 'white' : '#a3a3a3',
                        marginHorizontal: 20,
                        fontSize: 38,
                      }}>
                      {this.state.stage >= index ? '•' : '·'}
                    </Text>
                  ),
                )}
              </View>
              <Pressable
                disabled={this.state.loading}
                style={[
                  GlobalStyles.buttonStyle,
                  this.state.loading ? {opacity: 0.5} : {},
                ]}
                onPress={() => this.createWallet()}>
                <Text
                  style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                  Create Wallet
                </Text>
              </Pressable>
            </View>
          </Fragment>
        )}
        {this.state.stage === 1 && (
          <Fragment>
            <Text style={GlobalStyles.title}>Secret{'\n'}Recovery Phrase</Text>
            <View style={{width: '94%'}}>
              <Text style={GlobalStyles.description}>
                No mnemonic needed, we've got it covered! Powered by Circle.
              </Text>
            </View>
            <View
              style={{
                flexWrap: 'wrap',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'stretch',
              }}>
              {this.state.mnemonic.split(' ').map((item, index) => (
                <React.Fragment key={'seed:' + index}>
                  <View
                    style={{
                      backgroundColor: 'black',
                      width: Dimensions.get('screen').width * 0.3,
                      marginVertical: 10,
                      alignItems: 'flex-start',
                      borderRadius: 10,
                      borderColor: 'white',
                      borderWidth: 0.5,
                    }}>
                    <Text style={{margin: 10, fontSize: 15, color: 'white'}}>
                      {`${index + 1} | `}
                      {item}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
            <View style={GlobalStyles.buttonContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {[...Array(this.state.biometrics ? 5 : 4).keys()].map(
                  (_, index) => (
                    <Text
                      key={'dot:' + index}
                      style={{
                        color: this.state.stage >= index ? 'white' : '#a3a3a3',
                        marginHorizontal: 20,
                        fontSize: 38,
                      }}>
                      {this.state.stage >= index ? '•' : '·'}
                    </Text>
                  ),
                )}
              </View>
              <Pressable
                disabled={this.state.loading}
                style={[GlobalStyles.buttonStyle]}
                onPress={() => this.completeSetup()}>
                <Text style={GlobalStyles.buttonText}>Continue</Text>
              </Pressable>
              <Pressable
                disabled={this.state.loading}
                style={[GlobalStyles.buttonCancelStyle]}
                onPress={async () => {
                  this.setState(baseSetupState);
                }}>
                <Text style={GlobalStyles.buttonCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Fragment>
        )}
        {this.state.stage === 2 && (
          <Fragment>
            <Text style={GlobalStyles.title}>Protect with a PIN</Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                paddingTop: '10%',
              }}>
              <Text
                style={{
                  color: 'white',
                  width: Dimensions.get('window').width * 0.2,
                  textAlign: 'center',
                  fontSize: 24,
                }}>
                {this.state.pin.substring(0, 1) !== ''
                  ? this.state.pin.substring(0, 1)
                  : '•'}
              </Text>
              <Text
                style={{
                  color: 'white',
                  width: Dimensions.get('window').width * 0.2,
                  textAlign: 'center',
                  fontSize: 24,
                }}>
                {this.state.pin.substring(1, 2) !== ''
                  ? this.state.pin.substring(1, 2)
                  : '•'}
              </Text>
              <Text
                style={{
                  color: 'white',
                  width: Dimensions.get('window').width * 0.2,
                  textAlign: 'center',
                  fontSize: 24,
                }}>
                {this.state.pin.substring(2, 3) !== ''
                  ? this.state.pin.substring(2, 3)
                  : '•'}
              </Text>
              <Text
                style={{
                  color: 'white',
                  width: Dimensions.get('window').width * 0.2,
                  textAlign: 'center',
                  fontSize: 24,
                }}>
                {this.state.pin.substring(3, 4) !== ''
                  ? this.state.pin.substring(3, 4)
                  : '•'}
              </Text>
            </View>
            <VirtualKeyboard
              rowStyle={{
                width: Dimensions.get('window').width,
              }}
              cellStyle={{
                height:
                  Dimensions.get('window').height / (ratio > 1.7 ? 10 : 14),
                borderWidth: 0,
                margin: 1,
              }}
              colorBack={'black'}
              color="white"
              pressMode="string"
              onPress={val => this.changeText(val)}
              clear={this.state.clear}
            />

            <View style={GlobalStyles.buttonContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {[...Array(this.state.biometrics ? 5 : 4).keys()].map(
                  (_, index) => (
                    <Text
                      key={'dot:' + index}
                      style={{
                        color: this.state.stage >= index ? 'white' : '#a3a3a3',
                        marginHorizontal: 20,
                        fontSize: 38,
                      }}>
                      {this.state.stage >= index ? '•' : '·'}
                    </Text>
                  ),
                )}
              </View>
              <Pressable
                disabled={this.state.loading || this.state.pin.length !== 4}
                style={[
                  GlobalStyles.buttonStyle,
                  this.state.loading || this.state.pin.length !== 4
                    ? {opacity: 0.5}
                    : {},
                ]}
                onPress={() => this.setPin()}>
                <Text style={GlobalStyles.buttonText}>Set Pin</Text>
              </Pressable>
              <Pressable
                disabled={this.state.loading}
                style={[GlobalStyles.buttonCancelStyle]}
                onPress={async () => {
                  this.setState(baseSetupState);
                }}>
                <Text style={GlobalStyles.buttonCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Fragment>
        )}
        {this.state.stage === 3 && (
          <Fragment>
            <Text style={GlobalStyles.title}>Protect with Biometrics</Text>
            <Icon name="fingerprint" size={150} color={'white'} />
            <View style={GlobalStyles.buttonContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {[...Array(this.state.biometrics ? 5 : 4).keys()].map(
                  (_, index) => (
                    <Text
                      key={'dot:' + index}
                      style={{
                        color: this.state.stage >= index ? 'white' : '#a3a3a3',
                        marginHorizontal: 20,
                        fontSize: 38,
                      }}>
                      {this.state.stage >= index ? '•' : '·'}
                    </Text>
                  ),
                )}
              </View>
              <Pressable
                disabled={this.state.loading}
                style={[
                  GlobalStyles.buttonStyle,
                  this.state.loading ? {opacity: 0.5} : {},
                ]}
                onPress={() => this.setBiometrics()}>
                <Text style={GlobalStyles.buttonText}>Set Biometrics</Text>
              </Pressable>
              <Pressable
                disabled={this.state.loading}
                style={[
                  GlobalStyles.buttonStyle,
                  {
                    backgroundColor: secondaryColor,
                    borderColor: secondaryColor,
                  },
                  this.state.loading ? {opacity: 0.5} : {},
                ]}
                onPress={async () => {
                  this.setState({
                    loading: true,
                  });
                  await this.setBiometrics(false);
                  this.setState({
                    stage: 4,
                    loading: false,
                  });
                }}>
                <Text style={GlobalStyles.buttonText}>Skip</Text>
              </Pressable>
              <Pressable
                disabled={this.state.loading}
                style={[GlobalStyles.buttonCancelStyle]}
                onPress={async () => {
                  this.setState(baseSetupState);
                }}>
                <Text style={GlobalStyles.buttonCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Fragment>
        )}
        {this.state.stage === 4 && (
          <Fragment>
            <Image
              source={logo}
              alt="Cat"
              style={{
                width: size,
                height: size,
              }}
            />
            <Text style={[GlobalStyles.title, {marginVertical: 20}]}>
              All Done!
            </Text>
            <Text style={[GlobalStyles.description, {margin: 40}]}>
              Start your decentralized economy.
            </Text>
            <View style={GlobalStyles.buttonContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {[...Array(this.state.biometrics ? 5 : 4)].map(
                  (item, index) => (
                    <Text
                      key={'dot:' + index}
                      style={{
                        color: this.state.stage >= index ? 'white' : '#a3a3a3',
                        marginHorizontal: 20,
                        fontSize: 38,
                      }}>
                      {this.state.stage >= index ? '•' : '·'}
                    </Text>
                  ),
                )}
              </View>
              <Pressable
                style={[GlobalStyles.buttonStyle]}
                onPress={async () => {
                  this.props.navigation.navigate('SplashLoading');
                }}>
                <Text
                  style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                  Finish
                </Text>
              </Pressable>
            </View>
          </Fragment>
        )}
      </SafeAreaView>
    );
  }
}
