import {
  AI_URL_API,
  AI_URL_API_KEY,
  PAYMENT_URL_API,
  GOOGLE_URL_API,
} from '@env';
import {
  formatUnits,
  Interface,
  parseEther,
  parseUnits,
  randomBytes,
  uuidV4,
} from 'ethers';
import React, {Component, Fragment} from 'react';
import {
  Dimensions,
  Keyboard,
  NativeEventEmitter,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNPickerSelect from 'react-native-picker-select';
import QRCodeStyled from 'react-native-qrcode-styled';
import {abiBatchTokenBalances} from '../../../contracts/batchTokenBalances';
import GlobalStyles, {mainColor, secondaryColor} from '../../../styles/styles';
import {
  blockchains,
  CloudPublicKeyEncryption,
  refreshTime,
} from '../../../utils/constants';
import ContextModule from '../../../utils/contextModule';
import {
  arraySum,
  epsilonRound,
  getAsyncStorageValue,
  getEncryptedStorageValue,
  setAsyncStorageValue,
  setChains,
  setEncryptedStorageValue,
  setTokens,
  setupProvider,
} from '../../../utils/utils';
import Cam from './components/cam';
import Crypto from 'react-native-quick-crypto';
import {Contract} from 'ethers';
import { abiERC20 } from '../../../contracts/erc20';

const baseTab5State = {
  // Transaction settings
  amount: '',
  chainSelected: setChains(blockchains)[0], // ""
  tokenSelected: setTokens(blockchains[0].tokens)[0], // ""
  loading: false,
  take: false,
  keyboardHeight: 0,
  selector: 0,
  qrData: '',
};

export default class Tab5 extends Component {
  constructor(props) {
    super(props);
    this.state = baseTab5State;
    this.provider = blockchains.map(x => setupProvider(x.rpc));
    this.EventEmitter = new NativeEventEmitter();
  }

  static contextType = ContextModule;

  async getLastRefreshDID() {
    try {
      const lastRefreshDID = await getAsyncStorageValue('lastRefreshDID');
      if (lastRefreshDID === null) throw 'Set First Date';
      return lastRefreshDID;
    } catch (err) {
      await setAsyncStorageValue({lastRefreshDID: 0});
      return 0;
    }
  }

  async componentDidMount() {
    // Public Key
    const publicKeyDID = this.context.value.walletsDID.eth.address;
    console.log(publicKeyDID);
    if (publicKeyDID !== '') {
      // Event Emitter
      this.EventEmitter.addListener('refresh', async () => {
        Keyboard.dismiss();
        await this.setStateAsync(baseTab5State);
        await setAsyncStorageValue({lastRefreshDID: Date.now()});
        this.refresh();
      });
      // Get Last Refresh
      const lastRefresh = await this.getLastRefreshDID();
      if (Date.now() - lastRefresh >= refreshTime) {
        console.log('Refreshing...');
        await setAsyncStorageValue({lastRefreshDID: Date.now()});
        this.refresh();
      } else {
        console.log(
          `Next refresh Available: ${Math.round(
            (refreshTime - (Date.now() - lastRefresh)) / 1000,
          )} Seconds`,
        );
      }
    }
  }

  componentWillUnmount() {
    this.EventEmitter.removeAllListeners('refresh');
  }

  async refresh() {
    await this.setStateAsync({refreshing: true});
    await this.getDIDBalance();
    await this.setStateAsync({refreshing: false});
  }

  async getDIDBalance() {
    const balancesDID = await this.getBatchBalances();
    setAsyncStorageValue({balancesDID});
    this.context.setValue({balancesDID});
  }

  async getBatchBalances() {
    const tokensArrays = blockchains
      .map(x =>
        x.tokens.filter(
          token =>
            token.address !== '0x0000000000000000000000000000000000000000',
        ),
      )
      .map(x => x.map(y => y.address));
    const batchBalancesContracts = blockchains.map(
      (x, i) =>
        new Contract(
          x.batchBalancesAddress,
          abiBatchTokenBalances,
          this.provider[i],
        ),
    );
    const nativeBalances = await Promise.all(
      this.provider.map(
        (x, i) =>
          x.getBalance(
            this.context.value.walletsDID[blockchains[i].apiname].address,
          ) ?? 0n,
      ),
    );
    const tokenBalances = await Promise.all(
      batchBalancesContracts.map(
        (x, i) =>
          x.batchBalanceOf(
            this.context.value.walletsDID[blockchains[i].apiname].address,
            tokensArrays[i],
          ) ?? 0n,
      ),
    );
    let balancesMerge = [];
    nativeBalances.forEach((x, i) =>
      balancesMerge.push([x, ...tokenBalances[i]]),
    );
    const balances = blockchains.map((x, i) =>
      x.tokens.map((y, j) => {
        return formatUnits(balancesMerge[i][j], y.decimals);
      }),
    );
    return balances;
  }

  async faceRegister(image, address) {
    const myHeaders = new Headers();
    myHeaders.append('X-API-Key', AI_URL_API_KEY);
    myHeaders.append('Content-Type', 'application/json');
    const raw = JSON.stringify({
      address,
      image,
    });
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };
    return new Promise(resolve => {
      fetch(`${AI_URL_API}/saveUserBase`, requestOptions)
        .then(response => response.json())
        .then(result => resolve(result.result))
        .catch(() => resolve(null));
    });
  }

  async didRegister() {
    return new Promise(async resolve => {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');

      const raw = JSON.stringify({
        kind: this.encryptData('did'),
        address: this.context.value.wallets.eth.address,
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
          resolve(result);
        })
        .catch(e => {
          console.log(e);
        });
    });
  }

  createWallet(image) {
    this.setState({
      loading: true,
    });
    setTimeout(async () => {
      try {
        const {user, wallets} = await this.didRegister();
        const res = await this.faceRegister(image, user);
        if (
          res.result === 'Address already exists' ||
          res === null ||
          res.result === 'User already exists'
        ) {
          throw 'User already exists';
        }
        await setEncryptedStorageValue({
          userDID: user,
        });
        await setAsyncStorageValue({
          walletsDID: wallets,
        });
        this.context.setValue({
          walletsDID: wallets,
        });
        await this.setStateAsync({
          loading: false,
        });
        this.componentDidMount();
      } catch (e) {
        console.log(e);
      }
    }, 100);
  }

  async createPayment(nonce) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const user = await getEncryptedStorageValue('userDID');
    const raw = JSON.stringify({
      nonce:this.encryptData(nonce),
      user: this.encryptData(user),
    });
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };
    return new Promise(resolve => {
      fetch(PAYMENT_URL_API, requestOptions)
        .then(response => response.json())
        .then(result => resolve(result.res))
        .catch(() => resolve(null));
    });
  }

  async createQR() {
    this.setState({
      loading: true,
    });
    const bytes = randomBytes(16);
    const noncePayment = uuidV4(bytes);
    const res = await this.createPayment(noncePayment);
    if (res === 'BAD REQUEST') {
      await this.setStateAsync({
        loading: false,
      });
      return;
    }
    this.setState({
      loading: false,
      qrData: noncePayment,
    });
  }

  async addBalance() {
    const label =
      this.state.tokenSelected.index === 0 ? 'transfer' : 'tokenTransfer';
    let transaction = {};
    // Only for Savings
    let transactionSavings = {};
    let savings = 0;
    if (label === 'transfer') {
      transaction = {
        from: this.context.value.wallets[this.state.chainSelected.apiname]
          .address,
        to: this.context.value.walletsDID[this.state.chainSelected.apiname]
          .address,
        value: parseEther(this.state.amount),
      };
    } else if (label === 'tokenTransfer') {
      const tokenInterface = new Interface(abiERC20);
      transaction = {
        from: this.context.value.wallets[this.state.chainSelected.apiname]
          .address,
        to: this.state.tokenSelected.address,
        data: tokenInterface.encodeFunctionData('transfer', [
          this.context.value.walletsDID[this.state.chainSelected.apiname]
            .address,
          parseUnits(this.state.amount, this.state.tokenSelected.decimals),
        ]),
      };
    }
    this.context.setValue({
      isTransactionActive: true,
      transactionData: {
        // Wallet Selection
        walletSelector: 0,
        // Commands
        command: label,
        chainSelected: this.state.chainSelected.index,
        tokenSelected: this.state.tokenSelected.index,
        // Transaction
        transaction,
        // With Savings
        withSavings: false,
        transactionSavings,
        // Single Display
        // Display
        label,
        to: this.context.value.walletsDID[this.state.chainSelected.apiname]
          .address,
        amount: this.state.amount,
        tokenSymbol: this.state.tokenSelected.label,
        // Display Savings
        savedAmount: savings,
      },
    });
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          this.context.value.publicKeyDID !== '' && (
            <RefreshControl
              progressBackgroundColor={mainColor}
              refreshing={this.state.refreshing}
              onRefresh={async () => {
                await setAsyncStorageValue({
                  lastRefreshDID: Date.now().toString(),
                });
                await this.refresh();
              }}
            />
          )
        }
        style={GlobalStyles.tab3Container}
        contentContainerStyle={[
          GlobalStyles.tab3ScrollContainer,
          {
            height: '100%',
          },
        ]}>
        {this.context.value.walletsDID.eth.address !== '' ? (
          <Fragment>
            <LinearGradient
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                marginTop: 30,
              }}
              colors={['#000000', '#1a1a1a', '#000000']}>
              <Text style={[GlobalStyles.title]}>FaceDID Balance</Text>
              <Text style={[GlobalStyles.balance]}>
                {`$ ${epsilonRound(
                  arraySum(
                    this.context.value.balancesDID
                      .map((blockchain, i) =>
                        blockchain.map(
                          (token, j) =>
                            token * this.context.value.usdConversion[i][j],
                        ),
                      )
                      .flat(),
                  ),
                  2,
                )} USD`}
              </Text>
            </LinearGradient>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                marginTop: 30,
              }}>
              <Pressable
                disabled={this.state.loading}
                style={[
                  this.state.selector === 0
                    ? GlobalStyles.buttonSelectorSelectedStyle
                    : GlobalStyles.buttonSelectorStyle,
                ]}
                onPress={async () => {
                  this.setState({selector: 0});
                }}>
                <Text style={[GlobalStyles.buttonText, {fontSize: 18}]}>
                  Tokens
                </Text>
              </Pressable>
              <Pressable
                disabled={this.state.loading}
                style={[
                  this.state.selector === 1
                    ? GlobalStyles.buttonSelectorSelectedStyle
                    : GlobalStyles.buttonSelectorStyle,
                ]}
                onPress={async () => {
                  this.setState({selector: 1});
                }}>
                <Text style={[GlobalStyles.buttonText, {fontSize: 18}]}>
                  Add Balance
                </Text>
              </Pressable>
              <Pressable
                disabled={this.state.loading}
                style={[
                  this.state.selector === 2
                    ? GlobalStyles.buttonSelectorSelectedStyle
                    : GlobalStyles.buttonSelectorStyle,
                ]}
                onPress={async () => {
                  this.setState({selector: 2});
                }}>
                <Text style={[GlobalStyles.buttonText, {fontSize: 18}]}>
                  DID Pay
                </Text>
              </Pressable>
            </View>
            {this.state.selector === 0 && (
              <View style={{marginTop: 30}}>
                {blockchains.map((blockchain, i) =>
                  blockchain.tokens.map((token, j) => (
                    <View key={`${i}${j}`} style={GlobalStyles.network}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                        }}>
                        <View style={{marginHorizontal: 20}}>
                          <View>{token.icon}</View>
                        </View>
                        <View style={{justifyContent: 'center'}}>
                          <Text
                            style={{
                              fontSize: 18,
                              color: 'white',
                            }}>
                            {token.name}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                            }}>
                            <Text
                              style={{
                                fontSize: 12,
                                color: 'white',
                              }}>
                              {this.context.value.balancesDID[i][j] === 0
                                ? '0'
                                : this.context.value.balancesDID[i][j] < 0.001
                                ? '<0.01'
                                : epsilonRound(
                                    this.context.value.balancesDID[i][j],
                                    2,
                                  )}{' '}
                              {token.symbol}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: 'white',
                              }}>
                              {`  -  ($${epsilonRound(
                                this.context.value.usdConversion[i][j],
                                4,
                              )} USD)`}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={{marginHorizontal: 20}}>
                        <Text style={{color: 'white'}}>
                          $
                          {epsilonRound(
                            this.context.value.balancesDID[i][j] *
                              this.context.value.usdConversion[i][j],
                            2,
                          )}{' '}
                          USD
                        </Text>
                      </View>
                    </View>
                  )),
                )}
              </View>
            )}
            {this.state.selector === 1 && (
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '90%',
                  marginTop: 30,
                }}>
                <Text style={GlobalStyles.formTitleCard}>Amount</Text>
                <TextInput
                  style={[GlobalStyles.input, {width: '100%'}]}
                  keyboardType="decimal-pad"
                  value={this.state.amount}
                  onChangeText={value => this.setState({amount: value})}
                />
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
                      width: '100%',
                    },
                  }}
                  value={this.state.chainSelected.value}
                  items={setChains(blockchains)}
                  onValueChange={network => {
                    this.setState({
                      chainSelected: setChains(blockchains)[network],
                      tokenSelected: setTokens(blockchains[network].tokens)[0],
                    });
                  }}
                />
                <Text style={GlobalStyles.formTitleCard}>Select Token</Text>
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
                      width: '100%',
                    },
                  }}
                  value={this.state.tokenSelected.value}
                  items={setTokens(
                    blockchains[this.state.chainSelected.value].tokens,
                  )}
                  onValueChange={token => {
                    this.setState({
                      tokenSelected: setTokens(
                        blockchains[this.state.chainSelected.value].tokens,
                      )[token],
                    });
                  }}
                />
                <View
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Pressable
                    disabled={this.state.loading}
                    style={[
                      GlobalStyles.buttonStyle,
                      {
                        width: '100%',
                        padding: 10,
                        marginVertical: 25,
                      },
                      this.state.loading ? {opacity: 0.5} : {},
                    ]}
                    onPress={async () => {
                      await this.setStateAsync({loading: true});
                      await this.addBalance();
                      await this.setStateAsync({
                        loading: false,
                      });
                    }}>
                    <Text style={[GlobalStyles.buttonText]}>
                      {this.state.loading ? 'Adding...' : 'Add'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
            {this.state.selector === 2 && (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  width: '90%',
                  height: '100%',
                }}>
                {this.state.qrData === '' ? (
                  <Pressable
                    disabled={this.state.loading}
                    style={[
                      GlobalStyles.buttonStyle,
                      this.state.loading ? {opacity: 0.5} : {},
                    ]}
                    onPress={() => this.createQR()}>
                    <Text style={[GlobalStyles.buttonText]}>
                      {this.state.loading ? 'Creating...' : 'Create QR Payment'}
                    </Text>
                  </Pressable>
                ) : (
                  <Fragment>
                    <Text style={GlobalStyles.formTitleCard}>Payment QR</Text>
                    <QRCodeStyled
                      maxSize={Dimensions.get('screen').width * 0.7}
                      data={this.state.qrData}
                      style={[
                        {
                          backgroundColor: 'white',
                          borderRadius: 10,
                        },
                      ]}
                      errorCorrectionLevel="H"
                      padding={16}
                      //pieceSize={10}
                      pieceBorderRadius={4}
                      isPiecesGlued
                      color={'black'}
                    />
                  </Fragment>
                )}
              </View>
            )}
          </Fragment>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'space-around',
              alignItems: 'center',
              width: '90%',
            }}>
            <View>
              <Text style={{color: 'white', fontSize: 28}}>FaceDID</Text>
            </View>
            <View
              style={{
                height: Dimensions.get('screen').height * 0.5,
                width: Dimensions.get('screen').width * 0.8,
                marginVertical: 20,
                borderColor: secondaryColor,
                borderWidth: 5,
                borderRadius: 10,
              }}>
              <Cam
                take={this.state.take}
                onImage={image => {
                  this.createWallet(image);
                }}
              />
            </View>
            <Pressable
              disabled={this.state.loading}
              style={[
                GlobalStyles.buttonStyle,
                this.state.loading ? {opacity: 0.5} : {},
              ]}
              onPress={() =>
                this.setState({take: true, loading: true}, () => {
                  this.setState({
                    take: false,
                  });
                })
              }>
              <Text style={[GlobalStyles.buttonText]}>
                {this.state.loading ? 'Creating...' : 'Create Account'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    );
  }
}
