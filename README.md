# Slot Management — Vosita Task

A full-stack slot management feature built with **ABP.io + .NET 8 + NodaTime** (backend) and **Angular 20** (frontend).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | [ABP.io](https://abp.io) 8.3 on .NET 8 |
| Time handling | [NodaTime](https://nodatime.org) 3.3 |
| Database | SQL Server LocalDB (via EF Core) |
| Frontend | Angular 20 (standalone components) |

---

## Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 9.x (`dotnet --version`) |
| Node.js | 18+ |
| Angular CLI | `npm i -g @angular/cli` |
| SQL Server LocalDB | Included with Visual Studio / [download separately](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) |

---

## Project Structure

```
Vosita_Task/
├── aspnet-core/          # ABP.io backend solution
│   ├── src/
│   │   ├── Vosita.SlotManagement.Domain/           # Slot entity (uses NodaTime Instant)
│   │   ├── Vosita.SlotManagement.Application/      # SlotAppService (NodaTime logic)
│   │   ├── Vosita.SlotManagement.Application.Contracts/  # DTOs + ISlotAppService
│   │   ├── Vosita.SlotManagement.EntityFrameworkCore/    # EF Core + NodaTime converters
│   │   └── Vosita.SlotManagement.HttpApi.Host/     # REST API host (port 44324)
│   └── test/
│       └── Vosita.SlotManagement.Application.Tests/ # 18 unit tests (NodaTime logic)
└── slot-management-ui/   # Angular 20 frontend
```

---

## Setup — Backend

### 1. Start SQL Server LocalDB

```bash
sqllocaldb start MSSQLLocalDB
```

### 2. Apply Migrations

```bash
cd aspnet-core/src/Vosita.SlotManagement.EntityFrameworkCore
dotnet ef database update
```

### 3. Run the API

```bash
cd aspnet-core/src/Vosita.SlotManagement.HttpApi.Host
dotnet run
```

API will be available at **https://localhost:44324**
Swagger UI: https://localhost:44324/swagger

---

## Setup — Frontend

```bash
cd slot-management-ui
npm install
ng serve
```

Frontend will be available at **http://localhost:4200**

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/app/slots/generate` | Generate slots for a date range |
| `GET`  | `/api/app/slots/next?timeZone=X&count=20` | Get next available slots in a time zone |
| `POST` | `/api/app/slots/{id}/book` | Book (mark as unavailable) a specific slot |

### Generate Slots — Request Body

```json
{
  "startDate": "2026-04-24",
  "endDate": "2026-04-25",
  "timeZone": "Africa/Cairo",
  "slotDuration": 30
}
```

### Get Next Slots — Response

```json
[
  {
    "id": "...",
    "localStartTime": "2026-04-24 08:00:00 +03:00",
    "localEndTime": "2026-04-24 08:30:00 +03:00",
    "timeZone": "Africa/Cairo",
    "isBookable": true,
    "durationMinutes": 30
  }
]
```

---

## NodaTime Usage

### Why NodaTime?

`DateTime` in .NET has ambiguous semantics around time zones. NodaTime makes the intent explicit:

- **`Instant`** — a point in time with no time zone (stored in DB as UTC `datetime2`)
- **`LocalDate`** — a calendar date with no time zone
- **`DateTimeZone`** — a TZDB time zone (e.g., `America/New_York`)
- **`ZonedDateTime`** — an `Instant` viewed through a `DateTimeZone`

### How slots are generated

```csharp
// 1. Parse dates as LocalDate (no time zone)
var startDate = LocalDatePattern.Iso.Parse(input.StartDate).Value;

// 2. Resolve TZDB time zone
var tz = DateTimeZoneProviders.Tzdb.GetZoneOrNull(input.TimeZone);

// 3. Get midnight in that time zone → convert to Instant
var dayStartInstant = currentDate.AtStartOfDayInZone(tz).ToInstant();
var dayEndInstant   = currentDate.PlusDays(1).AtStartOfDayInZone(tz).ToInstant();

// 4. Loop, stepping by slotDuration, storing only Instants
while (slotStart + slotDuration <= dayEndInstant)
{
    slots.Add(new Slot(id, slotStart, slotStart + slotDuration, timeZone));
    slotStart += slotDuration;
}
```

### How slots are displayed

```csharp
// Convert stored Instant to local time in the requested zone
var localStart = slot.StartInstant.InZone(tz); // ZonedDateTime
var display = localStart.ToString("yyyy-MM-dd HH:mm:ss o<+HH:mm>", null);
```

### EF Core value converter (Instant ↔ DateTime)

```csharp
var instantConverter = new ValueConverter<Instant, DateTime>(
    instant => instant.ToDateTimeUtc(),
    dt => Instant.FromDateTimeUtc(DateTime.SpecifyKind(dt, DateTimeKind.Utc))
);
```

---

## Running Unit Tests

```bash
cd aspnet-core
dotnet test test/Vosita.SlotManagement.Application.Tests/
```

**18 tests** covering:
- Correct slot count for 30-min, 60-min, 45-min durations
- Slots across multi-day ranges
- UTC storage correctness (New York midnight = 04:00 UTC in summer)
- Time zone conversion (UTC → New York, UTC → Cairo)
- Duration preserved on every slot
- Invalid time zone detection

---

## Assumptions

- Slots are generated for the **full day** (00:00 to 23:59) in the chosen time zone.
- Days with DST transitions may produce one more/fewer slot than usual — NodaTime handles this correctly via `AtStartOfDayInZone`.
- No authentication is required for any endpoint (per task spec).
- The `CreationTimeZone` field on the `Slot` entity stores the original zone string for debugging/audit purposes; all calculations use `Instant`.
