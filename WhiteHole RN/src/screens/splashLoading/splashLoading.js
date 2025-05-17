// Basic Imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Component } from 'react';
import { Dimensions, Image, View } from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import logoSplash from '../../assets/logoSplash.png';
import GlobalStyles from '../../styles/styles';
import ContextModule from '../../utils/contextModule';
import { getAsyncStorageValue } from '../../utils/utils';

class SplashLoading extends Component {
  constructor(props) {
    super(props);
  }

  static contextType = ContextModule;

  async componentDidMount() {
    this.props.navigation.addListener('focus', async () => {
      // DEBUG ONLY
      //await this.erase();
      console.log(this.props.route.name);
      const wallets = await getAsyncStorageValue('wallets');
      if (wallets) {
        // Main wallet
        const balances = await getAsyncStorageValue('balances');
        // Savings wallet
        const walletsSavings = await getAsyncStorageValue('walletsSavings');
        const periodSelected = await getAsyncStorageValue('periodSelected');
        const protocolSelected = await getAsyncStorageValue('protocolSelected');
        const percentage = await getAsyncStorageValue('percentage');
        const savingsFlag = await getAsyncStorageValue('savingsFlag');
        const balancesSavings = await getAsyncStorageValue('balancesSavings');
        const savingsDate = await getAsyncStorageValue('savingsDate');
        // Card wallet
        const walletsCard = await getAsyncStorageValue('walletsCard');
        const balancesCard = await getAsyncStorageValue('balancesCard');
        // DID wallet
        const walletsDID = await getAsyncStorageValue('walletsDID');
        const balancesDID = await getAsyncStorageValue('balancesDID');
        // Chat
        const chatGeneral = await getAsyncStorageValue('chatGeneral');
        const fromChain = await getAsyncStorageValue('fromChain');
        const toChain = await getAsyncStorageValue('toChain');
        // Shared
        const usdConversion = await getAsyncStorageValue('usdConversion');
        const usdConversionTrad = await getAsyncStorageValue(
          'usdConversionTrad',
        );
        this.context.setValue({
          // Base Wallet
          wallets: wallets ?? this.context.value.wallets,
          balances: balances ?? this.context.value.balances,
          // Savings Wallet
          walletsSavings: walletsSavings ?? this.context.value.walletsSavings,
          periodSelected: periodSelected ?? this.context.value.periodSelected,
          protocolSelected:
            protocolSelected ?? this.context.value.protocolSelected,
          percentage: percentage ?? this.context.value.percentage,
          savingsFlag: savingsFlag ?? this.context.value.savingsFlag,
          balancesSavings:
            balancesSavings ?? this.context.value.balancesSavings,
          savingsDate: savingsDate ?? this.context.value.savingsDate,
          // Card Wallet
          walletsCard: walletsCard ?? this.context.value.walletsCard,
          balancesCard: balancesCard ?? this.context.value.balancesCard,
          // DID Wallet
          walletsDID : walletsDID ?? this.context.value.walletsDID,
          balancesDID : balancesDID ?? this.context.value.balancesDID,
          // Chat
          chatGeneral: chatGeneral ?? this.context.value.chatGeneral,
          fromChain: fromChain ?? this.context.value.fromChain,
          toChain: toChain ?? this.context.value.toChain,
          // Shared
          usdConversion: usdConversion ?? this.context.value.usdConversion,
          usdConversionTrad:
            usdConversionTrad ?? this.context.value.usdConversionTrad,
        });
        this.props.navigation.navigate('Main'); // Main
      } else {
        this.props.navigation.navigate('Setup');
      }
    });
    this.props.navigation.addListener('blur', async () => {});
  }

  async erase() {
    // DEV ONLY - DON'T USE IN PRODUCTION
    try {
      await EncryptedStorage.clear();
      await AsyncStorage.clear();
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    return (
      <View style={[GlobalStyles.container, {justifyContent: 'center'}]}>
        <Image
          resizeMode="contain"
          source={logoSplash}
          alt="Main Logo"
          style={{
            width: Dimensions.get('window').width,
          }}
        />
      </View>
    );
  }
}

export default SplashLoading;
