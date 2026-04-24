using System;

namespace Vosita.SlotManagement.Slots;

public class SlotDto
{
    public Guid Id { get; set; }
    public string LocalStartTime { get; set; } = default!;
    public string LocalEndTime { get; set; } = default!;
    public string TimeZone { get; set; } = default!;
    public bool IsBookable { get; set; }
    public int DurationMinutes { get; set; }
}
