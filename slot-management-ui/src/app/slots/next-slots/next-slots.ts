import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SlotService, SlotDto } from '../slot.service';

@Component({
  selector: 'app-next-slots',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './next-slots.html',
  styleUrl: './next-slots.scss'
})
export class NextSlots implements OnInit {
  readonly timeZones = [
    'Africa/Cairo', 'America/New_York', 'America/Los_Angeles',
    'America/Chicago', 'Europe/London', 'Europe/Paris',
    'Asia/Dubai', 'Asia/Tokyo', 'UTC'
  ];
  readonly countOptions = [5, 10, 20, 50];

  selectedTimeZone = 'Africa/Cairo';
  selectedCount = 20;
  slots: SlotDto[] = [];
  errorMessage = '';
  successMessage = '';
  loading = false;
  bookingSlotId: string | null = null;
  justBookedId: string | null = null;

  constructor(private slotService: SlotService) {}

  ngOnInit(): void { this.loadSlots(); }

  onFilterChange(): void { this.loadSlots(); }

  loadSlots(): void {
    this.loading = true;
    this.errorMessage = '';
    this.slotService.getNextSlots(this.selectedTimeZone, this.selectedCount).subscribe({
      next: (slots) => { this.slots = slots; this.loading = false; },
      error: (err) => {
        this.errorMessage = err.error?.error?.message ?? 'Failed to load slots.';
        this.loading = false;
      }
    });
  }

  bookSlot(slotId: string): void {
    this.bookingSlotId = slotId;
    this.errorMessage = '';
    this.successMessage = '';
    this.slotService.bookSlot(slotId).subscribe({
      next: (bookedSlot) => {
        this.justBookedId = slotId;
        this.bookingSlotId = null;
        this.successMessage = `Slot booked successfully! (${bookedSlot.localStartTime})`;
        setTimeout(() => { this.justBookedId = null; this.loadSlots(); }, 1200);
      },
      error: (err) => {
        this.errorMessage = err.error?.error?.message ?? 'Failed to book slot.';
        this.bookingSlotId = null;
      }
    });
  }
}
