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

// 'use strict';

// /**
//  * ============================================
//  * PART 2: OBJECT-ORIENTED PROGRAMMING (OOP)
//  * ============================================
//  *
//  * 🎯 WHAT IS OOP?
//  * ---------------
//  * OOP is like organizing your code into "containers" (objects).
//  * Each container holds related data and functions together.
//  *
//  * Real-world analogy:
//  * - Your smartphone is an object
//  * - Properties: color, battery, storage
//  * - Methods: makeCall(), sendText(), takePicture()
//  *
//  * 🔑 KEY OOP CONCEPTS:
//  * --------------------
//  * 1. CLASS: Blueprint for creating objects (like a cookie cutter)
//  * 2. OBJECT: Actual instance created from class (like the cookie)
//  * 3. PROPERTIES: Variables that belong to the object (data)
//  * 4. METHODS: Functions that belong to the object (actions)
//  * 5. INHERITANCE: Child classes get features from parent
//  * 6. ENCAPSULATION: Hiding internal details, exposing only what's needed
//  */

// // ============================================
// // CLASS #1: WORKOUT (Parent/Base Class)
// // ============================================
// /**
//  * Why create a Workout class?
//  * - Running and Cycling share common features (distance, duration, date)
//  * - We put shared features in ONE place to avoid repetition
//  * - This is called "DRY" principle (Don't Repeat Yourself)
//  */
// class Workout {
//   // Generate unique ID when workout is created
//   id = Date.now().toString();

//   /**
//    * CONSTRUCTOR = Special method that runs when you create a new object
//    *
//    * Example usage:
//    * const workout = new Workout('running', 5, 30, [14.5, 121.0], 'Nov 30');
//    *
//    * When you write "new Workout(...)", JavaScript:
//    * 1. Creates an empty object {}
//    * 2. Runs this constructor function
//    * 3. Sets 'this' to point to the new object
//    * 4. Returns the object automatically
//    */
//   constructor(type, distance, duration, coords, date) {
//     // 'this' = the object being created right now
//     // We're adding properties to this object

//     this.type = type; // 'running' or 'cycling'
//     this.distance = distance; // 5.7 (kilometers)
//     this.duration = duration; // 30 (minutes)
//     this.coords = coords; // [14.5495, 121.0495] (lat, lng)
//     this.date = date; // 'November 30'
//   }

//   /**
//    * METHOD = Function that belongs to this class
//    * All workout objects can use this method
//    *
//    * Returns emoji based on workout type
//    */
//   getEmoji() {
//     // 'this.type' refers to the type property of THIS specific workout
//     return this.type === 'running' ? '🏃‍♂️' : '🚴‍♀️';
//   }

//   /**
//    * Returns formatted description
//    * Example: "Running on November 30"
//    */
//   getDescription() {
//     // Make first letter uppercase: 'running' → 'Running'
//     const typeCapitalized = this.type[0].toUpperCase() + this.type.slice(1);
//     return `${typeCapitalized} on ${this.date}`;
//   }
// }

// // ============================================
// // CLASS #2: RUNNING (Child of Workout)
// // ============================================
// /**
//  * INHERITANCE: Running "extends" Workout
//  * - Gets ALL properties and methods from Workout
//  * - Can add its own unique features (cadence, pace)
//  *
//  * Think of it like:
//  * - Workout = Vehicle (has wheels, engine)
//  * - Running = Car (has wheels, engine, PLUS 4 doors, trunk)
//  * - Cycling = Motorcycle (has wheels, engine, PLUS 2 wheels only)
//  */
// class Running extends Workout {
//   /**
//    * Constructor for Running workout
//    *
//    * @param {number} distance - kilometers (5.7, 10, etc.)
//    * @param {number} duration - minutes (30, 45, etc.)
//    * @param {array} coords - [latitude, longitude]
//    * @param {string} date - 'November 30'
//    * @param {number} cadence - steps per minute (170, 180, etc.)
//    */
//   constructor(distance, duration, coords, date, cadence) {
//     // 'super()' = Call the parent class (Workout) constructor
//     // This sets up: type, distance, duration, coords, date
//     super('running', distance, duration, coords, date);

//     // Now add Running-specific property
//     this.cadence = cadence; // steps per minute

//     // Calculate pace immediately when creating the workout
//     this.calcPace();
//   }

//   /**
//    * PACE = How many minutes per kilometer
//    * Lower is better (faster running)
//    *
//    * Example:
//    * - Run 6 km in 30 minutes
//    * - Pace = 30 / 6 = 5 min/km
//    */
//   calcPace() {
//     // Guard clause: prevent division by zero
//     if (this.distance <= 0) {
//       this.pace = 0;
//       return;
//     }

//     // Calculate and round to 2 decimal places
//     this.pace = (this.duration / this.distance).toFixed(2);
//   }
// }

// // ============================================
// // CLASS #3: CYCLING (Child of Workout)
// // ============================================
// class Cycling extends Workout {
//   /**
//    * Constructor for Cycling workout
//    *
//    * @param {number} elevationGain - meters climbed (100, 250, etc.)
//    */
//   constructor(distance, duration, coords, date, elevationGain) {
//     // Call parent constructor
//     super('cycling', distance, duration, coords, date);

//     // Add Cycling-specific property
//     this.elevationGain = elevationGain; // meters climbed

//     // Calculate speed immediately
//     this.calcSpeed();
//   }

//   /**
//    * SPEED = How many kilometers per hour
//    * Higher is better (faster cycling)
//    *
//    * Example:
//    * - Cycle 12 km in 30 minutes
//    * - Speed = 12 / (30/60) = 12 / 0.5 = 24 km/h
//    */
//   calcSpeed() {
//     // Guard clause: prevent division by zero
//     if (this.duration <= 0) {
//       this.speed = 0;
//       return;
//     }

//     // Convert minutes to hours, then calculate speed
//     // duration / 60 = hours
//     // distance / hours = km/h
//     this.speed = (this.distance / (this.duration / 60)).toFixed(2);
//   }
// }

// // ============================================
// // CLASS #4: APP (Main Application)
// // ============================================
// /**
//  * This class manages the ENTIRE application
//  * - Handles the map
//  * - Stores workouts
//  * - Manages form interactions
//  * - Handles localStorage
//  *
//  * Benefits of putting everything in a class:
//  * 1. All data is organized in one place
//  * 2. No global variables polluting the code
//  * 3. Easy to test and maintain
//  * 4. Clear structure and responsibility
//  */
// class App {
//   /**
//    * PRIVATE FIELDS (using # syntax)
//    * These can ONLY be accessed inside the App class
//    * Outside code cannot touch them
//    *
//    * Think of it like:
//    * - Your phone's internal circuits (private)
//    * - Your phone's screen/buttons (public)
//    */
//   #map; // Leaflet map object
//   #mapZoomLevel = 17; // How zoomed in the map is
//   #workouts = []; // Array to store all workouts
//   #currentMarker = null; // The marker being placed right now
//   #isFormActive = false; // Is the form currently open?

//   /**
//    * CONSTRUCTOR runs when you create: new App()
//    * This is where we initialize everything
//    */
//   constructor() {
//     // Store DOM elements (we query them once here, use everywhere)
//     this.form = document.querySelector('.form');
//     this.containerWorkouts = document.querySelector('.workouts');
//     this.inputType = document.querySelector('.form__input--type');
//     this.inputDistance = document.querySelector('.form__input--distance');
//     this.inputDuration = document.querySelector('.form__input--duration');
//     this.inputCadence = document.querySelector('.form__input--cadence');
//     this.inputElevation = document.querySelector('.form__input--elevation');

//     // Request user's location and start the app
//     this._getPosition();

//     // Load saved workouts from localStorage
//     this._getLocalStorage();

//     // Setup all event listeners
//     this._attachEventListeners();
//   }

//   /**
//    * =============================================
//    * GEOLOCATION METHODS
//    * =============================================
//    */

//   /**
//    * Request user's current GPS position
//    * This is ASYNCHRONOUS - takes time to get location
//    */
//   _getPosition() {
//     // Check if browser supports geolocation
//     if (!navigator.geolocation) {
//       alert('Your browser does not support geolocation');
//       return;
//     }

