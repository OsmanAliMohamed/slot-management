using System.Threading.Tasks;

namespace Vosita.SlotManagement.Data;

public interface ISlotManagementDbSchemaMigrator
{
    Task MigrateAsync();
}
