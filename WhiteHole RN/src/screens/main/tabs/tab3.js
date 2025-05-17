import {GOOGLE_URL_API} from '@env';
import {Contract, formatUnits, Interface, parseEther, parseUnits} from 'ethers';
import React, {Component, Fragment} from 'react';
import {
  Keyboard,
  NativeEventEmitter,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import CreditCard from 'react-native-credit-card';
import LinearGradient from 'react-native-linear-gradient';
import RNPickerSelect from 'react-native-picker-select';
import Crypto from 'react-native-quick-crypto';
import {abiBatchTokenBalances} from '../../../contracts/batchTokenBalances';
import {abiERC20} from '../../../contracts/erc20';
import GlobalStyles, {mainColor} from '../../../styles/styles';
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
  randomNumber,
  setAsyncStorageValue,
  setChains,
  setEncryptedStorageValue,
  setTokens,
  setupProvider,
} from '../../../utils/utils';
import ReadCard from '../components/readCard';

const generator = require('creditcard-generator');

const baseTab3State = {
  // Transaction settings
  amount: '',
  chainSelected: setChains(blockchains)[0], // ""
  tokenSelected: setTokens(blockchains[0].tokens)[0], // ""
  // Card
  cvc: randomNumber(111, 999),
  expiry: '1228',
  name: 'WH Card',
  number: generator.GenCC('VISA'),
  imageFront: require('../../../assets/cardAssets/card-front.png'),
  imageBack: require('../../../assets/cardAssets/card-back.png'),
  // Utils
  stage: 0,
  selector: false,
  nfcSupported: true,
  loading: false,
  keyboardHeight: 0,
  cardInfo: {
    card: '',
    exp: '',
  },
};

export default class Tab3 extends Component {
  constructor(props) {
    super(props);
    this.state = baseTab3State;
    this.provider = blockchains.map(x => setupProvider(x.rpc));
    this.EventEmitter = new NativeEventEmitter();
  }

  static contextType = ContextModule;

  async componentDidMount() {
    const publicKey = this.context.value.walletsCard.eth.address;
    if (publicKey !== '') {
      this.EventEmitter.addListener('refresh', async () => {
        Keyboard.dismiss();
        this.setState(baseTab3State);
        await setAsyncStorageValue({lastRefreshCard: Date.now()});
        this.refresh();
      });
      const refreshCheck = Date.now();
      const lastRefresh = await this.getLastRefreshCard();
      if (refreshCheck - lastRefresh >= refreshTime) {
        console.log('Refreshing...');
        await setAsyncStorageValue({lastRefreshCard: Date.now()});
        await this.refresh();
      } else {
        console.log(
          `Next refresh Available: ${Math.round(
            (refreshTime - (refreshCheck - lastRefresh)) / 1000,
          )} Seconds`,
        );
      }
    }
  }

