import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';
import { TipoDocumento } from '../../model/documento';

const base_url = Backend.api + '/file';

@Injectable({
  providedIn: 'root',
})
export class TipoDocumentoService {
  constructor(private http: HttpClient) {}

  saveTipoDocumento(tipoDocumento: TipoDocumento) {
    return this.http.post(base_url + '/save', tipoDocumento, { withCredentials: true });
  }

  getTiposDocumentos() {
    return this.http.get<TipoDocumento[]>(base_url + '/getall', { withCredentials: true });
  }


  updateTipoDocumento(tipoDocumento: TipoDocumento) {
    return this.http.put(base_url + '/update', tipoDocumento, { withCredentials: true });
  }
  



  
}
