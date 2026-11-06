import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { Router } from '@angular/router';
import { User } from '../types/user';
import { version } from '../../../package.json';

// Name sent to the backend so that a session created by another application
// served on the same origin (doctor / patient) is not reused by the admin app.
export const CLIENT_APP = 'admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public currentUserSubject: BehaviorSubject<any>;
  private loggedIn: Subject<User> = new Subject();
  public currentUser: Observable<User>;

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(sessionStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  public loggedInSub() {
    return this.loggedIn;
  }
  login(token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.http
      .get<any>(`${environment.api}/current-user?app=${CLIENT_APP}`, { headers })
      .pipe(
        map((res) => {
          if (res.user && res.user.token && res.user.role !== 'admin') {
            this.logoutServerSession();
            throw new Error('admin only');
          }
          if (res.user && res.user.token) {
            sessionStorage.setItem('currentUser', JSON.stringify(res.user));
            this.currentUserSubject.next(res.user);
            return res.user;
          }
        })
      );
  }

  loginLocal(email, password) {
    return this.http
      .post<any>(`${environment.api}/login-local`, { email, password, _version: version, _app: CLIENT_APP })
      .pipe(
        map((res) => {
          if (res.user && res.user.token) {
            if (res.user.role && res.user.role != 'admin') {
              // the backend opened a session for a non-admin user: close it
              this.logoutServerSession();
              return res.user;
            }
            sessionStorage.setItem('currentUser', JSON.stringify(res.user));
            this.currentUserSubject.next(res.user);
            return res.user;
          } else {
            return res;
          }
        })
      );
  }

  loginSms(smsVerificationCode: string, user: string) {
    return this.http.post<any>(`${environment.api}/login-sms`, { smsVerificationCode, user });
  }

  login2FA(localLoginToken, smsLoginToken, user) {
    let opts = {};
    if (!environment.production) {
      opts = { withCredentials: true };
    }

    return this.http.post<any>(`${environment.api}/login-2fa`, { localLoginToken, smsLoginToken, user, _app: CLIENT_APP }, opts).pipe(
      map((res) => {
        if (res.user && res.user.token && res.user.role !== 'admin') {
          this.logoutServerSession();
          throw new Error('admin only');
        }
        if (res.user && res.user.token) {
          sessionStorage.setItem('currentUser', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          return res.user;
        }
      })
    );
  }

  logout() {
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    // Also close the admin user of the server session (the cookie is shared
    // with the doctor/patient apps, which stay logged in).
    this.logoutServerSession();
    this.router.navigate(['/login']);
  }

  logoutServerSession() {
    this.http.get(`${environment.api}/logout?app=${CLIENT_APP}`, { withCredentials: true }).subscribe(
      () => {},
      () => {}
    );
  }

  getToken() {
    return this.currentUserSubject.value.token;
  }

  getConfig() {
    return this.http.get<any>(`${environment.api}/config`);
  }
}
