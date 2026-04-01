/**
 * GESTOR DEPORTE PRO - VERSIÓN FINAL REPARADA
 */
class GestorDeporte {
    constructor() {
        // Forzamos la carga limpia desde el Storage
        this.cargarDatos();
        this.inicializarEventos();
        this.renderizar();
    }

    cargarDatos() {
        this.entrenamientos = JSON.parse(localStorage.getItem('semanaActual')) || [];
        this.historial = JSON.parse(localStorage.getItem('historialFitness')) || [];
    }

    inicializarEventos() {
        const selectCat = document.getElementById('categoria');
        const divCardio = document.getElementById('campos-cardio');
        const divFuerza = document.getElementById('campos-fuerza');

        if (selectCat) {
            selectCat.addEventListener('change', () => {
                divCardio.style.display = selectCat.value === 'Cardio' ? 'grid' : 'none';
                divFuerza.style.display = selectCat.value === 'Fuerza' ? 'grid' : 'none';
            });
        }

        document.getElementById('form-entrenamiento').onsubmit = (e) => {
            e.preventDefault();
            this.agregarDesdeForm();
            e.target.reset();
        };

        document.getElementById('btn-ver-historial').onclick = () => this.irAHistorial();
        document.getElementById('btn-volver').onclick = () => this.irAInicio();
        document.getElementById('btn-limpiar').onclick = () => this.finalizarSemana();

        // --- Lógica de Cambio de Tema ---
        const btnTema = document.getElementById('btn-tema');
        const temaGuardado = localStorage.getItem('tema') || 'light';

        // Aplicar tema al iniciar
        document.documentElement.setAttribute('data-theme', temaGuardado);
        btnTema.innerText = temaGuardado === 'light' ? '🌙' : '☀️';

        btnTema.onclick = () => {
        let currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('tema', newTheme);
        btnTema.innerText = newTheme === 'light' ? '🌙' : '☀️';
        };
    }

    agregarDesdeForm() {
        const btnGuardar = document.querySelector('button[type="submit"]');
        const actividad = document.getElementById('actividad').value.trim();
        const duracion = document.getElementById('duracion').value.trim();

        if (!actividad || !duracion) {
            alert("⚠️ Por favor, indica qué hiciste y cuánto tiempo.");
            return;
        }

        // --- EFECTO DE CARGA ---
        const textoOriginal = btnGuardar.innerText;
        btnGuardar.innerText = "⏳ Guardando...";
        btnGuardar.classList.add('btn-loading');

        const nuevo = {
            id: Date.now(),
            dia: document.getElementById('dia-semana').value,
            actividad: actividad,
            duracion: duracion,
            categoria: document.getElementById('categoria').value,
            calorias: Number(document.getElementById('calorias').value) || 0,
            pulsaciones: Number(document.getElementById('pulsaciones').value) || 0,
            extras: {
                km: Number(document.getElementById('km').value) || 0,
                ritmo: document.getElementById('ritmo').value || "",
                peso: Number(document.getElementById('peso').value) || 0,
                series: document.getElementById('series_reps').value || ""
            }
        };

        // Simulamos un pequeño retraso para que la animación se aprecie
        setTimeout(() => {
            this.entrenamientos.push(nuevo);
            this.guardarYActualizar();
            
            // Restauramos el botón
            btnGuardar.innerText = "✅ ¡Guardado!";
            btnGuardar.classList.remove('btn-loading');
            
            setTimeout(() => {
                btnGuardar.innerText = textoOriginal;
            }, 1000);
        }, 600);
    }

    guardarYActualizar() {
        localStorage.setItem('semanaActual', JSON.stringify(this.entrenamientos));
        this.renderizar();
    }

    irAHistorial() {
        // RE-CARGA CRÍTICA: Antes de mostrar, leemos el disco
        this.historial = JSON.parse(localStorage.getItem('historialFitness')) || [];
        document.getElementById('vista-principal').style.display = 'none';
        document.getElementById('pagina-historial').style.display = 'block';
        this.renderizarHistorial();
    }

    irAInicio() {
        document.getElementById('pagina-historial').style.display = 'none';
        document.getElementById('vista-principal').style.display = 'block';
    }

