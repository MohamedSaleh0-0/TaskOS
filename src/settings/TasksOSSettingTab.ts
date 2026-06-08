import { App, PluginSettingTab, Setting } from 'obsidian';
import TasksOSPlugin from '../main';

export class TasksOSSettingTab extends PluginSettingTab {
    plugin: TasksOSPlugin;

    constructor(app: App, plugin: TasksOSPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'إعدادات نظام Tasks-OS التجريدي' });

        new Setting(containerEl)
            .setName('مجلد اليوميات (Daily Notes Folder)')
            .setDesc('المسار النسبي للمجلد الذي تحفظ فيه ملفاتك اليومية (اتركه فارغاً للجذر)')
            .addText(text => text
                .setPlaceholder('Daily_Notes')
                .setValue(this.plugin.pluginSettings.dailyNotesFolder)
                .onChange(async (value) => {
                    this.plugin.pluginSettings.dailyNotesFolder = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('حجم ترويسة العنوان (Heading Indicator)')
            .setDesc('العلامة المستخدمة لتحديد مستوى العنوان داخل الملف')
            .addDropdown(drop => drop
                .addOption('#', '# Heading 1')
                .addOption('##', '## Heading 2')
                .addOption('###', '### Heading 3')
                .setValue(this.plugin.pluginSettings.journalHeadingSize)
                .onChange(async (value) => {
                    this.plugin.pluginSettings.journalHeadingSize = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('العنوان الافتراضي للخواطر')
            .setDesc('اسم القسم الذي سيتم حقن السطور تحته في حال عدم اكتشاف تاغ محدد')
            .addText(text => text
                .setPlaceholder('خواطر')
                .setValue(this.plugin.pluginSettings.defaultJournalHeading)
                .onChange(async (value) => {
                    this.plugin.pluginSettings.defaultJournalHeading = value.trim();
                    await this.plugin.saveSettings();
                }));
    }
}