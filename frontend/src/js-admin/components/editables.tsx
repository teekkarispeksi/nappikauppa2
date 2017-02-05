import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');
import Moment = require('moment-timezone');

function _onChange(_this: any, obj: {}, field: string, event, type?: string) {
  if (type === 'number') {
    obj[field] = parseInt(event.target.value);
  } else if (type === 'select') {
    obj[field] = event.target.value;
  } else if (type === 'checkbox') {
    obj[field] = event.target.checked ? 1 : 0;
  } else if (type === 'datetime') {
    obj[field] = Moment.tz(event.target.value, 'Europe/Helsinki').format('YYYY-MM-DD HH:mm:00');
  } else if (type === 'stringList') {
    obj[field] = event.target.value.split('\n');
  } else {
    obj[field] = event.target.value;
  }
  _this.forceUpdate();
}

export function String(_this: any, obj: {}, field: string, onChange?: (_this: any, obj: {}, field: string, event, type?: string) => void) {
  if (!onChange) {
    onChange = _onChange;
  }
  return (<input type='text' value={obj[field]} onChange={(event) => onChange(_this, obj, field, event)}/>);
}

export function StringList(_this: any, obj: {}, field: string, onChange?: (_this: any, obj: {}, field: string, event, type?: string) => void) {
  if (!onChange) {
    onChange = _onChange;
  }
  return (<textarea value={obj[field] ? obj[field].join('\n') : ''} onChange={(event) => onChange(_this, obj, field, event, 'stringList')} rows={5} cols={40}/>);
}

export function Text(_this: any, obj: {}, field: string, onChange?: (_this: any, obj: {}, field: string, event, type?: string) => void) {
  if (!onChange) {
    onChange = _onChange;
  }
  return (<textarea value={obj[field]} onChange={(event) => onChange(_this, obj, field, event)} rows={5} cols={40}/>);
}

export function Select(_this: any, obj: {}, field: string, options: {value: any, name: string}[], onChange?: (_this: any, obj: {}, field: string, event, type?: string) => void) {
  if (!onChange) {
    onChange = _onChange;
  }
  return (
    <Bootstrap.FormControl componentClass='select' onChange={(event) => onChange(_this, obj, field, event, 'select')} value={obj[field]}>
      <option />
      {options.map((option) => {
        return (<option key={option.value} value={option.value}>{option.name}</option>);
      })}
    </Bootstrap.FormControl>
  );
}

export function Number(_this: any, obj: {}, field: string, onChange?: (_this: any, obj: {}, field: string, event, type?: string) => void) {
  if (!onChange) {
    onChange = _onChange;
  }
  return (<input type='number' value={obj[field]} onChange={(event) => onChange(_this, obj, field, event, 'number')}/>);
}

export function Date(_this: any, obj: {}, field: string, onChange?: (_this: any, obj: {}, field: string, event, type?: string) => void) {
  var val = Moment.tz(obj[field], 'Europe/Helsinki').format('YYYY-MM-DDTHH:mm');
  if (!onChange) {
    onChange = _onChange;
  }
  return (<input type='datetime-local' value={val} onChange={(event) => onChange(_this, obj, field, event, 'datetime')}/>);
}

export function Checkbox(_this: any, obj: {}, field: string, onChange?: (_this: any, obj: {}, field: string, event, type?: string) => void) {
  if (!onChange) {
    onChange = _onChange;
  }
  return (<input type='checkbox' checked={obj[field]} onChange={(event) => onChange(_this, obj, field, event, 'checkbox')}/>);
}
