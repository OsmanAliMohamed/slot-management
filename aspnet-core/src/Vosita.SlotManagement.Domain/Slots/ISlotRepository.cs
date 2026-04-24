using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NodaTime;
using Volo.Abp.Domain.Repositories;

namespace Vosita.SlotManagement.Slots;

public interface ISlotRepository : IRepository<Slot, System.Guid>
{
    Task<List<Slot>> GetNextAvailableAsync(
        Instant after,
        int count,
        CancellationToken cancellationToken = default);

    Task<(List<Slot> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        SlotStatus? status = null,
        CancellationToken cancellationToken = default);

    Task<(int Total, int Available, int Booked)> GetStatusCountsAsync(
        CancellationToken cancellationToken = default);
}
