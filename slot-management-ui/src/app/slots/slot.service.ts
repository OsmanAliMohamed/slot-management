import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GenerateSlotsInput {
  startDate: string;
  endDate: string;
  timeZone: string;
  slotDuration: number;
}

export interface GenerateSlotsResult {
  totalSlotsCreated: number;
}

export interface SlotDto {
  id: string;
  localStartTime: string;
  localEndTime: string;
  timeZone: string;
  isBookable: boolean;
  durationMinutes: number;
}

export interface PagedSlotsResult {
  items: SlotDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class SlotService {
  private readonly apiBase = `${environment.apiUrl}/api/app/slots`;

  constructor(private http: HttpClient) {}

  generateSlots(input: GenerateSlotsInput): Observable<GenerateSlotsResult> {
    return this.http.post<GenerateSlotsResult>(`${this.apiBase}/generate`, input);
  }

  getNextSlots(timeZone: string, count = 20): Observable<SlotDto[]> {
    const params = new HttpParams().set('timeZone', timeZone).set('count', count);
    return this.http.get<SlotDto[]>(`${this.apiBase}/next`, { params });
  }

  getAllSlots(page = 1, pageSize = 20, status?: string, timeZone = 'UTC'): Observable<PagedSlotsResult> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize)
      .set('timeZone', timeZone);
    if (status) params = params.set('status', status);
    return this.http.get<PagedSlotsResult>(this.apiBase, { params });
  }

  bookSlot(slotId: string): Observable<SlotDto> {
    return this.http.post<SlotDto>(`${this.apiBase}/${slotId}/book`, {});
  }

  getSlotStats(): Observable<{ totalSlots: number; availableSlots: number; bookedSlots: number }> {
    return this.http.get<{ totalSlots: number; availableSlots: number; bookedSlots: number }>(`${this.apiBase}/stats`);
  }
}
