import {GOOGLE_URL_API} from '@env';
import Slider from '@react-native-community/slider';
import {Contract, formatUnits, Interface, parseEther, parseUnits} from 'ethers';
import React, {Component, Fragment} from 'react';
import {
  Dimensions,
  NativeEventEmitter,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNPickerSelect from 'react-native-picker-select';
import Crypto from 'react-native-quick-crypto';
import {abiBatchTokenBalances} from '../../../contracts/batchTokenBalances';
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
  formatDate,
  getAsyncStorageValue,
  setAsyncStorageValue,
  setEncryptedStorageValue,
  setupProvider,
} from '../../../utils/utils';

const periodsAvailable = [
  {
    label: 'Daily',
    value: 1,
    periodValue: 86400,
  },
  {
    label: 'Weekly',
    value: 2,
    periodValue: 604800,
  },
  {
    label: 'Monthly',
    value: 3,
    periodValue: 2629800,
  },
  {
    label: 'Yearly',
    value: 4,
    periodValue: 31557600,
  },
];

const protocolsAvailable = [
  {
    label: 'Balanced',
    value: 1,
  },
  {
    label: 'Percentage',
    value: 2,
  },
];

const baseTab2State = {
  refreshing: false,
  loading: false,
  slider: 1,
};

export default class Tab2 extends Component {
  constructor(props) {
    super(props);
    this.state = baseTab2State;
    this.provider = blockchains.map(x => setupProvider(x.rpc));
    this.EventEmitter = new NativeEventEmitter();
  }

  static contextType = ContextModule;

  async getLastRefreshSavings() {
    try {
      const lastRefreshSavings = await getAsyncStorageValue(
        'lastRefreshSavings',
      );
      if (lastRefreshSavings === null) throw 'Set First Date';
      return lastRefreshSavings;
    } catch (err) {
      await setAsyncStorageValue({lastRefreshSavings: 0});
      return 0;
    }
  }