  componentWillUnmount() {
    this.EventEmitter.removeAllListeners('refresh');
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
        to: this.context.value.walletsCard[this.state.chainSelected.apiname]
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
          this.context.value.walletsCard[this.state.chainSelected.apiname]
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
        to: this.context.value.walletsCard[this.state.chainSelected.apiname]
          .address,
        amount: this.state.amount,
        tokenSymbol: this.state.tokenSelected.label,
        // Display Savings
        savedAmount: savings,
      },
    });
  }

  createWallet() {
    this.setState({
      loading: true,
    });
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const raw = JSON.stringify({
      kind: this.encryptData('card'),
      address: this.context.value.wallets.eth.address,
      data: this.encryptData(
        `${this.state.cardInfo.card}${this.state.cardInfo.exp}`,
      ),
    });
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };
    fetch(`${GOOGLE_URL_API}/createWallets`, requestOptions)
      .then(response => response.json())
      .then(async result => {
        const {user, wallets} = result;
        console.log(result);
        await setEncryptedStorageValue({
          userCard: user,
        });
        await setAsyncStorageValue({
          walletsCard: wallets,
        });
        this.context.setValue({
          walletsCard: wallets,
        });
        await this.setStateAsync({
          loading: false,
          stage: 0,
        });
        this.componentDidMount();
      })
      .catch(error => {
        console.log('error', error);
        this.setState({
          loading: false,
        });
      });
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
            this.context.value.walletsCard[blockchains[i].apiname].address,
          ) ?? 0n,
      ),
    );
    const tokenBalances = await Promise.all(
      batchBalancesContracts.map(
        (x, i) =>
          x.batchBalanceOf(
            this.context.value.walletsCard[blockchains[i].apiname].address,
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

  async getCardBalance() {
    const balancesCard = await this.getBatchBalances();
    setAsyncStorageValue({balancesCard});
    this.context.setValue({balancesCard});
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

  async refresh() {
    await this.setStateAsync({refreshing: true});
    await this.getCardBalance();
    await this.setStateAsync({refreshing: false});
  }

  async getLastRefreshCard() {
    try {
      const lastRefreshCard = await getAsyncStorageValue('lastRefreshCard');
      if (lastRefreshCard === null) throw 'Set First Date';
      return lastRefreshCard;
    } catch (err) {
      await setAsyncStorageValue({lastRefreshCard: 0});
      return 0;
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

  render() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          this.context.value.walletsCard.eth.address !== '' && (
            <RefreshControl
              progressBackgroundColor={mainColor}
              refreshing={this.state.refreshing}
              onRefresh={async () => {
                await setAsyncStorageValue({
                  lastRefreshCard: Date.now().toString(),
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
            height:
              this.context.value.walletsCard.eth.address !== ''
                ? 'auto'
                : '100%',
          },
        ]}>
        {this.context.value.walletsCard.eth.address !== '' ? (
          <Fragment>
            <View style={{height: 180, marginTop: 30}}>
              <CreditCard
                type={this.state.type}
                imageFront={this.state.imageFront}
                imageBack={this.state.imageBack}
                shiny={false}
                bar={false}
                number={this.state.number}
                name={this.state.name}
                expiry={this.state.expiry}
                cvc={this.state.cvc}
              />
            </View>
            <LinearGradient
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                marginTop: 30,
              }}
              colors={['#000000', '#1a1a1a', '#000000']}>
              <Text style={[GlobalStyles.title]}>Card Balance</Text>
              <Text style={[GlobalStyles.balance]}>
                {`$ ${epsilonRound(
                  arraySum(
                    this.context.value.balancesCard
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
                  this.state.selector
                    ? GlobalStyles.buttonSelectorStyle
                    : GlobalStyles.buttonSelectorSelectedStyle,
                ]}
                onPress={async () => {
                  this.setState({selector: false});
                }}>
                <Text style={[GlobalStyles.buttonText, {fontSize: 18}]}>
                  Tokens
                </Text>
              </Pressable>
              <Pressable
                disabled={this.state.loading}
                style={[
                  !this.state.selector
                    ? GlobalStyles.buttonSelectorStyle
                    : GlobalStyles.buttonSelectorSelectedStyle,
                ]}
                onPress={async () => {
                  this.setState({selector: true});
                }}>
                <Text style={[GlobalStyles.buttonText, {fontSize: 18}]}>
                  Add Balance
                </Text>
              </Pressable>
            </View>
            {this.state.selector ? (
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
            ) : (
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
                              {this.context.value.balancesCard[i][j] === 0
                                ? '0'
                                : this.context.value.balancesCard[i][j] < 0.001
                                ? '<0.01'
                                : epsilonRound(
                                    this.context.value.balancesCard[i][j],
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
                            this.context.value.balancesCard[i][j] *
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
          </Fragment>
        ) : (
          <Fragment>
            {
              // Stage 0
              this.state.stage === 0 && (
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '90%',
                    height: '100%',
                  }}>
                  <Text
                    style={[
                      GlobalStyles.exoTitle,
                      {
                        textAlign: 'center',
                        fontSize: 24,
                        paddingBottom: 20,
                      },
                    ]}>
                    Create Card Account
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      width: '100%',
                    }}>
                    <Pressable
                      disabled={this.state.loading}
                      style={[
                        GlobalStyles.buttonStyle,
                        this.state.loading ? {opacity: 0.5} : {},
                      ]}
                      onPress={() => this.setState({stage: 1})}>
                      <Text style={[GlobalStyles.buttonText]}>
                        {this.state.loading ? 'Creating...' : 'Create Account'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )
            }
            {
              // Stage 1
              this.state.stage === 1 && (
                <React.Fragment>
                  <View
                    style={{
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      height: '100%',
                    }}>
                    <Text style={GlobalStyles.title}>
                      {' '}
                      Merge Physical Card to Card Account
                    </Text>
                    <ReadCard
                      cardInfo={async cardInfo => {
                        if (cardInfo) {
                          console.log('Card Info: ', cardInfo);
                          await this.setStateAsync({cardInfo});
                          this.createWallet();
                        }
                      }}
                    />
                  </View>
                </React.Fragment>
              )
            }
          </Fragment>
        )}
      </ScrollView>
    );
  }
}
