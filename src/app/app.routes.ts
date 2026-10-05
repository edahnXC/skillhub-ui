import { Routes } from '@angular/router';

import { Login }        from './features/auth/login/login';
import { Register }     from './features/auth/register/register';
import { Home }         from './features/home/home/home';
import { CourseList }   from './features/courses/course-list/course-list';
import { CourseCreate } from './features/courses/course-create/course-create';
import { CourseDetail } from './features/courses/course-detail/course-detail';
import { CourseEdit } from './features/courses/course-edit/course-edit';
import { InstructorList } from './features/instructors/instructor-list/instructor-list';
import { InstructorDetail } from './features/instructors/instructor-detail/instructor-detail';
import { AdminLayout } from './features/admin/admin-layout/admin-layout';
import { AdminUsers } from './features/admin/admin-users/admin-users';
import { AdminCourses } from './features/admin/admin-courses/admin-courses';
import { AdminCreateUser } from './features/admin/admin-create-user/admin-create-user';
import { AdminPermissions } from './features/admin/admin-permissions/admin-permissions';
import { MyLearning } from './features/enrollment/my-learning/my-learning';
import { EnrollmentSuccess } from './features/enrollment/enrollment-success/enrollment-success';
import { CoursePlayer } from './features/enrollment/course-player/course-player';
import { ProfileSettings } from './features/profile/profile-settings/profile-settings';
import { SupportList } from './features/support/support-list/support-list';
import { SupportCreate } from './features/support/support-create/support-create';
import { SupportDetail } from './features/support/support-detail/support-detail';
import { AdminSupport } from './features/admin/admin-support/admin-support';
import { authGuard }    from './core/guards/auth-guard';

export const routes: Routes = [
  // Default → public landing page
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // Auth pages (no navbar shown — see app.ts)
  { path: 'login',    component: Login },
  { path: 'register', component: Register },

  // Public pages (navbar visible, no auth required)
  { path: 'home',        component: Home },
  { path: 'courses',     component: CourseList },
  { path: 'instructors', component: InstructorList },
  { path: 'instructors/:id', component: InstructorDetail },

  // Support Helpdesk (Student, Instructor, Staff)
  {
    path: 'support',
    component: SupportList,
    canActivate: [authGuard]
  },
  {
    path: 'support/new',
    component: SupportCreate,
    canActivate: [authGuard]
  },
  {
    path: 'support/:id',
    component: SupportDetail,
    canActivate: [authGuard]
  },

  // Protected pages (requires login)
  {
    path: 'settings',
    component: ProfileSettings,
    canActivate: [authGuard]
  },
  {
    path: 'enrollment/success',
    component: EnrollmentSuccess,
    canActivate: [authGuard],
    data: { roles: ['Student'] }
  },
  {
    path: 'learn/:courseId',
    component: CoursePlayer,
    canActivate: [authGuard],
    data: { roles: ['Student', 'SuperAdmin', 'SubAdmin', 'Instructor'] }
  },
  {
    path: 'courses/create',
    component: CourseCreate,
    canActivate: [authGuard],
    data: { roles: ['Instructor'] }
  },
  {
    path: 'courses/:id',
    component: CourseDetail
  },
  {
    path: 'courses/:id/edit',
    component: CourseEdit,
    canActivate: [authGuard],
    data: { roles: ['Instructor'] }
  },
  {
    path: 'my-learning',
    component: MyLearning,
    canActivate: [authGuard],
    data: { roles: ['Student'] }
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin', 'SubAdmin'] },
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: AdminUsers },
      { path: 'courses', component: AdminCourses },
      { path: 'create-user', component: AdminCreateUser, canActivate: [authGuard], data: { roles: ['SuperAdmin'] } },
      { path: 'permissions', component: AdminPermissions, canActivate: [authGuard], data: { roles: ['SuperAdmin'] } },
      { path: 'support', component: AdminSupport }
    ]
  }
];
