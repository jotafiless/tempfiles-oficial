// Orquestador Principal de Aplicación "Temp Files" (Vanilla JS)
import {
    AVATARES_PREDEFINIDOS,
    obtenerPerfiles,
    crearPerfil,
    validarPin,
    obtenerSesionActiva,
    cerrarSesion,
    obtenerPerfilActivo
} from "./auth.js";
import {
    LIMITE_TAMANO_BYTES,
    formatearTamano,
    obtenerMisArchivos,
    obtenerEstadisticasAlmacenamiento,
    subirArchivo,
    renombrarArchivo,
    eliminarArchivo,
    cambiarCompartido,
    cambiarDestacado
} from "./files.js";
import {
    obtenerFeedCompartido,
    obtenerArchivosDestacados
} from "./feed.js";
import {
    actualizarFotoPerfil,
    actualizarPinPerfil,
    obtenerDetallesPerfil
} from "./profile.js";

// Estado de la interfaz
let selectedProfileForPin = null;
let currentSelectedAvatarUrl = AVATARES_PREDEFINIDOS[0].url;
let fileToRenameId = null;

// Elementos DOM del sistema
const DOMElements = {
    loadingScreen: document.getElementById("pantalla-carga"),
    profilesScreen: document.getElementById("profile-selection-screen"),
    profilesGrid: document.getElementById("profiles-grid"),
    mainDashboard: document.getElementById("main-dashboard"),
    
    // Contenedor global de avisos
    toast: document.getElementById("app-toast"),
    toastIcon: document.getElementById("toast-icon"),
    toastMessage: document.getElementById("toast-message"),
    
    // Modales
    modalCrearPerfil: document.getElementById("modal-crear-perfil"),
    modalPin: document.getElementById("modal-pin"),
    modalRenombrar: document.getElementById("modal-renombrar"),
    
    // Formularios e Inputs de Perfil
    formCrearPerfil: document.getElementById("form-crear-perfil"),
    inputPerfilNombre: document.getElementById("input-perfil-nombre"),
    inputPerfilPin: document.getElementById("input-perfil-pin"),
    avatarSelectorGrid: document.getElementById("avatar-selector-grid"),
    
    // Inputs de PIN
    pinInputs: document.querySelectorAll(".pin-digit-input"),
    btnSubmitPin: document.getElementById("btn-submit-pin"),
    pinErrorMessage: document.getElementById("pin-error-message"),
    pinModalTitle: document.getElementById("pin-modal-title"),
    pinModalDesc: document.getElementById("pin-modal-desc"),
    
    // Sidebar
    sidebarProfileInfo: document.getElementById("sidebar-profile-info"),
    btnLogout: document.getElementById("btn-logout"),
    menuItems: document.querySelectorAll(".sidebar-menu .menu-item"),
    dashboardTitle: document.getElementById("dashboard-title"),
    
    // Widgets de Almacenamiento
    storagePercentageText: document.getElementById("storage-percentage-text"),
    storagePercentageFill: document.getElementById("storage-percentage-fill"),
    
    // Vistas de Dashboard
    views: {
        inicio: document.getElementById("view-inicio"),
        "mis-archivos": document.getElementById("view-mis-archivos"),
        compartidos: document.getElementById("view-compartidos"),
        destacados: document.getElementById("view-destacados"),
        perfil: document.getElementById("view-perfil")
    },
    
    // Vista Inicio
    highlightsContainer: document.getElementById("highlights-container-box"),
    featuredGridTop: document.getElementById("featured-grid-top"),
    feedList: document.getElementById("feed-list"),
    
    // Vista Mis Archivos
    uploaderDropzone: document.getElementById("uploader-dropzone"),
    fileInput: document.getElementById("file-input"),
    uploadProgressList: document.getElementById("upload-progress-list"),
    filesTbody: document.getElementById("files-tbody"),
    
    // Vista Compartidos
    sharedList: document.getElementById("shared-list"),
    
    // Vista Destacados Completa
    featuredGridFull: document.getElementById("featured-grid-full"),
    
    // Vista Perfil Contraseña/Imagen
    profileCardDisplay: document.getElementById("profile-card-display"),
    avatarGridChange: document.getElementById("avatar-grid-change"),
    customAvatarUrl: document.getElementById("custom-avatar-url"),
    btnSaveCustomImg: document.getElementById("btn-save-custom-img"),
    changePin: document.getElementById("change-pin"),
    btnSavePin: document.getElementById("btn-save-pin"),
    
    // Botones de cierre globales
    btnCloseCreate: document.getElementById("btn-close-create"),
    btnClosePin: document.getElementById("btn-close-pin"),
    btnCloseRename: document.getElementById("btn-close-rename"),
    
    // Modal Rename triggers
    inputNuevoNombre: document.getElementById("input-nuevo-nombre"),
    btnSaveRename: document.getElementById("btn-save-rename")
};

