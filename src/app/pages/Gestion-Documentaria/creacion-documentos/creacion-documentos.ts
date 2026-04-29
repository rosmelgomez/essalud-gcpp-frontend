import { Component } from '@angular/core';
import { FileService } from '../../../services/file-service';
import { Documento } from '../../../model/documento';
import { FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-creacion-documentos',
  imports: [],
  templateUrl: './creacion-documentos.html',
  styleUrl: './creacion-documentos.css',
})
export class CreacionDocumentos {
  public registerForm!: FormGroup;


  constructor(
    private formBuilder: FormBuilder,
    private fileService: FileService
  ) { }

  reactiveForm() {
    this.registerForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      archivo: ['', [Validators.required]],
    });
  }


  insertDocumento(documento: Documento) {

    const file : Documento ={
      id: 0,
      nombre: this.registerForm.get('nombre')?.value,
      descripcion: this.registerForm.get('descripcion')?.value,
      date_creation: new Date().toISOString(),
      date_update: new Date().toISOString(),
      usuario_creation: 'usuario1',
      usuario_update: 'usuario1',
      archivo: this.registerForm.get('archivo')?.value,
    }

    this.fileService.insertfile(documento).subscribe(
      (response) => {
        console.log('Archivo subido exitosamente', response);
      },
      (error) => {
        console.error('Error al subir el archivo', error);
      }
    );
  }
}
