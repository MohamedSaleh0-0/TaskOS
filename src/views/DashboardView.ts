import { ItemView, WorkspaceLeaf, Notice, TFile } from 'obsidian';
import { StateManager } from '../data/StateManager';
import { Task, Habit } from '../domain/types';
import { TaskEditModal } from '../modals/TaskEditModal';
import TasksOSPlugin from '../main';

export const VIEW_TYPE_TASKS_OS = 'tasks-os-dashboard-view';

export class DashboardView extends ItemView {
    private stateManager: StateManager;
    private plugin: TasksOSPlugin;
    private rootDiv!: HTMLDivElement;

    constructor(leaf: WorkspaceLeaf, stateManager: StateManager, plugin: TasksOSPlugin) {
        super(leaf);
        this.stateManager = stateManager;
        this.plugin = plugin;
    }

    getViewType(): string { return VIEW_TYPE_TASKS_OS; }
    getDisplayText(): string { return 'Tasks-OS Workspace'; }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        this.rootDiv = container.createDiv({ cls: 'tasks-os-feed-root' });
        this.renderViewStructure();
    }

    private renderViewStructure() {
        this.rootDiv.empty();

        const navBar = this.rootDiv.createDiv({ cls: 'tui-scroll-spy-nav' });
        const tabs = [
            { name: 'Journal', target: 'journal-card' },
            { name: 'Habits', target: 'habits-card' },
            { name: 'Today Focus', target: 'tasks-card' },
            { name: 'Metrics', target: 'metrics-card' }
        ];

        tabs.forEach(tab => {
            const btn = navBar.createEl('button', { text: tab.name, cls: 'nav-tab-btn' });
            btn.addEventListener('click', () => {
                const targetCard = this.rootDiv.querySelector(`#${tab.target}`);
                if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        this.renderJournalCard();
        this.renderHabitsCard();
        this.renderTasksCard();
        this.renderMetricsCard();
    }

    private renderJournalCard() {
        const card = this.rootDiv.createDiv({ cls: 'tui-feed-card' });
        card.id = 'journal-card';
        card.createEl('div', { text: 'Journal Capturer Node', cls: 'card-title-header' });

        const box = card.createDiv({ cls: 'inline-capture-box' });
        const input = box.createEl('input', { cls: 'tui-inline-input' }) as HTMLInputElement;
        input.style.cssText = 'flex: 1;';
        input.placeholder = 'اكتب فكرة أو خاطرة، وضف #أي_تصنيف في أي مكان للفرز التلقائي...';
        
        const btn = box.createEl('button', { text: 'Log Line', cls: 'tui-inline-btn' });
        btn.addEventListener('click', () => this.handleJournalLogging(input));
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.handleJournalLogging(input); });
    }

    private async handleJournalLogging(inputEl: HTMLInputElement) {
        const val = inputEl.value.trim();
        if (!val) return;

        // 1. حساب التواريخ بصيغة ملف الشهر وعنوان اليوم (June 2026 & # 8 June)
        // @ts-ignore
        const moment = window.moment;
        const monthFile = moment().format('MMMM YYYY').toLowerCase(); 
        const dayHeading = `# ${moment().format('D MMMM')}`; 

        const folder = this.plugin.pluginSettings.dailyNotesFolder;
        const fileName = `${monthFile}.md`;
        const fullPath = folder ? `${folder}/${fileName}` : fileName;

        // 2. فحص وانتزاع الـ Hashtag ديناميكياً من أي مكان في النص
        let targetHeading = this.plugin.pluginSettings.defaultJournalHeading;
        const hashtagRegex = /#([^\s#]+)/u;
        const match = val.match(hashtagRegex);
        
        if (match) {
            targetHeading = match[1]; 
        }

        const headingSize = this.plugin.pluginSettings.journalHeadingSize; 
        const subHeadingMarker = `${headingSize} ${targetHeading}`;

        // 3. التحقق من الملف أو إنشائه تلقائياً لو كان فارغاً
        let abstractFile = this.app.vault.getAbstractFileByPath(fullPath);
        if (!abstractFile) {
            try {
                abstractFile = await this.app.vault.create(fullPath, '');
            } catch (createErr) {
                new Notice('فشل إنشاء ملف الشهر الجديد تلقائياً.');
                return;
            }
        }

        if (!(abstractFile instanceof TFile)) return;

        try {
            let fileContent = await this.app.vault.read(abstractFile);
            const lineToAdd = `- ${val}`;

            // 4. خوارزمية الحقن الموضعي (Splicing Algorithm) داخل المجلد الشهري
            if (!fileContent.includes(dayHeading)) {
                // اليوم غير موجود إطلاقاً، ننشئ اليوم والترويسة الفرعية والسطر في نهاية الملف
                const padding = fileContent.length > 0 ? '\n\n' : '';
                fileContent = `${fileContent}${padding}${dayHeading}\n${subHeadingMarker}\n${lineToAdd}`;
            } else {
                // اليوم موجود، نقوم بعزل الجزء الخاص بهذا اليوم فقط لمنع التداخل مع الأيام السابقة
                const dayIndex = fileContent.indexOf(dayHeading);
                const remainingContent = fileContent.substring(dayIndex + dayHeading.length);
                
                // البحث عن بداية اليوم التالي إذا وُجدت
                const nextDayMatch = remainingContent.match(/\n# /);
                const daySectionLength = nextDayMatch ? nextDayMatch.index! : remainingContent.length;
                const daySection = remainingContent.substring(0, daySectionLength);

                if (daySection.includes(subHeadingMarker)) {
                    // التاغ موجود بالفعل جوه سياق اليوم، نحقن السطر تحته مباشرة
                    const subHeadingIndex = daySection.indexOf(subHeadingMarker);
                    const absoluteSubIndex = dayIndex + dayHeading.length + subHeadingIndex;
                    
                    fileContent = fileContent.substring(0, absoluteSubIndex + subHeadingMarker.length) + 
                                  `\n${lineToAdd}` + 
                                  fileContent.substring(absoluteSubIndex + subHeadingMarker.length);
                } else {
                    // التاغ مش موجود في اليوم ده، ننشئه في نهاية قسم اليوم الحالي
                    const absoluteSectionEnd = dayIndex + dayHeading.length + daySectionLength;
                    fileContent = fileContent.substring(0, absoluteSectionEnd) + 
                                  `\n${subHeadingMarker}\n${lineToAdd}` + 
                                  fileContent.substring(absoluteSectionEnd);
                }
            }

            // 5. الحفظ الفعلي على القرص الصلب
            await this.app.vault.modify(abstractFile, fileContent);
            new Notice(`تم الحفظ في ملف ${monthFile} تحت قسم [${targetHeading}]`);
            inputEl.value = '';
        } catch (err) {
            console.error(err);
            new Notice('فشلت عملية الكتابة الفيزيائية داخل ملف الشهر.');
        }
    }

    private renderHabitsCard() {
        const card = this.rootDiv.createDiv({ cls: 'tui-feed-card' });
        card.id = 'habits-card';
        card.createEl('div', { text: 'Daily Tracking', cls: 'card-title-header' });
        const listContainer = card.createDiv();
        const habits: Habit[] = (this.stateManager as any).state?.habits || [];

        if (habits.length === 0) {
            const emptyNotice = listContainer.createDiv({ text: 'لا توجد عادات معرفة حالياً. يمكنك تفعيلها عبر الملف الإعدادي.' });
            emptyNotice.style.cssText = 'color: var(--text-muted);';
            return;
        }

        habits.forEach((h: Habit) => {
            const row = listContainer.createDiv({ cls: 'item-row-node' });
            if (h.type === 'binary') {
                const titleSpan = row.createDiv({ text: h.title, cls: 'node-title-group' });
                if (h.currentValue) {
                    titleSpan.style.color = 'var(--text-muted)';
                    titleSpan.style.textDecoration = 'line-through';
                }
                const btn = row.createEl('button', { text: h.currentValue ? 'Done' : 'Todo', cls: `toggle-habit-btn ${h.currentValue ? 'active-done' : ''}` });
                btn.addEventListener('click', async () => {
                    h.currentValue = !h.currentValue;
                    await this.stateManager.saveState();
                    this.renderViewStructure();
                });
            } else {
                row.createDiv({ text: h.title, cls: 'node-title-group' });
                const actions = row.createDiv({ cls: 'inc-dec-actions' });
                const minus = actions.createEl('button', { text: '-', cls: 'math-btn' });
                const input = actions.createEl('input', { cls: 'tui-inline-input' }) as HTMLInputElement;
                input.style.cssText = 'width:55px; padding:4px; text-align:center;';
                input.type = 'number';
                input.value = h.currentValue.toString();
                const plus = actions.createEl('button', { text: '+', cls: 'math-btn' });

                minus.addEventListener('click', async () => {
                    const current = parseInt(input.value) || 0;
                    if (current > 0) { h.currentValue = current - 1; await this.stateManager.saveState(); this.renderViewStructure(); }
                });
                plus.addEventListener('click', async () => {
                    const current = parseInt(input.value) || 0;
                    h.currentValue = current + 1; await this.stateManager.saveState(); this.renderViewStructure();
                });
                input.addEventListener('change', async () => {
                    const val = parseInt(input.value);
                    h.currentValue = val >= 0 ? val : 0; await this.stateManager.saveState(); this.renderViewStructure();
                });
            }
        });
    }

    private renderTasksCard() {
        const card = this.rootDiv.createDiv({ cls: 'tui-feed-card' });
        card.id = 'tasks-card';
        card.createEl('div', { text: 'Today focus stream', cls: 'card-title-header' });

        const box = card.createDiv({ cls: 'inline-capture-box' });
        box.style.cssText = 'margin-bottom: 20px;';
        const titleInput = box.createEl('input', { cls: 'tui-inline-input' }) as HTMLInputElement;
        titleInput.style.cssText = 'flex:3;';
        titleInput.placeholder = 'عنوان المهمة الجديدة لليوم...';
        const timeInput = box.createEl('input', { cls: 'tui-inline-input' }) as HTMLInputElement;
        timeInput.style.cssText = 'flex:1; max-width:100px;';
        timeInput.placeholder = '14:00';
        
        const addBtn = box.createEl('button', { text: 'Add Focus', cls: 'tui-inline-btn' });
        addBtn.addEventListener('click', async () => {
            const title = titleInput.value.trim();
            const time = timeInput.value.trim();
            if (!title) return;

            await this.stateManager.addTask({
                title: title,
                description: '',
                status: 'todo',
                priority: 'none',
                dueDate: time || null,
                deadline: null,
                timeEstimate: null,
                tags: [],
                dependencies: [],
                contextFile: null,
                contextHeading: null
            });

            titleInput.value = '';
            timeInput.value = '';
            this.renderViewStructure();
        });

        const listContainer = card.createDiv();
        const tasks = this.stateManager.getTasks();
        const sorted = [...tasks].sort((a, b) => {
            if (!a.dueDate) return 1; if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        });

        sorted.forEach(t => {
            const row = listContainer.createDiv({ cls: `item-row-node ${t.status === 'done' ? 'done' : ''}` });
            
            if (t.status === 'hanging') {
                row.style.cssText = 'opacity: 0.45; pointer-events: auto;';
            }

            const check = row.createEl('input', { cls: 'tui-checkbox-mock' }) as HTMLInputElement;
            check.type = 'checkbox';
            check.checked = t.status === 'done';
            
            if (t.status === 'hanging') {
                check.disabled = true;
                check.style.cursor = 'not-allowed';
            } else {
                check.addEventListener('change', async () => {
                    await this.stateManager.toggleTaskStatus(t.id, check.checked);
                    this.renderViewStructure();
                });
            }

            const titleWrap = row.createDiv({ cls: 'node-title-group' });
            
            let structuralToken = '';
            if (t.status === 'in-progress') structuralToken = '[PROG] ';
            else if (t.status === 'hanging') structuralToken = '[BLOCKED] ';

            titleWrap.createEl('span', { text: `${structuralToken}${t.title}` });
            
            if (t.priority !== 'none') titleWrap.createEl('span', { text: t.priority, cls: `priority-lbl ${t.priority}` });
            if (t.deadline) {
                const cutoff = titleWrap.createEl('span', { text: `Cutoff: ${t.deadline}`, cls: 'priority-lbl' });
                cutoff.style.cssText = 'background-color:rgba(239,68,68,0.1); color:var(--priority-hi);';
            }
            if (t.dueDate) row.createDiv({ text: t.dueDate, cls: 'date-badge' });

            const editBtn = row.createEl('button', { text: 'Edit', cls: 'action-icon-btn' });
            editBtn.addEventListener('click', () => {
                new TaskEditModal(this.app, t, async (updatedTask) => {
                    Object.assign(t, updatedTask);
                    await this.stateManager.saveState();
                    this.renderViewStructure();
                }).open();
            });
        });
    }

    private renderMetricsCard() {
        const card = this.rootDiv.createDiv({ cls: 'tui-feed-card' });
        card.id = 'metrics-card';
        card.createEl('div', { text: 'Performance Index', cls: 'card-title-header' });
        const pane = card.createDiv({ cls: 'metrics-text-pane' });
        pane.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
        
        const total = this.stateManager.getTasks().length;
        const done = this.stateManager.getTasks().filter(t => t.status === 'done').length;
        pane.createDiv({ text: `• System Sync Status: Active` });
        pane.createDiv({ text: `• Solved Allocations: ${done} of ${total} tasks cleared.` });
    }

    async onClose() {}
}