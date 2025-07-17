import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