//     // Request position
//     // SUCCESS callback: _loadMap is called with position
//     // ERROR callback: _showError is called with error
//     navigator.geolocation.getCurrentPosition(
//       this._loadMap.bind(this), // Success
//       this._showError.bind(this), // Error
//       {
//         enableHighAccuracy: true, // Use GPS (not just wifi/cell towers)
//         timeout: 5000, // Give up after 5 seconds
//         maximumAge: 0, // Don't use cached position
//       }
//     );

//     /**
//      * 🔥 WHY .bind(this)?
//      * -------------------
//      * When _loadMap is called by geolocation, 'this' would normally
//      * be undefined. .bind(this) ensures 'this' still points to our App object.
//      *
//      * Without .bind(this):
//      * - this._loadMap called later
//      * - 'this' inside _loadMap = undefined ❌
//      *
//      * With .bind(this):
//      * - this._loadMap.bind(this) creates new function
//      * - 'this' inside _loadMap = App object ✓
//      */
//   }

//   /**
//    * Called when geolocation succeeds
//    * Creates the map at user's location
//    */
//   _loadMap(position) {
//     // Extract latitude and longitude from position object
//     const { latitude, longitude } = position.coords;

//     console.log(`Your location: ${latitude}, ${longitude}`);

//     try {
//       // Create Leaflet map
//       // L.map() is from Leaflet library (loaded in HTML)
//       this.#map = L.map('map').setView(
//         [latitude, longitude],
//         this.#mapZoomLevel
//       );

//       // Add map tiles (the actual map imagery)
//       L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         maxZoom: 20,
//         attribution:
//           '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//       }).addTo(this.#map);

//       // NOW the map is ready, attach click handler
//       this._attachMapClickHandler();

//       // Display saved workouts on map
//       this._renderSavedWorkoutsOnMap();
//     } catch (error) {
//       console.error('Error loading map:', error);
//       alert('Failed to load map. Please refresh the page.');
//     }
//   }

//   /**
//    * Called when geolocation fails
//    */
//   _showError(error) {
//     let message = 'Could not get your location. ';

//     // Provide specific error messages
//     switch (error.code) {
//       case error.PERMISSION_DENIED:
//         message += 'Please allow location access.';
//         break;
//       case error.POSITION_UNAVAILABLE:
//         message += 'Location information unavailable.';
//         break;
//       case error.TIMEOUT:
//         message += 'Location request timed out.';
//         break;
//       default:
//         message += 'Unknown error occurred.';
//     }

//     alert(message);
//   }

//   /**
//    * =============================================
//    * EVENT LISTENER METHODS
//    * =============================================
//    */

//   /**
//    * Setup all event listeners in one place
//    * Makes it easy to see all interactions
//    */
//   _attachEventListeners() {
//     // Toggle elevation/cadence when type changes
//     this.inputType.addEventListener(
//       'change',
//       this._toggleElevationField.bind(this)
//     );

//     // ✅ FIXED: Listen on FORM, not container
//     // Form's submit event handles Enter key automatically
//     this.form.addEventListener('submit', this._handleFormSubmit.bind(this));

//     // Allow escape key to cancel form entry
//     document.addEventListener('keydown', this._handleEscapeKey.bind(this));

//     // Click workout to navigate to it on map
//     // This is added here, but will only work after map loads
//     this.containerWorkouts.addEventListener(
//       'click',
//       this._moveToPopup.bind(this)
//     );
//   }

//   /**
//    * Attach map click handler
//    * MUST be called AFTER map is loaded
//    */
//   _attachMapClickHandler() {
//     this.#map.on('click', this._showForm.bind(this));
//   }

//   /**
//    * Toggle between cadence (running) and elevation (cycling)
//    * Called when user changes workout type dropdown
//    */
//   _toggleElevationField() {
//     // .closest() finds the parent .form__row element
//     // .toggle() adds class if not present, removes if present
//     this.inputElevation
//       .closest('.form__row')
//       .classList.toggle('form__row--hidden');
//     this.inputCadence
//       .closest('.form__row')
//       .classList.toggle('form__row--hidden');
//   }

//   /**
//    * =============================================
//    * FORM HANDLING METHODS
//    * =============================================
//    */

//   /**
//    * Show form when map is clicked
//    * Place temporary marker at click location
//    */
//   _showForm(mapEvent) {
//     // Prevent multiple markers if form already open
//     if (this.#isFormActive) return;

//     // Mark form as active
//     this.#isFormActive = true;

//     // Remove old marker if exists
//     if (this.#currentMarker) {
//       this.#map.removeLayer(this.#currentMarker);
//     }

//     // Extract clicked coordinates
//     const { lat, lng } = mapEvent.latlng;

//     // Create custom marker icon
//     const icon = L.icon({
//       iconUrl: 'marker-icon.png',
//       iconSize: [60, 60],
//       iconAnchor: [33, 68],
//       popupAnchor: [-3, -76],
//     });

//     // Place marker on map
//     this.#currentMarker = L.marker([lat, lng], { icon }).addTo(this.#map);

//     // Show the form
//     this.form.classList.remove('hidden');

//     // Focus first input for better UX
//     this.inputDistance.focus();
//   }

//   /**
//    * Hide form and reset it
//    */
//   _hideForm() {
//     // Clear input values
//     this.inputDistance.value = '';
//     this.inputDuration.value = '';
//     this.inputCadence.value = '';
//     this.inputElevation.value = '';

//     // Hide form with animation
//     this.form.classList.add('hidden');

//     // Reset state
//     this.#isFormActive = false;
//   }

//   /**
//    * Cancel form entry (removes marker too)
//    * Called when user presses Escape
//    */
//   _cancelForm() {
//     // Remove marker from map
//     if (this.#currentMarker) {
//       this.#map.removeLayer(this.#currentMarker);
//       this.#currentMarker = null;
//     }

//     // Hide form
//     this._hideForm();
//   }

//   /**
//    * Handle Escape key press
//    */
//   _handleEscapeKey(e) {
//     // Only cancel if Escape is pressed AND form is active
//     if (e.key === 'Escape' && this.#isFormActive) {
//       this._cancelForm();
//     }
//   }

//   /**
//    * =============================================
//    * FORM SUBMISSION & VALIDATION
//    * =============================================
//    */

//   /**
//    * Handle form submission
//    * This is the MAIN method that processes new workouts
//    */
//   _handleFormSubmit(e) {
//     // Prevent page reload (default form behavior)
//     e.preventDefault();

//     // STEP 1: Get form values
//     const type = this.inputType.value;
//     const distance = this.inputDistance.value;
//     const duration = this.inputDuration.value;
//     const cadence = this.inputCadence.value;
//     const elevation = this.inputElevation.value;

//     // STEP 2: Validate inputs
//     const validationError = this._validateInputs(
//       type,
//       distance,
//       duration,
//       cadence,
//       elevation
//     );

//     if (validationError) {
//       alert(validationError);
//       return; // Stop here if validation fails
//     }

//     // STEP 3: Get marker coordinates
//     if (!this.#currentMarker) {
//       alert('No location selected');
//       return;
//     }

//     const { lat, lng } = this.#currentMarker.getLatLng();
//     const coords = [lat, lng];

//     // STEP 4: Get current date
//     const date = this._getCurrentDate();

//     // STEP 5: Create workout object
//     let workout;

//     if (type === 'running') {
//       // Create Running object
//       workout = new Running(
//         parseFloat(distance),
//         parseFloat(duration),
//         coords,
//         date,
//         parseFloat(cadence)
//       );
//     } else {
//       // Create Cycling object
//       workout = new Cycling(
//         parseFloat(distance),
//         parseFloat(duration),
//         coords,
//         date,
//         parseFloat(elevation)
//       );
//     }

//     // STEP 6: Add to workouts array
//     this.#workouts.push(workout);

//     // STEP 7: Display on map
//     this._renderWorkoutMarker(workout);

//     // STEP 8: Display in sidebar list
//     this._renderWorkout(workout);

//     // STEP 9: Save to localStorage
//     this._setLocalStorage();

//     // STEP 10: Hide form and reset
//     this._hideForm();
//   }

