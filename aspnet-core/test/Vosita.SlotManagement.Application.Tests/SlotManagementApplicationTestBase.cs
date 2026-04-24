using Volo.Abp.Modularity;

namespace Vosita.SlotManagement;

public abstract class SlotManagementApplicationTestBase<TStartupModule> : SlotManagementTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