// ================= SISTEMA DE TOAST NOTIFICACIONES LITE =================
function showToast(message, type = "info") {
    DOMElements.toast.className = `toast toast-${type} active`;
    
    // Iconos dinámicos en base a SVG simple de Lucide
    let iconSvg = "";
    if (type === "success") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--success);"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === "error") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--danger);"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`;
    } else {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-light);"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
    }

    DOMElements.toastIcon.innerHTML = iconSvg;
    DOMElements.toastMessage.textContent = message;
    
    setTimeout(() => {
        DOMElements.toast.classList.remove("active");
    }, 4500);
}

// ================= INICIALIZACIÓN MÓDULO APP =================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Mostrar spinner de carga
    DOMElements.loadingScreen.style.opacity = "1";
    
    // 2. Intentar recuperar sesión existente
    const sesion = await obtenerSesionActiva();
    
    if (sesion) {
        // Redirigir directamente al panel
        await entrarAlPanelDashboard();
    } else {
        // Mostrar selección de perfil
        await cargarPantallaPerfiles();
    }
    
    // 3. Ocultar pantalla de carga inicial con fade-out agradable
    DOMElements.loadingScreen.style.opacity = "0";
    setTimeout(() => {
        DOMElements.loadingScreen.style.display = "none";
    }, 300);

    // 4. Activar los listeners del sistema
    configurarEventosGlobales();
});

// ================= COMPORTAMIENTO: SELECCIÓN DE PERFIL =================
async function cargarPantallaPerfiles() {
    cerrarSesion();
    
    DOMElements.mainDashboard.classList.remove("active");
    DOMElements.mainDashboard.style.display = "none";
    DOMElements.profilesScreen.style.display = "flex";
    
    const perfiles = await obtenerPerfiles();
    DOMElements.profilesGrid.innerHTML = "";
    
    // Renderizado al estilo listado Netflix de amigos
    perfiles.forEach(p => {
        const pCard = document.createElement("div");
        pCard.className = "profile-card";
        pCard.id = `profile-${p.id}`;
        pCard.innerHTML = `
            <div class="avatar-wrapper">
                <img src="${p.foto}" alt="${p.nombre}" class="avatar-img" referrerPolicy="no-referrer" />
            </div>
            <span class="profile-name">${p.nombre}</span>
        `;
        
        pCard.addEventListener("click", () => {
            abrirValidacionPIN(p);
        });
        
        DOMElements.profilesGrid.appendChild(pCard);
    });

    // Agregar botón crear si hay menos de 6 perfiles
    if (perfiles.length < 6) {
        const btnAdd = document.createElement("button");
        btnAdd.className = "btn-add-profile";
        btnAdd.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span class="profile-name" style="margin-top: 0.5rem; font-size: 0.88rem;">Añadir Perfil</span>
        `;
        btnAdd.addEventListener("click", abrirFormularioCreacion);
        
        const wrapper = document.createElement("div");
        wrapper.className = "profile-card";
        wrapper.id = "btn-add-profile-wrapper";
        wrapper.appendChild(btnAdd);
        
        DOMElements.profilesGrid.appendChild(wrapper);
    }
    
    // Inicializar iconos
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ================= COMPORTAMIENTO: MODAL PIN DE ACCESO =================
function abrirValidacionPIN(perfil) {
    selectedProfileForPin = perfil;
    DOMElements.pinModalTitle.textContent = `Entrando como ${perfil.nombre}`;
    DOMElements.pinErrorMessage.textContent = "";
    
    // Limpiar dígitos del PIN
    DOMElements.pinInputs.forEach(input => {
        input.value = "";
    });
    
    DOMElements.modalPin.classList.add("active");
    
    // Foco automático en el primer input
    setTimeout(() => {
        DOMElements.pinInputs[0].focus();
    }, 100);
}

// Control inteligente del panel de PIN (avanzado, autotabulación y retroceso)
DOMElements.pinInputs.forEach(input => {
    input.addEventListener("input", (e) => {
        const value = e.target.value;
        const index = parseInt(e.target.dataset.index);
        
        if (value && index < 3) {
            DOMElements.pinInputs[index + 1].focus();
        }
    });
    
    input.addEventListener("keydown", (e) => {
        const index = parseInt(e.target.dataset.index);
        
        if (e.key === "Backspace" && !e.target.value && index > 0) {
            DOMElements.pinInputs[index - 1].focus();
        }
    });
});

// Enviar PIN
DOMElements.btnSubmitPin.addEventListener("click", procesarValidacionPIN);

async function procesarValidacionPIN() {
    if (!selectedProfileForPin) return;
    
    // Juntar los 4 dígitos
    let pinCompleto = "";
    DOMElements.pinInputs.forEach(input => {
        pinCompleto += input.value;
    });
    
    if (pinCompleto.length < 4) {
        DOMElements.pinErrorMessage.textContent = "Debes ingresar los 4 dígitos.";
        return;
    }
    
    const res = await validarPin(selectedProfileForPin.id, pinCompleto);
    
    if (res.success) {
        DOMElements.pinErrorMessage.textContent = "";
        DOMElements.modalPin.classList.remove("active");
        showToast(`¡Bienvenido de vuelta, ${res.perfil.nombre}!`, "success");
        await entrarAlPanelDashboard();
    } else {
        DOMElements.pinErrorMessage.textContent = res.error;
        DOMElements.pinInputs.forEach(i => i.value = "");
        DOMElements.pinInputs[0].focus();
    }
}