//   /**
//    * ✅ FIXED: Proper validation with AND logic
//    * Returns error message or null if valid
//    */
//   _validateInputs(type, distance, duration, cadence, elevation) {
//     // Convert to numbers for validation
//     const dist = parseFloat(distance);
//     const dur = parseFloat(duration);
//     const cad = parseFloat(cadence);
//     const elev = parseFloat(elevation);

//     // Check if main fields are filled
//     if (!distance || !duration) {
//       return '⚠️ Please fill in Distance and Duration';
//     }

//     // Check if values are valid numbers
//     if (isNaN(dist) || isNaN(dur)) {
//       return '⚠️ Distance and Duration must be valid numbers';
//     }

//     // ✅ FIXED: Use AND (&&) not OR (||)
//     // Both must be positive
//     if (dist <= 0 || dur <= 0) {
//       return '⚠️ Distance and Duration must be positive numbers';
//     }

//     // Validate type-specific field
//     if (type === 'running') {
//       if (!cadence || isNaN(cad) || cad <= 0) {
//         return '⚠️ Cadence must be a positive number';
//       }
//     } else {
//       if (!elevation || isNaN(elev) || elev < 0) {
//         return '⚠️ Elevation must be a non-negative number';
//       }
//     }

//     // All validations passed
//     return null;
//   }

//   /**
//    * Get current date formatted as "Month Day"
//    */
//   _getCurrentDate() {
//     const today = new Date();
//     const month = today.toLocaleString('default', { month: 'long' });
//     const day = today.toLocaleString('default', { day: '2-digit' });
//     return `${month} ${day}`;
//   }

//   /**
//    * =============================================
//    * RENDERING METHODS (Display workouts)
//    * =============================================
//    */

//   /**
//    * Display workout marker on map with popup
//    */
//   _renderWorkoutMarker(workout) {
//     // Add popup to the current marker
//     const popupContent = `${workout.getEmoji()} ${workout.getDescription()}`;

//     this.#currentMarker
//       .bindPopup(popupContent, {
//         autoClose: false, // Keep popup open
//         closeOnClick: false, // Don't close when map is clicked
//         className: `${workout.type}-popup`, // CSS class for styling
//       })
//       .openPopup();

//     // Reset current marker (it's now permanent)
//     this.#currentMarker = null;
//   }

//   /**
//    * Display workout in sidebar list
//    * Creates HTML element and adds to DOM
//    */
//   _renderWorkout(workout) {
//     // Start with common HTML for all workouts
//     let html = `
//       <li class="workout workout--${workout.type}" data-id="${workout.id}">
//         <h2 class="workout__title">${workout.getDescription()}</h2>
//         <div class="workout__details">
//           <span class="workout__icon">${workout.getEmoji()}</span>
//           <span class="workout__value">${workout.distance}</span>
//           <span class="workout__unit">km</span>
//         </div>
//         <div class="workout__details">
//           <span class="workout__icon">⏱</span>
//           <span class="workout__value">${workout.duration}</span>
//           <span class="workout__unit">min</span>
//         </div>
//     `;

//     // Add type-specific HTML
//     if (workout.type === 'running') {
//       html += `
//         <div class="workout__details">
//           <span class="workout__icon">⚡️</span>
//           <span class="workout__value">${workout.pace}</span>
//           <span class="workout__unit">min/km</span>
//         </div>
//         <div class="workout__details">
//           <span class="workout__icon">🦶🏼</span>
//           <span class="workout__value">${workout.cadence}</span>
//           <span class="workout__unit">spm</span>
//         </div>
//       `;
//     }

//     if (workout.type === 'cycling') {
//       html += `
//         <div class="workout__details">
//           <span class="workout__icon">⚡️</span>
//           <span class="workout__value">${workout.speed}</span>
//           <span class="workout__unit">km/h</span>
//         </div>
//         <div class="workout__details">
//           <span class="workout__icon">⛰</span>
//           <span class="workout__value">${workout.elevationGain}</span>
//           <span class="workout__unit">m</span>
//         </div>
//       `;
//     }

//     html += `</li>`;

//     // Insert HTML into DOM
//     // insertAdjacentHTML adds HTML without destroying existing elements
//     this.form.insertAdjacentHTML('afterend', html);
//   }

//   /**
//    * Move map to clicked workout's location
//    */
//   _moveToPopup(e) {
//     // Find the workout element that was clicked
//     const workoutEl = e.target.closest('.workout');

//     // If clicked outside workout, do nothing
//     if (!workoutEl) return;

//     // Find workout in array
//     const workout = this.#workouts.find(w => w.id === workoutEl.dataset.id);

//     // ✅ FIXED: Check if workout exists
//     if (!workout) {
//       console.error('Workout not found');
//       return;
//     }

//     // ✅ FIXED: Check if map is loaded
//     if (!this.#map) {
//       console.error('Map not initialized');
//       return;
//     }

//     // Move map to workout location with smooth animation
//     this.#map.setView(workout.coords, this.#mapZoomLevel, {
//       animate: true,
//       pan: {
//         duration: 1, // Animation duration in seconds
//       },
//     });
//   }

//   /**
//    * Render saved workouts on map (after page reload)
//    */
//   _renderSavedWorkoutsOnMap() {
//     this.#workouts.forEach(workout => {
//       // Create marker icon
//       const icon = L.icon({
//         iconUrl: 'marker-icon.png',
//         iconSize: [60, 60],
//         iconAnchor: [33, 68],
//         popupAnchor: [-3, -76],
//       });

//       // Create marker
//       const marker = L.marker(workout.coords, { icon }).addTo(this.#map);

//       // Add popup
//       marker.bindPopup(`${workout.getEmoji()} ${workout.getDescription()}`, {
//         autoClose: false,
//         closeOnClick: false,
//         className: `${workout.type}-popup`,
//       });
//     });
//   }

//   /**
//    * =============================================
//    * LOCAL STORAGE METHODS
//    * =============================================
//    */

//   /**
//    * ✅ FIXED: Proper error handling for localStorage
//    */
//   _setLocalStorage() {
//     try {
//       // Convert workouts array to JSON string
//       const jsonString = JSON.stringify(this.#workouts);

//       // Save to localStorage
//       localStorage.setItem('workouts', jsonString);
//     } catch (error) {
//       console.error('Failed to save workouts:', error);

//       // Provide user-friendly error message
//       if (error.name === 'QuotaExceededError') {
//         alert('Storage is full. Please delete some workouts.');
//       } else {
//         alert('Could not save workout. Please try again.');
//       }
//     }
//   }

//   /**
//    * ✅ FIXED: Proper error handling and null check
//    */
//   _getLocalStorage() {
//     try {
//       // Get data from localStorage
//       const data = localStorage.getItem('workouts');

//       // ✅ Check if data exists BEFORE parsing
//       if (!data) {
//         console.log('No saved workouts found');
//         return;
//       }

//       // Parse JSON string to array
//       const workoutsData = JSON.parse(data);

//       // Recreate workout objects from plain data
//       this.#workouts = workoutsData.map(data => {
//         // Check type and create appropriate object
//         if (data.type === 'running') {
//           return new Running(
//             data.distance,
//             data.duration,
//             data.coords,
//             data.date,
//             data.cadence
//           );
//         } else {
//           return new Cycling(
//             data.distance,
//             data.duration,
//             data.coords,
//             data.date,
//             data.elevationGain
//           );
//         }
//       });

//       // Display all loaded workouts in sidebar
//       this.#workouts.forEach(workout => {
//         this._renderWorkout(workout);
//       });
//     } catch (error) {
//       console.error('Failed to load workouts:', error);
//       alert('Could not load saved workouts. Starting fresh.');
//       this.#workouts = [];
//     }
//   }

//   /**
//    * PUBLIC METHOD: Reset all workouts
//    * This can be called from browser console: app.reset()
//    */
//   reset() {
//     localStorage.removeItem('workouts');
//     location.reload(); // Reload page
//   }
// }

// // ============================================
// // START THE APPLICATION
// // ============================================
// /**
//  * Create ONE instance of App
//  * This runs the constructor, which:
//  * 1. Gets user location
//  * 2. Loads the map
//  * 3. Loads saved workouts
//  * 4. Sets up event listeners
//  */
// const app = new App();

