using Vosita.SlotManagement.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace Vosita.SlotManagement.Permissions;

public class SlotManagementPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(SlotManagementPermissions.GroupName);
        //Define your own permissions here. Example:
        //myGroup.AddPermission(SlotManagementPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<SlotManagementResource>(name);
    }
}
