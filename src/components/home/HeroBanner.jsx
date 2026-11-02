/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowRight, Zap, ShieldCheck, Star, ChevronLeft,
    ChevronRight, PhoneCall, Check, ShoppingCart, X, CheckCircle2
} from 'lucide-react';
import { fetchBanners } from '../../api/api';
import { getImageUrl } from '../../api/config';
import LocationSearchInput from './LocationSearchInput';
import './HeroBanner.css';

// Kuiky High-Fidelity Service Banners (New)
import imgAmbulance from '../../assets/ambulance_banner.jpg';
import imgAuto from '../../assets/auto_banner.jpg';
import imgPuncture from '../../assets/puncture_banner.jpg';

// Retail & E-Commerce Sale Banners (Old)
import imgMen from '../../assets/MEN.png';
import imgBig from '../../assets/big.png';
import imgBanner from '../../assets/banner.png';

const LOCAL_FALLBACK_IMAGES = {
    'MEN.png': imgMen,
    'big.png': imgBig,
    'banner_1fBlQHN.png': imgBanner,
    'banner': imgBanner,
    'ambulance_banner.jpg': imgAmbulance,
    'auto_banner.jpg': imgAuto,
    'puncture_banner.jpg': imgPuncture,
    'Auto_1cLWSkY.jpeg': imgAuto,
    'Auto.jpeg': imgAuto
};

const ALL_DEFAULT_BANNERS = [
    // 1. Ambulance Booking (Kuiky Service)
    {
        id: 'ambulance',
        service_type: 'ambulance',
        title: "Ambulance Booking",
        subtitle: "Emergency care, just a call away.",
        description: "Emergency care, just a call away. Equipped with trained medical staff, ICU support equipment, and 24/7 priority emergency lines for instant dispatch.",
        prize_offer: "🚨 24/7 EMERGENCY RESPONSE • INSTANT DISPATCH",
        resolvedImage: imgAmbulance,
        theme_color: "#ef4444",
        gradient_bg: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
        accent_glow: "rgba(239, 68, 68, 0.4)",
        cta_text: "Call SOS",
        cta_tel: "tel:108",
        checklist: [
            "24/7 Availability",
            "Trained Medical Staff",
            "24/7 Priority Emergency Line"
        ],
        stats: [
            { label: "24/7 PRIORITY LINE", icon: Zap },
            { label: "CERTIFIED MEDICAL STAFF", icon: ShieldCheck }
        ]
    },
    // 2. Auto Booking (Kuiky Service)
    {
        id: 'auto',
        service_type: 'auto',
        title: "Auto Booking",
        subtitle: "Quick rides for your daily travel.",
        description: "Quick rides for your daily travel. Guaranteed affordable rates, 100% verified trusted drivers, and real-time live GPS tracking for your daily commute.",
        prize_offer: "🚖 QUICK CITY COMMUTE • ZERO SURGE PRICING",
        resolvedImage: imgAuto,
        theme_color: "#f59e0b",
        gradient_bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        accent_glow: "rgba(245, 158, 11, 0.4)",
        cta_text: "Book Auto",
        checklist: [
            "Affordable Rates",
            "Verified Drivers",
            "Live Tracking"
        ],
        stats: [
            { label: "AFFORDABLE RATES", icon: Zap },
            { label: "VERIFIED DRIVERS", icon: Star }
        ]
    },
    // 3. Puncture Booking (Kuiky Service)
    {
        id: 'puncture',
        service_type: 'puncture',
        title: "Puncture Booking",
        subtitle: "Get back on the road, hassle-free.",
        description: "Get back on the road, hassle-free. Fast on-demand roadside puncture assistance, tire repair, air filling, and doorstep mobile mechanic support.",
        prize_offer: "🔧 24/7 ON-ROAD ASSISTANCE • DOORSTEP SERVICE",
        resolvedImage: imgPuncture,
        theme_color: "#10b981",
        gradient_bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        accent_glow: "rgba(16, 185, 129, 0.4)",
        cta_text: "Book Puncture",
        checklist: [
            "On-Road Assistance",
            "Quick Service",
            "Trained Professionals"
        ],
        stats: [
            { label: "ON-ROAD ASSISTANCE", icon: ShieldCheck },
            { label: "QUICK SERVICE", icon: Zap }
        ]
    },
    // 4. Ultimate Men's Style Sale (Old Slide 1)
    {
        id: 'men-style',
        service_type: 'retail',
        title: "Ultimate Men's Style Sale",
        subtitle: "Exclusive deals on premium fashion & accessories.",
        description: "From playful fashion to luxury menswear, explore everything you desire. Enjoy huge savings on top brands and make every moment special.",
        prize_offer: "✨ FLAT 70% OFF + EXCLUSIVE DEALS ON PREMIUM BRANDS",
        resolvedImage: imgMen,
        theme_color: "#fbbf24",
        gradient_bg: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        accent_glow: "rgba(251, 191, 36, 0.35)",
        cta_text: "Shop Now",
        stats: [
            { label: "SHIPS INSTANTLY", icon: Zap },
            { label: "ELITE GRADE", icon: Star }
        ]
    },
    // 5. Kids Mega Sale Festival (Old Slide 2)
    {
        id: 'kids-sale',
        service_type: 'retail',
        title: "Kids Mega Sale Festival",
        subtitle: "Playful fashion, adorable toys & creative learning.",
        description: "From playful fashion to adorable toys, explore everything your kids love. Enjoy huge savings on top brands and make every moment special.",
        prize_offer: "🎁 FLAT 70% OFF + FREE GIFTS FOR KIDS",
        resolvedImage: imgBig,
        theme_color: "#38bdf8",
        gradient_bg: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
        accent_glow: "rgba(56, 189, 248, 0.35)",
        cta_text: "Shop Now",
        stats: [
            { label: "FREE GIFTS", icon: Sparkles },
            { label: "VERIFIED QUALITY", icon: ShieldCheck }
        ]
    },
    // 6. Organic & Fresh (Old Slide 3)
    {
        id: 'organic-fresh',
        service_type: 'retail',
        title: "Organic & Fresh",
        subtitle: "Farm-to-table fresh fruits & daily groceries.",
        description: "Shop the best quality vegetables and fruits directly from farmers at unbeatable prices with 100% farm-fresh guarantee.",
        prize_offer: "🌿 20% OFF • 100% FARM-FRESH ORGANIC",
        resolvedImage: imgBanner,
        theme_color: "#4ade80",
        gradient_bg: "linear-gradient(135deg, #4ade80 0%, #16a34a 100%)",
        accent_glow: "rgba(74, 222, 128, 0.35)",
        cta_text: "Shop Now",
        stats: [
            { label: "100% ORGANIC", icon: ShieldCheck },
            { label: "FARM DIRECT", icon: Zap }
        ]
    }
];

