// ============================================================
// INTERNATIONALIZATION (IT/EN)
// ============================================================

var LANG = {
  current: localStorage.getItem('lang') || 'it',
  data: {
    it: {
      // --- NAV ---
      'nav.home': 'HOME',
      'nav.about': 'ABOUT',
      'nav.projects': 'PROGETTI',
      'nav.certs': 'CERTIFICAZIONI',
      'nav.contact': 'CONTATTI',
      'nav.lang_it': 'ITA',
      'nav.lang_en': 'ENG',

      // --- HERO (index) ---
      'hero.label': 'WHO_AM_I',
      'hero.tagline': 'Network Engineer & System Architect',
      'hero.subtitle': 'Progettazione e gestione di infrastrutture IT ad alte prestazioni',
      'hero.btn_projects': 'ESPLORA_PROGETTI',
      'hero.btn_cv': 'SCARICA_CV',
      'hero.btn_contact': 'CONTATTI',

      // --- OVERVIEW SECTION ---
      'overview.label': 'SEZIONE_01',
      'overview.title': 'Overview ',
      'overview.title_span': 'Tecnica',
      'overview.desc': '> Stack tecnologico e aree di competenza principali',
      'overview.stat1_value': '7+',
      'overview.stat1_label': 'TECNOLOGIE',
      'overview.stat2_value': '4',
      'overview.stat2_label': 'PROGETTI',
      'overview.stat3_value': '5',
      'overview.stat3_label': 'CERTIFICAZIONI',
      'overview.stat4_value': '1800+',
      'overview.stat4_label': 'ORE FORMAZIONE',

      // --- CARDS ---
      'card1_title': 'Sistemi Operativi',
      'card1_desc': 'Linux (Debian, Ubuntu, CentOS), Windows Server, Proxmox VE',
      'card2_title': 'Networking',
      'card2_desc': 'TCP/IP, VLAN, VPN, Firewall, SD-WAN, OSPF, BGP',
      'card3_title': 'Sicurezza',
      'card3_desc': 'Hardening, IDS/IPS, Backup automation, Vulnerability assessment',

      // --- CV DOWNLOAD ---
      'cv.label': 'DOWNLOAD_CV',
      'cv.title': 'Curriculum ',
      'cv.title_span': 'Vitae',
      'cv.desc': '> Scarica il mio CV in formato PDF',
      'cv.filename': 'CV_Stefano_Pucci.pdf',
      'cv.updated': 'Ultimo aggiornamento: Luglio 2026 \u2022 Formato PDF',
      'cv.btn': 'SCARICA',

      // --- ABOUT PAGE ---
      'about.label': 'CORE_VALUES',
      'about.title': 'Chi \u00e8 ',
      'about.title_span': 'Stefano Pucci',
      'about.desc': '> Sistemista informatico con un percorso unico e autentico',
      'about.quote': 'Le reti non sono solo cavi e protocolli \u2014 sono la spina dorsale che collega persone, idee e opportunit\u00e0.',
      'about.quote_author': '\u2014 Stefano Pucci',
      'about.text': 'Tredici anni nella gestione aziendale di famiglia, poi la specializzazione tecnica in infrastrutture IT, networking e virtualizzazione. La mia forza \u00e8 unire la concretezza del lavoro sul campo con la precisione della progettazione tecnica.',
      'about.val1_title': 'Sicurezza Pratica',
      'about.val1_desc': 'La sicurezza non \u00e8 un prodotto, ma un processo. Implemento difese proattive e monitoraggio continuo.',
      'about.val2_title': 'Affidabilit\u00e0',
      'about.val2_desc': 'Ogni sistema che progetto deve funzionare quando serve. Pianifico fault tolerance e disaster recovery.',
      'about.val3_title': 'Apprendimento Continuo',
      'about.val3_desc': 'Investo costantemente in formazione: dal corso Sistemista a Confindustria al mio home lab.',
      'about.val4_title': 'Passione Reale',
      'about.val4_desc': 'La tecnologia e il networking sono la mia passione da sempre \u2014 dal panificio di famiglia al data center.',
      'about.timeline_label': 'MY_JOURNEY',
      'about.tl1_year': '2008 \u2013 2021',
      'about.tl1_title': 'Le Radici',
      'about.tl1_desc': 'Socio fondatore del Panificio F.lli Pucci \u2014 gestione, organizzazione e responsabilit\u00e0.',
      'about.tl2_year': '2018 \u2013 2022',
      'about.tl2_title': 'Formazione Tecnica',
      'about.tl2_desc': 'ITS Lab Academy Fano \u2014 1800 ore in Robotica e Innovazione Digitale (Industria 4.0).',
      'about.tl3_year': '2026 \u2013 Oggi',
      'about.tl3_title': 'Sistemista Informatico',
      'about.tl3_desc': 'Corso di specializzazione a Confindustria Ancona \u2014 Linux, Windows, Proxmox, Networking, Sicurezza.',

      // --- PROJECTS PAGE ---
      'projects.label': 'SEZIONE_03',
      'projects.title': 'Progetti ',
      'projects.title_span': 'Realizzati',
      'projects.desc': '> Overview dei progetti completati e in corso',
      'projects.status_done': 'COMPLETATO',
      'projects.featured_title': 'Portfolio CV \u2014 Sito Personale',
      'projects.featured_sub': 'Sito web professionale con curriculum e contatti',
      'projects.featured_desc': 'Progettazione e realizzazione di un sito web portfolio professionale per presentare competenze tecniche, certificazioni e progetti nel campo dell\'IT e networking. Sito statico a tema terminale/cyberpunk con griglia, effetti scanline e pulsazioni, costruito interamente con HTML, CSS e JavaScript vanilla.',
      'projects.spec1_value': 'Statico',
      'projects.spec1_label': 'TIPO',
      'projects.spec2_value': '100%',
      'projects.spec2_label': 'MOBILE READY',
      'projects.spec3_value': '5',
      'projects.spec3_label': 'PAGINE',
      'projects.spec4_value': '0',
      'projects.spec4_label': 'DIPENDENZE',
      'projects.tech_label': 'TECH_STACK',
      'projects.links_label': 'LINK',
      'projects.btn_source': 'CODICE_SORGENTE',
      'projects.btn_visit': 'VISITA_SITO',
      'projects.upcoming_label': 'PROSSIMI_PROGETTI',
      'projects.soon_badge': 'IN PIANIFICAZIONE',
      'projects.soon1_title': 'Home Lab Data Center',
      'projects.soon1_desc': 'Laboratorio Spine-Leaf con virtualizzazione Proxmox e automazione Ansible.',
      'projects.soon2_title': 'Architettura SD-WAN',
      'projects.soon2_desc': 'Progettazione SD-WAN per collegamento multi-sede con failover automatico.',

      // --- CERTIFICATIONS PAGE ---
      'certs.label': 'CREDENTIALS',
      'certs.title': 'Certificazioni & ',
      'certs.title_span': 'Formazione',
      'certs.desc': '> Un percorso di crescita costante: dal diploma tecnico alla specializzazione IT',
      'certs.stat1_value': '5',
      'certs.stat1_label': 'CERTIFICAZIONI',
      'certs.stat2_value': '1800+',
      'certs.stat2_label': 'ORE FORMAZIONE',
      'certs.stat3_value': 'B2',
      'certs.stat3_label': 'INGLESE CEFR',
      'certs.list_label': 'VERIFIED_CREDENTIALS',
      'certs.cert1_title': 'Corso di Specializzazione Sistemista Informatico',
      'certs.cert1_meta': 'Confindustria Ancona \u2022 Marzo - Ottobre 2026',
      'certs.cert1_status': 'IN CORSO',
      'certs.cert1_desc': 'Specializzazione in sistemistica informatica: Linux, Windows, virtualizzazione Proxmox, networking e sicurezza.',
      'certs.cert2_title': 'Robotica e Innovazione Digitale \u2013 Industria 4.0',
      'certs.cert2_meta': 'ITS Lab Academy Fano \u2022 2018 - 2022',
      'certs.cert2_status': 'COMPLETATO',
      'certs.cert2_desc': 'Corso di 1800 ore in robotica, programmazione, disegno tecnico e progettazione meccanica per Industria 4.0.',
      'certs.cert3_title': 'Diploma Tecnico Gestione Aziendale Informatica',
      'certs.cert3_meta': 'Istituto Adriano Olivetti \u2022 2008',
      'certs.cert3_status': 'COMPLETATO',
      'certs.cert3_desc': 'Diploma tecnico con specializzazione nella gestione aziendale e informatica di base.',

      // --- CONTACT PAGE ---
      'contact.label': 'ESTABLISH_CONNECTION',
      'contact.title': 'Contatti & ',
      'contact.title_span': 'Connessione',
      'contact.desc': '> Inizia una connessione sicura \u2014 ti rispondo entro 24h',
      'contact.secure_label': 'SECURE_CHANNEL',
      'contact.secure_text': 'Si apre il tuo client email • Nessun dato salvato sul sito',
      'contact.form_name_label': 'NOME *',
      'contact.form_name_plh': 'Il tuo nome',
      'contact.form_email_label': 'EMAIL *',
      'contact.form_email_plh': 'email@esempio.com',
      'contact.form_subject_label': 'OGGETTO',
      'contact.form_subject_plh': 'Oggetto del messaggio',
      'contact.form_msg_label': 'MESSAGGIO *',
      'contact.form_msg_plh': 'Descrivi il tuo progetto, la tua richiesta o proposta di collaborazione...',
      'contact.form_btn': 'INVIA_MESSAGGIO',
      'contact.form_loading': 'INVIO IN CORSO...',
      'contact.success_title': 'EMAIL_PRONTA',
      'contact.success_text': 'Si è aperto il tuo client email con il messaggio pronto. Premi invio lì per spedirlo.',
      'contact.success_btn': 'NUOVA_CONNESSIONE',
      'contact.direct_label': 'CANALI_DIRETTI',
      'contact.channel_email': 'EMAIL',
      'contact.channel_phone': 'TELEFONO',
      'contact.channel_linkedin': 'LINKEDIN',
      'contact.channel_location': 'LOCALIT\u00c0',
      'contact.avail_label': 'DISPONIBILE',
      'contact.avail_text': 'Aperto a nuove opportunit\u00e0 professionali in ambito sistemistica, networking e infrastrutture IT.',

      // --- FOOTER ---
      'footer.tagline': 'built with &lt;html&gt; \u2022 ',

      // --- TERMINAL DATA ---
      'term.status': 'DISPONIBILE',
      'term.cert_item1': 'Corso Sistemista \u2014 Confindustria Ancona (2026)',
      'term.cert_item2': 'Robotica Industria 4.0 \u2014 ITS Lab Academy (2018-2022)',
      'term.cert_item3': 'Diploma Tecnico Gestione Aziendale \u2014 Istituto A. Olivetti (2008)',
      'term.project_item1': 'Portfolio CV \u2014 Sito Personale (2026)',
      'term.project_item2': 'Home Lab Data Center \u2014 In pianificazione',
      'term.project_item3': 'Architettura SD-WAN \u2014 In pianificazione',
      'term.help': 'COMANDI DISPONIBILI:\n  help      \u2014 mostra questo messaggio\n  whoami    \u2014 mostra le mie informazioni\n  skills    \u2014 elenca le competenze\n  certs     \u2014 elenca le certificazioni\n  projects  \u2014 elenca i progetti\n  clear     \u2014 pulisce il terminale\n  reboot    \u2014 riavvia il terminale',
      'term.certs_link': '[APRI PAGINA CERTIFICAZIONI]',
      'term.projects_link': '[APRI PAGINA PROGETTI]',
      'term.unknown': (cmd) => `COMANDO SCONOSCIUTO: "${cmd}". DIGITA "help" PER AIUTO.`,
      'term.info_header': 'SYSTEM INFORMATION',
      'term.skills_header': 'COMPETENZE',
      'term.certs_header': 'CERTIFICAZIONI',
      'term.projects_header': 'PROGETTI',

      // --- BOOT SEQUENCE ---
      'boot.title': 'SYSTEM BOOT SEQUENCE v2.4.1',
      'boot.cpu': '> CPU:                    INTEL 80486 DX2 @ 66MHz',
      'boot.mem': '> MEM:                    16MB EDO RAM',
      'boot.hdd': '> HDD:                    WESTERN DIGITAL 540MB',
      'boot.video': '> VIDEO:                  SVGA 800x600 256 colori',
      'boot.sound': '> SOUND:                  SOUND BLASTER 16',
      'boot.init_hw': '> INIZIALIZZAZIONE HARDWARE...',
      'boot.hw_ide': 'Controller IDE',
      'boot.hw_com1': 'Porta seriale COM1',
      'boot.hw_lpt1': 'Porta parallela LPT1',
      'boot.hw_floppy': 'Controller floppy',
      'boot.init_kernel': '> CARICAMENTO MODULI KERNEL...',
      'boot.init_net': '> AVVIO SERVIZI DI RETE...',
      'boot.net_tcpip': 'Configurazione TCP/IP',
      'boot.net_hosts': 'Risoluzione hostnames',
      'boot.net_smtp': 'Servizio SMTP',
      'boot.net_http': 'Servizio HTTP',
      'boot.init_check': '> VERIFICA INTEGRIT\u00c0 SISTEMA...',
      'boot.chk_bios': 'Checksum BIOS',
      'boot.chk_part': 'Tabella partizioni',
      'boot.chk_bad': 'Settori danneggiati',
      'boot.box_top': '\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557',
      'boot.box_mid': '\u2551         SISTEMA PRONTO - STEFANO PUCCI v1.0          \u2551',
      'boot.box_bot': '\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d',
      'boot.connected': (d) => `> CONNESSIONE STABILITA \u2014 ${d}`,
      'boot.load_config': '> CARICAMENTO FILE CONFIG...',
      'boot.initializing': '> INITIALIZING: STEFANO_PUCCI \u2014 SISTEMISTA_INFORMATICO...',
      'boot.os_stack': '> OS_STACK: WINDOWS / LINUX [LOADED]',
      'boot.virt': '> VIRTUALIZZAZIONE: PROXMOX [ACTIVE]',
      'boot.net': '> NETWORKING: TCP/IP / LAN / VPN / FIREWALL [OK]',
      'boot.tools': '> TOOLS: MICROSOFT_OFFICE / SOLIDWORKS [READY]',
      'boot.lang': '> LINGUA: ITALIANO [NATIVO] \u2014 INGLESE [B2_CERTIFIED]',
      'boot.edu': '> FORMAZIONE: CONFINDUSTRIA_ANCONA \u2014 SISTEMISTA [IN_CORSO]',
      'boot.ready': '> READY FOR CONNECTION',
      'boot.help': '> DIGITA "help" PER I COMANDI DISPONIBILI',
    },

    en: {
      // --- NAV ---
      'nav.home': 'HOME',
      'nav.about': 'ABOUT',
      'nav.projects': 'PROJECTS',
      'nav.certs': 'CERTIFICATIONS',
      'nav.contact': 'CONTACT',
      'nav.lang_it': 'ITA',
      'nav.lang_en': 'ENG',

      // --- HERO (index) ---
      'hero.label': 'WHO_AM_I',
      'hero.tagline': 'Network Engineer & System Architect',
      'hero.subtitle': 'Design and management of high-performance IT infrastructures',
      'hero.btn_projects': 'EXPLORE_PROJECTS',
      'hero.btn_cv': 'DOWNLOAD_CV',
      'hero.btn_contact': 'CONTACT',

      // --- OVERVIEW SECTION ---
      'overview.label': 'SECTION_01',
      'overview.title': 'Technical ',
      'overview.title_span': 'Overview',
      'overview.desc': '> Tech stack and main areas of expertise',
      'overview.stat1_value': '7+',
      'overview.stat1_label': 'TECHNOLOGIES',
      'overview.stat2_value': '4',
      'overview.stat2_label': 'PROJECTS',
      'overview.stat3_value': '5',
      'overview.stat3_label': 'CERTIFICATIONS',
      'overview.stat4_value': '1800+',
      'overview.stat4_label': 'TRAINING HOURS',

      // --- CARDS ---
      'card1_title': 'Operating Systems',
      'card1_desc': 'Linux (Debian, Ubuntu, CentOS), Windows Server, Proxmox VE',
      'card2_title': 'Networking',
      'card2_desc': 'TCP/IP, VLAN, VPN, Firewall, SD-WAN, OSPF, BGP',
      'card3_title': 'Security',
      'card3_desc': 'Hardening, IDS/IPS, Backup automation, Vulnerability assessment',

      // --- CV DOWNLOAD ---
      'cv.label': 'DOWNLOAD_CV',
      'cv.title': 'Resum\u00e9 & ',
      'cv.title_span': 'CV',
      'cv.desc': '> Download my CV in PDF format',
      'cv.filename': 'CV_Stefano_Pucci.pdf',
      'cv.updated': 'Last update: July 2026 \u2022 PDF Format',
      'cv.btn': 'DOWNLOAD',

      // --- ABOUT PAGE ---
      'about.label': 'CORE_VALUES',
      'about.title': 'Who is ',
      'about.title_span': 'Stefano Pucci',
      'about.desc': '> IT system engineer with a unique and authentic background',
      'about.quote': 'Networks are not just cables and protocols \u2014 they are the backbone connecting people, ideas, and opportunities.',
      'about.quote_author': '\u2014 Stefano Pucci',
      'about.text': 'Thirteen years in family business management, then technical specialization in IT infrastructures, networking, and virtualization. My strength is combining hands-on field experience with the precision of technical design.',
      'about.val1_title': 'Practical Security',
      'about.val1_desc': 'Security is not a product, but a process. I implement proactive defenses and continuous monitoring.',
      'about.val2_title': 'Reliability',
      'about.val2_desc': 'Every system I design must work when needed. I plan for fault tolerance and disaster recovery.',
      'about.val3_title': 'Continuous Learning',
      'about.val3_desc': 'I constantly invest in training: from the System Engineer course at Confindustria to my home lab.',
      'about.val4_title': 'Real Passion',
      'about.val4_desc': 'Technology and networking have always been my passion \u2014 from the family bakery to the data center.',
      'about.timeline_label': 'MY_JOURNEY',
      'about.tl1_year': '2008 \u2013 2021',
      'about.tl1_title': 'The Roots',
      'about.tl1_desc': 'Co-founder of Panificio F.lli Pucci \u2014 management, organization, and responsibility.',
      'about.tl2_year': '2018 \u2013 2022',
      'about.tl2_title': 'Technical Training',
      'about.tl2_desc': 'ITS Lab Academy Fano \u2014 1800 hours in Robotics and Digital Innovation (Industry 4.0).',
      'about.tl3_year': '2026 \u2013 Present',
      'about.tl3_title': 'IT System Engineer',
      'about.tl3_desc': 'Specialization course at Confindustria Ancona \u2014 Linux, Windows, Proxmox, Networking, Security.',

      // --- PROJECTS PAGE ---
      'projects.label': 'SECTION_03',
      'projects.title': 'Completed ',
      'projects.title_span': 'Projects',
      'projects.desc': '> Overview of completed and ongoing projects',
      'projects.status_done': 'COMPLETED',
      'projects.featured_title': 'Portfolio CV \u2014 Personal Website',
      'projects.featured_sub': 'Professional website with resume and contacts',
      'projects.featured_desc': 'Design and development of a professional portfolio website to showcase technical skills, certifications, and projects in the IT and networking field. Static site with a terminal/cyberpunk theme featuring grid backgrounds, scanline effects, and glow animations, built entirely with vanilla HTML, CSS, and JavaScript.',
      'projects.spec1_value': 'Static',
      'projects.spec1_label': 'TYPE',
      'projects.spec2_value': '100%',
      'projects.spec2_label': 'MOBILE READY',
      'projects.spec3_value': '5',
      'projects.spec3_label': 'PAGES',
      'projects.spec4_value': '0',
      'projects.spec4_label': 'DEPENDENCIES',
      'projects.tech_label': 'TECH_STACK',
      'projects.links_label': 'LINKS',
      'projects.btn_source': 'SOURCE_CODE',
      'projects.btn_visit': 'VISIT_SITE',
      'projects.upcoming_label': 'UPCOMING_PROJECTS',
      'projects.soon_badge': 'PLANNED',
      'projects.soon1_title': 'Home Lab Data Center',
      'projects.soon1_desc': 'Spine-Leaf lab with Proxmox virtualization and Ansible automation.',
      'projects.soon2_title': 'SD-WAN Architecture',
      'projects.soon2_desc': 'SD-WAN design for multi-site connectivity with automatic failover.',

      // --- CERTIFICATIONS PAGE ---
      'certs.label': 'CREDENTIALS',
      'certs.title': 'Certifications & ',
      'certs.title_span': 'Training',
      'certs.desc': '> A path of constant growth: from technical diploma to IT specialization',
      'certs.stat1_value': '5',
      'certs.stat1_label': 'CERTIFICATIONS',
      'certs.stat2_value': '1800+',
      'certs.stat2_label': 'TRAINING HOURS',
      'certs.stat3_value': 'B2',
      'certs.stat3_label': 'CEFR ENGLISH',
      'certs.list_label': 'VERIFIED_CREDENTIALS',
      'certs.cert1_title': 'IT System Engineer Specialization Course',
      'certs.cert1_meta': 'Confindustria Ancona \u2022 March - October 2026',
      'certs.cert1_status': 'IN PROGRESS',
      'certs.cert1_desc': 'Specialization in IT systems: Linux, Windows, Proxmox virtualization, networking, and security.',
      'certs.cert2_title': 'Robotics and Digital Innovation \u2013 Industry 4.0',
      'certs.cert2_meta': 'ITS Lab Academy Fano \u2022 2018 - 2022',
      'certs.cert2_status': 'COMPLETED',
      'certs.cert2_desc': '1800-hour course in robotics, programming, technical drawing, and mechanical design for Industry 4.0.',
      'certs.cert3_title': 'Technical Diploma in Business Management & IT',
      'certs.cert3_meta': 'Istituto Adriano Olivetti \u2022 2008',
      'certs.cert3_status': 'COMPLETED',
      'certs.cert3_desc': 'Technical diploma with specialization in business management and basic IT.',

      // --- CONTACT PAGE ---
      'contact.label': 'ESTABLISH_CONNECTION',
      'contact.title': 'Contact & ',
      'contact.title_span': 'Connect',
      'contact.desc': '> Start a secure connection \u2014 I reply within 24h',
      'contact.secure_label': 'SECURE_CHANNEL',
      'contact.secure_text': 'Opens your email client • No data stored on this site',
      'contact.form_name_label': 'NAME *',
      'contact.form_name_plh': 'Your name',
      'contact.form_email_label': 'EMAIL *',
      'contact.form_email_plh': 'email@example.com',
      'contact.form_subject_label': 'SUBJECT',
      'contact.form_subject_plh': 'Message subject',
      'contact.form_msg_label': 'MESSAGE *',
      'contact.form_msg_plh': 'Describe your project, request, or collaboration proposal...',
      'contact.form_btn': 'SEND_MESSAGE',
      'contact.form_loading': 'SENDING...',
      'contact.success_title': 'EMAIL_READY',
      'contact.success_text': 'Your email client opened with the message ready. Press send there to deliver it.',
      'contact.success_btn': 'NEW_CONNECTION',
      'contact.direct_label': 'DIRECT_CHANNELS',
      'contact.channel_email': 'EMAIL',
      'contact.channel_phone': 'PHONE',
      'contact.channel_linkedin': 'LINKEDIN',
      'contact.channel_location': 'LOCATION',
      'contact.avail_label': 'AVAILABLE',
      'contact.avail_text': 'Open to new professional opportunities in IT systems, networking, and IT infrastructure.',

      // --- FOOTER ---
      'footer.tagline': 'built with &lt;html&gt; \u2022 ',

      // --- TERMINAL DATA ---
      'term.status': 'AVAILABLE',
      'term.cert_item1': 'IT Systems Course \u2014 Confindustria Ancona (2026)',
      'term.cert_item2': 'Robotics Industry 4.0 \u2014 ITS Lab Academy (2018-2022)',
      'term.cert_item3': 'Technical Diploma Business Mgmt \u2014 Istituto A. Olivetti (2008)',
      'term.project_item1': 'Portfolio CV \u2014 Personal Website (2026)',
      'term.project_item2': 'Home Lab Data Center \u2014 Planning',
      'term.project_item3': 'SD-WAN Architecture \u2014 Planning',
      'term.help': 'AVAILABLE COMMANDS:\n  help      \u2014 show this message\n  whoami    \u2014 display my information\n  skills    \u2014 list skills\n  certs     \u2014 list certifications\n  projects  \u2014 list projects\n  clear     \u2014 clear terminal\n  reboot    \u2014 restart terminal',
      'term.certs_link': '[OPEN CERTIFICATIONS PAGE]',
      'term.projects_link': '[OPEN PROJECTS PAGE]',
      'term.unknown': (cmd) => `UNKNOWN COMMAND: "${cmd}". TYPE "help" FOR HELP.`,
      'term.info_header': 'SYSTEM INFORMATION',
      'term.skills_header': 'SKILLS',
      'term.certs_header': 'CERTIFICATIONS',
      'term.projects_header': 'PROJECTS',

      // --- BOOT SEQUENCE ---
      'boot.title': 'SYSTEM BOOT SEQUENCE v2.4.1',
      'boot.cpu': '> CPU:                    INTEL 80486 DX2 @ 66MHz',
      'boot.mem': '> MEM:                    16MB EDO RAM',
      'boot.hdd': '> HDD:                    WESTERN DIGITAL 540MB',
      'boot.video': '> VIDEO:                  SVGA 800x600 256 colors',
      'boot.sound': '> SOUND:                  SOUND BLASTER 16',
      'boot.init_hw': '> HARDWARE INITIALIZATION...',
      'boot.hw_ide': 'IDE Controller',
      'boot.hw_com1': 'COM1 Serial Port',
      'boot.hw_lpt1': 'LPT1 Parallel Port',
      'boot.hw_floppy': 'Floppy Controller',
      'boot.init_kernel': '> LOADING KERNEL MODULES...',
      'boot.init_net': '> STARTING NETWORK SERVICES...',
      'boot.net_tcpip': 'TCP/IP Configuration',
      'boot.net_hosts': 'Hostname Resolution',
      'boot.net_smtp': 'SMTP Service',
      'boot.net_http': 'HTTP Service',
      'boot.init_check': '> SYSTEM INTEGRITY CHECK...',
      'boot.chk_bios': 'BIOS Checksum',
      'boot.chk_part': 'Partition Table',
      'boot.chk_bad': 'Bad Sectors',
      'boot.box_top': '\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557',
      'boot.box_mid': '\u2551         SYSTEM READY - STEFANO PUCCI v1.0           \u2551',
      'boot.box_bot': '\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d',
      'boot.connected': (d) => `> STABLE CONNECTION \u2014 ${d}`,
      'boot.load_config': '> LOADING CONFIG FILE...',
      'boot.initializing': '> INITIALIZING: STEFANO_PUCCI \u2014 SYSTEM_ENGINEER...',
      'boot.os_stack': '> OS_STACK: WINDOWS / LINUX [LOADED]',
      'boot.virt': '> VIRTUALIZATION: PROXMOX [ACTIVE]',
      'boot.net': '> NETWORKING: TCP/IP / LAN / VPN / FIREWALL [OK]',
      'boot.tools': '> TOOLS: MICROSOFT_OFFICE / SOLIDWORKS [READY]',
      'boot.lang': '> LANGUAGE: ITALIAN [NATIVE] \u2014 ENGLISH [B2_CERTIFIED]',
      'boot.edu': '> EDUCATION: CONFINDUSTRIA_ANCONA \u2014 IT_SYSTEMS [IN_PROGRESS]',
      'boot.ready': '> READY FOR CONNECTION',
      'boot.help': '> TYPE "help" FOR AVAILABLE COMMANDS',
    }
  },

  init() {
    this.current = localStorage.getItem('lang') || 'it';
    document.documentElement.lang = this.current;
    this.updateDOM();
    this.updateTerminalData();
    this.updateTerminalBoot();
  },

  t(key) {
    const val = this.data[this.current][key];
    return val !== undefined ? val : key;
  },

  switch(lang) {
    if (lang === this.current) return;
    this.current = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    this.updateDOM();
    this.updateTerminalData();
    this.updateTerminalBoot();
    this.updateLangButton();
  },

  updateDOM() {
    // Update textContent for data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Update innerHTML for data-i18n-html elements (contains HTML entities)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = this.t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Update title/meta
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
  },

  updateLangButton() {
    const btnIt = document.querySelector('.lang-btn-it');
    const btnEn = document.querySelector('.lang-btn-en');
    if (btnIt) btnIt.classList.toggle('active', this.current === 'it');
    if (btnEn) btnEn.classList.toggle('active', this.current === 'en');
  },

  updateTerminalData() {
    if (typeof terminalData === 'undefined') return;
    const u = terminalData.user;
    u.status = this.t('term.status');
    terminalData.certs = [
      this.t('term.cert_item1'),
      this.t('term.cert_item2'),
      this.t('term.cert_item3')
    ];
    terminalData.projects = [
      this.t('term.project_item1'),
      this.t('term.project_item2'),
      this.t('term.project_item3')
    ];
  },

  updateTerminalBoot() {
    if (typeof terminalInstance !== 'undefined' && terminalInstance) {
      if (terminalInstance.bootComplete) {
        terminalInstance.boot(true);
      } else {
        terminalInstance.pendingLanguageReboot = true;
      }
    }
  }
};

// Auto-init
LANG.init();
