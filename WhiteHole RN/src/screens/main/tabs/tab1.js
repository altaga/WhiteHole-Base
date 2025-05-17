import {Contract, formatUnits} from 'ethers';
import React, {Component} from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import facePayIcon from '../../../assets/extraLogos/iconFaceBN.png';
import {abiBatchTokenBalances} from '../../../contracts/batchTokenBalances';
import GlobalStyles, {mainColor} from '../../../styles/styles';
import {blockchains, refreshTime} from '../../../utils/constants';
import ContextModule from '../../../utils/contextModule';
import {
  arraySum,
  epsilonRound,
  getAsyncStorageValue,
  setAsyncStorageValue,
  setupProvider,
} from '../../../utils/utils';

const baseTab1State = {
  refreshing: false,
  nfcSupported: true,
};

class Tab1 extends Component {
  constructor(props) {
    super(props);
    this.state = baseTab1State;
    this.provider = blockchains.map(x => setupProvider(x.rpc));
    this.controller = new AbortController();
  }
  static contextType = ContextModule;

  async componentDidMount() {
    const publicKey = this.context.value.wallets.eth.address;
    console.log(publicKey);
    const lastRefresh = await this.getLastRefresh();
    if (Date.now() - lastRefresh >= refreshTime) {
      console.log('Refreshing...');
      await setAsyncStorageValue({lastRefresh: Date.now().toString()});
      this.refresh();
    } else {
      console.log(
        `Next refresh Available: ${Math.round(
          (refreshTime - (Date.now() - lastRefresh)) / 1000,
        )} Seconds`,
      );
    }
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

  async refresh() {
    await this.setStateAsync({refreshing: true});
    try {
      await Promise.all([this.getUSD(), this.getBalances()]);
    } catch (e) {
      console.log(e);
    }
    await this.setStateAsync({refreshing: false});
  }

  // Get Balances

  async getBatchBalances() {
    const publicKey = this.context.value.wallets.eth.address;
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
            this.context.value.wallets[blockchains[i].apiname].address,
          ) ?? 0n,
      ),
    );
    const tokenBalances = await Promise.all(
      batchBalancesContracts.map(
        (x, i) =>
          x.batchBalanceOf(
            this.context.value.wallets[blockchains[i].apiname].address,
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

  async getBalances() {
    const balances = await this.getBatchBalances();
    setAsyncStorageValue({balances});
    this.context.setValue({balances});
  }

  // USD Conversions

  async getUSD() {
    const array = blockchains
      .map(x => x.tokens.map(token => token.coingecko))
      .flat();
    var myHeaders = new Headers();
    myHeaders.append('accept', 'application/json');
    var requestOptions = {
      signal: this.controller.signal,
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${array.toString()}&vs_currencies=usd`,
      requestOptions,
    );
    const result = await response.json();
    const usdConversionTemp = array.map(x => result[x].usd);
    let acc = 0;
    const usdConversion = blockchains.map(blockchain =>
      blockchain.tokens.map(() => {
        acc++;
        return usdConversionTemp[acc - 1];
      }),
    );
    setAsyncStorageValue({usdConversion});
    this.context.setValue({usdConversion});
  }

  async getLastRefresh() {
    try {
      const lastRefresh = await getAsyncStorageValue('lastRefresh');
      if (lastRefresh === null) throw 'Set First Date';
      return lastRefresh;
    } catch (err) {
      await setAsyncStorageValue({lastRefresh: '0'.toString()});
      return 0;
    }
  }

  render() {
    const iconSize = 38;
    return (
      <View
        style={{
          width: '100%',
          height: '100%',
        }}>
        <View style={GlobalStyles.balanceContainer}>
          <LinearGradient
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              paddingVertical: 20,
            }}
            colors={['#000000', '#1a1a1a', '#000000']}>
            <Text style={GlobalStyles.title}>Account Balance</Text>
            <Text style={[GlobalStyles.balance]}>
              {`$ ${epsilonRound(
                arraySum(
                  this.context.value.balances
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
              justifyContent: 'space-evenly',
              alignItems: 'center',
              width: '100%',
            }}>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Pressable
                onPress={() => this.props.navigation.navigate('SendWallet')}
                style={GlobalStyles.singleButton}>
                <IconIonicons
                  name="arrow-up-outline"
                  size={iconSize}
                  color={'white'}
                />
              </Pressable>
              <Text style={GlobalStyles.singleButtonText}>Send</Text>
            </View>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Pressable
                onPress={() => this.props.navigation.navigate('DepositWallet')}
                style={GlobalStyles.singleButton}>
                <IconIonicons
                  name="arrow-down-outline"
                  size={iconSize}
                  color={'white'}
                />
              </Pressable>
              <Text style={GlobalStyles.singleButtonText}>Receive</Text>
            </View>
            {this.state.nfcSupported && (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Pressable
                  onPress={() =>
                    this.props.navigation.navigate('PaymentWallet')
                  }
                  style={GlobalStyles.singleButton}>
                  <Image
                    style={{width: iconSize, height: iconSize}}
                    source={facePayIcon}
                  />
                </Pressable>
                <Text style={GlobalStyles.singleButtonText}>{'Payment'}</Text>
              </View>
            )}
          </View>
        </View>
        <ScrollView
          refreshControl={
            <RefreshControl
              progressBackgroundColor={mainColor}
              refreshing={this.state.refreshing}
              onRefresh={async () => {
                await setAsyncStorageValue({
                  lastRefresh: Date.now().toString(),
                });
                await this.refresh();
              }}
            />
          }
          showsVerticalScrollIndicator={false}
          style={GlobalStyles.tokensContainer}
          contentContainerStyle={{
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}>
          {blockchains.map((blockchain, i) =>
            blockchain.tokens.map((token, j) => (
              <View
                key={i * blockchain.tokens.length + j}
                style={GlobalStyles.network}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                  }}>
                  <View style={GlobalStyles.networkMarginIcon}>
                    <View>{token.icon}</View>
                  </View>
                  <View style={{justifyContent: 'center'}}>
                    <Text style={GlobalStyles.networkTokenName}>
                      {token.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                      }}>
                      <Text style={GlobalStyles.networkTokenData}>
                        {this.context.value.balances[i][j] === 0
                          ? '0'
                          : this.context.value.balances[i][j] < 0.001
                          ? '<0.01'
                          : epsilonRound(
                              this.context.value.balances[i][j],
                              2,
                            )}{' '}
                        {token.symbol}
                      </Text>
                      <Text style={GlobalStyles.networkTokenData}>
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
                      this.context.value.balances[i][j] *
                        this.context.value.usdConversion[i][j],
                      2,
                    )}{' '}
                    USD
                  </Text>
                </View>
              </View>
            )),
          )}
        </ScrollView>
      </View>
    );
  }
}

export default Tab1;
