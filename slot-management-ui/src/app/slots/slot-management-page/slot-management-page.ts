import { Component } from '@angular/core';
import { SlotGenerator } from '../slot-generator/slot-generator';

@Component({
  selector: 'app-slot-management-page',
  standalone: true,
  imports: [SlotGenerator],
  templateUrl: './slot-management-page.html',
  styleUrl: './slot-management-page.scss'
})
export class SlotManagementPage {}
