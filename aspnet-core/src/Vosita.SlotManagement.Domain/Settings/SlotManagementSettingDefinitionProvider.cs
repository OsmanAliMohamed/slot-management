using Volo.Abp.Settings;

namespace Vosita.SlotManagement.Settings;

public class SlotManagementSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        //Define your own settings here. Example:
        //context.Add(new SettingDefinition(SlotManagementSettings.MySetting1));
    }
}