  async componentDidMount() {
    // Public Key
    const publicKey = this.context.value.walletsSavings.eth.address;
    console.log(publicKey);
    if (publicKey !== '') {
      this.setState({
        slider: this.context.value.percentage,
      });
      // Event Emitter
      this.EventEmitter.addListener('refresh', async () => {
        await setAsyncStorageValue({lastRefreshSavings: Date.now()});
        this.refresh();
      });
      // Get Last Refresh
      const lastRefresh = await this.getLastRefreshSavings();
      if (Date.now() - lastRefresh >= refreshTime) {
        console.log('Refreshing...');
        await setAsyncStorageValue({lastRefreshSavings: Date.now()});
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
    await this.getSavingsBalance();
    await this.setStateAsync({refreshing: false});
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
            this.context.value.walletsSavings[blockchains[i].apiname].address,
          ) ?? 0n,
      ),
    );
    const tokenBalances = await Promise.all(
      batchBalancesContracts.map(
        (x, i) =>
          x.batchBalanceOf(
            this.context.value.walletsSavings[blockchains[i].apiname].address,
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

  async getSavingsBalance() {
    const balancesSavings = await this.getBatchBalances();
    setAsyncStorageValue({balancesSavings});
    this.context.setValue({balancesSavings});
  }

  async changePeriod() {
    const savingsDate =
      Date.now() +
      periodsAvailable[this.context.value.periodSelected - 1].periodValue *
        1000;
    await setAsyncStorageValue({savingsDate});
    this.context.setValue({savingsDate});
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

  createWallet() {
    this.setState({
      loading: true,
    });
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    const raw = JSON.stringify({
      kind: this.encryptData('saving'),
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
      .then(async result => {
        const {user, wallets} = result;
        await setEncryptedStorageValue({
          userSavings: user,
        });
        await setAsyncStorageValue({
          walletsSavings: wallets,
        });
        this.context.setValue({
          walletsSavings: wallets,
        });
        await this.setStateAsync({
          loading: false,
        });
        this.componentDidMount();
      })
      .catch(() => {
        this.setState({
          loading: false,
        });
      });
  }

  async transfer() {
    const label =
      this.state.tokenSelected.index === 0 ? 'transfer' : 'tokenTransfer';
    let transaction = {};
    let transactionSavings = {};
    let savings = 0;
    if (label === 'transfer') {
      transaction = {
        from: this.context.value.wallets.eth.address,
        to: this.state.toAddress,
        value: parseEther(this.state.amount),
      };
    } else if (label === 'tokenTransfer') {
      const tokenInterface = new Interface(abiERC20);
      transaction = {
        from: this.context.value.wallets.eth.address,
        to: this.state.tokenSelected.address,
        data: tokenInterface.encodeFunctionData('transfer', [
          this.state.toAddress,
          parseUnits(this.state.amount, this.state.tokenSelected.decimals),
        ]),
      };
    }
    if (label === 'transfer' && this.context.value.savingsFlag) {
      savings =
        this.context.value.protocolSelected === 1
          ? balancedSaving(
              this.state.amount,
              this.context.value.usdConversion[this.state.chainSelected.index][
                this.state.tokenSelected.index
              ],
            )
          : percentageSaving(this.state.amount, this.context.value.percentage);
      savings = epsilonRound(savings, 18).toString(); // Avoid excessive decimals error
      transactionSavings = {
        from: this.context.value.wallets.eth.address,
        to: this.context.value.walletsSavings.eth.address,
        value: parseEther(savings),
      };
    } else if (label === 'tokenTransfer' && this.context.value.savingsFlag) {
      const valueOnETH =
        (this.state.amount *
          this.context.value.usdConversion[this.state.chainSelected.index][
            this.state.tokenSelected.index
          ]) /
        this.context.value.usdConversion[this.state.chainSelected.index][0];
      savings =
        this.context.value.protocolSelected === 1
          ? balancedSaving(
              valueOnETH,
              this.context.value.usdConversion[
                this.state.chainSelected.index
              ][0],
            )
          : percentageSaving(valueOnETH, this.context.value.percentage);
      savings = epsilonRound(savings, 18).toString();
      transactionSavings = {
        from: this.context.value.wallets.eth.address,
        to: this.context.value.walletsSavings.eth.address,
        value: parseEther(savings),
      };
    }
    this.context.setValue({
      isTransactionActive: true,
      transactionData: {
        // Wallet Selection
        walletSelector: 1,
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
        to: this.state.toAddress,
        amount: this.state.amount,
        tokenSymbol: this.state.tokenSelected.label,
        // Display Savings
        savedAmount: savings,
      },
    });
    await this.setStateAsync({loading: false});
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

  render() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            progressBackgroundColor={mainColor}
            refreshing={this.state.refreshing}
            onRefresh={async () => {
              await setAsyncStorageValue({
                lastRefreshSavings: Date.now().toString(),
              });
              await this.refresh();
            }}
          />
        }
        style={GlobalStyles.tab2Container}
        contentContainerStyle={[GlobalStyles.tab2ScrollContainer]}>
        {this.context.value.walletsSavings.eth.address !== '' ? (
          <Fragment>
            <LinearGradient
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                marginVertical: 40,
              }}
              colors={['#000000', '#1a1a1a', '#000000']}>
              <Text style={[GlobalStyles.title]}>Savings Balance</Text>
              <Text style={[GlobalStyles.balance]}>
                {`$ ${epsilonRound(
                  arraySum(
                    this.context.value.balancesSavings
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
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '90%',
                gap: 25,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignContent: 'center',
                  width: '100%',
                }}>
                <Text style={[GlobalStyles.formTitle]}>Activate Savings</Text>
                <Switch
                  style={{
                    transform: [{scaleX: 1.3}, {scaleY: 1.3}],
                  }}
                  trackColor={{
                    false: '#3e3e3e',
                    true: mainColor + '77',
                  }}
                  thumbColor={
                    this.context.value.savingsFlag ? mainColor : '#f4f3f4'
                  }
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={async () => {
                    await setAsyncStorageValue({
                      savingsFlag: !this.context.value.savingsFlag,
                    });
                    await this.context.setValue({
                      savingsFlag: !this.context.value.savingsFlag,
                    });
                  }}
                  value={this.context.value.savingsFlag}
                />
              </View>
              {this.context.value.savingsFlag && (
                <React.Fragment>
                  <View
                    style={{
                      borderColor: mainColor,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}>
                      <Text style={[GlobalStyles.formTitle]}>
                        Savings Period
                      </Text>
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
                            width: '55%',
                          },
                        }}
                        value={this.context.value.periodSelected}
                        items={periodsAvailable}
                        onValueChange={async value => {
                          await setAsyncStorageValue({
                            periodSelected: value,
                          });
                          await this.context.setValue({
                            periodSelected: value,
                          });
                        }}
                      />
                    </View>
                    <Pressable
                      disabled={this.state.loading}
                      style={[
                        GlobalStyles.buttonStyle,
                        this.state.loading ? {opacity: 0.5} : {},
                      ]}
                      onPress={async () => {
                        await this.setStateAsync({loading: true});
                        await this.changePeriod();
                        await this.setStateAsync({loading: false});
                      }}>
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 18,
                          fontWeight: 'bold',
                        }}>
                        {this.state.loading
                          ? 'Changing...'
                          : 'Change Savings Period'}
                      </Text>
                    </Pressable>
                  </View>
                  <View
                    style={{
                      width: '100%',
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}>
                      <Text style={[GlobalStyles.formTitle]}>
                        Savings Protocol
                      </Text>
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
                            width: Dimensions.get('screen').width * 0.5,
                          },
                        }}
                        value={this.context.value.protocolSelected}
                        items={protocolsAvailable}
                        onValueChange={async protocolSelected => {
                          await setAsyncStorageValue({
                            protocolSelected,
                          });
                          await this.context.setValue({
                            protocolSelected,
                          });
                        }}
                      />
                    </View>
                    {this.context.value.protocolSelected === 2 && (
                      <View
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignContent: 'center',
                          width: '100%',
                        }}>
                        <Slider
                          value={this.state.slider}
                          style={{
                            width: '85%',
                            height: 40,
                          }}
                          step={1}
                          minimumValue={1}
                          maximumValue={15}
                          minimumTrackTintColor="#FFFFFF"
                          maximumTrackTintColor={mainColor}
                          onValueChange={async value => {
                            await Promise.all([
                              setAsyncStorageValue({
                                percentage: value,
                              }),
                              this.context.setValue({
                                percentage: value,
                              }),
                            ]);
                          }}
                        />
                        <Text
                          style={{
                            width: '15%',
                            fontSize: 24,
                            color: '#FFF',
                            fontWeight: 'bold',
                          }}>
                          {this.context.value.percentage}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignContent: 'center',
                      width: '100%',
                    }}>
                    <Text style={[GlobalStyles.formTitle]}>
                      Next Withdraw Date
                    </Text>
                    <Pressable
                      disabled={
                        this.state.loading ||
                        !(this.context.value.savingsDate < Date.now())
                      }
                      style={[
                        GlobalStyles.buttonStyle,
                        {width: '50%'},
                        this.state.loading ||
                        !(this.context.value.savingsDate < Date.now())
                          ? {opacity: 0.5}
                          : {},
                      ]}
                      onPress={async () => {
                        await this.setStateAsync({loading: true});
                        //await this.transfer(); // to be done
                        await this.setStateAsync({loading: false});
                      }}>
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 18,
                          fontWeight: 'bold',
                        }}>
                        {!(this.context.value.savingsDate < Date.now())
                          ? formatDate(new Date(this.context.value.savingsDate))
                          : this.state.loading
                          ? 'Withdrawing...'
                          : 'Withdraw Now'}
                      </Text>
                    </Pressable>
                  </View>
                </React.Fragment>
              )}
            </View>
          </Fragment>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: '90%',
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
              Create Savings Account
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
                onPress={() => this.createWallet()}>
                <Text style={[GlobalStyles.buttonText]}>
                  {this.state.loading ? 'Creating...' : 'Create Account'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }
}
