import { Component, AfterViewInit } from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-mapa',
  imports: [],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa implements AfterViewInit {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();

  ngAfterViewInit(): void {
    const map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 29.0892, lng: -110.961 },
      zoom: 14
    });

    this.directionsRenderer.setMap(map);

    this.directionsService.route(
      {
        origin: "Andrez Perez de riva 410, 81121",
        destination: "Los Mochis",
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(response);
        }
      }
    );
  }

}
