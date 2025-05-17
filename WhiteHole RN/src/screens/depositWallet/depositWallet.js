import Clipboard from '@react-native-clipboard/clipboard';
import React, {Component} from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import * as Progress from 'react-native-progress';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import Header from '../../components/header';
import GlobalStyles, {mainColor, ratio} from '../../styles/styles';
import {blockchains} from '../../utils/constants';
import ContextModule from '../../utils/contextModule';
import BaseName from '../../components/baseName';

class DepositWallet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      component: null,
      chainSelected: {
        label: blockchains[0].network,
        value: blockchains[0].apiname,
      },
    };
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.setupQR();
  }

  setupQR() {
    setInterval(() => {
      if (this.state.progress < 1) {
        this.setState({
          progress: this.state.progress + 0.05,
        });
      }
    }, 1);
    setTimeout(() => {
      const QrAddress = require('./components/qrAddress').default;
      this.setState({
        component: (
          <QrAddress
            address={
              this.context.value.wallets[this.state.chainSelected.value].address
            }
          />
        ),
      });
    }, 1000);
  }

  render() {
    return (
      <SafeAreaView style={[GlobalStyles.container]}>
        <Header />
        <View style={[GlobalStyles.main]}>
          <View style={{alignItems: 'center'}}>
            <Text style={GlobalStyles.formTitleCard}>Select Network</Text>
            <RNPickerSelect
              style={{
                inputAndroidContainer: {
                  textAlign: 'center',
                },
                inputAndroid: {
                  textAlign: 'center',
                  color: 'gray',
                },
                viewContainer: {
                  ...GlobalStyles.input,
                  width: Dimensions.get('screen').width * 0.9,
                },
              }}
              value={this.state.chainSelected.value}
              items={blockchains.map(item => ({
                label: item.network,
                value: item.apiname,
              }))}
              onValueChange={network => {
                if (this.state.chainSelected.value === network) return;
                const index = blockchains.findIndex(
                  item => item.apiname === network,
                );
                this.setState(
                  {
                    chainSelected: {
                      label: blockchains[index].network,
                      value: network,
                    },
                    component: null,
                    progress: 0,
                  },
                  () => {
                    this.setupQR();
                  },
                );
              }}
            />
          </View>
          {this.state.component === null ? (
            <View
              style={{
                aspectRatio: 1,
                width:
                  Dimensions.get('screen').width * (ratio > 1.7 ? 0.8 : 0.5),
                margin: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Progress.Pie
                progress={this.state.progress}
                size={180}
                color={mainColor}
              />
              <Text style={{color: 'white', fontSize: 16}}>
                Loading {Math.floor(this.state.progress * 100)}%
              </Text>
            </View>
          ) : (
            this.state.component
          )}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <BaseName
              address={
                this.context.value.wallets[this.state.chainSelected.value]
                  .address
              }
              inline={false}
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                width: '85%',
              }}
            />
            <Pressable
              onPress={() => {
                Clipboard.setString(
                  this.context.value.wallets[this.state.chainSelected].address,
                );
                ToastAndroid.show(
                  'Address copied to clipboard',
                  ToastAndroid.LONG,
                );
              }}
              style={{
                width: '15%',
                alignItems: 'flex-start',
              }}>
              <IconIonicons name="copy" size={30} color={'white'} />
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              width: '100%',
            }}>
            <Pressable
              style={[GlobalStyles.buttonStyle]}
              onPress={() => this.props.navigation.goBack()}>
              <Text style={[GlobalStyles.buttonText]}>Return</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

export default DepositWallet;
