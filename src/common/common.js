// import Swal from 'sweetalert2';

// export function notificationSwal(icon, title) {
//   Swal.fire({
//     position: 'top-end',
//     icon: icon,
//     title: title,
//     showConfirmButton: false,
//     timer: 3000
//   });
// }

// Crear una sesión
export function createSession(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Obtener una sesión
export function getSession(key) {
  const sessionData = localStorage.getItem(key);
  if (sessionData) {
    return JSON.parse(sessionData);
  }
  return null;
}

// Actualizar una sesión
export function updateSession(key, value) {
  if (getSession(key)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// Eliminar una sesión
export function deleteSession(key) {
  localStorage.removeItem(key);
}

export function navigateTo(url) {
  window.location.href = URL + '#/admin/' + url;
}

