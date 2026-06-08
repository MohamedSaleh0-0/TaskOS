import { Plugin, Notice } from 'obsidian';
import { StateManager } from './data/StateManager';
import { RenameListener } from './events/RenameListener';
import { LineParser } from './utils/LineParser';
import { QuickTaskModal } from './modals/QuickTaskModal';

export default class TasksOSPlugin extends Plugin {
    private stateManager!: StateManager;

    async onload() {
        console.log('Loading Tasks-OS Plugin...');

        // 1. تهيئة وإقلاع محرك البيانات والكاش
        this.stateManager = new StateManager(this);
        await this.stateManager.loadState();

        // 2. تشغيل وتفعيل مستمع أحداث الـ Rename للحماية من الروابط المكسورة
        const renameListener = new RenameListener(this, this.stateManager);
        renameListener.register();

        // 3. تسجيل أمر الالتقاط الذكي (The Dynamic Hotkey Ingestion Command)
        this.addCommand({
            id: 'capture-task-contextually',
            name: 'التقاط المهمة الحالية ذكياً أو فتح نافذة التخصيص',
            editorCallback: async (editor, view) => {
                const activeFile = view.file;
                if (!activeFile) return;

                // قراءة السطر الحالي الذي يقف عليه مؤشر الكتابة بالكامل
                const currentLineText = editor.getLine(editor.getCursor().line);
                
                // تحليل السطر عبر المفسر
                const parsedResult = LineParser.parseLine(currentLineText);
                
                // جلب أقرب عنوان رئيسي يقع فوق المؤشر
                const nearestHeading = LineParser.findNearestHeading(this.app, activeFile, editor);

                if (parsedResult.isTask) {
                    // السيناريو الأول: السطر عبارة عن تشيك بوكس ماركداون -> حفظ صامت فوري بالـ Defaults
                    const addedTask = await this.stateManager.addTask({
                        title: parsedResult.title,
                        description: '',
                        status: 'todo',
                        priority: 'none',
                        dueDate: null,
                        timeEstimate: null,
                        tags: [],
                        dependencies: [],
                        contextFile: activeFile.path,
                        contextHeading: nearestHeading
                    });

                    if (addedTask) {
                        new Notice(`تم تأمين المهمة صامتاً: "${parsedResult.title}"`);
                    } else {
                        new Notice('عذراً هندسة، توجد مهمة قائمة بنفس الاسم بالفعل!');
                    }
                } else {
                    // السيناريو الثاني: السطر فارغ أو نص عادي -> فتح نافذة التخصيص الفوري والكامل
                    new QuickTaskModal(this.app, this.stateManager, parsedResult.title, async (modalResult) => {
                        const addedTask = await this.stateManager.addTask({
                            ...modalResult,
                            status: 'todo',
                            contextFile: activeFile.path,
                            contextHeading: nearestHeading
                        });

                        if (addedTask) {
                            new Notice(`تم حفظ المهمة المخصصة: "${modalResult.title}"`);
                        } else {
                            new Notice('عذراً هندسة، توجد مهمة قائمة بنفس الاسم بالفعل!');
                        }
                    }).open();
                }
            }
        });
    }

    onunload() {
        console.log('Unloading Tasks-OS Plugin...');
    }
}