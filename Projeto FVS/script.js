function trackMarketingEvent(eventName, params = {}) {
    try {
        const safeParams = params && typeof params === 'object' ? params : {};
        const pagePath = typeof window !== 'undefined' && window.location ? window.location.pathname : '';

        const dataLayerPayload = {
            event: eventName,
            page_path: pagePath,
            ...safeParams
        };

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(dataLayerPayload);

        const vendorPayload = {
            page_path: pagePath,
            ...safeParams
        };

        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, vendorPayload);
        }

        if (typeof window.fbq === 'function') {
            window.fbq('trackCustom', eventName, vendorPayload);
        }
    } catch {}
}

function normalizeInterest(value) {
    const v = String(value || '').trim().toLowerCase();
    if (!v) return '';
    if (v.includes('imó') || v.includes('imov')) return 'imovel';
    if (v.includes('veí') || v.includes('veic') || v.includes('auto') || v.includes('carro') || v.includes('frota')) return 'veiculo';
    if (v.includes('moto')) return 'motocicleta';
    if (v.includes('pesad') || v.includes('caminh') || v.includes('máquin') || v.includes('maquin')) return 'pesados';
    if (v.includes('serv')) return 'servicos';
    return v.replace(/\s+/g, '_');
}

function getClickableLabel(el) {
    if (!el) return '';
    const explicit = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('data-track-label'));
    const text = explicit || (el.textContent || '');
    return String(text).trim().toLowerCase().replace(/\s+/g, '_').slice(0, 64);
}