// /**
//  * =============================================
//  * 🎓 LEARNING SUMMARY: WHY OOP IS BETTER
//  * =============================================
//  *
//  * BEFORE (Your Spaghetti Code):
//  * ❌ 10+ global variables floating around
//  * ❌ Functions scattered everywhere
//  * ❌ Hard to find related code
//  * ❌ Easy to accidentally modify global state
//  * ❌ Difficult to test individual pieces
//  *
//  * AFTER (OOP):
//  * ✅ Everything organized in classes
//  * ✅ Related data and functions together
//  * ✅ Private fields protect internal state
//  * ✅ Clear method names show intent
//  * ✅ Easy to add features (just add methods)
//  * ✅ Can create multiple App instances if needed
//  *
//  * REAL EXAMPLE:
//  * -------------
//  * User runs 5.7 km in 30 minutes with cadence 170
//  *
//  * 1. App class receives form submission
//  * 2. Validates: 5.7 > 0 ✓, 30 > 0 ✓, 170 > 0 ✓
//  * 3. Creates: new Running(5.7, 30, [14.5, 121.0], 'Nov 30', 170)
//  * 4. Running constructor calls calcPace()
//  * 5. Pace = 30 / 5.7 = 5.26 min/km
//  * 6. Workout added to #workouts array
//  * 7. Marker displayed on map
//  * 8. HTML added to sidebar
//  * 9. Saved to localStorage
//  *
//  * All organized, predictable, and bug-free! 🎉
//  */

// 'use strict';

// /**
//  * ============================================
//  * PART 4: FUNCTIONAL PROGRAMMING (FP)
//  * ============================================
//  *
//  * 🎯 WHAT IS FUNCTIONAL PROGRAMMING?
//  * -----------------------------------
//  * A style where you:
//  * 1. Write PURE FUNCTIONS (no side effects)
//  * 2. Never MUTATE data (create new instead)
//  * 3. COMPOSE small functions into bigger ones
//  * 4. Treat functions as VALUES (pass them around)
//  *
//  * Think of it like a RECIPE:
//  * - Each step is a pure function
//  * - Input ingredients → Output dish
//  * - Never changes the original ingredients
//  * - Can follow recipe again with same result
//  *
//  * 🔑 KEY FP CONCEPTS:
//  * -------------------
//  * 1. PURE FUNCTIONS: Same input = same output, always
//  * 2. IMMUTABILITY: Never modify data, create new copies
//  * 3. FIRST-CLASS FUNCTIONS: Functions are values
//  * 4. HIGHER-ORDER FUNCTIONS: Functions that take/return functions
//  * 5. FUNCTION COMPOSITION: Combine simple functions
//  */

// /**
//  * ============================================
//  * CONCEPT #1: PURE FUNCTIONS
//  * ============================================
//  *
//  * IMPURE (Your original code):
//  * ```javascript
//  * let movements = [];
//  *
//  * function addMovement(movement) {
//  *   movements.push(movement);  // ❌ Modifies global variable
//  *   saveToLocalStorage();      // ❌ Side effect
//  * }
//  * ```
//  *
//  * PURE (FP approach):
//  * ```javascript
//  * function addWorkout(workouts, newWorkout) {
//  *   return [...workouts, newWorkout];  // ✓ Creates new array
//  * }
//  * ```
//  *
//  * Benefits:
//  * - Predictable: Same inputs = same outputs
//  * - Testable: No hidden dependencies
//  * - Cacheable: Can save results
//  * - Parallel-safe: Can run simultaneously
//  */

// // ============================================
// // UTILITY FUNCTIONS (Pure)
// // ============================================

// /**
//  * Get current date formatted as "Month Day"
//  * PURE: Same moment = same output
//  */
// const getCurrentDate = () => {
//   const today = new Date();
//   const month = today.toLocaleString('default', { month: 'long' });
//   const day = today.toLocaleString('default', { day: '2-digit' });
//   return `${month} ${day}`;
// };

// /**
//  * Generate unique ID
//  * PURE: Based only on current timestamp
//  */
// const generateId = () => Date.now().toString();

// /**
//  * Get emoji for workout type
//  * PURE: Same type = same emoji, always
//  *
//  * Example:
//  * getEmoji('running')  → '🏃‍♂️'
//  * getEmoji('cycling')  → '🚴‍♀️'
//  */
// const getEmoji = (type) => {
//   // Using object lookup (alternative to if/else)
//   const emojis = {
//     running: '🏃‍♂️',
//     cycling: '🚴‍♀️'
//   };
//   return emojis[type] || '❓';
// };

// /**
//  * Format workout description
//  * PURE: Same inputs = same output
//  *
//  * Example:
//  * formatDescription('running', 'Nov 30')  → 'Running on Nov 30'
//  */
// const formatDescription = (type, date) => {
//   const typeCapitalized = type[0].toUpperCase() + type.slice(1);
//   return `${typeCapitalized} on ${date}`;
// };

// /**
//  * ============================================
//  * CONCEPT #2: IMMUTABILITY
//  * ============================================
//  *
//  * MUTABLE (Your original code):
//  * ```javascript
//  * movements.push(newMovement);     // ❌ Changes array
//  * movement.distance = Number(...); // ❌ Changes object
//  * ```
//  *
//  * IMMUTABLE (FP approach):
//  * ```javascript
//  * const newWorkouts = [...workouts, newWorkout];  // ✓ New array
//  * const updated = { ...workout, distance: 5 };    // ✓ New object
//  * ```
//  *
//  * Why immutability?
//  * - Easier debugging (data never changes unexpectedly)
//  * - Time-travel debugging (can see every state)
//  * - No side effects (safe to use anywhere)
//  * - Better for React, Redux, etc.
//  */

// /**
//  * ============================================
//  * CALCULATION FUNCTIONS (Pure)
//  * ============================================
//  */

// /**
//  * Calculate running pace (min/km)
//  * PURE: Same distance & duration = same pace
//  *
//  * Formula: duration / distance
//  * Example: 30 min / 5 km = 6 min/km
//  *
//  * @param {number} distance - kilometers
//  * @param {number} duration - minutes
//  * @returns {string} - pace with 2 decimals
//  */
// const calculatePace = (distance, duration) => {
//   // Guard clause for invalid input
//   if (!distance || distance <= 0) return '0.00';
//   if (!duration || duration <= 0) return '0.00';

//   const pace = duration / distance;
//   return pace.toFixed(2);
// };

// /**
//  * Calculate cycling speed (km/h)
//  * PURE: Same distance & duration = same speed
//  *
//  * Formula: (distance / duration) * 60
//  * Example: (10 km / 30 min) * 60 = 20 km/h
//  *
//  * @param {number} distance - kilometers
//  * @param {number} duration - minutes
//  * @returns {string} - speed with 2 decimals
//  */
// const calculateSpeed = (distance, duration) => {
//   // Guard clause
//   if (!distance || distance <= 0) return '0.00';
//   if (!duration || duration <= 0) return '0.00';

//   const speed = (distance / duration) * 60;
//   return speed.toFixed(2);
// };

// /**
//  * ============================================
//  * CONCEPT #3: HIGHER-ORDER FUNCTIONS
//  * ============================================
//  *
//  * A function that:
//  * - Takes a function as argument, OR
//  * - Returns a function
//  *
//  * Example from Array methods:
//  * ```javascript
//  * const numbers = [1, 2, 3, 4, 5];
//  *
//  * // map() is a higher-order function
//  * // It takes a function (n => n * 2) as argument
//  * const doubled = numbers.map(n => n * 2);
//  * // [2, 4, 6, 8, 10]
//  * ```
//  */

// /**
//  * Create a field validator function
//  * HIGHER-ORDER: Returns a validation function
//  *
//  * Usage:
//  * const validateDistance = createValidator('Distance', 0.1);
//  * validateDistance('5.7')    → null (valid)
//  * validateDistance('-5')     → 'Distance must be at least 0.1'
//  * validateDistance('abc')    → 'Distance must be a number'
//  *
//  * @param {string} fieldName - Name to show in error
//  * @param {number} minValue - Minimum allowed value
//  * @returns {function} - Validator function
//  */
// const createValidator = (fieldName, minValue = 0) => {
//   // THIS IS THE RETURNED FUNCTION
//   return (value) => {
//     // Check if empty
//     if (!value || value === '') {
//       return `${fieldName} is required`;
//     }

