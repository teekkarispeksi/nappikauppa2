'use strict';

import React = require('react');
import Bootstrap = require('react-bootstrap');
import Moment = require('moment-timezone');
import {IShow} from '../../../../backend/src/show';

export interface IShowSelectorProps {
  selectedShow: IShow;
  shows: IShow[];

  onShowSelect: Function;
}

export default class ShowSelector extends React.Component<IShowSelectorProps, any> {

  render() {

    return (
      <div className='shopping-stage show-selector'>
        <h2>Näytökset <small>1/5</small></h2>
        <ul className='list-unstyled'>
          {this.props.shows.map(function(show) {
            var date = new Date(show.time);
            var dateStr = date.getDate() + '.' + (date.getMonth() + 1) + '.'; // JS getMonth is zero-indexed. Go figure.
            var selectedClass = (this.props.selectedShow && this.props.selectedShow.id === show.id) ? 'selected' : '';

            var progressBar;
            var active = true;
            if (Moment(show.time) < Moment()) {
              progressBar = (<div className='sold-out'>&nbsp;</div>);
              active = false;
            } else if (show.reserved_percentage == null) {
              progressBar = (<div className='sold-out'>Ulkopuolinen lipunmyynti</div>);
            } else if (show.reserved_percentage < 100) {
              if (Moment(show.inactivate_time) < Moment()) {
                progressBar = (<div className='sold-out'>Ovimyynti</div>);
              } else {
                progressBar = (<Bootstrap.ProgressBar bsSize='small' min={0} max={100} now={show.reserved_percentage} />);
              }
            } else {
              progressBar = (<div className='sold-out'>Loppuunmyyty</div>);
            }

            return (
              <li key={show.id}>
                <a onClick={active ? this.props.onShowSelect.bind(null, show.id) : null} className={selectedClass + (active ? '' : ' inactive')}>
                  <span className='date'>{dateStr}</span><span className='title'>{show.title}</span>
                  {progressBar}
                </a>
              </li>
            );
          }.bind(this))}
        </ul>
      </div>
    );
  }

}
