import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';
import { User } from '../model/user';
import { Auth } from '../model/auth';

const base_url = BackendCredentials.api + '/user';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  user: User | null = null;

  constructor(private http: HttpClient) {}

  verifyPassword(user: Auth) {
    const url = base_url + `/verifyPassword`;
    return this.http.post(url, user, { withCredentials: true, responseType: 'text' });
  }

  changePassword(user: Auth) {
    const url = base_url + `/changePassword`;
    return this.http.put(url, user, { withCredentials: true, responseType: 'text' });
  }

  registerUser(user: User) {
    const url = base_url + '/register';
    const endpoint = `${url}`;
    return this.http.post(endpoint, user, { withCredentials: true, responseType: 'text' });
  }

  getUser(username: string) {
    const url = base_url + `/getInfoUser/${username}`;
    return this.http.get<User>(url, { withCredentials: true });
  }

  updateUser(user: User) {
    const url = base_url + '/updateUser';
    return this.http.put(url, user, { withCredentials: true, responseType: 'text' });
  }

  deleteUser(username: string) {
    const url = base_url + `/deleteUserByUsername/${username}`;
    return this.http.delete(url, { withCredentials: true, responseType: 'text' });
  }

  getAllUsers() {
    const url = base_url + `/getUsers`;
    return this.http.get<User[]>(url, { withCredentials: true });
  }
}
