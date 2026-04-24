using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;
using Vosita.SlotManagement.EntityFrameworkCore;
using Vosita.SlotManagement.Slots;

namespace Vosita.SlotManagement.Slots;

public class EfCoreSlotRepository :
    EfCoreRepository<SlotManagementDbContext, Slot, Guid>,
    ISlotRepository
{
    public EfCoreSlotRepository(IDbContextProvider<SlotManagementDbContext> dbContextProvider)
        : base(dbContextProvider)
    {
    }

    public async Task<List<Slot>> GetNextAvailableAsync(
        Instant after,
        int count,
        CancellationToken cancellationToken = default)
    {
        var dbContext = await GetDbContextAsync();
        return await dbContext.Slots
            .Where(s => s.Status == SlotStatus.Available && s.StartInstant >= after)
            .OrderBy(s => s.StartInstant)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<(List<Slot> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        SlotStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var dbContext = await GetDbContextAsync();
        var query = dbContext.Slots.AsQueryable();

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(s => s.StartInstant)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<(int Total, int Available, int Booked)> GetStatusCountsAsync(
        CancellationToken cancellationToken = default)
    {
        var dbContext = await GetDbContextAsync();
        var total     = await dbContext.Slots.CountAsync(cancellationToken);
        var available = await dbContext.Slots.CountAsync(s => s.Status == SlotStatus.Available, cancellationToken);
        return (total, available, total - available);
    }
}
