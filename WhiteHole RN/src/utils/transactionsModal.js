import {GOOGLE_URL_API} from '@env';
import {formatEther} from 'ethers';
import React, {Component, Fragment} from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  NativeEventEmitter,
  Pressable,
  Text,
  View,
} from 'react-native';
import Crypto from 'react-native-quick-crypto';
import checkMark from '../assets/extraLogos/checkMark.png';
import GlobalStyles, {mainColor, secondaryColor} from '../styles/styles';
import {blockchains, CloudPublicKeyEncryption} from './constants';
import ContextModule from './contextModule';
import {
  epsilonRound,
  getEncryptedStorageValue,
  setupProvider,
  verifyWallet,
} from './utils';
import BaseName from '../components/baseName';

const baseTransactionsModalState = {
  stage: 0, // 0
  loading: true,
  explorerURL: '',
  gas: '0.0',
};

class TransactionsModal extends Component {
  constructor(props) {
    super(props);
    this.state = baseTransactionsModalState;
    this.provider = blockchains.map(x => setupProvider(x.rpc));
    this.EventEmitter = new NativeEventEmitter();
  }

  static contextType = ContextModule;

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

  async checkTransaction() {
    let gas = await this.provider[
      this.context.value.transactionData.chainSelected
    ].estimateGas(this.context.value.transactionData.transaction);
    let gasSavings = 0n;
    let value = 0n;
    if (this.context.value.transactionData.command === 'sendMessage') {
      value = this.context.value.transactionData.transaction.value;
    }
    if (this.context.value.savingsFlag) {
      gasSavings = await this.provider[
        this.context.value.transactionData.chainSelected
      ].estimateGas(this.context.value.transactionData.transactionSavings);
    }
    const {gasPrice} = await this.provider[
      this.context.value.transactionData.chainSelected
    ].getFeeData();
    await this.setStateAsync({
      loading: false,
      gas: formatEther((gas + gasSavings) * gasPrice + value),
    });
  }