function initClickTracking() {
    if (typeof window === 'undefined') return;
    if (window.__fvsClickTrackingInitialized) return;
    window.__fvsClickTrackingInitialized = true;

    const getPlacement = (el) => {
        try {
            if (el && el.classList && el.classList.contains('floating-whatsapp')) return 'floating';
            if (el && el.closest && el.closest('.navbar')) return 'header';
            if (el && el.closest && el.closest('.hero')) return 'hero';
            if (el && el.closest && el.closest('.simulation-page')) return 'simulation';
            if (el && el.closest && el.closest('footer')) return 'footer';
        } catch {}
        return 'page';
    };

    const onClick = (e) => {
        const clickable = e.target && e.target.closest ? e.target.closest('a,button') : null;
        if (!clickable) return;

        const tag = clickable.tagName ? clickable.tagName.toLowerCase() : '';
        const href = tag === 'a' ? (clickable.getAttribute('href') || '') : '';
        const label = getClickableLabel(clickable);
        const placement = getPlacement(clickable);

        if (href && /(wa\.me\/|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send)/i.test(href)) {
            trackMarketingEvent('lead_whatsapp_click', { label, placement });
            return;
        }

        if (href && /(^|\/)simulacao(\.html)?(\?|#|$)/i.test(href)) {
            trackMarketingEvent('simulation_start', { label: label || 'simulacao', placement });
            return;
        }

        if (href && /embracon\.com\.br/i.test(href)) {
            trackMarketingEvent('partner_click', { partner: 'embracon', label: label || 'embracon', placement });
            return;
        }

        if (href && /(share\.google|google\.com\/maps)/i.test(href)) {
            trackMarketingEvent('partner_click', { partner: 'google_maps', label: label || 'maps', placement });
            return;
        }
    };

    document.addEventListener('click', onClick, true);
}

document.addEventListener('DOMContentLoaded', () => {
    // Select elements to animate
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');

    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stop observing once visible to prevent re-animating
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '0px 0px -50px 0px' // Offset to trigger slightly before bottom
    });

    // Start observing
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });

    // Dynamic Year
    const currentYear = new Date().getFullYear();
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = currentYear;
    }

    // Back to Top Button
    const backToTopBtn = document.querySelector('.back-to-top');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
    }

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Video Modal Logic
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    const closeModal = document.querySelector('.close-modal');
    const videoTriggers = document.querySelectorAll('.video-trigger, .video-trigger-small');

    if (modal && modalVideo) {
        videoTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default if it's inside a link
                e.stopPropagation(); // Stop event bubbling
                
                const videoSrc = trigger.getAttribute('data-video');
                const posterSrc = trigger.getAttribute('data-poster');
                
                if (videoSrc) {
                    trackMarketingEvent('video_open', { video: String(videoSrc).split('/').pop() || String(videoSrc) });
                    modalVideo.querySelector('source').src = videoSrc;
                    if (posterSrc) {
                        modalVideo.poster = posterSrc;
                    } else {
                        modalVideo.removeAttribute('poster');
                    }
                    modalVideo.load(); // Reload video with new source
                    modal.classList.add('active');
                    modalVideo.volume = 0.6; // Set volume to 60%
                    modalVideo.play();
                }
            });
        });

        const closeVideoModal = () => {
            modal.classList.remove('active');
            modalVideo.pause();
            modalVideo.currentTime = 0;
        };

        if (closeModal) {
            closeModal.addEventListener('click', closeVideoModal);
        }

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVideoModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeVideoModal();
            }
        });
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            // Toggle icon
            const icon = mobileMenuBtn.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close menu when clicking a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize simulation if on simulation page
    if (document.getElementById('simulation-form')) {
        trackMarketingEvent('simulation_view', {});
        updateSimulationOptions();
    }

    initClickTracking();

    // Testimonials Slider Logic
    const slider = document.querySelector('.testimonials-slider');
    const paginationContainer = document.querySelector('.slider-pagination');
    
    if (slider && paginationContainer) {
        const cards = slider.querySelectorAll('.google-card');
        
        // Clear existing dots if any
        paginationContainer.innerHTML = '';
        
        // Create dots
        cards.forEach((card, index) => {
            const dot = document.createElement('div');
            dot.classList.add('slider-dot');
            if (index === 0) dot.classList.add('active');
            
            dot.addEventListener('click', () => {
                // Scroll to center the specific card
                // Using getBoundingClientRect for accuracy relative to viewport
                // But we need the position relative to the scroll container content
                // card.offsetLeft works if offsetParent is correct, but let's be safe:
                
                const cardWidth = card.offsetWidth;
                const sliderWidth = slider.offsetWidth;
                
                // Calculate position relative to the scrollable content start
                // We can't easily get "scrollable content start" with getBoundingClientRect if scrolled
                // But we can calculate target scrollLeft directly
                
                // Position of card relative to slider visible area (including scroll)
                const cardLeftRelative = card.offsetLeft; 
                // Note: offsetLeft is relative to offsetParent. 
                // If slider is relative, it works. 
                
                // Let's use a simpler approach: 
                // targetScrollLeft = currentScrollLeft + (cardViewportLeft - sliderViewportLeft) - (sliderWidth/2 - cardWidth/2)
                
                const cardRect = card.getBoundingClientRect();
                const sliderRect = slider.getBoundingClientRect();
                const currentScroll = slider.scrollLeft;
                
                const cardRelativePos = cardRect.left - sliderRect.left + currentScroll;
                
                const centerOffset = (sliderWidth - cardWidth) / 2;
                const scrollTarget = cardRelativePos - centerOffset;
                
                slider.scrollTo({
                    left: scrollTarget,
                    behavior: 'smooth'
                });
            });
            
            paginationContainer.appendChild(dot);
        });
        
        // Update active dot on scroll
        let isScrolling = false;
        
        slider.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    const sliderRect = slider.getBoundingClientRect();
                    const sliderCenter = sliderRect.left + (sliderRect.width / 2);
                    
                    let minDistance = Infinity;
                    let activeIndex = 0;
                    
                    cards.forEach((card, index) => {
                        const cardRect = card.getBoundingClientRect();
                        const cardCenter = cardRect.left + (cardRect.width / 2);
                        const distance = Math.abs(sliderCenter - cardCenter);
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            activeIndex = index;
                        }
                    });
                    
                    const dots = paginationContainer.querySelectorAll('.slider-dot');
                    dots.forEach((d, i) => {
                        if (i === activeIndex) {
                            d.classList.add('active');
                        } else {
                            d.classList.remove('active');
                        }
                    });
                    
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
    }
});

