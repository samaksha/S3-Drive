import {EventEmitter} from '@angular/core';

export class Emitters {
  static authEmitter = new EventEmitter<boolean>();
  static reloadEmitter = new EventEmitter<boolean>();
}
