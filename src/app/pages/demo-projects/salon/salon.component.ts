import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PORTFOLIO_CONFIG } from '../../../core/config/portfolio.config';

interface SalonServiceCategory {
  category: string;
  items: {
    name: string;
    description: string;
    duration: string;
    price: string;
  }[];
}

@Component({
  selector: 'app-salon-demo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './salon.component.html',
  styleUrls: ['./salon.component.scss']
})
export class SalonDemoComponent {
  readonly config = PORTFOLIO_CONFIG;

  readonly serviceMenu: SalonServiceCategory[] = [
    {
      category: 'Haircuts & Styling',
      items: [
        { name: "Senior Stylist Haircut & Blowdry", description: "Personal consultation, clarifying shampoo, precision cut & finish", duration: "45 mins", price: "₹850" },
        { name: "Creative Restyle & Finish", description: "Complete image makeover with layered texturizing and blowout", duration: "60 mins", price: "₹1,200" },
        { name: "Signature Blowout & Waves", description: "Volumizing shampoo followed by bouncy roller blowout or beach waves", duration: "40 mins", price: "₹650" },
        { name: "Men's Beard Sculpt & Executive Cut", description: "Hot towel finish, taper fade or scissor cut, beard oil styling", duration: "40 mins", price: "₹600" }
      ]
    },
    {
      category: 'Hair Colour & Balayage',
      items: [
        { name: "Global Ammonia-Free Colour", description: "Deep multidimensional gloss coverage with organic extracts", duration: "75 mins", price: "From ₹2,400" },
        { name: "Custom Sun-Kissed Balayage", description: "Hand-painted organic highlights, tone balancing and Olaplex treatment", duration: "120 mins", price: "From ₹4,500" },
        { name: "Root Touch-up & Gloss", description: "Precise grey blending and shine restoring root glaze", duration: "50 mins", price: "₹1,400" }
      ]
    },
    {
      category: 'Spa, Scalp & Skin Rituals',
      items: [
        { name: "Intense Moisture Botanical Hair Spa", description: "Deep steam mask, lymphatic scalp massage & serum seal", duration: "50 mins", price: "₹1,600" },
        { name: "Hydra-Glow Brightening Facial", description: "Gentle exfoliation, vitamin C serum infusion, cooling jade roller", duration: "60 mins", price: "₹2,200" },
        { name: "Moroccan Argan Pedicure & Manicure", description: "Dead sea salt scrub, cuticle therapy and therapeutic foot massage", duration: "60 mins", price: "₹1,500" }
      ]
    }
  ];

  generateAppointmentUrl(serviceName?: string): string {
    const text = serviceName
      ? `Hi Luxe Studio, I was looking at your salon website demo and would like to check appointment slots for "${serviceName}".`
      : `Hi Luxe Studio, I saw your salon website demo and would like to book a salon appointment.`;
    return `https://wa.me/${this.config.developer.contact.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }
}
