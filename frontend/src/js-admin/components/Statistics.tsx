'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');
let D3 = require('react-d3-basic');

import editable = require('./editables');
import D3ChartWrapper from './D3ChartWrapper';

import {IRawStatistic} from '../../../../backend/src/statistics';

export interface IStatisticsProps {
  production_id: number;
}

export interface IStatisticsState {
  // production_id: number;
  statistics: IRawStatistic[];
}

// this is a 'hacky' way, but works for stuff that consists of objects, arrays, strings and numbers
function almostDeepClone<T extends {}>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default class Statistics extends React.Component<IStatisticsProps, IStatisticsState> {
  constructor() {
    super();
    this.state = {statistics: null/*, production_id: 1*/};
  }

  componentWillMount() {
    $.getJSON('admin-api/stats/' + this.props.production_id, (resp: IRawStatistic[]) => {
      this.setState({statistics: resp});
    });
  }

  render() {
    if (!this.state.statistics) {
      return (<div></div>);
    }

    var byShowSeries = [{
      field: 'revenue',
      name: 'Revenue'
    }];

    var t1 = _.groupBy(this.state.statistics, 'date');
    var t2 = _.mapObject(t1, (v, k) => _.mapObject(_.indexBy(v, 'title'), (vv, kk) => vv.revenue));
    var t3 = _.values(_.mapObject(t2, (v: any, k) => { v.date = k; return v; }));

    // FIND OUT unique show names
    var titles = _.chain(t2).map((o) => _.keys(o)).flatten().unique().without('date').sortBy((v) => v).value();
    var hkiColors = ['#ff0000', '#dd0000', '#bb0000', '#990000', '#770000', '#550000', '#330000', '#110000', '#000000'];
    var series = _.map(titles, (title, idx) => ({field: title, name: title, color: title.indexOf('Helsinki') === 0 ? hkiColors[idx] : null}));

    // FILL t3 so that all dates have revenue values for all shows
    for (var i = 0; i < t3.length; ++i) {
      for (var j = 0; j < titles.length; ++j) {
        t3[i][titles[j]] = (t3[i][titles[j]] ? t3[i][titles[j]] : 0);
      }
    }

    // CALCULATE cumulative sums per show from t3
    var t4 = new Array();
    t4[0] = {};
    for (i = 0; i < titles.length; ++i) {
      t4[0][titles[i]] = (t3[0][titles[i]] ? t3[0][titles[i]] : 0);
    }
    t4[0].date = t3[0].date;
    for (i = 1; i < t3.length; ++i) {
      t4[i] = _.mapObject(t4[i - 1], (v, t) => v + (t3[i][t] ? t3[i][t] : 0));
      t4[i].date = t3[i].date;
    }

    var byShow = _.sortBy(_.map(_.omit(t4[t4.length - 1], 'date'), (v, k) => ({ title: k, revenue: v})), 'title');

    return (
      <div>
        <h3>Kokonaistuotto / näytös</h3>
        <D3ChartWrapper id={this.props.production_id + '-cumrevenue'}
          data={byShow} chartSeries={byShowSeries}
          x={(d) => d.title.substr(0, 14)} xScale={'ordinal'} showXGrid={false} >
          <D3.BarChart />
        </D3ChartWrapper>
        <br />
        <h3>Kumulatiivinen tuotto / näytös</h3>
        <D3ChartWrapper id={this.props.production_id + 'cumrevenue-timeseries'}
          data={t4} chartSeries={series}
          x={(d) => new Date(d.date)} xScale={'time'} xLabel={'Date'} >
          <D3.LineChart />
        </D3ChartWrapper>
        <br />
        <h3>Tuotto / päivä</h3>
        <D3ChartWrapper id={this.props.production_id + 'revenue-timeseries'}
          data={t3} chartSeries={series}
          x={(d) => d.date.substr(5,10)} xScale={'ordinal'} xLabel={'Date'} >
          <D3.BarStackChart />
        </D3ChartWrapper>
      </div>
    );
  }

}
