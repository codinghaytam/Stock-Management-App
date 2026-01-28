import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, tap } from 'rxjs';
import { Api } from '../api/api';
import { login } from '../api/fn/authentification/login';
import { signup } from '../api/fn/authentification/signup';
import { logout } from '../api/fn/authentification/logout';
import { LoginRequest, SignupRequest, LoginResponse } from '../api/models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<LoginResponse | null>;
  public currentUser$: Observable<LoginResponse | null>;

  constructor(
    private api: Api,
    private router: Router
  ) {
    let parsedUser = null;
    if (typeof sessionStorage !== 'undefined') {
        const savedUser = sessionStorage.getItem('user');
        parsedUser = savedUser ? JSON.parse(savedUser) : null;
    }
    this.currentUserSubject = new BehaviorSubject<LoginResponse | null>(parsedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem('token');
    }
    return null;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return from(this.api.invoke(login, { body: credentials })).pipe(
      tap((response: LoginResponse) => {
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('user', JSON.stringify(response));
        // backend returns 'roles' in the response, we might want to store them separately or keep in 'user' obj
        if (response.roles) {
          sessionStorage.setItem('roles', JSON.stringify(response.roles));
        }
        this.currentUserSubject.next(response);
      })
    );
  }

  signup(request: SignupRequest): Observable<any> {
    return from(this.api.invoke(signup, { body: request }));
  }

  logout(): void {
    // Call backend to blacklist token
    from(this.api.invoke(logout, {})).subscribe({
      next: () => this.localLogout(),
      error: () => this.localLogout() // Logout locally even if backend fails
    });
  }

  isAuthenticated(): boolean {
    return !!this.token; // Simple check, ideally check expiration
  }

  hasRole(role: string): boolean {
    const roles = this.currentUserValue?.roles || [];
    return roles.includes(role as any);
  }

  private localLogout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('roles');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}