// Simulation Logic - Configurable Calculation Model
const consorcioTypes = {
    'Imóvel': {
        terms: [36, 50, 60, 70, 85, 100, 120, 135, 150, 200, 220, 240],
        defaultTerm: 100,
        min: 120000,
        max: 1200000,
        // Configuração de Prazos Dinâmicos
        dynamicTerms: [
            { maxCredit: 599999, allowedTerms: [36, 50, 60, 70, 85, 100, 120, 135, 150] },
            { maxCredit: 1200000, allowedTerms: [36, 50, 60, 70, 85, 100, 120, 135, 150, 200, 220, 240] }
        ],
        termFees: {
            36: { adminMonthlyRate: 0.0036, reserveTotalRate: 0.02, upfrontTotalRate: 0.02 },
            50: { adminMonthlyRate: 0.0026, reserveTotalRate: 0.02, upfrontTotalRate: 0.02 },
            60: { adminMonthlyRate: 0.0022, reserveTotalRate: 0.02, upfrontTotalRate: 0.02 },
            70: { adminMonthlyRate: 0.0019, reserveTotalRate: 0.02, upfrontTotalRate: 0.02 },
            85: { adminMonthlyRate: 0.0015, reserveTotalRate: 0.02, upfrontTotalRate: 0.02 },
            100: { adminMonthlyRate: 0.0013, reserveTotalRate: 0.02, upfrontTotalRate: 0.02 },
            120: { adminMonthlyRate: 0.0012, reserveTotalRate: 0.02, upfrontTotalRate: 0.02 },
            135: { adminMonthlyRate: 0.0011, reserveTotalRate: 0.02, upfrontTotalRate: 0.02 },
            150: { adminMonthlyRate: 0.0011, reserveTotalRate: 0.02, upfrontTotalRate: 0.02 },
            200: { adminMonthlyRate: 0.001, reserveTotalRate: 0.02, upfrontTotalRate: 0.012 },
            220: { adminMonthlyRate: 0.001, reserveTotalRate: 0.02, upfrontTotalRate: 0.012 },
            240: { adminMonthlyRate: 0.001, reserveTotalRate: 0.02, upfrontTotalRate: 0.012 }
        },
        strategies: [
            // Exact Strategies based on User Provided Data
            {
                maxMonths: 36,
                factor: 0.92069, // 30.689,77 / 33.333,33
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01 // 2% total / 2 months
                }
            },
            {
                maxMonths: 50,
                factor: 0.93068, // 2.233,64 / 2.400,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            {
                maxMonths: 60,
                factor: 0.93782, // 1.875,64 / 2.000,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            {
                maxMonths: 70,
                factor: 0.94496, // 1.619,93 / 1.714,28
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            {
                maxMonths: 85,
                factor: 0.95566, // 1.349,17 / 1.411,76
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            {
                maxMonths: 100,
                factor: 0.89500,
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            {
                maxMonths: 120,
                factor: 0.99138, // 991,38 / 1.000,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            {
                maxMonths: 135,
                factor: 1.01300, // 900,44 / 888,88
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            {
                maxMonths: 150,
                factor: 1.03480, // 827,84 / 800,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            // Long Term Strategy (240m)
            {
                maxMonths: 300,
                factor: 0.94539, // 4.726,96 / 5.000,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 12,
                    addonRate: 0.001 // 1.2% total / 12 months
                }
            }
        ],
        adminRate: 0.0013,
        reserveFundRate: 0.02, // 2% total
        insurance: 0 // Handled in factor
    },
    'Veículo': {
        terms: [36, 50, 60, 90, 100],
        defaultTerm: 60,
        min: 45000,
        max: 180000,
        dynamicTerms: [],
        strategies: [
            // Short/Medium Term (2 installmnets upfront)
            {
                maxMonths: 36,
                factor: 0.90797, // 4.539,87 / 5.000,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01 // 2% total / 2 months
                }
            },
            {
                maxMonths: 50,
                factor: 0.91788, // 3.304,37 / 3.600,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            {
                maxMonths: 60,
                factor: 0.92496, // 2.774,87 / 3.000,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 2,
                    addonRate: 0.01
                }
            },
            // Long Term (1 installment upfront)
            {
                maxMonths: 90,
                factor: 0.70978, // 1.419,56 / 2.000,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 1,
                    addonRate: 0.02 // 2% total in 1st month
                }
            },
            {
                maxMonths: 100,
                factor: 0.72759, // 1.309,66 / 1.800,00
                firstInstallmentsRule: {
                    enabled: true,
                    count: 1,
                    addonRate: 0.02 // 2% total in 1st month
                }
            }
        ],
        adminRate: 0.0014, // 0.14% per month
        reserveFundRate: 0.03, // 3% total
        insurance: 0
    },
    'Motocicleta': {
        terms: [36, 50, 60, 70],
        defaultTerm: 60,
        min: 10000,
        max: 30000, // Based on user input "valor máximo" for this specific example
        strategies: [
            {
                maxMonths: 36,
                factor: 1.27746, // 1.064,55 / 833,33
                firstInstallmentsRule: {
                    enabled: false
                }
            },
            {
                maxMonths: 50,
                factor: 1.28813, // 772,88 / 600,00
                firstInstallmentsRule: {
                    enabled: false
                }
            },
            {
                maxMonths: 60,
                factor: 1.29576, // 647,88 / 500,00
                firstInstallmentsRule: {
                    enabled: false
                }
            },
            {
                maxMonths: 70,
                factor: 1.30338, // 558,59 / 428,57
                firstInstallmentsRule: {
                    enabled: false
                }
            }
        ],
        adminRate: 0.003, // Higher for moto
        reserveFundRate: 0.05,
        insurance: 0
    },
    'Pesados': {
        terms: [50, 60, 70, 85, 100],
        defaultTerm: 100,
        min: 100000, // Reasonable min for heavy vehicles
        max: 400000, // Based on user input
        strategies: [
            {
                maxMonths: 50,
                factor: 1.22629, // 9.810,36 / 8.000,00
                firstInstallmentsRule: {
                    enabled: false
                }
            },
            {
                maxMonths: 60,
                factor: 1.23355, // 8.223,69 / 6.666,66
                firstInstallmentsRule: {
                    enabled: false
                }
            },
            {
                maxMonths: 70,
                factor: 1.24081, // 7.090,36 / 5.714,28
                firstInstallmentsRule: {
                    enabled: false
                }
            },
            {
                maxMonths: 85,
                factor: 1.25170, // 5.890,36 / 4.705,88
                firstInstallmentsRule: {
                    enabled: false
                }
            },
            {
                maxMonths: 100,
                factor: 1.26259, // 5.050,36 / 4.000,00
                firstInstallmentsRule: {
                    enabled: false
                }
            }
        ],
        adminRate: 0.002,
        reserveFundRate: 0.03,
        insurance: 0
    },
    'Serviços': {
        terms: [12, 24, 36, 48],
        defaultTerm: 36,
        min: 10000,
        max: 50000,
        strategies: [
            {
                maxMonths: 100,
                factor: 0.84,
                firstInstallmentsRule: {
                    enabled: false,
                    count: 0,
                    addonRate: 0
                }
            }
        ],
        adminRate: 0.002, // Highest admin rate
        reserveFundRate: 0.0005,
        insurance: 0
    }
};

