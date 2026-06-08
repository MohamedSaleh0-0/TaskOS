export type TaskStatus = 'todo' | 'in-progress' | 'hanging' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low' | 'none';

export interface SubTask {
    id: string;
    title: string;
    isDone: boolean;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    timeEstimate: number | null;
    actualTime: number;             // الوقت الفعلي المستغرق بالدقائق (الـ Default هو 0)
    tags: string[];
    dependencies: string[];
    contextFile: string | null;
    contextHeading: string | null;
    createdAt: string;
}

export interface TasksPluginState {
    version: string;
    tasks: Task[];
}