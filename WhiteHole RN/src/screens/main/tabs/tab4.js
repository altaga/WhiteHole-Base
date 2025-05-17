import {Contract, formatUnits} from 'ethers';
import React, {Component, Fragment} from 'react';
import {
  Dimensions,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BaseName from '../../../components/baseName';
import {abiMultiChainChat} from '../../../contracts/multiChainChat';
import GlobalStyles, {
  main,
  mainColor,
  secondaryColor,
} from '../../../styles/styles';
import {chains, refreshTime} from '../../../utils/constants';
import ContextModule from '../../../utils/contextModule';
import {
  decrypt,
  getAsyncStorageValue,
  removeDuplicatesByKey,
  setAsyncStorageValue,
  setupProvider,
} from '../../../utils/utils';
import Cam from '../../sendWallet/components/cam';

const baseTab4State = {
  loading: false,
  scanner: false,
};

class Tab4 extends Component {
  constructor(props) {
    super(props);
    this.state = baseTab4State;
    this.provider = chains.map(x => setupProvider(x.rpc));
  }
  static contextType = ContextModule;

  async componentDidMount() {
    console.log(this.context.value.wallets.eth.address);
    const refreshCheck = Date.now();
    const lastRefresh = await this.getLastRefreshChat();
    if (refreshCheck - lastRefresh >= refreshTime) {
      console.log('Refreshing...');
      await setAsyncStorageValue({lastRefreshChat: Date.now()});
      try {
        await this.refresh();
      } catch (e) {
        console.log(e);
      }
    } else {
      console.log(
        `Next refresh Available: ${Math.round(
          (refreshTime - (refreshCheck - lastRefresh)) / 1000,
        )} Seconds`,
      );
    }
  }

  async getMessages() {
    const chatContracts = chains.map(
      (x, i) =>
        new Contract(x.crossChainChat, abiMultiChainChat, this.provider[i]),
    );
    const counterByAddresses = await Promise.all(
      chatContracts.map(
        async (contract, i) =>
          await contract.chatCounter(
            this.context.value.wallets[chains[i].apiname].address,
          ),
      ),
    );
    // Chat Counters
    const chatCounters = counterByAddresses.map(x => Number(x));
    let memoryChatCounters = await getAsyncStorageValue('memoryChatCounters');
    if (memoryChatCounters === null) {
      memoryChatCounters = new Array(chains.length).fill(0);
      await setAsyncStorageValue({
        memoryChatCounters,
      });
    }
    let memoryMessages = await getAsyncStorageValue('memoryMessages');
    if (memoryMessages === null) {
      memoryMessages = [];
      await setAsyncStorageValue({memoryMessages});
    }
    let messages = memoryMessages;
    if (chatCounters.some((value, i) => value > memoryChatCounters[i])) {
      // Avoid fetching if there are no messages in the chat
      for (const [index, counter] of chatCounters.entries()) {
        const {address} = this.context.value.wallets[chains[index].apiname];
        for (let i = memoryChatCounters[index]; counter > i; i++) {
          const message = await chatContracts[index].chatHistory(address, i);
          const isFromAddress =
            address.toLowerCase() === message.from.toLowerCase();
          const isToAddress =
            address.toLowerCase() === message.to.toLowerCase();
          if (isFromAddress || isToAddress) {
            const decryptedMessage = isFromAddress
              ? decrypt(message.messFrom, address, message.iv)
              : decrypt(message.messTo, address, message.iv);
            const myJson = {
              fromChainId: message.fromChainId,
              toChainId: message.toChainId,
              from: message.from,
              to: message.to,
              message: decryptedMessage,
              amount: formatUnits(message.amount, 6),
              blocktime: Number(message.blocktime) * 1000,
              index: i,
            };
            messages.push(myJson);
          }
        }
      }
      const wallets = this.context.value.wallets;
      const addresses = Object.keys(wallets).map(x =>
        wallets[x].address.toLowerCase(),
      );
      const sortedMessages = messages.sort((a, b) => a.blocktime - b.blocktime);
      const chat = sortedMessages
        .map((x, _, arr) => {
          const json = {};
          const index = chains.findIndex(
            y => y.wormholeChainId === Number(x.fromChainId),
          );
          if (index === -1) return null; // Prevents errors if index isn't found.
          const walletAddress =
            wallets[chains[index].apiname].address.toLowerCase();
          json.address = x.from.toLowerCase() === walletAddress ? x.to : x.from;
          const relatedMessages = arr.filter(
            y => y.to === json.address || y.from === json.address,
          );
          json.messages = removeDuplicatesByKey(relatedMessages, 'blocktime');
          json.timestamp = x.blocktime;
          return json;
        })
        .filter(Boolean); // Removes null values if `index === -1`
      const chatFiltered = chat.filter(
        x => !addresses.includes(x.address.toLowerCase()),
      );
      let chatGeneral = removeDuplicatesByKey(chatFiltered, 'address');
      chatGeneral.sort((a, b) => b.timestamp - a.timestamp);
      await setAsyncStorageValue({chatGeneral});
      await setAsyncStorageValue({memoryMessages: messages});
      await setAsyncStorageValue({memoryChatCounters: chatCounters});
      this.context.setValue({
        chatGeneral,
      });
      ToastAndroid.show('Messages Refreshed', ToastAndroid.SHORT);
    } else {
      ToastAndroid.show('No new messages', ToastAndroid.SHORT);
    }
  }

  async refresh() {
    await this.setStateAsync({loading: true});
    try {
      await this.getMessages();
    } catch (e) {
      console.log(e);
    }

    await this.setStateAsync({loading: false});
  }

  async getLastRefreshChat() {
    try {
      const lastRefreshChat = await getAsyncStorageValue('lastRefreshChat');
      if (lastRefreshChat === null) throw 'Set First Date';
      return lastRefreshChat;
    } catch (err) {
      await setAsyncStorageValue({lastRefreshChat: 0});
      return 0;
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

  render() {
    return (
      <Fragment>
        {!this.state.scanner && (
          <Fragment>
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  progressBackgroundColor={mainColor}
                  refreshing={this.state.loading}
                  onRefresh={async () => {
                    await setAsyncStorageValue({
                      lastRefreshCard: Date.now().toString(),
                    });
                    await this.refresh();
                  }}
                />
              }
              style={GlobalStyles.tab3Container}
              contentContainerStyle={[
                GlobalStyles.tab3ScrollContainer,
                {
                  height: 'auto',
                },
              ]}>
              {this.context.value.chatGeneral.map((chat, i) => (
                <TouchableOpacity
                  key={i}
                  onLongPress={() => {
                    Linking.openURL(
                      'https://wormholescan.io/#/txs?address=' + chat.address,
                    );
                  }}
                  onPress={() => {
                    this.props.navigation.navigate('Chat', {
                      address: chat.address,
                    });
                  }}
                  activeOpacity={0.6}
                  style={{
                    width: '100%',
                    height: 'auto',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: 'row',
                    marginTop: 25,
                  }}>
                  <View
                    style={{
                      backgroundColor: '#' + chat.address.substring(2, 10),
                      width: 50,
                      height: 50,
                      borderRadius: 50,
                      marginHorizontal: 20,
                    }}
                  />
                  <View
                    style={{
                      width: '100%',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                    }}>
                    <BaseName
                      address={chat.address}
                      inline={true}
                      style={{
                        color: 'white',
                        fontSize: 18,
                        fontWeight: 'bold',
                      }}
                    />
                    {chat.messages.length > 0 && (
                      <Text
                        style={{
                          color: '#cccccc',
                          fontSize: 14,
                          fontWeight: 'bold',
                        }}>
                        {' '}
                        {chat.messages[
                          chat.messages.length - 1
                        ].message.substring(0, 30)}
                        {chat.messages[chat.messages.length - 1].message
                          .length > 30
                          ? '...'
                          : ''}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => this.setState({scanner: true})}
              style={[
                GlobalStyles.buttonStyle,
                {
                  position: 'absolute',
                  bottom: 25,
                  right: 25,
                  width: 64,
                  height: 'auto',
                  aspectRatio: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 20,
                },
              ]}>
              <MaterialIcons
                style={{transform: [{rotate: '90deg'}, {scaleY: 1.4}]}}
                name="chat-bubble"
                size={22}
                color={'white'}
              />
              <FontAwesome5
                style={{
                  position: 'absolute',
                  paddingLeft: 5.5,
                  paddingTop: 1.5,
                }}
                name="plus"
                size={10}
                color={mainColor}
              />
            </Pressable>
          </Fragment>
        )}
        {this.state.scanner && (
          <View
            style={[
              {height: main, justifyContent: 'center', alignItems: 'center'},
            ]}>
            <View>
              <Text style={{color: 'white', fontSize: 28}}>Scan Address</Text>
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
                callbackAddress={async e => {
                  await this.setStateAsync({
                    scanner: false,
                  });
                  const chatGeneral = [...this.context.value.chatGeneral];
                  chatGeneral.unshift({
                    address: e,
                    messages: [],
                    timestamp: Date.now(),
                  });
                  this.context.setValue({chatGeneral}, () =>
                    this.props.navigation.navigate('Chat', {
                      address: e,
                    }),
                  );
                }}
              />
            </View>
            <Pressable
              style={[GlobalStyles.buttonCancelStyle]}
              onPress={async () => {
                await this.setStateAsync({
                  scanner: false,
                });
              }}>
              <Text style={GlobalStyles.buttonCancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </Fragment>
    );
  }
}

export default Tab4;