const HeroBanner = () => {
    const [banners, setBanners] = useState(ALL_DEFAULT_BANNERS);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [bookingModal, setBookingModal] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [pickupLocation, setPickupLocation] = useState("");
    const [contactPhone, setContactPhone] = useState("");

    // Load extra backend banners if available while preserving the full roster
    useEffect(() => {
        const loadRemote = async () => {
            try {
                const data = await fetchBanners();
                const rawList = Array.isArray(data) ? data : (data?.results || []);
                if (rawList.length > 0) {
                    const activeOnes = rawList.filter(b => b.is_active === true || b.active === true);
                    const results = activeOnes.length > 0 ? activeOnes : rawList;

                    // Map any backend banners not already in our roster
                    const remoteMapped = results.map(b => {
                        const rawImage = b.image || b.image_url || b.banner_image || b.img;
                        const filename = (rawImage || '').split('/').pop();
                        const resolvedImage = LOCAL_FALLBACK_IMAGES[filename] || getImageUrl(rawImage);
                        return {
                            id: `remote-${b.id}`,
                            service_type: 'retail',
                            title: b.title,
                            description: b.description || "Unlocking the next dimension of luxury retail. Experience high-fidelity discovery.",
                            prize_offer: b.prize_offer || "✨ EXCLUSIVE DEAL",
                            resolvedImage,
                            theme_color: "#fbbf24",
                            gradient_bg: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                            accent_glow: "rgba(251, 191, 36, 0.35)",
                            cta_text: "Shop Now",
                            stats: [
                                { label: "SHIPS INSTANTLY", icon: Zap },
                                { label: "ELITE GRADE", icon: Star }
                            ]
                        };
                    });

                    // Keep our 3 Kuiky services at front, followed by local old slides and any extra remote ones
                    const existingTitles = new Set(ALL_DEFAULT_BANNERS.map(s => s.title.toLowerCase()));
                    const newExtras = remoteMapped.filter(r => !existingTitles.has(r.title.toLowerCase()));
                    setBanners([...ALL_DEFAULT_BANNERS, ...newExtras]);
                }
            } catch (err) {
                console.warn("Could not fetch remote banners, using complete local roster:", err);
            }
        };
        loadRemote();
    }, []);

    // Auto rotate every .8 seconds (Snappier, faster transitions)
    useEffect(() => {
        if (banners.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % banners.length);
            }, 3800);
            return () => clearInterval(timer);
        }
    }, [banners, currentIndex]);

    const currentSlide = banners[currentIndex] || banners[0];

    const handleActionClick = (slide, isSecondary = false) => {
        // If it's a retail slide, smooth scroll to product collection
        if (slide.service_type === 'retail' || slide.cta_text === 'Shop Now') {
            const productsElement = document.getElementById('products-section');
            if (productsElement) {
                productsElement.scrollIntoView({ behavior: 'smooth' });
            }
            return;
        }

        // Direct phone call for ambulance / emergency or any slide with cta_tel
        if (slide.service_type === 'ambulance' || slide.cta_tel || isSecondary) {
            const telNumber = slide.cta_tel
                ? (slide.cta_tel.startsWith('tel:') ? slide.cta_tel : `tel:${slide.cta_tel}`)
                : 'tel:108';
            window.location.href = telNumber;
            return;
        }

        // Open quick booking modal
        setBookingModal(slide);
        setBookingSuccess(false);
        setPickupLocation("");
        setContactPhone("");
    };

    const handleConfirmBooking = (e) => {
        e.preventDefault();
        setBookingSuccess(true);
        setTimeout(() => {
            setBookingModal(null);
            setBookingSuccess(false);
        }, 2200);
    };

    if (!banners.length) return null;

    return (
        <div className="hb-prime-wrapper">
            <div className="hb-stage-luxe">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="hb-active-vanguard"
                    >
                        <div className="hb-vanguard-inner">
                            {/* Dynamic blurred backdrop */}
                            <BannerBackdrop url={currentSlide.resolvedImage} />

                            <div className="hb-vanguard-content">
                                <div className="hb-text-vanguard">
                                    {/* 1. Promo Pill */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.25, delay: 0.05 }}
                                        className="hb-promo-pill"
                                        style={{
                                            background: currentSlide.gradient_bg,
                                            boxShadow: `0 0 20px ${currentSlide.accent_glow}`
                                        }}
                                    >
                                        <Sparkles size={13} color="#fff" />
                                        <span style={{ color: '#fff' }}>{currentSlide.prize_offer}</span>
                                    </motion.div>

                                    {/* 2. Main Title */}
                                    <motion.h1
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                        className="hb-headline-vanguard"
                                    >
                                        {currentSlide.title}
                                    </motion.h1>

                                    {/* 3. Description */}
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.15 }}
                                        className="hb-summary-vanguard"
                                    >
                                        {currentSlide.description}
                                    </motion.p>

                                    {/* 4. Service Checklist (For Kuiky Service Slides) */}
                                    {currentSlide.checklist && currentSlide.checklist.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, delay: 0.2 }}
                                            className="hb-features-checklist"
                                        >
                                            {currentSlide.checklist.map((item, idx) => (
                                                <div key={idx} className="hb-check-item">
                                                    <span className="hb-check-circle">
                                                        <Check size={12} strokeWidth={3} color="#fff" />
                                                    </span>
                                                    <span className="hb-check-text">{item}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* 5. Vanguard Action Hub */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25, delay: 0.25 }}
                                        className="hb-vanguard-actions"
                                    >
                                        <button
                                            className="hb-btn-discovery"
                                            style={{
                                                background: currentSlide.gradient_bg,
                                                boxShadow: `0 12px 35px ${currentSlide.accent_glow}`
                                            }}
                                            onClick={() => handleActionClick(currentSlide, false)}
                                        >
                                            {currentSlide.service_type === 'retail' && <ShoppingCart size={18} />}
                                            {(currentSlide.service_type === 'ambulance' || currentSlide.cta_tel) && <PhoneCall size={18} />}
                                            <span>{currentSlide.cta_text}</span>
                                            {currentSlide.service_type !== 'ambulance' && !currentSlide.cta_tel && (
                                                <ArrowRight size={18} className="hb-arrow-discovery" />
                                            )}
                                        </button>

                                        {currentSlide.cta_secondary && (
                                            <button
                                                className="hb-btn-sos-call"
                                                onClick={() => handleActionClick(currentSlide, true)}
                                            >
                                                <PhoneCall size={18} />
                                                <span>{currentSlide.cta_secondary}</span>
                                            </button>
                                        )}

                                        <div className="hb-vanguard-stats">
                                            {currentSlide.stats?.map((st, i) => {
                                                const IconComp = st.icon;
                                                return (
                                                    <div key={i} className="stat-node">
                                                        <IconComp size={13} style={{ color: currentSlide.theme_color }} />
                                                        <span>{st.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* 6. Luxury Visual Area */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.35, delay: 0.05 }}
                                    className="hb-visual-vanguard"
                                >
                                    <div
                                        className="hb-image-hub-luxe"
                                        style={{
                                            boxShadow: `0 25px 60px rgba(0, 0, 0, 0.6), 0 0 50px ${currentSlide.accent_glow}`,
                                            borderColor: `${currentSlide.theme_color}44`
                                        }}
                                    >
                                        <img
                                            src={currentSlide.resolvedImage}
                                            alt={currentSlide.title}
                                            className="hb-product-img"
                                        />
                                    </div>
                                    <div
                                        className="vanguard-orb"
                                        style={{
                                            background: `radial-gradient(circle, ${currentSlide.accent_glow} 0%, transparent 68%)`
                                        }}
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* PREVIOUS / NEXT SLIDER ARROWS */}
                <button
                    className="hb-slider-arrow left"
                    onClick={() => setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length)}
                    aria-label="Previous slide"
                    title="Previous Slide"
                >
                    <ChevronLeft size={22} />
                </button>

                <button
                    className="hb-slider-arrow right"
                    onClick={() => setCurrentIndex(prev => (prev + 1) % banners.length)}
                    aria-label="Next slide"
                    title="Next Slide"
                >
                    <ChevronRight size={22} />
                </button>
            </div>

            {/* Quick Interactive Booking / SOS Modal */}
            <AnimatePresence>
                {bookingModal && (
                    <div className="hb-modal-overlay">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hb-modal-backdrop"
                            onClick={() => setBookingModal(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="hb-booking-modal"
                            style={{ borderColor: bookingModal.theme_color }}
                        >
                            <button className="hb-modal-close" onClick={() => setBookingModal(null)}>
                                <X size={20} />
                            </button>

                            {bookingSuccess ? (
                                <div className="hb-booking-success">
                                    <div className="hb-success-icon" style={{ background: bookingModal.theme_color }}>
                                        <CheckCircle2 size={44} color="#fff" />
                                    </div>
                                    <h3>Request Dispatched!</h3>
                                    <p>Our nearest {bookingModal.title.toLowerCase()} unit is en route to your location.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleConfirmBooking} className="hb-booking-form">
                                    <div className="hb-modal-header">
                                        <div className="hb-modal-badge" style={{ background: bookingModal.theme_color }}>
                                            {bookingModal.prize_offer.split('•')[0]}
                                        </div>
                                        <h2>{bookingModal.title}</h2>
                                        <p>{bookingModal.subtitle}</p>
                                    </div>

                                    <div className="hb-form-group">
                                        <label>
                                            {bookingModal.service_type === 'auto' || bookingModal.title?.toLowerCase().includes('auto')
                                                ? 'Pickup Location'
                                                : 'Service Location'}
                                        </label>
                                        <LocationSearchInput
                                            value={pickupLocation}
                                            onChange={setPickupLocation}
                                            placeholder={
                                                bookingModal.service_type === 'auto' || bookingModal.title?.toLowerCase().includes('auto')
                                                    ? 'Search pickup location on map...'
                                                    : 'Enter service address or landmark...'
                                            }
                                            themeColor={bookingModal.theme_color}
                                            required
                                        />
                                    </div>

                                    <div className="hb-form-group">
                                        <label>Contact Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="+91 98765 43210"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                        />
                                    </div>

                                    {bookingModal.checklist && (
                                        <div className="hb-modal-features">
                                            {bookingModal.checklist.map((c, i) => (
                                                <span key={i} className="hb-modal-feat-pill">
                                                    <Check size={12} color={bookingModal.theme_color} /> {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="hb-modal-submit-btn"
                                        style={{ background: bookingModal.gradient_bg }}
                                    >
                                        Confirm & Request {bookingModal.title}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

/** Blurred background backdrop */
const BannerBackdrop = ({ url }) => {
    return (
        <div className="hb-backdrop-engine">
            <div className="hb-backdrop-img" style={{ backgroundImage: url ? `url(${url})` : 'none' }} />
            <div className="hb-backdrop-overlay" />
        </div>
    );
};

export default HeroBanner;