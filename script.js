'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; ///// [latitude longitude]
    this.distance = distance; ////
    this.duration = duration;
  }

  __setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.__setDescription();
  }

  calcPace() {
    ///min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;
    this.calcSpeed();
    this.__setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}


/////////////////////////////////
///Application Architecture
class App {
  #map;
  #mapZoneLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    /////Get user's Position
    this.__getPosition();

    /////Get Data from Local Storage
    this.__getLocalStorage();

    ////Attached Event handlers
    form.addEventListener('submit', this.__newWorkout.bind(this));
    inputType.addEventListener('change', this.__toggleElevationField);
    containerWorkouts, addEventListener('click', this.__moveToPopUp.bind(this));
  }

  __getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.__loadMap.bind(this),
        function () {
          alert('Could not get current position');
        }
      );
    }
  }

  __loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    

    const coords = [latitude, longitude];


    this.#map = L.map('map').setView(coords, this.#mapZoneLevel);
    //   console.log(map)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    ////Handling clicks on map
    this.#map.on('click', this.__showForm.bind(this));

    this.#workouts.forEach(work => {
      this.__renderWorkoutMarker(work);
      
    })
  }

  __showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  __hideForm() {
    ////EMPTY INPUT
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ' ';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  __toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  __newWorkout(e) {
    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    ///get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    ////if activity is running, create a running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      ////check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be a Positive number');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    ////if activity is cycling, create a cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      ////check if data is valid
      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be a Positive number');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    ///Add now object to workout array
    this.#workouts.push(workout);

    ////Render workout on map as marker
    this.__renderWorkoutMarker(workout);

    ////render workout on list
    this.__renderWorkout(workout);

    /////hide form and clear input field

    this.__hideForm();

    ////Save to local storage
    this.__setLocalstorage();
  }

  __renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  __renderWorkout(workout) {
    let html = `
      
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;
    if (workout.type === 'running')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
      </li>
      `;
    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevGain}</span>
          <span class="workout__unit">m</span>
        </div>
        </li> 
      
      `;
    form.insertAdjacentHTML('afterend', html);
  }

  __moveToPopUp(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoneLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click();
  }

    /////save to local storage
  __setLocalstorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }


  /////retrieve from local storage
  __getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'))

    if(!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this.__renderWorkout(work);
      
    })
  }

  reset() {
    localStorage.removeItem('workout');

    location.reload();
  }
}

const app = new App();