function syncValueInput(val) {
    const numericValue = parseFloat(val);
    const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
    document.getElementById('value-text').value = formatted;
    
    // Atualiza os prazos disponíveis com base no valor
    updateTermsList(numericValue);

    calculateSimulation();
}

function syncSliderInput(val) {
    // Remove formatting (R$, dots) and replace comma with dot
    let cleanVal = val.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    let numericValue = parseFloat(cleanVal);
    
    const slider = document.getElementById('value-slider');
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);

    if (isNaN(numericValue)) {
        numericValue = min;
    } else if (numericValue < min) {
        numericValue = min;
    } else if (numericValue > max) {
        numericValue = max;
    }

    slider.value = numericValue;
    syncValueInput(numericValue); // Re-format properly
}

function updateTermsList(currentValue) {
    const typeSelect = document.getElementById('type');
    const termSelect = document.getElementById('installments');
    const selectedType = typeSelect.value;
    const currentTerm = parseInt(termSelect.value);

    if (selectedType && consorcioTypes[selectedType]) {
        const config = consorcioTypes[selectedType];
        let availableTerms = config.terms;

        // Verifica regras dinâmicas
        if (config.dynamicTerms && config.dynamicTerms.length > 0) {
            // Ordena regras por valor máximo (menor para maior) para encontrar a primeira que se aplica
            const sortedRules = [...config.dynamicTerms].sort((a, b) => a.maxCredit - b.maxCredit);
            
            for (const rule of sortedRules) {
                if (currentValue <= rule.maxCredit) {
                    availableTerms = rule.allowedTerms;
                    break; // Encontrou a regra mais restritiva que se aplica
                }
            }
        }

        // Reconstrui o select de prazos
        termSelect.innerHTML = '';
        availableTerms.forEach(term => {
            const option = document.createElement('option');
            option.value = term;
            option.textContent = `${term} meses`;
            if (term === currentTerm) option.selected = true;
            termSelect.appendChild(option);
        });

        // Se o prazo selecionado anteriormente não estiver mais disponível, seleciona o padrão ou o primeiro
        if (!availableTerms.includes(currentTerm)) {
            // Tenta selecionar o maior prazo disponível por padrão (comum em simulações)
            // ou mantém a lógica de defaultTerm se estiver disponível
            if (availableTerms.includes(config.defaultTerm)) {
                termSelect.value = config.defaultTerm;
            } else {
                termSelect.value = availableTerms[availableTerms.length - 1]; // Maior prazo disponível
            }
        }
    }
}

