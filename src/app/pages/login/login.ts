import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthLogin } from '../../services/auth-login';
import { Auth } from '../../model/auth';
import { UsersService } from '../../services/users-service';
import { RouteLogger } from '../../services/route-logger';
import { DataImport } from '../../services/data-import';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  public loginForm!: FormGroup;
  showPassword = false;

  sessionExpiredMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authloginService: AuthLogin,
    private usersService: UsersService,
    private router: Router,
    private route: ActivatedRoute,
    private dataImport: DataImport,
    private routeLogger: RouteLogger,
  ) {}

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirigir al home
    if (this.authloginService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

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
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
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
          this.routeLogger.logSuccessfulLogin();
          this.usersService.getUser(user.username).subscribe({
            next: (data) => {
              this.dataImport.saveUser(data);
              this.loginForm.reset();
              this.router.navigate(['/home'], {
                queryParams: { surveyReminder: '1' },
              });
            },
            error: () => {
              this.loginForm.reset();
              this.router.navigate(['/home'], {
                queryParams: { surveyReminder: '1' },
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
}
