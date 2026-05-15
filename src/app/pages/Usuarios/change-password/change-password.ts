import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocalStorageService } from '../../../services/local-storage-service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { UsersService } from '../../../services/usuario/users-service';
import { Auth } from '../../../model/user';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword implements OnInit {
  private _snackBar = inject(MatSnackBar);
  public changePasswordForm!: FormGroup;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private usersService: UsersService,
    private dataImport: LocalStorageService,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  toggleCurrentPassword(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  changePassword(): void {
    if (!this.changePasswordForm.valid) {
      this._snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.value;
    if (newPassword !== confirmPassword) {
      this._snackBar.open('Las contraseñas nuevas no coinciden', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const username = this.dataImport.getUser()?.username;

    // Verificar contraseña actual
    const user: Auth = {
      username: username!.toString(),
      password: currentPassword,
    };

    this.usersService.verifyPassword(user).subscribe({
      next: (resp: any) => {
        if (resp) {
          // Contraseña verificada, ahora cambiar la contraseña
          const updateUser: Auth = {
            username: username!.toString(),
            password: newPassword,
          };

          this.usersService.changePassword(updateUser).subscribe({
            next: () => {
              this._snackBar.open('Contraseña actualizada correctamente', 'Cerrar', {
                duration: 3000,
              });
              this.changePasswordForm.reset();
            },
            error: () => {
              this._snackBar.open('Error al actualizar la contraseña', 'Cerrar', {
                duration: 3000,
              });
            },
          });
        } else {
          this._snackBar.open('Contraseña actual incorrecta', 'Cerrar', {
            duration: 3000,
          });
        }
      },
      error: () => {
        this._snackBar.open('Error al verificar la contraseña', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }
}