//     // Convert to number
//     const num = parseFloat(value);

//     // Check if valid number
//     if (isNaN(num)) {
//       return `${fieldName} must be a number`;
//     }

//     // Check if meets minimum
//     if (num < minValue) {
//       return `${fieldName} must be at least ${minValue}`;
//     }

//     // All checks passed
//     return null;
//   };
// };

// /**
//  * Create specific validators using createValidator
//  * These are SPECIALIZED validators
//  */
// const validateDistance = createValidator('Distance', 0.1);
// const validateDuration = createValidator('Duration', 1);
// const validateCadence = createValidator('Cadence', 1);
// const validateElevation = createValidator('Elevation', 0);

// /**
//  * Example usage:
//  *
//  * validateDistance('5.7')   → null (valid!)
//  * validateDistance('0')     → 'Distance must be at least 0.1'
//  * validateDistance('abc')   → 'Distance must be a number'
//  * validateDistance('')      → 'Distance is required'
//  *
//  * validateDuration('30')    → null (valid!)
//  * validateDuration('-10')   → 'Duration must be at least 1'
//  */

// /**
//  * Validate all form inputs
//  * PURE: Same inputs = same result
//  *
//  * @param {object} formData - { type, distance, duration, cadence, elevation }
//  * @returns {string|null} - Error message or null if valid
//  */
// const validateFormData = (formData) => {
//   const { type, distance, duration, cadence, elevation } = formData;

//   // Validate common fields
//   const distanceError = validateDistance(distance);
//   if (distanceError) return distanceError;

//   const durationError = validateDuration(duration);
//   if (durationError) return durationError;

//   // Validate type-specific field
//   if (type === 'running') {
//     const cadenceError = validateCadence(cadence);
//     if (cadenceError) return cadenceError;
//   } else {
//     const elevationError = validateElevation(elevation);
//     if (elevationError) return elevationError;
//   }

//   // All valid
//   return null;
// };

// /**
//  * ============================================
//  * WORKOUT CREATION (Pure Functions)
//  * ============================================
//  */

// /**
//  * Create a workout object
//  * PURE: Same inputs = same workout object
//  * IMMUTABLE: Returns NEW object, doesn't modify anything
//  *
//  * This replaces the Workout/Running/Cycling classes from OOP
//  *
//  * @param {object} data - All workout data
//  * @returns {object} - Complete workout object
//  */
// const createWorkout = (data) => {
//   const { type, distance, duration, coords, date, cadence, elevation } = data;

//   // Create base workout object
//   const baseWorkout = {
//     id: generateId(),
//     type,
//     distance: parseFloat(distance),
//     duration: parseFloat(duration),
//     coords,
//     date,
//     emoji: getEmoji(type),
//     description: formatDescription(type, date)
//   };

//   // Add type-specific properties
//   if (type === 'running') {
//     return {
//       ...baseWorkout,           // Spread operator: copy all properties
//       cadence: parseFloat(cadence),
//       pace: calculatePace(distance, duration)
//     };
//   } else {
//     return {
//       ...baseWorkout,
//       elevationGain: parseFloat(elevation),
//       speed: calculateSpeed(distance, duration)
//     };
//   }
// };

// /**
//  * Example:
//  *
//  * const runData = {
//  *   type: 'running',
//  *   distance: '5.7',
//  *   duration: '30',
//  *   coords: [14.5, 121.0],
//  *   date: 'Nov 30',
//  *   cadence: '170',
//  *   elevation: ''
//  * };
//  *
//  * const workout = createWorkout(runData);
//  *
//  * Result:
//  * {
//  *   id: "1732997123456",
//  *   type: "running",
//  *   distance: 5.7,
//  *   duration: 30,
//  *   coords: [14.5, 121.0],
//  *   date: "Nov 30",
//  *   emoji: "🏃‍♂️",
//  *   description: "Running on Nov 30",
//  *   cadence: 170,
//  *   pace: "5.26"
//  * }
//  */

// /**
//  * ============================================
//  * ARRAY OPERATIONS (Immutable)
//  * ============================================
//  */

// /**
//  * Add workout to workouts array
//  * IMMUTABLE: Returns NEW array, doesn't modify original
//  *
//  * Your code:    movements.push(newMovement);        ❌ Mutates
//  * FP approach:  addWorkout(workouts, newWorkout);   ✓ Creates new
//  *
//  * @param {array} workouts - Existing workouts
//  * @param {object} newWorkout - Workout to add
//  * @returns {array} - NEW array with workout added
//  */
// const addWorkout = (workouts, newWorkout) => {
//   // Spread operator creates new array with all old items + new item
//   return [...workouts, newWorkout];
// };

// /**
//  * Example:
//  *
//  * const workouts = [workout1, workout2];
//  * const newWorkout = workout3;
//  *
//  * // This creates a NEW array, doesn't change 'workouts'
//  * const updatedWorkouts = addWorkout(workouts, newWorkout);
//  *
//  * console.log(workouts);         // [workout1, workout2] (unchanged!)
//  * console.log(updatedWorkouts);  // [workout1, workout2, workout3]
//  */

// /**
//  * Find workout by ID
//  * PURE: Same array & ID = same result
//  *
//  * @param {array} workouts - Array of workouts
//  * @param {string} id - Workout ID to find
//  * @returns {object|undefined} - Found workout or undefined
//  */
// const findWorkoutById = (workouts, id) => {
//   return workouts.find(workout => workout.id === id);
// };

// /**
//  * Remove workout by ID
//  * IMMUTABLE: Returns NEW array without the workout
//  *
//  * @param {array} workouts - Existing workouts
//  * @param {string} id - ID of workout to remove
//  * @returns {array} - NEW array without that workout
//  */
// const removeWorkout = (workouts, id) => {
//   // filter() creates new array with items that pass the test
//   return workouts.filter(workout => workout.id !== id);
// };

// /**
//  * Example:
//  *
//  * const workouts = [
//  *   { id: '123', ... },
//  *   { id: '456', ... },
//  *   { id: '789', ... }
//  * ];
//  *
//  * const updated = removeWorkout(workouts, '456');
//  *
//  * console.log(workouts);  // Still has 3 workouts (unchanged)
//  * console.log(updated);   // Only has workouts '123' and '789'
//  */

// /**
//  * ============================================
//  * HTML GENERATION (Pure Functions)
//  * ============================================
//  */

// /**
//  * Generate HTML for a workout
//  * PURE: Same workout = same HTML, always
//  *
//  * @param {object} workout - Workout object
//  * @returns {string} - HTML string
//  */
// const workoutToHTML = (workout) => {
//   // Common HTML for all types
//   const commonHTML = `
//     <li class="workout workout--${workout.type}" data-id="${workout.id}">
//       <h2 class="workout__title">${workout.description}</h2>
//       <div class="workout__details">
//         <span class="workout__icon">${workout.emoji}</span>
//         <span class="workout__value">${workout.distance}</span>
//         <span class="workout__unit">km</span>
//       </div>
//       <div class="workout__details">
//         <span class="workout__icon">⏱</span>
//         <span class="workout__value">${workout.duration}</span>
//         <span class="workout__unit">min</span>
//       </div>
//   `;

//   // Type-specific HTML
//   const specificHTML = workout.type === 'running'
//     ? `
//       <div class="workout__details">
//         <span class="workout__icon">⚡️</span>
//         <span class="workout__value">${workout.pace}</span>
//         <span class="workout__unit">min/km</span>
//       </div>
//       <div class="workout__details">
//         <span class="workout__icon">🦶🏼</span>
//         <span class="workout__value">${workout.cadence}</span>
//         <span class="workout__unit">spm</span>
//       </div>
//     `
//     : `
//       <div class="workout__details">
//         <span class="workout__icon">⚡️</span>
//         <span class="workout__value">${workout.speed}</span>
//         <span class="workout__unit">km/h</span>
//       </div>
//       <div class="workout__details">
//         <span class="workout__icon">⛰</span>
//         <span class="workout__value">${workout.elevationGain}</span>
//         <span class="workout__unit">m</span>
//       </div>
//     `;

