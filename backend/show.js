var shows = [
  {
    id: 0, // 1
    title : 'Enskari', // 'Enskari'
    date: '2015-03-01 19:00', // '2015-03-01 19:00'
    status: 'ON_SALE', // INACTIVE, ON_SALE, SOLD_OUT, AT_DOORS_ONLY
    location: 'Aleksanterin teatteri, Helsinki', // 'Aleksanterin teatteri, Helsinki'
  },
  {
    id: 1, // 1
    title : 'Toiskari', // 'Enskari'
    date: '2015-03-02 19:00', // '2015-03-01 19:00'
    status: 'ON_SALE', // INACTIVE, ON_SALE, SOLD_OUT, AT_DOORS_ONLY
    location: 'Gloria, Helsinki', // 'Aleksanterin teatteri, Helsinki'
  }
];

var show = {


  getAll: function () {
    return shows;
  },

  get: function (showid) {
    return shows[showid];
}};

module.exports = show;
