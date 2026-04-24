import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SlotService, PagedSlotsResult } from '../slot.service';

@Component({
  selector: 'app-all-slots',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './all-slots.html',
  styleUrl: './all-slots.scss'
})
export class AllSlots implements OnInit {
  readonly timeZones = [
    'Africa/Cairo', 'America/New_York', 'America/Los_Angeles',
    'America/Chicago', 'Europe/London', 'Europe/Paris',
    'Asia/Dubai', 'Asia/Tokyo', 'UTC'
  ];
  readonly statuses = [
    { label: 'All', value: '' },
    { label: 'Available', value: 'Available' },
    { label: 'Booked', value: 'Booked' }
  ];

  selectedTimeZone = 'UTC';
  selectedStatus = '';
  pageSize = 20;

  result: PagedSlotsResult | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';
  bookingSlotId: string | null = null;
  justBookedId: string | null = null;

  constructor(private slotService: SlotService) {}

  ngOnInit(): void { this.load(1); }

  load(page: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.slotService.getAllSlots(page, this.pageSize, this.selectedStatus || undefined, this.selectedTimeZone)
      .subscribe({
        next: (res) => { this.result = res; this.loading = false; },
        error: (err) => {
          this.errorMessage = err.error?.error?.message ?? 'Failed to load slots.';
          this.loading = false;
        }
      });
  }

  onFilterChange(): void { this.load(1); }

  goToPage(page: number): void {
    if (!this.result) return;
    if (page < 1 || page > this.result.totalPages) return;
    this.load(page);
  }

  get pages(): number[] {
    if (!this.result) return [];
    const total = this.result.totalPages;
    const current = this.result.page;
    // Show up to 7 page numbers centred around current
    const range: number[] = [];
    const delta = 3;
    const start = Math.max(1, current - delta);
    const end = Math.min(total, current + delta);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  bookSlot(slotId: string): void {
    this.bookingSlotId = slotId;
    this.errorMessage = '';
    this.successMessage = '';
    this.slotService.bookSlot(slotId).subscribe({
      next: (s) => {
        this.justBookedId = slotId;
        this.bookingSlotId = null;
        this.successMessage = `Slot booked successfully! (${s.localStartTime})`;
        setTimeout(() => {
          this.justBookedId = null;
          this.load(this.result?.page ?? 1);
        }, 1200);
      },
      error: (err) => {
        this.errorMessage = err.error?.error?.message ?? 'Failed to book slot.';
        this.bookingSlotId = null;
      }
    });
  }
}
