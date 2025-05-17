import React, {Component} from 'react';
import {Text} from 'react-native';
import {getBasename} from '../utils/utils';

export default class BaseName extends Component {
  constructor(props) {
    super(props);
    this.state = {
      baseName: this.props.address,
    };
  }

  async componentDidMount() {
    const res = await getBasename(this.props.address);
    this.setState({baseName: res});
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.address !== this.props.address) {
      const res = await getBasename(this.props.address);
      this.setState({baseName: res});
    }
  }
  render() {
    return (
      <Text style={this.props.style}>
        {this.props.extraText && this.props.extraText}
        {this.state.baseName.indexOf('0x') !== 0
          ? this.state.baseName
          : this.props.inline
          ? this.props.address.substring(0, 12) +
            '...' +
            this.props.address.substring(this.props.address.length - 10)
          : this.props.address.substring(0, 21) +
            '\n' +
            this.props.address.substring(21)}
      </Text>
    );
  }
}
