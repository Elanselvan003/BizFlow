import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PORTFOLIO_CONFIG } from '../../../core/config/portfolio.config';

interface CoachingProgram {
  title: string;
  duration: string;
  price: string;
  summary: string;
  highlights: string[];
  recommendedFor: string;
}

@Component({
  selector: 'app-lifestyle-coach-demo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lifestyle-coach.component.html',
  styleUrls: ['./lifestyle-coach.component.scss']
})
export class LifestyleCoachDemoComponent {
  readonly config = PORTFOLIO_CONFIG;

  readonly programs: CoachingProgram[] = [
    {
      title: 'Mindful Habits Reset',
      duration: '4 Weeks',
      price: '₹5,500',
      summary: 'Build lasting daily routines, improve sleep quality, and overcome chronic procrastination with structured weekly milestones.',
      highlights: [
        'Weekly 60-min private coaching call',
        'Personal habit scorecard & daily tracking template',
        'Async WhatsApp check-in for accountability',
        'Personalized morning & evening routine planner'
      ],
      recommendedFor: 'Working professionals seeking consistency without burnout'
    },
    {
      title: 'Work-Life Rebalance Intensive',
      duration: '8 Weeks',
      price: '₹9,800',
      summary: 'Comprehensive stress management, boundary setting, and mental clarity coaching tailored for corporate tech professionals.',
      highlights: [
        '8 one-on-one deep dive strategy sessions',
        'Stress triggers audit & mitigation framework',
        'Direct WhatsApp voice notes access (Mon-Fri)',
        'Bi-weekly progress reviews and adjustments'
      ],
      recommendedFor: 'Managers and founders dealing with work overwhelm'
    },
    {
      title: 'Executive Wellbeing Blueprint',
      duration: '12 Weeks',
      price: '₹14,500',
      summary: 'Holistic lifestyle transformation covering physical energy, mental resilience, executive presence, and sustained high performance.',
      highlights: [
        '12 comprehensive coaching sessions',
        'Customized nutrition & movement rhythm sync',
        'Priority on-demand WhatsApp consultation',
        'End-of-program roadmap for lasting self-reliance'
      ],
      recommendedFor: 'Leaders seeking peak vitality and mental sharpness'
    }
  ];

  generateWhatsAppUrl(programName?: string): string {
    const text = programName 
      ? `Hi Coach, I was looking at your website demo and I'm interested in learning more about the "${programName}" programme.`
      : `Hi Coach, I saw your wellness website demo and would like to ask about consultation availability.`;
    return `https://wa.me/${this.config.developer.contact.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }
}
