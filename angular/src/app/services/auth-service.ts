import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom, map } from 'rxjs';
import {Emitters} from '../emitters/emitters';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment.serverUrl;
  }

  checkAuth(){
    this.http.get(this.baseUrl + '/user', {withCredentials: true}).subscribe(
      (res: any) => {
        console.log("auth");
        Emitters.authEmitter.emit(res);
        Emitters.reloadEmitter.emit(res);
      },
      err => {
        console.log(err);
      }
    );
  }

}
