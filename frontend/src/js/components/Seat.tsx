'use strict';

import React = require('react');
import {ISeat} from '../../../../backend/src/venue';

// NOTE: when adding stuff to ISeatProps, check if it needs to be added to shouldComponentUpdate also.
export interface ISeatProps extends React.Props<any> {
  prices: number[];
  priceClass: string;
  rowName: string;
  status: string;
  seat: ISeat;

  onClick: any;
}

var toTitleCase = function(str: string) {
  return str[0].toUpperCase() + str.substr(1);
};

export default class Seat extends React.Component<ISeatProps, any> {
  shouldComponentUpdate(nextProps: ISeatProps, nextState: any) {
    // this seems to make things actually faster on Lumia925 + Edge, and does not seem to break anything
    return nextProps.status !== this.props.status || nextProps.onClick !== this.props.onClick;
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
          top: this.props.seat.y_coord,
          left: this.props.seat.x_coord
        }}
        title={text}>
      </a>
    );
  }

}
