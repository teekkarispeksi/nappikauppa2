'use strict';

export function ISOToDateString(ISOString: string) {
  var dateObj = new Date(ISOString);
  var month = dateObj.getMonth() + 1;
  return dateObj.getDate() + '.' + month;
}
