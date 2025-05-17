import {Contract, formatUnits, Interface, parseUnits} from 'ethers';
import React, {Component} from 'react';
import {
  Dimensions,
  Keyboard,
  Modal,
  NativeEventEmitter,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BaseName from '../../components/baseName';
import Header from '../../components/header';
import {abiMultiChainChat} from '../../contracts/multiChainChat';
import GlobalStyles, {header, main, mainColor} from '../../styles/styles';
import {blockchains, USDCicon} from '../../utils/constants';
import ContextModule from '../../utils/contextModule';
import {
  decrypt,
  encrypt,
  findIndexByProperty,
  getAsyncStorageValue,
  removeDuplicatesByKey,
  setAsyncStorageValue,
  setupProvider,
} from '../../utils/utils';

const chatBaseState = {
  loading: false,
  chainSelectorVisible: false,
  usdcVisible: false,
  inputHeight: 'auto',
  message: '',
  amount: '',
};
const chains = blockchains.filter((_, index) => index !== 1); // Remove Ethereum, high fees

let colorByWChainId = {};
chains.forEach(x => {
  colorByWChainId[x.wormholeChainId] = x.color;
});

export default class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = chatBaseState;
    this.provider = chains.map(x => setupProvider(x.rpc));
    this.EventEmitter = new NativeEventEmitter();
    this.scrollView = null;
    this.refresh = null;
  }

  static contextType = ContextModule;

  async componentDidMount() {
    this.props.navigation.addListener('focus', async () => {
      console.log(this.props.route.name);
      console.log(this.props.route.params?.address);
      this.scrollView.scrollToEnd({animated: true});
      this.EventEmitter.addListener('refresh', async () => {
        this.setState(chatBaseState);
        Keyboard.dismiss();
        await setAsyncStorageValue({lastRefreshChat: Date.now()});
        try {
          await this.getMessages();
        } catch (e) {
          console.log(e);
        }
      });
      this.refresh = setInterval(async () => {
        try {
          await this.getMessages();
        } catch (e) {
          console.log(e);
        }
      }, 10000);
    });
    this.props.navigation.addListener('blur', async () => {
      this.setState(chatBaseState);
      this.EventEmitter.removeAllListeners('refresh');
      this.refresh && clearInterval(this.refresh);
    });
  }

  componentWillUnmount() {
    this.EventEmitter.removeAllListeners('refresh');
    this.refresh && clearInterval(this.refresh);
  }

  async sendMessage() {
    const {eth, ...wallets} = this.context.value.wallets;
    const index = findIndexByProperty(
      chains,
      'wormholeChainId',
      this.context.value.fromChain,
    );
    const index2 = findIndexByProperty(
      chains,
      'wormholeChainId',
      this.context.value.toChain,
    );
    const crossChainFlag =
      this.context.value.fromChain !== this.context.value.toChain;
    const to = this.props.route.params?.address;
    const [iv, messFrom] = await encrypt(
      this.state.message,
      wallets[chains[index].apiname].address,
    );
    const [_, messTo] = await encrypt(this.state.message, to, iv);
    const chatInterface = new Interface(abiMultiChainChat);
    const chat = new Contract(
      chains[index].crossChainChat,
      abiMultiChainChat,
      this.provider[index],
    );
    let transaction = {};
    let transactionSavings = {};
    let savings = 0;
    if (crossChainFlag) {
      // Dynamically quote the cross-chain cost
      const gas_limit = 700_000;
      const quote = await chat.quoteCrossChainCost(
        this.context.value.toChain,
        gas_limit,
      );
      const data = chatInterface.encodeFunctionData('sendMessage', [
        this.context.value.toChain,
        chains[index2].crossChainChat,
        gas_limit,
        to,
        messFrom,
        messTo,
        iv,
        parseUnits(this.state.amount === '' ? '0' : this.state.amount, 6),
      ]);
      transaction = {
        from: this.context.value.wallets[chains[index].apiname].address,
        to: chains[index].crossChainChat,
        data,
        value: quote,
      };
    } else {
      const data = chatInterface.encodeFunctionData('addMessage', [
        to,
        parseUnits(this.state.amount === '' ? '0' : this.state.amount, 6),
        messFrom,
        messTo,
        iv,
      ]);
      transaction = {
        from: this.context.value.wallets[chains[index].apiname].address,
        to: chains[index].crossChainChat,
        data,
        value: 0n,
      };
    }
    const indexBlockchain = findIndexByProperty(
      blockchains,
      'apiname',
      chains[index].apiname,
    );
    this.context.setValue({
      isTransactionActive: true,
      transactionData: {
        // Wallet Selection
        walletSelector: 0,
        // Commands
        command: 'sendMessage',
        chainSelected: indexBlockchain,
        tokenSelected: 1,
        // Transaction
        transaction,
        // With Savings
        withSavings: false,
        transactionSavings,
        // Single Display
        // Display
        label: crossChainFlag ? 'Send Cross Chain' : 'Send On Chain',
        to,
        amount: this.state.amount === '' ? '0' : this.state.amount,
        tokenSymbol: 'USDC',
        // Display Savings
        savedAmount: savings,
      },
    });
    await this.setStateAsync({loading: false});
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
      //ToastAndroid.show('Messages Refreshed', ToastAndroid.SHORT);
    } else {
      //ToastAndroid.show('No new messages', ToastAndroid.SHORT);
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

  render() {
    const messages =
      this.context.value.chatGeneral.filter(
        x =>
          x.address.toLowerCase() ===
          this.props.route.params?.address.toLowerCase(),
      )[0]?.messages ?? [];
    return (
      <SafeAreaView style={GlobalStyles.container}>
        <Header />
        <Modal
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          }}
          visible={this.state.chainSelectorVisible}
          transparent={true}
          animationType="slide">
          <View
            style={{
              height: Dimensions.get('window').height,
              width: Dimensions.get('window').width,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
            }}>
            <View
              style={{
                marginTop: Dimensions.get('window').height * 0.2,
                height: Dimensions.get('window').height * 0.6,
                width: '100%',
                justifyContent: 'space-around',
                alignItems: 'center',
                borderWidth: 2,
                borderRadius: 25,
                borderColor: mainColor,
                backgroundColor: '#000000',
              }}>
              <View
                style={{
                  height: '40%',
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  width: '100%',
                }}>
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    fontFamily: 'Exo2-Regular',
                    fontSize: 24,
                  }}>
                  Select Origin Chain
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    width: '100%',
                  }}>
                  {chains.map((x, i) => (
                    <Pressable
                      key={i}
                      onPress={async () => {
                        this.context.setValue({
                          fromChain: x.wormholeChainId,
                        });
                        await setAsyncStorageValue({
                          fromChain: x.wormholeChainId,
                        });
                      }}
                      style={{
                        borderColor:
                          x.wormholeChainId === this.context.value.fromChain
                            ? 'white'
                            : null,
                        borderWidth: 2,
                        borderRadius: 50,
                        padding: 6,
                      }}>
                      {x.tokens[0].icon}
                    </Pressable>
                  ))}
                </View>
              </View>
              <View
                style={{
                  height: '40%',
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  width: '100%',
                }}>
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    fontFamily: 'Exo2-Regular',
                    fontSize: 24,
                  }}>
                  Select Destination Chain
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    width: '100%',
                  }}>
                  {chains.map((x, i) => (
                    <Pressable
                      key={i}
                      onPress={async () => {
                        this.context.setValue({
                          toChain: x.wormholeChainId,
                        });
                        setAsyncStorageValue({toChain: x.wormholeChainId});
                      }}
                      style={{
                        borderColor:
                          x.wormholeChainId === this.context.value.toChain
                            ? 'white'
                            : null,
                        borderWidth: 2,
                        borderRadius: 50,
                        padding: 6,
                      }}>
                      {x.tokens[0].icon}
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable
                onPress={() => this.setState({chainSelectorVisible: false})}
                style={[GlobalStyles.buttonStyle, {marginBottom: 12}]}>
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    fontFamily: 'Exo2-Regular',
                    fontSize: 24,
                  }}>
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <Modal
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          }}
          visible={this.state.usdcVisible}
          transparent={true}
          animationType="slide">
          <View
            style={{
              height: Dimensions.get('window').height,
              width: Dimensions.get('window').width,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
            }}>
            <View
              style={{
                marginTop: Dimensions.get('window').height * 0.35,
                height: Dimensions.get('window').height * 0.3,
                width: '100%',
                justifyContent: 'space-around',
                alignItems: 'center',
                borderWidth: 2,
                borderRadius: 25,
                borderColor: mainColor,
                backgroundColor: '#000000',
              }}>
              <Text style={GlobalStyles.formTitleCard}>USDC Amount</Text>
              <View
                style={{
                  width: Dimensions.get('screen').width,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                }}>
                <View style={{width: '100%'}}>
                  <TextInput
                    onPressOut={() =>
                      this.scrollView.scrollToEnd({animated: true})
                    }
                    onChange={() =>
                      this.scrollView.scrollToEnd({animated: true})
                    }
                    onFocus={() =>
                      this.scrollView.scrollToEnd({animated: true})
                    }
                    style={[GlobalStyles.input]}
                    keyboardType="decimal-pad"
                    value={this.state.amount}
                    onChangeText={amount => {
                      this.setState({amount});
                    }}
                  />
                </View>
              </View>
              <Pressable
                onPress={() => {
                  this.setState({usdcVisible: false});
                  this.scrollView.scrollToEnd({animated: true});
                }}
                style={[GlobalStyles.buttonStyle, {marginBottom: 12}]}>
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    fontFamily: 'Exo2-Regular',
                    fontSize: 24,
                  }}>
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <Text
          style={{
            position: 'absolute',
            top: header,
            height: 40,
            fontSize: 16,
            color: 'white',
            textAlign: 'center',
          }}>
          {'To: '}
          <BaseName
            address={this.props.route.params?.address}
            inline={true}
            style={{
              fontSize: 16,
              color: 'white',
              textAlign: 'center',
            }}
          />
        </Text>
        <ScrollView
          ref={view => {
            this.scrollView = view;
          }}
          showsVerticalScrollIndicator={false}
          style={{
            height: main,
            width: Dimensions.get('window').width,
            marginTop: header,
          }}
          contentContainerStyle={[
            {
              alignItems: 'center',
              width: '100%',
              height: 'auto',
              paddingHorizontal: 10,
            },
          ]}>
          {messages.map((message, i, array) => {
            let flag = false;
            let crosschainFlag = false;
            if (i !== 0) {
              flag = message.from !== array[i - 1].from;
              crosschainFlag = message.fromChainId !== message.toChainId;
            }
            const isSenderWallet = Object.keys(this.context.value.wallets).some(
              x =>
                this.context.value.wallets[x].address.toLowerCase() ===
                message.from.toLowerCase(),
            );
            return (
              <LinearGradient
                angle={90}
                useAngle={true}
                key={i}
                style={{
                  marginTop: flag ? 15 : 5,
                  borderRadius: 10,
                  borderBottomRightRadius: isSenderWallet ? 0 : 10,
                  borderBottomLeftRadius: isSenderWallet ? 10 : 0,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  maxWidth: '80%',
                  alignSelf: isSenderWallet ? 'flex-end' : 'flex-start',
                }}
                colors={[
                  isSenderWallet
                    ? colorByWChainId[message.fromChainId] + 'cc'
                    : colorByWChainId[message.fromChainId] + '40',
                  isSenderWallet
                    ? colorByWChainId[message.toChainId] + 'cc'
                    : colorByWChainId[message.toChainId] + '40',
                ]}>
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'justify',
                    marginBottom: 10,
                    fontSize: 16,
                  }}>
                  {message.message}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}>
                  {message.amount > 0 ? (
                    <Text style={{color: 'white', fontSize: 12}}>
                      {message.amount} USDC {crosschainFlag ? 'with CCTP' : ''}
                    </Text>
                  ) : (
                    <View />
                  )}
                  <Text
                    style={{
                      color: '#cccccc',
                      alignSelf: 'flex-end',
                      fontSize: 12,
                      marginRight: -10,
                      marginBottom: -5,
                    }}>
                    {new Date(message.blocktime).toLocaleTimeString()}
                  </Text>
                </View>
              </LinearGradient>
            );
          })}
        </ScrollView>
        {parseFloat(this.state.amount ?? '0') > 0 && (
          <View
            style={{
              marginTop: 14,
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
            }}>
            <Text style={{color: 'white', fontSize: 20}}>
              Amount Transferred: {this.state.amount} USDC
            </Text>
            {USDCicon}
          </View>
        )}
        <View
          style={[
            {
              height: 'auto',
              width: '100%',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 10,
            },
          ]}>
          <Pressable
            onPress={() => this.setState({usdcVisible: true})}
            style={{
              width: '10%',
              height: 'auto',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: mainColor,
              borderRadius: 50,
              aspectRatio: 1,
              marginBottom: 5,
            }}>
            <FontAwesome name="dollar" size={22} color="white" />
          </Pressable>
          <Pressable
            onPress={() => this.setState({chainSelectorVisible: true})}
            style={{
              width: '10%',
              height: 'auto',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: mainColor,
              borderRadius: 50,
              aspectRatio: 1,
              marginBottom: 5,
            }}>
            <Ionicons name="settings-sharp" size={22} color="white" />
          </Pressable>
          <TextInput
            onPressOut={() => this.scrollView.scrollToEnd({animated: true})}
            onChange={() => this.scrollView.scrollToEnd({animated: true})}
            onFocus={() => this.scrollView.scrollToEnd({animated: true})}
            multiline
            onContentSizeChange={async event => {
              if (event.nativeEvent.contentSize.height < 120) {
                await this.setStateAsync({
                  inputHeight: event.nativeEvent.contentSize.height,
                });
                this.scrollView.scrollToEnd({animated: true});
              }
            }}
            style={[
              GlobalStyles.inputChat,
              {
                height: this.state.inputHeight,
              },
            ]}
            keyboardType="default"
            value={this.state.message}
            onChangeText={value => {
              this.setState({message: value});
            }}
          />
          <Pressable
            onPress={async () => {
              await this.sendMessage();
            }}
            style={{
              width: '10%',
              height: 'auto',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: mainColor,
              borderRadius: 50,
              aspectRatio: 1,
              marginBottom: 5,
            }}>
            <Ionicons name="send" size={22} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}
