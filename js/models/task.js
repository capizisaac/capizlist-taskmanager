// Modelo de Tareas (Entidad)
export class Task {
    constructor(title, category, priority, dueDate) {
        this.id = Date.now().toString(); // ID único basado en timestamp
        this.title = title;
        this.category = category;
        this.priority = priority; // 'Alta', 'Media', 'Baja'
        this.dueDate = dueDate;
        this.completed = false;
        this.createdAt = new Date().toISOString();
    }
}