// ================= COMPORTAMIENTO: MODAL CREAR PERFIL =================
function abrirFormularioCreacion() {
    DOMElements.inputPerfilNombre.value = "";
    DOMElements.inputPerfilPin.value = "";
    
    // Generar grilla de selección de avatares predefinidos
    DOMElements.avatarSelectorGrid.innerHTML = "";
    
    AVATARES_PREDEFINIDOS.forEach((avatar, idx) => {
        const div = document.createElement("div");
        div.className = `avatar-option ${idx === 0 ? "selected" : ""}`;
        div.dataset.url = avatar.url;
        div.innerHTML = `<img src="${avatar.url}" alt="Avatar ${idx}" referrerPolicy="no-referrer" />`;
        
        div.addEventListener("click", () => {
            document.querySelectorAll(".avatar-option").forEach(opt => opt.classList.remove("selected"));
            div.classList.add("selected");
            currentSelectedAvatarUrl = avatar.url;
        });
        
        DOMElements.avatarSelectorGrid.appendChild(div);
    });
    
    currentSelectedAvatarUrl = AVATARES_PREDEFINIDOS[0].url;
    DOMElements.modalCrearPerfil.classList.add("active");
}

DOMElements.formCrearPerfil.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const nombre = DOMElements.inputPerfilNombre.value.trim();
    const pin = DOMElements.inputPerfilPin.value;
    
    if (!nombre) {
        showToast("Debes introducir un nombre de perfil.", "error");
        return;
    }
    
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        showToast("El PIN debe tener exactamente 4 dígitos numéricos.", "error");
        return;
    }
    
    const res = await crearPerfil(nombre, currentSelectedAvatarUrl, pin);
    
    if (res.success) {
        showToast(`El perfil "${nombre}" se ha creado con éxito.`, "success");
        DOMElements.modalCrearPerfil.classList.remove("active");
        await cargarPantallaPerfiles();
    } else {
        showToast(res.error, "error");
    }
});

// ================= NAVEGACIÓN Y CARGA DE VISTAS =================
async function entrarAlPanelDashboard() {
    const perfil = obtenerPerfilActivo();
    if (!perfil) return;
    
    DOMElements.profilesScreen.style.display = "none";
    DOMElements.mainDashboard.style.display = "flex";
    
    // Retrasar brevemente para activar la animación de opacidad
    setTimeout(() => {
        DOMElements.mainDashboard.classList.add("active");
    }, 50);

    // Renderizar miniatura en la barra lateral
    DOMElements.sidebarProfileInfo.innerHTML = `
        <img src="${perfil.foto}" alt="${perfil.nombre}" class="user-badge-photo" referrerPolicy="no-referrer" />
        <div class="user-badge-info">
            <h4>${perfil.nombre}</h4>
            <p>Amigo Temp Files</p>
        </div>
    `;

    // Cargar estadísticas generales globales del cupo en el Header
    await refrescarEstadisticasHeader();
    
    // Activar pestaña de Inicio por defecto
    await cambiarPestana("inicio");
}

// Refrescar barra de capacidad disponible
async function refrescarEstadisticasHeader() {
    const perfil = obtenerPerfilActivo();
    if (!perfil) return;

    const stats = await obtenerEstadisticasAlmacenamiento(perfil.id);
    
    DOMElements.storagePercentageText.textContent = `${formatearTamano(stats.totalEspacio)} / 50 MB`;
    DOMElements.storagePercentageFill.style.width = `${stats.porcentajeUsado}%`;
}

