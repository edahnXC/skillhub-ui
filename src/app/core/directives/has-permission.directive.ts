import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private requiredPermissions: string[] = [];
  private isHidden = true;
  private permissionSub?: Subscription;

  @Input() set hasPermission(val: string | string[]) {
    if (Array.isArray(val)) {
      this.requiredPermissions = val;
    } else if (typeof val === 'string') {
      this.requiredPermissions = [val];
    } else {
      this.requiredPermissions = [];
    }
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.permissionSub = this.authService.currentPermissions$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.permissionSub?.unsubscribe();
  }

  private updateView(): void {
    if (!this.requiredPermissions || this.requiredPermissions.length === 0) {
      if (this.isHidden) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isHidden = false;
      }
      return;
    }

    const hasAccess = this.authService.hasAnyPermission(this.requiredPermissions);

    if (hasAccess && this.isHidden) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isHidden = false;
    } else if (!hasAccess && !this.isHidden) {
      this.viewContainer.clear();
      this.isHidden = true;
    }
  }
}
