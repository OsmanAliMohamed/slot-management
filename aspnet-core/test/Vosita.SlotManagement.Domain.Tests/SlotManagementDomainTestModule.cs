using Volo.Abp.Modularity;

namespace Vosita.SlotManagement;

[DependsOn(
    typeof(SlotManagementDomainModule),
    typeof(SlotManagementTestBaseModule)
)]
public class SlotManagementDomainTestModule : AbpModule
{

}
