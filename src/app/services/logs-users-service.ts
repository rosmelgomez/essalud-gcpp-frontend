import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/log';

@Injectable({
  providedIn: 'root',
})
export class LogsUsersService {
  constructor(private http: HttpClient) {}

  getLogs() {
    return this.http.get<any[]>(base_url + '/getlogusers', { withCredentials: true });
  }
}
