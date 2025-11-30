'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

let hasMarker = false;
let map;
let movements = [];
let lastLongLat;
let isEnteringDetails = false;
let marker;

function saveToLocalStorage() {
  localStorage.setItem('movements', JSON.stringify(movements));
}

function getItemFromLocalStorage() {
  movements = JSON.parse(localStorage.getItem('movements')) || [];

  movements.forEach(move => {
    move.distance = Number(move.distance);
    move.duration = Number(move.duration);
    move.type === 'running' ? runningHandler(move) : cyclingHandler(move);
    const icon = move.type === 'running' ? '🏃‍♂️' : '🚴‍♀️';
    const newIcon = markerIcon();
    const marker = new L.marker([move.lat, move.lng || move.long], {
      icon: newIcon,
    });
    marker
      .addTo(map)
      .bindPopup(
        `${icon} ${move.type.charAt(0).toUpperCase() + move.type.slice(1)} on ${
          move.date
        }`,
        {
          autoClose: false,
          closeOnClick: false,
          className: `${move.type}-popup`,
        }
      );
  });
}

function dateHandler() {
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const day = today.toLocaleString('default', { day: '2-digit' });
  return `${month} ${day}`;
}

function success(pos) {
  const crd = pos.coords;
  map = L.map('map').setView([crd.latitude, crd.longitude], 17);
  init();
  getItemFromLocalStorage();
}

function init() {
  tileLayer();
  markerHandler();
}

function tileLayer() {
  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
  osm.addTo(map);
}

function markerIcon() {
  let newIcon = L.icon({
    iconUrl: 'marker-icon.png',
    shadowUrl: '',

    iconSize: [60, 60],
    shadowSize: [],
    iconAnchor: [33, 68],
    shadowAnchor: [],
    popupAnchor: [-3, -76],
  });
  return newIcon;
}

function markerHandler() {
  const newIcon = markerIcon();
  map.on('click', function (e) {
    if (isEnteringDetails) return;

    isEnteringDetails = true;
    inputDistance.focus();
    marker = L.marker([e.latlng.lat, e.latlng.lng], {
      icon: newIcon,
    }).addTo(map);
    form.classList.remove('hidden');
    lastLongLat = e.latlng;
  });
}

inputType.addEventListener('change', () => {
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});

containerWorkouts.addEventListener('keydown', event => {
  if (event.code === 'Enter') {
    event.preventDefault();
    isEnteringDetails = false;
    valuesHandler(lastLongLat);
    form.classList.add('hidden');
    inputType.value = 'running';
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';
  }
});

function valuesHandler(lastLongLat) {
  const today = dateHandler();
  const id = getRandomId();
  const icon = inputType.value === 'running' ? '🏃‍♂️' : '🚴‍♀️';
  movements.push({
    lat: lastLongLat.lat,
    lng: lastLongLat.lng,
    type: inputType.value,
    distance: parseInt(inputDistance.value) || 0,
    duration: parseInt(inputDuration.value) || 0,
    cadElev: inputCadence.value || inputElevation.value || 0,
    date: today,
    id,
  });
  marker
    .bindPopup(
      `${icon} ${
        movements[movements.length - 1].type.charAt(0).toUpperCase() +
        movements[movements.length - 1].type.slice(1)
      } on ${movements[movements.length - 1].date}`,
      {
        autoClose: false,
        closeOnClick: false,
        className: `${movements[movements.length - 1].type}-popup`,
      }
    )
    .openPopup();
  movementsHandler(inputType.value, movements[movements.length - 1]);
}

function movementsHandler(inputTypeValue, movement) {
  inputTypeValue === 'running'
    ? runningHandler(movement)
    : cyclingHandler(movement);
}

function runningHandler(movement) {
  const runningDiv = document.createElement('li');
  const pace =
    movement.distance > 0 || movement.duration > 0
      ? (movement.duration / movement.distance).toFixed(2)
      : 0;
  runningDiv.classList.add('workout', 'workout--running');
  runningDiv.setAttribute('data-id', `${movement.id}`);
  runningDiv.innerHTML = `
      <h2 class="workout__title">Running on ${movement.date}</h2>
      <div class="workout__details">
      <span class="workout__icon">🏃‍♂️</span>
      <span class="workout__value">${movement.distance}</span>
      <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${movement.duration}</span>
      <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${pace}</span>
      <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${movement.cadElev}</span>
      <span class="workout__unit">spm</span>
      </div>
   `;

  containerWorkouts.appendChild(runningDiv);
  saveToLocalStorage();
}

function cyclingHandler(movement) {
  const cyclingDiv = document.createElement('li');
  const pace =
    movement.distance > 0 || movement.duration > 0
      ? (movement.distance * (60 / movement.duration)).toFixed(2)
      : 0;
  cyclingDiv.classList.add('workout', 'workout--cycling');
  cyclingDiv.setAttribute('data-id', `${movement.id}`);
  cyclingDiv.innerHTML = `
      <h2 class="workout__title">Cycling on ${movement.date}</h2>
      <div class="workout__details">
      <span class="workout__icon">🚴‍♀️</span>
      <span class="workout__value">${movement.distance}</span>
      <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${movement.duration}</span>
      <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${pace}</span>
      <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${movement.cadElev}</span>
      <span class="workout__unit">m</span>
      </div>
   `;

  containerWorkouts.appendChild(cyclingDiv);
  saveToLocalStorage();
}

function getRandomId() {
  return Date.now().toString();
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

containerWorkouts.addEventListener('click', event => {
  const workoutEl = event.target.closest('li');
  if (!workoutEl) {
    return;
  }

  const workout = movements.find(move => move.id === workoutEl.dataset.id);
  map.setView([workout.lat, workout.lng], 17, {
    animate: true,
    pan: {
      duration: 1,
    },
  });
});

navigator.geolocation.getCurrentPosition(success, error, options);
