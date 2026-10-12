import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';
import { ServiceItem, DemoProject, PricingPackage } from '../../core/models/portfolio.models';

interface ContactFormData {
  name: string;
  businessName: string;
  contactMethod: string; // email or phone
  selectedService: string;
  selectedPackage: string;
  message: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  readonly config = PORTFOLIO_CONFIG;

  formData: ContactFormData = {
    name: '',
    businessName: '',
    contactMethod: '',
    selectedService: 'business-website',
    selectedPackage: 'business',
    message: ''
  };

  formSubmitted = false;
  submissionSuccessMessage = '';
  lastActionUsed: 'whatsapp' | 'email' | null = null;

  get avatarInitials(): string {
    return this.config.developer.name
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          const el = document.getElementById(fragment);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    });
  }

  selectServiceAndScroll(serviceId: string): void {
    this.formData.selectedService = serviceId;
    this.scrollToSection('contact');
  }

  selectPackageAndScroll(packageId: string): void {
    this.formData.selectedPackage = packageId;
    this.scrollToSection('contact');
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  buildMessageBody(): string {
    const serviceObj = this.config.services.find(s => s.id === this.formData.selectedService);
    const serviceName = serviceObj ? serviceObj.title : this.formData.selectedService;

    const packageObj = this.config.pricing.packages.find(p => p.id === this.formData.selectedPackage);
    const packageName = packageObj ? `${packageObj.name} (${packageObj.priceDisplay})` : this.formData.selectedPackage;

    const lines = [
      `*New Website Project Enquiry*`,
      `*Name:* ${this.formData.name || 'Not provided'}`,
      this.formData.businessName ? `*Business:* ${this.formData.businessName}` : '',
      `*Contact Details:* ${this.formData.contactMethod || 'Not provided'}`,
      `*Service Required:* ${serviceName}`,
      `*Package Selected:* ${packageName}`,
      `*Project Details:*`,
      this.formData.message || 'I would like to discuss creating a website for my business.'
    ].filter(line => line.length > 0);

    return lines.join('\n');
  }

  isSubmittingEmail = false;
  submissionErrorMessage = '';
  gmailWebComposeUrl = '';

  submitViaWhatsApp(form: NgForm): void {
    this.formSubmitted = true;
    this.submissionErrorMessage = '';
    this.submissionSuccessMessage = '';

    if (form.invalid) {
      return;
    }

    const rawMessage = this.buildMessageBody();
    const encodedText = encodeURIComponent(rawMessage);
    const whatsappUrl = `https://wa.me/${this.config.developer.contact.whatsappNumber}?text=${encodedText}`;

    this.lastActionUsed = 'whatsapp';
    this.submissionSuccessMessage = `Opening WhatsApp chat with Elanselvan (+91 86105 85062). Simply tap Send in WhatsApp to deliver your project details!`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  async submitViaEmail(form: NgForm): Promise<void> {
    this.formSubmitted = true;
    this.submissionErrorMessage = '';
    this.submissionSuccessMessage = '';

    if (form.invalid) {
      return;
    }

    const serviceObj = this.config.services.find(s => s.id === this.formData.selectedService);
    const serviceName = serviceObj ? serviceObj.title : this.formData.selectedService;
    const packageObj = this.config.pricing.packages.find(p => p.id === this.formData.selectedPackage);
    const packageName = packageObj ? `${packageObj.name} (${packageObj.priceDisplay})` : this.formData.selectedPackage;
    const rawMessage = this.buildMessageBody().replace(/\*/g, '');

    // Setup direct web Gmail compose URL in case user wants to send from their personal Gmail account
    const subject = `Website Project Enquiry - ${this.formData.name} (${this.formData.businessName || 'Business'})`;
    this.gmailWebComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${this.config.developer.contact.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(rawMessage)}`;

    this.isSubmittingEmail = true;
    this.lastActionUsed = 'email';

    try {
      // Direct delivery to Elanselvan's Gmail inbox via FormSubmit API
      const response = await fetch(`https://formsubmit.co/ajax/${this.config.developer.contact.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          Name: this.formData.name,
          Business: this.formData.businessName || 'Not specified',
          Contact_Email_Or_Phone: this.formData.contactMethod,
          Service_Requested: serviceName,
          Package_Selected: packageName,
          Project_Details: this.formData.message,
          _subject: `New Freelance Website Enquiry from ${this.formData.name}`,
          _template: 'table'
        })
      });

      const result = await response.json();
      if (response.ok && (result.success === 'true' || result.success === true || result.message)) {
        this.submissionSuccessMessage = `✓ Message sent successfully! Your enquiry has been delivered directly to Elanselvan's email (${this.config.developer.contact.email}). You will receive a response shortly.`;
        this.formData = {
          name: '',
          businessName: '',
          contactMethod: '',
          selectedService: 'business-website',
          selectedPackage: 'business',
          message: ''
        };
        form.resetForm({
          selectedService: 'business-website',
          selectedPackage: 'business'
        });
        this.formSubmitted = false;
      } else {
        throw new Error(result.message || 'Submission error');
      }
    } catch (err) {
      // Fallback: If network / ad-blocker restricts the POST, offer Gmail Web & standard mailto
      this.submissionSuccessMessage = `Enquiry ready! Click below to send directly via Gmail Web or your email app to ${this.config.developer.contact.email}.`;
      // Also trigger mailto as standard protocol fallback
      const mailtoUrl = `mailto:${this.config.developer.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(rawMessage)}`;
      window.location.href = mailtoUrl;
    } finally {
      this.isSubmittingEmail = false;
    }
  }

  openGmailWeb(): void {
    if (this.gmailWebComposeUrl) {
      window.open(this.gmailWebComposeUrl, '_blank', 'noopener,noreferrer');
    }
  }
}

