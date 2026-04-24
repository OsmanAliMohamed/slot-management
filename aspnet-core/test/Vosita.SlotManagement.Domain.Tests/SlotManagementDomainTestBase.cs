using Volo.Abp.Modularity;

namespace Vosita.SlotManagement;

/* Inherit from this class for your domain layer tests. */
public abstract class SlotManagementDomainTestBase<TStartupModule> : SlotManagementTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
