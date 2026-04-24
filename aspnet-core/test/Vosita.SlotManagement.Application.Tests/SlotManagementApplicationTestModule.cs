using Volo.Abp.Modularity;

namespace Vosita.SlotManagement;

[DependsOn(
    typeof(SlotManagementApplicationModule),
    typeof(SlotManagementDomainTestModule)
)]
public class SlotManagementApplicationTestModule : AbpModule
{

}
