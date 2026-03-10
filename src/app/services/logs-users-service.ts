import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/gcpp/log';

@Injectable({
  providedIn: 'root',
})
export class LogsUsersService {
  constructor(private http: HttpClient) {}

  getLogs() {
    const url = base_url + '/getlogusers';
    return this.http.get<any[]>(url, { withCredentials: true });
  }
}
