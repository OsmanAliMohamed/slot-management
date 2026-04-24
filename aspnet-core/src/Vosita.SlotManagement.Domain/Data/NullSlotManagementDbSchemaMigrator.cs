using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace Vosita.SlotManagement.Data;

/* This is used if database provider does't define
 * ISlotManagementDbSchemaMigrator implementation.
 */
public class NullSlotManagementDbSchemaMigrator : ISlotManagementDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