// Switch entre pestañas del Menú
async function cambiarPestana(tabName) {
    // 1. Quitar estado activo de barra lateral
    DOMElements.menuItems.forEach(item => {
        if (item.dataset.tab === tabName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // 2. Modificar título en Header
    let humanTitle = "Inicio";
    if (tabName === "mis-archivos") humanTitle = "Mis Archivos Guardados";
    else if (tabName === "compartidos") humanTitle = "Archivos del Grupo";
    else if (tabName === "destacados") humanTitle = "Carpeta de Destacados";
    else if (tabName === "perfil") humanTitle = "Mi Configuración de Cuenta";
    
    DOMElements.dashboardTitle.textContent = humanTitle;

    // 3. Apagar vistas
    Object.keys(DOMElements.views).forEach(key => {
        if (key === tabName) {
            DOMElements.views[key].classList.add("active");
        } else {
            DOMElements.views[key].classList.remove("active");
        }
    });

    // 4. Renderizar contenido específico de la pestaña seleccionada
    if (tabName === "inicio") {
        await renderizarVistaInicio();
    } else if (tabName === "mis-archivos") {
        await renderizarVistaMisArchivos();
    } else if (tabName === "compartidos") {
        await renderizarVistaCompartidos();
    } else if (tabName === "destacados") {
        await renderizarVistaDestacados();
    } else if (tabName === "perfil") {
        await renderizarVistaPerfil();
    }
}

// Helper para obtener estilo de color e icono de archivo dinámicamente según extensión
function obtenerConfiguracionIcono(ext) {
    const e = ext.toLowerCase();
    let cssClass = "file-color-txt";
    let iconName = "file-text";

    if (e === "pdf") { cssClass = "file-color-pdf"; iconName = "file-text"; }
    else if (["doc", "docx", "pages"].some(x => e === x)) { cssClass = "file-color-doc"; iconName = "file"; }
    else if (["xls", "xlsx", "numbers"].some(x => e === x)) { cssClass = "file-color-xls"; iconName = "file-spreadsheet"; }
    else if (["ppt", "pptx", "keynote"].some(x => e === x)) { cssClass = "file-color-ppt"; iconName = "presentation"; }
    else if (["zip", "rar", "7z", "tar", "gz"].some(x => e === x)) { cssClass = "file-color-zip"; iconName = "archive"; }
    else if (["jpg", "jpeg", "png", "webp", "gif"].some(x => e === x)) { cssClass = "file-color-img"; iconName = "image"; }
    else if (["mp4", "mkv", "mov", "avi"].some(x => e === x)) { cssClass = "file-color-vid"; iconName = "video"; }
    else if (["mp3", "wav", "m4a", "ogg"].some(x => e === x)) { cssClass = "file-color-aud"; iconName = "music"; }

    return { cssClass, iconName };
}

// ================= PESTAÑA: INICIO (FEED SOCIAL MULTIUSUARIO) =================
async function renderizarVistaInicio() {
    // 1. Cargar Destacados Especiales que todos pueden ver
    const destacados = await obtenerArchivosDestacados();
    
    if (destacados.length > 0) {
        DOMElements.highlightsContainer.style.display = "block";
        DOMElements.featuredGridTop.innerHTML = "";
        
        // Renderizar hasta 3 destacados superiores para dar dinamismo bento-grid
        destacados.slice(0, 3).forEach(file => {
            const config = obtenerConfiguracionIcono(file.ext);
            const uploader = file.perfiles || { nombre: "Amigo", foto: AVATARES_PREDEFINIDOS[0].url };
            
            const card = document.createElement("div");
            card.className = "featured-card";
            card.innerHTML = `
                <div class="featured-badge">
                    <i data-lucide="star" style="width: 12px; height: 12px; fill: var(--warning);"></i> Destacado
                </div>
                <div class="featured-card-top">
                    <div class="file-icon-container ${config.cssClass}">
                        <i data-lucide="${config.iconName}" style="color: var(--text-primary); width: 20px; height: 20px;"></i>
                    </div>
                    <div class="featured-meta">
                        <h4 title="${file.nombre}">${file.nombre}</h4>
                        <p>${formatearTamano(file.tamano)} • .${file.ext.toUpperCase()}</p>
                    </div>
                </div>
                <div class="featured-card-bottom">
                    <div class="user-uploader">
                        <img src="${uploader.foto}" alt="${uploader.nombre}" class="uploader-photo" referrerPolicy="no-referrer" />
                        <span class="uploader-name">${uploader.nombre}</span>
                    </div>
                    <a href="${file.url}" target="_blank" class="btn-download-minimal" download="${file.nombre}" title="Descargar archivo">
                        <i data-lucide="download" style="width: 16px; height: 16px;"></i>
                    </a>
                </div>
            `;
            DOMElements.featuredGridTop.appendChild(card);
        });
    } else {
        DOMElements.highlightsContainer.style.display = "none";
    }

    // 2. Muro compartido
    const compartidos = await obtenerFeedCompartido();
    DOMElements.feedList.innerHTML = "";
    
    if (compartidos.length === 0) {
        DOMElements.feedList.innerHTML = `
            <div class="no-data-placeholder">
                <i data-lucide="bell-ring" style="width: 48px; height: 48px;"></i>
                <h4>Muro Silencioso</h4>
                <p>Nadie ha compartido archivos recientemente. Ve a "Mis Archivos" para ser el primero en compartir algo con la comunidad.</p>
            </div>
        `;
    } else {
        compartidos.forEach(file => {
            const config = obtenerConfiguracionIcono(file.ext);
            const uploader = file.perfiles || { nombre: "Amigo", foto: AVATARES_PREDEFINIDOS[0].url };
            const fecha = new Date(file.fecha_subida).toLocaleDateString("es-ES", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
            });
            
            const item = document.createElement("div");
            item.className = "feed-item";
            item.innerHTML = `
                <div class="feed-item-left">
                    <img src="${uploader.foto}" alt="${uploader.nombre}" class="user-badge-photo" referrerPolicy="no-referrer" />
                    <div class="feed-item-info">
                        <div class="feed-item-header">
                            <span class="feed-uploader-name">${uploader.nombre}</span>
                            <span class="feed-action-tag">compartió un archivo</span>
                            <span class="feed-item-time">${fecha}</span>
                        </div>
                        <div class="feed-file-details">
                            <div class="feed-file-icon">
                                <i data-lucide="${config.iconName}" style="width: 16px; height: 16px; color: var(--accent-light);"></i>
                            </div>
                            <span class="feed-file-name" title="${file.nombre}">${file.nombre}</span>
                            <span class="feed-file-meta">(${formatearTamano(file.tamano)})</span>
                        </div>
                    </div>
                </div>
                <div class="feed-item-actions">
                    <button class="btn-action-circle btn-copiar-link" data-url="${file.url}" title="Copiar enlace público">
                        <i data-lucide="link" style="width: 16px; height: 16px;"></i>
                    </button>
                    <a href="${file.url}" target="_blank" download="${file.nombre}" class="btn-action-circle" title="Descargar archivo">
                        <i data-lucide="download" style="width: 16px; height: 16px;"></i>
                    </a>
                </div>
            `;
            
            // Añadir evento para copiar link de descarga directa
            item.querySelector(".btn-copiar-link").addEventListener("click", (e) => {
                const targetUrl = e.currentTarget.dataset.url;
                navigator.clipboard.writeText(targetUrl).then(() => {
                    showToast("Enlace copiado al portapapeles", "success");
                }).catch(() => {
                    showToast("No se pudo copiar el enlace", "error");
                });
            });

            DOMElements.feedList.appendChild(item);
        });
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ================= PESTAÑA: MIS ARCHIVOS (UPLOAD & MANAGEMENT DRIVER) =================
async function renderizarVistaMisArchivos() {
    const files = await obtenerMisArchivos();
    DOMElements.filesTbody.innerHTML = "";
    
    if (files.length === 0) {
        DOMElements.filesTbody.innerHTML = `
            <div style="grid-column: span 5; padding: 3rem; text-align: center; color: var(--text-secondary);">
                <i data-lucide="folder-search" style="width: 48px; height: 48px; display: block; margin: 0 auto 1rem; color: var(--text-muted);"></i>
                <p style="font-weight: 500;">No tienes archivos guardados.</p>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Arrastra y suelta tu primer PDF, imagen o canción para comenzar.</p>
            </div>
        `;
    } else {
        files.forEach(file => {
            const config = obtenerConfiguracionIcono(file.ext);
            const fecha = new Date(file.fecha_subida).toLocaleDateString("es-ES", {
                day: "numeric", month: "short", year: "numeric"
            });
            
            const row = document.createElement("div");
            row.className = "files-row";
            row.innerHTML = `
                <div class="file-name-cell">
                    <div class="file-icon-container ${config.cssClass}" style="width: 32px; height: 32px;">
                        <i data-lucide="${config.iconName}" style="width: 14px; height: 14px;"></i>
                    </div>
                    <h5 title="${file.nombre}">${file.nombre}</h5>
                </div>
                <div class="file-size-cell">${formatearTamano(file.tamano)}</div>
                <div class="file-date-cell">${fecha}</div>
                <div>
                    <div class="switch-wrapper">
                        <label class="switch">
                            <input type="checkbox" class="chk-compartir" ${file.es_publico ? "checked" : ""} data-id="${file.id}" />
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="file-actions-cell">
                    <button class="btn-file-option btn-destacar ${file.es_destacado ? "active-yellow" : ""}" data-id="${file.id}" data-val="${file.es_destacado}" title="Destacar en grupo">
                        <i data-lucide="star" style="width: 14px; height: 14px; ${file.es_destacado ? "fill: var(--warning);" : ""}"></i>
                    </button>
                    <button class="btn-file-option btn-renombrar" data-id="${file.id}" data-nombre="${file.nombre}" title="Renombrar">
                        <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                    </button>
                    <a href="${file.url}" target="_blank" download="${file.nombre}" class="btn-file-option" title="Descargar">
                        <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                    </a>
                    <button class="btn-file-option btn-delete" data-id="${file.id}" data-ruta="${file.ruta_storage}" title="Eliminar definitivamente">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            `;

            // EVENTOS DE BOTONES INDIVIDUALES
            
            // Toggle compartir
            row.querySelector(".chk-compartir").addEventListener("change", async (e) => {
                const checked = e.target.checked;
                const id = e.target.dataset.id;
                const res = await cambiarCompartido(id, checked);
                if (res.success) {
                    showToast(checked ? "Archivo ahora es Público en el Muro." : "Archivo configurado como Privado.", "success");
                    await refrescarEstadisticasHeader();
                } else {
                    showToast("No se pudo cambiar la visibilidad.", "error");
                    e.target.checked = !checked;
                }
            });

            // Toggle destacar
            row.querySelector(".btn-destacar").addEventListener("click", async (e) => {
                const btn = e.currentTarget;
                const id = btn.dataset.id;
                const val = btn.dataset.val === "true";
                const res = await cambiarDestacado(id, !val);
                if (res.success) {
                    showToast(!val ? "Archivo destacado." : "Archivo quitado de destacados.", "success");
                    await renderizarVistaMisArchivos();
                } else {
                    showToast("Error al modificar destacado.", "error");
                }
            });

            // Renombrar (abrir modal)
            row.querySelector(".btn-renombrar").addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                const activeNombre = e.currentTarget.dataset.nombre;
                fileToRenameId = id;
                DOMElements.inputNuevoNombre.value = activeNombre;
                DOMElements.modalRenombrar.classList.add("active");
            });

            // Eliminar definitiva
            row.querySelector(".btn-delete").addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.id;
                const ruta = e.currentTarget.dataset.ruta;
                if (confirm("¿Estás completamente seguro de que deseas eliminar permanentemente este archivo? Esta acción es irreversible.")) {
                    const res = await eliminarArchivo(id, ruta);
                    if (res.success) {
                        showToast("Archivo eliminado con éxito.", "success");
                        await renderizarVistaMisArchivos();
                        await refrescarEstadisticasHeader();
                    } else {
                        showToast("No se pudo eliminar el archivo.", "error");
                    }
                }
            });

            DOMElements.filesTbody.appendChild(row);
        });
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Drag & Drop event bindings
DOMElements.uploaderDropzone.addEventListener("click", () => {
    DOMElements.fileInput.click();
});

DOMElements.fileInput.addEventListener("change", (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        procesarSubirArchivo(selectedFile);
    }
});

DOMElements.uploaderDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    DOMElements.uploaderDropzone.classList.add("dragover");
});

