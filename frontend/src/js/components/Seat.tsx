import EventHandler = __React.EventHandler;
;
'use strict';

import React = require('react');
import _ = require('underscore');
import {ISeat} from "../models/seat"
import Props = __React.Props;

export interface ISeatProps extends Props<any> {
  prices: number[];
  priceClass: string;
  rowName: string;
  status: string;
  seat: ISeat;

  onClick: any;
}

var toTitleCase = function(str) {
  return str[0].toUpperCase() + str.substr(1);
};

export default class Seat extends React.Component<ISeatProps, any> {
  shouldComponentUpdate(nextProps, nextState) {
    // this seems to make things actually faster on Lumia925 + Edge, and does not seem to break anything
    return nextProps.status !== this.props.status;
  }

  render() {

    var text: string;
    var onClick = this.props.onClick;

    var prices = this.props.prices.join('/');
    if (this.props.status === 'reserved' || this.props.status === 'conflict') {
      onClick = null;
      text = 'Tämä paikka on valitettavasti jo varattu.';
    } else {
      text = toTitleCase(this.props.rowName) + ' ' + this.props.seat.row + '\nPaikka ' + this.props.seat.number + '\nHinta ' + prices + ' eur';
    }

    return (
      <a onClick={onClick}
        className={'seat seat-' + this.props.status + ' ' + this.props.priceClass}
        key={this.props.seat.id}
        data-id={this.props.seat.id}
        style={{
          top: parseInt(this.props.seat.y_coord),
          left: parseInt(this.props.seat.x_coord)
        }}
        title={text}>
      </a>
    );
  }

}
