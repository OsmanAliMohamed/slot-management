using System;
using NodaTime;
using Volo.Abp.Domain.Entities.Auditing;

namespace Vosita.SlotManagement.Slots;

public class Slot : AuditedAggregateRoot<Guid>
{
    public Instant StartInstant { get; set; }
    public Instant EndInstant { get; set; }
    public string CreationTimeZone { get; set; } = default!;
    public SlotStatus Status { get; set; }

    private Slot() { }

    public Slot(Guid id, Instant startInstant, Instant endInstant, string creationTimeZone)
    {
        Id = id;
        StartInstant = startInstant;
        EndInstant = endInstant;
        CreationTimeZone = creationTimeZone;
        Status = SlotStatus.Available;
    }
}
