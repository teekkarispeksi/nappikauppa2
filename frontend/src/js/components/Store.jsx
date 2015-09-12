var React = require('react');

var ShowSelector = require('./ShowSelector.jsx');
var SeatSelector = require('./SeatSelector.jsx');

var Shows = require('../collections/shows.js');

var Router = require('../router.js');

var Store = React.createClass({
  shows: new Shows(),

  getInitialState: function () {
    return {page: "home", showid: this.props.showid, show: null};
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
    this.setState({page: "seats", showid: showid, show: this.shows.get(showid)});
    Router.navigate('show/'+showid, {trigger: false});
  },

  onSeatsSelected: function (seats) {
    this.setState({page: "info", selectedSeats: seats.filter(function(seat) {return seat.selected; })});
  },

  helpText: (<div><span>
    <h4>Tervetuloa katsomaan Suomen suurinta opiskelijamusikaalia!</h4>
    Mikäli koet ongelmia lippukaupan toiminnassa, voit ottaa yhteyttä lipunmyyntivastaavaan osoitteessa liput@teekkarispeksi.fi.
  </span></div>),

  render: function () {
    var pageEl;
    if (this.state.page == "seats") {
      pageEl = <SeatSelector onSeatsSelected={this.onSeatsSelected} show={this.state.show} />;
    } else if (this.state.page == "info") {
      pageEl = <span>Gimme your address!</span>;
    } else {
      pageEl = this.helpText;
    }

    return (
      <div>
        <ShowSelector onShowSelect={this.onShowSelect} shows={this.shows} />
        <div className="main-area">{pageEl}</div>
      </div>
    );
  }

});

module.exports = Store;