function updateSimulationOptions() {
    const typeSelect = document.getElementById('type');
    const termSelect = document.getElementById('installments');
    const valueSlider = document.getElementById('value-slider');
    const selectedType = typeSelect.value;

    // Clear existing options
    termSelect.innerHTML = '';

    if (selectedType && consorcioTypes[selectedType]) {
        if (typeof window !== 'undefined') {
            const normalized = normalizeInterest(selectedType);
            if (normalized && window.__fvsLastSimulationInterest !== normalized) {
                window.__fvsLastSimulationInterest = normalized;
                trackMarketingEvent('simulation_interest_select', { interest: normalized });
            }
        }

        const config = consorcioTypes[selectedType];
        
        // Update slider constraints
        if (config.max) {
            valueSlider.max = config.max;
            valueSlider.min = config.min; // Ensure min is also updated
            
            // RESET VALUE LOGIC: Always reset to minimum when type changes
            // This ensures the slider visually moves to the start and prevents confusion
            // (e.g. going from 1.5M Imóvel to Veículo shouldn't stay at max vehicle value)
            valueSlider.value = config.min;
            syncValueInput(config.min);
        }
        
        // Update terms
        updateTermsList(parseFloat(valueSlider.value));

        // Force recalculation
        calculateSimulation();
    } else {
        // Default options if nothing selected
        const option = document.createElement('option');
        option.textContent = 'Selecione o tipo primeiro';
        termSelect.appendChild(option);
    }
}

