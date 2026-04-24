using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Vosita.SlotManagement.Data;
using Volo.Abp.DependencyInjection;

namespace Vosita.SlotManagement.EntityFrameworkCore;

public class EntityFrameworkCoreSlotManagementDbSchemaMigrator
    : ISlotManagementDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreSlotManagementDbSchemaMigrator(
        IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolve the SlotManagementDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<SlotManagementDbContext>()
            .Database
            .MigrateAsync();
    }
}
