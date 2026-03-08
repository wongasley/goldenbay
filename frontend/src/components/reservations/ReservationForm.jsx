import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import axios from 'axios';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const ReservationForm = ({ 
    selectedRoom, 
    date, 
    session, 
    selectedTime, 
    isManualEntry = false, 
    onSuccess, 
    onCancel 
}) => {
    const { executeRecaptcha } = useGoogleReCaptcha();

    // Added separate care_of state to match the Phone Book
    const [formData, setFormData] = useState({
        name: '', phone: '', care_of: '', email: '', pax: 2, message: ''
    });
    
    const [manualDate, setManualDate] = useState(date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    const [manualSession, setManualSession] = useState(session || 'LUNCH');
    const [manualTime, setManualTime] = useState(selectedTime || '');
    const [rooms, setRooms] = useState([]); 
    const [manualRoomId, setManualRoomId] = useState(''); 
    const [manualSource, setManualSource] = useState('PHONE'); 
    const [submitStatus, setSubmitStatus] = useState(null);

    useEffect(() => {
        setManualTime('');
    }, [manualDate, manualSession]);

    const generateTimeSlots = (sessionType, selectedDateStr) => {
        const slots = [];
        const startHour = sessionType === 'LUNCH' ? 11 : 17; 
        const endHour = sessionType === 'LUNCH' ? 14 : 22;      

        const now = new Date();
        const [year, month, day] = selectedDateStr.split('-').map(Number);
        const isToday = 
            year === now.getFullYear() &&
            (month - 1) === now.getMonth() &&
            day === now.getDate();

        for (let hour = startHour; hour <= endHour; hour++) {
            const displayHour = hour > 12 ? hour - 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            
            const blockZero = !isManualEntry && isToday && hour <= now.getHours();
            if (!blockZero) {
                slots.push({ value: `${hour}:00:00`, label: `${displayHour}:00 ${ampm}` });
            }
            
            if (hour !== endHour) {
                const blockThirty = !isManualEntry && isToday && (hour < now.getHours() || (hour === now.getHours() && now.getMinutes() >= 30));
                if (!blockThirty) {
                    slots.push({ value: `${hour}:30:00`, label: `${displayHour}:30 ${ampm}` });
                }
            }
        }
        return slots;
    };

    const availableTimeSlots = generateTimeSlots(manualSession, manualDate);

    useEffect(() => {
        if (isManualEntry) {
            const fetchRooms = async () => {
                try {
                    const res = await axios.get(`${BACKEND_URL}/api/reservations/check/?date=${manualDate}&session=${manualSession}`);
                    setRooms(res.data);
                } catch (err) {
                    console.error("Failed to load rooms", err);
                }
            };
            fetchRooms();
            setManualTime(''); 
            setManualRoomId('');
        }
    }, [isManualEntry, manualDate, manualSession]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.pax) {
            toast.error("Please fill in Name and Guests.");
            return;
        }

        let finalContact = "";
        let finalMessage = formData.message ? formData.message.trim() : "";

        if (!isManualEntry) {
            // STRICT VALIDATION FOR PUBLIC WEBSITE
            if (!formData.phone) {
                toast.error("Please provide a contact number.");
                return;
            }
            finalContact = formData.phone.replace(/[\s-]/g, '');
            if (!/^\+?\d+$/.test(finalContact)) {
                toast.error("Please enter a valid contact number (digits only).");
                return; 
            }
        } else {
            // RELAXED VALIDATION FOR ADMINS
            if (!formData.phone && !formData.care_of) {
                toast.error("Please provide either a Phone Number OR a Care Of handler.");
                return;
            }
            
            // If they provided a phone, use it. If no phone, pass the care_of string to the backend.
            if (formData.phone) {
                finalContact = formData.phone.replace(/[\s-]/g, '');
                // If they provided BOTH, we append the handler to the notes so it isn't lost
                if (formData.care_of) {
                    finalMessage = `[Handler: ${formData.care_of.trim()}]\n` + finalMessage;
                }
            } else {
                finalContact = formData.care_of.trim();
            }
        }

        const finalRoomId = isManualEntry ? manualRoomId : selectedRoom;
        if (!finalRoomId) {
            toast.error("Please select a Room or Dining Area.");
            return;
        }

        const finalTime = isManualEntry ? manualTime : selectedTime;
        if (!finalTime) {
            toast.error("Please select an arrival time.");
            return;
        }

        setSubmitStatus('loading');

        let token = null;
        // Only run CAPTCHA if it's a customer booking from the web
        if (!isManualEntry) {
            if (!executeRecaptcha) {
                toast.error("Security verification not ready. Please wait a moment.");
                setSubmitStatus('error');
                return;
            }
            token = await executeRecaptcha('reservation_submit');

            console.log("GOOGLE RECAPTCHA TOKEN:", token);
        }

        const payload = {
            customer_name: formData.name.trim(),
            customer_contact: finalContact,
            customer_email: formData.email ? formData.email.trim() : null,
            date: isManualEntry ? manualDate : format(date, 'yyyy-MM-dd'),
            session: isManualEntry ? manualSession : session,
            time: finalTime,
            pax: parseInt(formData.pax, 10) || 1, 
            dining_area: parseInt(finalRoomId, 10),
            special_request: finalMessage,
            status: isManualEntry ? 'CONFIRMED' : 'PENDING',
            source: isManualEntry ? manualSource : 'WEB',
            captcha_token: token
        };

        try {
            if (isManualEntry) {
                await axiosInstance.post('/api/reservations/create/', payload);
            } else {
                await axios.post(`${BACKEND_URL}/api/reservations/create/`, payload);
            }

            setSubmitStatus('success');
            
            const audio = new Audio('/audio/success.mp3');
            audio.play().catch(err => console.warn("Audio blocked by browser:", err));

            if (onSuccess) onSuccess();
            
        } catch (error) {
            let errorMessage = "Booking failed.";
            if (error.response && error.response.data) {
                const errData = error.response.data;
                if (errData.non_field_errors) {
                    errorMessage = errData.non_field_errors[0];
                } else if (errData.detail) {
                    errorMessage = errData.error ? `${errData.detail}: ${errData.error}` : errData.detail;
                } else {
                    const firstKey = Object.keys(errData)[0];
                    const firstError = errData[firstKey];
                    errorMessage = `${firstKey.toUpperCase()}: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
                }
            }
            toast.error(errorMessage);
            setSubmitStatus('error');
        }
    };

    const inputClass = "w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none rounded-sm transition-all shadow-sm";
    const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1";

    return (
        <form onSubmit={handleSubmit} className="text-left">
            
            {/* --- ADMIN ONLY: LOGISTICS --- */}
            {isManualEntry && (
                <div className="bg-gray-50 p-5 rounded-md border border-gray-200 mb-6">
                    <h3 className="text-gold-600 text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">
                        Logistics
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={labelClass}>Date</label>
                            <input 
                                type="date" required
                                className={inputClass}
                                value={manualDate}
                                onChange={e => setManualDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Session</label>
                            <div className="flex rounded-sm overflow-hidden border border-gray-300">
                                <button
                                    type="button"
                                    onClick={() => setManualSession('LUNCH')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase ${manualSession === 'LUNCH' ? 'bg-gold-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Lunch
                                </button>
                                <div className="w-[1px] bg-gray-300"></div>
                                <button
                                    type="button"
                                    onClick={() => setManualSession('DINNER')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase ${manualSession === 'DINNER' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Dinner
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={labelClass}>Arrival Time</label>
                            <select 
                                required
                                className={inputClass}
                                value={manualTime}
                                onChange={e => setManualTime(e.target.value)}
                            >
                                <option value="" disabled>-- Select Time --</option>
                                {availableTimeSlots.length === 0 ? (
                                    <option value="" disabled>No times available for today</option>
                                ) : (
                                    availableTimeSlots.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)
                                )}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Assign Table / Room</label>
                            <select 
                                required
                                className={inputClass}
                                value={manualRoomId}
                                onChange={e => setManualRoomId(e.target.value)}
                            >
                                <option value="" disabled>-- Select Area --</option>
                                {rooms.map(room => {
                                    let label = `${room.name}`;
                                    let isDisabled = !room.is_available;

                                    if (room.area_type === 'HALL') {
                                        label += ` (Hall: ${room.remaining_capacity} seats)`;
                                    } else if (!room.is_available) {
                                        label += " [BOOKED]";
                                    } else {
                                        label += " (VIP)";
                                    }

                                    return (
                                        <option key={room.id} value={room.id} disabled={isDisabled} className={isDisabled ? 'text-gray-300' : 'text-gray-900'}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Booking Source</label>
                        <select 
                            className={inputClass}
                            value={manualSource}
                            onChange={e => setManualSource(e.target.value)}
                        >
                            <option value="PHONE">Phone Call / Mobile</option>
                            <option value="SOCIAL">Social Media (Viber/WeChat/FB)</option>
                            <option value="WALK_IN">Walk-in</option>
                        </select>
                    </div>

                </div>
            )}

            {/* --- CUSTOMER DETAILS --- */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Customer Name <span className="text-red-500">*</span></label>
                        <input required type="text" className={inputClass} 
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    
                    {!isManualEntry ? (
                        // PUBLIC VIEW
                        <div>
                            <label className={labelClass}>Contact No. <span className="text-red-500">*</span></label>
                            <input required type="text" className={inputClass} 
                                placeholder="e.g. 0917..."
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    ) : (
                        // ADMIN VIEW: Care Of Field
                        <div>
                            <label className={labelClass}>Care Of / Handler</label>
                            <input type="text" className={inputClass} 
                                placeholder="e.g. C/O Evelyn"
                                value={formData.care_of}
                                onChange={e => setFormData({...formData, care_of: e.target.value})} />
                        </div>
                    )}
                </div>

                {isManualEntry && (
                    // ADMIN VIEW: Phone and Email side by side
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Phone Number</label>
                            <input type="text" className={inputClass} 
                                placeholder="e.g. 0917 123 4567"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Email (Optional)</label>
                            <input type="email" className={inputClass} 
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                    </div>
                )}

                {!isManualEntry && (
                    // PUBLIC VIEW: Email and Pax side by side
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Email (Optional)</label>
                            <input type="email" className={inputClass} 
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Pax <span className="text-red-500">*</span></label>
                            <input required type="number" min="1" className={inputClass} 
                                value={formData.pax}
                                onChange={e => setFormData({...formData, pax: e.target.value})} />
                        </div>
                    </div>
                )}

                {isManualEntry && (
                    // ADMIN VIEW: Just Pax alone on a row
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Pax <span className="text-red-500">*</span></label>
                            <input required type="number" min="1" className={inputClass} 
                                value={formData.pax}
                                onChange={e => setFormData({...formData, pax: e.target.value})} />
                        </div>
                    </div>
                )}

                <div>
                    <label className={labelClass}>Special Request / Notes</label>
                    <textarea className={`${inputClass} h-20 resize-none`} 
                        placeholder="Allergies, special occasion, high chair..."
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                </div>
            </div>

            {/* --- ACTIONS --- */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="flex-1 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs font-bold rounded-sm border border-transparent">
                        Cancel
                    </button>
                )}
                <button type="submit" disabled={submitStatus === 'loading'} 
                    className="flex-1 bg-gold-600 text-white font-bold uppercase tracking-widest py-3 text-xs hover:bg-gold-700 transition-colors disabled:opacity-50 rounded-sm shadow-md">
                    {submitStatus === 'loading' ? 'Saving...' : (isManualEntry ? 'Create Booking' : 'Request Reservation')}
                </button>
            </div>
        </form>
    );
};

export default ReservationForm;