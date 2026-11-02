import React, { useState, useEffect, useRef } from 'react';
import { MapPin, LocateFixed, Loader2, X, Search } from 'lucide-react';

const formatPhotonFeature = (feature) => {
    const p = feature.properties || {};
    const name = p.name || p.street || p.locality || p.city || 'Selected Place';
    const secondaryParts = [
        p.street,
        p.district || p.suburb,
        p.city || p.locality,
        p.state,
        p.country
    ].filter(Boolean);

    // Filter out duplicates and parts identical to primary name
    const uniqueSecondary = Array.from(
        new Set(secondaryParts.filter(part => part.toLowerCase() !== name.toLowerCase()))
    );
    const secondary = uniqueSecondary.join(', ');
    const fullAddress = secondary ? `${name}, ${secondary}` : name;

    return {
        id: p.osm_id || `${name}-${Math.random()}`,
        name,
        secondary,
        fullAddress,
        lat: feature.geometry?.coordinates?.[1],
        lon: feature.geometry?.coordinates?.[0]
    };
};

const LocationSearchInput = ({
    value,
    onChange,
    placeholder = 'Search pickup location on map...',
    themeColor = '#f59e0b',
    required = false
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [locationNotice, setLocationNotice] = useState('');

    const containerRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search query with debounce when user types
    const handleInputChange = (e) => {
        const text = e.target.value;
        onChange(text);
        setActiveIndex(-1);
        setLocationNotice('');

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (!text || text.trim().length < 2) {
            setSuggestions([]);
            setIsLoading(false);
            setIsOpen(true);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);

        debounceTimerRef.current = setTimeout(async () => {
            try {
                const query = text.trim();
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    const features = data?.features || [];
                    const formatted = features.map(formatPhotonFeature);
                    setSuggestions(formatted);
                } else {
                    setSuggestions([]);
                }
            } catch (err) {
                console.warn('Location search error:', err);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 280);
    };

    const handleSelectLocation = (loc) => {
        onChange(loc.fullAddress);
        setSuggestions([]);
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const handleClear = () => {
        onChange('');
        setSuggestions([]);
        setIsOpen(false);
        setActiveIndex(-1);
    };

    // Use Device Geolocation (GPS) like Google Maps
    const handleDetectCurrentLocation = async () => {
        if (!navigator.geolocation) {
            setLocationNotice('GPS Geolocation is not supported on your browser.');
            return;
        }

        setIsLocating(true);
        setLocationNotice('');
        setIsOpen(false);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    // Reverse geocode with BigDataCloud
                    const res = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    );
                    if (res.ok) {
                        const data = await res.json();
                        const parts = [
                            data.locality || data.localityInfo?.administrative?.[3]?.name,
                            data.city,
                            data.principalSubdivision,
                            data.countryName || 'India'
                        ].filter(Boolean);
                        const uniqueParts = Array.from(new Set(parts));
                        const detectedAddr = uniqueParts.join(', ') || `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                        onChange(detectedAddr);
                    } else {
                        onChange(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
                    }
                } catch (e) {
                    console.warn('Reverse geocode error:', e);
                    onChange(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                console.warn('Geolocation error:', err);
                setIsLocating(false);
                setLocationNotice('Could not access GPS. Please type your location.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
    };

    // Keyboard navigation (Arrow keys + Enter + Escape)
    const handleKeyDown = (e) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                e.preventDefault();
                handleSelectLocation(suggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="hb-gmap-search-container" ref={containerRef}>
            <div className="hb-gmap-input-wrapper">
                <span className="hb-gmap-lead-icon" style={{ color: themeColor }}>
                    <MapPin size={18} />
                </span>

                <input
                    type="text"
                    required={required}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="hb-gmap-input"
                    autoComplete="off"
                />

                <div className="hb-gmap-trailing-actions">
                    {isLoading && (
                        <span className="hb-gmap-spinner-wrap" title="Searching Google Maps places...">
                            <Loader2 size={16} className="hb-spin" style={{ color: themeColor }} />
                        </span>
                    )}

                    {value && !isLoading && (
                        <button
                            type="button"
                            className="hb-gmap-clear-btn"
                            onClick={handleClear}
                            title="Clear address"
                        >
                            <X size={15} />
                        </button>
                    )}

                    <button
                        type="button"
                        className={`hb-gmap-gps-btn ${isLocating ? 'locating' : ''}`}
                        onClick={handleDetectCurrentLocation}
                        title="Use Current Location (GPS)"
                    >
                        {isLocating ? (
                            <Loader2 size={16} className="hb-spin" />
                        ) : (
                            <LocateFixed size={16} />
                        )}
                    </button>
                </div>
            </div>

            {locationNotice && (
                <div className="hb-gmap-notice-msg">{locationNotice}</div>
            )}

            {/* Google Maps Style Autocomplete Dropdown */}
            {isOpen && (
                <div className="hb-gmap-dropdown">
                    {/* GPS detect quick option */}
                    <div
                        className="hb-gmap-item hb-gmap-gps-row"
                        onClick={handleDetectCurrentLocation}
                    >
                        <div className="hb-gmap-pin-circle gps-circle">
                            {isLocating ? (
                                <Loader2 size={15} className="hb-spin" />
                            ) : (
                                <LocateFixed size={15} />
                            )}
                        </div>
                        <div className="hb-gmap-item-content">
                            <span className="hb-gmap-item-title">Your current location</span>
                            <span className="hb-gmap-item-sub">
                                {isLocating ? 'Detecting via GPS coordinates...' : 'Tap to auto-detect using GPS'}
                            </span>
                        </div>
                    </div>

                    {/* Suggestions list */}
                    {suggestions.length > 0 && (
                        <div className="hb-gmap-results-list">
                            {suggestions.map((loc, idx) => (
                                <div
                                    key={loc.id || idx}
                                    className={`hb-gmap-item ${activeIndex === idx ? 'active' : ''}`}
                                    onClick={() => handleSelectLocation(loc)}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                >
                                    <div
                                        className="hb-gmap-pin-circle"
                                        style={{ color: themeColor, borderColor: `${themeColor}44` }}
                                    >
                                        <MapPin size={15} />
                                    </div>
                                    <div className="hb-gmap-item-content">
                                        <span className="hb-gmap-item-title">{loc.name}</span>
                                        {loc.secondary && (
                                            <span className="hb-gmap-item-sub">{loc.secondary}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Status indicator when typing */}
                    {isLoading && suggestions.length === 0 && (
                        <div className="hb-gmap-empty-state">
                            <Loader2 size={15} className="hb-spin" style={{ color: themeColor }} />
                            <span>Searching nearby locations...</span>
                        </div>
                    )}

                    {!isLoading && suggestions.length === 0 && value && value.trim().length >= 2 && (
                        <div className="hb-gmap-empty-state">
                            <Search size={15} style={{ opacity: 0.5 }} />
                            <span>No matching places found. Try entering area or street name.</span>
                        </div>
                    )}

                    <div className="hb-gmap-footer-badge">
                        <span>Google Maps Search</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationSearchInput;
