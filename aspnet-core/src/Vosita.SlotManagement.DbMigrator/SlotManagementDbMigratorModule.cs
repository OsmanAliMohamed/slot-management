using Vosita.SlotManagement.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace Vosita.SlotManagement.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(SlotManagementEntityFrameworkCoreModule),
    typeof(SlotManagementApplicationContractsModule)
    )]
public class SlotManagementDbMigratorModule : AbpModule
{
}
