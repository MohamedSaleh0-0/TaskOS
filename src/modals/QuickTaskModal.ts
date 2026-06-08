import { App, Modal, Setting } from 'obsidian';
import { StateManager } from '../data/StateManager';
import { TaskPriority } from '../domain/types';

export interface QuickTaskModalResult {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string | null;
    timeEstimate: number | null;
    tags: string[];
    dependencies: string[];
}

export class QuickTaskModal extends Modal {
    private stateManager: StateManager;
    private initialTitle: string;
    private onSubmit: (result: QuickTaskModalResult) => void;

    // الاحتفاظ بقيم الحقول المؤقتة داخل الـ Modal
    private title: string = '';
    private description: string = '';
    private priority: TaskPriority = 'none';
    private dueDate: string | null = null;
    private timeEstimate: number | null = null;
    private tagsStr: string = '';
    private selectedDependencies: string[] = [];

    constructor(
        app: App, 
        stateManager: StateManager, 
        initialTitle: string, 
        onSubmit: (result: QuickTaskModalResult) => void
    ) {
        super(app);
        this.stateManager = stateManager;
        this.initialTitle = initialTitle;
        this.title = initialTitle;
        this.onSubmit = onSubmit;
    }

    // يتم استدعاء هذه الدالة عند فتح النافذة لبناء عناصر الـ UI
    onOpen() {
        const { contentEl } = this;
        
        // عنوان النافذة الرئيسي
        contentEl.createEl('h2', { text: 'تفاصيل المهمة النظيفة', cls: 'task-modal-title' });

        // 1. حقل إدخال العنوان
        new Setting(contentEl)
            .setName('عنوان المهمة')
            .addText(text => text
                .setValue(this.title)
                .setPlaceholder('اكتب ماذا ستفعل...')
                .onChange(value => this.title = value));

        // 2. حقل صندوق الوصف التفصيلي (يدعم الماركداون)
        new Setting(contentEl)
            .setName('الوصف والملاحظات')
            .addTextArea(text => text
                .setPlaceholder('تفاصيل إضافية، روابط، أو كود...')
                .onChange(value => this.description = value));

        // 3. قائمة اختيار الأولوية
        new Setting(contentEl)
            .setName('مستوى الأولوية')
            .addDropdown(drop => drop
                .addOption('none', 'بدون أولوية')
                .addOption('low', 'منخفضة')
                .addOption('medium', 'متوسطة')
                .addOption('high', 'عالية')
                .setValue(this.priority)
                .onChange(value => this.priority = value as TaskPriority));

        // 4. حقل تاريخ ووقت الاستحقاق (الديدلاين)
        new Setting(contentEl)
            .setName('موعد الاستحقاق (Deadline)')
            .addText(text => {
                text.inputEl.type = 'datetime-local'; // يفتح واجهة اختيار الوقت والتاريخ مدمجة
                text.onChange(value => {
                    this.dueDate = value ? new Date(value).toISOString() : null;
                });
            });

        // 5. حقل الوقت المتوقع بالدقائق
        new Setting(contentEl)
            .setName('الوقت المتوقع (بالدقائق)')
            .addText(text => {
                text.inputEl.type = 'number';
                text.setPlaceholder('مثال: 60 أو 120')
                    .onChange(value => this.timeEstimate = value ? parseInt(value) : null);
            });

        // 6. حقل الوسوم الحرة
        new Setting(contentEl)
            .setName('الوسوم (Tags)')
            .setDesc('افصل بين الوسوم باستخدام الفاصلة')
            .addText(text => text
                .setPlaceholder('جامعة، برمجة، مستقبليات')
                .onChange(value => this.tagsStr = value));

        // 7. حقل الاعتماديات (Dependencies) - جلب المهام النشطة فقط لمنع التكرار
        const availableTasks = this.stateManager.getTasks().filter(t => t.status !== 'done');
        if (availableTasks.length > 0) {
            new Setting(contentEl)
                .setName('تعتمد على (Dependency)')
                .setDesc('اختر المهمة المعطلة لهذه التاسكاية')
                .addDropdown(drop => {
                    drop.addOption('', 'لا توجد اعتمادية حاسمة');
                    availableTasks.forEach(t => drop.addOption(t.id, t.title));
                    drop.onChange(value => {
                        this.selectedDependencies = value ? [value] : [];
                    });
                });
        }

        // 8. زر التأكيد والضخ المركزي
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('حفظ المهمة في النظام')
                .setCta() // يمنحه لوناً مميزاً متناسقاً مع ثيم أوبسيديان الحالي
                .onClick(() => {
                    if (!this.title.trim()) {
                        alert('عذراً هندسة، لا يمكن ترك العنوان فارغاً!');
                        return;
                    }

                    // تفكيك الوسوم إلى مصفوفة نصوص نظيفة
                    const tags = this.tagsStr
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t.length > 0);

                    // إرسال البيانات للـ Callback المفوض وإغلاق النافذة
                    this.onSubmit({
                        title: this.title,
                        description: this.description,
                        priority: this.priority,
                        dueDate: this.dueDate,
                        timeEstimate: this.timeEstimate,
                        tags: tags,
                        dependencies: this.selectedDependencies
                    });

                    this.close();
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty(); // تنظيف الـ DOM عند الإغلاق لمنع تسريب الذاكرة
    }
}