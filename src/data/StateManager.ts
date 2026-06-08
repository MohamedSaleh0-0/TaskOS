import { Plugin } from 'obsidian';
import { TasksPluginState, Task, TaskStatus } from '../domain/types';

export class StateManager {
    private plugin: Plugin;
    private state: TasksPluginState;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.state = {
            version: '1.0.0',
            tasks: []
        };
    }

    // 1. قراءة البيانات من الهارد ديسك عند إقلاع الإضافة
    async loadState(): Promise<void> {
        const savedData = await this.plugin.loadData();
        if (savedData) {
            this.state = { ...this.state, ...savedData };
        } else {
            this.state = { version: '1.0.0', tasks: [] };
            await this.saveState();
        }
    }

    // 2. الحفظ الفيزيائي على الهارد ديسك عبر أوبسيديان API
    async saveState(): Promise<void> {
        await this.plugin.saveData(this.state);
    }

    // 3. جلب جميع المهام الحالية (للقراءة فقط في الواجهة)
    getTasks(): Task[] {
        return this.state.tasks;
    }

    // 4. جلب مهمة معينة بواسطة الـ ID
    getTaskById(id: string): Task | undefined {
        return this.state.tasks.find(t => t.id === id);
    }

    // 5. إضافة مهمة جديدة مع تطبيق قيد منع تكرار الاسم
    async addTask(input: Omit<Task, 'id' | 'createdAt' | 'actualTime'>): Promise<Task | null> {
        // قيد الأمان: منع تكرار اسم المهمة القائمة (التي ليست done)
        const isDuplicate = this.state.tasks.some(
            t => t.title.trim().toLowerCase() === input.title.trim().toLowerCase() && t.status !== 'done'
        );

        if (isDuplicate) {
            return null; // سيتم التقاط هذه القيمة في الـ Presenter لعرض تحذير للمستخدم
        }

        // تحديد الحالة الافتراضية بناءً على وجود اعتماديات (Dependencies)
        let finalStatus: TaskStatus = input.status;
        if (input.dependencies && input.dependencies.length > 0) {
            finalStatus = 'hanging';
        }

        const newTask: Task = {
            ...input,
            id: `t_${crypto.randomUUID()}`,
            status: finalStatus,
            actualTime: 0,
            createdAt: new Date().toISOString()
        };

        this.state.tasks.push(newTask);
        await this.saveState();
        return newTask;
    }

    // 6. تحديث مهمة معالجة فك الارتباط التلقائي للمهام الـ Hanging
    async updateTask(id: string, updates: Partial<Task>): Promise<void> {
        const taskIndex = this.state.tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;

        // تحديث المهمة الحالية في الرام
        this.state.tasks[taskIndex] = { ...this.state.tasks[taskIndex], ...updates };

        // المحرك الذكي: إذا تحولت المهمة الحالية إلى 'done'، نفحص المهام الـ hanging
        if (updates.status === 'done') {
            await this.checkAndReleaseHangingTasks();
        }

        await this.saveState();
    }

    // 7. حذف مهمة نهائياً من النظام
    async deleteTask(id: string): Promise<void> {
        this.state.tasks = this.state.tasks.filter(t => t.id !== id);
        
        // قيد الأمان: لو حذفت مهمة، يجب إزالتها من مصفوفة الـ dependencies لأي مهمة أخرى
        this.state.tasks.forEach(t => {
            if (t.dependencies.includes(id)) {
                t.dependencies = t.dependencies.filter(depId => depId !== id);
            }
        });

        // بعد الحذف وإعادة الهيكلة، نفحص لو تسببت الإزالة في تحرير مهمة معلقة
        await this.checkAndReleaseHangingTasks();
        await this.saveState();
    }

    // محرك الفحص والتحرير التلقائي للمهام المعلقة (Private Helper)
private async checkAndReleaseHangingTasks(): Promise<void> {
    this.state.tasks.forEach(t => {
        if (t.status === 'hanging') {
            // فحص هل كل المهام التي تعتمد عليها هذه المهمة أصبحت 'done'؟
            const allDepsResolved = t.dependencies.every(depId => {
                const depTask = this.getTaskById(depId);
                return !depTask || depTask.status === 'done';
            });

            if (allDepsResolved) {
                t.status = 'todo'; // تحرير المهمة مباشرة إلى الحالة الافتراضية
            }
        }
    });
}
}