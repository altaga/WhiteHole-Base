import React, { Component } from 'react';
import { Dimensions } from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';
import { ratio } from '../../../styles/styles';

export default class QrAddress extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <QRCodeStyled
        maxSize={Dimensions.get('screen').width * (ratio > 1.7 ? 0.8 : 0.5)}
        data={this.props.address}
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
    );
  }
}
