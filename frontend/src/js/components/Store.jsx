var React = require('react');

var ShowSelector = require('./ShowSelector.jsx');
var SeatSelector = require('./SeatSelector.jsx');

var Shows = require('../collections/shows.js');

var Router = require('../router.js');

var Store = React.createClass({
  shows: new Shows(),

  getInitialState: function () {
    return {showid: this.props.showid, show: null};
  },

  componentWillMount: function () {
    this.shows.fetch({
      success: function(collection, response, options) {
        if(this.state.showid !== null) {
          this.setState({show: this.shows.get(this.state.showid)});
        }

        this.forceUpdate();
      }.bind(this)
    });
  },

  onShowSelect: function (showid) {
    this.setState({showid: showid, show: this.shows.get(showid)});
    Router.navigate('show/'+showid, {trigger: false});
  },

  helpText: (<div><span>
    <h4>Tervetuloa katsomaan Suomen suurinta opiskelijamusikaalia!</h4>
    Mikäli koet ongelmia lippukaupan toiminnassa, voit ottaa yhteyttä lipunmyyntivastaavaan osoitteessa liput@teekkarispeksi.fi.
  </span></div>),

  render: function () {
    return (
      <div>
        <ShowSelector onShowSelect={this.onShowSelect} shows={this.shows} />
        <div className="main-area">{(this.state.show) ? <SeatSelector show={this.state.show} /> : this.helpText}</div>
      </div>
    );
  }

});

module.exports = Store;