DOMElements.uploaderDropzone.addEventListener("dragleave", () => {
    DOMElements.uploaderDropzone.classList.remove("dragover");
});

DOMElements.uploaderDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    DOMElements.uploaderDropzone.classList.remove("dragover");
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
        procesarSubirArchivo(droppedFile);
    }
});

// Acción de Procesamiento de Subida real con barra de progreso interactiva
async function procesarSubirArchivo(file) {
    if (file.size > LIMITE_TAMANO_BYTES) {
        showToast("Error: El tamaño del archivo supera los 50 MB.", "error");
        return;
    }

    // Comprobar espacio restante del usuario actual
    const perfil = obtenerPerfilActivo();
    const statsCurrent = await obtenerEstadisticasAlmacenamiento(perfil.id);
    if (statsCurrent.totalEspacio + file.size > LIMITE_TAMANO_BYTES) {
        showToast("Error: No tienes suficiente espacio libre en tu cupo de 50 MB.", "error");
        return;
    }

    const progressDiv = document.createElement("div");
    progressDiv.className = "upload-progress-item";
    const barId = `progress-${Date.now()}`;
    progressDiv.innerHTML = `
        <div class="progress-header">
            <span style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden; max-width: 250px;">Cargando: ${file.name}</span>
            <span id="${barId}-text">10%</span>
        </div>
        <div class="progress-bar-container">
            <div id="${barId}-fill" class="progress-bar-fill" style="width: 10px;"></div>
        </div>
    `;
    DOMElements.uploadProgressList.appendChild(progressDiv);

    const res = await subirArchivo(file, (porcentaje) => {
        const fillEl = document.getElementById(`${barId}-fill`);
        const textEl = document.getElementById(`${barId}-text`);
        if (fillEl && textEl) {
            fillEl.style.width = `${porcentaje}%`;
            textEl.textContent = `${porcentaje}%`;
        }
    });

    if (res.success) {
        showToast(`Archivo "${file.name}" cargado de forma exitosa.`, "success");
        setTimeout(() => {
            progressDiv.remove();
        }, 1500);
        await renderizarVistaMisArchivos();
        await refrescarEstadisticasHeader();
    } else {
        showToast(res.error, "error");
        progressDiv.remove();
    }
}

