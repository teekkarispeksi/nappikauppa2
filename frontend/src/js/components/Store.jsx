'use strict';

var React = require('react');

var ShowSelector = require('./ShowSelector.jsx');
var SeatSelector = require('./SeatSelector.jsx');
var ShoppingCart = require('./ShoppingCart.jsx');
var Contacts = require('./Contacts.jsx');

var Shows = require('../collections/shows.js');

var Router = require('../router.js');

var Store = React.createClass({
  shows: new Shows(),

  getInitialState: function() {
    return {page: 'home', showid: this.props.showid, show: null, selectedSeats: []};
  },

  componentWillMount: function() {
    this.shows.fetch({
      success: function(collection, response, options) {
        if (this.state.showid) {
          this.setState({page: 'seats', show: this.shows.get(this.state.showid)});
        }

        this.forceUpdate();
      }.bind(this)
    });
  },

  onShowSelect: function(showid) {
    this.setState({
      page: 'seats',
      showid: showid,
      show: this.shows.get(showid),
      selectedSeats: []
    });
    Router.navigate('show/' + showid, {trigger: false});
  },

  onSeatClicked: function(seat) {
    var seats = this.state.selectedSeats;
    var indx = seats.indexOf(seat);
    if (indx < 0) {
      seats.push(seat);
    } else {
      seats.splice(indx, 1);
    }
    this.setState({selectedSeats: seats});
  },

  helpText: (<div className='shopping-stage help-text'>
    <h4>Tervetuloa katsomaan Suomen suurinta opiskelijamusikaalia!</h4>
    Mikäli koet ongelmia lippukaupan toiminnassa, voit ottaa yhteyttä lipunmyyntivastaavaan osoitteessa liput@teekkarispeksi.fi.
  </div>),

  render: function() {
    var seatSelectorElem, shoppingCartElem, contactsElem;

    if (this.state.page === 'home') {
      seatSelectorElem = this.helpText;
    } else if (this.state.page === 'seats') {
      // for now everything is displayed when a show is selected - maybe be more gradual?
      seatSelectorElem = <SeatSelector onSeatClicked={this.onSeatClicked} show={this.state.show} selectedSeats={this.state.selectedSeats} />;
      shoppingCartElem = <ShoppingCart selectedSeats={this.state.selectedSeats} />;
      contactsElem = <Contacts />;
    }

    return (
      <div>
        <ShowSelector onShowSelect={this.onShowSelect} shows={this.shows} />
        {seatSelectorElem}
        {shoppingCartElem}
        {contactsElem}
      </div>
    );
  }

});

module.exports = Store;
