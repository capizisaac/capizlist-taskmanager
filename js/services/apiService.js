// Servicio para simular o consumir una API Externa (JSONPlaceholder)
const API_URL = 'https://jsonplaceholder.typicode.com/todos?_limit=5';

export const apiService = {
    // Obtener tareas desde un servidor externo
    async fetchExternalTasks() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Error al conectar con la API externa');
            }
            const data = await response.json();
            
            // Transformar los datos de la API al formato de nuestra aplicación (Task)
            return data.map(item => ({
                id: 'ext-' + item.id,
                title: item.title,
                category: 'Trabajo', // Categoría por defecto para datos externos
                priority: 'Media',   // Prioridad por defecto
                dueDate: new Date().toISOString().split('T')[0], // Fecha de hoy
                completed: item.completed,
                createdAt: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error en apiService:', error);
            return [];
        }
    }
};