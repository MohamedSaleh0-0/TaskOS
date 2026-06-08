import { Plugin } from 'obsidian';
import { TasksPluginState, Task } from '../domain/types';

export class StateManager {
    private plugin: Plugin;
    private state: TasksPluginState;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.state = {
            version: '1.1.0',
            tasks: [],
            habits: []
        };
    }

    async loadState() {
        const loadedData = await this.plugin.loadData();
        if (loadedData) {
            this.state = {
                version: loadedData.version || '1.1.0',
                tasks: loadedData.tasks || [],
                habits: loadedData.habits || []
            };
            // Run an initial dependency pass on startup
            this.resolveDependencies();
        } else {
            this.state = { version: '1.1.0', tasks: [], habits: [] };
            await this.saveState();
        }
    }

    async saveState() {
        await this.plugin.saveData(this.state);
    }

    getPluginState(): TasksPluginState {
        return this.state;
    }

    getTasks(): Task[] {
        return this.state.tasks;
    }

    async addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'actualTime'>): Promise<Task | null> {
        const exists = this.state.tasks.some(t => t.title.toLowerCase() === taskData.title.toLowerCase());
        if (exists) return null;

        const newTask: Task = {
            ...taskData,
            id: `task_${Date.now()}`,
            createdAt: new Date().toISOString(),
            actualTime: 0
        };

        // Determine initial status based on dependencies
        if (newTask.dependencies && newTask.dependencies.length > 0) {
            const hasUnresolvedDeps = newTask.dependencies.some(depId => {
                const dep = this.state.tasks.find(d => d.id === depId);
                return dep ? dep.status !== 'done' : false;
            });
            if (hasUnresolvedDeps) {
                newTask.status = 'hanging';
            }
        }

        this.state.tasks.push(newTask);
        await this.saveState();
        return newTask;
    }

    async toggleTaskStatus(taskId: string, isDone: boolean): Promise<void> {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.status = isDone ? 'done' : 'todo';

        // Re-evaluate the entire graph after mutation
        this.resolveDependencies();
        await this.saveState();
    }

    private resolveDependencies(): void {
        let iterations = 0;
        let stateChanged = true;
        const maxIterations = 100; // Prevent infinite cycle loops

        while (stateChanged && iterations < maxIterations) {
            stateChanged = false;
            iterations++;

            this.state.tasks.forEach(t => {
                // Scenario A: Task is blocked but all blocks are now cleared
                if (t.status === 'hanging') {
                    const dependenciesMet = t.dependencies.every(depId => {
                        const depTask = this.state.tasks.find(d => d.id === depId);
                        return depTask ? depTask.status === 'done' : true;
                    });

                    if (dependenciesMet) {
                        t.status = 'todo';
                        stateChanged = true;
                    }
                }
                // Scenario B: User unchecked a prerequisite, pushing downstream tasks back to blocked
                else if ((t.status === 'todo' || t.status === 'in-progress') && t.dependencies.length > 0) {
                    const structuralBlockExists = t.dependencies.some(depId => {
                        const depTask = this.state.tasks.find(d => d.id === depId);
                        return depTask ? depTask.status !== 'done' : false;
                    });

                    if (structuralBlockExists) {
                        t.status = 'hanging';
                        stateChanged = true;
                    }
                }
            });
        }
    }
}