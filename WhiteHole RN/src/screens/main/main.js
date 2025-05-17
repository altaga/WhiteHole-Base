import React, {Component} from 'react';
import {Pressable, SafeAreaView, Text, View} from 'react-native';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import IconFA5 from 'react-native-vector-icons/FontAwesome5';
import IconI from 'react-native-vector-icons/Ionicons';
import IconMI from 'react-native-vector-icons/MaterialIcons';
import IconAD from 'react-native-vector-icons/AntDesign';
import Header from '../../components/header';
import GlobalStyles, {iconSize, main, mainColor} from '../../styles/styles';
import ContextModule from '../../utils/contextModule';
import Tab1 from './tabs/tab1';
import Tab2 from './tabs/tab2';
import Tab3 from './tabs/tab3';
import Tab4 from './tabs/tab4';
import Tab5 from './tabs/tab5';

// Tabs

const BaseStateMain = {
  tab: 0, // 0
  mainHeight: main,
};

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = BaseStateMain;
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.props.navigation.addListener('focus', async () => {
      console.log(this.props.route.name);
    });
  }

  render() {
    return (
      <SafeAreaView style={[GlobalStyles.container]}>
        <Header />
        <SafeAreaView style={[GlobalStyles.main]}>
          {this.state.tab === 0 && <Tab1 navigation={this.props.navigation} />}
          {this.state.tab === 1 && <Tab2 navigation={this.props.navigation} />}
          {this.state.tab === 2 && <Tab3 navigation={this.props.navigation} />}
          {this.state.tab === 3 && <Tab4 navigation={this.props.navigation} />}
          {this.state.tab === 4 && <Tab5 navigation={this.props.navigation} />}
        </SafeAreaView>
        <View style={[GlobalStyles.footer]}>
          <Pressable
            style={GlobalStyles.selector}
            onPress={() =>
              this.setState({
                tab: 0,
              })
            }>
            <IconMI
              name="account-balance-wallet"
              size={iconSize}
              color={this.state.tab === 0 ? mainColor : 'white'}
            />
            <Text
              style={
                this.state.tab === 0
                  ? GlobalStyles.selectorSelectedText
                  : GlobalStyles.selectorText
              }>
              Wallet
            </Text>
          </Pressable>
          <Pressable
            style={GlobalStyles.selector}
            onPress={() =>
              this.setState({
                tab: 1,
              })
            }>
            <IconFA5
              name="coins"
              size={iconSize}
              color={this.state.tab === 1 ? mainColor : 'white'}
            />
            <Text
              style={
                this.state.tab === 1
                  ? GlobalStyles.selectorSelectedText
                  : GlobalStyles.selectorText
              }>
              Savings
            </Text>
          </Pressable>
          <Pressable
            style={GlobalStyles.selector}
            onPress={() =>
              this.setState({
                tab: 2,
              })
            }>
            <IconI
              name="card"
              size={iconSize}
              color={this.state.tab === 2 ? mainColor : 'white'}
            />
            <Text
              style={
                this.state.tab === 2
                  ? GlobalStyles.selectorSelectedText
                  : GlobalStyles.selectorText
              }>
              Cards
            </Text>
          </Pressable>
          <Pressable
            style={GlobalStyles.selector}
            onPress={() =>
              this.setState({
                tab: 3,
              })
            }>
            <IconIonicons
              name="chatbubbles-sharp"
              size={iconSize}
              color={this.state.tab === 3 ? mainColor : 'white'}
            />
            <Text
              style={
                this.state.tab === 3
                  ? GlobalStyles.selectorSelectedText
                  : GlobalStyles.selectorText
              }>
              Chat
            </Text>
          </Pressable>
          <Pressable
            style={GlobalStyles.selector}
            onPress={() =>
              this.setState({
                tab: 4,
              })
            }>
            <IconAD
              name="idcard"
              size={iconSize}
              color={this.state.tab === 4 ? mainColor : 'white'}
            />
            <Text
              style={
                this.state.tab === 4
                  ? GlobalStyles.selectorSelectedText
                  : GlobalStyles.selectorText
              }>
              DID
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

export default Main;
