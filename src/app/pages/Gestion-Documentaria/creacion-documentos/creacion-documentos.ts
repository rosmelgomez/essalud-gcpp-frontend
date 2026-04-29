import { LocalStorageService } from './../../../services/local-storage-service';
import { Component } from '@angular/core';
import { FileService } from '../../../services/file-service';
import { FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-creacion-documentos',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule, MatButtonModule,],
  templateUrl: './creacion-documentos.html',
  styleUrl: './creacion-documentos.css',
})
export class CreacionDocumentos implements OnInit {
  public registerForm!: FormGroup;


  constructor(
    private formBuilder: FormBuilder,
    private fileService: FileService,
    private localStorage: LocalStorageService
  ) { }

  ngOnInit(): void {
    this.reactiveForm();
  }

  reactiveForm() {
    this.registerForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      archivo: [null, [Validators.required]],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.registerForm.patchValue({ archivo: file });
    this.registerForm.get('archivo')?.updateValueAndValidity();
  }


  registerDocumento() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const user = this.localStorage.getUser();

    const usuario =user?.name + ' ' + user?.lastname;

    const documentoFormData = new FormData();
    documentoFormData.append('id', '');
    documentoFormData.append('nombre', this.registerForm.get('nombre')?.value ?? '');
    documentoFormData.append('descripcion', this.registerForm.get('descripcion')?.value ?? '');
    documentoFormData.append('date_creation', '');
    documentoFormData.append('date_update', '');
    documentoFormData.append('usuario_creation', usuario);
    documentoFormData.append('usuario_update', usuario);

    const archivo = this.registerForm.get('archivo')?.value as File | null;
    if (archivo) {
      documentoFormData.append('archivo', archivo);
    }

    this.fileService.insertfile(documentoFormData).subscribe(
      (response) => {
        console.log('Archivo subido exitosamente', response);
        this.registerForm.reset();
      },
      (error) => {
        console.error('Error al subir el archivo', error);
      }
    );
  }
}
