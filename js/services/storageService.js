// Servicio de Persistencia Local (LocalStorage)
const STORAGE_KEY = 'tasks_app_data';

export const storageService = {
    // Obtener todas las tareas guardadas
    getTasks() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Guardar la lista completa de tareas
    saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    },

    // Agregar una nueva tarea
    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);
        return tasks;
    },

    // Cambiar estado de completado (marcar/desmarcar)
    toggleTaskStatus(id) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks(tasks);
        }
        return tasks;
    },

    // Eliminar una tarea por su ID
    deleteTask(id) {
        let tasks = this.getTasks();
        tasks = tasks.filter(t => t.id !== id);
        this.saveTasks(tasks);
        return tasks;
    }
};