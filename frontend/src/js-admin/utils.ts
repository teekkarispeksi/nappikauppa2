export function ISOToDateString(ISOString: string) {
  var dateObj = new Date(ISOString);
  return dateObj.getDate() + '.' + dateObj.getMonth();
}
