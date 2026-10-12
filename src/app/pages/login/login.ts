import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthLogin } from '../../services/usuario/auth-login';
import { AuthService } from '../../services/usuario/auth-service';
import { RouteLogger } from '../../services/route-logger';
import { UsersService } from '../../services/usuario/users-service';
import { Auth } from '../../model/user';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  public loginForm!: FormGroup;
  public changePasswordForm!: FormGroup;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showChangePassword = false;
  isUpdatingPassword = false;
  tempUserDto: any = null;

  isLoggingIn = false;
  loginError = '';
  loginSubmitted = false;
  changePasswordError = '';
  changePasswordSubmitted = false;

  sessionExpiredMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authloginService: AuthLogin,
    private authService: AuthService,
    private usersService: UsersService,
    private router: Router,
    private route: ActivatedRoute,
    private routeLogger: RouteLogger,
  ) { }

  ngOnInit(): void {
    // Si la sesión de api_token sigue activa, redirigir al home.
    this.authloginService.apiToken().subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      // sin sesión válida: borrar cualquier dato que haya quedado de una sesión anterior
      error: () => this.authService.clearSession(),
    });

    // Capturar el mensaje de sesión expirada desde los parámetros de URL
    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        // Se mantiene visible hasta que el usuario vuelva a intentar ingresar o lo cierre.
        this.sessionExpiredMessage = params['message'];
      }
    });

    this.reactiveForm();
  }

  reactiveForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.changePasswordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  /** Muestra el error de un campo del login solo tras intentar enviar o tocarlo. */
  loginFieldInvalid(name: string): boolean {
    const c = this.loginForm.get(name);
    return !!c && c.invalid && (c.touched || this.loginSubmitted);
  }

  dismissSessionMessage(): void {
    this.sessionExpiredMessage = '';
  }

  // ---- Cambio de contraseña (primer ingreso) ----
  get newPasswordValue(): string {
    return this.changePasswordForm?.get('newPassword')?.value ?? '';
  }

  get passwordStrength(): number {
    const v = this.newPasswordValue;
    if (!v) return 0;
    if (v.length < 8) return 1;
    let score = 1;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return Math.min(score, 4);
  }

  get passwordStrengthLabel(): string {
    return ['', 'Muy débil', 'Débil', 'Aceptable', 'Robusta'][this.passwordStrength];
  }

  get passwordsMismatch(): boolean {
    const confirm = this.changePasswordForm?.get('confirmPassword')?.value ?? '';
    return !!confirm && confirm !== this.newPasswordValue;
  }

  get passwordsMatch(): boolean {
    const confirm = this.changePasswordForm?.get('confirmPassword')?.value ?? '';
    return !!confirm && confirm === this.newPasswordValue;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  login() {
    this.sessionExpiredMessage = '';
    this.loginError = '';
    this.loginSubmitted = true;

    if (this.loginForm.valid) {
      this.isLoggingIn = true;
      const user: Auth = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
      };
      this.authloginService.login(user).subscribe({
        next: () => {
          this.routeLogger.logLogin();
          this.usersService.getUser(user.username).subscribe({
            next: (data) => {
              this.isLoggingIn = false;
              if (data && data.firstLogin) {
                this.tempUserDto = data;
                this.showChangePassword = true;
              } else {
                this.authService.setCurrentUser(data);
                this.loginForm.reset();
                this.router.navigate(['/home'], {
                  state: { surveyReminder: '1' },
                });
              }
            },
            error: () => {
              this.isLoggingIn = false;
              this.loginForm.reset();
              this.router.navigate(['/home'], {
                state: { surveyReminder: '1' },
              });
            },
          });
        },
        error: (error) => {
          console.error('Error de autenticación:', error);
          this.isLoggingIn = false;
          this.loginError = error?.status === 0
            ? 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
            : 'Usuario o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.';
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  changePasswordFirstTime() {
    this.changePasswordError = '';
    this.changePasswordSubmitted = true;
    if (this.changePasswordForm.valid && this.tempUserDto) {
      const newPassword = this.changePasswordForm.value.newPassword;
      const confirmPassword = this.changePasswordForm.value.confirmPassword;

      if (newPassword !== confirmPassword) {
        return;
      }

      this.isUpdatingPassword = true;
      const authData: Auth = {
        username: this.tempUserDto.username,
        password: newPassword,
      };

      this.usersService.changePassword(authData).subscribe({
        next: () => {
          this.isUpdatingPassword = false;
          this.tempUserDto.firstLogin = false;
          this.authService.setCurrentUser(this.tempUserDto);

          this.loginForm.reset();
          this.changePasswordForm.reset();
          this.showChangePassword = false;
          this.tempUserDto = null;

          this.router.navigate(['/home'], {
            state: { surveyReminder: '1' },
          });
        },
        error: (err) => {
          this.isUpdatingPassword = false;
          console.error('Error al cambiar contraseña:', err);
          this.changePasswordError = 'No se pudo cambiar la contraseña. Inténtalo de nuevo.';
        },
      });
    } else {
      this.changePasswordForm.markAllAsTouched();
    }
  }

  cancelChangePassword(event: MouseEvent) {
    event.preventDefault();
    this.authloginService.logout().subscribe({
      next: () => {
        this.showChangePassword = false;
        this.changePasswordSubmitted = false;
        this.changePasswordError = '';
        this.tempUserDto = null;
        this.loginForm.reset();
        this.changePasswordForm.reset();
      },
      error: (err) => {
        console.error('Error al cerrar sesión durante cancelación:', err);
        this.showChangePassword = false;
        this.tempUserDto = null;
        this.loginForm.reset();
        this.changePasswordForm.reset();
      }
    });
  }
}
