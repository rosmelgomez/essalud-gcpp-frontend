import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Auth, Rol, User } from '../../model/user';
import { Backend } from '../../model/api';


const base_url = Backend.api + '/user';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  user: User | null = null;

  constructor(private http: HttpClient) { }

  verifyPassword(user: Auth) {
    return this.http.post(base_url + `/verifypassword`, user, { withCredentials: true, responseType: 'text' });
  }

  changePassword(user: Auth) {
    return this.http.put(base_url + `/changepassword`, user, { withCredentials: true, responseType: 'text' });
  }

  registerUser(user: User) {
    return this.http.post(base_url + `/register`, user, { withCredentials: true, responseType: 'text' });
  }

  getUser(username: string) {
    return this.http.get<User>(base_url + `/getbyusername/${username}`, { withCredentials: true });
  }

  getUserByDni(dni: string) {
    return this.http.get<User>(base_url + `/getbydni/${dni}`, { withCredentials: true });
  }

  updateUser(user: User) {
    return this.http.put(base_url + `/update`, user, { withCredentials: true });
  }

  deleteUser(id: number) {
    return this.http.delete(base_url + `/delete/${id}`, { withCredentials: true });
  }

  getAllUsers() {
    return this.http.get<User[]>(base_url + `/getall`, { withCredentials: true });
  }

  getUsersByCodred(codred: string) {
    return this.http.get<User[]>(base_url + `/getallbycodred/${codred}`, { withCredentials: true });
  }

  getRoles() {
    return this.http.get<Rol[]>(base_url + `/getroles`, { withCredentials: true });
  }

}
