import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth, User } from '../../../model/user';
import { AuthService } from '../../../services/usuario/auth.service';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { forkJoin, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalStorageService } from '../../../services/local-storage-service';
import { UsersService } from '../../../services/usuario/users-service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit, OnDestroy {
  user: User | null = null;
  redName: string = '';
  centroName: string = '';
  isLoading: boolean = true;

  formUser: boolean = false;
  formPassword: boolean = false;


  private userSub!: Subscription;

  private _snackBar = inject(MatSnackBar);
  public changeUserForm!: FormGroup;
  public changePasswordForm!: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;


  constructor(
    private authService: AuthService,
    private establecimientoService: EstablecimientoService,
    private usersService: UsersService,
    private dataImport: LocalStorageService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  initializeForm(): void {
    this.changeUserForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      email: ['', [Validators.required, Validators.email]],
    });


    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    });

  }

  cambiarFormUser() {
    this.formUser = !this.formUser;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.userSub = this.authService.user$.subscribe({
      next: (user) => {
        this.user = user;
        if (this.user) {
          this.loadNames();
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  loadNames(): void {
    forkJoin({
      red: this.establecimientoService.getRed(),
      centro: this.establecimientoService.getCentrosWithRed(),
    }).subscribe({
      next: ({ red, centro }) => {
        if (this.user) {
          const userRedCode = String(this.user.codred ?? '').trim().toLowerCase();
          const userCentroCode = String(this.user.codcas ?? '').trim().toLowerCase();

          const foundRed = red.find((r: any) => String(r.redasiscod).trim().toLowerCase() === userRedCode);
          this.redName = foundRed ? foundRed.redasisdes : (this.user.codred || 'No asignada');

          const foundCentro = centro.find((c: any) => String(c.cenasicod).trim().toLowerCase() === userCentroCode);
          this.centroName = foundCentro ? foundCentro.cenasides : (this.user.codcas || 'No asignado');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading catalogues:', err);
        this.isLoading = false;
      }
    });
  }

  getInitials(): string {
    if (!this.user?.name || !this.user?.lastname) {
      return 'US';
    }
    const firstInitial = this.user.name.charAt(0).toUpperCase();
    const lastInitial = this.user.lastname.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  changeUser(): void {
    if (!this.changeUserForm.valid) {
      this._snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const updatedUser: User = {
      id: this.user!.id,
      name: this.changeUserForm.value.name,
      lastname: this.changeUserForm.value.lastname,
      dni: this.changeUserForm.value.dni,
      codcas: this.user!.codcas,
      codred: this.user!.codred,
      email: this.changeUserForm.value.email,
      flag: this.user!.flag,
      username: this.user!.username,
      password: "",
      date_creation: this.user!.date_creation,
      date_update: new Date().toISOString(),
    };
    this.usersService.updateUser(updatedUser).subscribe({
      next: () => {
        this._snackBar.open('Información actualizada correctamente', 'Cerrar', {
          duration: 3000,
        });
        this.authService.setCurrentUser(updatedUser);
        this.changeUserForm.reset();
        this.cambiarFormUser();
      }
      ,
      error: () => {
        this._snackBar.open('Error al actualizar la información', 'Cerrar', {
          duration: 3000,
        });
      },
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
      },
      error: () => {
        this._snackBar.open('Error al verificar la contraseña', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }


}
