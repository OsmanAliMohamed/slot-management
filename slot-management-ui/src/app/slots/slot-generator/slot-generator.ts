import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SlotService, GenerateSlotsResult } from '../slot.service';

@Component({
  selector: 'app-slot-generator',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './slot-generator.html',
  styleUrl: './slot-generator.scss'
})
export class SlotGenerator {
  readonly timeZones = [
    'Africa/Cairo', 'America/New_York', 'America/Los_Angeles',
    'America/Chicago', 'Europe/London', 'Europe/Paris',
    'Asia/Dubai', 'Asia/Tokyo', 'UTC'
  ];

  form: FormGroup;
  result: GenerateSlotsResult | null = null;
  errorMessage = '';
  loading = false;

  constructor(private fb: FormBuilder, private slotService: SlotService) {
    this.form = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      timeZone: ['Africa/Cairo', Validators.required],
      slotDuration: [30, [Validators.required, Validators.min(1)]]
    });
    this.form.addValidators(this.dateRangeValidator);
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDate')?.value;
    const end = control.get('endDate')?.value;
    return start && end && start > end ? { dateRange: true } : null;
  }

  generate(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.result = null;
    this.errorMessage = '';
    this.slotService.generateSlots(this.form.value).subscribe({
      next: (res) => { this.result = res; this.loading = false; },
      error: (err) => {
        this.errorMessage = err.error?.error?.message ?? 'An error occurred generating slots.';
        this.loading = false;
      }
    });
  }

  get startDate() { return this.form.get('startDate'); }
  get endDate()   { return this.form.get('endDate'); }
  get timeZone()  { return this.form.get('timeZone'); }
  get slotDuration() { return this.form.get('slotDuration'); }
}