// Modal rename action submit
DOMElements.btnSaveRename.addEventListener("click", async () => {
    const nuevoNombre = DOMElements.inputNuevoNombre.value.trim();
    if (!nuevoNombre || !fileToRenameId) return;

    const res = await renombrarArchivo(fileToRenameId, nuevoNombre);
    if (res.success) {
        showToast("Archivo renombrado.", "success");
        DOMElements.modalRenombrar.classList.remove("active");
        await renderizarVistaMisArchivos();
    } else {
        showToast(res.error, "error");
    }
});

// ================= PESTAÑA: COMPARTIDOS (TODOS LOS PUBLICOS DE OTROS) =================
async function renderizarVistaCompartidos() {
    const perfil = obtenerPerfilActivo();
    const compartidos = await obtenerFeedCompartido();
    DOMElements.sharedList.innerHTML = "";
    
    // Filtrar los que pertenecen a otros perfiles
    const compartidosDeOtros = compartidos.filter(file => file.perfil_id !== perfil.id);

    if (compartidosDeOtros.length === 0) {
        DOMElements.sharedList.innerHTML = `
            <div class="no-data-placeholder">
                <i data-lucide="folder" style="width: 48px; height: 48px;"></i>
                <h4>Sin compartidos externos</h4>
                <p>Nadie más del grupo ha compartido un archivo público todavía.</p>
            </div>
        `;
    } else {
        compartidosDeOtros.forEach(file => {
            const config = obtenerConfiguracionIcono(file.ext);
            const uploader = file.perfiles || { nombre: "Amigo", foto: AVATARES_PREDEFINIDOS[0].url };
            const fecha = new Date(file.fecha_subida).toLocaleDateString("es-ES", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
            });
            
            const item = document.createElement("div");
            item.className = "feed-item";
            item.innerHTML = `
                <div class="feed-item-left">
                    <img src="${uploader.foto}" alt="${uploader.nombre}" class="user-badge-photo" referrerPolicy="no-referrer" />
                    <div class="feed-item-info">
                        <div class="feed-item-header">
                            <span class="feed-uploader-name">${uploader.nombre}</span>
                            <span class="feed-item-time">${fecha}</span>
                        </div>
                        <div class="feed-file-details">
                            <div class="feed-file-icon">
                                <i data-lucide="${config.iconName}" style="width: 16px; height: 16px; color: var(--accent-light);"></i>
                            </div>
                            <span class="feed-file-name" title="${file.nombre}">${file.nombre}</span>
                            <span class="feed-file-meta">(${formatearTamano(file.tamano)})</span>
                        </div>
                    </div>
                </div>
                <div class="feed-item-actions">
                    <button class="btn-action-circle btn-copiar-link" data-url="${file.url}" title="Copiar enlace">
                        <i data-lucide="link" style="width: 16px; height: 16px;"></i>
                    </button>
                    <a href="${file.url}" target="_blank" download="${file.nombre}" class="btn-action-circle" title="Descargar">
                        <i data-lucide="download" style="width: 16px; height: 16px;"></i>
                    </a>
                </div>
            `;
            
            item.querySelector(".btn-copiar-link").addEventListener("click", (e) => {
                const targetUrl = e.currentTarget.dataset.url;
                navigator.clipboard.writeText(targetUrl).then(() => {
                    showToast("Enlace copiado", "success");
                }).catch(() => {
                    showToast("No se pudo copiar el enlace", "error");
                });
            });

            DOMElements.sharedList.appendChild(item);
        });
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ================= PESTAÑA: DESTACADOS (CARPETA DE RESALTADOS) =================
async function renderizarVistaDestacados() {
    const destacados = await obtenerArchivosDestacados();
    DOMElements.featuredGridFull.innerHTML = "";
    
    if (destacados.length === 0) {
        DOMElements.featuredGridFull.innerHTML = `
            <div style="grid-column: 1 / -1;" class="no-data-placeholder">
                <i data-lucide="star-off" style="width: 48px; height: 48px;"></i>
                <h4>Sin Destacados</h4>
                <p>Nadie en el grupo de amigos ha marcado archivos como destacados todavía. Destaca un archivo desde "Mis Archivos".</p>
            </div>
        `;
    } else {
        destacados.forEach(file => {
            const config = obtenerConfiguracionIcono(file.ext);
            const uploader = file.perfiles || { nombre: "Amigo", foto: AVATARES_PREDEFINIDOS[0].url };
            
            const card = document.createElement("div");
            card.className = "featured-card";
            card.innerHTML = `
                <div class="featured-badge">
                    <i data-lucide="star" style="width: 12px; height: 12px; fill: var(--warning);"></i> Destacado
                </div>
                <div class="featured-card-top">
                    <div class="file-icon-container ${config.cssClass}">
                        <i data-lucide="${config.iconName}" style="color: var(--text-primary); width: 22px; height: 22px;"></i>
                    </div>
                    <div class="featured-meta">
                        <h4 title="${file.nombre}">${file.nombre}</h4>
                        <p>${formatearTamano(file.tamano)} • .${file.ext.toUpperCase()}</p>
                    </div>
                </div>
                <div class="featured-card-bottom">
                    <div class="user-uploader">
                        <img src="${uploader.foto}" alt="${uploader.nombre}" class="uploader-photo" referrerPolicy="no-referrer" />
                        <span class="uploader-name">${uploader.nombre}</span>
                    </div>
                    <a href="${file.url}" target="_blank" download="${file.nombre}" class="btn-download-minimal" title="Descargar">
                        <i data-lucide="download" style="width: 16px; height: 16px;"></i>
                    </a>
                </div>
            `;
            DOMElements.featuredGridFull.appendChild(card);
        });
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ================= PESTAÑA: PERFIL (GESTION DE CUENTA Y ACCESOS) =================
async function renderizarVistaPerfil() {
    const perfil = obtenerPerfilActivo();
    if (!perfil) return;
    
    // 1. Cargar estadísticas de archivos y capacidad
    const stats = await obtenerEstadisticasAlmacenamiento(perfil.id);
    const dateCreated = new Date(perfil.fecha_creacion).toLocaleDateString("es-ES", {
        day: "numeric", month: "short", year: "numeric"
    });
    
    // Render de tarjeta izquierda de perfil
    DOMElements.profileCardDisplay.innerHTML = `
        <img src="${perfil.foto}" alt="${perfil.nombre}" class="profile-display-avatar" referrerPolicy="no-referrer" />
        <h3 class="profile-display-name">${perfil.nombre}</h3>
        <span class="profile-display-age">Perfil creado: ${dateCreated}</span>
        
        <div class="profile-stats-grid">
            <div class="stat-item">
                <div class="stat-val">${stats.conteo}</div>
                <div class="stat-lbl">Archivos</div>
            </div>
            <div class="stat-item">
                <div class="stat-val" style="font-size: 1.1rem; padding-top: 0.15rem;">${formatearTamano(stats.totalEspacio).split(" ")[0]} <span style="font-size: 0.75rem;">${formatearTamano(stats.totalEspacio).split(" ")[1]}</span></div>
                <div class="stat-lbl">Usado</div>
            </div>
        </div>
    `;

    // 2. Grilla de cambio rápido de avatares predefinidos
    DOMElements.avatarGridChange.innerHTML = "";
    AVATARES_PREDEFINIDOS.forEach(avatar => {
        const img = document.createElement("img");
        img.src = avatar.url;
        img.alt = "Predefinido";
        img.referrerPolicy = "no-referrer";
        
        if (perfil.foto === avatar.url) {
            img.className = "selected";
        }
        
        img.addEventListener("click", async () => {
            const res = await actualizarFotoPerfil(avatar.url);
            if (res.success) {
                showToast("Foto de perfil actualizada.", "success");
                await entrarAlPanelDashboard();
            } else {
                showToast("Error al actualizar la foto.", "error");
            }
        });
        DOMElements.avatarGridChange.appendChild(img);
    });

    DOMElements.customAvatarUrl.value = "";
    DOMElements.changePin.value = "";
}

// Guardar avatar de imagen URL personalizado
DOMElements.btnSaveCustomImg.addEventListener("click", async () => {
    const urlVal = DOMElements.customAvatarUrl.value.trim();
    if (!urlVal) {
        showToast("Debes pegar una URL de imagen válida.", "error");
        return;
    }
    
    const res = await actualizarFotoPerfil(urlVal);
    if (res.success) {
        showToast("Avatar personalizado aplicado.", "success");
        await entrarAlPanelDashboard();
    } else {
        showToast("Error al cambiar avatar.", "error");
    }
});

// Guardar cambio de PIN
DOMElements.btnSavePin.addEventListener("click", async () => {
    const pinVal = DOMElements.changePin.value;
    if (pinVal.length !== 4 || !/^\d+$/.test(pinVal)) {
        showToast("El PIN debe tener un formato de 4 dígitos exactos.", "error");
        return;
    }
    
    const res = await actualizarPinPerfil(pinVal);
    if (res.success) {
        showToast("PIN modificado exitosamente.", "success");
        DOMElements.changePin.value = "";
    } else {
        showToast("Error al guardar el PIN.", "error");
    }
});

// ================= COMPORTAMIENTO: CERRAR SESIÓN =================
DOMElements.btnLogout.addEventListener("click", () => {
    if (confirm("¿Estás seguro de que deseas salir de este perfil?")) {
        cerrarSesion();
        cargarPantallaPerfiles();
        showToast("Sesión cerrada.", "info");
    }
});

// ================= GESTIÓN DE EVENTOS Y MODALES GLOBALES =================
function configurarEventosGlobales() {
    // Escuchar cambios de menú en sidebar
    DOMElements.menuItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabName = item.dataset.tab;
            if (tabName) {
                cambiarPestana(tabName);
            }
        });
    });

    // Cerrar modales al presionar la X
    DOMElements.btnCloseCreate.addEventListener("click", () => {
        DOMElements.modalCrearPerfil.classList.remove("active");
    });
    
    DOMElements.btnClosePin.addEventListener("click", () => {
        DOMElements.modalPin.classList.remove("active");
    });
    
    DOMElements.btnCloseRename.addEventListener("click", () => {
        DOMElements.modalRenombrar.classList.remove("active");
    });

    // Cerrar haciendo clic fuera del modal container
    const overlays = [DOMElements.modalCrearPerfil, DOMElements.modalPin, DOMElements.modalRenombrar];
    overlays.forEach(overlay => {
        overlay.addEventListener("mousedown", (e) => {
            if (e.target === overlay) {
                overlay.classList.remove("active");
            }
        });
    });
}
