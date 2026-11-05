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

    // Limpiar contenedor actual del panel central
    tasksContainer.innerHTML = '';

    if (tasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                No hay tareas registradas.
            </div>
        `;
    } else {
        // Generar el HTML para cada tarea en el panel central
        tasks.forEach(task => {
    const taskCard = document.createElement('div');
    
    // Normalizamos categoría y prioridad para que el CSS las reconozca sin fallar
    let categoriaLimpia = task.category ? task.category.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") : 'personal';
    
    const categoriaClase = `categoria-${categoriaLimpia}`;
    const prioridadClase = `prioridad-${task.priority.toLowerCase().trim()}`;
    
    taskCard.className = `task-card ${categoriaClase} ${prioridadClase} ${task.completed ? 'completed' : ''}`;
    taskCard.dataset.id = task.id;

    taskCard.innerHTML = `
        <div class="task-info">
            <h3>${escapeHTML(task.title)}</h3>
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

    // 🚨 AQUÍ ES CLAVE: Llamamos al radar cada vez que se renderiza para que se actualice
    renderUrgencyRadar();
}

let tasks = storageService.getTasks();
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


// Función auxiliar para seguridad (evitar inyección HTML básica)
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Función para renderizar el Radar con escalamiento automático de prioridad
function renderUrgencyRadar() {
    const urgencyContainer = document.getElementById('urgency-radar-content');
    if (!urgencyContainer) return;

    let tasks = storageService.getTasks();

    // Obtener la fecha actual normalizada a las 00:00 para comparar días exactos
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filtrar y evaluar el escalamiento dinámico
    const urgentTasks = tasks.filter(t => {
        if (t.completed) return false; // Las completadas no van al radar

        const dueDate = new Date(t.dueDate + 'T00:00:00'); // Evitar problemas de zona horaria
        const diffTime = dueDate - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Días restantes

        const basePriority = t.priority.toLowerCase();

        // Reglas de escalamiento automático a Alta:
        const isAlreadyHigh = basePriority === 'alta';
        const isLowDueToday = basePriority === 'baja' && diffDays <= 0; // Vence hoy o ya pasó
        const isMediumDueTomorrowOrLess = basePriority === 'media' && diffDays <= 1; // Vence mañana o ya pasó
        const isOverdue = diffDays < 0; // Cualquier tarea vencida

        return isAlreadyHigh || isLowDueToday || isMediumDueTomorrowOrLess || isOverdue;
    });

    urgencyContainer.innerHTML = '';

    if (urgentTasks.length === 0) {
        urgencyContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">
                No hay alertas críticas. ¡Todo bajo control! 🚀
            </div>
        `;
        return;
    }

    urgentTasks.forEach(task => {
        const dueDate = new Date(task.dueDate + 'T00:00:00');
        const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

        let badgeText = '⚠️ URGENTE';
        if (diffDays < 0) {
            badgeText = '🔥 VENCIDA';
        } else if (diffDays === 0) {
            badgeText = '⏰ VENCE HOY';
        } else if (diffDays === 1) {
            badgeText = '⚡ VENCE MAÑANA (MEDIA)';
        }

        const radarCard = document.createElement('div');
        radarCard.className = 'task-card';
        radarCard.style.borderColor = '#7f1d1d'; // Borde rojo de alerta

        radarCard.innerHTML = `
            <div class="task-info">
                <span class="task-badge alta">${badgeText}</span>
                <h3 style="font-size: 0.85rem;">${escapeHTML(task.title)}</h3>
                <small>📅 Vence: ${task.dueDate}</small>
            </div>
        `;
        urgencyContainer.appendChild(radarCard);
    });
}