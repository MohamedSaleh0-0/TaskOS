export type TaskStatus = 'todo' | 'in-progress' | 'hanging' | 'done';
export type TaskPriority = 'none' | 'low' | 'medium' | 'high';
export type HabitType = 'binary' | 'qualitative';

export interface TasksOSSettings {
    dailyNotesFolder: string;      // اسم مجلد اليوميات (مثلاً: Daily_Notes)
    journalHeadingSize: string;     // حجم العنوان (### أو ## أو #)
    defaultJournalHeading: string;  // العنوان الافتراضي (خواطر)
    tagRoutes: { [tag: string]: string }; // الخرائط الذكية للوسوم (مثلاً: مشاكل -> مشاكل)
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    deadline: string | null;
    timeEstimate: number | null;
    actualTime: number;
    tags: string[];
    dependencies: string[];
    contextFile: string | null;
    contextHeading: string | null;
    createdAt: string;
}

export interface Habit {
    id: string;
    title: string;
    type: HabitType;
    currentValue: number | boolean;
    history: { [dateStr: string]: number | boolean };
}

export interface TasksPluginState {
    version: string;
    tasks: Task[];
    habits: Habit[];
}