//   return commonHTML + specificHTML + '</li>';
// };

// /**
//  * ============================================
//  * LOCAL STORAGE (Side Effects - Clearly Marked)
//  * ============================================
//  *
//  * These functions have SIDE EFFECTS (they interact with browser storage)
//  * In FP, we clearly separate pure functions from impure ones
//  *
//  * Pure functions: Most of the code above
//  * Impure functions: These storage functions below
//  */

// /**
//  * Save workouts to localStorage
//  * IMPURE: Has side effect (writes to storage)
//  *
//  * @param {array} workouts - Workouts to save
//  * @returns {object} - { success: boolean, error: string|null }
//  */
// const saveWorkouts = (workouts) => {
//   try {
//     const jsonString = JSON.stringify(workouts);
//     localStorage.setItem('workouts', jsonString);
//     return { success: true, error: null };
//   } catch (error) {
//     console.error('Save failed:', error);
//     return {
//       success: false,
//       error: error.name === 'QuotaExceededError'
//         ? 'Storage is full'
//         : 'Failed to save'
//     };
//   }
// };

// /**
//  * Load workouts from localStorage
//  * IMPURE: Has side effect (reads from storage)
//  *
//  * @returns {object} - { success: boolean, data: array, error: string|null }
//  */
// const loadWorkouts = () => {
//   try {
//     const data = localStorage.getItem('workouts');

//     // No data found
//     if (!data) {
//       return { success: true, data: [], error: null };
//     }

//     // Parse and return
//     const workouts = JSON.parse(data);
//     return { success: true, data: workouts, error: null };

//   } catch (error) {
//     console.error('Load failed:', error);
//     return { success: false, data: [], error: 'Failed to load' };
//   }
// };

// /**
//  * ============================================
//  * DOM QUERIES (Side Effects)
//  * ============================================
//  */

// /**
//  * Get all DOM elements
//  * IMPURE: Queries the DOM
//  *
//  * We do this ONCE at startup, then pass elements around
//  */
// const getDOMElements = () => ({
//   form: document.querySelector('.form'),
//   workoutsContainer: document.querySelector('.workouts'),
//   inputType: document.querySelector('.form__input--type'),
//   inputDistance: document.querySelector('.form__input--distance'),
//   inputDuration: document.querySelector('.form__input--duration'),
//   inputCadence: document.querySelector('.form__input--cadence'),
//   inputElevation: document.querySelector('.form__input--elevation'),
//   mapContainer: document.getElementById('map')
// });

// /**
//  * Get values from form inputs
//  * PURE: Same form state = same values
//  *
//  * @param {object} elements - DOM elements
//  * @returns {object} - Form values
//  */
// const getFormValues = (elements) => ({
//   type: elements.inputType.value,
//   distance: elements.inputDistance.value,
//   duration: elements.inputDuration.value,
//   cadence: elements.inputCadence.value,
//   elevation: elements.inputElevation.value
// });

// /**
//  * ============================================
//  * 🎓 LEARNING CHECKPOINT
//  * ============================================
//  *
//  * What we've learned so far:
//  *
//  * 1. PURE FUNCTIONS: predictable, testable
//  *    - calculatePace(5, 30) always returns same result
//  *
//  * 2. IMMUTABILITY: never modify, always create new
//  *    - addWorkout() returns new array
//  *
//  * 3. HIGHER-ORDER FUNCTIONS: functions that take/return functions
//  *    - createValidator() returns a validator function
//  *
//  * 4. COMPOSITION: combine simple functions
//  *    - createWorkout() uses getEmoji(), formatDescription(), etc.
//  *
//  * 5. SEPARATION: clearly mark pure vs impure
//  *    - Pure: calculations, validations
//  *    - Impure: localStorage, DOM
//  *
//  * NEXT (Part 5):
//  * - How to wire everything together
//  * - Event handling in FP style
//  * - State management without classes
//  * - Complete working application
//  */
// 'use strict';

// /**
//  * ============================================
//  * PART 5: FUNCTIONAL PROGRAMMING - COMPLETE APP
//  * ============================================
//  *
//  * This part shows how to wire together all the pure functions
//  * from Part 4 into a working application using FP principles.
//  *
//  * KEY CONCEPT: STATE MANAGEMENT IN FP
//  * ------------------------------------
//  * Without classes, how do we manage state?
//  *
//  * Answer: Use CLOSURES
//  *
//  * A closure is when a function "remembers" variables from
//  * its outer scope, even after that outer function has finished.
//  *
//  * Example:
//  * ```javascript
//  * function createCounter() {
//  *   let count = 0;              // Private variable
//  *
//  *   return {
//  *     increment: () => count++, // Remembers 'count'
//  *     getValue: () => count     // Remembers 'count'
//  *   };
//  * }
//  *
//  * const counter = createCounter();
//  * counter.increment();  // count = 1
//  * counter.increment();  // count = 2
//  * counter.getValue();   // Returns 2
//  * ```
//  */

// // Import all pure functions from Part 4 (conceptually)
// // In real code, these would be in separate modules

// // ============================================
// // STATE MANAGEMENT WITH CLOSURES
// // ============================================

// /**
//  * Create the application state manager
//  * Returns functions that can access and update state
//  *
//  * This is the FP equivalent of the App class from OOP
//  */
// const createAppState = () => {
//   // PRIVATE STATE (like # fields in OOP)
//   // These variables are trapped in closure
//   let workouts = [];
//   let map = null;
//   let currentMarker = null;
//   let isFormActive = false;

//   /**
//    * STATE GETTERS (read-only access)
//    * Pure functions that return state
//    */

//   const getWorkouts = () => workouts;
//   const getMap = () => map;
//   const getCurrentMarker = () => currentMarker;
//   const isFormCurrentlyActive = () => isFormActive;

//   /**
//    * STATE SETTERS (controlled mutation)
//    * These are the ONLY functions that can modify state
//    * Everything goes through them - no direct access!
//    */

//   /**
//    * Set workouts array
//    * In FP, we replace entire array instead of modifying
//    *
//    * @param {array} newWorkouts - New workouts array
//    */
//   const setWorkouts = (newWorkouts) => {
//     workouts = newWorkouts;
//   };

//   /**
//    * Add single workout (convenience method)
//    * Uses functional addWorkout() helper
//    */
//   const addWorkout = (workout) => {
//     // Create new array with workout added
//     const updated = [...workouts, workout];
//     workouts = updated;
//   };

//   /**
//    * Set map object
//    */
//   const setMap = (newMap) => {
//     map = newMap;
//   };

//   /**
//    * Set current marker
//    */
//   const setCurrentMarker = (marker) => {
//     currentMarker = marker;
//   };

//   /**
//    * Set form active state
//    */
//   const setFormActive = (active) => {
//     isFormActive = active;
//   };

//   /**
//    * Clear current marker (set to null)
//    */
//   const clearCurrentMarker = () => {
//     currentMarker = null;
//     isFormActive = false;
//   };

//   // Return public interface
//   // Only these functions can access/modify state
//   return {
//     // Getters
//     getWorkouts,
//     getMap,
//     getCurrentMarker,
//     isFormCurrentlyActive,

//     // Setters
//     setWorkouts,
//     addWorkout,
//     setMap,
//     setCurrentMarker,
//     setFormActive,
//     clearCurrentMarker
//   };
// };

// // ============================================
// // UTILITY FUNCTIONS (from Part 4)
// // ============================================

// const getCurrentDate = () => {
//   const today = new Date();
//   const month = today.toLocaleString('default', { month: 'long' });
//   const day = today.toLocaleString('default', { day: '2-digit' });
//   return `${month} ${day}`;
// };

// const generateId = () => Date.now().toString();

// const getEmoji = (type) => type === 'running' ? '🏃‍♂️' : '🚴‍♀️';

// const formatDescription = (type, date) => {
//   const typeCapitalized = type[0].toUpperCase() + type.slice(1);
//   return `${typeCapitalized} on ${date}`;
// };

