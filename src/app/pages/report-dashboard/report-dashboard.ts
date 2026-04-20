import { Component, ChangeDetectorRef} from '@angular/core';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../../services/local-storage-service';


@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-dashboard.html',
  styleUrls: ['./report-dashboard.css'],
})
export class ReportDashboard implements OnInit  {

  modulo : string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private dataImport: LocalStorageService,
  ) {}

  ngOnInit(): void {
    this.modulo = this.dataImport.getDataModulo().modulo || '';
    this.cdr.detectChanges();
  }


}
