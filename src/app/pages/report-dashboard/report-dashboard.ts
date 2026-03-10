import { Component, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-dashboard.html',
  styleUrls: ['./report-dashboard.css'],
})
export class ReportDashboard {
 
}
