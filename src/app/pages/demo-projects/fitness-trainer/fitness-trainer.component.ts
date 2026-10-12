import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PORTFOLIO_CONFIG } from '../../../core/config/portfolio.config';

interface FitnessTier {
  name: string;
  cadence: string;
  price: string;
  description: string;
  features: string[];
  recommended: boolean;
}

interface ClassSlot {
  time: string;
  session: string;
  level: string;
  intensity: string;
}

@Component({
  selector: 'app-fitness-trainer-demo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './fitness-trainer.component.html',
  styleUrls: ['./fitness-trainer.component.scss']
})
export class FitnessTrainerDemoComponent {
  readonly config = PORTFOLIO_CONFIG;

  readonly trainingPackages: FitnessTier[] = [
    {
      name: 'Semi-Private Strength Pod',
      cadence: 'Monthly (12 sessions)',
      price: '₹6,000',
      description: 'Small group coaching (max 4 individuals). Perfect balance of high energy, form guidance, and affordability.',
      features: [
        '3 coached workouts per week',
        'Customized loading progressions',
        'Body composition & strength testing',
        'Community accountability group'
      ],
      recommended: false
    },
    {
      name: '1-on-1 Elite Personal Coaching',
      cadence: 'Monthly (12 sessions)',
      price: '₹12,000',
      description: 'Dedicated one-on-one coaching fully customized around your posture, prior injuries, and strength objectives.',
      features: [
        '100% private 60-min gym floor coaching',
        'Tailored macronutrient & calorie guidance',
        'Mobility & corrective posture protocols',
        'Daily WhatsApp form video reviews'
      ],
      recommended: true
    },
    {
      name: '8-Week Body Recomp Accelerator',
      cadence: 'Full 8-Week Protocol',
      price: '₹19,500',
      description: 'Intensive hybrid program combining personal training, workout nutrition, and weekly biometric tracking.',
      features: [
        '24 dedicated 1-on-1 sessions',
        'Comprehensive bi-weekly caliper & DEXA review',
        'Custom travel & home gym alternative workouts',
        'Priority schedule reservation guarantee'
      ],
      recommended: false
    }
  ];

  readonly schedule: ClassSlot[] = [
    { time: '06:30 AM - 07:30 AM', session: 'Functional Strength & Barbells', level: 'All Levels', intensity: 'High' },
    { time: '07:45 AM - 08:45 AM', session: 'Hypertrophy & Core Conditioning', level: 'Intermediate', intensity: 'Medium-High' },
    { time: '05:30 PM - 06:30 PM', session: 'Mobility & Kettlebell Basics', level: 'Beginner Friendly', intensity: 'Moderate' },
    { time: '06:45 PM - 07:45 PM', session: 'Athletic Conditioning & HIIT', level: 'Intermediate / Advanced', intensity: 'High' }
  ];

  generateTrialUrl(packageName?: string): string {
    const text = packageName
      ? `Hi Coach Vikram, I saw your fitness website demo and would like to book a free trial workout for the "${packageName}" program.`
      : `Hi Coach Vikram, I saw your fitness website demo and would like to schedule a free trial consultation workout.`;
    return `https://wa.me/${this.config.developer.contact.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }
}