    finalizarSemana() {
    if (this.entrenamientos.length === 0) return alert("No hay ejercicios para cerrar la semana.");
    
    if (confirm("¿Cerrar semana y archivar con resumen de totales?")) {
        // --- CÁLCULO DE TOTALES ---
        const totalKcal = this.entrenamientos.reduce((sum, e) => sum + Number(e.calorias || 0), 0);
        const totalKm = this.entrenamientos.reduce((sum, e) => sum + Number(e.extras.km || 0), 0);
        
        const registro = {
            fecha: new Date().toLocaleDateString(),
            datos: [...this.entrenamientos],
            resumen: {
                kcal: totalKcal,
                km: totalKm.toFixed(2) // Solo 2 decimales
            }
        };

        let historialActual = JSON.parse(localStorage.getItem('historialFitness')) || [];
        historialActual.push(registro);
        localStorage.setItem('historialFitness', JSON.stringify(historialActual));
        
        this.entrenamientos = [];
        this.guardarYActualizar();
        alert(`✅ Semana guardada!\nResumen: ${totalKcal} kcal y ${totalKm} km.`);
    }
    }

    eliminarSemanaHistorial(index) {
        if (confirm("¿Eliminar este registro?")) {
            this.historial.splice(index, 1);
            localStorage.setItem('historialFitness', JSON.stringify(this.historial));
            this.renderizarHistorial();
        }
    }

    eliminar(id) {
        this.entrenamientos = this.entrenamientos.filter(e => e.id !== id);
        this.guardarYActualizar();
    }

   renderizar() {
        const lista = document.getElementById('lista-ejercicios');
        if (!lista) return;
        lista.innerHTML = '';
        const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

        dias.forEach(dia => {
            const items = this.entrenamientos.filter(e => e.dia === dia);
            if (items.length > 0) {
                lista.innerHTML += `<div class="titulo-dia">📅 ${dia.toUpperCase()}</div>`;
                items.forEach(e => {
                    // 1. Preparamos el detalle de Cardio o Fuerza
                    let detalleDinamico = "";
                    if (e.categoria === "Cardio") {
                        detalleDinamico = `📍 ${e.extras.km || 0} km`;
                        if(e.extras.ritmo) detalleDinamico += ` | ⚡ ${e.extras.ritmo}`;
                    } else {
                        detalleDinamico = `💪 ${e.extras.peso || 0} kg`;
                        if(e.extras.series) detalleDinamico += ` | 🔢 ${e.extras.series}`;
                    }

                    // 2. Construimos el HTML inyectando el pulso (💓)
                    lista.innerHTML += `
                        <li class="entrenamiento-item">
                            <span>
                                <strong>${e.actividad}</strong> (${e.categoria})<br>
                                <small>⏱️ ${e.duracion} min | 🔥 ${e.calorias || 0} kcal | 💓 ${e.pulsaciones || 0} bpm</small><br>
                                <small style="color:#007bff; font-weight:bold;">${detalleDinamico}</small>
                            </span>
                            <button class="btn-delete" onclick="miApp.eliminar(${e.id})">🗑️</button>
                        </li>`;
                });
            }
        });
    }

    renderizarHistorial() {
        const cont = document.getElementById('lista-historial-semanas');
        if (!cont) return;
        this.historial = JSON.parse(localStorage.getItem('historialFitness')) || [];

        if (this.historial.length === 0) {
            cont.innerHTML = "<p style='text-align:center; padding:20px; color:#666;'>No hay historial disponible.</p>";
            return;
        }

        cont.innerHTML = this.historial.map((sem, i) => {
            // Validaciones de seguridad (Si no existe, ponemos valores por defecto)
            const kcalTotal = sem.resumen ? sem.resumen.kcal : 0;
            const kmTotal = sem.resumen ? sem.resumen.km : 0;
            const listaActividades = sem.datos ? sem.datos.map(d => d.actividad).join(' • ') : "Sin detalles";

            return `
                <div class="tarjeta-historial" style="margin-bottom:15px; padding:15px; background:#f8f9fa; border-radius:12px; border:1px solid #eee; color:#333;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <strong style="color:#222;">📅 Semana: ${sem.fecha}</strong><br>
                            <span style="font-size:0.9rem; color:#007bff; font-weight:bold; display:block; margin-top:5px;">
                                🔥 ${kcalTotal} kcal | 📍 ${kmTotal} km total
                            </span>
                        </div>
                        <button class="btn-delete" onclick="miApp.eliminarSemanaHistorial(${i})">🗑️</button>
                    </div>
                    <div style="margin-top:10px; padding:8px; background:#fff; border-radius:8px; font-size:0.8rem; color:#666; border:1px dashed #ddd;">
                        ${listaActividades}
                    </div>
                </div>`;
        }).reverse().join('');
    }
}

const miApp = new GestorDeporte();