import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  OnChanges,
  SimpleChanges,
  untracked,
} from '@angular/core';
import { PermissionsService } from '../services/permissions';

@Directive({
  selector: '[ifHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnChanges {
  @Input('ifHasPermission') permisos: string | string[] = '';

  private permissionsSvc = inject(PermissionsService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  constructor() {
    effect(() => {
      // Leer el signal aquí para que Angular registre la dependencia reactiva
      this.permissionsSvc.getPermissions();
      // Ejecutar la lógica de DOM sin rastrear dependencias adicionales
      untracked(() => this.updateView());
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['permisos']) {
      this.updateView();
    }
  }

  private updateView(): void {
    const permisosArray = Array.isArray(this.permisos)
      ? this.permisos
      : [this.permisos];

    const canShow = this.permissionsSvc.hasAnyPermission(permisosArray);

    if (canShow && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!canShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}