import { App, Modal, Setting } from 'obsidian';
import { Task, TaskPriority } from '../domain/types';

export class TaskEditModal extends Modal {
    private task: Task;
    private onSave: (updatedTask: Task) => void;

    constructor(app: App, task: Task, onSave: (updatedTask: Task) => void) {
        super(app);
        this.task = { ...task };
        this.onSave = onSave;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h3', { text: 'Configure Task Properties' });

        new Setting(contentEl)
            .setName('Task Title')
            .addText(text => text
                .setValue(this.task.title)
                .onChange(val => this.task.title = val));

        new Setting(contentEl)
            .setName('Internal Execution Date (due date)')
            .addText(text => {
                text.inputEl.type = 'time';
                text.setValue(this.task.dueDate || '');
                text.onChange(val => this.task.dueDate = val || null);
            });

        new Setting(contentEl)
            .setName('Hard External Deadline')
            .addText(text => {
                text.inputEl.type = 'date';
                text.setValue(this.task.deadline || '');
                text.onChange(val => this.task.deadline = val || null);
            });

        new Setting(contentEl)
            .setName('Priority')
            .addDropdown(drop => drop
                .addOption('none', 'None')
                .addOption('low', 'Low')
                .addOption('medium', 'Medium')
                .addOption('high', 'High')
                .setValue(this.task.priority)
                .onChange(val => this.task.priority = val as TaskPriority));

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Save Config')
                .setCta()
                .onClick(() => {
                    this.onSave(this.task);
                    this.close();
                }));
    }

    onClose() {
        this.contentEl.empty();
    }
}