function calculateSimulation() {
    const type = document.getElementById('type').value;
    const value = parseFloat(document.getElementById('value-slider').value);
    const months = parseInt(document.getElementById('installments').value);
    const resultDiv = document.getElementById('simulation-result');
    const paymentSpan = document.getElementById('monthly-payment');
    const resultCredit = document.getElementById('result-credit');
    const resultTerm = document.getElementById('result-term');
    const feesContainer = document.getElementById('result-fees');
    const adminFeeEl = document.getElementById('result-admin-fee');
    const reserveFeeEl = document.getElementById('result-reserve-fee');
    const upfrontFeeEl = document.getElementById('result-upfront-fee');

    if (type && value && months) {
        if (typeof window !== 'undefined') {
            const normalized = normalizeInterest(type);
            const signature = `${normalized}:${months}`;
            if (normalized && window.__fvsLastSimulationCalculated !== signature) {
                window.__fvsLastSimulationCalculated = signature;
                trackMarketingEvent('simulation_calculated', { interest: normalized, term_months: months });
            }
        }

        const config = consorcioTypes[type];
        const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        // Update summary fields
        if (resultCredit) resultCredit.textContent = `R$ ${formatter.format(value)}`;
        if (resultTerm) resultTerm.textContent = `${months} meses`;

        if (feesContainer) {
            if (type === 'Imóvel' && config.termFees && config.termFees[months]) {
                const fees = config.termFees[months];
                const formatPct = (valuePct) => valuePct.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
                const adminPct = formatPct(fees.adminMonthlyRate * 100);
                const reservePct = formatPct(fees.reserveTotalRate * 100);
                const upfrontPct = formatPct(fees.upfrontTotalRate * 100);

                if (adminFeeEl) adminFeeEl.textContent = `${adminPct}% ao mês`;
                if (reserveFeeEl) reserveFeeEl.textContent = `${reservePct}%`;
                if (upfrontFeeEl) upfrontFeeEl.textContent = `${upfrontPct}%`;
                feesContainer.style.display = 'block';
            } else {
                feesContainer.style.display = 'none';
            }
        }
        
        // Find matching strategy
        let strategy = null;
        if (config.strategies) {
            strategy = config.strategies.find(s => months <= s.maxMonths);
        }
        
        // Fallback if no strategy matches (shouldn't happen if configured correctly)
        if (!strategy) {
            strategy = {
                factor: 1.0,
                firstInstallmentsRule: { enabled: false }
            };
        }

        // 1. Calculate Base Installment using the configured factor
        const factor = strategy.factor;
        const baseInstallment = (value / months) * factor;
        
        // 2. Check for First Installments Rule
        if (strategy.firstInstallmentsRule && strategy.firstInstallmentsRule.enabled) {
            const rule = strategy.firstInstallmentsRule;
            const addonAmount = value * rule.addonRate;
            const firstInstallmentValue = baseInstallment + addonAmount;

            const countLabel =
                rule.count === 2
                    ? '1ª e 2ª parcela'
                    : rule.count > 1
                        ? `1ª a ${rule.count}ª parcela`
                        : '1ª parcela';

            paymentSpan.innerHTML = `
                <div class="payment-row">
                    <span class="payment-label">${countLabel}</span>
                    <strong class="payment-value">R$ ${formatter.format(firstInstallmentValue)}</strong>
                </div>
                <div class="payment-row">
                    <span class="payment-label">Demais parcelas</span>
                    <strong class="payment-value">R$ ${formatter.format(baseInstallment)}</strong>
                </div>
            `;
        } else {
            paymentSpan.innerHTML = `
                <div class="payment-row">
                    <span class="payment-label">Parcela</span>
                    <strong class="payment-value">R$ ${formatter.format(baseInstallment)}</strong>
                </div>
            `;
        }
        
        resultDiv.style.display = 'block';
    } else {
        resultDiv.style.display = 'none';
    }
}

// Função para mostrar toast notification
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    let icon = 'fa-info-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'success') icon = 'fa-check-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