  async processTransaction() {
    let user = '';
    if (this.context.value.transactionData.walletSelector === 0) {
      user = await getEncryptedStorageValue('user');
    }
    if (this.context.value.transactionData.walletSelector === 1) {
      user = await getEncryptedStorageValue('userSavings');
    }
    if (this.context.value.transactionData.command === 'sendMessage') {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      const raw = JSON.stringify({
        user: this.encryptData(user),
        command: 'sendMessage',
        fromChain: this.context.value.fromChain,
        toChain: this.context.value.toChain,
        data: this.context.value.transactionData.transaction.data,
        usdc: this.context.value.transactionData.amount,
        to: this.context.value.transactionData.to,
      });
      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };
      fetch(`${GOOGLE_URL_API}/sendMessage`, requestOptions)
        .then(response => response.json())
        .then(async result => {
          console.log(result);
          if (result.error === null) {
            await this.setStateAsync({
              loading: false,
              explorerURL:
                this.context.value.fromChain !== this.context.value.toChain
                  ? `https://wormholescan.io/#/tx/${result.result}`
                  : `${
                      blockchains[
                        this.context.value.transactionData.chainSelected
                      ].blockExplorer
                    }tx/${result.result}`,
            });
          }
        })
        .catch(error => console.error(error));
    } else {
      if (
        this.context.value.transactionData.walletSelector === 0 &&
        this.context.value.transactionData.withSavings
      ) {
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        const raw = JSON.stringify({
          user: this.encryptData(user),
          command: 'transfer',
          chain: this.context.value.transactionData.chainSelected,
          token: 0,
          amount: this.context.value.transactionData.savedAmount,
          destinationAddress: this.context.value.walletsSavings.eth.address,
        });
        const requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: raw,
          redirect: 'follow',
        };
        fetch(`${GOOGLE_URL_API}/createTransfers`, requestOptions)
          .then(response => response.json())
          .then(async result => console.log(result))
          .catch(error => console.error(error));
      }
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      const raw = JSON.stringify({
        user: this.encryptData(user),
        command: this.context.value.transactionData.command,
        chain: this.context.value.transactionData.chainSelected,
        token: this.context.value.transactionData.tokenSelected,
        amount: this.context.value.transactionData.amount,
        destinationAddress: this.context.value.transactionData.to,
      });
      console.log(raw);
      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };
      fetch(`${GOOGLE_URL_API}/createTransfers`, requestOptions)
        .then(response => response.json())
        .then(async result => {
          console.log(result);
          if (result.error === null) {
            await this.setStateAsync({
              loading: false,
              explorerURL: `${
                blockchains[this.context.value.transactionData.chainSelected]
                  .blockExplorer
              }tx/${result.result}`,
            });
          }
        })
        .catch(error => console.error(error));
    }
  }

  // Utils

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

  encryptData(data) {
    const encrypted = Crypto.publicEncrypt(
      {
        key: CloudPublicKeyEncryption,
      },
      Buffer.from(data, 'utf8'),
    );
    return encrypted.toString('base64');
  }

  render() {
    return (
      <Modal
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        }}
        visible={this.context.value.isTransactionActive}
        transparent={true}
        onShow={async () => {
          await this.setStateAsync(baseTransactionsModalState);
          try {
            await this.checkTransaction();
          } catch (e) {
            console.log(e);
          }
        }}
        animationType="slide">
        <View
          style={{
            height: '100%',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderWidth: 2,
            borderRadius: 25,
            borderColor: mainColor,
            backgroundColor: '#000000',
            paddingVertical: 10,
          }}>
          {this.state.stage === 0 && (
            <React.Fragment>
              <View style={{width: '100%', gap: 20, alignItems: 'center'}}>
                <Text
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 18,
                    width: '100%',
                    marginTop: 10,
                  }}>
                  Transaction:
                </Text>
                <Text
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 22,
                    width: '100%',
                    marginBottom: 10,
                  }}>
                  {this.context.value.transactionData.label}
                </Text>
                <Text
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 18,
                    width: '100%',
                    marginTop: 10,
                  }}>
                  To Address:
                </Text>
                <BaseName
                  address={this.context.value.transactionData.to}
                  provider={this.provider[0]}
                  inline={false}
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: verifyWallet(
                      this.context.value.transactionData.to,
                    )
                      ? 18
                      : 22,
                    width: '100%',
                    marginBottom: 10,
                  }}
                />
                <Text
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 18,
                    width: '100%',
                    marginTop: 10,
                  }}>
                  Amount (or Equivalent):
                </Text>
                <Text
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 20,
                    width: '100%',
                    marginBottom: 10,
                  }}>
                  {epsilonRound(this.context.value.transactionData.amount, 8)}{' '}
                  {this.context.value.transactionData.tokenSymbol}
                  {'\n ( $'}
                  {epsilonRound(
                    this.context.value.transactionData.amount *
                      this.context.value.usdConversion[
                        this.context.value.transactionData.chainSelected
                      ][this.context.value.transactionData.tokenSelected],
                    6,
                  )}
                  {' USD )'}
                </Text>

                <Text
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 18,
                    width: '100%',
                    marginTop: 10,
                  }}>
                  Gas:
                </Text>
                <Text
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 20,
                    width: '100%',
                    marginBottom: 10,
                  }}>
                  {this.state.loading ? (
                    'Calculating...'
                  ) : (
                    <Fragment>
                      {epsilonRound(this.state.gas, 8)}{' '}
                      {
                        blockchains[
                          this.context.value.transactionData.chainSelected
                        ].token
                      }
                      {'\n ( $'}
                      {epsilonRound(
                        this.state.gas *
                          this.context.value.usdConversion[
                            this.context.value.transactionData.chainSelected
                          ][
                            this.context.value.transactionData.command ===
                            'sendMessage'
                              ? 0
                              : this.context.value.transactionData.tokenSelected
                          ],
                        6,
                      )}
                      {' USD )'}
                    </Fragment>
                  )}
                </Text>

                {this.context.value.transactionData.withSavings &&
                  this.context.value.transactionData.walletSelector === 0 && (
                    <Text
                      style={{
                        textAlign: 'center',
                        color: 'white',
                        fontSize: 20,
                        width: '100%',
                        marginTop: 10,
                      }}>
                      Saved Amount:{' '}
                      {epsilonRound(
                        this.context.value.transactionData.savedAmount,
                        9,
                      )}{' '}
                      {
                        blockchains[
                          this.context.value.transactionData.chainSelected
                        ].token
                      }
                    </Text>
                  )}
              </View>
              <View style={{gap: 10, width: '100%', alignItems: 'center'}}>
                <Pressable
                  disabled={this.state.loading}
                  style={[
                    GlobalStyles.buttonStyle,
                    this.state.loading ? {opacity: 0.5} : {},
                  ]}
                  onPress={() => {
                    this.setState({
                      loading: true,
                      stage: 1,
                    });
                    this.processTransaction();
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 24,
                      fontWeight: 'bold',
                    }}>
                    Execute
                  </Text>
                </Pressable>
                <Pressable
                  style={[GlobalStyles.buttonCancelStyle]}
                  onPress={async () => {
                    this.context.setValue({
                      isTransactionActive: false,
                    });
                  }}>
                  <Text style={GlobalStyles.buttonCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </React.Fragment>
          )}
          {this.state.stage === 1 && (
            <React.Fragment>
              <Image
                source={checkMark}
                alt="check"
                style={{width: 200, height: 200}}
              />
              <Text
                style={{
                  marginTop: '20%',
                  textShadowRadius: 1,
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: this.state.loading ? mainColor : secondaryColor,
                }}>
                {this.state.loading ? 'Processing...' : 'Completed'}
              </Text>
              <View style={{gap: 10, width: '100%', alignItems: 'center'}}>
                <View
                  style={[
                    GlobalStyles.networkShow,
                    {width: Dimensions.get('screen').width * 0.9},
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <View style={{marginHorizontal: 20}}>
                      <Text style={{fontSize: 20, color: 'white'}}>
                        Transaction
                      </Text>
                      <Text style={{fontSize: 14, color: 'white'}}>
                        {this.context.value.transactionData.label}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      marginHorizontal: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <View style={{marginHorizontal: 10}}>
                      {
                        blockchains[
                          this.context.value.transactionData.chainSelected
                        ].tokens[
                          this.context.value.transactionData.tokenSelected
                        ].icon
                      }
                    </View>
                    <Text style={{color: 'white'}}>
                      {`${epsilonRound(
                        this.context.value.transactionData.amount,
                        8,
                      )}`}{' '}
                      {
                        blockchains[
                          this.context.value.transactionData.chainSelected
                        ].tokens[
                          this.context.value.transactionData.tokenSelected
                        ].symbol
                      }
                    </Text>
                  </View>
                </View>
                {this.context.value.transactionData.withSavings &&
                  this.context.value.transactionData.walletSelector === 0 && (
                    <View
                      style={[
                        GlobalStyles.networkShow,
                        {width: Dimensions.get('screen').width * 0.9},
                      ]}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                        }}>
                        <View style={{marginHorizontal: 20}}>
                          <Text style={{fontSize: 20, color: 'white'}}>
                            Transaction
                          </Text>
                          <Text style={{fontSize: 14, color: 'white'}}>
                            savingsTransfer
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          marginHorizontal: 20,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <View style={{marginHorizontal: 10}}>
                          {
                            blockchains[
                              this.context.value.transactionData.chainSelected
                            ].tokens[0].icon
                          }
                        </View>
                        <Text style={{color: 'white'}}>
                          {`${epsilonRound(
                            this.context.value.transactionData.savedAmount,
                            8,
                          )}`}{' '}
                          {
                            blockchains[
                              this.context.value.transactionData.chainSelected
                            ].tokens[0].symbol
                          }
                        </Text>
                      </View>
                    </View>
                  )}
              </View>
              <View style={{gap: 10, width: '100%', alignItems: 'center'}}>
                <Pressable
                  disabled={this.state.loading}
                  style={[
                    GlobalStyles.buttonStyle,
                    this.state.loading ? {opacity: 0.5} : {},
                  ]}
                  onPress={() => Linking.openURL(this.state.explorerURL)}>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: 'white',
                      textAlign: 'center',
                    }}>
                    View on Explorer
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    GlobalStyles.buttonStyle,
                    {
                      backgroundColor: secondaryColor,
                      borderColor: secondaryColor,
                    },
                    this.state.loading === '' ? {opacity: 0.5} : {},
                  ]}
                  onPress={async () => {
                    this.EventEmitter.emit('refresh');
                    this.context.setValue(
                      {
                        isTransactionActive: false,
                      },
                      () => this.setState(baseTransactionsModalState),
                    );
                  }}
                  disabled={this.state.loading}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 24,
                      fontWeight: 'bold',
                    }}>
                    Done
                  </Text>
                </Pressable>
              </View>
            </React.Fragment>
          )}
        </View>
      </Modal>
    );
  }
}

export default TransactionsModal;