// const calculatePace = (distance, duration) => {
//   if (!distance || distance <= 0) return '0.00';
//   if (!duration || duration <= 0) return '0.00';
//   return (duration / distance).toFixed(2);
// };

// const calculateSpeed = (distance, duration) => {
//   if (!distance || distance <= 0) return '0.00';
//   if (!duration || duration <= 0) return '0.00';
//   return (distance / (duration / 60)).toFixed(2);
// };

// // ============================================
// // VALIDATION FUNCTIONS (from Part 4)
// // ============================================

// const createValidator = (fieldName, minValue = 0) => {
//   return (value) => {
//     if (!value || value === '') {
//       return `${fieldName} is required`;
//     }
//     const num = parseFloat(value);
//     if (isNaN(num)) {
//       return `${fieldName} must be a number`;
//     }
//     if (num < minValue) {
//       return `${fieldName} must be at least ${minValue}`;
//     }
//     return null;
//   };
// };

// const validateDistance = createValidator('Distance', 0.1);
// const validateDuration = createValidator('Duration', 1);
// const validateCadence = createValidator('Cadence', 1);
// const validateElevation = createValidator('Elevation', 0);

// const validateFormData = (formData) => {
//   const { type, distance, duration, cadence, elevation } = formData;

//   const distanceError = validateDistance(distance);
//   if (distanceError) return distanceError;

//   const durationError = validateDuration(duration);
//   if (durationError) return durationError;

//   if (type === 'running') {
//     const cadenceError = validateCadence(cadence);
//     if (cadenceError) return cadenceError;
//   } else {
//     const elevationError = validateElevation(elevation);
//     if (elevationError) return elevationError;
//   }

//   return null;
// };

// // ============================================
// // WORKOUT CREATION (from Part 4)
// // ============================================

// const createWorkout = (data) => {
//   const { type, distance, duration, coords, date, cadence, elevation } = data;

//   const baseWorkout = {
//     id: generateId(),
//     type,
//     distance: parseFloat(distance),
//     duration: parseFloat(duration),
//     coords,
//     date,
//     emoji: getEmoji(type),
//     description: formatDescription(type, date)
//   };

//   if (type === 'running') {
//     return {
//       ...baseWorkout,
//       cadence: parseFloat(cadence),
//       pace: calculatePace(distance, duration)
//     };
//   } else {
//     return {
//       ...baseWorkout,
//       elevationGain: parseFloat(elevation),
//       speed: calculateSpeed(distance, duration)
//     };
//   }
// };

// // ============================================
// // HTML GENERATION (from Part 4)
// // ============================================

// const workoutToHTML = (workout) => {
//   const commonHTML = `
//     <li class="workout workout--${workout.type}" data-id="${workout.id}">
//       <h2 class="workout__title">${workout.description}</h2>
//       <div class="workout__details">
//         <span class="workout__icon">${workout.emoji}</span>
//         <span class="workout__value">${workout.distance}</span>
//         <span class="workout__unit">km</span>
//       </div>
//       <div class="workout__details">
//         <span class="workout__icon">⏱</span>
//         <span class="workout__value">${workout.duration}</span>
//         <span class="workout__unit">min</span>
//       </div>
//   `;

//   const specificHTML = workout.type === 'running'
//     ? `
//       <div class="workout__details">
//         <span class="workout__icon">⚡️</span>
//         <span class="workout__value">${workout.pace}</span>
//         <span class="workout__unit">min/km</span>
//       </div>
//       <div class="workout__details">
//         <span class="workout__icon">🦶🏼</span>
//         <span class="workout__value">${workout.cadence}</span>
//         <span class="workout__unit">spm</span>
//       </div>
//     `
//     : `
//       <div class="workout__details">
//         <span class="workout__icon">⚡️</span>
//         <span class="workout__value">${workout.speed}</span>
//         <span class="workout__unit">km/h</span>
//       </div>
//       <div class="workout__details">
//         <span class="workout__icon">⛰</span>
//         <span class="workout__value">${workout.elevationGain}</span>
//         <span class="workout__unit">m</span>
//       </div>
//     `;

//   return commonHTML + specificHTML + '</li>';
// };

// // ============================================
// // STORAGE FUNCTIONS (from Part 4)
// // ============================================

// const saveWorkouts = (workouts) => {
//   try {
//     localStorage.setItem('workouts', JSON.stringify(workouts));
//     return { success: true, error: null };
//   } catch (error) {
//     console.error('Save failed:', error);
//     return {
//       success: false,
//       error: error.name === 'QuotaExceededError'
//         ? 'Storage is full'
//         : 'Failed to save'
//     };
//   }
// };

// const loadWorkouts = () => {
//   try {
//     const data = localStorage.getItem('workouts');
//     if (!data) {
//       return { success: true, data: [], error: null };
//     }
//     return { success: true, data: JSON.parse(data), error: null };
//   } catch (error) {
//     console.error('Load failed:', error);
//     return { success: false, data: [], error: 'Failed to load' };
//   }
// };

// // ============================================
// // DOM HELPERS
// // ============================================

// const getDOMElements = () => ({
//   form: document.querySelector('.form'),
//   workoutsContainer: document.querySelector('.workouts'),
//   inputType: document.querySelector('.form__input--type'),
//   inputDistance: document.querySelector('.form__input--distance'),
//   inputDuration: document.querySelector('.form__input--duration'),
//   inputCadence: document.querySelector('.form__input--cadence'),
//   inputElevation: document.querySelector('.form__input--elevation')
// });

// const getFormValues = (elements) => ({
//   type: elements.inputType.value,
//   distance: elements.inputDistance.value,
//   duration: elements.inputDuration.value,
//   cadence: elements.inputCadence.value,
//   elevation: elements.inputElevation.value
// });

// const clearFormInputs = (elements) => {
//   elements.inputDistance.value = '';
//   elements.inputDuration.value = '';
//   elements.inputCadence.value = '';
//   elements.inputElevation.value = '';
// };

// const showForm = (form) => {
//   form.classList.remove('hidden');
// };

// const hideForm = (form) => {
//   form.classList.add('hidden');
// };

// const toggleElevationField = (elements) => {
//   elements.inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
//   elements.inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
// };

// // ============================================
// // MAP HELPERS
// // ============================================

// const createMarkerIcon = () => L.icon({
//   iconUrl: 'marker-icon.png',
//   iconSize: [60, 60],
//   iconAnchor: [33, 68],
//   popupAnchor: [-3, -76],
// });

// const initializeMap = (lat, lng) => {
//   const map = L.map('map').setView([lat, lng], 17);

//   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 20,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//   }).addTo(map);

//   return map;
// };

// const createMapMarker = (map, coords, icon) => {
//   return L.marker(coords, { icon }).addTo(map);
// };

// const addPopupToMarker = (marker, content, className) => {
//   marker.bindPopup(content, {
//     autoClose: false,
//     closeOnClick: false,
//     className
//   }).openPopup();
//   return marker;
// };

// // ============================================
// // EVENT HANDLER CREATORS (Higher-Order Functions)
// // ============================================

// /**
//  * Creates map click handler
//  * This demonstrates CURRYING and CLOSURES
//  *
//  * Currying: Function that returns function
//  * Closure: Inner function remembers state and elements
//  */
// const createMapClickHandler = (state, elements) => {
//   /**
//    * This returned function has access to:
//    * - state (from closure)
//    * - elements (from closure)
//    * - e (from event)
//    */
//   return (e) => {
//     // Don't place marker if form already active
//     if (state.isFormCurrentlyActive()) return;

//     // Remove old marker if exists
//     const oldMarker = state.getCurrentMarker();
//     if (oldMarker) {
//       state.getMap().removeLayer(oldMarker);
//     }

//     // Create new marker
//     const icon = createMarkerIcon();
//     const marker = createMapMarker(
//       state.getMap(),
//       [e.latlng.lat, e.latlng.lng],
//       icon
//     );

//     // Update state
//     state.setCurrentMarker(marker);
//     state.setFormActive(true);

//     // Show form
//     showForm(elements.form);
//     elements.inputDistance.focus();
//   };
// };

// /**
//  * Creates form submit handler
//  */
// const createFormSubmitHandler = (state, elements) => {
//   return (e) => {
//     e.preventDefault();

