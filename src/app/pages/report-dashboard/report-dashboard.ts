import { Component, ChangeDetectorRef} from '@angular/core';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataImport } from '../../services/localstorage-service';


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
    private dataImport: DataImport,
  ) {}

  ngOnInit(): void {
    this.modulo = this.dataImport.getDataModulo().modulo || '';
    this.cdr.detectChanges();
  }


}
