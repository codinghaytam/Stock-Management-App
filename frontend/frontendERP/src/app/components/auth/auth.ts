import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { LoginRequest, SignupRequest } from '../../api/models';
import { Logger } from '../../services/logger';

@Component({
  selector: 'app-auth',
  standalone: false,
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  isLoginMode = true;
  showPassword = false;
  errorMessage = '';

  credentials: LoginRequest = {
    username: '',
    password: ''
  };

  signupData: SignupRequest = {
    nom: '',
    prenom: '',
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: Logger
  ) {}

  setMode(isLogin: boolean) {
    this.isLoginMode = isLogin;
    this.errorMessage = '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.errorMessage = '';
    
    if (this.isLoginMode) {
      if (!this.credentials.username || !this.credentials.password) {
        this.errorMessage = 'Please enter email and password';
        return;
      }
      
      this.authService.login(this.credentials).subscribe({
        next: () => {
          this.router.navigate(['/']); // Navigate to dashboard
        },
        error: (err) => {
          this.errorMessage = 'Login failed. Please check your credentials.';
          this.logger.error('Login failed', { username: this.credentials.username }, err);
        }
      });
    } else {
      // Signup logic
      this.signupData.email = this.credentials.username;
      this.signupData.password = this.credentials.password;

      if (!this.signupData.nom || !this.signupData.prenom || !this.signupData.email || !this.signupData.password) {
        this.errorMessage = 'All fields are required';
        return;
      }

      this.authService.signup(this.signupData).subscribe({
        next: () => {
          this.authService.login({ username: this.signupData.email, password: this.signupData.password }).subscribe({
             next: () => this.router.navigate(['/']),
             error: () => {
                 this.isLoginMode = true;
                 this.errorMessage = 'Account created. Please log in.';
                 this.logger.warn('Auto-login after signup failed', { email: this.signupData.email });
             }
          });
        },
        error: (err) => {
          this.errorMessage = 'Signup failed. Email might be in use.';
          this.logger.error('Signup failed', { email: this.signupData.email }, err);
        }
      });
    }
  }
}