//     // Get form values
//     const formValues = getFormValues(elements);

//     // Validate
//     const validationError = validateFormData(formValues);
//     if (validationError) {
//       alert(validationError);
//       return;
//     }

//     // Get marker coordinates
//     const marker = state.getCurrentMarker();
//     if (!marker) {
//       alert('No location selected');
//       return;
//     }

//     const coords = [marker.getLatLng().lat, marker.getLatLng().lng];

//     // Create workout object
//     const workoutData = {
//       ...formValues,
//       coords,
//       date: getCurrentDate()
//     };

//     const workout = createWorkout(workoutData);

//     // Add to state
//     state.addWorkout(workout);

//     // Save to storage
//     const saveResult = saveWorkouts(state.getWorkouts());
//     if (!saveResult.success) {
//       alert(saveResult.error);
//     }

//     // Display workout in sidebar
//     const html = workoutToHTML(workout);
//     elements.form.insertAdjacentHTML('afterend', html);

//     // Add popup to marker
//     addPopupToMarker(
//       marker,
//       `${workout.emoji} ${workout.description}`,
//       `${workout.type}-popup`
//     );

//     // Reset form
//     clearFormInputs(elements);
//     hideForm(elements.form);
//     state.clearCurrentMarker();
//   };
// };

// /**
//  * Creates workout click handler (navigate to workout)
//  */
// const createWorkoutClickHandler = (state) => {
//   return (e) => {
//     const workoutEl = e.target.closest('.workout');
//     if (!workoutEl) return;

//     const workoutId = workoutEl.dataset.id;
//     const workout = state.getWorkouts().find(w => w.id === workoutId);

//     if (!workout) {
//       console.error('Workout not found');
//       return;
//     }

//     const map = state.getMap();
//     if (!map) {
//       console.error('Map not initialized');
//       return;
//     }

//     map.setView(workout.coords, 17, {
//       animate: true,
//       pan: { duration: 1 }
//     });
//   };
// };

// /**
//  * Creates escape key handler
//  */
// const createEscapeKeyHandler = (state, elements) => {
//   return (e) => {
//     if (e.key === 'Escape' && state.isFormCurrentlyActive()) {
//       // Remove marker
//       const marker = state.getCurrentMarker();
//       if (marker) {
//         state.getMap().removeLayer(marker);
//       }

//       // Hide form
//       clearFormInputs(elements);
//       hideForm(elements.form);
//       state.clearCurrentMarker();
//     }
//   };
// };

// // ============================================
// // RENDERING FUNCTIONS
// // ============================================

// /**
//  * Render saved workouts on map
//  */
// const renderWorkoutsOnMap = (workouts, map) => {
//   const icon = createMarkerIcon();

//   workouts.forEach(workout => {
//     const marker = createMapMarker(map, workout.coords, icon);
//     addPopupToMarker(
//       marker,
//       `${workout.emoji} ${workout.description}`,
//       `${workout.type}-popup`
//     );
//   });
// };

// /**
//  * Render saved workouts in sidebar
//  */
// const renderWorkoutsInSidebar = (workouts, formElement) => {
//   workouts.forEach(workout => {
//     const html = workoutToHTML(workout);
//     formElement.insertAdjacentHTML('afterend', html);
//   });
// };

// // ============================================
// // INITIALIZATION FUNCTION
// // ============================================

// /**
//  * Main initialization function
//  * This is the entry point of the application
//  */
// const initializeApp = () => {
//   // Create state manager
//   const state = createAppState();

//   // Get DOM elements once
//   const elements = getDOMElements();

//   // Load saved workouts
//   const loadResult = loadWorkouts();
//   if (loadResult.success && loadResult.data.length > 0) {
//     state.setWorkouts(loadResult.data);
//     renderWorkoutsInSidebar(loadResult.data, elements.form);
//   }

//   // Setup event listeners
//   elements.inputType.addEventListener(
//     'change',
//     () => toggleElevationField(elements)
//   );

//   elements.form.addEventListener(
//     'submit',
//     createFormSubmitHandler(state, elements)
//   );

//   document.addEventListener(
//     'keydown',
//     createEscapeKeyHandler(state, elements)
//   );

//   elements.workoutsContainer.addEventListener(
//     'click',
//     createWorkoutClickHandler(state)
//   );

//   // Request geolocation
//   navigator.geolocation.getCurrentPosition(
//     // Success callback
//     (position) => {
//       const { latitude, longitude } = position.coords;

//       try {
//         // Initialize map
//         const map = initializeMap(latitude, longitude);
//         state.setMap(map);

//         // Attach map click handler
//         map.on('click', createMapClickHandler(state, elements));

//         // Render saved workouts on map
//         if (state.getWorkouts().length > 0) {
//           renderWorkoutsOnMap(state.getWorkouts(), map);
//         }

//       } catch (error) {
//         console.error('Map initialization failed:', error);
//         alert('Failed to load map');
//       }
//     },
//     // Error callback
//     (error) => {
//       console.error('Geolocation error:', error);
//       alert('Could not get your location');
//     },
//     // Options
//     {
//       enableHighAccuracy: true,
//       timeout: 5000,
//       maximumAge: 0
//     }
//   );
// };

// // ============================================
// // START THE APP
// // ============================================
// initializeApp();

// /**
//  * =============================================
//  * 🎓 FP VS OOP COMPARISON
//  * =============================================
//  *
//  * OOP (Part 2):
//  * -------------
//  * class App {
//  *   #workouts = [];           // Private field
//  *   #map = null;
//  *
//  *   constructor() {
//  *     this._init();           // Method call
//  *   }
//  *
//  *   _handleSubmit(e) {
//  *     this.#workouts.push(workout);  // Mutation
//  *     this._save();           // Method call
//  *   }
//  * }
//  *
//  * FP (This Part):
//  * ---------------
//  * const createAppState = () => {
//  *   let workouts = [];         // Closure variable
//  *   let map = null;
//  *
//  *   return {
//  *     addWorkout: (w) => {
//  *       workouts = [...workouts, w];  // Immutable update
//  *     }
//  *   };
//  * };
//  *
//  * const handleSubmit = (state) => (e) => {
//  *   const updated = addWorkout(state.getWorkouts(), workout);
//  *   state.setWorkouts(updated);  // Controlled update
//  * };
//  *
//  * =============================================
//  * BENEFITS OF FP APPROACH:
//  * =============================================
//  *
//  * 1. TESTABILITY
//  *    - Pure functions easy to test in isolation
//  *    - No need to mock classes or dependencies
//  *    Example:
//  *    expect(calculatePace(5, 30)).toBe('6.00');
//  *
//  * 2. PREDICTABILITY
//  *    - Same inputs always produce same outputs
//  *    - No hidden state changes
//  *    Example:
//  *    const w1 = createWorkout(data);
//  *    const w2 = createWorkout(data);
//  *    // w1 and w2 have same properties
//  *
//  * 3. DEBUGGING
//  *    - Easy to trace data flow
//  *    - No "this" confusion
//  *    - Can log at any step
//  *
//  * 4. REUSABILITY
//  *    - Functions are independent
//  *    - Can use them anywhere
//  *    Example:
//  *    calculatePace() can be used in React, Vue, Node.js
//  *
//  * 5. COMPOSITION
//  *    - Combine small functions into bigger ones
//  *    Example:
//  *    const createAndValidate = (data) => {
//  *      const error = validateFormData(data);
//  *      return error ? null : createWorkout(data);
//  *    };
//  *
//  * =============================================
//  * WHEN TO USE EACH:
//  * =============================================
//  *
//  * Use OOP when:
//  * - Building large applications with many related entities
//  * - Need inheritance hierarchies
//  * - Working with teams familiar with OOP
//  * - Using frameworks that expect classes (Angular)
//  *
//  * Use FP when:
//  * - Building data transformation pipelines
//  * - Need high testability and reliability
//  * - Working with React, Redux, or functional libraries
//  * - Want maximum predictability
//  *
//  * Best approach: MIX BOTH!
//  * - Use classes for main app structure (OOP)
//  * - Use pure functions for calculations (FP)
//  * - Use immutability where possible (FP)
//  * - Use methods for actions (OOP)
//  */