async function createKommoLeadFromSimulation(payload) {
    try {
        const response = await fetch('/.netlify/functions/kommo-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        });

        if (!response.ok) {
            return { ok: false, status: response.status };
        }

        const json = await response.json().catch(() => null);
        if (!json || json.ok !== true) {
            return { ok: false, status: response.status };
        }

        return { ok: true, leadId: json.lead_id };
    } catch {
        return { ok: false, status: 0 };
    }
}

// Função de envio da simulação via WhatsApp
async function sendSimulation() {
    // Coleta dados dos campos
    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const email = document.getElementById('client-email').value;
    const cep = document.getElementById('client-cep').value;
    const type = document.getElementById('type').value;
    const value = document.getElementById('value-slider').value;
    const months = document.getElementById('installments').value;

    // Validação básica
    if (!name || !phone || !type || !value || !months) {
        showToast("Por favor, preencha todos os campos obrigatórios e realize a simulação.", "error");
        return;
    }

    // Formata valor monetário
    const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // Captura o texto da parcela (pode conter HTML, então pegamos innerText limpo)
    const installmentElement = document.getElementById('monthly-payment');
    let installmentValue = installmentElement ? installmentElement.innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : 'N/A';

    const numericMonths = Number(months);
    const feesConfig = consorcioTypes[type];
    const termFees = feesConfig && feesConfig.termFees ? feesConfig.termFees[numericMonths] : null;
    const feeLines = termFees
        ? (() => {
            const formatPct = (valuePct) => valuePct.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
            const adminPct = formatPct(termFees.adminMonthlyRate * 100);
            const reservePct = formatPct(termFees.reserveTotalRate * 100);
            const upfrontPct = formatPct(termFees.upfrontTotalRate * 100);
            return (
                `*Taxa administrativa:* ${adminPct}% ao mês%0A` +
                `*Fundo reserva:* ${reservePct}%0A` +
                `*Taxa antecipada:* ${upfrontPct}%0A`
            );
        })()
        : '';
    
    // Monta a mensagem
    const message = `*Nova Simulação de Consórcio (Via Site)*%0A%0A` +
                    `*Cliente:* ${name}%0A` +
                    `*WhatsApp:* ${phone}%0A` +
                    `*Email:* ${email}%0A` +
                    `*CEP:* ${cep}%0A` +
                    `--------------------------------%0A` +
                    `*Objetivo:* ${type}%0A` +
                    `*Crédito Desejado:* ${formattedValue}%0A` +
                    `*Prazo:* ${months} meses%0A` +
                    `*Parcela Estimada:* ${installmentValue}%0A` +
                    (feeLines ? `--------------------------------%0A${feeLines}` : '') +
                    `--------------------------------%0A` +
                    `*Gostaria de uma análise de crédito detalhada.*`;

    trackMarketingEvent('simulation_submit', {
        interest: normalizeInterest(type),
        credit_value: Number(value),
        term_months: Number(months)
    });

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search || '') : null;
    const getParam = (key) => {
        if (!urlParams) return '';
        return String(urlParams.get(key) || '').trim();
    };

    const kommoResult = await createKommoLeadFromSimulation({
        source: 'site_simulacao',
        name,
        phone,
        email,
        cep,
        objective: type,
        credit_value: formattedValue,
        months,
        installment: installmentValue,
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof window !== 'undefined' ? (document.referrer || '') : '',
        utm_source: getParam('utm_source'),
        utm_medium: getParam('utm_medium'),
        utm_campaign: getParam('utm_campaign'),
        utm_term: getParam('utm_term'),
        utm_content: getParam('utm_content'),
        utm_referrer: getParam('utm_referrer'),
        gclid: getParam('gclid'),
        fbclid: getParam('fbclid'),
        gclientid: getParam('gclientid')
    });

    if (kommoResult.ok) {
        trackMarketingEvent('kommo_lead_created', { lead_id: kommoResult.leadId });
        showToast('Recebemos sua simulação. Em instantes entraremos em contato.', 'success');
    } else {
        trackMarketingEvent('kommo_lead_failed', { status: Number(kommoResult.status || 0) });
    }

    const leadReference = kommoResult.ok && kommoResult.leadId ? ` (Ref.: ${kommoResult.leadId})` : '';
    const whatsappMessage =
        `Olá! Sou ${name} e fiz uma simulação no seu site${leadReference}.%0A` +
        `Tenho interesse em saber mais sobre consórcio.%0A` +
        `Objetivo: ${type}%0A` +
        `Crédito: ${formattedValue}%0A` +
        `Prazo: ${months} meses`;
    
    // Abre WhatsApp
    const whatsappUrl = `https://wa.me/5561996667218?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
}

// Função para formatar telefone
function formatPhone(value) {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 10) {
        return value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 5) {
        return value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
        return value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
    } else {
        return value.replace(/^(\d*)/, '($1');
    }
}

// Função para formatar CEP
function formatCEP(value) {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    if (value.length > 5) {
        return value.replace(/^(\d{5})(\d{1,3}).*/, '$1-$2');
    }
    return value;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Máscaras de Input
    const phoneInput = document.getElementById('client-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            // Permite que o usuário apague livremente sem a máscara "lutar" contra ele
            if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
                return;
            }
            e.target.value = formatPhone(e.target.value);
        });
        
        // Garante a formatação correta quando o usuário termina de digitar
        phoneInput.addEventListener('blur', (e) => {
            e.target.value = formatPhone(e.target.value);
        });
    }

    const cepInput = document.getElementById('client-cep');
    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            e.target.value = formatCEP(e.target.value);
        });
    }

    // Inicializa opções se estiver na página de simulação
});
