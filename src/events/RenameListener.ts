import { Plugin } from 'obsidian';
import { StateManager } from '../data/StateManager';

export class RenameListener {
    private plugin: Plugin;
    private stateManager: StateManager;

    constructor(plugin: Plugin, stateManager: StateManager) {
        this.plugin = plugin;
        this.stateManager = stateManager;
    }

    // تسجيل المستمع داخل دورة حياة الإضافة في أوبسيديان
    register(): void {
        this.plugin.registerEvent(
            this.plugin.app.vault.on('rename', async (file, oldPath) => {
                let isStateChanged = false;
                const tasks = this.stateManager.getTasks();

                // المرور على جميع المهام وتحديث المسار القديم بالمسار الجديد للملف
                tasks.forEach(task => {
                    if (task.contextFile === oldPath) {
                        task.contextFile = file.path;
                        isStateChanged = true;
                    }
                });

                // إذا تم العثور على مهام مرتبطة وتحديثها، نقوم بحفظ التغييرات فوراً
                if (isStateChanged) {
                    await this.stateManager.saveState();
                }
            })
        );
    }
}