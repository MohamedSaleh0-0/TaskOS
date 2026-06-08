import { Plugin } from 'obsidian';
import { StateManager } from './data/StateManager';
import { RenameListener } from './events/RenameListener';
import { TasksOSSettings } from './domain/types';
import { TasksOSSettingTab } from './settings/TasksOSSettingTab';
import { DashboardView, VIEW_TYPE_TASKS_OS } from './views/DashboardView';

const DEFAULT_SETTINGS: TasksOSSettings = {
    dailyNotesFolder: '',
    journalHeadingSize: '###',
    defaultJournalHeading: 'خواطر',
    tagRoutes: {}
};

export default class TasksOSPlugin extends Plugin {
    public stateManager!: StateManager;
    public pluginSettings!: TasksOSSettings;

    async onload() {
        console.log('Loading Tasks-OS Engine with Configuration Tab...');

        await this.loadSettings();

        this.stateManager = new StateManager(this);
        await this.stateManager.loadState();

        const renameListener = new RenameListener(this, this.stateManager);
        renameListener.register();

        this.registerView(
            VIEW_TYPE_TASKS_OS,
            (leaf) => new DashboardView(leaf, this.stateManager, this)
        );

        this.addSettingTab(new TasksOSSettingTab(this.app, this));

        this.addCommand({
            id: 'open-tasks-os-dashboard',
            name: 'فتح لوحة التحكم المركزية الموحدة',
            callback: () => this.activateView()
        });
    }

    async loadSettings() {
        this.pluginSettings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.pluginSettings);
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_TASKS_OS)[0];

        if (!leaf) {
            const newLeaf = workspace.getLeaf(false);
            if (newLeaf) {
                leaf = newLeaf;
                await leaf.setViewState({ type: VIEW_TYPE_TASKS_OS, active: true });
            }
        }

        if (leaf) workspace.revealLeaf(leaf);
    }

    onunload() {
        console.log('Unloading Tasks-OS Plugin...');
    }
}