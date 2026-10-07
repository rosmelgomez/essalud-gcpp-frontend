import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth, User } from '../../../model/user';
import { AuthService } from '../../../services/usuario/auth-service';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { forkJoin, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalStorageService } from '../../../services/local-storage-service';
import { UsersService } from '../../../services/usuario/users-service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit, OnDestroy {
  user: User | null = null;
  redName: string = '';
  centroName: string = '';
  isLoading: boolean = true;

  private userSub!: Subscription;

  private _snackBar = inject(MatSnackBar);
  public changeUserForm!: FormGroup;
  public changePasswordForm!: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isSavingUser = false;
  isSavingPassword = false;
  passwordSubmitted = false;
  currentPasswordError = '';


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
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    });

  }

  ngOnInit(): void {
    this.initializeForm();
    this.userSub = this.authService.user$.subscribe({
      next: (user) => {
        this.user = user;
        if (this.user) {
          this.changeUserForm.patchValue({
            name: this.user.name,
            lastname: this.user.lastname,
            dni: this.user.dni,
            email: this.user.email,
          }, { emitEvent: false });
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

  get roleLabel(): string {
    const roles = this.user?.roles as unknown;
    return Array.isArray(roles) ? roles.join(' · ') : String(roles ?? '');
  }

  /** Mensaje de error de un campo, solo cuando el usuario ya interactuó con él. */
  fieldError(form: FormGroup, name: string): string {
    const c = form.get(name);
    if (!c || !c.invalid || !(c.touched || c.dirty)) return '';
    if (c.hasError('required')) return 'Este campo es obligatorio.';
    if (c.hasError('pattern')) return 'El DNI debe tener 8 dígitos.';
    if (c.hasError('email')) return 'Ingresa un correo válido.';
    if (c.hasError('minlength')) return 'Usa al menos 8 caracteres.';
    return 'Revisa este campo.';
  }

  discardUserChanges(): void {
    if (!this.user) return;
    this.changeUserForm.reset({
      name: this.user.name,
      lastname: this.user.lastname,
      dni: this.user.dni,
      email: this.user.email,
    });
  }

  // ---- Contraseña: guía en vivo ----
  get newPasswordValue(): string {
    return this.changePasswordForm?.get('newPassword')?.value ?? '';
  }

  get passwordChecks(): Array<{ label: string; ok: boolean; required: boolean }> {
    const v = this.newPasswordValue;
    return [
      { label: 'Al menos 8 caracteres', ok: v.length >= 8, required: true },
      { label: 'Mayúsculas y minúsculas', ok: /[a-z]/.test(v) && /[A-Z]/.test(v), required: false },
      { label: 'Al menos un número', ok: /\d/.test(v), required: false },
      { label: 'Al menos un símbolo', ok: /[^A-Za-z0-9]/.test(v), required: false },
    ];
  }

  /** 0 a 4 según los criterios cumplidos (la longitud mínima es obligatoria). */
  get passwordStrength(): number {
    const v = this.newPasswordValue;
    if (!v) return 0;
    if (v.length < 8) return 1;
    return this.passwordChecks.filter((c) => c.ok).length;
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
      // Conservar los roles: sin ellos la sesión guardada pierde permisos (menú y guards).
      roles: this.user!.roles,
    };
    this.isSavingUser = true;
    this.usersService.updateUser(updatedUser).subscribe({
      next: () => {
        this.isSavingUser = false;
        this.user = { ...this.user!, ...updatedUser };
        this._snackBar.open('Información actualizada correctamente', 'Cerrar', {
          duration: 3000,
        });
        this.authService.setCurrentUser(updatedUser);
        this.changeUserForm.reset({
          name: updatedUser.name,
          lastname: updatedUser.lastname,
          dni: updatedUser.dni,
          email: updatedUser.email,
        });
        this.cdr.detectChanges();
      }
      ,
      error: () => {
        this.isSavingUser = false;
        this.cdr.detectChanges();
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
    this.passwordSubmitted = true;
    this.currentPasswordError = '';
    if (!this.changePasswordForm.valid) {
      this.changePasswordForm.markAllAsTouched();
      this._snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.value;
    if (newPassword !== confirmPassword) {
      return;
    }

    const username = this.dataImport.getUser()?.username;

    // Verificar contraseña actual
    const user: Auth = {
      username: username!.toString(),
      password: currentPassword,
    };

    this.isSavingPassword = true;
    this.usersService.verifyPassword(user).subscribe({
      next: (resp: any) => {
        const updateUser: Auth = {
          username: username!.toString(),
          password: newPassword,
        };

        this.usersService.changePassword(updateUser).subscribe({
          next: () => {
            this.isSavingPassword = false;
            this.passwordSubmitted = false;
            this._snackBar.open('Contraseña actualizada correctamente', 'Cerrar', {
              duration: 3000,
            });
            this.changePasswordForm.reset();
            this.cdr.detectChanges();
          },
          error: () => {
            this.isSavingPassword = false;
            this.cdr.detectChanges();
            this._snackBar.open('Error al actualizar la contraseña', 'Cerrar', {
              duration: 3000,
            });
          },
        });
      },
      error: () => {
        this.isSavingPassword = false;
        this.currentPasswordError = 'La contraseña actual no es correcta.';
        this.cdr.detectChanges();
      },
    });
  }


}
