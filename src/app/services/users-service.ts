import { Injectable } from '@angular/core';
import { Backend } from '../model/api';
import { HttpClient } from '@angular/common/http';
import { User } from '../model/user';
import { Auth } from '../model/auth';

const base_url = Backend.api + '/user';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  user: User | null = null;

  constructor(private http: HttpClient) { }

  verifyPassword(user: Auth) {
    return this.http.post(base_url + `/verifyPassword`, user, { withCredentials: true, responseType: 'text' });
  }

  changePassword(user: Auth) {
    return this.http.put(base_url + `/changePassword`, user, { withCredentials: true, responseType: 'text' });
  }

  registerUser(user: User) {
    return this.http.post(base_url + `/register`, user, { withCredentials: true, responseType: 'text' });
  }

  getUser(username: string) {
    return this.http.get<User>(base_url + `/getUser/${username}`, { withCredentials: true });
  }

  getUserByDni(dni: string) {
    return this.http.get<User>(base_url + `/getUserByDni/${dni}`, { withCredentials: true });
  }

  updateUser(user: User) {
    return this.http.put(base_url + `/updateUser`, user, { withCredentials: true, responseType: 'text' });
  }

  deleteUser(username: string) {
    return this.http.delete(base_url + `/deleteUserByUsername/${username}`, { withCredentials: true, responseType: 'text' });
  }

  getAllUsers() {
    return this.http.get<User[]>(base_url + `/getUsers`, { withCredentials: true });
  }

  getAllUsersByCodred(codred: string) {
    return this.http.get<User[]>(base_url + `/getUserByCodred/${codred}`, { withCredentials: true });
  }


}
