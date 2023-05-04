'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App {
  #map;
  #mapEvent;

  constructor() {
    this.__getPosition();

    form.addEventListener('submit', this.__newWorkout.bind(this));

    inputType.addEventListener('change', this.__toggleElevationField);
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
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    console.log(this);

    this.#map = L.map('map').setView(coords, 13);
    //   console.log(map)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    ////Handling clicks on map
    this.#map.on('click', this.__showForm.bind(this));
  }

  __showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  __toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  __newWorkout(e) {
    e.preventDefault();

    ///clearing input field

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ' ';
    ///DISPLAY MARKER

    const { lat, lng } = this.#mapEvent.latlng;

    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('WorkOut')
      .openPopup();
  }
}

const app = new App();
