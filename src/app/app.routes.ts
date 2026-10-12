import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LifestyleCoachDemoComponent } from './pages/demo-projects/lifestyle-coach/lifestyle-coach.component';
import { SalonDemoComponent } from './pages/demo-projects/salon/salon.component';
import { FitnessTrainerDemoComponent } from './pages/demo-projects/fitness-trainer/fitness-trainer.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Elanselvan | Freelance Web Developer in Bengaluru'
  },
  {
    path: 'projects/lifestyle-coach',
    component: LifestyleCoachDemoComponent,
    title: 'Aura Lifestyle Coach — Demo Project | Elanselvan'
  },
  {
    path: 'projects/salon',
    component: SalonDemoComponent,
    title: 'Luxe Salon & Style Studio — Demo Project | Elanselvan'
  },
  {
    path: 'projects/fitness-trainer',
    component: FitnessTrainerDemoComponent,
    title: 'IronCore Strength & Fitness — Demo Project | Elanselvan'
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: '404 - Page Not Found | Elanselvan'
  }
];
