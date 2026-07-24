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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
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
      error: () => { },
    });

    // Capturar el mensaje de sesión expirada desde los parámetros de URL
    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.sessionExpiredMessage = params['message'];
        console.log('Mensaje de sesión expirada recibido:', params['message']);

        // Ocultar el mensaje después de 8 segundos
        setTimeout(() => {
          this.sessionExpiredMessage = '';
        }, 8000);
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

    if (this.loginForm.valid) {
      const user: Auth = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
      };
      this.authloginService.login(user).subscribe({
        next: () => {
          this.routeLogger.logLogin();
          this.usersService.getUser(user.username).subscribe({
            next: (data) => {
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
              this.loginForm.reset();
              this.router.navigate(['/home'], {
                state: { surveyReminder: '1' },
              });
            },
          });
        },
        error: (error) => {
          console.error('Error de autenticación:', error);
          alert('Credenciales incorrectas. Por favor, inténtelo de nuevo.');
        },
      });
    } else {
      alert('Ingrese todos los datos');
    }
  }

  changePasswordFirstTime() {
    if (this.changePasswordForm.valid && this.tempUserDto) {
      const newPassword = this.changePasswordForm.value.newPassword;
      const confirmPassword = this.changePasswordForm.value.confirmPassword;

      if (newPassword !== confirmPassword) {
        alert('Las contraseñas no coinciden');
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
          alert('Error al cambiar la contraseña. Por favor, intente de nuevo.');
        },
      });
    } else {
      alert('Ingrese una contraseña válida (mínimo 8 caracteres).');
    }
  }

  cancelChangePassword(event: MouseEvent) {
    event.preventDefault();
    this.authloginService.logout().subscribe({
      next: () => {
        this.showChangePassword = false;
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
