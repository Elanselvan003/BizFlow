import { Injectable, signal, computed } from '@angular/core';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
      // Navigation
      'nav.operations': 'Operations',
      'nav.finance': 'Finance & Analytics',
      'nav.dashboard': 'Dashboard',
      'nav.customers': 'Customers',
      'nav.services': 'Services & Pricing',
      'nav.bookings': 'Bookings',
      'nav.invoices': 'Invoices & Billing',
      'nav.reports': 'Reports & Insights',
      'nav.settings': 'Settings',
      'nav.logout': 'Logout',
      'nav.currency': 'Currency',

      // Topbar
      'topbar.tag': 'Enterprise SaaS',
      'topbar.newBooking': 'New Booking',
      'topbar.createInvoice': 'Create Invoice',
      'topbar.language': 'Language',

      // Dashboard
      'dash.title': 'Executive Dashboard',
      'dash.subtitle': 'Real-time overview of business performance, appointments, and cash flow',
      'dash.totalCustomers': 'Total Customers',
      'dash.activeClients': 'Active client portfolio',
      'dash.totalBookings': 'Total Bookings',
      'dash.upcoming': 'upcoming',
      'dash.revenueCollected': 'Revenue Collected',
      'dash.paidInFull': 'Paid in full',
      'dash.pendingInvoices': 'Pending Invoices',
      'dash.unpaidInvoices': 'unpaid invoices',
      'dash.revenueTrajectory': 'Revenue Trajectory',
      'dash.revenueSubtitle': 'Monthly cash collections vs invoiced totals',
      'dash.appointmentStatus': 'Appointment Status',
      'dash.appointmentSubtitle': 'Distribution by lifecycle stage',
      'dash.recentAppointments': 'Recent Appointments',
      'dash.recentInvoices': 'Recent Billing Activity',
      'dash.viewAll': 'View all',
      'dash.noBookings': 'No bookings found',
      'dash.noInvoices': 'No recent invoices found',
      'dash.client': 'Client',
      'dash.service': 'Service',
      'dash.dateTime': 'Date & Time',
      'dash.status': 'Status',
      'dash.invoiceNum': 'Invoice #',
      'dash.total': 'Total',

      // Customers
      'cust.title': 'Customers Directory',
      'cust.subtitle': 'Manage client accounts, contact information, and billing histories',
      'cust.addCustomer': 'Add New Customer',
      'cust.searchPlaceholder': 'Search by name, email, or company...',
      'cust.allStatuses': 'All Statuses',
      'cust.activeOnly': 'Active Only',
      'cust.inactiveOnly': 'Inactive Only',
      'cust.name': 'Customer Name',
      'cust.contact': 'Contact Info',
      'cust.company': 'Company',
      'cust.bookingsCount': 'Bookings',
      'cust.totalInvoiced': 'Total Invoiced',
      'cust.actions': 'Actions',
      'cust.fullName': 'Full Name',
      'cust.email': 'Email Address',
      'cust.phone': 'Phone Number',
      'cust.address': 'Billing Address',
      'cust.notes': 'Client Notes',
      'cust.save': 'Save Customer',
      'cust.update': 'Update Customer',
      'cust.cancel': 'Cancel',
      'cust.delete': 'Delete Customer',
      'cust.noCustomers': 'No customers found',

      // Services
      'srv.title': 'Services & Pricing',
      'srv.subtitle': 'Define service offerings, hourly rates, fixed packages, and session durations',
      'srv.createService': 'Create Service',
      'srv.activeOffering': 'Active Offering',
      'srv.archived': 'Archived',
      'srv.duration': 'Duration',
      'srv.rate': 'Standard Rate',
      'srv.minutes': 'mins',
      'srv.titleLabel': 'Service Title',
      'srv.descLabel': 'Service Description',
      'srv.priceLabel': 'Rate / Price',
      'srv.durationLabel': 'Duration (Minutes)',
      'srv.activeCheckbox': 'Active for booking appointments',
      'srv.save': 'Save Service',
      'srv.update': 'Update Service',

      // Bookings
      'bk.title': 'Bookings & Appointments',
      'bk.subtitle': 'Schedule client meetings, track service delivery, and manage session statuses',
      'bk.schedule': 'Schedule Appointment',
      'bk.all': 'All',
      'bk.confirmed': 'Confirmed',
      'bk.pending': 'Pending',
      'bk.completed': 'Completed',
      'bk.cancelled': 'Cancelled',
      'bk.date': 'Date',
      'bk.time': 'Time',
      'bk.fee': 'Fee',
      'bk.customerSelect': 'Client',
      'bk.serviceSelect': 'Service Package',
      'bk.confirmSchedule': 'Confirm & Schedule',

      // Invoices
      'inv.title': 'Invoices & Billing',
      'inv.subtitle': 'Generate client statements, record payments, and track outstanding receivables',
      'inv.create': 'Create New Invoice',
      'inv.paid': 'Paid',
      'inv.overdue': 'Overdue',
      'inv.draft': 'Draft',
      'inv.issueDate': 'Issue Date',
      'inv.dueDate': 'Due Date',
      'inv.lineItems': 'Line Items',
      'inv.addItem': 'Add Item',
      'inv.subtotal': 'Subtotal',
      'inv.discount': 'Discount',
      'inv.taxRate': 'Tax Rate',
      'inv.taxAmount': 'Tax Amount',
      'inv.totalAmount': 'Total Amount',
      'inv.balanceDue': 'Balance Due',
      'inv.recordPayment': 'Record Payment',
      'inv.paymentAmount': 'Payment Amount',
      'inv.paymentMethod': 'Payment Method',
      'inv.print': 'Print / PDF',
      'inv.generate': 'Generate Invoice',

      // Reports
      'rep.title': 'Financial & Operational Reports',
      'rep.subtitle': 'Comprehensive analytics, revenue performance, booking ratios, and client growth',
      'rep.days7': '7 Days',
      'rep.days30': '30 Days',
      'rep.days90': '90 Days',
      'rep.year1': '1 Year',
      'rep.collected': 'Collected Revenue',
      'rep.invoiced': 'Invoiced Total',
      'rep.outstanding': 'Outstanding Receivables',
      'rep.avgValue': 'Avg Transaction Value',
      'rep.timeline': 'Collections Timeline',
      'rep.channels': 'Payment Channels',
      'rep.servicePerformance': 'Service Performance & Utilization',
      'rep.topClients': 'Top Revenue Clients',

      // Settings
      'set.title': 'Application & Account Settings',
      'set.subtitle': 'Configure business profile details, currency, taxation, language, and administrative credentials',
      'set.businessProfile': 'Business Profile',
      'set.accountSecurity': 'User Account & Security',
      'set.languageSettings': 'Language & Regional',
      'set.selectLanguage': 'Display Language',
      'set.selectLanguageDesc': 'Choose your preferred language for the BizFlow interface',
      'set.tradingName': 'Company / Trading Name',
      'set.prefix': 'Invoice Prefix',
      'set.email': 'Contact Email',
      'set.phone': 'Contact Phone',
      'set.address': 'Registered Office / Billing Address',
      'set.currency': 'Default Currency',
      'set.timezone': 'Timezone',
      'set.taxRate': 'Default Tax Rate (%)',
      'set.saveBusiness': 'Save Business Settings',
      'set.fullName': 'Full Name',
      'set.accountEmail': 'Account Email',
      'set.changePassword': 'Change Password',
      'set.currentPassword': 'Current Password',
      'set.newPassword': 'New Password',
      'set.updateProfile': 'Update Account Profile',

      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.close': 'Close',
      'common.search': 'Search',
      'common.active': 'Active',
      'common.inactive': 'Inactive'
    },

    ta: {
      // Navigation (Tamil)
      'nav.operations': 'செயல்பாடுகள்',
      'nav.finance': 'நிதி மற்றும் பகுப்பாய்வு',
      'nav.dashboard': 'முகப்பு பலகை',
      'nav.customers': 'வாடிக்கையாளர்கள்',
      'nav.services': 'சேவைகள் & கட்டணம்',
      'nav.bookings': 'முன்பதிவுகள்',
      'nav.invoices': 'விலைப்பட்டியல் & கட்டணங்கள்',
      'nav.reports': 'அறிக்கைகள் & விவரங்கள்',
      'nav.settings': 'அமைப்புகள்',
      'nav.logout': 'வெளியேறு',
      'nav.currency': 'நாணயம்',

      // Topbar
      'topbar.tag': 'வணிக மென்பொருள்',
      'topbar.newBooking': 'புதிய முன்பதிவு',
      'topbar.createInvoice': 'விலைப்பட்டியல் உருவாக்கு',
      'topbar.language': 'மொழி',

      // Dashboard
      'dash.title': 'நிர்வாக முகப்பு பலகை',
      'dash.subtitle': 'வணிக செயல்திறன், சந்திப்புகள் மற்றும் பணப்புழக்கத்தின் நேரடி பார்வை',
      'dash.totalCustomers': 'மொத்த வாடிக்கையாளர்கள்',
      'dash.activeClients': 'செயலில் உள்ள வாடிக்கையாளர்கள்',
      'dash.totalBookings': 'மொத்த முன்பதிவுகள்',
      'dash.upcoming': 'வரவிருக்கும் சந்திப்புகள்',
      'dash.revenueCollected': 'பெறப்பட்ட வருவாய்',
      'dash.paidInFull': 'முழுமையாக செலுத்தப்பட்டது',
      'dash.pendingInvoices': 'நிலுவையில் உள்ள விலைப்பட்டியல்கள்',
      'dash.unpaidInvoices': 'செலுத்தப்படாத விலைப்பட்டியல்கள்',
      'dash.revenueTrajectory': 'வருவாய் போக்கு',
      'dash.revenueSubtitle': 'மாதாந்திர வசூலான வருவாய் மற்றும் அனுப்பப்பட்ட விலைப்பட்டியல்',
      'dash.appointmentStatus': 'முன்பதிவு நிலை',
      'dash.appointmentSubtitle': 'நிலை வாரியான விநியோகம்',
      'dash.recentAppointments': 'சமீபத்திய சந்திப்புகள்',
      'dash.recentInvoices': 'சமீபத்திய விலைப்பட்டியல் செயல்பாடுகள்',
      'dash.viewAll': 'அனைத்தையும் காண்க',
      'dash.noBookings': 'முன்பதிவுகள் எதுவும் இல்லை',
      'dash.noInvoices': 'சமீபத்திய விலைப்பட்டியல்கள் இல்லை',
      'dash.client': 'வாடிக்கையாளர்',
      'dash.service': 'சேவை',
      'dash.dateTime': 'தேதி & நேரம்',
      'dash.status': 'நிலை',
      'dash.invoiceNum': 'விலைப்பட்டியல் #',
      'dash.total': 'மொத்தம்',

      // Customers
      'cust.title': 'வாடிக்கையாளர் பட்டியல்',
      'cust.subtitle': 'வாடிக்கையாளர் கணக்குகள், தொடர்பு தகவல் மற்றும் பில்லிங் விவரங்களை நிர்வகிக்கவும்',
      'cust.addCustomer': 'புதிய வாடிக்கையாளர் சேர்க்க',
      'cust.searchPlaceholder': 'பெயர், மின்னஞ்சல் அல்லது நிறுவனம் மூலம் தேடுக...',
      'cust.allStatuses': 'அனைத்து நிலைகளும்',
      'cust.activeOnly': 'செயலில் உள்ளவை',
      'cust.inactiveOnly': 'செயலற்றவை',
      'cust.name': 'வாடிக்கையாளர் பெயர்',
      'cust.contact': 'தொடர்பு தகவல்',
      'cust.company': 'நிறுவனம்',
      'cust.bookingsCount': 'முன்பதிவுகள்',
      'cust.totalInvoiced': 'மொத்த விலைப்பட்டியல்',
      'cust.actions': 'செயல்கள்',
      'cust.fullName': 'முழு பெயர்',
      'cust.email': 'மின்னஞ்சல் முகவரி',
      'cust.phone': 'தொலைபேசி எண்',
      'cust.address': 'பில்லிங் முகவரி',
      'cust.notes': 'வாடிக்கையாளர் குறிப்புகள்',
      'cust.save': 'வாடிக்கையாளரை சேமி',
      'cust.update': 'வாடிக்கையாளரை புதுப்பி',
      'cust.cancel': 'ரத்து செய்',
      'cust.delete': 'வாடிக்கையாளரை நீக்கு',
      'cust.noCustomers': 'வாடிக்கையாளர்கள் எவரும் இல்லை',

      // Services
      'srv.title': 'சேவைகள் & கட்டணம்',
      'srv.subtitle': 'சேவை தொகுப்புகள், மணிநேரக் கட்டணம் மற்றும் கால அளவை வரையறுக்கவும்',
      'srv.createService': 'புதிய சேவை உருவாக்கு',
      'srv.activeOffering': 'செயலில் உள்ள சேவை',
      'srv.archived': 'காப்பகப்படுத்தப்பட்டது',
      'srv.duration': 'கால அளவு',
      'srv.rate': 'நிலையான கட்டணம்',
      'srv.minutes': 'நிமிடங்கள்',
      'srv.titleLabel': 'சேவை தலைப்பு',
      'srv.descLabel': 'சேவை விளக்கம்',
      'srv.priceLabel': 'கட்டணம் / விலை',
      'srv.durationLabel': 'கால அளவு (நிமிடங்கள்)',
      'srv.activeCheckbox': 'முன்பதிவு செய்ய செயலில் வைக்கவும்',
      'srv.save': 'சேவையை சேமி',
      'srv.update': 'சேவையை புதுப்பி',

      // Bookings
      'bk.title': 'முன்பதிவுகள் & சந்திப்புகள்',
      'bk.subtitle': 'வாடிக்கையாளர் சந்திப்புகளை திட்டமிட்டு நிர்வகிக்கவும்',
      'bk.schedule': 'சந்திப்பை திட்டமிடு',
      'bk.all': 'அனைத்தும்',
      'bk.confirmed': 'உறுதிசெய்யப்பட்டது',
      'bk.pending': 'நிலுவையில் உள்ளது',
      'bk.completed': 'நிறைவடைந்தது',
      'bk.cancelled': 'ரத்து செய்யப்பட்டது',
      'bk.date': 'தேதி',
      'bk.time': 'நேரம்',
      'bk.fee': 'கட்டணம்',
      'bk.customerSelect': 'வாடிக்கையாளர்',
      'bk.serviceSelect': 'சேவை தொகுப்பு',
      'bk.confirmSchedule': 'உறுதி செய்து திட்டமிடு',

      // Invoices
      'inv.title': 'விலைப்பட்டியல் & கட்டணங்கள்',
      'inv.subtitle': 'வாடிக்கையாளர் விலைப்பட்டியல்களை உருவாக்கி பணப்பரிவர்த்தனையை கண்காணிக்கவும்',
      'inv.create': 'புதிய விலைப்பட்டியல்',
      'inv.paid': 'செலுத்தப்பட்டது',
      'inv.overdue': 'தாமதமானது',
      'inv.draft': 'வரைவு',
      'inv.issueDate': 'வழங்கப்பட்ட தேதி',
      'inv.dueDate': 'கடைசி தேதி',
      'inv.lineItems': 'உருப்படிகள்',
      'inv.addItem': 'உருப்படியைச் சேர்',
      'inv.subtotal': 'கூடுதல் தொகை',
      'inv.discount': 'தள்ளுபடி',
      'inv.taxRate': 'வரி விகிதம்',
      'inv.taxAmount': 'வரி தொகை',
      'inv.totalAmount': 'மொத்தத் தொகை',
      'inv.balanceDue': 'மீதமுள்ள தொகை',
      'inv.recordPayment': 'கட்டணத்தை பதிவு செய்',
      'inv.paymentAmount': 'கட்டணத் தொகை',
      'inv.paymentMethod': 'கட்டண முறை',
      'inv.print': 'அச்சிடு / PDF',
      'inv.generate': 'விலைப்பட்டியலை உருவாக்கு',

      // Reports
      'rep.title': 'நிதி & செயல்பாட்டு அறிக்கைகள்',
      'rep.subtitle': 'விரிவான வருவாய் பகுப்பாய்வு மற்றும் வாடிக்கையாளர் வளர்ச்சி',
      'rep.days7': '7 நாட்கள்',
      'rep.days30': '30 நாட்கள்',
      'rep.days90': '90 நாட்கள்',
      'rep.year1': '1 வருடம்',
      'rep.collected': 'வசூலான வருவாய்',
      'rep.invoiced': 'மொத்த விலைப்பட்டியல்',
      'rep.outstanding': 'நிலுவையில் உள்ள தொகை',
      'rep.avgValue': 'சராசரி பரிவர்த்தனை மதிப்பு',
      'rep.timeline': 'வசூல் காலவரிசை',
      'rep.channels': 'கட்டண வழிகள்',
      'rep.servicePerformance': 'சேவை பயன்பாடு & செயல்திறன்',
      'rep.topClients': 'அதிக வருவாய் தரும் வாடிக்கையாளர்கள்',

      // Settings
      'set.title': 'பயன்பாட்டு அமைப்புகள்',
      'set.subtitle': 'வணிக விவரங்கள், நாணயம், வரி, மொழி மற்றும் கணக்கு அமைப்புகள்',
      'set.businessProfile': 'வணிக விவரங்கள்',
      'set.accountSecurity': 'கணக்கு & பாதுகாப்பு',
      'set.languageSettings': 'மொழி அமைப்புகள்',
      'set.selectLanguage': 'காட்சி மொழி',
      'set.selectLanguageDesc': 'BizFlow பயன்பாட்டிற்கான மொழியைத் தேர்ந்தெடுக்கவும்',
      'set.tradingName': 'வணிகப் பெயர்',
      'set.prefix': 'விலைப்பட்டியல் முன்னொட்டு',
      'set.email': 'தொடர்பு மின்னஞ்சல்',
      'set.phone': 'தொலைபேசி எண்',
      'set.address': 'அலுவலக முகவரி',
      'set.currency': 'இயல்புநிலை நாணயம்',
      'set.timezone': 'நேர மண்டலம்',
      'set.taxRate': 'இயல்புநிலை வரி விகிதம் (%)',
      'set.saveBusiness': 'வணிக அமைப்புகளை சேமி',
      'set.fullName': 'முழு பெயர்',
      'set.accountEmail': 'கணக்கு மின்னஞ்சல்',
      'set.changePassword': 'கடவுச்சொல்லை மாற்று',
      'set.currentPassword': 'தற்போதைய கடவுச்சொல்',
      'set.newPassword': 'புதிய கடவுச்சொல்',
      'set.updateProfile': 'சுயவிவரத்தை புதுப்பி',

      // Common
      'common.save': 'சேமி',
      'common.cancel': 'ரத்து',
      'common.delete': 'நீக்கு',
      'common.edit': 'திருத்து',
      'common.close': 'மூடு',
      'common.search': 'தேடுக',
      'common.active': 'செயலில்',
      'common.inactive': 'செயலற்ற'
    },

    hi: {
      // Navigation (Hindi)
      'nav.operations': 'संचालन',
      'nav.finance': 'वित्त एवं विश्लेषण',
      'nav.dashboard': 'डैशबोर्ड',
      'nav.customers': 'ग्राहक',
      'nav.services': 'सेवाएं एवं मूल्य',
      'nav.bookings': 'बुकिंग्स',
      'nav.invoices': 'चालान एवं बिलिंग',
      'nav.reports': 'रिपोर्ट एवं जानकारी',
      'nav.settings': 'सेटिंग्स',
      'nav.logout': 'लॉग आउट',
      'nav.currency': 'मुद्रा',

      // Topbar
      'topbar.tag': 'उद्यम सास',
      'topbar.newBooking': 'नई बुकिंग',
      'topbar.createInvoice': 'चालान बनाएं',
      'topbar.language': 'भाषा',

      // Dashboard
      'dash.title': 'कार्यकारी डैशबोर्ड',
      'dash.subtitle': 'व्यापार प्रदर्शन, अपॉइंटमेंट्स और नकदी प्रवाह का वास्तविक समय विवरण',
      'dash.totalCustomers': 'कुल ग्राहक',
      'dash.activeClients': 'सक्रिय ग्राहक पोर्टफोलियो',
      'dash.totalBookings': 'कुल बुकिंग्स',
      'dash.upcoming': 'आगामी बैठकें',
      'dash.revenueCollected': 'प्राप्त राजस्व',
      'dash.paidInFull': 'पूर्ण भुगतान प्राप्त',
      'dash.pendingInvoices': 'लंबित चालान',
      'dash.unpaidInvoices': 'अदत्त चालान',
      'dash.revenueTrajectory': 'राजस्व प्रगति',
      'dash.revenueSubtitle': 'मासिक नकद वसूली बनाम चालान कुल',
      'dash.appointmentStatus': 'अपॉइंटमेंट स्थिति',
      'dash.appointmentSubtitle': 'जीवनचक्र चरण के अनुसार वितरण',
      'dash.recentAppointments': 'हाल की नियुक्तियां',
      'dash.recentInvoices': 'हाल की बिलिंग गतिविधि',
      'dash.viewAll': 'सभी देखें',
      'dash.noBookings': 'कोई बुकिंग नहीं मिली',
      'dash.noInvoices': 'हाल के कोई चालान नहीं मिले',
      'dash.client': 'ग्राहक',
      'dash.service': 'सेवा',
      'dash.dateTime': 'तारीख एवं समय',
      'dash.status': 'स्थिति',
      'dash.invoiceNum': 'चालान संख्या',
      'dash.total': 'कुल',

      // Customers
      'cust.title': 'ग्राहक निर्देशिका',
      'cust.subtitle': 'ग्राहक खातों, संपर्क जानकारी और बिलिंग इतिहास का प्रबंधन करें',
      'cust.addCustomer': 'नया ग्राहक जोड़ें',
      'cust.searchPlaceholder': 'नाम, ईमेल या कंपनी से खोजें...',
      'cust.allStatuses': 'सभी स्थितियां',
      'cust.activeOnly': 'केवल सक्रिय',
      'cust.inactiveOnly': 'केवल निष्क्रिय',
      'cust.name': 'ग्राहक का नाम',
      'cust.contact': 'संपर्क जानकारी',
      'cust.company': 'कंपनी',
      'cust.bookingsCount': 'बुकिंग्स',
      'cust.totalInvoiced': 'कुल बिल किया गया',
      'cust.actions': 'कार्रवाई',
      'cust.fullName': 'पूरा नाम',
      'cust.email': 'ईमेल पता',
      'cust.phone': 'फ़ोन नंबर',
      'cust.address': 'बिलिंग पता',
      'cust.notes': 'ग्राहक नोट्स',
      'cust.save': 'ग्राहक सहेजें',
      'cust.update': 'ग्राहक अपडेट करें',
      'cust.cancel': 'रद्द करें',
      'cust.delete': 'ग्राहक हटाएं',
      'cust.noCustomers': 'कोई ग्राहक नहीं मिला',

      // Services
      'srv.title': 'सेवाएं एवं मूल्य निर्धारण',
      'srv.subtitle': 'सेवा पैकेज, प्रति घंटा दरें और सत्र अवधि परिभाषित करें',
      'srv.createService': 'सेवा बनाएं',
      'srv.activeOffering': 'सक्रिय सेवा',
      'srv.archived': 'संग्रहीत',
      'srv.duration': 'अवधि',
      'srv.rate': 'मानक दर',
      'srv.minutes': 'मिनट',
      'srv.titleLabel': 'सेवा शीर्षक',
      'srv.descLabel': 'सेवा विवरण',
      'srv.priceLabel': 'दर / मूल्य',
      'srv.durationLabel': 'अवधि (मिनट)',
      'srv.activeCheckbox': 'अपॉइंटमेंट बुकिंग के लिए सक्रिय रखें',
      'srv.save': 'सेवा सहेजें',
      'srv.update': 'सेवा अपडेट करें',

      // Bookings
      'bk.title': 'बुकिंग एवं अपॉइंटमेंट्स',
      'bk.subtitle': 'ग्राहक बैठकें निर्धारित करें और सत्र की स्थिति प्रबंधित करें',
      'bk.schedule': 'अपॉइंटमेंट शेड्यूल करें',
      'bk.all': 'सभी',
      'bk.confirmed': 'पुष्ट',
      'bk.pending': 'लंबित',
      'bk.completed': 'पूर्ण',
      'bk.cancelled': 'रद्द',
      'bk.date': 'तारीख',
      'bk.time': 'समय',
      'bk.fee': 'शुल्क',
      'bk.customerSelect': 'ग्राहक',
      'bk.serviceSelect': 'सेवा पैकेज',
      'bk.confirmSchedule': 'पुष्टि करें और शेड्यूल करें',

      // Invoices
      'inv.title': 'चालान एवं बिलिंग',
      'inv.subtitle': 'ग्राहक विवरण बनाएं, भुगतान रिकॉर्ड करें और बकाया राशि ट्रैक करें',
      'inv.create': 'नया चालान बनाएं',
      'inv.paid': 'भुगतान किया गया',
      'inv.overdue': 'अतिदेय',
      'inv.draft': 'प्रारूप',
      'inv.issueDate': 'जारी करने की तारीख',
      'inv.dueDate': 'अंतिम तारीख',
      'inv.lineItems': 'मद सूची',
      'inv.addItem': 'मद जोड़ें',
      'inv.subtotal': 'उप-योग',
      'inv.discount': 'छूट',
      'inv.taxRate': 'कर दर',
      'inv.taxAmount': 'कर राशि',
      'inv.totalAmount': 'कुल राशि',
      'inv.balanceDue': 'बकाया राशि',
      'inv.recordPayment': 'भुगतान दर्ज करें',
      'inv.paymentAmount': 'भुगतान राशि',
      'inv.paymentMethod': 'भुगतान विधि',
      'inv.print': 'प्रिंट / पीडीएफ',
      'inv.generate': 'चालान तैयार करें',

      // Reports
      'rep.title': 'वित्तीय एवं परिचालन रिपोर्ट',
      'rep.subtitle': 'व्यापक विश्लेषण, राजस्व प्रदर्शन और ग्राहक वृद्धि',
      'rep.days7': '7 दिन',
      'rep.days30': '30 दिन',
      'rep.days90': '90 दिन',
      'rep.year1': '1 वर्ष',
      'rep.collected': 'वसूल किया गया राजस्व',
      'rep.invoiced': 'कुल चालान राशि',
      'rep.outstanding': 'बकाया प्राप्तियां',
      'rep.avgValue': 'औसत लेन-देन मूल्य',
      'rep.timeline': 'वसूली समयरेखा',
      'rep.channels': 'भुगतान माध्यम',
      'rep.servicePerformance': 'सेवा उपयोग एवं प्रदर्शन',
      'rep.topClients': 'शीर्ष राजस्व ग्राहक',

      // Settings
      'set.title': 'एप्लिकेशन एवं खाता सेटिंग्स',
      'set.subtitle': 'व्यापार विवरण, मुद्रा, कराधान, भाषा और प्रशासनिक क्रेडेंशियल्स कॉन्फ़िगर करें',
      'set.businessProfile': 'व्यापार प्रोफ़ाइल',
      'set.accountSecurity': 'उपयोगकर्ता खाता एवं सुरक्षा',
      'set.languageSettings': 'भाषा एवं क्षेत्रीय प्राथमिकताएं',
      'set.selectLanguage': 'प्रदर्शन भाषा',
      'set.selectLanguageDesc': 'BizFlow इंटरफ़ेस के लिए अपनी पसंदीदा भाषा चुनें',
      'set.tradingName': 'कंपनी / व्यापारिक नाम',
      'set.prefix': 'चालान उपसर्ग',
      'set.email': 'संपर्क ईमेल',
      'set.phone': 'संपर्क फ़ोन',
      'set.address': 'पंजीकृत कार्यालय / बिलिंग पता',
      'set.currency': 'डिफ़ॉल्ट मुद्रा',
      'set.timezone': 'समय क्षेत्र',
      'set.taxRate': 'डिफ़ॉल्ट कर दर (%)',
      'set.saveBusiness': 'व्यापार सेटिंग्स सहेजें',
      'set.fullName': 'पूरा नाम',
      'set.accountEmail': 'खाता ईमेल',
      'set.changePassword': 'पासवर्ड बदलें',
      'set.currentPassword': 'वर्तमान पासवर्ड',
      'set.newPassword': 'नया पासवर्ड',
      'set.updateProfile': 'खाता प्रोफ़ाइल अपडेट करें',

      // Common
      'common.save': 'सहेजें',
      'common.cancel': 'रद्द करें',
      'common.delete': 'हटाएं',
      'common.edit': 'संपादित करें',
      'common.close': 'बंद करें',
      'common.search': 'खोजें',
      'common.active': 'सक्रिय',
      'common.inactive': 'निष्क्रिय'
    }
  };

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'bizflow_lang';

  // Only English active right now, other languages hidden as requested
  readonly languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' }
  ];

  currentLang = signal<string>('en');

  currentLanguageObj = computed(() => {
    return this.languages.find(l => l.code === this.currentLang()) || this.languages[0];
  });

  constructor() {
    this.initLanguage();
  }

  private initLanguage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, 'en');
    } catch {
      // ignore
    }
    this.currentLang.set('en');
  }

  setLanguage(langCode: string) {
    if (this.languages.some(l => l.code === langCode)) {
      this.currentLang.set(langCode);
      try {
        localStorage.setItem(this.STORAGE_KEY, langCode);
      } catch {}
    }
  }

  translate(key: string): string {
    const lang = this.currentLang();
    const langDict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    return langDict?.[key] || TRANSLATIONS['en']?.[key] || key;
  }
}
