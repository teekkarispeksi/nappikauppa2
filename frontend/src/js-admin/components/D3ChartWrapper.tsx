'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');
let D3 = require('react-d3-basic');

export interface ID3ChartWrapperProps extends React.Props<D3ChartWrapper> {
  chartSeries: {field: string, name: string, color?: string, hidden?: boolean}[];
  data: any[];
  id: string;
  width?: number;
  height?: number;
  x?: any;
  xScale?: string;
  xLabel?: string;
  showXGrid?: boolean;
}

export interface ID3ChartWrapperState {
  height: number;
  max: number;
  seriesOptions: {selected: boolean}[];
  width: number;

}

export default class D3ChartWrapper extends React.Component<ID3ChartWrapperProps, ID3ChartWrapperState> {

  constructor(props: ID3ChartWrapperProps) {
      super(props);
      var state = JSON.parse(localStorage.getItem(props.id));
      if (!state) {
        state = {
          seriesOptions: props.chartSeries.map(s => ({selected: true})),
          height: props.height ? props.height : 300,
          width: props.width ? props.width : 1000,
          max: null
        };
      }
      this.state = state;
  }

  render() {
    localStorage.setItem(this.props.id, JSON.stringify(this.state));
    var series = this.props.chartSeries.filter((v, i) => this.state.seriesOptions[i].selected);
    return (
      <div>
        <div>
          <span className='label-input'>
            <label htmlFor='max'>Y Max</label>
            <input type='number' name='max' value={this.state.max} onChange={(event) => this.setState({max: parseInt(event.currentTarget.value)})} />
          </span>
          <span className='label-input'>
            <label htmlFor='width'>Leveys</label>
            <input type='number' name='width' value={this.state.width} onChange={(event) => this.setState({width: parseInt(event.currentTarget.value)})} />
          </span>
          <span className='label-input'>
            <label htmlFor='height'>Korkeus</label>
            <input type='number' name='height' value={this.state.height} onChange={(event) => this.setState({height: parseInt(event.currentTarget.value)})} />
          </span>
        </div>
        <div>
          {_.map(this.props.chartSeries, (s, idx) =>
            <span className='label-input'>
              <label htmlFor={s.field}>{s.name}</label>
            <input type='checkbox' name={s.field} checked={this.state.seriesOptions[idx].selected} onChange={() => {
              this.state.seriesOptions[idx].selected = !this.state.seriesOptions[idx].selected;
              this.forceUpdate();
            }} />
            </span>
          )}
        </div>
        {React.cloneElement(this.props.children as React.ReactElement<any>, { // don't ask, the cast just works
          data: this.props.data,
          chartSeries: series,
          width: this.state.width,
          height: this.state.height,
          x: this.props.x,
          xScale: this.props.xScale,
          xLabel: this.props.xLabel,
          showXGrid: this.props.showXGrid,
          yDomain: this.state.max ? [0, this.state.max] : null})}
      </div>
    );
  }
}
