import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Telefononumeros } from '../../../directives/inputs_usuario/telefononumeros';
import { CorreoDirective } from "../../../directives/inputs_usuario/correousuario";
import { UsuarioInterface, Usuarioservices } from '../../../services/usuario_services/usuarioservices';
import { Router } from '@angular/router';



@Component({
  selector: 'app-editar-info-personal',
  imports: [CommonModule, ReactiveFormsModule, Telefononumeros, CorreoDirective],
  templateUrl: './editar-info-personal.html',
  styleUrl: './editar-info-personal.css',
})
export class EditarInfoPersonal {
  form!: FormGroup;
  usuarios_data: UsuarioInterface | null = null;

  @Output() volver = new EventEmitter<void>();

  constructor(private usuarioservices: Usuarioservices, private router: Router, private fb: FormBuilder) { }

  ngOnInit() {
    this.form = this.fb.group({
      Nickname: ['', Validators.required],
      Nombre: ['', Validators.required],
      Apellido: ['', Validators.required],
      Correo_electronico: ['', Validators.required],                 // opcional
      Num_telefonico: ['', Validators.required],
    });

    this.cargar_datos_usuario();
  }

  cargar_datos_usuario(): void {
    this.usuarioservices.get_datos_usuario().subscribe({
      next: (data) => {
        this.usuarios_data = data;
        this.form.patchValue({
          Nickname: data.Nickname,
          Nombre: data.Nombre,
          Apellido: data.Apellido,
          Correo_electronico: data.Correo_electronico,
          Num_telefonico: data.Num_telefonico
        });
      },
      error: (err) => console.error('Error al cargar los datos', err)
    });

  }

  guardar_cambios() {
    if (this.form.invalid) {
      alert('Faltan campos obligatorios');
      this.form.markAllAsTouched();
      return;
    }

    this.usuarioservices.update_usuario_by_id(this.form.value).subscribe({
      next: (res) => {
        let cambio_nick = this.usuarios_data?.Nickname !== this.form.value.Nickname ? true : false
        let correo_cambio =
          this.usuarios_data?.Correo_electronico !== this.form.value.Correo_electronico
            ? true
            : false;
        Swal.fire({
          title: "¡Cambios guardados!",
          text: "Los cambios han sido guardados exitosamente.",
          icon: "success",
          iconColor: "#d6b45a",
          confirmButtonColor: "#d6b45a"
        }).then(() => {
          if (correo_cambio) {
            this.usuarioservices.enviar_correo_cambio_contra(this.form.value.Correo_electronico).subscribe({
              next: (res) => {
                Swal.fire({
                  title: "Acaba de cambiar su correo electronico",
                  text: "Para asegurarnos que realmente es usted le hemos enviado un correo de confirmacion de cambio de correo",
                  icon: "warning",
                  iconColor: "#d6b45a",
                  confirmButtonColor: "#d6b45a"
                }).then(() => {
                  this.regresar();
                })
              },
              error: (err) => {
                Swal.fire({
                  title: "Error al editar usuario",
                  text: err?.error?.detail || "No se pudo completar la operación.",
                  icon: "error",
                  iconColor: "#773832",
                  confirmButtonColor: "#d6b45a"
                });
              }
            })

          } else {
            cambio_nick ? window.location.reload() : this.regresar()
          }
        })
      },
      error: (err) => {
        console.error('Error al guardar dirección:', err);

        Swal.fire({
          title: "Error al editar usuario",
          text: err?.error?.detail || "No se pudo completar la operación.",
          icon: "error",
          iconColor: "#773832",
          confirmButtonColor: "#d6b45a"
        });
      }

    });

  }

  regresar() {
    this.volver.emit();

  }

}

