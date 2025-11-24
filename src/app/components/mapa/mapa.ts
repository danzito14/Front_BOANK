import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

declare const google: any;

export interface RutaInfo {
  distancia: string;
  duracion: string;
  distanciaMetros: number;
  duracionSegundos: number;
}

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa implements AfterViewInit, OnChanges, OnDestroy {
  @Input() destino: string = '';
  @Input() enRuta: boolean = false;
  @Input() idMapa: string = 'map';

  // Outputs como EventEmitter
  @Output() distanciaChange = new EventEmitter<string>();
  @Output() duracionChange = new EventEmitter<string>();
  @Output() rutaInfo = new EventEmitter<RutaInfo>();

  private map: any;
  private directionsService: any;
  private directionsRenderer: any;
  private origenFijo = "Andrez Perez de riva 410, 81121";
  private mapaInicializado = false;
  private watchId: number | null = null;

  // Variables locales para mostrar en template
  distancia = "";
  duracion = "";

  ngAfterViewInit(): void {
    setTimeout(() => this.inicializarMapa(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['destino'] || changes['enRuta']) && this.mapaInicializado) {
      this.actualizarRuta();
    }

    // Si enRuta cambia a true, iniciar seguimiento
    if (changes['enRuta']?.currentValue === true) {
      this.iniciarSeguimiento();
    } else if (changes['enRuta']?.currentValue === false) {
      this.detenerSeguimiento();
    }
  }

  ngOnDestroy(): void {
    this.detenerSeguimiento();
  }

  private inicializarMapa(): void {
    const mapElement = document.getElementById(this.idMapa);
    if (!mapElement) {
      console.error('Elemento del mapa no encontrado:', this.idMapa);
      return;
    }

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: { strokeColor: '#D0AF43', strokeWeight: 5 }
    });

    this.map = new google.maps.Map(mapElement, {
      center: { lat: 29.0892, lng: -110.961 },
      zoom: 14,
      styles: this.getMapStyles()
    });

    this.directionsRenderer.setMap(this.map);
    this.mapaInicializado = true;

    if (this.destino) this.actualizarRuta();
  }

  actualizarRuta(): void {
    if (!this.destino || !this.mapaInicializado) {
      this.limpiarRuta();
      return;
    }

    if (this.enRuta) {
      this.obtenerUbicacionActual()
        .then(ubicacion => this.trazarRuta(ubicacion, this.destino))
        .catch(() => this.trazarRuta(this.origenFijo, this.destino));
    } else {
      this.trazarRuta(this.origenFijo, this.destino);
    }
  }

  private obtenerUbicacionActual(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocalización no soportada');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }

  private trazarRuta(origen: string, destino: string): void {
    this.directionsService.route(
      {
        origin: origen,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(response);

          const route = response.routes[0].legs[0];
          this.distancia = route.distance.text;
          this.duracion = route.duration.text;

          // Emitir valores al padre
          this.distanciaChange.emit(this.distancia);
          this.duracionChange.emit(this.duracion);
          this.rutaInfo.emit({
            distancia: route.distance.text,
            duracion: route.duration.text,
            distanciaMetros: route.distance.value,
            duracionSegundos: route.duration.value
          });

          console.log(`📍 ${this.distancia} | ⏱️ ${this.duracion}`);
        } else {
          console.error('Error al trazar ruta:', status);
        }
      }
    );
  }

  // Seguimiento en tiempo real cuando está en ruta
  private iniciarSeguimiento(): void {
    if (!this.enRuta || !this.destino || this.watchId !== null) return;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const origen = `${position.coords.latitude},${position.coords.longitude}`;
        this.trazarRuta(origen, this.destino);
      },
      (error) => console.error('Error en seguimiento:', error),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    console.log('🛰️ Seguimiento GPS iniciado');
  }

  private detenerSeguimiento(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('🛑 Seguimiento GPS detenido');
    }
  }

  limpiarRuta(): void {
    this.distancia = "";
    this.duracion = "";
    this.distanciaChange.emit("");
    this.duracionChange.emit("");
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] });
    }
  }

  private getMapStyles(): any[] {
    return [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }];
  }
}