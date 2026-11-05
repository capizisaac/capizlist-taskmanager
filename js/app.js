import { Task } from './models/task.js';
import { storageService } from './services/storageService.js';
import { apiService } from './services/apiService.js';

// Elementos del DOM
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskCategorySelect = document.getElementById('task-category');
const taskPrioritySelect = document.getElementById('task-priority');
const taskDateInput = document.getElementById('task-date');
const tasksContainer = document.getElementById('tasks-container');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const syncApiBtn = document.getElementById('sync-api-btn'); // Botón opcional de API

// Estado actual de filtros
let currentFilter = 'all';
let searchQuery = '';

// Inicializar la aplicación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Establecer la fecha actual por defecto en el input de fecha
    taskDateInput.valueAsDate = new Date();
    
    renderTasks();
    initEventListeners();
});

// Configurar todos los escuchadores de eventos
function initEventListeners() {
    // 1. Crear nueva tarea manualmente
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = taskTitleInput.value.trim();
        const category = taskCategorySelect.value;
        const priority = taskPrioritySelect.value;
        const dueDate = taskDateInput.value;

        if (!title || !dueDate) return;

        const newTask = new Task(title, category, priority, dueDate);
        storageService.addTask(newTask);

        taskForm.reset();
        taskDateInput.valueAsDate = new Date();
        renderTasks();
    });

    // 2. Filtrar por estado (Todas, Pendientes, Completadas)
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    // 3. Buscar tareas por texto
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderTasks();
    });

    // 4. Delegación de eventos para completar o eliminar tareas en la lista
    tasksContainer.addEventListener('click', (e) => {
        const taskCard = e.target.closest('.task-card');
        if (!taskCard) return;
        
        const taskId = taskCard.dataset.id;

        // Botón de completar/descompletar
        if (e.target.classList.contains('btn-toggle')) {
            storageService.toggleTaskStatus(taskId);
            renderTasks();
        }

        // Botón de eliminar
        if (e.target.classList.contains('btn-delete')) {
            storageService.deleteTask(taskId);
            renderTasks();
        }
    });

    // 5. Sincronización opcional con API Externa (por si usas el botón)
    if (syncApiBtn) {
        syncApiBtn.addEventListener('click', async () => {
            syncApiBtn.textContent = 'Sincronizando...';
            const externalTasks = await apiService.fetchExternalTasks();
            
            let currentTasks = storageService.getTasks();
            // Combinar evitando duplicados básicos y guardar
            const combinedTasks = [...currentTasks, ...externalTasks];
            storageService.saveTasks(combinedTasks);
            
            renderTasks();
            syncApiBtn.textContent = '📥 Sincronizar API Externa';
        });
    }
}

// Función principal para renderizar las tareas en pantalla
function renderTasks() {
    let tasks = storageService.getTasks();

    // Aplicar filtro de búsqueda por texto
    if (searchQuery) {
        tasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery));
    }

    // Aplicar filtro de pestañas (all, pending, completed)
    if (currentFilter === 'pending') {
        tasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        tasks = tasks.filter(t => t.completed);
    }

    // Limpiar contenedor actual
    tasksContainer.innerHTML = '';

    if (tasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                No hay tareas registradas.
            </div>
        `;
        return;
    }

    // Generar el HTML para cada tarea
    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.completed ? 'completed' : ''}`;
        taskCard.dataset.id = task.id;

        taskCard.innerHTML = `
            <div class="task-info">
                <span class="task-badge ${task.priority.toLowerCase()}">${task.priority}</span>
                <span class="task-category-tag" style="font-size: 0.75rem; color: var(--accent-gold);">${task.category}</span>
                <h3 class="${task.completed ? 'strike' : ''}">${escapeHTML(task.title)}</h3>
                <small>📅 Vence: ${task.dueDate}</small>
            </div>
            <div class="task-actions">
                <button class="btn-toggle" title="${task.completed ? 'Marcar pendiente' : 'Completar'}">
                    ${task.completed ? '↩️' : '✅'}
                </button>
                <button class="btn-delete" title="Eliminar tarea">🗑️</button>
            </div>
        `;
        tasksContainer.appendChild(taskCard);
    });
}

// Función auxiliar para seguridad (evitar inyección HTML básica)
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}